import { supabase } from '@/lib/supabase/client'

export interface AdminPatient {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  document: string | null
  birth_date: string | null
  evaluation_count: number
}

interface GuestListRow {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  document: string | null
  birth_date: string | null
  created_at: string
}

export interface PatientFormData {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  document?: string
  birth_date?: string
}

function metaOf(m: unknown): Record<string, unknown> | null {
  return m && typeof m === 'object' ? (m as Record<string, unknown>) : null
}

/**
 * Lista de pacientes (guests) para o painel admin, com dados DESCRIPTOGRAFADOS.
 *
 * Os campos first_name, last_name, email, phone, document são armazenados
 * criptografados na tabela guests (trigger encrypt_guests_pii). Para mostrar
 * nomes legíveis ao admin, usamos o RPC get_guest_full — que descriptografa
 * via decrypt_pii — para cada guest.
 *
 * Como get_guest_full exige um p_guest_id (não lista todos), primeiro
 * buscamos os IDs e ordenação pela tabela guests (campos não-PII) e então
 * chamamos o RPC para cada um. Em caso de falha individual, fazemos fallback
 * para o campo criptografado (melhor esforço).
 */
export async function getAdminPatients(): Promise<AdminPatient[]> {
  // Os campos PII de guests são armazenados criptografados. Usamos o RPC
  // list_guests_admin, que descriptografa first_name, last_name, email e
  // phone via decrypt_pii, e ordena por created_at DESC.
  const { data: guestRows, error } = await supabase.rpc('list_guests_admin')

  if (error || !guestRows || guestRows.length === 0) return []

  // Conta avaliações por guest a partir das sessões.
  const { data: sessions } = await supabase.from('anamnesis_sessions').select('metadata')
  const sessionList = sessions || []

  return (guestRows as GuestListRow[]).map((row) => {
    const evaluation_count = sessionList.filter((s) => {
      const meta = metaOf(s.metadata)
      return meta?.guest_id === row.id
    }).length
    return {
      id: row.id,
      first_name: row.first_name ?? '—',
      last_name: row.last_name ?? '',
      email: row.email ?? null,
      phone: row.phone ?? null,
      document: row.document ?? null,
      birth_date: row.birth_date ?? null,
      evaluation_count,
    } as AdminPatient
  })
}

function normalizeDocument(doc?: string): string | null {
  const digits = (doc || '').replace(/\D/g, '')
  return digits || null
}

export async function createPatient(data: PatientFormData): Promise<{ error: string | null }> {
  const { error } = await supabase.from('guests').insert({
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email || null,
    phone: data.phone || null,
    document: normalizeDocument(data.document),
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
      document: normalizeDocument(data.document),
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
