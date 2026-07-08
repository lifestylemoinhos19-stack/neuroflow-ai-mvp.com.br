import '@/styles/neuro-animations.css'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Diamond, Pause, Play, Sparkles, Bug, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GameController, GameControllerState } from '@/lib/game-controller'
import { useFocusSession } from '@/hooks/use-focus-session'
import { CrystalParticles } from '@/components/CrystalParticles'
import { EventLogOverlay } from '@/components/EventLogOverlay'
import { BreathingOverlay } from '@/components/BreathingOverlay'

interface Props {
  controller: GameController
  onExit: () => void
  externalBpm?: number | null
  biometricConnected?: boolean
}

const formatTime = (s: number) =>
  `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

export function GameEngine({ controller, onExit, externalBpm, biometricConnected }: Props) {
  const [state, setState] = useState<GameControllerState>(controller.getState())
  const [showParticles, setShowParticles] = useState(false)
  const [showBreathing, setShowBreathing] = useState(false)
  const session = useFocusSession('camera')

  useEffect(() => {
    if (session.prolongedAgitation && !showBreathing) {
      setShowBreathing(true)
    }
  }, [session.prolongedAgitation, showBreathing])

  const isAgitated = state.bpm > 90
  const isInRestZone = isAgitated && state.simulationMode !== 'simulation'

  useEffect(() => {
    const unsubscribe = controller.subscribe(setState)
    controller.start()
    return () => {
      unsubscribe()
      controller.stop()
    }
  }, [controller])

  useEffect(() => {
    if (externalBpm !== undefined && externalBpm !== null) {
      controller.setExternalBpm(externalBpm)
    }
  }, [externalBpm, controller])

  useEffect(() => {
    if (biometricConnected !== undefined) {
      controller.setBiometricConnected(biometricConnected)
    }
  }, [biometricConnected, controller])

  useEffect(() => {
    if (state.bpm > 0) {
      session.setExternalBpm(state.bpm)
      if (session.mockSensor) session.setMockSensor(false)
    }
  }, [state.bpm, session])

  const handleCollectCrystal = () => {
    controller.collectCrystal()
    session.addCrystal()
    setShowParticles(true)
    setTimeout(() => setShowParticles(false), 2800)
  }

  const energyColor = state.simulationMode === 'simulation' ? '#FFB347' : '#00FFFF'

  return (
    <div className="min-h-screen bg-[#0A192F] text-[#E6F1FF] flex flex-col relative overflow-hidden">
      <CrystalParticles show={showParticles} />

      {showBreathing && <BreathingOverlay onClose={() => setShowBreathing(false)} />}

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
      </div>

      <header className="p-4 sm:p-6 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Diamond className="h-5 w-5 text-[#00FFFF]" fill="currentColor" />
          <span className="font-medium text-sm">Explorador da Calma</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'px-3 py-1.5 rounded-full',
              state.simulationMode === 'simulation' ? 'bg-[#FFB347]/10' : 'bg-[#00FFFF]/10',
            )}
          >
            <span
              className={cn(
                'text-xs font-medium',
                state.simulationMode === 'simulation' ? 'text-[#FFB347]' : 'text-[#00FFFF]',
              )}
            >
              BPM: {state.bpm}
            </span>
          </div>
          <div className="bg-[#00FFFF]/10 px-3 py-1.5 rounded-full flex items-center gap-1 crystal-shine">
            <Diamond className="h-4 w-4 text-[#7FFFD4]" fill="currentColor" />
            <span className="text-[#7FFFD4] text-xs font-medium">
              {state.crystals + session.masterCrystals}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'rounded-full text-xs h-8',
              state.simulationMode === 'simulation'
                ? 'bg-[#FFB347]/10 text-[#FFB347]'
                : 'bg-white/5 text-white/50',
            )}
            onClick={() => controller.toggleSimulation()}
          >
            <Bug className="h-3.5 w-3.5 mr-1" />
            {state.simulationMode === 'simulation' ? 'SIM' : 'REAL'}
          </Button>
        </div>
      </header>

      <main className="flex-1 relative flex items-center justify-center">
        <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
          <span className="text-xs font-medium text-[#00FFFF] mb-2">Energia</span>
          <div
            className="h-44 w-7 bg-white/10 rounded-full border border-[#00FFFF]/20 p-1 flex flex-col justify-end overflow-hidden"
            role="progressbar"
            aria-valuenow={state.energy}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="w-full rounded-full nf-energy-pulse"
              style={{ height: `${state.energy}%`, backgroundColor: energyColor }}
            />
          </div>
          <span className="text-xs text-[#E6F1FF]/70 mt-2">{state.energy}%</span>
        </div>

        <div className="absolute left-1/2 z-10" style={{ transform: 'translateX(-50%)' }}>
          <div className={cn('nf-balloon-float', isInRestZone && 'opacity-60')}>
            <div
              className="transition-all duration-1000 ease-in-out"
              style={{
                transform: `translateY(${isInRestZone ? 80 : state.balloonOffset}px)`,
              }}
            >
              <div
                className={cn(
                  'w-32 h-32 sm:w-40 sm:h-40 rounded-full transition-all duration-1000',
                  isInRestZone && 'scale-90',
                )}
                style={{
                  background: isInRestZone
                    ? 'radial-gradient(circle at 35% 35%, #4A5568, #0A192F)'
                    : 'radial-gradient(circle at 35% 35%, #00FFFF, #0A192F)',
                  boxShadow: isInRestZone
                    ? '0 0 20px rgba(74, 85, 104, 0.4)'
                    : '0 0 40px rgba(0, 255, 255, 0.5), 0 0 80px rgba(0, 255, 255, 0.2)',
                }}
              />
              {isInRestZone && (
                <p className="text-center text-xs text-white/50 mt-2 animate-fade-in">
                  Zona de descanso — respire fundo
                </p>
              )}
            </div>
          </div>
        </div>

        {state.stabilitySeconds > 0 && !state.canCollectCrystal && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
            <div className="flex items-center gap-2 bg-[#00FFFF]/5 px-4 py-2 rounded-full">
              <Activity className="h-4 w-4 text-[#7FFFD4] animate-pulse" />
              <span className="text-xs text-[#7FFFD4]">
                Estabilidade: {state.stabilitySeconds}s / 30s
              </span>
            </div>
          </div>
        )}
      </main>

      <footer className="p-4 sm:p-6 z-30 flex flex-col items-center bg-gradient-to-t from-[#0A192F] to-transparent">
        <div className="text-3xl font-medium text-[#00FFFF] mb-2 tabular-nums">
          {formatTime(session.timeLeft)}
        </div>
        <div className="text-xs text-white/40 mb-4">
          {session.phase === 'focus' ? 'Tempo de Foco' : 'Tempo de Pausa'}
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-14 w-14 rounded-full bg-white/5 border border-white/10 text-[#E6F1FF]/60 hover:bg-white/10"
            onClick={onExit}
          >
            <X className="h-6 w-6" />
          </Button>
          <Button
            size="icon"
            className="h-16 w-16 rounded-full bg-[#00FFFF] hover:bg-[#00FFFF]/90 text-[#0A192F] shadow-lg"
            onClick={session.toggleActive}
          >
            {session.isActive ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-1" />}
          </Button>
          {state.canCollectCrystal && (
            <Button
              className="h-14 px-6 rounded-full bg-[#7FFFD4] hover:bg-[#7FFFD4]/90 text-[#0A192F] shadow-lg crystal-pop animate-fade-in-up"
              onClick={handleCollectCrystal}
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Coletar Cristal
            </Button>
          )}
        </div>
        <p className="text-[10px] text-white/30 mt-2">Sair</p>
      </footer>

      <EventLogOverlay events={state.events} />
    </div>
  )
}
