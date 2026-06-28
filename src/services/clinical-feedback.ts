import { supabase } from '@/lib/supabase/client'

export interface ClinicalFeedback {
  id: string
  session_id: string
  doctor_id: string | null
  is_accurate: boolean | null
  comments: string | null
  created_at: string
}

export async function saveClinicalFeedback(
  sessionId: string,
  isAccurate: boolean,
  comments: string,
): Promise<{ data: ClinicalFeedback | null; error: any }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { data: null, error: { message: 'Not authenticated' } }

  const { data, error } = await supabase
    .from('clinical_feedback')
    .insert({
      session_id: sessionId,
      doctor_id: user.id,
      is_accurate: isAccurate,
      comments: comments || null,
    })
    .select()
    .single()

  return { data: data as ClinicalFeedback | null, error }
}

export async function getSessionFeedback(sessionId: string): Promise<ClinicalFeedback[]> {
  const { data, error } = await supabase
    .from('clinical_feedback')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as ClinicalFeedback[]
}
