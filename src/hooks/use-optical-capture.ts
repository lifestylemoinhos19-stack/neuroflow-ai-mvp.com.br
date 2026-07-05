import { useState, useRef, useCallback, useEffect } from 'react'

export type CaptureMode = 'rppg' | 'ppg'
export type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied'
export type CapturePhase = 'intro' | 'camera_active' | 'measuring' | 'success' | 'error'
export type CameraStatus = 'idle' | 'active' | 'blocked' | 'in_use' | 'error' | 'unsupported'

const MEASURE_DURATION = 10
const QUALITY_THRESHOLD = 80
const STABILITY_FRAMES_REQUIRED = 15
const SIMULATION_TOTAL_FRAMES = 30

export interface QualityInfo {
  value: number
  label: string
  color: string
}

export function getQualityInfo(quality: number): QualityInfo {
  if (quality >= 80) return { value: quality, label: 'Sinal excelente', color: '#00FFFF' }
  if (quality >= 60) return { value: quality, label: 'Bom sinal', color: '#22D3EE' }
  if (quality >= 35) return { value: quality, label: 'Sinal instável', color: '#FBBF24' }
  return { value: quality, label: 'Sinal fraco', color: '#F87171' }
}

function getCameraError(err: any): { message: string; status: CameraStatus } {
  if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
    return {
      message: 'Permissão de câmera negada. Habilite o acesso nas configurações do navegador.',
      status: 'blocked',
    }
  }
  if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') {
    return { message: 'Nenhuma câmera compatível foi encontrada no dispositivo.', status: 'error' }
  }
  if (err?.name === 'NotReadableError') {
    return {
      message: 'Câmera em uso por outro aplicativo. Feche outros apps que usam a câmera.',
      status: 'in_use',
    }
  }
  return { message: err?.message || 'Erro ao acessar câmera.', status: 'error' }
}

