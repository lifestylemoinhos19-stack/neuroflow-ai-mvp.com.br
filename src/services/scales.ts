import { supabase } from '@/lib/supabase/client'
import { saveAnamnesisResponses, AnamnesisResponseInput } from '@/services/anamnesis'
import { mchatQuestions, snapivQuestions, MChatQuestion, SNAPQuestion } from '@/lib/scales-data'

export interface ScaleQuestions {
  mchat: MChatQuestion[]
  snapiv: SNAPQuestion[]
}

export async function fetchScaleQuestions(): Promise<ScaleQuestions> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return {
    mchat: [...mchatQuestions],
    snapiv: [...snapivQuestions],
  }
}

export async function saveSingleResponse(
  sessionId: string,
  questionKey: string,
  questionLabel: string,
  responseValue: string | number,
): Promise<boolean> {
  const { error } = await supabase.from('anamnesis_responses').insert({
    session_id: sessionId,
    question_key: questionKey,
    question_label: questionLabel,
    response_value: JSON.stringify(responseValue),
  })
  if (error) {
    console.error('Error saving response:', error)
    return false
  }
  return true
}

export async function saveScaleResponses(
  sessionId: string,
  responses: AnamnesisResponseInput[],
): Promise<boolean> {
  return saveAnamnesisResponses(sessionId, responses)
}

export async function logAuditAction(
  action: string,
  entityType: string,
  entityId: string,
  details: Record<string, unknown> = {},
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  })
}
