import { useState, useEffect, useRef, useCallback } from 'react'

export type CameraCaptureMode = 'rppg' | 'ppg'

export function useRppg() {
  const [bpm, setBpm] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [captureMode, setCaptureMode] = useState<CameraCaptureMode>('rppg')
  const [flashEnabled, setFlashEnabled] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const signalRef = useRef<{ value: number; time: number }[]>([])
  const lastUpdateRef = useRef(0)
  const modeRef = useRef<CameraCaptureMode>('rppg')
  const flashRef = useRef(false)
  const trackRef = useRef<MediaStreamTrack | null>(null)

  const isSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  const disconnect = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
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
    setError(null)
    if (!isSupported) {
      setError('Câmera não suportada neste dispositivo.')
      return
    }
    setIsConnecting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: modeRef.current === 'ppg' ? 'environment' : 'user',
          width: 320,
          height: 240,
        },
        audio: false,
      })
      streamRef.current = stream
      const track = stream.getVideoTracks()[0]
      trackRef.current = track
      if (modeRef.current === 'ppg' && flashRef.current) await applyFlash(track, true)

      const video = document.createElement('video')
      video.autoplay = true
      video.playsInline = true
      video.muted = true
      video.srcObject = stream
      videoRef.current = video
      await video.play()

      canvasRef.current = document.createElement('canvas')
      setIsConnected(true)
      lastUpdateRef.current = 0
      signalRef.current = []
      rafRef.current = requestAnimationFrame(analyzeFrame)
    } catch (err: any) {
      if (err.name === 'NotAllowedError') setError('Permissão de câmera negada.')
      else if (err.name === 'NotFoundError') setError('Nenhuma câmera encontrada.')
      else setError(err.message || 'Erro ao acessar câmera.')
    } finally {
      setIsConnecting(false)
    }
  }, [isSupported, analyzeFrame, applyFlash])

  const toggleFlash = useCallback(async () => {
    const next = !flashEnabled
    setFlashEnabled(next)
    flashRef.current = next
    if (trackRef.current) await applyFlash(trackRef.current, next)
  }, [flashEnabled, applyFlash])

  const changeMode = useCallback((mode: CameraCaptureMode) => {
    setCaptureMode(mode)
    modeRef.current = mode
  }, [])

  useEffect(() => () => disconnect(), [disconnect])

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
  }
}
