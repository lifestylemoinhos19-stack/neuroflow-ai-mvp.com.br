import { supabase } from '@/lib/supabase/client'
import {
  createAnamnesisSession,
  saveAnamnesisResponses,
  completeAnamnesisSession,
  type AnamnesisResponseInput,
} from '@/services/anamnesis'

export type DementiaScaleType = 'moca' | 'ftdrs' | 'fas'

export async function saveDementiaAssessment(
  scaleType: DementiaScaleType,
  responses: AnamnesisResponseInput[],
  score: number,
): Promise<boolean> {
  const session = await createAnamnesisSession()
  if (!session) return false

  const saved = await saveAnamnesisResponses(session.id, responses)
  if (!saved) return false

  await completeAnamnesisSession(session.id)

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    const scoreColumn = `${scaleType}_score`
    await supabase.from('clinical_feedback').insert({
      session_id: session.id,
      doctor_id: user.id,
      [scoreColumn]: score,
    } as any)
  }

  return true
}
