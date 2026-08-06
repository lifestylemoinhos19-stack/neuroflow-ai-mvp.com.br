import { supabase } from '@/lib/supabase/client'

export interface AdminPatient {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  birth_date: string | null
  evaluation_count: number
}

export interface PatientFormData {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  birth_date?: string
}

function metaOf(m: unknown): Record<string, unknown> | null {
  return m && typeof m === 'object' ? (m as Record<string, unknown>) : null
}

export async function getAdminPatients(): Promise<AdminPatient[]> {
  const { data: guests, error } = await supabase
    .from('guests')
    .select('id, first_name, last_name, email, phone, birth_date')
    .order('created_at', { ascending: false })

  if (error || !guests) return []

  const { data: sessions } = await supabase.from('anamnesis_sessions').select('metadata')

  return guests.map((guest) => {
    const count = (sessions || []).filter((s) => {
      const meta = metaOf(s.metadata)
      return meta?.guest_id === guest.id
    }).length
    return { ...guest, evaluation_count: count }
  })
}

export async function createPatient(data: PatientFormData): Promise<{ error: string | null }> {
  const { error } = await supabase.from('guests').insert({
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email || null,
    phone: data.phone || null,
    birth_date: data.birth_date || null,
  })
  return { error: error?.message ?? null }
}

export async function updatePatient(
  id: string,
  data: PatientFormData,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('guests')
    .update({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email || null,
      phone: data.phone || null,
      birth_date: data.birth_date || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  return { error: error?.message ?? null }
}

export async function deletePatientData(guestId: string): Promise<{ error: string | null }> {
  const { data: sessions } = await supabase.from('anamnesis_sessions').select('id, metadata')

  const sessionIds = (sessions || [])
    .filter((s) => {
      const meta = metaOf(s.metadata)
      return meta?.guest_id === guestId
    })
    .map((s) => s.id)

  if (sessionIds.length > 0) {
    await supabase.from('clinical_feedback').delete().in('session_id', sessionIds)
    await supabase.from('anamnesis_responses').delete().in('session_id', sessionIds)
    await supabase.from('email_logs').delete().in('session_id', sessionIds)
    await supabase.from('anamnesis_sessions').delete().in('id', sessionIds)
  }

  const { error } = await supabase.from('guests').delete().eq('id', guestId)
  return { error: error?.message ?? null }
}
