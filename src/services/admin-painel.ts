import { supabase } from '@/lib/supabase/client'

export interface AdminPatient {
  user_id: string
  full_name: string
  evaluation_count: number
}

export interface AdminTest {
  id: string
  type: string
  patient_name: string
  origin: 'Mocado' | 'Real'
  started_at: string
  status: string
}

export async function getAdminPatients(): Promise<AdminPatient[]> {
  const { data: sessions } = await supabase
    .from('anamnesis_sessions')
    .select('user_id')
    .not('user_id', 'is', null)

  if (!sessions || sessions.length === 0) return []

  const userIds = [...new Set(sessions.map((s) => s.user_id).filter(Boolean))] as string[]

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, guest_id')
    .in('id', userIds)

  const guestIds = (profiles || []).map((p) => p.guest_id).filter(Boolean) as string[]
  let guests: { id: string; first_name: string; last_name: string }[] = []
  if (guestIds.length > 0) {
    const { data: guestData } = await supabase
      .from('guests')
      .select('id, first_name, last_name')
      .in('id', guestIds)
    guests = guestData || []
  }

  return userIds.map((userId) => {
    const profile = profiles?.find((p) => p.id === userId)
    const guest = guests.find((g) => g.id === profile?.guest_id)
    const evaluationCount = sessions.filter((s) => s.user_id === userId).length
    const fullName = guest
      ? `${guest.first_name} ${guest.last_name}`.trim()
      : profile?.full_name || 'Paciente'
    return { user_id: userId, full_name: fullName, evaluation_count: evaluationCount }
  })
}

export async function getAdminTests(): Promise<AdminTest[]> {
  const { data: sessions, error } = await supabase
    .from('anamnesis_sessions')
    .select('id, user_id, status, started_at, metadata, guest_token')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error || !sessions) return []

  const userIds = [...new Set(sessions.map((s) => s.user_id).filter(Boolean))] as string[]

  let profileMap: Record<string, { full_name: string | null; guest_id: string | null }> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, guest_id')
      .in('id', userIds)
    ;(profiles || []).forEach((p) => {
      profileMap[p.id] = { full_name: p.full_name, guest_id: p.guest_id }
    })
  }

  const guestIds = Object.values(profileMap)
    .map((p) => p.guest_id)
    .filter(Boolean) as string[]
  let guestMap: Record<string, string> = {}
  if (guestIds.length > 0) {
    const { data: guests } = await supabase
      .from('guests')
      .select('id, first_name, last_name')
      .in('id', guestIds)
    ;(guests || []).forEach((g) => {
      guestMap[g.id] = `${g.first_name} ${g.last_name}`.trim()
    })
  }

  return sessions.map((session: any) => {
    const profile = profileMap[session.user_id as string]
    const guestName = profile?.guest_id ? guestMap[profile.guest_id] : null
    const patientName = guestName || profile?.full_name || 'Paciente'

    const meta = session.metadata as any
    const type = meta?.type || meta?.assessment_type || meta?.scale || 'Anamnese'
    const origin: 'Mocado' | 'Real' =
      meta?.origin === 'mock' || meta?.mock === true ? 'Mocado' : 'Real'

    return {
      id: session.id,
      type,
      patient_name: patientName,
      origin,
      started_at: session.started_at,
      status: session.status,
    }
  })
}

export async function deletePatientData(userId: string): Promise<{ error: string | null }> {
  const { data: sessions, error: sessionError } = await supabase
    .from('anamnesis_sessions')
    .select('id')
    .eq('user_id', userId)

  if (sessionError) return { error: sessionError.message }

  const sessionIds = (sessions || []).map((s) => s.id)

  if (sessionIds.length > 0) {
    const { error: fbError } = await supabase
      .from('clinical_feedback')
      .delete()
      .in('session_id', sessionIds)
    if (fbError) return { error: fbError.message }

    const { error: respError } = await supabase
      .from('anamnesis_responses')
      .delete()
      .in('session_id', sessionIds)
    if (respError) return { error: respError.message }

    await supabase.from('email_logs').delete().in('session_id', sessionIds)
  }

  const { error: delSessionError } = await supabase
    .from('anamnesis_sessions')
    .delete()
    .eq('user_id', userId)
  if (delSessionError) return { error: delSessionError.message }

  const { data: patientRecords } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', userId)

  const patientIds = (patientRecords || []).map((p) => p.id)
  if (patientIds.length > 0) {
    await supabase.from('clinical_reports').delete().in('patient_id', patientIds)
    await supabase.from('patient_materials').delete().in('patient_id', patientIds)
    await supabase.from('patients').delete().eq('user_id', userId)
  }

  return { error: null }
}

export async function deleteTestData(sessionId: string): Promise<{ error: string | null }> {
  const { error: fbError } = await supabase
    .from('clinical_feedback')
    .delete()
    .eq('session_id', sessionId)
  if (fbError) return { error: fbError.message }

  const { error: respError } = await supabase
    .from('anamnesis_responses')
    .delete()
    .eq('session_id', sessionId)
  if (respError) return { error: respError.message }

  await supabase.from('email_logs').delete().eq('session_id', sessionId)

  const { error: sessError } = await supabase
    .from('anamnesis_sessions')
    .delete()
    .eq('id', sessionId)
  if (sessError) return { error: sessError.message }

  return { error: null }
}
