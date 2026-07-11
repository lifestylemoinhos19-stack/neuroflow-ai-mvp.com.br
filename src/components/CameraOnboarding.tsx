import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Camera,
  Check,
  AlertCircle,
  RefreshCw,
  FlaskConical,
  Loader2,
  CameraOff,
  ShieldAlert,
  MonitorSmartphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { GameController } from '@/lib/game-controller'
import { createVitalLensAdapter } from '@/lib/vitallens-adapter'
import {
  classifyCameraError,
  shouldRetryCameraError,
  logCameraFailure,
  MAX_CAMERA_RETRIES,
  CAMERA_RETRY_DELAYS,
  type CameraInitStatus,
} from '@/lib/camera-diagnostics'

const CALIBRATION_DURATION = 10

const errorDisplay: Partial<
  Record<CameraInitStatus, { icon: typeof Camera; title: string; hint: string }>
> = {
  permission_denied: {
    icon: ShieldAlert,
    title: 'Camera access denied',
    hint: 'Please check your browser permissions and retry.',
  },
  device_in_use: {
    icon: MonitorSmartphone,
    title: 'Camera is busy',
    hint: 'Close other apps using the camera (Zoom, Teams, etc.) and try again.',
  },
  not_found: {
    icon: CameraOff,
    title: 'No camera found',
    hint: 'Please connect a camera device and try again.',
  },
  unsupported: {
    icon: CameraOff,
    title: 'Camera not supported',
    hint: 'Your device does not support camera access.',
  },
  error: {
    icon: AlertCircle,
    title: 'Camera error',
    hint: 'An unexpected error occurred. Please try again.',
  },
}

interface Props {
  onComplete: (controller: GameController) => void
  onOpenFieldTest?: () => void
}

export function CameraOnboarding({ onComplete, onOpenFieldTest }: Props) {
  const [status, setStatus] = useState<CameraInitStatus>('connecting')
  const [secondsLeft, setSecondsLeft] = useState(CALIBRATION_DURATION)
  const [progress, setProgress] = useState(0)
  const [bpm, setBpm] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [autoRetrying, setAutoRetrying] = useState(false)
  const [videoReady, setVideoReady] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const adapterRef = useRef(createVitalLensAdapter())
  const bpmRef = useRef<number | null>(null)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const connectionIdRef = useRef(0)
  const isMountedRef = useRef(true)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setVideoReady(false)
  }, [])

  const connectCamera = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    const currentId = ++connectionIdRef.current

    const attempt = async (retries: number): Promise<void> => {
      if (!isMountedRef.current || connectionIdRef.current !== currentId) return
      setStatus('connecting')
      setErrorMsg(null)
      setVideoReady(false)

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        })
        if (!isMountedRef.current || connectionIdRef.current !== currentId) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
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
        setAutoRetrying(false)
        setStatus('ready')
        setVideoReady(true)
      } catch (err: any) {
        if (!isMountedRef.current || connectionIdRef.current !== currentId) return
        const { status: errStatus, message } = classifyCameraError(err)
        await logCameraFailure(err, errStatus)

        if (shouldRetryCameraError(err) && retries < MAX_CAMERA_RETRIES) {
          setAutoRetrying(true)
          setRetryAttempt(retries + 1)
          setErrorMsg(`Auto-retrying (${retries + 1}/${MAX_CAMERA_RETRIES})...`)
          retryTimeoutRef.current = setTimeout(() => {
            if (connectionIdRef.current === currentId) attempt(retries + 1)
          }, CAMERA_RETRY_DELAYS[retries] || 4000)
        } else {
          setAutoRetrying(false)
          setStatus(errStatus)
          setErrorMsg(message)
        }
      }
    }

    attempt(0)
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    connectCamera()
    return () => {
      isMountedRef.current = false
      stopCamera()
      adapterRef.current.stop()
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
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
    controller.setExternalBpm(bpmRef.current ?? 72)
    onComplete(controller)
  }

  const handleSkip = () => {
    stopCamera()
    adapterRef.current.stop()
    const controller = new GameController()
    controller.setExternalBpm(72)
    onComplete(controller)
  }

  const isErrorState = [
    'permission_denied',
    'device_in_use',
    'not_found',
    'unsupported',
    'error',
  ].includes(status)
  const errConfig = isErrorState ? errorDisplay[status] : null
  const ErrIcon = errConfig?.icon || AlertCircle
  const isConnecting = status === 'connecting' || autoRetrying

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

        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#0A192F] border border-[#00FFFF]/20 mb-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              'absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-500',
              videoReady ? 'opacity-100' : 'opacity-0',
            )}
          />

          {isConnecting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A192F] gap-3">
              <Loader2 className="h-10 w-10 text-[#00FFFF] animate-spin" />
              <p className="text-sm text-[#E6F1FF] font-medium">
                {autoRetrying
                  ? `Reconnecting... (${retryAttempt}/${MAX_CAMERA_RETRIES})`
                  : 'Initializing camera...'}
              </p>
              {autoRetrying && errorMsg && <p className="text-xs text-[#00FFFF]/60">{errorMsg}</p>}
            </div>
          )}

          {isErrorState && !autoRetrying && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A192F] p-6 gap-3 text-center">
              <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <ErrIcon className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-sm font-medium text-[#E6F1FF]">{errConfig?.title}</p>
              <p className="text-xs text-white/50 max-w-xs">{errorMsg || errConfig?.hint}</p>
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

        {bpm !== null && status !== 'done' && !isErrorState && !isConnecting && (
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
          {isErrorState && !autoRetrying && status !== 'unsupported' && (
            <Button
              onClick={connectCamera}
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Retry Camera Connection
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
