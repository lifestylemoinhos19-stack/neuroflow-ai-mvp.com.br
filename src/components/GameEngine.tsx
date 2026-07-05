import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Diamond, Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GameController, GameControllerState } from '@/lib/game-controller'
import { useFocusSession } from '@/hooks/use-focus-session'
import { CrystalParticles } from '@/components/CrystalParticles'

interface Props {
  controller: GameController
  onExit: () => void
}

const formatTime = (s: number) =>
  `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

function getEnergyColor(bpm: number): string {
  if (bpm < 70) return '#00FFFF'
  if (bpm > 100) return '#FFD700'
  return '#7DF9FF'
}

function getPulseClass(bpm: number): string {
  if (bpm < 70) return 'animate-pulse-slow'
  if (bpm > 100) return 'animate-pulse-fast'
  return 'animate-pulse'
}

export function GameEngine({ controller, onExit }: Props) {
  const [state, setState] = useState<GameControllerState>(controller.getState())
  const session = useFocusSession('camera')

  useEffect(() => {
    const unsubscribe = controller.subscribe(setState)
    controller.start()
    return () => {
      unsubscribe()
      controller.stop()
    }
  }, [controller])

  useEffect(() => {
    if (state.bpm > 0) {
      session.setExternalBpm(state.bpm)
      if (session.mockSensor) session.setMockSensor(false)
    }
  }, [state.bpm, session])

  const energyColor = getEnergyColor(state.bpm)
  const pulseClass = getPulseClass(state.bpm)

  return (
    <div className="min-h-screen bg-[#0A192F] text-[#E6F1FF] flex flex-col relative overflow-hidden">
      <CrystalParticles show={session.showParticles} />

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

      <header className="p-4 sm:p-6 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Diamond className="h-5 w-5 text-[#00FFFF]" fill="currentColor" />
          <span className="font-medium text-[#E6F1FF] text-sm">Explorador da Calma</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-[#00FFFF]/10 px-3 py-1.5 rounded-full">
            <span className="text-[#00FFFF] text-xs sm:text-sm font-medium">BPM: {state.bpm}</span>
          </div>
          <div className="bg-[#00FFFF]/10 px-3 py-1.5 rounded-full">
            <span className="text-[#00FFFF] text-xs sm:text-sm font-medium">
              Energia: {state.energy}%
            </span>
          </div>
          <div className="bg-[#00FFFF]/10 px-3 py-1.5 rounded-full flex items-center gap-1">
            <Diamond className="h-4 w-4 text-[#00FFFF]" fill="currentColor" />
            <span className="text-[#00FFFF] text-xs sm:text-sm font-medium">
              {session.crystals + session.masterCrystals}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 relative flex items-center justify-center">
        <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
          <span className="text-xs font-medium text-[#00FFFF] mb-2 w-16 text-center">Energia</span>
          <div
            className="h-44 w-7 bg-white/10 rounded-full border border-[#00FFFF]/20 p-1 flex flex-col justify-end overflow-hidden"
            role="progressbar"
            aria-valuenow={state.energy}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn('w-full rounded-full transition-all duration-1000', pulseClass)}
              style={{ height: `${state.energy}%`, backgroundColor: energyColor }}
            />
          </div>
          <span className="text-xs text-[#E6F1FF]/70 mt-2 font-medium">{state.bpm} BPM</span>
        </div>

        <div
          className="absolute left-1/2 -translate-x-1/2 transition-all duration-1000 ease-in-out z-10"
          style={{ bottom: `${state.altitude}%` }}
        >
          <div
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #00FFFF, #0A192F)',
              boxShadow: '0 0 40px rgba(0, 255, 255, 0.5), 0 0 80px rgba(0, 255, 255, 0.2)',
            }}
          />
        </div>
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
        </div>
        <p className="text-[10px] text-white/30 mt-2">Sair</p>
      </footer>
    </div>
  )
}
