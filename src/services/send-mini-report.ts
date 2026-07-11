import { supabase } from '@/lib/supabase/client'

export async function fetchGuestEmailForSession(sessionId: string): Promise<string | null> {
  const { data: session } = await supabase
    .from('anamnesis_sessions')
    .select('profile_id, user_id')
    .eq('id', sessionId)
    .single()

  if (!session) return null

  const profileId = session.profile_id || session.user_id
  if (!profileId) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('guest_id')
    .eq('id', profileId)
    .maybeSingle()

  if (!profile?.guest_id) return null

  const { data: guest } = await supabase
    .from('guests')
    .select('email')
    .eq('id', profile.guest_id)
    .maybeSingle()

  return guest?.email || null
}

export async function sendMiniReport(
  sessionId: string,
  recipientEmail: string,
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke('send-mini-report', {
    body: { session_id: sessionId, recipient_email: recipientEmail },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  if (data?.error) {
    return { success: false, error: data.error }
  }

  return { success: true }
}
