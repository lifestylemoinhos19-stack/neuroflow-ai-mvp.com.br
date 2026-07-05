import { useState, useEffect, useRef, useCallback } from 'react'
import { logCameraError } from '@/lib/camera-error-logger'

export type CameraCaptureMode = 'rppg' | 'ppg'

const MODE_STORAGE_KEY = 'neuroflow_camera_mode'
const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000]

function getStoredMode(): CameraCaptureMode {
  try {
    const stored = sessionStorage.getItem(MODE_STORAGE_KEY)
    if (stored === 'rppg' || stored === 'ppg') return stored
  } catch {
    /* sessionStorage may be unavailable */
  }
  return 'rppg'
}

function storeMode(mode: CameraCaptureMode): void {
  try {
    sessionStorage.setItem(MODE_STORAGE_KEY, mode)
  } catch {
    /* sessionStorage may be unavailable */
  }
}

function getCameraErrorMessage(err: any): string {
  if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
    return 'Permissão de câmera negada. Habilite o acesso nas configurações do navegador.'
  }
  if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') {
    return 'Nenhuma câmera compatível encontrada no dispositivo.'
  }
  if (err?.name === 'NotReadableError') {
    return 'Câmera em uso por outro aplicativo. Feche outros apps que usam a câmera.'
  }
  return err?.message || 'Erro ao acessar câmera.'
}

function shouldRetry(err: any): boolean {
  return err?.name !== 'NotAllowedError' && err?.name !== 'SecurityError'
}

export function useRppg() {
  const [bpm, setBpm] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [captureMode, setCaptureModeState] = useState<CameraCaptureMode>(getStoredMode)
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [autoRetrying, setAutoRetrying] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const signalRef = useRef<{ value: number; time: number }[]>([])
  const lastUpdateRef = useRef(0)
  const modeRef = useRef<CameraCaptureMode>(getStoredMode())
  const flashRef = useRef(false)
  const trackRef = useRef<MediaStreamTrack | null>(null)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)
  const connectionIdRef = useRef(0)
  const retryCountRef = useRef(0)

  const isSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  const disconnect = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current = null
    }
    canvasRef.current = null
    trackRef.current = null
    setIsConnected(false)
    setBpm(null)
    setAutoRetrying(false)
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

    const channelOffset = modeRef.current === 'ppg' ? 0 : 1
    let sum = 0
    let count = 0
    for (let i = 0; i < data.length; i += 4) {
      sum += data[i + channelOffset]
      count++
    }
    const avg = sum / count
    const now = performance.now()

    signalRef.current.push({ value: avg, time: now })
    const cutoff = now - 6000
    while (signalRef.current.length > 0 && signalRef.current[0].time < cutoff) {
      signalRef.current.shift()
    }

    if (now - lastUpdateRef.current > 1000 && signalRef.current.length > 40) {
      lastUpdateRef.current = now
      const signal = signalRef.current
      const n = signal.length
      const mean = signal.reduce((a, s) => a + s.value, 0) / n
      let peaks = 0
      for (let i = 2; i < n - 2; i++) {
        if (
          signal[i].value > signal[i - 1].value &&
          signal[i].value > signal[i + 1].value &&
          signal[i].value > signal[i - 2].value &&
          signal[i].value > signal[i + 2].value &&
          signal[i].value > mean
        ) {
          peaks++
        }
      }
      const timeSpan = (signal[n - 1].time - signal[0].time) / 1000
      if (timeSpan > 2) {
        const estimatedBpm = Math.round((peaks / timeSpan) * 60)
        if (estimatedBpm >= 40 && estimatedBpm <= 200) {
          setBpm(estimatedBpm)
        }
      }
    }

    rafRef.current = requestAnimationFrame(analyzeFrame)
  }, [])

  const applyFlash = useCallback(async (track: MediaStreamTrack, enabled: boolean) => {
    try {
      const caps = track.getCapabilities?.() as any
      if (caps?.torch) {
        await track.applyConstraints({ advanced: [{ torch: enabled } as any] })
      }
    } catch {
      /* torch not supported */
    }
  }, [])

  const connect = useCallback(async () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    const currentId = ++connectionIdRef.current
    retryCountRef.current = 0
    setAutoRetrying(false)

    const mode = modeRef.current

    const attemptConnect = async (attempt: number): Promise<void> => {
      if (!isMountedRef.current || connectionIdRef.current !== currentId) return

      if (!isSupported) {
        const msg = 'Câmera não suportada neste dispositivo.'
        setError(msg)
        await logCameraError({ message: msg, status: 'unsupported', mode })
        return
      }

      setIsConnecting(true)
      setError(null)
      let willRetry = false

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode === 'ppg' ? 'environment' : 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })

        if (!isMountedRef.current || connectionIdRef.current !== currentId) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream
        const track = stream.getVideoTracks()[0]
        trackRef.current = track

        if (mode === 'ppg' && flashRef.current) {
          await applyFlash(track, true)
        }

        const video = document.createElement('video')
        video.autoplay = true
        video.playsInline = true
        video.muted = true
        video.srcObject = stream
        videoRef.current = video
        await video.play()

        canvasRef.current = document.createElement('canvas')
        setIsConnected(true)
        setAutoRetrying(false)
        lastUpdateRef.current = 0
        signalRef.current = []
        rafRef.current = requestAnimationFrame(analyzeFrame)
      } catch (err: any) {
        if (!isMountedRef.current || connectionIdRef.current !== currentId) return

        const msg = getCameraErrorMessage(err)

        if (attempt < MAX_RETRIES && shouldRetry(err)) {
          willRetry = true
          setAutoRetrying(true)
          setError(`Tentando reconectar... (${attempt + 1}/${MAX_RETRIES})`)

          const delay = RETRY_DELAYS[attempt] || 4000
          retryTimeoutRef.current = setTimeout(() => {
            if (connectionIdRef.current === currentId) {
              attemptConnect(attempt + 1)
            }
          }, delay)
        } else {
          setError(msg)
          setAutoRetrying(false)
          await logCameraError({
            message: msg,
            status: err?.name || 'error',
            mode,
          })
        }
      } finally {
        if (isMountedRef.current && !willRetry) {
          setIsConnecting(false)
        }
      }
    }

    await attemptConnect(0)
  }, [isSupported, analyzeFrame, applyFlash])

  const retry = useCallback(async () => {
    await connect()
  }, [connect])

  const toggleFlash = useCallback(async () => {
    const next = !flashEnabled
    setFlashEnabled(next)
    flashRef.current = next
    if (trackRef.current) await applyFlash(trackRef.current, next)
  }, [flashEnabled, applyFlash])

  const changeMode = useCallback((mode: CameraCaptureMode) => {
    setCaptureModeState(mode)
    modeRef.current = mode
    storeMode(mode)
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
      disconnect()
    }
  }, [disconnect])

  return {
    bpm,
    isConnected,
    isConnecting,
    isSupported,
    connect,
    disconnect,
    error,
    captureMode,
    flashEnabled,
    toggleFlash,
    setCaptureMode: changeMode,
    retry,
    autoRetrying,
  }
}
