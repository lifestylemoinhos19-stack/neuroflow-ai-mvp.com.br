import { supabase } from '@/lib/supabase/client'

export type SafetyFlag =
  | 'none'
  | 'absolute_contraindication'
  | 'relative_contraindication'
  | 'out_of_scope'
export type NeuroCategory = 'TEA' | 'TDAH' | 'DI' | 'SAFETY_ALERT' | 'OUT_OF_SCOPE' | 'GENERAL'
export type ScaleSuggestion = 'M-CHAT-R' | 'SNAP-IV' | 'NONE'

export interface ClinicalCitation {
  source: string
  code: string
  title: string
  section: string
}

export interface ValidationResult {
  category: NeuroCategory
  riskLevel: 'low' | 'medium' | 'high' | null
  scaleSuggestion: ScaleSuggestion
  safetyFlag: SafetyFlag
  safetyMessage: string | null
  clinicalRationale: string
  suggestedAction: string
  clinicalCitations: ClinicalCitation[]
  telemedicineDisclaimer: boolean
}

export interface ValidationResponse {
  result: ValidationResult
  input: string
}

export async function runNeuroValidation(message: string): Promise<ValidationResponse | null> {
  try {
    const { data, error } = await supabase.functions.invoke('neuro-validation', {
      body: { message, persist: true },
    })

    if (error) {
      console.error('Neuro validation error:', error)
      return null
    }

    return data as ValidationResponse
  } catch (err) {
    console.error('Neuro validation failed:', err)
    return null
  }
}

export interface AuditLogEntry {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  details: {
    input: string
    classification: NeuroCategory
    riskLevel: string | null
    suggestedScale: ScaleSuggestion
    safetyFlag: SafetyFlag
    safetyMessage: string | null
    clinicalRationale: string
    suggestedAction: string
    clinicalReferences?: ClinicalCitation[]
    telemedicineDisclaimer?: boolean
    timestamp: string
  }
  created_at: string
}

export async function getValidationHistory(): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('action', 'RAG_VALIDATION')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !data) return []

  return data as AuditLogEntry[]
}
