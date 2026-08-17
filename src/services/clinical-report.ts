import { supabase } from '@/lib/supabase/client'
import type { EducationalInterpretation } from '@/lib/educational-interpretation'
export interface InterpretationWithMeta {
  id: string
  interpretation: EducationalInterpretation
  created_at: string
}

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

export async function saveInterpretationToSession(
  sessionId: string,
  interpretation: EducationalInterpretation,
): Promise<boolean> {
  const { error } = await supabase.from('anamnesis_responses').insert({
    session_id: sessionId,
    question_key: 'educational_interpretation',
    question_label: 'Interpretação Educacional',
    response_value: interpretation as unknown as import('@/lib/supabase/types').Json,
  })

  if (error) {
    console.error('Error saving interpretation:', error)
    return false
  }

  return true
}

function parseInterpretation(value: unknown): EducationalInterpretation | null {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as EducationalInterpretation
    } catch {
      return null
    }
  }
  if (typeof value === 'object') {
    return value as EducationalInterpretation
  }
  return null
}

export async function getInterpretations(): Promise<InterpretationWithMeta[]> {
  const { data, error } = await supabase
    .from('anamnesis_responses')
    .select('id, response_value, created_at')
    .eq('question_key', 'educational_interpretation')
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data
    .map((d) => {
      const interpretation = parseInterpretation(d.response_value)
      if (!interpretation) return null
      return { id: d.id, interpretation, created_at: d.created_at }
    })
    .filter(Boolean) as InterpretationWithMeta[]
}
