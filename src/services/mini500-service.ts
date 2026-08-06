import { supabase } from '@/lib/supabase/client'
import { ClinicalInterpretation } from '@/lib/mini500-interpretation'

export interface Mini500PatientInfo {
  name: string
  protocol: string
  interviewDate: string
  birthDate: string
  interviewerName: string
  startTime: string
  endTime: string
}

export async function createMini500Session(info: Mini500PatientInfo): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('anamnesis_sessions')
    .insert({
      user_id: user.id,
      status: 'started',
      started_at: new Date().toISOString(),
      metadata: { ...info, source: 'mini500' },
    } as never)
    .select('id')
    .single()
  if (error) {
    console.error('createMini500Session:', error)
    return null
  }
  return data.id
}

export async function saveMini500Response(
  sessionId: string,
  key: string,
  label: string,
  value: string,
): Promise<boolean> {
  const { error } = await supabase.from('anamnesis_responses').upsert(
    {
      session_id: sessionId,
      question_key: `mini500_${key.toLowerCase()}`,
      question_label: label,
      response_value: JSON.stringify(value),
    },
    { onConflict: 'session_id,question_key' },
  )
  if (error) {
    console.error('saveMini500Response:', error)
    return false
  }
  return true
}

export async function completeMini500Session(
  sessionId: string,
  metadata?: Record<string, unknown>,
): Promise<boolean> {
  const { data: session } = await supabase
    .from('anamnesis_sessions')
    .select('metadata')
    .eq('id', sessionId)
    .single()
  const existing = (session?.metadata as Record<string, unknown>) || {}
  const { error } = await supabase
    .from('anamnesis_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: { ...existing, ...(metadata || {}) },
    })
    .eq('id', sessionId)
  if (error) {
    console.error('completeMini500Session:', error)
    return false
  }
  return true
}

export async function saveMini500Interpretations(
  sessionId: string,
  summary: string,
  severity: string,
  interpretations: ClinicalInterpretation[],
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { error } = await supabase.from('clinical_feedback').insert({
    session_id: sessionId,
    doctor_id: user?.id || null,
    system_suggestion: summary,
    global_severity: severity,
    comments: JSON.stringify(interpretations),
  })
  if (error) {
    console.error('saveMini500Interpretations:', error)
    return false
  }
  return true
}
