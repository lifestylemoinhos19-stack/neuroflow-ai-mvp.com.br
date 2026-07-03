import { supabase } from '@/lib/supabase/client'

export interface BetaFeedbackInput {
  rating: number
  parent_comments: string
  child_experience: string
  session_id?: string | null
}

export async function saveBetaFeedback(
  input: BetaFeedbackInput,
): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Usuário não autenticado' }

  const { error } = await supabase.from('beta_feedback').insert({
    user_id: user.id,
    session_id: input.session_id || null,
    rating: input.rating,
    parent_comments: input.parent_comments,
    child_experience: input.child_experience,
  })

  if (error) return { error: error.message }
  return { error: null }
}

export async function sendBetaInvitation(
  recipientEmail: string,
  recipientName?: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.functions.invoke('send-beta-invitation', {
    body: { recipientEmail, recipientName },
  })

  if (error) return { error: error.message }
  return { error: null }
}
