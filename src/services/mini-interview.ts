import { supabase } from '@/lib/supabase/client'

export interface MiniPatientInfo {
  name: string
  protocol: string
  interviewDate: string
  birthDate: string
  interviewerName: string
  startTime: string
  endTime: string
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
    metadata: { ...patientInfo, source: 'mini_5_interview' },
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
      question_key: `mini_${questionKey.toLowerCase()}`,
      question_label: questionLabel,
      response_value: JSON.stringify(responseValue),
    },
    { onConflict: 'session_id,question_key' },
  )

  if (error) {
    console.error('Error saving MINI response:', error)
    return false
  }

  return true
}

export async function completeMiniSession(
  sessionId: string,
  additionalMetadata?: Record<string, unknown>,
): Promise<boolean> {
  const { data: session } = await supabase
    .from('anamnesis_sessions')
    .select('metadata')
    .eq('id', sessionId)
    .single()

  const existingMetadata = (session?.metadata as Record<string, unknown>) || {}
  const mergedMetadata = { ...existingMetadata, ...(additionalMetadata || {}) }

  const { error } = await supabase
    .from('anamnesis_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: mergedMetadata as unknown as Record<string, import('@/lib/supabase/types').Json>,
    })
    .eq('id', sessionId)

  if (error) {
    console.error('Error completing MINI session:', error)
    return false
  }

  return true
}

export async function saveMiniClinicalFeedback(
  sessionId: string,
  systemSuggestion: string,
  globalSeverity: string,
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('clinical_feedback').insert({
    session_id: sessionId,
    doctor_id: user?.id || null,
    system_suggestion: systemSuggestion,
    global_severity: globalSeverity,
  })

  if (error) {
    console.error('Error saving MINI clinical feedback:', error)
    return false
  }

  return true
}
