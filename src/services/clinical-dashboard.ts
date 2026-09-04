import { supabase } from '@/lib/supabase/client'
import { getGuestFull } from '@/services/guest-patient'
import {
  mchatQuestions,
  snapivQuestions,
  getMChatRiskLevel,
  getSnapivRiskLevel,
} from '@/lib/scales-data'

export interface ClinicalSessionItem {
  id: string
  session_id: string
  source: 'session' | 'assignment'
  type: string
  started_at: string
  completed_at: string | null
  status: string
  riskLevel: 'low' | 'medium' | 'high' | null
  patient_name: string
  is_orphan: boolean
  guest_id: string | null
  profile_id: string | null
  mchatScore: number | null
  snapivInattention: number | null
  snapivHyperactivity: number | null
  totalScore: number | null
  responseCount: number
}

export interface ClinicalDashboardMetrics {
  totalAssessments: number
  completedCount: number
  inProgressCount: number
  highRiskCount: number
  mediumRiskCount: number
  lowRiskCount: number
  identifiedPatientsCount: number
  uniquePatientsCount: number
  pendingAssignmentsCount: number
}

function metaOf(m: unknown): Record<string, unknown> | null {
  return m && typeof m === 'object' ? (m as Record<string, unknown>) : null
}

function parseValue(val: unknown): any {
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    try {
      return JSON.parse(val)
    } catch {
      return val
    }
  }
  return val
}

function avg(arr: any[]): number {
  if (arr.length === 0) return 0
  const sum = arr.reduce((acc, r) => acc + parseValue(r.response_value), 0)
  return sum / arr.length
}

export const UNIDENTIFIED_PATIENT_LABEL = 'Paciente não identificado'

/**
 * Carrega todas as sessões e avaliações do dashboard clínico para o perfil atual.
 * Se o usuário for admin ou doutor (Dra. Rose Mary), carrega todo o panorama clínico
 * da clínica com descriptografia segura de pacientes via RPC `list_guests_admin` + fallback `getGuestFull`.
 * Para pacientes, restringe às suas próprias sessões.
 */
