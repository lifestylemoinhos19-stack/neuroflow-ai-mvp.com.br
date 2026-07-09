import { supabase } from '@/lib/supabase/client'

export interface MiniPatientInfo {
  name: string
  protocol: string
  interviewDate: string
  birthDate: string
}

export async function createMiniSession(patientInfo: MiniPatientInfo): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const payload: Record<string, unknown> = {
    user_id: user.id,
    status: 'started',
    started_at: new Date().toISOString(),
    metadata: patientInfo,
  }

  const { data, error } = await supabase
    .from('anamnesis_sessions')
    .insert(payload as never)
    .select()
    .single()

  if (error) {
    console.error('Error creating MINI session:', error)
    return null
  }

  return data.id
}

export async function saveMiniResponse(
  sessionId: string,
  questionKey: string,
  questionLabel: string,
  responseValue: string,
): Promise<boolean> {
  const { error } = await supabase.from('anamnesis_responses').upsert(
    {
      session_id: sessionId,
      question_key: questionKey,
      question_label: questionLabel,
      response_value: JSON.stringify(responseValue),
    },
    {
      onConflict: 'session_id,question_key',
    },
  )

  if (error) {
    console.error('Error saving MINI response:', error)
    return false
  }

  return true
}

export async function completeMiniSession(sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('anamnesis_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (error) {
    console.error('Error completing MINI session:', error)
    return false
  }

  return true
}
