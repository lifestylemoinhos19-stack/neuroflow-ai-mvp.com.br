import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Camera, Fingerprint, Check, X, RefreshCw, RotateCcw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'

type CaptureMode = 'rppg' | 'ppg'
type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied'
type CaptureState = 'idle' | 'capturing' | 'completed'

const CAPTURE_DURATION = 10

interface Props {
  initialMode: CaptureMode
  onComplete: (mode: CaptureMode) => Promise<void>
  onCancel: () => void
}

export function OpticalCaptureOnboarding({ initialMode, onComplete, onCancel }: Props) {
  const [mode, setMode] = useState<CaptureMode>(initialMode)
  const [permState, setPermState] = useState<PermissionState>('idle')
  const [captureState, setCaptureState] = useState<CaptureState>('idle')
  const [secondsLeft, setSecondsLeft] = useState(CAPTURE_DURATION)
  const [progress, setProgress] = useState(0)
  const [saving, setSaving] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const requestCamera = useCallback(async (m: CaptureMode) => {
    setPermState('requesting')
    setCaptureState('idle')
    setProgress(0)
    setSecondsLeft(CAPTURE_DURATION)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: m === 'rppg' ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setPermState('granted')
    } catch {
      setPermState('denied')
    }
  }, [])

  useEffect(() => {
    requestCamera(mode)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      stopCamera()
    }
  }, [])

  const handleModeSwitch = (m: CaptureMode) => {
    if (m === mode) return
    if (intervalRef.current) clearInterval(intervalRef.current)
    stopCamera()
    setMode(m)
    setTimeout(() => requestCamera(m), 500)
  }

  const completeCapture = async () => {
    setCaptureState('completed')
    stopCamera()
    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('user_onboarding').upsert(
          {
            user_id: user.id,
            is_first_access: false,
            onboarding_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )
      }
    } catch {
      /* silent */
    }
    setSaving(false)
  }

  const startCapture = () => {
    setCaptureState('capturing')
    setSecondsLeft(CAPTURE_DURATION)
    setProgress(0)
    const startTime = Date.now()
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      const remaining = Math.max(0, CAPTURE_DURATION - elapsed)
      setSecondsLeft(Math.ceil(remaining))
      setProgress(Math.min(100, (elapsed / CAPTURE_DURATION) * 100))
      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        completeCapture()
      }
    }, 100)
  }

  const cancelCapture = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setCaptureState('idle')
    setProgress(0)
    setSecondsLeft(CAPTURE_DURATION)
  }

  const redoCapture = () => {
    setCaptureState('idle')
    setProgress(0)
    setSecondsLeft(CAPTURE_DURATION)
    stopCamera()
    setTimeout(() => requestCamera(mode), 500)
  }

  const resetAll = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    cancelCapture()
    stopCamera()
    setMode(initialMode)
    setTimeout(() => requestCamera(initialMode), 500)
  }

  const isRppg = mode === 'rppg'
  const instruction = isRppg
    ? 'Posicione seu rosto no círculo'
    : 'Cubra a câmera traseira com o dedo'

  if (captureState === 'completed') {
    return (
      <div className="min-h-screen bg-[#0A192F] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="h-20 w-20 rounded-full bg-[#00FFFF]/10 flex items-center justify-center mx-auto mb-6">
            {saving ? (
              <Loader2 className="h-10 w-10 text-[#00FFFF] animate-spin" />
            ) : (
              <Check className="h-10 w-10 text-[#00FFFF]" />
            )}
          </div>
          <h2 className="text-xl font-medium mb-3">Calibração Concluída</h2>
          <p className="text-[#00FFFF] text-sm mb-8">✅ Leitura inicial concluída com sucesso!</p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => onComplete(mode)}
              disabled={saving}
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full"
            >
              Continuar para Sessão
            </Button>
            <div className="flex gap-3 justify-center">
              <Button
                variant="ghost"
                onClick={redoCapture}
                disabled={saving}
                className="text-white/60 hover:text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Refazer Leitura
              </Button>
              <Button
                variant="ghost"
                onClick={resetAll}
                disabled={saving}
                className="text-white/60 hover:text-white"
              >
                <RotateCcw className="h-4 w-4 mr-2" /> Reiniciar Onboarding
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A192F] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold tracking-tight">NeuroFlow AI</h1>
          <p className="text-xs text-[#00FFFF]/70 font-medium mt-1">Onboarding · Captura Óptica</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => handleModeSwitch('rppg')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all duration-200 text-sm font-medium',
              isRppg
                ? 'bg-[#00FFFF]/15 border-[#00FFFF]/40 text-[#00FFFF]'
                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10',
            )}
          >
            <Camera className="h-4 w-4" /> Rosto (rPPG)
          </button>
          <button
            onClick={() => handleModeSwitch('ppg')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all duration-200 text-sm font-medium',
              !isRppg
                ? 'bg-[#00FFFF]/15 border-[#00FFFF]/40 text-[#00FFFF]'
                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10',
            )}
          >
            <Fingerprint className="h-4 w-4" /> Dedo (PPG)
          </button>
        </div>

        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black/40 border border-white/10 mb-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn('absolute inset-0 w-full h-full object-cover', isRppg && 'scale-x-[-1]')}
          />

          {permState === 'granted' &&
            captureState !== 'completed' &&
            (isRppg ? (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-40 h-52 rounded-[50%] border-2 border-dashed border-[#00FFFF]/50 animate-pulse" />
              </div>
            ) : (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-32 h-40 rounded-2xl border-2 border-dashed border-[#00FFFF]/50 flex items-center justify-center">
                  <span className="text-4xl">👆</span>
                </div>
              </div>
            ))}

          {permState === 'requesting' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-[#00FFFF] animate-spin" />
            </div>
          )}
          {permState === 'denied' && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <p className="text-sm text-red-400 text-center">
                Não foi possível acessar a câmera. Verifique as permissões do navegador.
              </p>
            </div>
          )}
          {permState === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Camera className="h-12 w-12 text-white/20" />
            </div>
          )}
        </div>

        {permState === 'granted' && (
          <p className="text-sm text-[#00FFFF]/70 font-medium text-center mb-4">{instruction}</p>
        )}

        {captureState === 'capturing' && (
          <div className="mb-4 space-y-2">
            <Progress value={progress} className="h-2 bg-white/10" />
            <p className="text-xs text-white/50 text-center">{secondsLeft}s restantes</p>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          {permState === 'denied' && (
            <Button
              onClick={() => requestCamera(mode)}
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full"
            >
              Tentar Novamente
            </Button>
          )}
          {permState === 'granted' && captureState === 'idle' && (
            <>
              <Button
                onClick={startCapture}
                className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full px-8"
              >
                Iniciar Leitura (10s)
              </Button>
              <Button variant="ghost" onClick={onCancel} className="text-white/60 hover:text-white">
                Voltar
              </Button>
            </>
          )}
          {captureState === 'capturing' && (
            <Button
              variant="outline"
              onClick={cancelCapture}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-full"
            >
              <X className="h-4 w-4 mr-2" /> Cancelar Leitura
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
