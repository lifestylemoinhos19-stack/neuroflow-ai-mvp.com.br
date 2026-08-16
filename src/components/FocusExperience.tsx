import '@/styles/neuro-animations.css'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Diamond,
  Pause,
  Play,
  Sparkles,
  Activity,
  Gamepad2,
  Info,
  Trophy,
  RotateCcw,
  Heart,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CrystalParticles } from '@/components/CrystalParticles'
import {
  useFocusSessionV2,
  type FocusDurationSec,
  type FocusPersistence,
  type FocusSessionResult,
  getRewardPhase,
} from '@/hooks/use-focus-session-v2'

const formatTime = (s: number) => {
  const safe = Math.max(0, Math.floor(s))
  return `${Math.floor(safe / 60)
    .toString()
    .padStart(2, '0')}:${(safe % 60).toString().padStart(2, '0')}`
}

const DURATION_OPTIONS: { value: FocusDurationSec; label: string }[] = [
  { value: 180, label: '3 min' },
  { value: 300, label: '5 min' },
  { value: 480, label: '8 min' },
]

const PHASE_STYLES: Record<1 | 2 | 3, { ring: string; chip: string }> = {
  1: { ring: 'border-[#7FFFD4]/40', chip: 'bg-[#7FFFD4]/10 text-[#7FFFD4]' },
  2: { ring: 'border-[#00FFFF]/50', chip: 'bg-[#00FFFF]/10 text-[#00FFFF]' },
  3: { ring: 'border-[#FFD700]/60', chip: 'bg-[#FFD700]/10 text-[#FFD700]' },
}

interface Props {
  persistence: FocusPersistence
  isGuest: boolean
  onExit?: () => void
}

/**
 * Sessão de Foco unificada (NeuroFlow AI).
 * - Tela inicial com seletor de duração (3/5/8 min, default 5).
 * - Sessão ativa: cristais automáticos a cada 30s, 3 fases, bolha responsiva,
 *   barras de progresso, mensagens motivacionais, partículas, som e vibração.
 * - Tela final com recompensa + "Repetir Sessão".
 * - Logado → Supabase; visitante → localStorage (mesma lógica, só muda o storage).
 */
export function FocusExperience({ persistence, isGuest, onExit }: Props) {
  const [duration, setDuration] = useState<FocusDurationSec>(300)
  const [started, setStarted] = useState(false)

  if (!started) {
    return (
      <StartScreen
        duration={duration}
        onSelect={setDuration}
        onStart={() => setStarted(true)}
        isGuest={isGuest}
      />
    )
  }

  return (
    <ActiveExperience
      durationSec={duration}
      persistence={persistence}
      isGuest={isGuest}
      onExit={onExit}
      onRepeat={() => setStarted(false)}
    />
  )
}

// --- Tela inicial ----------------------------------------------------------

