import { supabase } from '@/lib/supabase/client'

export interface ValidationResult {
  session_id: string
  status: string
  started_at: string
  completed_at: string | null
  patient_initials: string
  clinician_name: string
  clinician_crm: string
  clinician_rqe: string
  assessment_type: string
  clinic_name: string
}

export async function validateDocument(sessionId: string): Promise<ValidationResult | null> {
  const { data, error } = await supabase.rpc('get_session_validation', {
    p_session_id: sessionId,
  })

  if (error || !data || data.length === 0) return null

  return data[0] as ValidationResult
}
