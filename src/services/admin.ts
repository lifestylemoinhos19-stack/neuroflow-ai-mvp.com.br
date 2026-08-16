import { supabase } from '@/lib/supabase/client'

export interface AdminSession {
  id: string
  status: string
  started_at: string
  completed_at: string | null
  user_id: string | null
  guest_token?: string | null
}

export interface SessionResponse {
  id: string
  question_key: string
  question_label: string | null
  response_value: unknown
  created_at: string
}

export async function getAllSessions(limit = 50): Promise<AdminSession[]> {
  const { data, error } = await supabase
    .from('anamnesis_sessions')
    .select('id, status, started_at, completed_at, user_id, guest_token')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data as AdminSession[]
}

export async function getSessionResponses(sessionId: string): Promise<SessionResponse[]> {
  const { data, error } = await supabase
    .from('anamnesis_responses')
    .select('id, question_key, question_label, response_value, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return data as SessionResponse[]
}

export async function deleteSession(sessionId: string): Promise<{ error: string | null }> {
  const { error: respError } = await supabase
    .from('anamnesis_responses')
    .delete()
    .eq('session_id', sessionId)

  if (respError) return { error: respError.message }

  const { error: sessError } = await supabase
    .from('anamnesis_sessions')
    .delete()
    .eq('id', sessionId)

  if (sessError) return { error: sessError.message }
  return { error: null }
}

export async function getRecentSessions(limit = 20): Promise<AdminSession[]> {
  const { data, error } = await supabase
    .from('anamnesis_sessions')
    .select('id, status, started_at, completed_at, user_id')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data as AdminSession[]
}

export async function resetSession(sessionId: string): Promise<{ error: string | null }> {
  const { error: respError } = await supabase
    .from('anamnesis_responses')
    .delete()
    .eq('session_id', sessionId)

  if (respError) return { error: respError.message }

  const { error: sessError } = await supabase
    .from('anamnesis_sessions')
    .update({ status: 'reset', completed_at: null })
    .eq('id', sessionId)

  if (sessError) return { error: sessError.message }
  return { error: null }
}

export async function saveAdminInterpretation(
  sessionId: string,
  text: string,
): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('clinical_feedback').upsert(
    {
      session_id: sessionId,
      doctor_id: user.id,
      admin_edited_interpretation: text,
      comments: text,
      is_accurate: true,
    },
    { onConflict: 'session_id' },
  )

  if (error) return { error: error.message }
  return { error: null }
}

export async function getAdminInterpretation(sessionId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('clinical_feedback')
    .select('admin_edited_interpretation')
    .eq('session_id', sessionId)
    .maybeSingle()

  if (error || !data) return null
  return data.admin_edited_interpretation
}

// UUID "zero" usado como filtro universal para excluir TODAS as linhas de uma
// tabela via PostgREST (que exige ao menos um filtro em operações de DELETE).
const ZERO_UUID = '00000000-0000-0000-0000-000000000000'

/**
 * Exclui TODAS as sessões de anamnese em cascata: respostas, feedback clínico
 * (laudos) e logs de e-mail associados. Retorna a quantidade de sessões removidas.
 */
export async function deleteAllSessions(): Promise<{ error: string | null; count: number }> {
  const { count, error: countErr } = await supabase
    .from('anamnesis_sessions')
    .select('id', { count: 'exact', head: true })
  if (countErr) return { error: countErr.message, count: 0 }

  // Limpa primeiro as tabelas dependentes (FKs → anamnesis_sessions).
  const { error: fbErr } = await supabase.from('clinical_feedback').delete().neq('id', ZERO_UUID)
  if (fbErr) return { error: fbErr.message, count: 0 }

  const { error: respErr } = await supabase
    .from('anamnesis_responses')
    .delete()
    .neq('id', ZERO_UUID)
  if (respErr) return { error: respErr.message, count: 0 }

  const { error: emailErr } = await supabase.from('email_logs').delete().neq('id', ZERO_UUID)
  if (emailErr) return { error: emailErr.message, count: 0 }

  // scale_assignments possui FK → anamnesis_sessions e precisa sair antes.
  await supabase.from('scale_assignments').delete().neq('id', ZERO_UUID)

  const { error: sessErr } = await supabase.from('anamnesis_sessions').delete().neq('id', ZERO_UUID)
  if (sessErr) return { error: sessErr.message, count: 0 }

  return { error: null, count: count ?? 0 }
}

/**
 * Exclui somente as sessões mocadas (metadata->>'origin' = 'mock') em cascata.
 * Retorna a quantidade de sessões removidas.
 */
export async function deleteMockSessions(): Promise<{ error: string | null; count: number }> {
  const { data: sessions, error: qErr } = await supabase
    .from('anamnesis_sessions')
    .select('id')
    .filter('metadata->>origin', 'eq', 'mock')
  if (qErr) return { error: qErr.message, count: 0 }

  const ids = (sessions ?? []).map((s) => s.id)
  if (ids.length === 0) return { error: null, count: 0 }

  await supabase.from('clinical_feedback').delete().in('session_id', ids)
  await supabase.from('anamnesis_responses').delete().in('session_id', ids)
  await supabase.from('email_logs').delete().in('session_id', ids)
  await supabase.from('scale_assignments').delete().in('session_id', ids)

  const { error: sessErr } = await supabase.from('anamnesis_sessions').delete().in('id', ids)
  if (sessErr) return { error: sessErr.message, count: 0 }

  return { error: null, count: ids.length }
}

export interface BulkDeleteResult {
  error: string | null
  sessions: number
  patients: number
}

/**
 * Limpeza completa do banco de dados clínico: remove pacientes (guests),
 * sessões, respostas, feedback, laudos (clinical_reports) e e-mail logs.
 */
export async function deleteAllData(): Promise<BulkDeleteResult> {
  const { count: sessionCount } = await supabase
    .from('anamnesis_sessions')
    .select('id', { count: 'exact', head: true })
  const { count: guestCount } = await supabase
    .from('guests')
    .select('id', { count: 'exact', head: true })

  // Ordem respeitando FKs: dependentes de sessions primeiro, depois sessions,
  // depois guests (referenciada por profiles/reservations).
  await supabase.from('clinical_reports').delete().neq('id', ZERO_UUID)
  const { error: fbErr } = await supabase.from('clinical_feedback').delete().neq('id', ZERO_UUID)
  if (fbErr) return { error: fbErr.message, sessions: 0, patients: 0 }

  const { error: respErr } = await supabase
    .from('anamnesis_responses')
    .delete()
    .neq('id', ZERO_UUID)
  if (respErr) return { error: respErr.message, sessions: 0, patients: 0 }

  const { error: emailErr } = await supabase.from('email_logs').delete().neq('id', ZERO_UUID)
  if (emailErr) return { error: emailErr.message, sessions: 0, patients: 0 }

  await supabase.from('scale_assignments').delete().neq('id', ZERO_UUID)

  const { error: sessErr } = await supabase.from('anamnesis_sessions').delete().neq('id', ZERO_UUID)
  if (sessErr) return { error: sessErr.message, sessions: 0, patients: 0 }

  const { error: guestErr } = await supabase.from('guests').delete().neq('id', ZERO_UUID)
  if (guestErr) return { error: guestErr.message, sessions: sessionCount ?? 0, patients: 0 }

  return { error: null, sessions: sessionCount ?? 0, patients: guestCount ?? 0 }
}
