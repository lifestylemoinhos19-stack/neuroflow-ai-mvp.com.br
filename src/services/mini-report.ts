import { supabase } from '@/lib/supabase/client'
import { miniModules } from '@/lib/mini-data'
import { scoreAllModules, generateClinicalSummary, MiniModuleResult } from '@/lib/mini-scoring'

export interface MiniReportData {
  session: {
    id: string
    started_at: string
    completed_at: string | null
    status: string
    metadata: Record<string, unknown> | null
  }
  patient: {
    fullName: string
    birthDate: string | null
  } | null
  interviewerName: string
  protocol: string
  moduleResults: MiniModuleResult[]
  clinicalSummary: string
  clinicalFeedback: {
    system_suggestion: string | null
    admin_edited_interpretation: string | null
    global_severity: string | null
    is_accurate: boolean | null
    comments: string | null
  } | null
}

export async function fetchMiniReportData(sessionId: string): Promise<MiniReportData | null> {
  const { data: session, error } = await supabase
    .from('anamnesis_sessions')
    .select('id, started_at, completed_at, status, metadata, profile_id, user_id')
    .eq('id', sessionId)
    .single()

  if (error || !session) return null

  const { data: responses } = await supabase
    .from('anamnesis_responses')
    .select('question_key, response_value')
    .eq('session_id', sessionId)

  const answerMap: Record<string, string> = {}
  responses?.forEach((r) => {
    const rawKey = r.question_key.replace(/^mini_/, '')
    const key = rawKey.charAt(0).toUpperCase() + rawKey.slice(1)
    let val = r.response_value
    if (typeof val === 'object' && val !== null) val = JSON.stringify(val)
    answerMap[key] = String(val ?? '')
  })

  const metadata = (session.metadata as Record<string, unknown>) || {}
  let patient: MiniReportData['patient'] = null
  const profileId = session.profile_id || session.user_id

  if (profileId) {
    const { data: profile } = (await supabase
      .from('profiles')
      .select('guest_id, nome')
      .eq('id', profileId)
      .maybeSingle()) as { data: { guest_id: string | null; nome: string | null } | null }

    if (profile?.guest_id) {
      const { data: guest } = await supabase
        .from('guests')
        .select('first_name, last_name, birth_date')
        .eq('id', profile.guest_id)
        .maybeSingle()

      if (guest) {
        patient = {
          fullName:
            `${guest.first_name || ''} ${guest.last_name || ''}`.trim() || profile.nome || '—',
          birthDate: guest.birth_date,
        }
      }
    } else if (profile?.nome) {
      patient = { fullName: profile.nome, birthDate: null }
    }
  }

  if (!patient && metadata.name) {
    patient = {
      fullName: metadata.name as string,
      birthDate: (metadata.birthDate as string) || null,
    }
  }

  const moduleResults = scoreAllModules(miniModules, answerMap)
  const clinicalSummary = generateClinicalSummary(moduleResults)

  const { data: feedback } = await supabase
    .from('clinical_feedback')
    .select(
      'system_suggestion, admin_edited_interpretation, global_severity, is_accurate, comments',
    )
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    session: {
      id: session.id,
      started_at: session.started_at,
      completed_at: session.completed_at,
      status: session.status,
      metadata,
    },
    patient,
    interviewerName: (metadata.interviewerName as string) || '',
    protocol: (metadata.protocol as string) || session.id,
    moduleResults,
    clinicalSummary,
    clinicalFeedback: feedback as MiniReportData['clinicalFeedback'],
  }
}
