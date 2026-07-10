import { supabase } from '@/lib/supabase/client'

export interface SdsEvolutionPoint {
  sessionId: string
  date: string
  dateLabel: string
  sdsTotal: number
  workTotal: number
  daysLost: number
}

export async function getSdsEvolution(patientId: string): Promise<SdsEvolutionPoint[]> {
  const { data: sessions } = await supabase
    .from('anamnesis_sessions')
    .select('*')
    .or(`user_id.eq.${patientId},profile_id.eq.${patientId}`)
    .eq('metadata->>scaleType', 'sds')
    .order('started_at', { ascending: true })

  if (!sessions || sessions.length === 0) return []

  return sessions.map((s) => {
    const meta = s.metadata as Record<string, unknown> | null
    return {
      sessionId: s.id,
      date: s.started_at,
      dateLabel: new Date(s.started_at).toLocaleDateString('pt-BR'),
      sdsTotal: (meta?.totalSds as number) ?? 0,
      workTotal: (meta?.totalSherra as number) ?? 0,
      daysLost: (meta?.daysLost as number) ?? 0,
    }
  })
}

export function generateMockSdsEvolution(): SdsEvolutionPoint[] {
  return [
    {
      sessionId: 'mock-sds-0',
      date: '2025-01-15',
      dateLabel: '15/01/2025',
      sdsTotal: 24,
      workTotal: 22,
      daysLost: 5,
    },
    {
      sessionId: 'mock-sds-1',
      date: '2025-03-20',
      dateLabel: '20/03/2025',
      sdsTotal: 18,
      workTotal: 15,
      daysLost: 3,
    },
    {
      sessionId: 'mock-sds-2',
      date: '2025-06-10',
      dateLabel: '10/06/2025',
      sdsTotal: 12,
      workTotal: 10,
      daysLost: 2,
    },
    {
      sessionId: 'mock-sds-3',
      date: '2025-09-05',
      dateLabel: '05/09/2025',
      sdsTotal: 6,
      workTotal: 5,
      daysLost: 1,
    },
  ]
}
