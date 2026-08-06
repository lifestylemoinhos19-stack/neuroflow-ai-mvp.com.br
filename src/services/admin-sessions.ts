import { supabase } from '@/lib/supabase/client'

export interface AdminTest {
  id: string
  type: string
  patient_name: string
  origin: 'Mocado' | 'Real'
  started_at: string
  status: string
  guest_id: string | null
}

export interface SessionFormData {
  scale_type: string
  guest_id: string
  score: number
  status: string
}

export const SCALE_TYPES = [
  'PHQ-9',
  'GAD-7',
  'ASSQ',
  'SNAP-IV',
  'ASRS-18',
  'MoCA',
  'MEEM',
  'HAM-D',
  'HAM-A',
  'Y-BOCS',
  'FAS',
  'FTDRS',
]

function metaOf(m: unknown): Record<string, unknown> | null {
  return m && typeof m === 'object' ? (m as Record<string, unknown>) : null
}

export async function getAdminTests(): Promise<AdminTest[]> {
  const { data, error } = await supabase
    .from('anamnesis_sessions')
    .select('id, user_id, status, started_at, metadata, guest_token')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error || !data) return []

  const guestIds = new Set<string>()
  const userIds = new Set<string>()
  for (const s of data) {
    const meta = metaOf(s.metadata)
    if (meta?.guest_id) guestIds.add(meta.guest_id as string)
    if (s.user_id) userIds.add(s.user_id)
  }

  const guestMap: Record<string, string> = {}
  if (guestIds.size) {
    const { data: gs } = await supabase
      .from('guests')
      .select('id, first_name, last_name')
      .in('id', [...guestIds])
    ;(gs || []).forEach((g) => {
      guestMap[g.id] = `${g.first_name} ${g.last_name}`.trim()
    })
  }

  const profileMap: Record<string, { full_name: string | null; guest_id: string | null }> = {}
  if (userIds.size) {
    const { data: ps } = await supabase
      .from('profiles')
      .select('id, full_name, guest_id')
      .in('id', [...userIds])
    ;(ps || []).forEach((p) => {
      profileMap[p.id] = { full_name: p.full_name, guest_id: p.guest_id }
      if (p.guest_id && !guestMap[p.guest_id]) guestIds.add(p.guest_id)
    })
    const newGids = [...guestIds].filter((id) => !guestMap[id])
    if (newGids.length) {
      const { data: gs } = await supabase
        .from('guests')
        .select('id, first_name, last_name')
        .in('id', newGids)
      ;(gs || []).forEach((g) => {
        guestMap[g.id] = `${g.first_name} ${g.last_name}`.trim()
      })
    }
  }

  return data.map((s) => {
    const meta = metaOf(s.metadata)
    const gid = (meta?.guest_id as string) || profileMap[s.user_id ?? '']?.guest_id || null
    const name = gid
      ? guestMap[gid] || 'Paciente'
      : profileMap[s.user_id ?? '']?.full_name || 'Paciente'
    return {
      id: s.id,
      type:
        (meta?.type as string) ||
        (meta?.scale_type as string) ||
        (meta?.scale as string) ||
        'Anamnese',
      patient_name: name,
      origin:
        meta?.origin === 'mock' || meta?.mock === true ? ('Mocado' as const) : ('Real' as const),
      started_at: s.started_at,
      status: s.status,
      guest_id: gid,
    }
  })
}

export async function createMockSession(data: SessionFormData): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: session, error: e1 } = await supabase
    .from('anamnesis_sessions')
    .insert({
      user_id: user.id,
      status: data.status,
      started_at: new Date().toISOString(),
      completed_at: data.status === 'completed' ? new Date().toISOString() : null,
      metadata: { origin: 'mock', type: data.scale_type, guest_id: data.guest_id },
    })
    .select('id')
    .single()
  if (e1) return { error: e1.message }

  const key = data.scale_type.toLowerCase().replace(/[-\s]/g, '')
  const { error: e2 } = await supabase.from('anamnesis_responses').insert({
    session_id: session.id,
    question_key: `${key}_total`,
    question_label: `${data.scale_type} Total Score`,
    response_value: data.score,
  })
  return { error: e2?.message ?? null }
}

export async function updateSession(
  sessionId: string,
  data: { score: number; status: string },
): Promise<{ error: string | null }> {
  const { error: e1 } = await supabase
    .from('anamnesis_sessions')
    .update({
      status: data.status,
      completed_at: data.status === 'completed' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
  if (e1) return { error: e1.message }

  const { data: existing } = await supabase
    .from('anamnesis_responses')
    .select('id')
    .eq('session_id', sessionId)
    .like('question_key', '%_total')
    .limit(1)
  if (existing?.length) {
    const { error: e2 } = await supabase
      .from('anamnesis_responses')
      .update({ response_value: data.score })
      .eq('id', existing[0].id)
    if (e2) return { error: e2.message }
  }
  return { error: null }
}

export async function deleteTestData(sessionId: string): Promise<{ error: string | null }> {
  const { error: e1 } = await supabase
    .from('clinical_feedback')
    .delete()
    .eq('session_id', sessionId)
  if (e1) return { error: e1.message }
  const { error: e2 } = await supabase
    .from('anamnesis_responses')
    .delete()
    .eq('session_id', sessionId)
  if (e2) return { error: e2.message }
  await supabase.from('email_logs').delete().eq('session_id', sessionId)
  const { error: e3 } = await supabase.from('anamnesis_sessions').delete().eq('id', sessionId)
  return { error: e3?.message ?? null }
}
