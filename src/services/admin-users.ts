import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

export type ProfileRole = 'admin' | 'doctor' | 'staff' | 'paciente'

export interface AdminUserProfile {
  id: string
  email: string | null
  full_name: string | null
  role: ProfileRole | string
  created_at: string
}

export async function getAdminUsers(): Promise<AdminUserProfile[]> {
  const { data, error } = await (supabase.from('profiles') as any)
    .select('id, email, nome, role, created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error || !data) return []

  return (data as any[]).map((p) => ({
    id: p.id,
    email: p.email ?? null,
    full_name: p.nome ?? null,
    role: p.role,
    created_at: p.created_at,
  }))
}

export async function updateUserRole(
  profileId: string,
  role: ProfileRole,
): Promise<{ error: string | null }> {
  const updatePayload = { role: role as string, updated_at: new Date().toISOString() }
  const { error } = await (supabase.from('profiles') as any)
    .update(updatePayload)
    .eq('id', profileId)
  return { error: error?.message ?? null }
}