export async function getClinicalDashboardData(isClinicalStaffOrAdmin: boolean): Promise<{
  sessions: ClinicalSessionItem[]
  metrics: ClinicalDashboardMetrics
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return {
      sessions: [],
      metrics: {
        totalAssessments: 0,
        completedCount: 0,
        inProgressCount: 0,
        highRiskCount: 0,
        mediumRiskCount: 0,
        lowRiskCount: 0,
        identifiedPatientsCount: 0,
        uniquePatientsCount: 0,
        pendingAssignmentsCount: 0,
      },
    }
  }

  // 1. Busca sessões de anamnese
  let sessionsQuery = supabase
    .from('anamnesis_sessions')
    .select('id, user_id, profile_id, status, started_at, completed_at, metadata, guest_token')
    .order('created_at', { ascending: false })

  if (!isClinicalStaffOrAdmin) {
    sessionsQuery = sessionsQuery.eq('user_id', user.id)
  } else {
    sessionsQuery = sessionsQuery.limit(250)
  }

  // 2. Busca atribuições de escalas (scale_assignments)
  let assignmentsQuery = supabase
    .from('scale_assignments')
    .select('id, scale_type, status, assigned_at, completed_at, session_id, guest_id, patient_id')
    .order('assigned_at', { ascending: false })

  if (!isClinicalStaffOrAdmin) {
    assignmentsQuery = assignmentsQuery.eq('patient_id', user.id)
  } else {
    assignmentsQuery = assignmentsQuery.limit(250)
  }

  const [resSessions, resAssignments] = await Promise.all([sessionsQuery, assignmentsQuery])

  const sessionRows = resSessions.data || []
  const assignmentRows = resAssignments.data || []

  // Associa scale_assignments às sessões
  const sessionToAssignment = new Map<string, (typeof assignmentRows)[0]>()
  for (const a of assignmentRows) {
    if (a.session_id) {
      sessionToAssignment.set(a.session_id, a)
    }
  }

  // 3. Coleta guest_ids e profile_ids para resolução de nomes PII
  const guestIds = new Set<string>()
  const profileIds = new Set<string>()

  for (const s of sessionRows) {
    const meta = metaOf(s.metadata)
    const gid = (meta?.guest_id as string) || sessionToAssignment.get(s.id)?.guest_id
    if (gid) guestIds.add(gid)
    if (s.profile_id) profileIds.add(s.profile_id)
    else if (s.user_id) profileIds.add(s.user_id)
  }

  for (const a of assignmentRows) {
    if (a.guest_id) guestIds.add(a.guest_id)
    if (a.patient_id) profileIds.add(a.patient_id)
  }

  // 4. Descriptografia PII dos pacientes via list_guests_admin (RPC segura)
  const guestNameMap: Record<string, string> = {}
  if (guestIds.size > 0 && isClinicalStaffOrAdmin) {
    try {
      const { data: guestRows } = await supabase.rpc('list_guests_admin')
      ;(guestRows || []).forEach(
        (g: { id: string; first_name: string | null; last_name: string | null }) => {
          if (guestIds.has(g.id)) {
            const fullName = `${g.first_name || ''} ${g.last_name || ''}`.trim()
            if (fullName) guestNameMap[g.id] = fullName
          }
        },
      )
    } catch {
      // Ignora erro de RPC para fallback individual
    }

    // Fallback getGuestFull para IDs não cobertos
    const missing = [...guestIds].filter((id) => !guestNameMap[id])
    if (missing.length > 0) {
      await Promise.all(
        missing.map(async (id) => {
          try {
            const { data } = await getGuestFull(id)
            if (data) {
              const full = `${data.first_name || ''} ${data.last_name || ''}`.trim()
              if (full) guestNameMap[id] = full
            }
          } catch {
            // guest não encontrado
          }
        }),
      )
    }
  }

  // 5. Mapeia perfis para obter nomes e vínculo com guests
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

    // Resolve novos guests descobertos via profile
    const missingFromProfiles = [...guestIds].filter((id) => !guestNameMap[id])
    if (missingFromProfiles.length > 0 && isClinicalStaffOrAdmin) {
      await Promise.all(
        missingFromProfiles.map(async (id) => {
          try {
            const { data } = await getGuestFull(id)
            if (data) {
              const full = `${data.first_name || ''} ${data.last_name || ''}`.trim()
              if (full) guestNameMap[id] = full
            }
          } catch {
            // fallback
          }
        }),
      )
    }
  }

  // 6. Busca respostas descriptografadas e feedback clínico para cálculo de risco das sessões
  const sessionIds = sessionRows.map((s) => s.id)
  const [feedbackRes, responsesRes] = await Promise.all([
    sessionIds.length > 0
      ? supabase
          .from('clinical_feedback')
          .select(
            'session_id, phq9_score, gad7_score, snap_iv_inattention, snap_iv_hyperactivity, snap_iv_score, moca_score, global_severity',
          )
          .in('session_id', sessionIds.slice(0, 100))
      : Promise.resolve({ data: [], error: null }),
    sessionIds.length > 0
      ? supabase
          .from('anamnesis_responses')
          .select('session_id, question_key, response_value')
          .in('session_id', sessionIds.slice(0, 100))
      : Promise.resolve({ data: [], error: null }),
  ])

  const feedbackMap = new Map<string, any>()
  ;(feedbackRes.data || []).forEach((f) => {
    if (f.session_id) feedbackMap.set(f.session_id, f)
  })

  const responsesBySession = new Map<string, any[]>()
  ;(responsesRes.data || []).forEach((r) => {
    if (!r.session_id) return
    const list = responsesBySession.get(r.session_id) || []
    list.push(r)
    responsesBySession.set(r.session_id, list)
  })

  // 7. Função de resolução de nome do paciente
  const resolvePatientName = (
    guestId: string | null,
    profileId: string | null,
    meta: Record<string, unknown> | null,
  ): { name: string; isOrphan: boolean } => {
    // 1. Guest ID direto
    if (guestId && guestNameMap[guestId]) {
      return { name: guestNameMap[guestId], isOrphan: false }
    }

    // 2. Profile ID -> guest vinculado ou nome do perfil
    if (profileId && profileMap[profileId]) {
      const prof = profileMap[profileId]
      if (prof.guest_id && guestNameMap[prof.guest_id]) {
        return { name: guestNameMap[prof.guest_id], isOrphan: false }
      }
      // Se não for admin da clínica, pode usar o nome do perfil
      if (prof.nome && prof.role !== 'admin' && prof.role !== 'doutor') {
        return { name: prof.nome, isOrphan: false }
      }
    }

    // 3. Nome presente em metadados (ex: Mini 500 ou triagens públicas)
    const rawMetaName =
      (meta?.name as string) || (meta?.patient_name as string) || (meta?.patientName as string)
    if (rawMetaName && rawMetaName.trim() && rawMetaName.trim() !== 'Paciente') {
      return { name: rawMetaName.trim(), isOrphan: false }
    }

    return { name: UNIDENTIFIED_PATIENT_LABEL, isOrphan: true }
  }

  // 8. Constrói a lista final de sessões do dashboard
  const clinicalSessions: ClinicalSessionItem[] = []
  const coveredSessionIds = new Set<string>()

  // 8a. Processa anamnesis_sessions
  for (const s of sessionRows) {
    coveredSessionIds.add(s.id)
    const meta = metaOf(s.metadata)
    const assignment = sessionToAssignment.get(s.id)

    const resolvedGuestId = (meta?.guest_id as string) || assignment?.guest_id || null
    const resolvedProfileId = s.profile_id || s.user_id || assignment?.patient_id || null

    const { name: patientName, isOrphan } = resolvePatientName(
      resolvedGuestId,
      resolvedProfileId,
      meta,
    )

    // Tipo de escala/avaliação
    const type =
      assignment?.scale_type ||
      (meta?.type as string) ||
      (meta?.scale_type as string) ||
      (meta?.scale as string) ||
      (meta?.scaleType as string) ||
      'Anamnese'

    // Cálculo de scores e risco
    const fb = feedbackMap.get(s.id)
    const responses = responsesBySession.get(s.id) || []

    let mchatScore: number | null = null
    let snapivInattention: number | null = fb?.snap_iv_inattention ?? null
    let snapivHyperactivity: number | null = fb?.snap_iv_hyperactivity ?? null
    let riskLevel: 'low' | 'medium' | 'high' | null = null

    // M-CHAT-R
    const mchatResp = responses.filter((r) => r.question_key?.startsWith('mchat_'))
    if (mchatResp.length > 0) {
      mchatScore = mchatResp.reduce((acc: number, r: any) => {
        const q = mchatQuestions.find((mq) => mq.key === r.question_key)
        if (!q) return acc
        const val = parseValue(r.response_value)
        return val === q.riskAnswer ? acc + 1 : acc
      }, 0)
      riskLevel = getMChatRiskLevel(mchatScore)
    }

    // SNAP-IV se não estiver no feedback
    if (snapivInattention === null || snapivHyperactivity === null) {
      const snapivResp = responses.filter((r) => r.question_key?.startsWith('snapiv_'))
      if (snapivResp.length > 0) {
        const inatt = snapivResp.filter((r) => {
          const q = snapivQuestions.find((sq) => sq.key === r.question_key)
          return q?.subscale === 'inattention'
        })
        const hyper = snapivResp.filter((r) => {
          const q = snapivQuestions.find((sq) => sq.key === r.question_key)
          return q?.subscale === 'hyperactivity'
        })
        snapivInattention = avg(inatt)
        snapivHyperactivity = avg(hyper)
        if (!riskLevel) {
          const maxAvg = Math.max(snapivInattention, snapivHyperactivity)
          riskLevel = getSnapivRiskLevel(maxAvg)
        }
      }
    } else if (!riskLevel) {
      const maxAvg = Math.max(snapivInattention, snapivHyperactivity)
      riskLevel = getSnapivRiskLevel(maxAvg)
    }

    // Outros riscos baseados em PHQ-9, GAD-7 ou severidade global
    if (!riskLevel) {
      if (fb?.global_severity === 'high' || (fb?.phq9_score && fb.phq9_score >= 15)) {
        riskLevel = 'high'
      } else if (
        fb?.global_severity === 'moderate' ||
        (fb?.phq9_score && fb.phq9_score >= 10) ||
        (fb?.gad7_score && fb.gad7_score >= 10)
      ) {
        riskLevel = 'medium'
      } else if (fb?.global_severity === 'low' || fb?.phq9_score != null) {
        riskLevel = 'low'
      }
    }

    const rawTotal =
      (meta?.totalScore as number | string | undefined) ??
      (meta?.total_score as number | string | undefined) ??
      fb?.phq9_score ??
      fb?.gad7_score ??
      fb?.moca_score ??
      null

    const totalScore =
      rawTotal !== null && rawTotal !== undefined && !isNaN(Number(rawTotal))
        ? Number(rawTotal)
        : null

    clinicalSessions.push({
      id: s.id,
      session_id: s.id,
      source: 'session',
      type,
      started_at: s.started_at,
      completed_at: s.completed_at,
      status: s.status,
      riskLevel,
      patient_name: patientName,
      is_orphan: isOrphan,
      guest_id: resolvedGuestId,
      profile_id: resolvedProfileId,
      mchatScore,
      snapivInattention,
      snapivHyperactivity,
      totalScore,
      responseCount: responses.length,
    })
  }

  // 8b. Adiciona atribuições de escalas pendentes que ainda não têm sessão iniciada
  for (const a of assignmentRows) {
    if (a.session_id && coveredSessionIds.has(a.session_id)) {
      continue
    }
    const { name: patientName, isOrphan } = resolvePatientName(a.guest_id, a.patient_id, null)

    clinicalSessions.push({
      id: a.id,
      session_id: a.session_id || a.id,
      source: 'assignment',
      type: a.scale_type,
      started_at: a.assigned_at,
      completed_at: a.completed_at,
      status: a.status,
      riskLevel: null,
      patient_name: patientName,
      is_orphan: isOrphan,
      guest_id: a.guest_id,
      profile_id: a.patient_id,
      mchatScore: null,
      snapivInattention: null,
      snapivHyperactivity: null,
      totalScore: null,
      responseCount: 0,
    })
  }

  // Ordena decrescente por data
  clinicalSessions.sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
  )

  // 9. Métricas agregadas
  const completedCount = clinicalSessions.filter((s) => s.status === 'completed').length
  const inProgressCount = clinicalSessions.filter(
    (s) => s.status === 'in_progress' || s.status === 'in-progress',
  ).length
  const pendingAssignmentsCount = clinicalSessions.filter((s) => s.status === 'pending').length
  const highRiskCount = clinicalSessions.filter((s) => s.riskLevel === 'high').length
  const mediumRiskCount = clinicalSessions.filter((s) => s.riskLevel === 'medium').length
  const lowRiskCount = clinicalSessions.filter((s) => s.riskLevel === 'low').length

  const identifiedPatients = new Set<string>()
  clinicalSessions.forEach((s) => {
    if (!s.is_orphan && s.patient_name !== UNIDENTIFIED_PATIENT_LABEL) {
      identifiedPatients.add(s.patient_name)
    }
  })

  return {
    sessions: clinicalSessions,
    metrics: {
      totalAssessments: clinicalSessions.length,
      completedCount,
      inProgressCount,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      identifiedPatientsCount: identifiedPatients.size,
      uniquePatientsCount: identifiedPatients.size,
      pendingAssignmentsCount,
    },
  }
}
