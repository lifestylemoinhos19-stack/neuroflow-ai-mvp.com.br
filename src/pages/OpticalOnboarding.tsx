import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Camera, Check, X, RotateCcw, User, Fingerprint, Loader2, ArrowRight } from 'lucide-react'
import { OpticalCaptureOverlay } from '@/components/OpticalCaptureOverlay'
import { useOpticalCapture } from '@/hooks/use-optical-capture'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function OpticalOnboarding() {
  const navigate = useNavigate()
  const location = useLocation()
  const { completeBleOnboarding } = useAuth()
  const { toast } = useToast()
  const initialMode = (location.state as { mode?: string })?.mode === 'ppg' ? 'ppg' : 'rppg'
  const capture = useOpticalCapture(initialMode)
  const successHandled = useRef(false)

  useEffect(() => {
    if (capture.captureState === 'success' && !successHandled.current) {
      successHandled.current = true
      completeBleOnboarding(capture.mode === 'rppg' ? 'camera_rppg' : 'camera_ppg')
      toast({ title: '✅ Leitura inicial concluída com sucesso!' })
    } else if (capture.captureState !== 'success') {
      successHandled.current = false
    }
  }, [capture.captureState, capture.mode, completeBleOnboarding, toast])

  return (
    <div className="min-h-screen bg-[#0A192F] text-white flex flex-col items-center p-6 font-medium">
      <header className="text-center mb-8 pt-4">
        <h1 className="text-2xl font-bold tracking-tight">NeuroFlow AI</h1>
        <p className="text-[#00FFFF]/70 text-sm mt-1">Onboarding · Captura Óptica</p>
      </header>

      <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-full">
        <button
          onClick={() => capture.changeMode('rppg')}
          className={cn(
            'px-5 py-2 rounded-full text-sm font-medium transition-all',
            capture.mode === 'rppg' ? 'bg-[#00FFFF] text-[#0A192F]' : 'text-white/60',
          )}
        >
          <User className="h-4 w-4 inline mr-1.5" /> Rosto (rPPG)
        </button>
        <button
          onClick={() => capture.changeMode('ppg')}
          className={cn(
            'px-5 py-2 rounded-full text-sm font-medium transition-all',
            capture.mode === 'ppg' ? 'bg-[#00FFFF] text-[#0A192F]' : 'text-white/60',
          )}
        >
          <Fingerprint className="h-4 w-4 inline mr-1.5" /> Dedo (PPG)
        </button>
      </div>

      <div className="relative w-full max-w-sm aspect-[4/3] rounded-2xl overflow-hidden bg-black/40 border border-[#00FFFF]/20">
        <video
          ref={capture.videoRef}
          playsInline
          muted
          className={cn('w-full h-full object-cover', capture.mode === 'rppg' && 'scale-x-[-1]')}
        />
        <canvas ref={capture.canvasRef} className="hidden" />

        {capture.permissionState === 'granted' && capture.captureState !== 'success' && (
          <OpticalCaptureOverlay
            mode={capture.mode}
            isCapturing={capture.captureState === 'capturing'}
          />
        )}

        {capture.permissionState === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/40 text-sm">Câmera inativa</p>
          </div>
        )}

        {capture.permissionState === 'requesting' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-[#00FFFF] animate-spin" />
          </div>
        )}

        {capture.permissionState === 'denied' && (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <p className="text-red-400 text-sm text-center">
              Não foi possível acessar a câmera. Verifique as permissões do navegador.
            </p>
          </div>
        )}

        {capture.captureState === 'success' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A192F]/80 gap-3">
            <Check className="h-12 w-12 text-[#00FFFF]" />
            <p className="text-[#00FFFF] font-medium">Calibração concluída!</p>
            {capture.bpm && <p className="text-white/60 text-sm">BPM detectado: {capture.bpm}</p>}
          </div>
        )}
      </div>

      {capture.captureState === 'capturing' && (
        <div className="w-full max-w-sm mt-4 space-y-2">
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

      <div className="flex gap-3 mt-6 flex-wrap justify-center">
        {capture.permissionState === 'idle' && (
          <Button
            onClick={() => capture.requestCamera(capture.mode)}
            className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full px-6"
          >
            <Camera className="h-4 w-4 mr-2" /> Ativar Câmera
          </Button>
        )}

        {capture.permissionState === 'granted' && capture.captureState === 'idle' && (
          <Button
            onClick={capture.startCapture}
            className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full px-6"
          >
            <Camera className="h-4 w-4 mr-2" /> Iniciar Leitura (10s)
          </Button>
        )}

        {capture.captureState === 'capturing' && (
          <Button
            variant="outline"
            onClick={capture.cancelCapture}
            className="rounded-full px-6 border-red-400/30 text-red-400 hover:bg-red-400/10"
          >
            <X className="h-4 w-4 mr-2" /> Cancelar Leitura
          </Button>
        )}

        {capture.captureState === 'success' && (
          <>
            <Button
              variant="outline"
              onClick={() => {
                capture.cancelCapture()
                capture.startCapture()
              }}
              className="rounded-full px-6 border-[#00FFFF]/30 text-[#00FFFF] hover:bg-[#00FFFF]/10"
            >
              <RotateCcw className="h-4 w-4 mr-2" /> Refazer Leitura
            </Button>
            <Button
              variant="ghost"
              onClick={capture.resetAll}
              className="rounded-full px-6 text-white/60"
            >
              Reiniciar Onboarding
            </Button>
            <Button
              onClick={() => navigate('/focus-session')}
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full px-6"
            >
              Continuar <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