export function useOpticalCapture(initialMode: CaptureMode = 'rppg') {
  const [mode, setMode] = useState<CaptureMode>(initialMode)
  const [permissionState, setPermissionState] = useState<PermissionState>('idle')
  const [phase, setPhase] = useState<CapturePhase>('intro')
  const [signalQuality, setSignalQuality] = useState(0)
  const [isStable, setIsStable] = useState(false)
  const [progress, setProgress] = useState(0)
  const [countdown, setCountdown] = useState(MEASURE_DURATION)
  const [bpm, setBpm] = useState<number | null>(null)
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle')
  const [cameraError, setCameraError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const signalRef = useRef<{ value: number; time: number }[]>([])
  const frameCountRef = useRef(0)
  const stabilityCountRef = useRef(0)
  const modeRef = useRef<CaptureMode>(initialMode)

  const isSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
  const qualityInfo = getQualityInfo(signalQuality)
  const canStartMeasurement = signalQuality >= QUALITY_THRESHOLD && isStable

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraStatus('idle')
  }, [])

  const resetState = useCallback(() => {
    setSignalQuality(0)
    setIsStable(false)
    setProgress(0)
    setCountdown(MEASURE_DURATION)
    setBpm(null)
    frameCountRef.current = 0
    stabilityCountRef.current = 0
    signalRef.current = []
  }, [])

  const analyzeFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(analyzeFrame)
      return
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      rafRef.current = requestAnimationFrame(analyzeFrame)
      return
    }
    canvas.width = 80
    canvas.height = 60
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    let rSum = 0,
      gSum = 0,
      bSum = 0,
      count = 0
    for (let i = 0; i < data.length; i += 4) {
      rSum += data[i]
      gSum += data[i + 1]
      bSum += data[i + 2]
      count++
    }
    const rAvg = rSum / count
    const gAvg = gSum / count
    const brightness = (rAvg + gSum / count + bSum / count) / 3
    frameCountRef.current += 1
    const frameProgress = Math.min(1, frameCountRef.current / SIMULATION_TOTAL_FRAMES)
    let quality = frameProgress * 100
    if (modeRef.current === 'ppg') {
      const redDominance = rAvg / Math.max(1, brightness)
      quality = quality * (0.7 + redDominance * 0.3)
    } else {
      quality = quality * (brightness > 30 && brightness < 220 ? 1 : 0.7)
    }
    quality = Math.max(0, Math.min(100, quality + (Math.random() * 8 - 4)))
    setSignalQuality(quality)
    if (quality >= QUALITY_THRESHOLD) {
      stabilityCountRef.current += 1
      if (stabilityCountRef.current >= STABILITY_FRAMES_REQUIRED) setIsStable(true)
    } else {
      stabilityCountRef.current = 0
      setIsStable(false)
    }
    const signalValue = modeRef.current === 'ppg' ? rAvg : gAvg
    signalRef.current.push({ value: signalValue, time: performance.now() })
    const cutoff = performance.now() - 6000
    while (signalRef.current.length > 0 && signalRef.current[0].time < cutoff)
      signalRef.current.shift()
    if (signalRef.current.length > 40) {
      const sig = signalRef.current
      const n = sig.length
      const mean = sig.reduce((a, s) => a + s.value, 0) / n
      let peaks = 0
      for (let i = 2; i < n - 2; i++) {
        if (
          sig[i].value > sig[i - 1].value &&
          sig[i].value > sig[i + 1].value &&
          sig[i].value > sig[i - 2].value &&
          sig[i].value > sig[i + 2].value &&
          sig[i].value > mean
        )
          peaks++
      }
      const span = (sig[n - 1].time - sig[0].time) / 1000
      if (span > 2) {
        const est = Math.round((peaks / span) * 60)
        if (est >= 40 && est <= 200) setBpm(est)
      }
    }
    rafRef.current = requestAnimationFrame(analyzeFrame)
  }, [])

  const requestCamera = useCallback(
    async (selectedMode: CaptureMode) => {
      setMode(selectedMode)
      modeRef.current = selectedMode
      if (!isSupported) {
        setCameraStatus('unsupported')
        setCameraError('Câmera não suportada neste dispositivo.')
        setPermissionState('denied')
        setPhase('error')
        return
      }
      setPermissionState('requesting')
      setPhase('camera_active')
      setCameraError(null)
      resetState()
      try {
        const facingMode = selectedMode === 'rppg' ? 'user' : { ideal: 'environment' as const }
        let stream: MediaStream
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          })
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false,
          })
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.setAttribute('playsinline', 'true')
          await videoRef.current.play()
        }
        setPermissionState('granted')
        setCameraStatus('active')
        setCameraError(null)
        rafRef.current = requestAnimationFrame(analyzeFrame)
      } catch (err: any) {
        const { message, status } = getCameraError(err)
        setCameraError(message)
        setCameraStatus(status)
        setPermissionState('denied')
        setPhase('error')
      }
    },
    [isSupported, analyzeFrame, resetState],
  )

  const changeMode = useCallback(
    (newMode: CaptureMode) => {
      if (newMode === modeRef.current) return
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      stopCamera()
      setMode(newMode)
      modeRef.current = newMode
      setPermissionState('idle')
      setCameraStatus('idle')
      setCameraError(null)
      resetState()
      setPhase('intro')
    },
    [stopCamera, resetState],
  )

  const startMeasurement = useCallback(() => {
    if (!canStartMeasurement) return
    setPhase('measuring')
    setProgress(0)
    setCountdown(MEASURE_DURATION)
    const startTime = Date.now()
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      const remaining = Math.max(0, MEASURE_DURATION - elapsed)
      setProgress(Math.min(100, (elapsed / MEASURE_DURATION) * 100))
      setCountdown(Math.ceil(remaining))
      if (remaining <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        setPhase('success')
        setProgress(100)
      }
    }, 100)
  }, [canStartMeasurement])

  const cancelMeasurement = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setProgress(0)
    setCountdown(MEASURE_DURATION)
    setPhase('camera_active')
  }, [])

  const retry = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    stopCamera()
    setPermissionState('idle')
    setCameraStatus('idle')
    setCameraError(null)
    resetState()
    setPhase('intro')
  }, [stopCamera, resetState])

  const resetAll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    stopCamera()
    setPermissionState('idle')
    setCameraStatus('idle')
    setCameraError(null)
    resetState()
    setPhase('intro')
  }, [stopCamera, resetState])

  useEffect(() => {
    if (phase === 'success' || phase === 'error' || phase === 'intro') {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [phase])

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      stopCamera()
    },
    [stopCamera],
  )

  return {
    mode,
    permissionState,
    phase,
    signalQuality,
    qualityInfo,
    isStable,
    canStartMeasurement,
    progress,
    countdown,
    bpm,
    cameraStatus,
    cameraError,
    isSupported,
    videoRef,
    canvasRef,
    requestCamera,
    startMeasurement,
    cancelMeasurement,
    changeMode,
    retry,
    resetAll,
    stopCamera,
  }
}
