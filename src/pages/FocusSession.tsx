import { useEffect } from 'react'
import { useFocusSession } from '@/hooks/use-focus-session'
import { useHeartRate } from '@/hooks/use-heart-rate'
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
  Camera,
  Video,
  Waves,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CrystalParticles } from '@/components/CrystalParticles'
import { useRppg } from '@/hooks/use-rppg'

const formatTime = (s: number) =>
  `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

export default function FocusSession() {
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
    mockBpmTarget,
    stateLevel,
    setMockSensor,
    setMockBpmTarget,
    setExternalBpm,
    toggleActive,
    handleCancel,
  } = useFocusSession()

  const {
    isConnected: btConnected,
    isConnecting: btConnecting,
    isSupported: btSupported,
    connect: btConnect,
    disconnect: btDisconnect,
    bpm: btBpm,
    error: btError,
  } = useHeartRate()

  useEffect(() => {
    if (btBpm !== null) {
      setExternalBpm(btBpm)
      if (mockSensor) setMockSensor(false)
    }
  }, [btBpm, mockSensor, setExternalBpm, setMockSensor])

  const {
    bpm: rppgBpm,
    isConnected: rppgConnected,
    isConnecting: rppgConnecting,
    isSupported: rppgSupported,
    connect: rppgConnect,
    disconnect: rppgDisconnect,
    error: rppgError,
  } = useRppg()

  useEffect(() => {
    if (rppgBpm !== null) {
      setExternalBpm(rppgBpm)
      if (mockSensor) setMockSensor(false)
    }
  }, [rppgBpm, mockSensor, setExternalBpm, setMockSensor])

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
          className="absolute top-32 left-10 text-[#00FFFF] h-6 w-6 animate-float"
          fill="currentColor"
        />
        <Diamond
          className="absolute top-64 right-20 text-[#00FFFF]/60 h-4 w-4 animate-float"
          fill="currentColor"
          style={{ animationDuration: '6s' }}
        />
        <Diamond
          className="absolute bottom-40 left-20 text-[#00FFFF]/40 h-5 w-5 animate-float"
          fill="currentColor"
          style={{ animationDuration: '2s' }}
        />
      </div>

      <header className="p-6 pb-2 z-10 flex flex-col items-center text-center">
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
            {btConnected && (
              <div className="bg-emerald-500/10 px-3 py-1 rounded-full flex items-center text-sm font-medium text-emerald-400">
                <BluetoothConnected className="h-4 w-4 mr-1" /> HR
              </div>
            )}
            {rppgConnected && (
              <div className="bg-emerald-500/10 px-3 py-1 rounded-full flex items-center text-sm font-medium text-emerald-400">
                <Camera className="h-4 w-4 mr-1" /> Cam
              </div>
            )}
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
                className="w-80 p-4 bg-[#0A192F] border-[#00FFFF]/20 text-white"
                align="end"
              >
                <div className="space-y-4">
                  <h4 className="font-medium text-[#00FFFF]">Configurações de Biofeedback</h4>
                  {btSupported && (
                    <div className="space-y-2">
                      <Label className="text-white/80">Sensor Bluetooth (HR Real)</Label>
                      <Button
                        variant={btConnected ? 'outline' : 'default'}
                        size="sm"
                        className="w-full"
                        onClick={btConnected ? btDisconnect : btConnect}
                        disabled={btConnecting}
                      >
                        {btConnecting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : btConnected ? (
                          <BluetoothConnected className="h-4 w-4 mr-2" />
                        ) : (
                          <Bluetooth className="h-4 w-4 mr-2" />
                        )}
                        {btConnecting
                          ? 'Conectando...'
                          : btConnected
                            ? 'Conectado'
                            : 'Conectar Sensor'}
                      </Button>
                      {btError && <p className="text-xs text-red-400">{btError}</p>}
                      {btConnected && btBpm && (
                        <p className="text-xs text-[#00FFFF]">BPM em tempo real: {btBpm}</p>
                      )}
                    </div>
                  )}
                  {rppgSupported && (
                    <div className="space-y-2">
                      <Label className="text-white/80">Câmera rPPG (Óptico)</Label>
                      <Button
                        variant={rppgConnected ? 'outline' : 'default'}
                        size="sm"
                        className="w-full"
                        onClick={rppgConnected ? rppgDisconnect : rppgConnect}
                        disabled={rppgConnecting || btConnected}
                      >
                        {rppgConnecting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : rppgConnected ? (
                          <Camera className="h-4 w-4 mr-2" />
                        ) : (
                          <Video className="h-4 w-4 mr-2" />
                        )}
                        {rppgConnecting
                          ? 'Iniciando...'
                          : rppgConnected
                            ? 'Câmera Ativa'
                            : 'Usar Câmera'}
                      </Button>
                      {rppgError && <p className="text-xs text-red-400">{rppgError}</p>}
                      {rppgConnected && rppgBpm && (
                        <p className="text-xs text-[#00FFFF]">BPM via câmera: {rppgBpm}</p>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <Label className="text-white/80">Sensor Mock (Simulação)</Label>
                    <Switch
                      checked={mockSensor}
                      onCheckedChange={setMockSensor}
                      disabled={btConnected || rppgConnected}
                    />
                  </div>
                  {mockSensor && (
                    <div className="space-y-2">
                      <Label className="text-white/80">BPM Alvo ({mockBpmTarget})</Label>
                      <Slider
                        value={[mockBpmTarget]}
                        onValueChange={(v) => setMockBpmTarget(v[0])}
                        min={50}
                        max={150}
                        step={1}
                      />
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight mt-2">
          O EXPLORADOR DA CALMA
        </h1>
        <p className="text-[#00FFFF]/70 font-medium text-sm mt-1">
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

      <main className="flex-1 relative flex items-center justify-center w-full max-w-md mx-auto px-6">
        <div
          className={cn(
            'relative z-10 transition-all duration-1000',
            stateLevel === 'agitated' && phase === 'focus'
              ? 'translate-y-20 opacity-60'
              : 'opacity-100',
          )}
          style={{ animation: `float ${floatDuration} ease-in-out infinite` }}
        >
          <img
            src="https://img.usecurling.com/p/256/256?q=hot%20air%20balloon%20cute&color=cyan"
            alt="Explorador da Calma"
            className="w-48 h-48 object-contain drop-shadow-2xl"
            style={{ filter: mascotFilter }}
          />
        </div>

        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center z-20">
          <span
            className="text-xs font-medium text-[#00FFFF]/70 mb-2 w-16 text-center leading-tight"
            id="energy-bar-label"
          >
            Energia da Calma
          </span>
          <div
            className="h-56 w-8 bg-white/10 rounded-full border border-[#00FFFF]/20 p-1 flex flex-col justify-end overflow-hidden relative"
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
          <div className="mt-4 flex flex-col items-center bg-white/5 px-3 py-2 rounded-xl border border-[#00FFFF]/10">
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

      <footer className="p-6 z-10 flex flex-col items-center bg-gradient-to-t from-[#0A192F] to-transparent">
        <div className="text-4xl font-medium text-[#00FFFF] mb-2 tabular-nums">
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
