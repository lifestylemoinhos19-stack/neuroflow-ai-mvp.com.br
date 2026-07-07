import { supabase } from '@/lib/supabase/client'
import type { ClinicalReportData } from '@/lib/clinical-report-generator'

export async function createReportSession(guestToken?: string | null): Promise<string | null> {
  const sessionData: Record<string, unknown> = {
    status: 'completed',
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  }

  if (guestToken) {
    sessionData.guest_token = guestToken
    sessionData.user_id = null
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    sessionData.user_id = user.id
    sessionData.profile_id = user.id
  }

  const { data, error } = await supabase
    .from('anamnesis_sessions')
    .insert(sessionData)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating report session:', error)
    return null
  }

  return data?.id ?? null
}

export async function saveClinicalReportToSession(
  sessionId: string,
  report: ClinicalReportData,
): Promise<boolean> {
  const { error } = await supabase.from('anamnesis_responses').insert({
    session_id: sessionId,
    question_key: 'clinical_report',
    question_label: 'Laudo Clínico Profissional',
    response_value: JSON.stringify(report),
  })

  if (error) {
    console.error('Error saving clinical report:', error)
    return false
  }

  return true
}

export async function getClinicalReports(
  userId: string,
): Promise<{ id: string; response_value: unknown; created_at: string }[]> {
  const { data, error } = await supabase
    .from('anamnesis_responses')
    .select('id, response_value, created_at')
    .eq('question_key', 'clinical_report')
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as { id: string; response_value: unknown; created_at: string }[]
}
