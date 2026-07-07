import { supabase } from '@/lib/supabase/client'

export async function createGuestSession(guestToken: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('anamnesis_sessions')
    .insert({
      user_id: null,
      guest_token: guestToken,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating guest session:', error)
    return null
  }

  return data?.id ?? null
}

export async function saveGuestResponses(
  sessionId: string,
  responses: { question_key: string; question_label?: string; response_value: string | number }[],
): Promise<boolean> {
  const rows = responses.map((r) => ({
    session_id: sessionId,
    question_key: r.question_key,
    question_label: r.question_label || null,
    response_value: r.response_value,
  }))

  const { error } = await supabase.from('anamnesis_responses').insert(rows)
  return !error
}

export async function completeGuestSession(sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('anamnesis_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  return !error
}
