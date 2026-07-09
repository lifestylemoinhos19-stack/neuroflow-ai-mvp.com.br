import { supabase } from '@/lib/supabase/client'

export interface PatientEvaluation {
  feedback_id: string
  session_id: string
  started_at: string
  completed_at: string | null
  status: string
  phq9_score: number | null
  gad7_score: number | null
  snap_iv_inattention: number | null
  snap_iv_hyperactivity: number | null
  snap_iv_score: number | null
  moca_score: number | null
  assq_score: number | null
  asrs18_score: number | null
  meem_score: number | null
  hamd_score: number | null
  hama_score: number | null
  system_suggestion: string | null
  admin_edited_interpretation: string | null
  global_severity: string | null
  cognitive_vrc: number | null
}

export interface PatientInfo {
  user_id: string
  full_name: string
  guest_id: string | null
  email: string | null
  evaluation_count: number
}

export interface ScoreTrend {
  instrument: string
  label: string
  currentScore: number | null
  previousScore: number | null
  delta: number | null
  percentageChange: number | null
  isImprovement: boolean | null
  direction: 'up' | 'down' | 'stable' | 'unknown'
}

const instrumentMeta: Record<string, { label: string; lowerIsBetter: boolean }> = {
  phq9_score: { label: 'PHQ-9 (Depressão)', lowerIsBetter: true },
  gad7_score: { label: 'GAD-7 (Ansiedade)', lowerIsBetter: true },
  snap_iv_inattention: { label: 'SNAP-IV Desatenção', lowerIsBetter: true },
  snap_iv_hyperactivity: { label: 'SNAP-IV Hiperatividade', lowerIsBetter: true },
  snap_iv_score: { label: 'SNAP-IV (Média)', lowerIsBetter: true },
  moca_score: { label: 'MoCA (Cognição)', lowerIsBetter: false },
  assq_score: { label: 'ASSQ', lowerIsBetter: true },
  hamd_score: { label: 'HAM-D', lowerIsBetter: true },
  hama_score: { label: 'HAM-A', lowerIsBetter: true },
}

export async function getPatientsWithEvaluations(): Promise<PatientInfo[]> {
  const { data: sessions } = await supabase
    .from('anamnesis_sessions')
    .select('user_id')
    .not('user_id', 'is', null)

  if (!sessions || sessions.length === 0) return []

  const userIds = [...new Set(sessions.map((s) => s.user_id).filter(Boolean))] as string[]

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, guest_id')
    .in('id', userIds)

  const guestIds = (profiles || []).map((p) => p.guest_id).filter(Boolean) as string[]

  let guests: any[] = []
  if (guestIds.length > 0) {
    const { data: guestData } = await supabase
      .from('guests')
      .select('id, first_name, last_name, email')
      .in('id', guestIds)
    guests = guestData || []
  }

  return userIds.map((userId) => {
    const profile = profiles?.find((p) => p.id === userId)
    const guest = guests.find((g) => g.id === profile?.guest_id)
    const evaluationCount = sessions.filter((s) => s.user_id === userId).length
    const fullName = guest
      ? `${guest.first_name} ${guest.last_name}`.trim()
      : profile?.full_name || 'Paciente'
    return {
      user_id: userId,
      full_name: fullName,
      guest_id: profile?.guest_id || null,
      email: guest?.email || null,
      evaluation_count: evaluationCount,
    }
  })
}

export async function getPatientEvaluations(userId: string): Promise<PatientEvaluation[]> {
  const { data: sessions } = await supabase
    .from('anamnesis_sessions')
    .select('id, started_at, completed_at, status')
    .eq('user_id', userId)
    .order('started_at', { ascending: true })

  if (!sessions || sessions.length === 0) return []

  const sessionIds = sessions.map((s) => s.id)
  const { data: feedback } = await supabase
    .from('clinical_feedback')
    .select('*')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: true })

  if (!feedback || feedback.length === 0) return []

  const evaluations: PatientEvaluation[] = (feedback as any[]).map((fb) => {
    const session = sessions.find((s) => s.id === fb.session_id)
    return {
      feedback_id: fb.id,
      session_id: fb.session_id,
      started_at: session?.started_at || fb.created_at,
      completed_at: session?.completed_at || null,
      status: session?.status || 'completed',
      phq9_score: fb.phq9_score ?? null,
      gad7_score: fb.gad7_score ?? null,
      snap_iv_inattention: fb.snap_iv_inattention ?? null,
      snap_iv_hyperactivity: fb.snap_iv_hyperactivity ?? null,
      snap_iv_score: fb.snap_iv_score ?? null,
      moca_score: fb.moca_score ?? null,
      assq_score: fb.assq_score ?? null,
      asrs18_score: fb.asrs18_score ?? null,
      meem_score: fb.meem_score ?? null,
      hamd_score: fb.hamd_score ?? null,
      hama_score: fb.hama_score ?? null,
      system_suggestion: fb.system_suggestion ?? null,
      admin_edited_interpretation: fb.admin_edited_interpretation ?? null,
      global_severity: fb.global_severity ?? null,
      cognitive_vrc: fb.cognitive_vrc ?? null,
    }
  })

  evaluations.sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())
  return evaluations
}

export function computeTrends(evaluations: PatientEvaluation[]): ScoreTrend[] {
  if (evaluations.length < 2) return []
  const latest = evaluations[evaluations.length - 1]
  const previous = evaluations[evaluations.length - 2]

  return Object.entries(instrumentMeta).map(([key, meta]) => {
    const currentScore = (latest as any)[key] as number | null
    const previousScore = (previous as any)[key] as number | null
    let delta: number | null = null
    let percentageChange: number | null = null
    let direction: 'up' | 'down' | 'stable' | 'unknown' = 'unknown'
    let isImprovement: boolean | null = null

    if (currentScore !== null && previousScore !== null) {
      delta = +(currentScore - previousScore).toFixed(2)
      if (previousScore !== 0) {
        percentageChange = +(
          ((currentScore - previousScore) / Math.abs(previousScore)) *
          100
        ).toFixed(1)
      }
      direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable'
      isImprovement = meta.lowerIsBetter ? delta < 0 : delta > 0
    }

    return {
      instrument: key,
      label: meta.label,
      currentScore,
      previousScore,
      delta,
      percentageChange,
      isImprovement,
      direction,
    }
  })
}

export function getGlobalSeverityConfig(severity: string | null): {
  label: string
  className: string
} {
  if (!severity) return { label: '—', className: 'bg-slate-100 text-slate-600' }
  const config: Record<string, { label: string; className: string }> = {
    low: { label: 'Baixa', className: 'bg-emerald-100 text-emerald-700' },
    moderate: { label: 'Moderada', className: 'bg-amber-100 text-amber-700' },
    high: { label: 'Alta', className: 'bg-red-100 text-red-700' },
  }
  return config[severity] || { label: severity, className: 'bg-slate-100 text-slate-600' }
}
