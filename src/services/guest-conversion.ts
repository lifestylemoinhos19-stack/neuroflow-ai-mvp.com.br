import { supabase } from '@/lib/supabase/client'

export async function linkGuestSessionsToUser(
  guestToken: string,
  userId: string,
): Promise<{ linked: number; error: string | null }> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (profileError || !profile) {
    return { linked: 0, error: 'Perfil não encontrado.' }
  }

  const { data: sessions, error: updateError } = await supabase
    .from('anamnesis_sessions')
    .update({
      user_id: userId,
      profile_id: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('guest_token', guestToken)
    .is('user_id', null)
    .select('id')

  if (updateError) {
    console.error('Error linking guest sessions:', updateError)
    return { linked: 0, error: updateError.message }
  }

  return { linked: sessions?.length ?? 0, error: null }
}

export async function fetchGuestSessionCount(guestToken: string): Promise<number> {
  const { count, error } = await supabase
    .from('anamnesis_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('guest_token', guestToken)

  if (error) return 0
  return count ?? 0
}
