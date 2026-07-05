import { useEffect, useState } from 'react'
import { useFocusSession } from '@/hooks/use-focus-session'
import { useBiofeedbackSource } from '@/hooks/use-biofeedback-source'
import type { BiofeedbackSourceState } from '@/hooks/use-biofeedback-source'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Settings, X, Pause, Play, Wind, Diamond, Map } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CrystalParticles } from '@/components/CrystalParticles'
import { EnergyBar } from '@/components/EnergyBar'
import { ConnectionStatusTooltip } from '@/components/ConnectionStatusTooltip'
import { BreathingOverlay } from '@/components/BreathingOverlay'
import { SensorSettings } from '@/components/SensorSettings'
import { BleOnboardingTutorial } from '@/components/BleOnboardingTutorial'
import type { BleSensorState } from '@/hooks/use-ble-sensor'

const formatTime = (s: number) =>
  `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

function mapToSensorState(source: BiofeedbackSourceState): BleSensorState {
  if (source.mode === 'bluetooth') {
    if (source.bleConnectionState === 'connected') return 'connected'
    if (source.bleConnecting) return 'connecting'
    if (source.bleConnectionState === 'searching') return 'scanning'
    if (source.bleError) return 'error'
    return 'idle'
  }
  if (source.mode === 'camera') {
    if (source.isCameraActive) return 'connected'
    if (source.cameraConnecting) return 'connecting'
    if (source.error) return 'error'
    return 'idle'
  }
  return 'idle'
}

export default function FocusSession() {
  const { bleOnboardingCompleted, completeBleOnboarding, pairedSensorId } = useAuth()
  const [showBreathing, setShowBreathing] = useState(false)
  const source = useBiofeedbackSource()

  const {
    timeLeft,
    isActive,
    phase,
    bpm,
    energy,
    crystals,
    masterCrystals,
    showParticles,
    mockSensor,
    stateLevel,
    prolongedAgitation,
    setMockSensor,
    setExternalBpm,
    toggleActive,
    handleCancel,
  } = useFocusSession()

  useEffect(() => {
    source.autoReconnectBle(pairedSensorId)
  }, [source.autoReconnectBle, pairedSensorId])

  useEffect(() => {
    if (source.bpm !== null) {
      setExternalBpm(source.bpm)
      if (mockSensor) setMockSensor(false)
    }
  }, [source.bpm, mockSensor, setExternalBpm, setMockSensor])

  useEffect(() => {
    if (source.bpm === null && !mockSensor) setMockSensor(true)
  }, [source.bpm, mockSensor, setMockSensor])

  useEffect(() => {
    if (prolongedAgitation) setShowBreathing(true)
  }, [prolongedAgitation])

  if (!bleOnboardingCompleted) {
    return (
      <BleOnboardingTutorial
        connectionState={source.bleConnectionState}
        isConnecting={source.bleConnecting}
        isSupported={source.isBleSupported}
        error={source.bleError}
        onConnect={source.connectBle}
        onComplete={completeBleOnboarding}
        onSkip={async () => {
          await completeBleOnboarding('simulation')
        }}
      />
    )
  }

  const mascotFilter = stateLevel === 'agitated' ? 'grayscale(0.3) brightness(0.8)' : 'none'
  const floatDuration = stateLevel === 'calm' ? '6s' : stateLevel === 'alert' ? '4s' : '2s'
  const stateLabel = stateLevel === 'calm' ? 'Calmo' : stateLevel === 'alert' ? 'Atento' : 'Agitado'
  const sensorState = mapToSensorState(source)

  return (
    <div className="min-h-screen bg-[#0A192F] text-white flex flex-col relative overflow-hidden font-medium">
      <CrystalParticles show={showParticles} />
      {showBreathing && prolongedAgitation && phase === 'focus' && (
        <BreathingOverlay onClose={() => setShowBreathing(false)} />
      )}

      <div className="absolute inset-0 pointer-events-none opacity-20">
        <Diamond
          className="absolute top-20 left-6 text-[#00FFFF] h-5 w-5 animate-float"
          fill="currentColor"
        />
        <Diamond
          className="absolute top-48 right-12 text-[#00FFFF]/60 h-3 w-3 animate-float"
          fill="currentColor"
          style={{ animationDuration: '6s' }}
        />
        <Diamond
          className="absolute bottom-32 left-12 text-[#00FFFF]/40 h-4 w-4 animate-float"
          fill="currentColor"
          style={{ animationDuration: '2s' }}
        />
      </div>

      <header className="p-4 sm:p-6 pb-2 z-10 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-2 w-full justify-between">
          <div className="flex items-center">
            <Map className="h-5 w-5 text-[#00FFFF] mr-2" />
            <span className="font-medium text-white/90 tracking-tight text-sm">NeuroFlow AI</span>
          </div>
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            Estado: {stateLabel}. BPM: {bpm}. Energia: {Math.round(energy)}%. Cristais:{' '}
            {crystals + masterCrystals}.
          </div>
          <div className="flex items-center gap-3">
            <ConnectionStatusTooltip
              state={sensorState}
              error={source.error}
              onRetry={() =>
                source.mode === 'camera' ? source.connectCamera() : source.connectBle()
              }
            />
            <div className="bg-[#00FFFF]/10 px-3 py-1 rounded-full flex items-center text-sm font-medium text-[#00FFFF]">
              <Diamond className="h-4 w-4 mr-1" fill="currentColor" /> {crystals + masterCrystals}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/5 rounded-full text-white/60 hover:text-white"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-72 p-4 bg-[#0A192F] border-[#00FFFF]/20 text-white"
                align="end"
              >
                <SensorSettings source={source} />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-medium text-white tracking-tight mt-2">
          O EXPLORADOR DA CALMA
        </h1>
        <p className="text-[#00FFFF]/70 font-medium text-xs sm:text-sm mt-1">
          {phase === 'focus' ? 'Foco' : 'Pausa'} • Nível 4 • Cristais: {crystals} + {masterCrystals}{' '}
          Mestres
        </p>
        <p
          className="text-white/60 font-medium mt-2 bg-white/5 px-4 py-1.5 rounded-full text-sm border border-[#00FFFF]/10"
          role="status"
        >
          {phase === 'focus'
            ? 'Objetivo: Mantenha a calma para ganhar cristais a cada 2 minutos!'
            : 'Respire fundo... O descanso faz parte da jornada.'}
        </p>
        {stateLevel === 'agitated' && phase === 'focus' && (
          <div className="mt-4 animate-fade-in-up flex items-center bg-white/5 text-white/70 px-4 py-2 rounded-xl border border-white/10 max-w-md">
            <Wind className="h-5 w-5 mr-2 text-white/50 animate-pulse" />
            <span className="font-medium text-sm text-left">
              Navegando para a zona de descanso. Faça uma micro-pausa para respiração profunda.
            </span>
          </div>
        )}
      </header>

      <main className="flex-1 relative flex items-center justify-center w-full max-w-2xl mx-auto px-2 sm:px-8">
        <div
          className={cn(
            'relative z-10 transition-all duration-1000',
            stateLevel === 'agitated' && phase === 'focus'
              ? 'translate-y-16 sm:translate-y-20 opacity-60'
              : 'opacity-100',
          )}
          style={{ animation: `float ${floatDuration} ease-in-out infinite` }}
        >
          <img
            src="https://img.usecurling.com/p/512/512?q=hot%20air%20balloon%20cute&color=cyan&dpr=3"
            alt="Explorador da Calma"
            className="w-80 h-80 md:w-96 md:h-96 object-contain drop-shadow-2xl"
            style={{ filter: mascotFilter }}
          />
        </div>
        <div className="absolute right-1 sm:right-4 md:right-6 top-1/2 -translate-y-1/2">
          <EnergyBar bpm={bpm} energy={energy} stateLevel={stateLevel} />
        </div>
        {stateLevel === 'agitated' && phase === 'focus' && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 text-xs font-medium animate-pulse">
            Zona de Descanso
          </div>
        )}
      </main>

      <footer className="p-4 sm:p-6 z-10 flex flex-col items-center bg-gradient-to-t from-[#0A192F] to-transparent">
        <div className="text-3xl sm:text-4xl font-medium text-[#00FFFF] mb-2 tabular-nums">
          {formatTime(timeLeft)}
        </div>
        <div className="text-xs text-white/40 font-medium mb-4">
          {phase === 'focus' ? 'Tempo de Foco' : 'Tempo de Pausa'}
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-14 w-14 rounded-full bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
            onClick={handleCancel}
          >
            <X className="h-6 w-6" />
          </Button>
          <Button
            size="icon"
            className="h-16 w-16 rounded-full bg-[#00FFFF] hover:bg-[#00FFFF]/90 text-[#0A192F] shadow-lg"
            onClick={toggleActive}
          >
            {isActive ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-1" />}
          </Button>
        </div>
      </footer>
    </div>
  )
}
