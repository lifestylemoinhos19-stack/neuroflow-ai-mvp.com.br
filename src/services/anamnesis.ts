import { supabase } from '@/lib/supabase/client'

export interface AnamnesisSession {
  id: string
  user_id?: string | null
  profile_id?: string | null
  status: string
  started_at: string
  completed_at: string | null
}

export interface AnamnesisResponseInput {
  question_key: string
  question_label?: string
  response_value: string | number
}

export async function createAnamnesisSession(): Promise<AnamnesisSession | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('anamnesis_sessions')
    .insert({
      user_id: user.id,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating anamnesis session:', error)
    return null
  }

  return data as AnamnesisSession
}

export async function saveAnamnesisResponses(
  sessionId: string,
  responses: AnamnesisResponseInput[],
): Promise<boolean> {
  const rows = responses.map((r) => ({
    session_id: sessionId,
    question_key: r.question_key,
    question_label: r.question_label || null,
    response_value: r.response_value,
  }))

  const { error } = await supabase.from('anamnesis_responses').insert(rows)

  if (error) {
    console.error('Error saving anamnesis responses:', error)
    return false
  }

  return true
}

export async function completeAnamnesisSession(sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('anamnesis_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (error) {
    console.error('Error completing anamnesis session:', error)
    return false
  }

  return true
}
