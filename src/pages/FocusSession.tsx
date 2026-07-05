import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { CameraOnboarding } from '@/components/CameraOnboarding'
import { GameEngine } from '@/components/GameEngine'
import { FieldTestRunner } from '@/components/FieldTestRunner'
import type { GameController } from '@/lib/game-controller'

type Phase = 'onboarding' | 'focus' | 'error'

export default function FocusSession() {
  const [phase, setPhase] = useState<Phase>('onboarding')
  const [controller, setController] = useState<GameController | null>(null)
  const [showFieldTest, setShowFieldTest] = useState(false)

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
      <CameraOnboarding
        onComplete={handleCalibrationComplete}
        onOpenFieldTest={() => setShowFieldTest(true)}
      />
    )
  }

  if (phase === 'focus' && controller) {
    return <GameEngine controller={controller} onExit={handleExit} />
  }

  return null
}