function StartScreen({
  duration,
  onSelect,
  onStart,
  isGuest,
}: {
  duration: FocusDurationSec
  onSelect: (d: FocusDurationSec) => void
  onStart: () => void
  isGuest: boolean
}) {
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
        <p className="text-sm text-[#00FFFF]/85 mb-2">
          Sessão de foco e biofeedback com recompensas frequentes.
        </p>
        {isGuest && (
          <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/85 mb-4">
            Modo Convidado — progresso salvo neste dispositivo
          </span>
        )}

        <p className="text-xs text-white/80 mb-6 max-w-md mx-auto leading-relaxed">
          Fique confortável, respire com calma e mantenha o foco na bolha. Cristais surgem
          automaticamente quando você está relaxado!
        </p>

        <div className="mb-6">
          <p className="text-xs font-medium text-white/70 mb-2 uppercase tracking-wide">
            Duração da sessão
          </p>
          <div className="flex items-center justify-center gap-2">
            {DURATION_OPTIONS.map((opt) => {
              const active = opt.value === duration
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSelect(opt.value)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer',
                    active
                      ? 'bg-[#00FFFF] text-[#0A192F] border-[#00FFFF]'
                      : 'bg-white/5 text-white/80 border-white/15 hover:bg-white/10',
                  )}
                >
                  {opt.label}
                  {opt.value === 300 && (
                    <span className="ml-1 text-[10px] opacity-80">(padrão)</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <Button
          onClick={onStart}
          className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full px-8 py-3 text-base font-semibold"
          style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.33)' }}
        >
          <Gamepad2 className="h-5 w-5 mr-2" />
          Iniciar Sessão
        </Button>

        <div className="mt-6 flex items-start gap-2 rounded-xl border border-[#00FFFF]/20 bg-[#00FFFF]/5 p-3 text-left max-w-md mx-auto">
          <Info className="h-4 w-4 text-[#00FFFF] shrink-0 mt-0.5" />
          <p className="text-xs text-white/75 leading-relaxed">
            A cada 30 segundos de calma você ganha cristais automaticamente. Quanto mais tempo
            focado, mais valiosos os cristais — e ao final, um cristal mestre!
          </p>
        </div>
      </div>
    </div>
  )
}

// --- Experiência ativa + tela de conclusão ---------------------------------

function ActiveExperience({
  durationSec,
  persistence,
  isGuest,
  onExit,
  onRepeat,
}: {
  durationSec: FocusDurationSec
  persistence: FocusPersistence
  isGuest: boolean
  onExit?: () => void
  onRepeat: () => void
}) {
  const session = useFocusSessionV2({ durationSec, persistence })

  // ---- Tela de conclusão -------------------------------------------------
  if (session.screen === 'completed' && session.result) {
    return (
      <CompletedScreen
        result={session.result}
        isGuest={isGuest}
        showParticles={session.showParticles}
        onRepeat={onRepeat}
        onExit={onExit}
      />
    )
  }

  // ---- Tela ativa --------------------------------------------------------
  const phaseStyle = PHASE_STYLES[session.phase.phase]
  const calmPct = Math.min(100, (session.calmSeconds / 30) * 100)
  const totalProgressPct = Math.min(100, session.overallProgress)

  return (
    <div className="min-h-screen bg-[#0A192F] text-[#E6F1FF] flex flex-col relative overflow-hidden">
      <CrystalParticles show={session.showParticles} />

      {/* Cristais flutuantes decorativos */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <Diamond
          className="absolute top-20 left-6 text-[#00FFFF] h-5 w-5 animate-float"
          fill="currentColor"
        />
        <Diamond
          className="absolute top-48 right-12 text-[#00FFFF]/80 h-3 w-3 animate-float"
          fill="currentColor"
          style={{ animationDuration: '6s' }}
        />
      </div>

      {/* Mensagem motivacional flutuante (não bloqueia a tela) */}
      {session.floatingMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] pointer-events-none animate-fade-in-down">
          <div
            className={cn(
              'px-4 py-2 rounded-full backdrop-blur-sm border text-sm font-medium max-w-[90vw] text-center',
              session.floatingMessage.special
                ? 'bg-[#FFD700]/15 border-[#FFD700]/40 text-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.3)]'
                : 'bg-[#00FFFF]/15 border-[#00FFFF]/40 text-[#00FFFF] shadow-[0_0_20px_rgba(0,255,255,0.3)]',
            )}
          >
            {session.floatingMessage.text}
          </div>
        </div>
      )}

      <header className="p-4 sm:p-6 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Diamond className="h-5 w-5 text-[#00FFFF]" fill="currentColor" />
          <span className="font-medium text-sm">Explorador da Calma</span>
          {isGuest && (
            <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/85">
              Convidado
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Chip de fase atual */}
          <div
            className={cn(
              'px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-500',
              phaseStyle.chip,
              phaseStyle.ring,
              session.phaseFlash && 'scale-110',
            )}
          >
            Fase {session.phase.phase}: {session.phase.name}
          </div>
          {/* BPM */}
          <div
            className={cn(
              'px-3 py-1.5 rounded-full transition-colors duration-200',
              session.isCalm ? 'bg-[#00FFFF]/10' : 'bg-[#FFB347]/10',
            )}
          >
            <span
              className={cn(
                'text-xs font-medium tabular-nums',
                session.isCalm ? 'text-[#00FFFF]' : 'text-[#FFB347]',
              )}
            >
              BPM: {session.bpm}
            </span>
          </div>
          {/* Cristais */}
          <div className="bg-[#00FFFF]/10 px-3 py-1.5 rounded-full flex items-center gap-1 crystal-shine">
            <Diamond className="h-4 w-4 text-[#7FFFD4]" fill="currentColor" />
            <span
              key={session.crystalPulse}
              className="text-[#7FFFD4] text-xs font-medium tabular-nums nf-crystal-pop"
            >
              💎 x{session.totalCrystals}
            </span>
          </div>
          {onExit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full bg-white/5 border border-white/10 text-[#E6F1FF]/85 hover:bg-white/10"
              onClick={onExit}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>

      {/* Barra de progresso geral da sessão */}
      <div className="px-4 sm:px-6 z-30">
        <div className="flex items-center justify-between text-xs text-white/70 mb-1">
          <span className="font-medium">
            {formatTime(session.elapsed)} / {formatTime(session.durationSec)}
          </span>
          <span>{Math.round(totalProgressPct)}%</span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{
              width: `${totalProgressPct}%`,
              background: 'linear-gradient(90deg, #7FFFD4, #00FFFF, #FFD700)',
            }}
          />
        </div>
      </div>

      <main className="flex-1 relative flex items-center justify-center">
        {/* Barra de energia */}
        <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
          <span className="text-xs font-medium text-[#00FFFF] mb-2">Energia</span>
          <div
            className="h-44 w-7 bg-white/10 rounded-full border border-[#00FFFF]/20 p-1 flex flex-col justify-end overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(session.energy)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="w-full rounded-full nf-energy-pulse transition-all duration-300"
              style={{
                height: `${session.energy}%`,
                backgroundColor: session.isCalm ? '#00FFFF' : '#FFB347',
              }}
            />
          </div>
          <span className="text-xs text-[#E6F1FF]/70 mt-2">{Math.round(session.energy)}%</span>
        </div>

        {/* Bolha de biofeedback — mais responsiva às mudanças de BPM */}
        <div className="absolute left-1/2 z-10" style={{ transform: 'translateX(-50%)' }}>
          <div className="nf-balloon-float">
            <div
              className="transition-transform duration-300 ease-out"
              style={{
                transform: `translateY(${session.isCalm ? -8 : 40}px) scale(${session.isCalm ? 1.05 : 1})`,
              }}
            >
              <svg
                viewBox="0 0 200 280"
                className="w-32 h-44 sm:w-40 sm:h-56"
                aria-label="Bolha de calma"
              >
                <defs>
                  <radialGradient id="nfBubbleGrad" cx="35%" cy="35%">
                    <stop offset="0%" stopColor={session.isCalm ? '#7FFFD4' : '#4A5568'} />
                    <stop offset="60%" stopColor={session.isCalm ? '#00AAAA' : '#2A3548'} />
                    <stop offset="100%" stopColor="#0A192F" />
                  </radialGradient>
                  <filter id="nfBubbleGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation={session.isCalm ? 12 : 6} result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <ellipse
                  cx="100"
                  cy="90"
                  rx="70"
                  ry="80"
                  fill={session.isCalm ? '#00FFFF' : '#4A5568'}
                  opacity={session.isCalm ? 0.18 : 0.1}
                />
                <ellipse
                  cx="100"
                  cy="90"
                  rx="60"
                  ry="70"
                  fill="url(#nfBubbleGrad)"
                  filter="url(#nfBubbleGlow)"
                />
                <ellipse cx="78" cy="62" rx="12" ry="18" fill="white" opacity="0.35" />
                <path
                  d="M93 158 L100 168 L107 158 Z"
                  fill={session.isCalm ? '#00CCCC' : '#3A4558'}
                />
                <path
                  d="M100 168 Q92 200 100 230 Q108 255 100 275"
                  stroke={session.isCalm ? '#00FFFF' : '#4A5568'}
                  strokeWidth="1.5"
                  fill="none"
                  opacity="0.5"
                  strokeLinecap="round"
                />
              </svg>
              {session.isCalm && (
                <p className="text-center text-xs text-[#7FFFD4] mt-2 animate-fade-in font-medium">
                  Zona de calma — continue!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Barra "Próximo cristal em Xs" com contagem regressiva */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 w-64 max-w-[80vw]">
          <div className="flex items-center gap-2 bg-[#00FFFF]/5 px-4 py-2 rounded-full">
            <Sparkles className="h-4 w-4 text-[#7FFFD4] animate-pulse" />
            <span className="text-xs text-[#7FFFD4]">
              ✨ Próximo cristal em {session.nextCrystalIn}s
            </span>
          </div>
          <div className="w-40 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#7FFFD4] rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${calmPct}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-white/60">
            <Activity className="h-3 w-3" />
            <span>Calma acumulada: {session.calmSeconds}s / 30s</span>
          </div>
        </div>
      </main>

      <footer className="p-4 sm:p-6 z-30 flex flex-col items-center bg-gradient-to-t from-[#0A192F] to-transparent">
        <div className="text-3xl font-medium text-[#00FFFF] mb-2 tabular-nums">
          {formatTime(session.timeLeft)}
        </div>
        <div className="text-xs text-white/70 mb-4">
          {session.isActive ? 'Tempo de Foco' : 'Pausado'}
        </div>
        <div className="flex items-center gap-4">
          {onExit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-14 w-14 rounded-full bg-white/5 border border-white/10 text-[#E6F1FF]/85 hover:bg-white/10"
              onClick={onExit}
            >
              <X className="h-6 w-6" />
            </Button>
          )}
          <Button
            size="icon"
            className="h-16 w-16 rounded-full bg-[#00FFFF] hover:bg-[#00FFFF]/90 text-[#0A192F] shadow-lg"
            onClick={session.isActive ? session.pause : session.resume}
          >
            {session.isActive ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-1" />}
          </Button>
          {/* Espaço simétrico para centralizar */}
          <div className="h-14 w-14" aria-hidden />
        </div>
        <p className="text-[10px] text-white/70 mt-2">{onExit ? 'Sair' : '\u00A0'}</p>
      </footer>
    </div>
  )
}

// --- Tela de conclusão -----------------------------------------------------

function CompletedScreen({
  result,
  isGuest,
  showParticles,
  onRepeat,
  onExit,
}: {
  result: FocusSessionResult
  isGuest: boolean
  showParticles: boolean
  onRepeat: () => void
  onExit?: () => void
}) {
  const phaseName = getRewardPhase(Math.min(480, result.durationSec)).name
  return (
    <div className="min-h-screen bg-[#0A192F] text-[#E6F1FF] flex items-center justify-center p-6 relative overflow-hidden">
      <CrystalParticles show={showParticles} />
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <Diamond
          className="absolute top-20 left-10 text-[#00FFFF] h-8 w-8 animate-float"
          fill="currentColor"
        />
        <Diamond
          className="absolute bottom-32 right-16 text-[#FFD700] h-6 w-6 animate-float"
          fill="currentColor"
          style={{ animationDuration: '5s' }}
        />
      </div>

      <div className="z-10 max-w-md w-full text-center animate-fade-in-up">
        <div
          className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(255, 215, 0, 0.1)',
            border: '2px solid #FFD700',
            boxShadow: '0 0 30px rgba(255, 215, 0, 0.4)',
          }}
        >
          <Trophy className="h-10 w-10 text-[#FFD700]" />
        </div>
        <h1 className="text-2xl font-bold text-[#E6F1FF] mb-2">Sessão Concluída!</h1>
        <p className="text-sm text-[#00FFFF]/85 mb-6">
          {result.masterCrystals > 0
            ? 'Você alcançou o Foco Profundo e conquistou um cristal mestre! 🌟'
            : 'Parabéns pela sua jornada de auto-regulação!'}
        </p>

        <div className="bg-white/5 rounded-3xl border border-[#00FFFF]/20 p-6 mb-6 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Diamond className="h-8 w-8 text-[#00FFFF]" fill="currentColor" />
            <span className="text-5xl font-medium text-[#00FFFF] tabular-nums">
              {result.crystals + result.masterCrystals}
            </span>
          </div>
          <p className="text-white/70 text-xs mb-4">Cristais Coletados</p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-[#00FFFF]/5 rounded-2xl p-3 border border-[#00FFFF]/10">
              <div className="flex items-center justify-center mb-1">
                <Diamond className="h-4 w-4 text-[#00FFFF] mr-1" fill="currentColor" />
                <span className="text-2xl font-medium text-white">{result.crystals}</span>
              </div>
              <span className="text-[10px] text-white/75">Cristais de Foco</span>
            </div>
            <div className="bg-[#FFD700]/5 rounded-2xl p-3 border border-[#FFD700]/10">
              <div className="flex items-center justify-center mb-1">
                <Diamond className="h-4 w-4 text-[#FFD700] mr-1" fill="currentColor" />
                <span className="text-2xl font-medium text-white">{result.masterCrystals}</span>
              </div>
              <span className="text-[10px] text-white/75">Cristais Mestres</span>
            </div>
          </div>

          <div className="space-y-2 text-left">
            <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2">
              <div className="flex items-center">
                <Heart className="h-4 w-4 text-[#00FFFF] mr-2" />
                <span className="text-xs text-white/70">BPM médio</span>
              </div>
              <span className="text-xs text-white">{result.avgBpm ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2">
              <div className="flex items-center">
                <Activity className="h-4 w-4 text-[#00FFFF] mr-2" />
                <span className="text-xs text-white/70">Fase alcançada</span>
              </div>
              <span className="text-xs text-[#00FFFF]">
                {phaseName} (Fase {result.phaseReached})
              </span>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-white/70 mb-4">
          {isGuest
            ? 'Progresso salvo localmente (modo convidado). Faça login para sincronizar com a nuvem.'
            : 'Progresso salvo na nuvem com sucesso.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={onRepeat}
            className="flex-1 bg-[#00FFFF] hover:bg-[#00FFFF]/90 text-[#0A192F] font-medium rounded-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Repetir Sessão
          </Button>
          {onExit && (
            <Button
              variant="outline"
              onClick={onExit}
              className="flex-1 bg-white/5 border-[#00FFFF]/20 text-white hover:bg-white/10 font-medium rounded-full"
            >
              Sair
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
