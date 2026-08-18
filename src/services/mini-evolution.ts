import { supabase } from '@/lib/supabase/client'
import { scoreAllModules } from '@/lib/mini-scoring'
import { miniModules } from '@/lib/mini-data'

export interface ModuleResult {
  moduleKey: string
  moduleLabel: string
  result: 'Positive' | 'Negative'
}

export interface MiniSessionResult {
  sessionId: string
  startedAt: string
  status: string
  moduleResults: ModuleResult[]
  positiveModules: ModuleResult[]
  dateLabel: string
}

export interface ClinicalTrend {
  totalSessions: number
  currentPositiveCount: number
  previousPositiveCount: number
  improved: ModuleResult[]
  worsened: ModuleResult[]
  trend: 'improving' | 'deteriorating' | 'stable'
}

const LABELS: Record<string, string> = {
  A: 'EDM',
  B: 'Distimia',
  C: 'Risco Suicida',
  D: '(Hipo)Maníaco',
  E: 'Pânico',
  F: 'Agorafobia',
  G: 'Fobia Social',
  H: 'TOC',
  I: 'TEPT',
  J: 'Álcool',
  K: 'Substâncias',
  L: 'Psicóticos',
  M: 'Anorexia/Bulimia',
  N: 'TAG',
  O: 'Dismórfico Corporal',
  P: 'Outros',
}

function getModuleLabel(key: string): string {
  const found = (miniModules as any[])?.find((m: any) => m.key === key || m.id === key)
  return found?.title || found?.label || LABELS[key] || key
}

function getAllModuleKeys(): string[] {
  if (miniModules && miniModules.length > 0) return miniModules.map((m: any) => m.key)
  return Object.keys(LABELS)
}

export async function getMiniSessions(patientId: string): Promise<MiniSessionResult[]> {
  const { data: sessions } = await supabase
    .from('anamnesis_sessions')
    .select('*')
    .eq('profile_id', patientId)
    .or(
      'metadata->>assessment_type.eq.mini_5_0_0,metadata->>type.eq.mini,metadata->>assessment_type.eq.mini',
    )
    .order('started_at', { ascending: true })

  if (!sessions || sessions.length === 0) return []

  const results: MiniSessionResult[] = []
  for (const session of sessions) {
    const { data: responses } = await supabase
      .from('anamnesis_responses')
      .select('*')
      .eq('session_id', session.id)

    const answers: Record<string, string> = {}
    for (const resp of responses || []) {
      const val = resp.response_value
      const answer =
        typeof val === 'string' ? val : (val as any)?.answer || (val as any)?.value || ''
      answers[resp.question_key] = answer
    }

    let moduleResults: ModuleResult[] = []
    try {
      // scoreAllModules expects (modules, answers); pass the full module list.
      const scored = scoreAllModules(miniModules as any, answers as any)
      moduleResults = (scored as any[]).map((r) => ({
        moduleKey: String(r.moduleKey || r.key || ''),
        moduleLabel: String(r.moduleLabel || r.label || getModuleLabel(r.moduleKey || r.key)),
        result: r.result === 'Positive' ? 'Positive' : 'Negative',
      }))
    } catch {
      moduleResults = getAllModuleKeys().map((key) => ({
        moduleKey: key,
        moduleLabel: getModuleLabel(key),
        result: 'Negative' as const,
      }))
    }

    results.push({
      sessionId: session.id,
      startedAt: session.started_at,
      status: session.status,
      moduleResults,
      positiveModules: moduleResults.filter((m) => m.result === 'Positive'),
      dateLabel: new Date(session.started_at).toLocaleDateString('pt-BR'),
    })
  }
  return results
}

