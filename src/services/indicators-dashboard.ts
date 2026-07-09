import { supabase } from '@/lib/supabase/client'
import { computeTrends, type PatientEvaluation } from '@/services/patient-history'

export interface DashboardSummary {
  activePatients: number
  monthlyEvaluations: number
}
export interface PrevalenceItem {
  condition: string
  label: string
  count: number
  percentage: number
  color: string
}
export interface IncidenceItem {
  condition: string
  label: string
  currentMonth: number
  previousMonth: number
  variation: number | null
}
export interface ClinicalEvolution {
  improvement: number
  stable: number
  worsening: number
  total: number
  worseningPercentage: number
}
export interface IndicatorsDashboardData {
  summary: DashboardSummary
  prevalence: PrevalenceItem[]
  incidence: IncidenceItem[]
  evolution: ClinicalEvolution
}

const CONDITIONS: Record<string, { label: string; color: string; check: (f: any) => boolean }> = {
  tdah: {
    label: 'TDAH',
    color: 'hsl(var(--chart-1))',
    check: (f) =>
      (f.snap_iv_score != null && f.snap_iv_score >= 1.5) ||
      (f.asrs18_score != null && f.asrs18_score >= 4),
  },
  tea: {
    label: 'TEA',
    color: 'hsl(var(--chart-2))',
    check: (f) => f.assq_score != null && f.assq_score >= 15,
  },
  depression: {
    label: 'Depressão',
    color: 'hsl(var(--chart-3))',
    check: (f) =>
      (f.phq9_score != null && f.phq9_score >= 10) || (f.hamd_score != null && f.hamd_score >= 8),
  },
  anxiety: {
    label: 'Ansiedade',
    color: 'hsl(var(--chart-4))',
    check: (f) =>
      (f.gad7_score != null && f.gad7_score >= 8) || (f.hama_score != null && f.hama_score >= 8),
  },
}

function mapEval(fb: any, session: any): PatientEvaluation {
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
}

async function getDashboardSummary(): Promise<DashboardSummary> {
  const { count: activePatients } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
  const { count: monthlyEvaluations } = await supabase
    .from('anamnesis_sessions')
    .select('*', { count: 'exact', head: true })
    .gte('started_at', start)
    .lt('started_at', end)
  return { activePatients: activePatients || 0, monthlyEvaluations: monthlyEvaluations || 0 }
}

async function getPrevalenceData(totalPatients: number): Promise<PrevalenceItem[]> {
  const { data: feedback } = await supabase
    .from('clinical_feedback')
    .select('*')
    .not('session_id', 'is', null)
  if (!feedback || feedback.length === 0) {
    return Object.entries(CONDITIONS).map(([key, m]) => ({
      condition: key,
      label: m.label,
      count: 0,
      percentage: 0,
      color: m.color,
    }))
  }
  const sessionIds = [...new Set(feedback.map((f) => f.session_id))] as string[]
  const { data: sessions } = await supabase
    .from('anamnesis_sessions')
    .select('id, user_id')
    .in('id', sessionIds)
    .not('user_id', 'is', null)
  const sessionUserMap = new Map<string, string>()
  for (const s of sessions || []) {
    if (s.user_id) sessionUserMap.set(s.id, s.user_id)
  }
  const base = sessionUserMap.size > 0 ? sessionUserMap.size : totalPatients
  return Object.entries(CONDITIONS).map(([key, meta]) => {
    const matchingUsers = new Set<string>()
    for (const f of feedback) {
      if (meta.check(f) && sessionUserMap.has(f.session_id))
        matchingUsers.add(sessionUserMap.get(f.session_id)!)
    }
    return {
      condition: key,
      label: meta.label,
      count: matchingUsers.size,
      percentage: base > 0 ? (matchingUsers.size / base) * 100 : 0,
      color: meta.color,
    }
  })
}

async function getIncidenceData(): Promise<IncidenceItem[]> {
  const now = new Date()
  const cStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const cEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
  const pStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const [cRes, pRes] = await Promise.all([
    supabase
      .from('anamnesis_sessions')
      .select('id')
      .gte('started_at', cStart)
      .lt('started_at', cEnd),
    supabase
      .from('anamnesis_sessions')
      .select('id')
      .gte('started_at', pStart)
      .lt('started_at', cStart),
  ])
  const cIds = (cRes.data || []).map((s) => s.id)
  const pIds = (pRes.data || []).map((s) => s.id)
  const [cFb, pFb] = await Promise.all([
    cIds.length > 0
      ? supabase.from('clinical_feedback').select('*').in('session_id', cIds)
      : Promise.resolve({ data: [], error: null }),
    pIds.length > 0
      ? supabase.from('clinical_feedback').select('*').in('session_id', pIds)
      : Promise.resolve({ data: [], error: null }),
  ])
  return Object.entries(CONDITIONS).map(([key, meta]) => {
    const curr = (cFb.data || []).filter(meta.check).length
    const prev = (pFb.data || []).filter(meta.check).length
    const variation = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : null
    return { condition: key, label: meta.label, currentMonth: curr, previousMonth: prev, variation }
  })
}

async function getClinicalEvolution(): Promise<ClinicalEvolution> {
  const { data: sessions } = await supabase
    .from('anamnesis_sessions')
    .select('id, user_id, started_at, completed_at, status')
    .not('user_id', 'is', null)
    .order('started_at', { ascending: true })
  if (!sessions || sessions.length === 0)
    return { improvement: 0, stable: 0, worsening: 0, total: 0, worseningPercentage: 0 }
  const sessionIds = sessions.map((s) => s.id)
  const { data: feedback } = await supabase
    .from('clinical_feedback')
    .select('*')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: true })
  if (!feedback || feedback.length === 0)
    return { improvement: 0, stable: 0, worsening: 0, total: 0, worseningPercentage: 0 }
  const sessionMap = new Map(sessions.map((s) => [s.id, s]))
  const userEvals = new Map<string, PatientEvaluation[]>()
  for (const fb of feedback) {
    const session = sessionMap.get(fb.session_id)
    if (!session?.user_id) continue
    const uid = session.user_id
    if (!userEvals.has(uid)) userEvals.set(uid, [])
    userEvals.get(uid)!.push(mapEval(fb, session))
  }
  let improvement = 0,
    stable = 0,
    worsening = 0
  for (const [, evals] of userEvals) {
    if (evals.length < 2) {
      stable++
      continue
    }
    evals.sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())
    const trends = computeTrends(evals)
    if (trends.some((t) => t.isImprovement === false)) worsening++
    else if (trends.some((t) => t.isImprovement === true)) improvement++
    else stable++
  }
  const total = improvement + stable + worsening
  return {
    improvement,
    stable,
    worsening,
    total,
    worseningPercentage: total > 0 ? (worsening / total) * 100 : 0,
  }
}

export async function getIndicatorsDashboardData(): Promise<IndicatorsDashboardData> {
  const summary = await getDashboardSummary()
  const [prevalence, incidence, evolution] = await Promise.all([
    getPrevalenceData(summary.activePatients),
    getIncidenceData(),
    getClinicalEvolution(),
  ])
  return { summary, prevalence, incidence, evolution }
}
