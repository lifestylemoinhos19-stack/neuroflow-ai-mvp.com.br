import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Camera, Check, X, AlertCircle, Loader2, ArrowRight, User, Fingerprint } from 'lucide-react'
import { OpticalCaptureOverlay } from '@/components/OpticalCaptureOverlay'
import { useOpticalCapture } from '@/hooks/use-optical-capture'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export default function OpticalOnboarding() {
  const navigate = useNavigate()
  const location = useLocation()
  const { completeBleOnboarding, user } = useAuth()
  const { toast } = useToast()
  const initialMode = (location.state as { mode?: string })?.mode === 'ppg' ? 'ppg' : 'rppg'
  const capture = useOpticalCapture(initialMode)
  const successHandled = useRef(false)

  useEffect(() => {
    if (capture.phase === 'success' && !successHandled.current) {
      successHandled.current = true
      completeBleOnboarding(capture.mode === 'rppg' ? 'camera_rppg' : 'camera_ppg')
      toast({ title: '✅ Leitura inicial concluída com sucesso!' })
      if (user) {
        supabase
          .from('user_onboarding')
          .upsert(
            {
              user_id: user.id,
              is_first_access: false,
              onboarding_completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' },
          )
          .then(() => {})
      }
    } else if (capture.phase !== 'success') {
      successHandled.current = false
    }
  }, [capture.phase, capture.mode, completeBleOnboarding, toast, user])

  const videoHidden =
    capture.phase === 'intro' || capture.phase === 'success' || capture.phase === 'error'
  const showOverlay =
    (capture.phase === 'camera_active' || capture.phase === 'measuring') &&
    capture.permissionState === 'granted'

  return (
    <div className="min-h-screen bg-[#0A192F] text-white flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full rounded-3xl bg-[#0A192F]/80 border border-[#00FFFF]/20 p-6 shadow-[0_0_40px_-10px_rgba(0,255,255,0.15)]">
        <header className="text-center mb-6">
          <h1 className="text-xl font-bold tracking-tight">NeuroFlow AI</h1>
          <p className="text-[#00FFFF]/70 text-sm mt-1">Onboarding · Captura Óptica</p>
        </header>

        <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-full">
          <button
            onClick={() => capture.changeMode('rppg')}
            className={cn(
              'flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all',
              capture.mode === 'rppg' ? 'bg-[#00FFFF] text-[#0A192F]' : 'text-white/60',
            )}
          >
            <User className="h-4 w-4 inline mr-1.5" /> Rosto (rPPG)
          </button>
          <button
            onClick={() => capture.changeMode('ppg')}
            className={cn(
              'flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all',
              capture.mode === 'ppg' ? 'bg-[#00FFFF] text-[#0A192F]' : 'text-white/60',
            )}
          >
            <Fingerprint className="h-4 w-4 inline mr-1.5" /> Dedo (PPG)
          </button>
        </div>

        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black/40 border border-[#00FFFF]/20 mb-4">
          <video
            ref={capture.videoRef}
            playsInline
            muted
            className={cn(
              'w-full h-full object-cover',
              capture.mode === 'rppg' && '-scale-x-100',
              videoHidden && 'hidden',
            )}
          />
          <canvas ref={capture.canvasRef} className="hidden" />

          {capture.phase === 'intro' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <Camera className="h-12 w-12 text-[#00FFFF]/40 mb-4" />
              <h2 className="text-lg font-medium mb-3">Vamos medir seus batimentos sem sensores</h2>
              <p className="text-xs text-white/60 mb-4">
                A tecnologia rPPG (fotopletismografia remota) analisa variações de cor no rosto para
                estimar batimentos cardíacos.
              </p>
              <ul className="text-xs text-white/70 space-y-1.5 text-left">
                <li className="flex items-start gap-2">
                  <span className="text-[#00FFFF]">•</span> Leitura óptica não invasiva via rPPG
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00FFFF]">•</span> Modo rosto: enquadre o rosto no círculo
                  central
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00FFFF]">•</span> Modo dedo: cubra a câmera e o flash com
                  o dedo
                </li>
              </ul>
            </div>
          )}

          {showOverlay && <OpticalCaptureOverlay mode={capture.mode} isCapturing={true} />}

          {capture.phase === 'camera_active' && capture.permissionState === 'requesting' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-[#00FFFF] animate-spin" />
            </div>
          )}

          {capture.phase === 'success' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A192F]/90 gap-3">
              <Check className="h-12 w-12 text-[#00FFFF]" />
              <p className="text-[#00FFFF] font-medium">Calibração concluída!</p>
              {capture.bpm && <p className="text-white/60 text-sm">BPM detectado: {capture.bpm}</p>}
            </div>
          )}

          {capture.phase === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <div>
                <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                <p className="text-sm text-red-400">{capture.cameraError}</p>
              </div>
            </div>
          )}
        </div>

        {capture.phase === 'camera_active' && capture.permissionState === 'granted' && (
          <div className="mb-4 space-y-2">
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${capture.signalQuality}%`,
                  backgroundColor: capture.qualityInfo.color,
                }}
              />
            </div>
            <p
              className="text-xs text-center font-medium"
              style={{ color: capture.qualityInfo.color }}
            >
              {capture.qualityInfo.label} · {Math.round(capture.signalQuality)}%
            </p>
          </div>
        )}

        {capture.phase === 'measuring' && (
          <div className="mb-4 space-y-2">
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00FFFF] rounded-full transition-all duration-100"
                style={{ width: `${capture.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#00FFFF] font-medium tabular-nums">
                {capture.countdown}s restantes
              </span>
              {capture.bpm && <span className="text-white/60">{capture.bpm} BPM</span>}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center flex-wrap">
          {capture.phase === 'intro' && (
            <>
              <Button
                onClick={() => capture.requestCamera(capture.mode)}
                className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full px-6"
              >
                <Camera className="h-4 w-4 mr-2" /> Ativar Câmera
              </Button>
              <button
                type="button"
                onClick={() => {
                  completeBleOnboarding('simulation')
                  setTimeout(() => {
                    navigate('/focus-session', {
                      state: { captureMethod: 'simulation', fallbackBpm: 72 },
                    })
                  }, 500)
                }}
                className="text-xs text-white/40 hover:text-[#00FFFF] underline transition-colors mt-2"
              >
                Pular calibração (BPM padrão: 72)
              </button>
            </>
          )}

          {capture.phase === 'camera_active' &&
            capture.permissionState === 'granted' &&
            (capture.canStartMeasurement ? (
              <Button
                onClick={capture.startMeasurement}
                className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full px-6"
              >
                Iniciar Medição
              </Button>
            ) : (
              <p className="text-xs text-white/50 text-center py-2">
                {capture.mode === 'rppg'
                  ? 'Posicione seu rosto no círculo'
                  : 'Cubra a câmera com o dedo'}{' '}
                para melhorar o sinal
              </p>
            ))}

          {capture.phase === 'measuring' && (
            <Button
              variant="outline"
              onClick={capture.cancelMeasurement}
              className="rounded-full px-6 border-red-400/30 text-red-400 hover:bg-red-400/10"
            >
              <X className="h-4 w-4 mr-2" /> Cancelar e voltar
            </Button>
          )}

          {capture.phase === 'success' && (
            <Button
              onClick={() => {
                capture.stopCamera()
                setTimeout(() => {
                  navigate('/focus-session', {
                    state: {
                      captureMethod: capture.mode === 'rppg' ? 'camera_rppg' : 'camera_ppg',
                    },
                  })
                }, 500)
              }}
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full px-6"
            >
              Continuar <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          {capture.phase === 'error' && (
            <Button
              onClick={capture.retry}
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full px-6"
            >
              Tentar novamente
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
