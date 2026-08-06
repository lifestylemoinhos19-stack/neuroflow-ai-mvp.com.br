import { supabase } from '@/lib/supabase/client'

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
      status: 'in_progress',
      started_at: new Date().toISOString(),
      metadata: { ...info, source: 'mini_5_0_0' },
    })
    .select()
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
  meta?: Record<string, unknown>,
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
      metadata: { ...existing, ...(meta || {}) },
    })
    .eq('id', sessionId)
  if (error) {
    console.error('completeMini500Session:', error)
    return false
  }
  return true
}

export async function saveMini500Feedback(
  sessionId: string,
  suggestion: string,
  severity: string,
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { error } = await supabase.from('clinical_feedback').insert({
    session_id: sessionId,
    doctor_id: user?.id || null,
    system_suggestion: suggestion,
    global_severity: severity,
  })
  if (error) {
    console.error('saveMini500Feedback:', error)
    return false
  }
  return true
}

export interface Mini500ReportData {
  session: {
    id: string
    started_at: string
    completed_at: string | null
    status: string
    metadata: Record<string, unknown> | null
  }
  patient: { fullName: string; birthDate: string | null } | null
  interviewerName: string
  protocol: string
  moduleResults: import('@/lib/mini500-scoring').ModuleResult[]
  interpretations: import('@/lib/mini500-interpretation').ModuleInterpretation[]
  clinicalSummary: string
}

export async function fetchMini500ReportData(
  sessionId: string,
  moduleResults: Mini500ReportData['moduleResults'],
  interpretations: Mini500ReportData['interpretations'],
  summary: string,
): Promise<Mini500ReportData | null> {
  const { data: session, error } = await supabase
    .from('anamnesis_sessions')
    .select('id, started_at, completed_at, status, metadata')
    .eq('id', sessionId)
    .single()
  if (error || !session) return null
  const metadata = (session.metadata as Record<string, unknown>) || {}
  let patient: Mini500ReportData['patient'] = null
  if (metadata.name)
    patient = {
      fullName: metadata.name as string,
      birthDate: (metadata.birthDate as string) || null,
    }
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
    interpretations,
    clinicalSummary: summary,
  }
}
