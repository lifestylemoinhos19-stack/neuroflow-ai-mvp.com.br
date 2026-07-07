import { supabase } from '@/lib/supabase/client'

export interface AssessmentResponse {
  question_key: string
  question_label: string
  response_value: number
}

export async function saveAssessmentToSupabase(
  scaleType: 'snap-iv' | 'assq',
  responses: AssessmentResponse[],
  summary: Record<string, unknown>,
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data: session, error: sessionError } = await supabase
    .from('anamnesis_sessions')
    .insert({
      user_id: user.id,
      status: 'completed',
      started_at: new Date(Date.now() - 60000).toISOString(),
      completed_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (sessionError || !session) {
    console.error('Error creating assessment session:', sessionError)
    return false
  }

  const rows = responses.map((r) => ({
    session_id: session.id,
    question_key: r.question_key,
    question_label: r.question_label,
    response_value: r.response_value,
  }))

  const { error: respError } = await supabase.from('anamnesis_responses').insert(rows)

  if (respError) {
    console.error('Error saving assessment responses:', respError)
    return false
  }

  return true
}

export async function savePublicAssessmentToSupabase(
  scaleType: 'snap-iv' | 'assq',
  responses: AssessmentResponse[],
  summary: Record<string, unknown>,
  guestToken?: string | null,
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const sessionData: Record<string, unknown> = {
    status: 'completed',
    started_at: new Date(Date.now() - 60000).toISOString(),
    completed_at: new Date().toISOString(),
  }

  if (user) {
    sessionData.user_id = user.id
  } else if (guestToken) {
    sessionData.guest_token = guestToken
  } else {
    return false
  }

  const { data: session, error: sessionError } = await supabase
    .from('anamnesis_sessions')
    .insert(sessionData)
    .select()
    .single()

  if (sessionError || !session) {
    console.error('Error creating public assessment session:', sessionError)
    return false
  }

  const rows = responses.map((r) => ({
    session_id: session.id,
    question_key: r.question_key,
    question_label: r.question_label,
    response_value: r.response_value,
  }))

  const { error: respError } = await supabase.from('anamnesis_responses').insert(rows)

  if (respError) {
    console.error('Error saving public assessment responses:', respError)
    return false
  }

  return true
}
