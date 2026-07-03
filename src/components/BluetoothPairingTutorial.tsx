import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bluetooth, Check, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BleSensorState } from '@/hooks/use-ble-sensor'

interface BluetoothPairingTutorialProps {
  bleState: BleSensorState
  isSupported: boolean
  error: string | null
  sensorId: string | null
  onConnect: () => Promise<void>
  onComplete: () => Promise<void>
  onSkip: () => void
}

const steps = [
  {
    title: 'Bem-vindo ao NeuroFlow',
    description: 'Vamos conectar seu sensor NeuroFlow via Bluetooth para iniciar sua jornada.',
  },
  {
    title: 'Ative o Bluetooth',
    description:
      'Certifique-se de que o Bluetooth está ativado. Coloque o sensor próximo ao dispositivo.',
  },
  {
    title: 'Parear Sensor',
    description: 'Toque no botão abaixo para procurar e parear seu sensor NeuroFlow.',
  },
  {
    title: 'Tudo Pronto!',
    description: 'Seu sensor está conectado. Você está pronto para iniciar sua sessão.',
  },
]

export function BluetoothPairingTutorial({
  bleState,
  isSupported,
  error,
  onConnect,
  onComplete,
  onSkip,
}: BluetoothPairingTutorialProps) {
  const [step, setStep] = useState(0)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    if (bleState === 'connected' && step === 2) setStep(3)
  }, [bleState, step])

  const handleFinish = async () => {
    setCompleting(true)
    await onComplete()
    setCompleting(false)
  }

  const isLastStep = step === steps.length - 1
  const isConnectStep = step === 2
  const isConnecting = bleState === 'scanning' || bleState === 'connecting'

  return (
    <div className="min-h-screen bg-[#0A192F] text-white flex items-center justify-center p-6 font-sans font-medium">
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
        <p className="text-sm text-white/60 text-center mb-8 leading-relaxed">
          {steps[step].description}
        </p>

        {isConnectStep && (
          <div className="mb-6 space-y-2">
            {bleState === 'connected' && (
              <p className="flex items-center justify-center gap-2 text-[#00FFFF] text-sm">
                <Check className="h-4 w-4" /> Sensor conectado com sucesso!
              </p>
            )}
            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
            {!isSupported && (
              <p className="text-xs text-amber-400 text-center">
                Bluetooth não suportado neste navegador. Você pode continuar em modo simulação.
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          {step > 0 && !isLastStep && (
            <Button variant="ghost" onClick={() => setStep(step - 1)} className="text-white/60">
              Voltar
            </Button>
          )}
          {isConnectStep ? (
            <Button
              onClick={onConnect}
              disabled={isConnecting || !isSupported}
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full px-8 font-medium"
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
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full px-8 font-medium"
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
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full px-8 font-medium"
            >
              Avançar
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        {(step === 0 || isConnectStep) && (
          <button
            onClick={onSkip}
            className="w-full text-center text-xs text-white/40 hover:text-white/60 mt-6 transition-colors"
          >
            {isConnectStep ? 'Continuar sem sensor' : 'Pular tutorial'}
          </button>
        )}
      </div>
    </div>
  )
}
