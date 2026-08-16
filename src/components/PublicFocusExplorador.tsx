import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Diamond, Pause, Play, Sparkles, Activity, Gamepad2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CrystalParticles } from '@/components/CrystalParticles'
import type { GuestFocusEntry } from '@/pages/FocusSessionRoute'

const FOCUS_DURATION = 5 * 60 // sessão pública mais curta (5 min)
const CALM_THRESHOLD = 70
const AGITATION_THRESHOLD = 90
const STABILITY_DURATION_REQUIRED = 30

interface Props {
  guestId: string
  onSave: (entry: GuestFocusEntry) => void
}

/**
 * Explorador da Calma — versão pública (sem login).
 * Mesma estética do GameEngine, mas sem Supabase: o progresso é salvo em
 * localStorage (modo convidado). Quando o usuário faz login, o FocusSessionRoute
 * sincroniza as sessões de convidado pendentes para o Supabase.
 */
export function PublicFocusExplorador({ guestId, onSave }: Props) {
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION)
  const [isActive, setIsActive] = useState(false)
  const [bpm, setBpm] = useState(72)
  const [energy, setEnergy] = useState(72)
  const [crystals, setCrystals] = useState(0)
  const [masterCrystals, setMasterCrystals] = useState(0)
  const [showParticles, setShowParticles] = useState(false)
  const [started, setStarted] = useState(false)
  const [ended, setEnded] = useState(false)

  const bpmRef = useRef(72)
  const energyRef = useRef(72)
  const crystalsRef = useRef(0)
  const masterRef = useRef(0)
  const stableDurationRef = useRef(0)
  const spikesRef = useRef(0)
  const startedAtRef = useRef<string | null>(null)
  const bpmLogRef = useRef<number[]>([])

  const triggerParticles = useCallback(() => {
    setShowParticles(true)
    setTimeout(() => setShowParticles(false), 2800)
  }, [])

  // Simulação de biofeedback (mock): oscila o BPM em torno de 72.
  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(() => {
      const cur = Math.max(
        50,
        Math.min(
          120,
          Math.round(bpmRef.current + (72 - bpmRef.current) * 0.2 + (Math.random() * 4 - 2)),
        ),
      )
      bpmRef.current = cur
      setBpm(cur)
      bpmLogRef.current.push(cur)
      if (bpmLogRef.current.length > 60) bpmLogRef.current.shift()

      let en = energyRef.current
      en =
        cur < CALM_THRESHOLD
          ? Math.min(100, en + 0.5)
          : cur >= AGITATION_THRESHOLD
            ? Math.max(0, en - 1)
            : en
      energyRef.current = en
      setEnergy(en)

      const isStable = cur < AGITATION_THRESHOLD
      if (isStable) {
        stableDurationRef.current += 1
        if (stableDurationRef.current >= STABILITY_DURATION_REQUIRED) {
          // ganho periódico de cristal por estabilidade
          crystalsRef.current += 1
          setCrystals(crystalsRef.current)
          triggerParticles()
          stableDurationRef.current = 0
        }
      } else {
        stableDurationRef.current = 0
        spikesRef.current += 1
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isActive, triggerParticles])

  useEffect(() => {
    if (!isActive) return
    if (timeLeft <= 0) {
      setIsActive(false)
      masterRef.current += 1
      setMasterCrystals(masterRef.current)
      triggerParticles()
      setEnded(true)
      const startedAt = startedAtRef.current || new Date().toISOString()
      const completedAt = new Date().toISOString()
      const bpms = bpmLogRef.current
      const avgBpm = bpms.length ? bpms.reduce((a, b) => a + b, 0) / bpms.length : null
      onSave({
        id: `${guestId}_${Date.now()}`,
        started_at: startedAt,
        completed_at: completedAt,
        crystals: crystalsRef.current,
        master_crystals: masterRef.current,
        duration_sec: FOCUS_DURATION,
        avg_bpm: avgBpm ? Math.round(avgBpm) : null,
      })
      return
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(interval)
  }, [isActive, timeLeft, guestId, onSave, triggerParticles])

  const handleStart = () => {
    setStarted(true)
    setEnded(false)
    startedAtRef.current = new Date().toISOString()
    setIsActive(true)
  }

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const stateLevel =
    bpm < CALM_THRESHOLD ? 'calm' : bpm < AGITATION_THRESHOLD ? 'alert' : 'agitated'

  if (!started) {
    return (
      <div className="min-h-screen bg-[#0A192F] text-[#E6F1FF] flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center">
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(0, 255, 255, 0.1)',
              border: '2px solid #00FFFF',
              boxShadow: '0 0 30px rgba(0, 255, 255, 0.33)',
            }}
          >
            <Gamepad2 className="h-10 w-10 text-[#00FFFF]" />
          </div>
          <h1 className="text-2xl font-bold text-[#E6F1FF] mb-2">Explorador da Calma</h1>
          <p className="text-sm text-[#00FFFF]/70 mb-2">
            Sessão pública de foco e biofeedback — sem necessidade de login.
          </p>
          <p className="text-xs text-white/50 mb-8 max-w-md mx-auto">
            Você está no modo convidado. Seu progresso será salvo localmente neste dispositivo. Faça
            login para sincronizar suas sessões com a nuvem e ganhar cristais permanentes.
          </p>
          <Button
            onClick={handleStart}
            className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full px-8 py-3 text-base font-semibold"
            style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.33)' }}
          >
            <Gamepad2 className="h-5 w-5 mr-2" />
            Iniciar Sessão
          </Button>
          <div className="mt-6 flex items-start gap-2 rounded-xl border border-[#00FFFF]/20 bg-[#00FFFF]/5 p-3 text-left max-w-md mx-auto">
            <Info className="h-4 w-4 text-[#00FFFF] shrink-0 mt-0.5" />
            <p className="text-xs text-white/70">
              Duração: 5 minutos. Mantenha a calma para coletar cristais. Nenhum dado biométrico
              pessoal é enviado para servidores no modo convidado.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (ended) {
    return (
      <div className="min-h-screen bg-[#0A192F] text-[#E6F1FF] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(0, 255, 255, 0.1)',
              border: '2px solid #00FFFF',
              boxShadow: '0 0 20px rgba(0, 255, 255, 0.33)',
            }}
          >
            <Sparkles className="h-8 w-8 text-[#00FFFF]" />
          </div>
          <h1 className="text-xl font-bold text-[#E6F1FF] mb-2">Sessão Concluída!</h1>
          <p className="text-sm text-[#00FFFF]/70 mb-6">
            Você coletou {crystals + masterCrystals} cristais.
          </p>
          <div className="rounded-xl border border-[#00FFFF]/20 bg-[#00FFFF]/5 p-4 mb-6 text-left">
            <p className="text-xs text-white/70">
              Progresso salvo localmente (modo convidado). Faça login para sincronizar com a nuvem.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 rounded-full"
              onClick={() => {
                setStarted(false)
                setEnded(false)
                setTimeLeft(FOCUS_DURATION)
                setCrystals(0)
                setMasterCrystals(0)
                crystalsRef.current = 0
                masterRef.current = 0
                bpmLogRef.current = []
              }}
            >
              Nova Sessão
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A192F] text-[#E6F1FF] flex flex-col relative overflow-hidden">
      <CrystalParticles show={showParticles} />

      <header className="p-4 sm:p-6 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Diamond className="h-5 w-5 text-[#00FFFF]" fill="currentColor" />
          <span className="font-medium text-sm">Explorador da Calma</span>
          <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
            Modo Convidado
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-[#00FFFF]/10 px-3 py-1.5 rounded-full">
            <span className="text-xs font-medium text-[#00FFFF]">BPM: {bpm}</span>
          </div>
          <div className="bg-[#00FFFF]/10 px-3 py-1.5 rounded-full flex items-center gap-1">
            <Diamond className="h-4 w-4 text-[#7FFFD4]" fill="currentColor" />
            <span className="text-[#7FFFD4] text-xs font-medium">{crystals + masterCrystals}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 relative flex items-center justify-center">
        <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
          <span className="text-xs font-medium text-[#00FFFF] mb-2">Energia</span>
          <div
            className="h-44 w-7 bg-white/10 rounded-full border border-[#00FFFF]/20 p-1 flex flex-col justify-end overflow-hidden"
            role="progressbar"
            aria-valuenow={energy}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="w-full rounded-full"
              style={{ height: `${energy}%`, backgroundColor: '#00FFFF' }}
            />
          </div>
          <span className="text-xs text-[#E6F1FF]/70 mt-2">{energy}%</span>
        </div>

        <div className="absolute left-1/2 z-10" style={{ transform: 'translateX(-50%)' }}>
          <div
            className={cn('transition-transform duration-1000 ease-in-out')}
            style={{ transform: `translateY(${stateLevel === 'agitated' ? 40 : 0}px)` }}
          >
            <div
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-full transition-all duration-1000"
              style={{
                background:
                  stateLevel === 'agitated'
                    ? 'radial-gradient(circle at 35% 35%, #4A5568, #0A192F)'
                    : 'radial-gradient(circle at 35% 35%, #00FFFF, #0A192F)',
                boxShadow:
                  stateLevel === 'agitated'
                    ? '0 0 20px rgba(74, 85, 104, 0.4)'
                    : '0 0 40px rgba(0, 255, 255, 0.5), 0 0 80px rgba(0, 255, 255, 0.2)',
              }}
            />
          </div>
        </div>

        {stableDurationRef.current > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
            <div className="flex items-center gap-2 bg-[#00FFFF]/5 px-4 py-2 rounded-full">
              <Activity className="h-4 w-4 text-[#7FFFD4] animate-pulse" />
              <span className="text-xs text-[#7FFFD4]">
                Estabilidade: {stableDurationRef.current}s / 30s
              </span>
            </div>
          </div>
        )}
      </main>

      <footer className="p-4 sm:p-6 z-30 flex flex-col items-center bg-gradient-to-t from-[#0A192F] to-transparent">
        <div className="text-3xl font-medium text-[#00FFFF] mb-2 tabular-nums">
          {formatTime(timeLeft)}
        </div>
        <div className="text-xs text-white/40 mb-4">Tempo de Foco</div>
        <Button
          size="icon"
          className="h-16 w-16 rounded-full bg-[#00FFFF] hover:bg-[#00FFFF]/90 text-[#0A192F] shadow-lg"
          onClick={() => setIsActive((a) => !a)}
        >
          {isActive ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-1" />}
        </Button>
      </footer>
    </div>
  )
}
