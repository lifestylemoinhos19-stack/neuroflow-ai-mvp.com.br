import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Diamond, Heart, Activity, Clock, Home, RotateCcw } from 'lucide-react'
import { CrystalParticles } from '@/components/CrystalParticles'
import { supabase } from '@/lib/supabase/client'

interface SummaryState {
  sessionId?: string
  crystals: number
  masterCrystals: number
  vrc?: number
}

export default function SessionSummary() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as SummaryState | null

  const [session, setSession] = useState<any>(null)
  const [showParticles, setShowParticles] = useState(true)
  const [loading, setLoading] = useState(!!state?.sessionId)

  useEffect(() => {
    if (state?.sessionId) {
      supabase
        .from('focus_sessions')
        .select('*')
        .eq('id', state.sessionId)
        .single()
        .then(({ data }) => {
          setSession(data)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
    const t = setTimeout(() => setShowParticles(false), 3000)
    return () => clearTimeout(t)
  }, [state])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A192F] text-white flex items-center justify-center">
        <div className="text-[#00FFFF] animate-pulse font-medium">Carregando resumo...</div>
      </div>
    )
  }

  if (!state && !session) {
    return (
      <div className="min-h-screen bg-[#0A192F] text-white flex items-center justify-center">
        <Button onClick={() => navigate('/')} className="bg-[#00FFFF] text-[#0A192F]">
          Voltar ao início
        </Button>
      </div>
    )
  }

  const crystals = state?.crystals ?? session?.crystals_earned ?? 0
  const masterCrystals = state?.masterCrystals ?? session?.master_crystals ?? 0
  const vrc = state?.vrc ?? session?.vrc ?? 0
  const totalCrystals = crystals + masterCrystals
  const startedAt = session?.started_at ? new Date(session.started_at) : null
  const completedAt = session?.completed_at ? new Date(session.completed_at) : null
  const durationMin =
    startedAt && completedAt ? Math.round((completedAt.getTime() - startedAt.getTime()) / 60000) : 0

  const vrcStatus =
    vrc >= 40
      ? { label: 'Excelente', color: 'text-[#00FFFF]' }
      : vrc >= 20
        ? { label: 'Bom', color: 'text-blue-400' }
        : { label: 'Em desenvolvimento', color: 'text-white/60' }

  return (
    <div className="min-h-screen bg-[#0A192F] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-medium">
      <CrystalParticles show={showParticles} />

      <div className="absolute inset-0 pointer-events-none opacity-10">
        <Diamond
          className="absolute top-20 left-10 text-[#00FFFF] h-8 w-8 animate-float"
          fill="currentColor"
        />
        <Diamond
          className="absolute bottom-32 right-16 text-[#00FFFF] h-6 w-6 animate-float"
          fill="currentColor"
          style={{ animationDuration: '5s' }}
        />
      </div>

      <div className="z-10 max-w-md w-full text-center animate-fade-in-up">
        <div className="mb-2">
          <span className="text-[#00FFFF]/70 text-sm font-medium tracking-wide uppercase">
            Sessão Concluída
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-medium text-white tracking-tight mb-2">
          O Explorador da Calma
        </h1>
        <p className="text-white/60 font-medium text-sm mb-8">
          Parabéns pela jornada de auto-regulação!
        </p>

        <div className="bg-white/5 rounded-3xl border border-[#00FFFF]/20 p-8 mb-6 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Diamond className="h-10 w-10 text-[#00FFFF]" fill="currentColor" />
            <span className="text-5xl font-medium text-[#00FFFF] tabular-nums">
              {totalCrystals}
            </span>
          </div>
          <p className="text-white/70 font-medium text-sm mb-4">Cristais Coletados</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-[#00FFFF]/5 rounded-2xl p-4 border border-[#00FFFF]/10">
              <div className="flex items-center justify-center mb-1">
                <Diamond className="h-4 w-4 text-[#00FFFF] mr-1" fill="currentColor" />
                <span className="text-2xl font-medium text-white">{crystals}</span>
              </div>
              <span className="text-xs text-white/50 font-medium">Cristais de Foco</span>
            </div>
            <div className="bg-[#00FFFF]/5 rounded-2xl p-4 border border-[#00FFFF]/10">
              <div className="flex items-center justify-center mb-1">
                <Diamond className="h-4 w-4 text-[#00FFFF] mr-1" fill="currentColor" />
                <span className="text-2xl font-medium text-white">{masterCrystals}</span>
              </div>
              <span className="text-xs text-white/50 font-medium">Cristais Mestres</span>
            </div>
          </div>

          <div className="space-y-3 text-left">
            <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
              <div className="flex items-center">
                <Heart className="h-4 w-4 text-[#00FFFF] mr-2" />
                <span className="text-sm font-medium text-white/70">VRC (Variabilidade)</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-white">{vrc.toFixed(1)} ms</span>
                <span className={`text-xs ml-2 ${vrcStatus.color}`}>{vrcStatus.label}</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-[#00FFFF] mr-2" />
                <span className="text-sm font-medium text-white/70">Duração</span>
              </div>
              <span className="text-sm font-medium text-white">{durationMin} min</span>
            </div>
            <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
              <div className="flex items-center">
                <Activity className="h-4 w-4 text-[#00FFFF] mr-2" />
                <span className="text-sm font-medium text-white/70">Status</span>
              </div>
              <span className="text-sm font-medium text-[#00FFFF]">Concluído</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate('/focus-session')}
            className="flex-1 bg-[#00FFFF] hover:bg-[#00FFFF]/90 text-[#0A192F] font-medium rounded-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Nova Sessão
          </Button>
          <Button
            asChild
            variant="outline"
            className="flex-1 bg-white/5 border-[#00FFFF]/20 text-white hover:bg-white/10 font-medium rounded-full"
          >
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Início
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
