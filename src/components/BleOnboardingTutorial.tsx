import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bluetooth, Check, ChevronRight, Loader2, ExternalLink } from 'lucide-react'
import type { BleConnectionState } from '@/hooks/use-heart-rate'
import { cn } from '@/lib/utils'

interface BleOnboardingTutorialProps {
  connectionState: BleConnectionState
  isConnecting: boolean
  isSupported: boolean
  error: string | null
  onConnect: () => Promise<void>
  onComplete: () => Promise<void>
  onSkip: () => Promise<void>
}

const steps = [
  {
    title: 'Bem-vindo ao Explorador da Calma',
    description:
      'Vamos conectar seu sensor de batimentos cardíacos via Bluetooth para iniciar sua jornada de foco.',
  },
  {
    title: 'Ative o Bluetooth',
    description:
      'Certifique-se de que o Bluetooth está ativado no seu dispositivo. Coloque o sensor de frequência cardíaca próximo.',
  },
  {
    title: 'Conecte o Sensor',
    description:
      'Toque no botão abaixo para procurar e parear seu sensor de batimentos cardíacos via Bluetooth Low Energy.',
  },
  {
    title: 'Tudo Pronto!',
    description:
      'Seu sensor está conectado. Você está pronto para iniciar sua sessão de foco e coletar cristais.',
  },
]

export function BleOnboardingTutorial({
  connectionState,
  isConnecting,
  isSupported,
  error,
  onConnect,
  onComplete,
  onSkip,
}: BleOnboardingTutorialProps) {
  const [step, setStep] = useState(0)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    if (connectionState === 'connected' && step === 2) {
      setStep(3)
    }
  }, [connectionState, step])

  const handleFinish = async () => {
    setCompleting(true)
    await onComplete()
    setCompleting(false)
  }

  const handleSkip = async () => {
    setCompleting(true)
    await onSkip()
    setCompleting(false)
  }

  const isLastStep = step === steps.length - 1
  const isConnectStep = step === 2

  return (
    <div className="min-h-screen bg-[#0A192F] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="flex justify-center mb-8">
          <div className="h-20 w-20 rounded-full bg-[#00FFFF]/10 flex items-center justify-center">
            {step === 3 ? (
              <Check className="h-10 w-10 text-[#00FFFF]" />
            ) : (
              <Bluetooth className="h-10 w-10 text-[#00FFFF]" />
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-center mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === step ? 'w-8 bg-[#00FFFF]' : 'w-1.5 bg-white/20',
              )}
            />
          ))}
        </div>

        <h2 className="text-xl font-medium text-center mb-3">{steps[step].title}</h2>
        <p className="text-sm text-white/85 text-center mb-8 leading-relaxed">
          {steps[step].description}
        </p>

        {isConnectStep && (
          <div className="mb-6 space-y-2">
            {connectionState === 'connected' && (
              <p className="flex items-center justify-center gap-2 text-[#00FFFF] text-sm">
                <Check className="h-4 w-4" /> Sensor conectado com sucesso!
              </p>
            )}
            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
            {!isSupported && (
              <div className="space-y-2">
                <p className="text-xs text-amber-400 text-center">
                  Bluetooth não suportado neste navegador. Você pode continuar em modo simulação.
                </p>
                <div className="p-3 rounded-lg bg-amber-400/10 border border-amber-400/20">
                  <p className="text-xs text-amber-300/80 text-center leading-relaxed">
                    Usuários iOS podem usar o navegador{' '}
                    <a
                      href="https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium inline-flex items-center gap-0.5"
                    >
                      Bluefy
                      <ExternalLink className="h-3 w-3" />
                    </a>{' '}
                    ou Safari (iOS 16.4+) para Bluetooth.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          {step > 0 && !isLastStep && (
            <Button variant="ghost" onClick={() => setStep(step - 1)} className="text-white/85">
              Voltar
            </Button>
          )}
          {isConnectStep ? (
            <Button
              onClick={onConnect}
              disabled={isConnecting || !isSupported}
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full px-8"
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bluetooth className="h-4 w-4 mr-2" />
              )}
              Conectar Sensor
            </Button>
          ) : isLastStep ? (
            <Button
              onClick={handleFinish}
              disabled={completing}
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full px-8"
            >
              {completing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Iniciar Sessão
            </Button>
          ) : (
            <Button
              onClick={() => setStep(step + 1)}
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full px-8"
            >
              Avançar
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        {(step === 0 || isConnectStep) && (
          <button
            onClick={handleSkip}
            className="w-full text-center text-xs text-white/70 hover:text-white/85 mt-6 transition-colors"
          >
            {isConnectStep ? 'Continuar sem sensor' : 'Pular tutorial'}
          </button>
        )}
      </div>
    </div>
  )
}
