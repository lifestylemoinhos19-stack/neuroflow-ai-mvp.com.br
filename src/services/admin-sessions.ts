import { supabase } from '@/lib/supabase/client'
import { getGuestFull } from '@/services/guest-patient'

export interface AdminTest {
  id: string
  type: string
  patient_name: string
  origin: 'Mocado' | 'Real'
  started_at: string
  status: string
  guest_id: string | null
  score: number | null
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

export function translateStatus(status: string): string {
  const normalized = status.toLowerCase().trim()
  const map: Record<string, string> = {
    completed: 'Concluído',
    in_progress: 'Em Progresso',
    'in-progress': 'Em Progresso',
    reset: 'Resetado',
    validated: 'Validado',
    pending: 'Pendente',
    active: 'Ativo',
    cancelled: 'Cancelado',
    canceled: 'Cancelado',
  }
  return map[normalized] || status
}

function metaOf(m: unknown): Record<string, unknown> | null {
  return m && typeof m === 'object' ? (m as Record<string, unknown>) : null
}

/**
 * Unified list of testagens: combines `anamnesis_sessions` (anamneses and
 * scale sessions created via guest_token) with `scale_assignments` (scales
 * assigned to a patient/guest). Scale assignments without a session_id are
 * included as their own testagem entries so PHQ-9, GAD-7, MINI, etc. appear
 * even when the responses were stored against an orphan session created by
 * the public scale components.
 *
 * Patient names are always fetched through the SECURITY DEFINER RPC
 * `get_guest_full` (or `list_guests_admin`) which decrypts PII server-side,
 * so the admin never sees the raw ciphertext that lives in `guests`.
 */
export async function getAdminTests(): Promise<AdminTest[]> {
  // --- 1) Anamnesis sessions (anamneses + orphan scale sessions) ---
  const { data: sessions, error: eSessions } = await supabase
    .from('anamnesis_sessions')
    .select('id, user_id, profile_id, status, started_at, metadata, guest_token')
    .order('created_at', { ascending: false })
    .limit(200)

  // --- 2) Scale assignments (PHQ-9, GAD-7, MINI, etc.) ---
  const { data: assignments, error: eAssignments } = await supabase
    .from('scale_assignments')
    .select('id, scale_type, status, assigned_at, completed_at, session_id, guest_id, patient_id')
    .order('assigned_at', { ascending: false })
    .limit(200)

  if (eSessions && eAssignments) return []

  const sessionRows = sessions || []
  const assignmentRows = assignments || []

  // Sessions already covered by a scale_assignment (via session_id) are
  // represented by the assignment row below — we skip them here to avoid
  // duplicates. Sessions NOT covered by an assignment are kept (anamneses
  // and orphan scale sessions created through guest_token).
  const assignmentSessionIds = new Set(
    assignmentRows.map((a) => a.session_id).filter(Boolean) as string[],
  )
  const orphanSessions = sessionRows.filter((s) => !assignmentSessionIds.has(s.id))

  // --- 3) Build a unified candidate list ---
  interface Candidate {
    id: string
    type: string
    started_at: string
    status: string
    guest_id: string | null
    user_id: string | null
    profile_id: string | null
    session_id: string | null // underlying anamnesis_session (for score lookup)
    origin: 'Mocado' | 'Real'
    source: 'session' | 'assignment'
  }

  const candidates: Candidate[] = []

  for (const s of orphanSessions) {
    const meta = metaOf(s.metadata)
    candidates.push({
      id: s.id,
      type:
        (meta?.type as string) ||
        (meta?.scale_type as string) ||
        (meta?.scale as string) ||
        'Anamnese',
      started_at: s.started_at,
      status: s.status,
      guest_id: (meta?.guest_id as string) || null,
      // profiles.id is FK→auth.users, so user_id doubles as a profile id
      user_id: (s.user_id as string) || null,
      profile_id: (s.profile_id as string) || (s.user_id as string) || null,
      session_id: s.id,
      origin:
        meta?.origin === 'mock' || meta?.mock === true ? ('Mocado' as const) : ('Real' as const),
      source: 'session',
    })
  }

  for (const a of assignmentRows) {
    candidates.push({
      id: a.id,
      type: a.scale_type,
      started_at: a.assigned_at,
      status: a.status,
      guest_id: (a.guest_id as string) || null,
      user_id: null,
      profile_id: (a.patient_id as string) || null,
      session_id: (a.session_id as string) || null,
      origin: 'Real',
      source: 'assignment',
    })
  }

  if (!candidates.length) return []

  // --- 4) Decrypt guest names via list_guests_admin (single RPC) ---
  const guestIds = new Set<string>()
  for (const c of candidates) if (c.guest_id) guestIds.add(c.guest_id)

  const guestNameMap: Record<string, string> = {}
  if (guestIds.size) {
    const { data: guestRows } = await supabase.rpc('list_guests_admin')
    ;(guestRows || []).forEach(
      (g: { id: string; first_name: string | null; last_name: string | null }) => {
        if (guestIds.has(g.id)) {
          guestNameMap[g.id] = `${g.first_name || ''} ${g.last_name || ''}`.trim() || 'Paciente'
        }
      },
    )
    // Fallback per-guest RPC for any guest not returned by list_guests_admin
    const missing = [...guestIds].filter((id) => !guestNameMap[id])
    await Promise.all(
      missing.map(async (id) => {
        const { data } = await getGuestFull(id)
        if (data) {
          guestNameMap[id] = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Paciente'
        }
      }),
    )
  }

  // --- 5) Resolve profile names + profile->guest links ---
  const profileIds = new Set<string>()
  for (const c of candidates) if (c.profile_id) profileIds.add(c.profile_id)
  const profileMap: Record<string, { full_name: string | null; guest_id: string | null }> = {}
  if (profileIds.size) {
    const { data: ps } = await supabase
      .from('profiles')
      .select('id, full_name, guest_id')
      .in('id', [...profileIds])
    ;(ps || []).forEach((p) => {
      profileMap[p.id] = { full_name: p.full_name, guest_id: p.guest_id }
    })
  }

  // --- 6) Scores: anamnesis_responses *_total for sessions + metadata totalScore ---
  const scoreMap: Record<string, number | null> = {}

  // 6a) Metadata totalScore / total_score on sessions
  for (const c of candidates) {
    if (c.source === 'session') {
      const s = sessionRows.find((row) => row.id === c.id)
      const meta = metaOf(s?.metadata)
      const raw =
        (meta?.totalScore as string | number | undefined) ??
        (meta?.total_score as string | number | undefined)
      if (raw !== undefined && raw !== null && raw !== '') {
        const n = typeof raw === 'number' ? raw : Number(raw)
        if (!isNaN(n)) scoreMap[c.id] = n
      }
    }
  }

  // 6b) anamnesis_responses *_total for sessions that have a session_id
  const sessionIdsForScore = new Set<string>()
  for (const c of candidates) if (c.session_id) sessionIdsForScore.add(c.session_id)
  if (sessionIdsForScore.size) {
    const { data: responses } = await supabase
      .from('anamnesis_responses')
      .select('session_id, question_key, response_value')
      .in('session_id', [...sessionIdsForScore])
      .like('question_key', '%_total')
    ;(responses || []).forEach((r) => {
      const val = r.response_value
      let n: number | null = null
      if (typeof val === 'number') n = val
      else if (typeof val === 'string') {
        const parsed = parseFloat(val)
        if (!isNaN(parsed)) n = parsed
      }
      if (n !== null) {
        // Map back to the candidate that owns this session
        const owner = candidates.find((c) => c.session_id === r.session_id)
        if (owner && scoreMap[owner.id] === undefined) scoreMap[owner.id] = n
      }
    })
  }

  // --- 7) Build the final unified AdminTest list ---
  const resolveName = (c: Candidate): string => {
    if (c.guest_id && guestNameMap[c.guest_id]) return guestNameMap[c.guest_id]
    if (c.profile_id && profileMap[c.profile_id]) {
      const p = profileMap[c.profile_id]
      if (p.guest_id && guestNameMap[p.guest_id]) return guestNameMap[p.guest_id]
      if (p.full_name) return p.full_name
    }
    return 'Paciente'
  }

  const tests: AdminTest[] = candidates.map((c) => ({
    id: c.id,
    type: c.type,
    patient_name: resolveName(c),
    origin: c.origin,
    started_at: c.started_at,
    status: c.status,
    guest_id: c.guest_id,
    score: scoreMap[c.id] ?? null,
  }))

  // Most recent first
  tests.sort((a, b) => (a.started_at < b.started_at ? 1 : a.started_at > b.started_at ? -1 : 0))
  return tests
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
