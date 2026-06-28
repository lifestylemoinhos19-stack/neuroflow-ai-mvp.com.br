import { supabase } from '@/lib/supabase/client'

export interface FailedStressTest {
  id: string
  scenario_name: string | null
  input_text: string | null
  expected_risk_level: string | null
  expected_suggestion: string | null
  actual_output: any
  is_success: boolean | null
  rag_sources: any
  latency_ms: number | null
  created_at: string
  test_tag: string | null
}

export interface EdgeCaseAuditLog {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  details: any
  created_at: string
  user_id: string | null
}

export async function getFailedStressTests(): Promise<FailedStressTest[]> {
  const { data, error } = await supabase
    .from('stress_test_logs')
    .select('*')
    .eq('is_success', false)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error || !data) return []
  return data as FailedStressTest[]
}

export async function getEdgeCaseAuditLogs(): Promise<EdgeCaseAuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('action', 'RAG_VALIDATION')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error || !data) return []

  const edgeCases = (data as EdgeCaseAuditLog[]).filter((entry) => {
    const d = entry.details as any
    if (!d) return false
    return (
      d.safetyFlag === 'absolute_contraindication' ||
      d.safetyFlag === 'relative_contraindication' ||
      d.safetyFlag === 'out_of_scope' ||
      d.classification === 'OUT_OF_SCOPE' ||
      d.classification === 'SAFETY_ALERT'
    )
  })

  return edgeCases
}
