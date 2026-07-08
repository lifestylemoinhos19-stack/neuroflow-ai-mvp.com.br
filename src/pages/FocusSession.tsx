import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AlertCircle, User, Bluetooth, Check, ChevronRight } from 'lucide-react'
import { CameraOnboarding } from '@/components/CameraOnboarding'
import { GameEngineWithAutoSimulation } from '@/components/GameEngineWithAutoSimulation'
import { FieldTestRunner } from '@/components/FieldTestRunner'
import { useAuth } from '@/contexts/auth-context'
import type { GameController } from '@/lib/game-controller'

type Phase = 'first-access' | 'onboarding' | 'focus' | 'error'

export default function FocusSession() {
  const [phase, setPhase] = useState<Phase>('onboarding')
  const [controller, setController] = useState<GameController | null>(null)
  const [showFieldTest, setShowFieldTest] = useState(false)
  const { isAuthenticated, bleOnboardingCompleted, completeBleOnboarding } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated && !bleOnboardingCompleted && phase === 'onboarding') {
      setPhase('first-access')
    }
  }, [isAuthenticated, bleOnboardingCompleted, phase])

  const handleFirstAccessComplete = useCallback(async () => {
    await completeBleOnboarding()
    setPhase('onboarding')
  }, [completeBleOnboarding])

  const guestBanner = !isAuthenticated ? (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-[#00FFFF]/10 border-b border-[#00FFFF]/20 backdrop-blur-sm px-4 py-2 text-center">
      <p className="text-xs text-[#00FFFF] flex items-center justify-center gap-1.5">
        <User className="h-3 w-3" />
        Modo Convidado — Faça login para salvar seu progresso
      </p>
    </div>
  ) : null

  const handleCalibrationComplete = useCallback((ctrl: GameController) => {
    if (!ctrl || typeof ctrl.start !== 'function' || typeof ctrl.stop !== 'function') {
      setPhase('error')
      return
    }
    setController(ctrl)
    setPhase('focus')
  }, [])

  const handleExit = useCallback(() => {
    if (controller) {
      controller.stop()
      controller.dispose()
    }
    setController(null)
    setPhase('onboarding')
  }, [controller])

  if (showFieldTest) {
    return <FieldTestRunner onClose={() => setShowFieldTest(false)} />
  }

  if (phase === 'first-access') {
    return (
      <>
        {guestBanner}
        <div className="min-h-screen bg-[#0A192F] text-[#E6F1FF] flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="flex justify-center mb-8">
              <div className="h-20 w-20 rounded-full bg-[#00FFFF]/10 flex items-center justify-center">
                <Bluetooth className="h-10 w-10 text-[#00FFFF]" />
              </div>
            </div>
            <h2 className="text-xl font-medium text-center mb-3">
              Bem-vindo ao Explorador da Calma
            </h2>
            <p className="text-sm text-white/60 text-center mb-8 leading-relaxed">
              Vamos guiá-lo na configuração da captura de batimentos cardíacos. Você pode usar a
              câmera do dispositivo ou um sensor Bluetooth.
            </p>
            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                <Check className="h-5 w-5 text-[#00FFFF] shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm">Captura por Câmera</h3>
                  <p className="text-xs text-white/50 mt-1">
                    Detecta batimentos via análise facial (rPPG) ou dedo sobre a câmera (PPG).
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                <Bluetooth className="h-5 w-5 text-[#00FFFF] shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm">Sensor Bluetooth</h3>
                  <p className="text-xs text-white/50 mt-1">
                    Conecte um sensor de frequência cardíaca externo via Web Bluetooth.
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={handleFirstAccessComplete}
              className="w-full bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full"
            >
              Começar Configuração
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            <button
              onClick={() => {
                completeBleOnboarding()
                setPhase('onboarding')
              }}
              className="w-full text-center text-xs text-white/40 hover:text-white/60 mt-4 transition-colors"
            >
              Pular tutorial
            </button>
          </div>
        </div>
      </>
    )
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-[#0A192F] text-[#E6F1FF] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-lg mb-6 text-[#E6F1FF]">
            gameController inválido recebido do onboarding.
          </p>
          <Button
            onClick={() => setPhase('onboarding')}
            className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  if (phase === 'onboarding') {
    return (
      <>
        {guestBanner}
        <CameraOnboarding
          onComplete={handleCalibrationComplete}
          onOpenFieldTest={() => setShowFieldTest(true)}
        />
      </>
    )
  }

  if (phase === 'focus' && controller) {
    return (
      <>
        {guestBanner}
        <GameEngineWithAutoSimulation
          controller={controller}
          onExit={handleExit}
          externalBpm={null}
          biometricConnected={false}
        />
      </>
    )
  }

  return null
}
