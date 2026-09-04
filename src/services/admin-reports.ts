import { supabase } from '@/lib/supabase/client'
import { getGuestFull } from '@/services/guest-patient'

export interface AdminReport {
  id: string
  session_id: string
  patient_name: string
  guest_id: string | null
  profile_id: string | null
  admin_edited_interpretation: string | null
  system_suggestion: string | null
  comments: string | null
  is_accurate: boolean | null
  created_at: string
  session_date: string | null
  session_type: string
}

function metaOf(m: unknown): Record<string, unknown> | null {
  return m && typeof m === 'object' ? (m as Record<string, unknown>) : null
}

export async function getAdminReports(): Promise<AdminReport[]> {
  const { data: feedback, error } = await supabase
    .from('clinical_feedback')
    .select(
      'id, session_id, admin_edited_interpretation, system_suggestion, comments, is_accurate, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (error || !feedback) return []

  const sessionIds = [...new Set(feedback.map((f) => f.session_id).filter(Boolean))] as string[]

  interface SessionInfo {
    started_at: string
    type: string
    guest_id: string | null
    profile_id: string | null
    meta_name: string | null
  }
  const sessionMap: Record<string, SessionInfo> = {}

  if (sessionIds.length) {
    const [sessionsRes, assignmentsRes, assistedRes] = await Promise.all([
      supabase
        .from('anamnesis_sessions')
        .select('id, started_at, profile_id, user_id, metadata')
        .in('id', sessionIds),
      supabase
        .from('scale_assignments')
        .select('session_id, scale_type, guest_id, patient_id')
        .in('session_id', sessionIds),
      supabase
        .from('assisted_applications')
        .select('session_id, scale_type, guest_id, patient_id')
        .in('session_id', sessionIds),
    ])

    const sessions = sessionsRes.data || []
    const assignments = assignmentsRes.data || []
    const assisted = assistedRes.data || []

    const assignmentMap: Record<
      string,
      { guest_id: string | null; patient_id: string | null; scale_type: string | null }
    > = {}
    for (const a of assignments) {
      if (a.session_id && !assignmentMap[a.session_id]) {
        assignmentMap[a.session_id] = {
          guest_id: a.guest_id || null,
          patient_id: a.patient_id || null,
          scale_type: a.scale_type || null,
        }
      }
    }

    const assistedMap: Record<
      string,
      { guest_id: string | null; patient_id: string | null; scale_type: string | null }
    > = {}
    for (const aa of assisted) {
      if (aa.session_id && !assistedMap[aa.session_id]) {
        assistedMap[aa.session_id] = {
          guest_id: aa.guest_id || null,
          patient_id: aa.patient_id || null,
          scale_type: aa.scale_type || null,
        }
      }
    }

    sessions.forEach((s) => {
      const meta = metaOf(s.metadata)
      const asg = assignmentMap[s.id]
      const ast = assistedMap[s.id]

      const metaGuestId = (meta?.guest_id as string) || null
      const metaName =
        (meta?.name as string) ||
        (meta?.patient_name as string) ||
        (meta?.patientName as string) ||
        null

      const resolvedGuestId = metaGuestId || asg?.guest_id || ast?.guest_id || null
      const resolvedProfileId =
        (s.profile_id as string) || asg?.patient_id || ast?.patient_id || null

      const resolvedType =
        asg?.scale_type ||
        ast?.scale_type ||
        (meta?.type as string) ||
        (meta?.scale_type as string) ||
        (meta?.scale as string) ||
        'Anamnese'

      sessionMap[s.id] = {
        started_at: s.started_at,
        type: resolvedType,
        guest_id: resolvedGuestId,
        profile_id: resolvedProfileId,
        meta_name: metaName,
      }
    })
  }

  // Coleta guest_ids e profile_ids únicos
  const guestIds = new Set<string>()
  const profileIds = new Set<string>()

  Object.values(sessionMap).forEach((s) => {
    if (s.guest_id) guestIds.add(s.guest_id)
    if (s.profile_id) profileIds.add(s.profile_id)
  })

  // 1) Busca e descriptografa nomes de guests via list_guests_admin (single RPC)
  const guestNameMap: Record<string, string> = {}
  if (guestIds.size > 0) {
    const { data: guestRows } = await supabase.rpc('list_guests_admin')
    ;(guestRows || []).forEach(
      (g: { id: string; first_name: string | null; last_name: string | null }) => {
        if (guestIds.has(g.id)) {
          const full = `${g.first_name || ''} ${g.last_name || ''}`.trim()
          if (full) guestNameMap[g.id] = full
        }
      },
    )

    // Fallback get_guest_full para qualquer guest não retornado por list_guests_admin
    const missing = [...guestIds].filter((id) => !guestNameMap[id])
    if (missing.length > 0) {
      await Promise.all(
        missing.map(async (id) => {
          const { data } = await getGuestFull(id)
          if (data) {
            const full = `${data.first_name || ''} ${data.last_name || ''}`.trim()
            if (full) guestNameMap[id] = full
          }
        }),
      )
    }
  }

  // 2) Busca perfis para mapear profile_id -> guest_id ou full_name
  const profileMap: Record<
    string,
    { nome: string | null; guest_id: string | null; role: string | null }
  > = {}
  if (profileIds.size > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nome, guest_id, role')
      .in('id', [...profileIds])
    ;(profiles || []).forEach((p) => {
      profileMap[p.id] = { nome: p.nome, guest_id: p.guest_id, role: p.role }
      if (p.guest_id && !guestNameMap[p.guest_id]) {
        guestIds.add(p.guest_id)
      }
    })

    // Se novos guest_ids foram descobertos via profile, resolve seus nomes
    const missingFromProfiles = [...guestIds].filter((id) => !guestNameMap[id])
    if (missingFromProfiles.length > 0) {
      await Promise.all(
        missingFromProfiles.map(async (id) => {
          const { data } = await getGuestFull(id)
          if (data) {
            const full = `${data.first_name || ''} ${data.last_name || ''}`.trim()
            if (full) guestNameMap[id] = full
          }
        }),
      )
    }
  }

  const UNIDENTIFIED_LABEL = 'Paciente não identificado'

  return feedback.map((f) => {
    const sess = f.session_id ? sessionMap[f.session_id] : null
    let patientName = UNIDENTIFIED_LABEL

    if (sess) {
      // 1. Guest ID direto
      if (sess.guest_id && guestNameMap[sess.guest_id]) {
        patientName = guestNameMap[sess.guest_id]
      }
      // 2. Profile ID -> guest vinculado ou nome do perfil (desde que não seja admin da clínica)
      else if (sess.profile_id && profileMap[sess.profile_id]) {
        const prof = profileMap[sess.profile_id]
        if (prof.guest_id && guestNameMap[prof.guest_id]) {
          patientName = guestNameMap[prof.guest_id]
        } else if (prof.nome && prof.role !== 'admin' && prof.role !== 'doutor') {
          patientName = prof.nome
        }
      }
      // 3. Nome no metadata (ex: sessões MINI 500 ou triagens públicas com nome digitado)
      if (patientName === UNIDENTIFIED_LABEL && sess.meta_name && sess.meta_name.trim()) {
        patientName = sess.meta_name.trim()
      }
    }

    return {
      id: f.id,
      session_id: f.session_id ?? '',
      patient_name: patientName,
      guest_id: sess?.guest_id ?? null,
      profile_id: sess?.profile_id ?? null,
      admin_edited_interpretation: f.admin_edited_interpretation,
      system_suggestion: f.system_suggestion,
      comments: f.comments,
      is_accurate: f.is_accurate,
      created_at: f.created_at,
      session_date: sess?.started_at ?? null,
      session_type: sess?.type ?? 'Anamnese',
    }
  })
}

export async function createReport(
  sessionId: string,
  interpretation: string,
): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('clinical_feedback').upsert(
    {
      session_id: sessionId,
      doctor_id: user.id,
      admin_edited_interpretation: interpretation,
      comments: interpretation,
      is_accurate: true,
    },
    { onConflict: 'session_id' },
  )
  return { error: error?.message ?? null }
}

export async function updateReport(
  reportId: string,
  interpretation: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('clinical_feedback')
    .update({ admin_edited_interpretation: interpretation, comments: interpretation })
    .eq('id', reportId)
  return { error: error?.message ?? null }
}

export async function deleteReport(reportId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('clinical_feedback').delete().eq('id', reportId)
  return { error: error?.message ?? null }
}
