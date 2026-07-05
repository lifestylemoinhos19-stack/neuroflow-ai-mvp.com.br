import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Camera, Check, AlertCircle, RefreshCw, FlaskConical, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GameController } from '@/lib/game-controller'
import { createVitalLensAdapter } from '@/lib/vitallens-adapter'

const CALIBRATION_DURATION = 10

interface Props {
  onComplete: (controller: GameController) => void
  onOpenFieldTest?: () => void
}

export function CameraOnboarding({ onComplete, onOpenFieldTest }: Props) {
  const [status, setStatus] = useState<'connecting' | 'ready' | 'calibrating' | 'done' | 'error'>(
    'connecting',
  )
  const [secondsLeft, setSecondsLeft] = useState(CALIBRATION_DURATION)
  const [progress, setProgress] = useState(0)
  const [bpm, setBpm] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const adapterRef = useRef(createVitalLensAdapter())
  const bpmRef = useRef<number | null>(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const connectCamera = useCallback(async () => {
    setStatus('connecting')
    setErrorMsg(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      await adapterRef.current.initialize({
        video: videoRef.current!,
        onBpm: (value: number) => {
          bpmRef.current = value
          setBpm(value)
        },
      })
      adapterRef.current.start()
      setStatus('ready')
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao acessar câmera. Verifique as permissões.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    connectCamera()
    return () => {
      stopCamera()
      adapterRef.current.stop()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const startCalibration = () => {
    setStatus('calibrating')
    setProgress(0)
    setSecondsLeft(CALIBRATION_DURATION)
    const start = Date.now()
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000
      const remaining = Math.max(0, CALIBRATION_DURATION - elapsed)
      setSecondsLeft(Math.ceil(remaining))
      setProgress(Math.min(100, (elapsed / CALIBRATION_DURATION) * 100))
      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        adapterRef.current.stop()
        stopCamera()
        setStatus('done')
      }
    }, 100)
  }

  const handleComplete = () => {
    const controller = new GameController()
    controller.setBpm(bpmRef.current ?? 72)
    onComplete(controller)
  }

  const handleSkip = () => {
    stopCamera()
    adapterRef.current.stop()
    const controller = new GameController()
    controller.setBpm(72)
    onComplete(controller)
  }

  const handleRetry = () => {
    stopCamera()
    connectCamera()
  }

  return (
    <div className="min-h-screen bg-[#0A192F] text-[#E6F1FF] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold tracking-tight text-[#E6F1FF]">NeuroFlow AI</h1>
          <p className="text-xs text-[#00FFFF]/70 font-medium mt-1">
            Onboarding · Calibração de Câmera
          </p>
          {!adapterRef.current.isAvailable && (
            <p className="text-[10px] text-yellow-400/70 mt-1">
              vitallens.js não detectado — usando mock
            </p>
          )}
        </div>

        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black/40 border border-[#00FFFF]/20 mb-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          />
          {status === 'connecting' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-[#00FFFF] animate-spin" />
            </div>
          )}
          {status === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <p className="text-sm text-red-400 text-center">{errorMsg}</p>
            </div>
          )}
          {status === 'ready' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-40 h-52 rounded-[50%] border-2 border-dashed border-[#00FFFF]/50 animate-pulse" />
            </div>
          )}
          {status === 'done' && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0A192F]/80">
              <Check className="h-16 w-16 text-[#00FFFF]" />
            </div>
          )}
        </div>

        {bpm !== null && status !== 'done' && (
          <p className="text-center text-[#00FFFF] text-sm font-medium mb-4">
            BPM detectado: {bpm}
          </p>
        )}

        {status === 'calibrating' && (
          <div className="mb-4 space-y-2">
            <Progress value={progress} className="h-2 bg-white/10" />
            <p className="text-xs text-white/50 text-center">{secondsLeft}s restantes</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {status === 'error' && (
            <Button
              onClick={handleRetry}
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Tentar Novamente
            </Button>
          )}
          {status === 'ready' && (
            <Button
              onClick={startCalibration}
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full px-8"
            >
              <Camera className="h-4 w-4 mr-2" /> Iniciar Calibração (10s)
            </Button>
          )}
          {status === 'done' && (
            <Button
              onClick={handleComplete}
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full"
            >
              Continuar para Sessão
            </Button>
          )}
          <div className="flex gap-3 justify-center">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-white/40 hover:text-[#00FFFF] text-xs"
            >
              Pular (BPM: 72)
            </Button>
            {onOpenFieldTest && (
              <Button
                variant="ghost"
                onClick={onOpenFieldTest}
                className="text-white/40 hover:text-[#00FFFF] text-xs"
              >
                <FlaskConical className="h-3 w-3 mr-1" /> Field Test
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
