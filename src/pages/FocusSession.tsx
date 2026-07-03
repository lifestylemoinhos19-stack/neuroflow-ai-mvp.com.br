import { useEffect } from 'react'
import { useFocusSession } from '@/hooks/use-focus-session'
import { useHeartRate } from '@/hooks/use-heart-rate'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import {
  Heart,
  Settings,
  X,
  Pause,
  Play,
  Wind,
  Diamond,
  Map,
  Bluetooth,
  BluetoothConnected,
  Loader2,
  Waves,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CrystalParticles } from '@/components/CrystalParticles'
import { ConnectionStatusTooltip } from '@/components/ConnectionStatusTooltip'
import type { BleSensorState } from '@/hooks/use-ble-sensor'
import { BleOnboardingTutorial } from '@/components/BleOnboardingTutorial'

const formatTime = (s: number) =>
  `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

function mapToSensorState(
  connectionState: any,
  isConnecting: boolean,
  error: string | null,
): BleSensorState {
  if (connectionState === 'connected') return 'connected'
  if (isConnecting) return 'connecting'
  if (connectionState === 'searching') return 'scanning'
  if (error) return 'error'
  return 'idle'
}

export default function FocusSession() {
  const { bleOnboardingCompleted, completeBleOnboarding } = useAuth()

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
    setMockSensor,
    setExternalBpm,
    toggleActive,
    handleCancel,
  } = useFocusSession()

  const {
    bpm: bleBpm,
    connectionState,
    isConnecting,
    isSupported: bleSupported,
    connect: bleConnect,
    disconnect: bleDisconnect,
    autoReconnect,
    error: bleError,
  } = useHeartRate()

  useEffect(() => {
    autoReconnect()
  }, [autoReconnect])

  useEffect(() => {
    if (bleBpm !== null) {
      setExternalBpm(bleBpm)
      if (mockSensor) setMockSensor(false)
    }
  }, [bleBpm, mockSensor, setExternalBpm, setMockSensor])

  useEffect(() => {
    if (connectionState === 'disconnected' && !mockSensor) {
      setMockSensor(true)
    }
  }, [connectionState, mockSensor, setMockSensor])

  if (!bleOnboardingCompleted) {
    return (
      <BleOnboardingTutorial
        connectionState={connectionState}
        isConnecting={isConnecting}
        isSupported={bleSupported}
        error={bleError}
        onConnect={bleConnect}
        onComplete={completeBleOnboarding}
        onSkip={async () => {
          await completeBleOnboarding('simulation')
        }}
      />
    )
  }

  const energyColor = bpm < 70 ? 'bg-[#00FFFF]/80' : bpm >= 90 ? 'bg-[#0A192F]' : 'bg-blue-400/70'
  const energyPattern = bpm < 70 ? 'pattern-calm' : bpm >= 90 ? 'pattern-agitated' : ''
  const energyPulse = bpm < 70 ? 'animate-pulse-slow' : bpm >= 90 ? 'animate-pulse-fast' : ''
  const mascotFilter = stateLevel === 'agitated' ? 'grayscale(0.3) brightness(0.8)' : 'none'
  const floatDuration = stateLevel === 'calm' ? '6s' : stateLevel === 'alert' ? '4s' : '2s'
  const stateLabel = stateLevel === 'calm' ? 'Calmo' : stateLevel === 'alert' ? 'Atento' : 'Agitado'
  const stateTextureLabel =
    stateLevel === 'calm'
      ? 'Ondas Suaves'
      : stateLevel === 'agitated'
        ? 'Padrão Geométrico'
        : 'Neutro'

  return (
    <div className="min-h-screen bg-[#0A192F] text-white flex flex-col relative overflow-hidden font-medium">
      <CrystalParticles show={showParticles} />

      <div className="absolute inset-0 pointer-events-none opacity-20">
        <Diamond
          className="absolute top-20 sm:top-32 left-6 sm:left-10 text-[#00FFFF] h-5 w-5 sm:h-6 sm:w-6 animate-float"
          fill="currentColor"
        />
        <Diamond
          className="absolute top-48 sm:top-64 right-12 sm:right-20 text-[#00FFFF]/60 h-3 w-3 sm:h-4 sm:w-4 animate-float"
          fill="currentColor"
          style={{ animationDuration: '6s' }}
        />
        <Diamond
          className="absolute bottom-32 sm:bottom-40 left-12 sm:left-20 text-[#00FFFF]/40 h-4 w-4 sm:h-5 sm:w-5 animate-float"
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
            Estado atual: {stateLabel}. Frequência cardíaca: {bpm} batimentos por minuto. Energia da
            calma: {Math.round(energy)} por cento. Cristais de foco: {crystals}. Cristais mestres:{' '}
            {masterCrystals}.
          </div>
          <div className="flex items-center gap-3">
            <ConnectionStatusTooltip
              state={mapToSensorState(connectionState, isConnecting, bleError)}
              error={bleError}
              onRetry={() => bleConnect()}
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
                <div className="space-y-3">
                  <h4 className="font-medium text-[#00FFFF]">Sensor Bluetooth (BLE)</h4>
                  <Button
                    variant={connectionState === 'connected' ? 'outline' : 'default'}
                    size="sm"
                    className="w-full"
                    onClick={connectionState === 'connected' ? bleDisconnect : bleConnect}
                    disabled={isConnecting || !bleSupported}
                  >
                    {isConnecting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : connectionState === 'connected' ? (
                      <BluetoothConnected className="h-4 w-4 mr-2" />
                    ) : (
                      <Bluetooth className="h-4 w-4 mr-2" />
                    )}
                    {isConnecting
                      ? 'Conectando...'
                      : connectionState === 'connected'
                        ? 'Conectado'
                        : 'Conectar Sensor'}
                  </Button>
                  {bleError && <p className="text-xs text-red-400">{bleError}</p>}
                  {connectionState === 'connected' && bleBpm && (
                    <p className="text-xs text-[#00FFFF]">BPM em tempo real: {bleBpm}</p>
                  )}
                  {!bleSupported && (
                    <p className="text-xs text-amber-400">
                      Bluetooth não suportado. Usando modo simulação.
                    </p>
                  )}
                </div>
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
            className="w-56 h-56 sm:w-80 sm:h-80 md:w-96 md:h-96 object-contain drop-shadow-2xl"
            style={{ filter: mascotFilter }}
          />
        </div>

        <div className="absolute right-1 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 flex flex-col items-center z-20">
          <span
            className="text-xs font-medium text-[#00FFFF]/70 mb-2 w-16 text-center leading-tight"
            id="energy-bar-label"
          >
            Energia da Calma
          </span>
          <div
            className="h-44 sm:h-56 w-7 sm:w-8 bg-white/10 rounded-full border border-[#00FFFF]/20 p-1 flex flex-col justify-end overflow-hidden relative"
            role="progressbar"
            aria-labelledby="energy-bar-label"
            aria-valuenow={Math.round(energy)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn(
                'w-full rounded-full transition-all duration-1000 relative overflow-hidden',
                energyColor,
                energyPulse,
                bpm >= 90 && 'border border-white/30',
              )}
              style={{ height: `${energy}%` }}
            >
              <div className={cn('absolute inset-0 rounded-full', energyPattern)} />
              <span className="text-white text-[9px] font-medium flex justify-center pt-1 relative z-10">
                {Math.round(energy)}%
              </span>
            </div>
          </div>
          <div className="mt-2 sm:mt-4 flex flex-col items-center bg-white/5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-[#00FFFF]/10">
            <Heart
              className={cn(
                'h-5 w-5 mb-1',
                stateLevel === 'calm'
                  ? 'text-[#00FFFF]'
                  : stateLevel === 'alert'
                    ? 'text-blue-400'
                    : 'text-white/40 animate-pulse',
              )}
              style={{ animationDuration: `${60 / bpm}s` }}
            />
            <span className="text-[10px] text-white/50 font-medium">BPM</span>
            <span className="font-medium text-white">{bpm}</span>
            <span
              className={cn(
                'text-[9px] mt-0.5 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1',
                stateLevel === 'calm'
                  ? 'bg-[#00FFFF]/20 text-[#00FFFF]'
                  : stateLevel === 'alert'
                    ? 'bg-blue-400/20 text-blue-300'
                    : 'bg-white/15 text-white/70',
              )}
              aria-live="polite"
              aria-label={`Estado: ${stateLabel}, Textura: ${stateTextureLabel}`}
            >
              {stateLevel === 'calm' && <Waves className="h-2.5 w-2.5" />}
              {stateLevel === 'agitated' && <Zap className="h-2.5 w-2.5" />}
              {stateLabel} · {stateTextureLabel}
            </span>
          </div>
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
