import { useState, useRef, useCallback, useEffect } from 'react'

export type CaptureMode = 'rppg' | 'ppg'
export type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied'
export type CaptureState = 'idle' | 'capturing' | 'success'
export type CameraStatus = 'idle' | 'active' | 'blocked' | 'in_use' | 'error' | 'unsupported'

const CAPTURE_DURATION = 10

function getCameraError(err: any): { message: string; status: CameraStatus } {
  if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
    return {
      message: 'Permissão de câmera negada. Habilite o acesso nas configurações do navegador.',
      status: 'blocked',
    }
  }
  if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') {
    return { message: 'Nenhuma câmera encontrada no dispositivo.', status: 'error' }
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
  const [captureState, setCaptureState] = useState<CaptureState>('idle')
  const [progress, setProgress] = useState(0)
  const [countdown, setCountdown] = useState(CAPTURE_DURATION)
  const [bpm, setBpm] = useState<number | null>(null)
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle')
  const [cameraError, setCameraError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const signalRef = useRef<{ value: number; time: number }[]>([])

  const isSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraStatus('idle')
  }, [])

  const requestCamera = useCallback(
    async (selectedMode: CaptureMode) => {
      setMode(selectedMode)
      if (!isSupported) {
        setCameraStatus('unsupported')
        setCameraError('Câmera não suportada neste dispositivo.')
        setPermissionState('denied')
        return
      }
      setPermissionState('requesting')
      setCameraError(null)
      try {
        const facingMode = selectedMode === 'rppg' ? 'user' : { ideal: 'environment' as const }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 320 }, height: { ideal: 240 } },
          audio: false,
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.setAttribute('playsinline', 'true')
          await videoRef.current.play()
        }
        setPermissionState('granted')
        setCameraStatus('active')
        setCameraError(null)
      } catch (err: any) {
        const { message, status } = getCameraError(err)
        setCameraError(message)
        setCameraStatus(status)
        setPermissionState('denied')
      }
    },
    [isSupported],
  )

  const retryCamera = useCallback(async () => {
    stopCamera()
    setCameraStatus('idle')
    setCameraError(null)
    await requestCamera(mode)
  }, [mode, requestCamera, stopCamera])

  const cancelCapture = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setCaptureState('idle')
    setProgress(0)
    setCountdown(CAPTURE_DURATION)
    setBpm(null)
    signalRef.current = []
  }, [])

  const startCapture = useCallback(() => {
    setCaptureState('capturing')
    setProgress(0)
    setCountdown(CAPTURE_DURATION)
    setBpm(null)
    signalRef.current = []
    let elapsed = 0
    intervalRef.current = setInterval(() => {
      elapsed += 0.1
      setProgress(Math.min(100, (elapsed / CAPTURE_DURATION) * 100))
      setCountdown(Math.max(0, Math.ceil(CAPTURE_DURATION - elapsed)))
      const video = videoRef.current
      const canvas = canvasRef.current
      if (video && canvas && video.readyState >= 2) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (ctx) {
          canvas.width = 80
          canvas.height = 60
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
          const offset = mode === 'ppg' ? 0 : 1
          let sum = 0
          let count = 0
          for (let i = 0; i < data.length; i += 4) {
            sum += data[i + offset]
            count++
          }
          signalRef.current.push({ value: sum / count, time: performance.now() })
          const sig = signalRef.current
          if (sig.length > 10) {
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
        }
      }
      if (elapsed >= CAPTURE_DURATION) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        setCaptureState('success')
        setProgress(100)
        setCountdown(0)
      }
    }, 100)
  }, [mode])

  const resetAll = useCallback(() => {
    cancelCapture()
    stopCamera()
    setPermissionState('idle')
    setCaptureState('idle')
  }, [cancelCapture, stopCamera])

  const changeMode = useCallback(
    (newMode: CaptureMode) => {
      if (captureState === 'capturing') return
      cancelCapture()
      stopCamera()
      setMode(newMode)
      setPermissionState('idle')
      setCameraStatus('idle')
    },
    [captureState, cancelCapture, stopCamera],
  )

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      stopCamera()
    },
    [stopCamera],
  )

  return {
    mode,
    permissionState,
    captureState,
    progress,
    countdown,
    bpm,
    cameraStatus,
    cameraError,
    isSupported,
    videoRef,
    canvasRef,
    requestCamera,
    startCapture,
    cancelCapture,
    resetAll,
    changeMode,
    retryCamera,
    stopCamera,
  }
}
