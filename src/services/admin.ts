import { supabase } from '@/lib/supabase/client'

export interface AdminSession {
  id: string
  status: string
  started_at: string
  completed_at: string | null
  user_id: string | null
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