export function calculateClinicalTrend(sessions: MiniSessionResult[]): ClinicalTrend {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      currentPositiveCount: 0,
      previousPositiveCount: 0,
      improved: [],
      worsened: [],
      trend: 'stable',
    }
  }
  const current = sessions[sessions.length - 1]
  const previous = sessions.length > 1 ? sessions[sessions.length - 2] : null
  const currentKeys = new Set(current.positiveModules.map((m) => m.moduleKey))
  const previousKeys = new Set(previous?.positiveModules.map((m) => m.moduleKey) || [])

  const improved = current.moduleResults.filter(
    (m) => !currentKeys.has(m.moduleKey) && previousKeys.has(m.moduleKey),
  )
  const worsened = current.moduleResults.filter(
    (m) => currentKeys.has(m.moduleKey) && !previousKeys.has(m.moduleKey),
  )
  const trend =
    improved.length > worsened.length
      ? 'improving'
      : worsened.length > improved.length
        ? 'deteriorating'
        : 'stable'

  return {
    totalSessions: sessions.length,
    currentPositiveCount: current.positiveModules.length,
    previousPositiveCount: previous?.positiveModules.length || 0,
    improved,
    worsened,
    trend,
  }
}

export async function generateAIReport(
  patientId: string,
  sessions: MiniSessionResult[],
  sdsData?: { sdsTotal: number; workTotal: number; daysLost: number; dateLabel: string }[],
) {
  if (sessions.length === 0) return { data: null, error: { message: 'Nenhuma sessão encontrada.' } }
  const current = sessions[sessions.length - 1]
  const trend = calculateClinicalTrend(sessions)
  const positiveModules = current.positiveModules.map((m) => ({
    module: `Módulo ${m.moduleKey} - ${m.moduleLabel}`,
    result: 'Positivo',
  }))
  const latestSds = sdsData && sdsData.length > 0 ? sdsData[sdsData.length - 1] : null
  try {
    const { data, error } = await supabase.functions.invoke('chat-ayla', {
      body: {
        action: 'clinical_summary',
        miniData: {
          patientId,
          sessionDate: current.startedAt,
          positiveModules,
          totalModules: current.moduleResults.length,
          trend: trend.trend,
        },
        sdsData: latestSds
          ? {
              sdsTotal: latestSds.sdsTotal,
              workTotal: latestSds.workTotal,
              daysLost: latestSds.daysLost,
              sessionDate: latestSds.dateLabel,
              history: sdsData,
            }
          : null,
      },
    })
    if (error) throw error
    return { data, error: null }
  } catch {
    let s = '## Resumo Clínico – MINI 5.0.0\n\n'
    s += `**Data:** ${new Date(current.startedAt).toLocaleDateString('pt-BR')}\n\n`
    if (positiveModules.length > 0) {
      s += '### Módulos Positivos:\n\n'
      positiveModules.forEach((m) => {
        s += `- **${m.module}**: ${m.result}\n`
      })
    } else {
      s += 'Nenhum módulo positivo identificado.\n'
    }
    if (latestSds) {
      s += '\n### Escala de Incapacidade de Sheehan (SDS):\n\n'
      s += `**SDS Total:** ${latestSds.sdsTotal}/30\n`
      s += `**Sherra Work Total:** ${latestSds.workTotal}/30\n`
      s += `**Dias Perdidos:** ${latestSds.daysLost}/7\n`
    }
    return { data: { reply: s }, error: null }
  }
}

export function generateMockSessions(): MiniSessionResult[] {
  const mock = [
    { date: '2025-01-15', pos: ['A', 'B', 'C', 'D'] },
    { date: '2025-03-20', pos: ['A', 'C'] },
    { date: '2025-06-10', pos: ['A'] },
    { date: '2025-09-05', pos: [] },
  ]
  const keys = getAllModuleKeys()
  return mock.map((m, i) => {
    const mr = keys.map((k) => ({
      moduleKey: k,
      moduleLabel: getModuleLabel(k),
      result: m.pos.includes(k) ? ('Positive' as const) : ('Negative' as const),
    }))
    return {
      sessionId: `mock-${i}`,
      startedAt: m.date,
      status: 'completed',
      moduleResults: mr,
      positiveModules: mr.filter((r) => r.result === 'Positive'),
      dateLabel: new Date(m.date).toLocaleDateString('pt-BR'),
    }
  })
}
