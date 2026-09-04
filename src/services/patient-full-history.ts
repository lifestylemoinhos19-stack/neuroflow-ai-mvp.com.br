import { supabase } from '@/lib/supabase/client'
import { getGuestFull } from '@/services/guest-patient'
import {
  mchatQuestions,
  snapivQuestions,
  getMChatRiskLevel,
  getSnapivRiskLevel,
} from '@/lib/scales-data'
import { translateStatus } from '@/services/admin-sessions'

export interface PatientIdentification {
  guest_id: string
  first_name: string
  last_name: string
  full_name: string
  email: string | null
  phone: string | null
  document: string | null
  birth_date: string | null
  age: number | null
}

export interface PatientEvaluationItem {
  id: string
  session_id: string
  scale_type: string
  started_at: string
  completed_at: string | null
  status: string
  translatedStatus: string
  score: number | null
  risk_level: 'low' | 'medium' | 'high' | null
  risk_label: string
  interpretation: string | null
  system_suggestion: string | null
  mchat_score: number | null
  snapiv_inattention: number | null
  snapiv_hyperactivity: number | null
  response_count: number
  source: 'session' | 'assignment'
  has_report: boolean
  report_id?: string
}

export interface PatientReportItem {
  id: string
  session_id: string
  scale_type: string
  created_at: string
  admin_edited_interpretation: string | null
  system_suggestion: string | null
  comments: string | null
  is_accurate: boolean | null
  score: number | null
}

export interface PatientFullHistory {
  identification: PatientIdentification
  evaluations: PatientEvaluationItem[]
  reports: PatientReportItem[]
  metrics: {
    totalEvaluations: number
    completedEvaluations: number
    inProgressEvaluations: number
    highRiskEvaluations: number
    reportsCount: number
    firstEvaluationDate: string | null
    latestEvaluationDate: string | null
  }
}

function metaOf(m: unknown): Record<string, unknown> | null {
  return m && typeof m === 'object' ? (m as Record<string, unknown>) : null
}

function parseValue(val: unknown): any {
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    try {
      return JSON.parse(val)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

export function calculateAgeFromBirthDate(birthDate: string | null): number | null {
  if (!birthDate) return null
  const b = new Date(birthDate)
  if (isNaN(b.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - b.getFullYear()
  const m = today.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--
  return age >= 0 ? age : null
}

/**
 * Busca o histórico completo de um paciente por `guest_id`:
 * 1. Dados cadastrais descriptografados (LGPD seguro) via RPC `list_guests_admin` + fallback `get_guest_full`.
 * 2. Todas as avaliações/sessões e escalas atribuídas (anamnesis_sessions, scale_assignments).
 * 3. Respostas, escores, níveis de risco clínicos e interpretações (clinical_feedback).
 * 4. Laudos existentes gerados para o paciente.
 */
export async function getPatientFullHistory(guestId: string): Promise<PatientFullHistory | null> {
  if (!guestId) return null

  // 1. Busca dados cadastrais LGPD descriptografados
  let idData: PatientIdentification = {
    guest_id: guestId,
    first_name: 'Paciente',
    last_name: '',
    full_name: 'Paciente',
    email: null,
    phone: null,
    document: null,
    birth_date: null,
    age: null,
  }

  try {
    const { data: adminGuests } = await supabase.rpc('list_guests_admin')
    const match = (adminGuests || []).find((g: any) => g.id === guestId)
    if (match) {
      const fn = match.first_name || ''
      const ln = match.last_name || ''
      idData = {
        guest_id: guestId,
        first_name: fn || 'Paciente',
        last_name: ln,
        full_name: `${fn} ${ln}`.trim() || 'Paciente',
        email: match.email || null,
        phone: match.phone || null,
        document: match.document || null,
        birth_date: match.birth_date || null,
        age: calculateAgeFromBirthDate(match.birth_date),
      }
    } else {
      // Fallback getGuestFull
      const { data: fullGuest } = await getGuestFull(guestId)
      if (fullGuest) {
        const fn = fullGuest.first_name || ''
        const ln = fullGuest.last_name || ''
        idData = {
          guest_id: guestId,
          first_name: fn || 'Paciente',
          last_name: ln,
          full_name: `${fn} ${ln}`.trim() || 'Paciente',
          email: fullGuest.email || null,
          phone: null,
          document: fullGuest.document || null,
          birth_date: fullGuest.birth_date || null,
          age: calculateAgeFromBirthDate(fullGuest.birth_date),
        }
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    console.warn('[getPatientFullHistory] Falha ao carregar identificação do paciente:', err)
  }

  // 2. Busca sessões e escalas vinculadas a este guest
  const [resAssignments, resSessions] = await Promise.all([
    supabase
      .from('scale_assignments')
      .select('id, scale_type, status, assigned_at, completed_at, session_id, guest_id, patient_id')
      .eq('guest_id', guestId)
      .order('assigned_at', { ascending: false }),
    supabase
      .from('anamnesis_sessions')
      .select('id, user_id, profile_id, status, started_at, completed_at, metadata, guest_token')
      .order('created_at', { ascending: false })
      .limit(300),
  ])

  const assignments = resAssignments.data || []
  const allSessions = resSessions.data || []

  // Sessões que pertencem diretamente a este guest (por metadata->guest_id ou vinculadas a assignments)
  const assignmentSessionIds = new Set(
    assignments.map((a) => a.session_id).filter(Boolean) as string[],
  )
  const guestSessions = allSessions.filter((s) => {
    const meta = metaOf(s.metadata)
    const g = (meta?.guest_id as string) || null
    return g === guestId || assignmentSessionIds.has(s.id)
  })

  // Coleta todos os session_ids relevantes
  const allRelevantSessionIds = new Set<string>()
  assignments.forEach((a) => {
    if (a.session_id) allRelevantSessionIds.add(a.session_id)
  })
  guestSessions.forEach((s) => allRelevantSessionIds.add(s.id))
  const sessionIdsList = [...allRelevantSessionIds]

  // 3. Busca clinical_feedback e anamnesis_responses para os session_ids
  const [resFeedback, resResponses] = await Promise.all([
    sessionIdsList.length > 0
      ? supabase.from('clinical_feedback').select('*').in('session_id', sessionIdsList)
      : Promise.resolve({ data: [] }),
    sessionIdsList.length > 0
      ? supabase
          .from('anamnesis_responses')
          .select('session_id, question_key, response_value')
          .in('session_id', sessionIdsList)
      : Promise.resolve({ data: [] }),
  ])

  const feedbackList = (resFeedback.data || []) as any[]
  const responsesList = (resResponses.data || []) as any[]

  const feedbackBySession = new Map<string, any>()
  feedbackList.forEach((fb) => {
    if (fb.session_id) feedbackBySession.set(fb.session_id, fb)
  })

  const responsesBySession = new Map<string, any[]>()
  responsesList.forEach((r) => {
    if (!r.session_id) return
    const list = responsesBySession.get(r.session_id) || []
    list.push(r)
    responsesBySession.set(r.session_id, list)
  })

  // 4. Constrói a lista unificada de avaliações do paciente
  const evaluations: PatientEvaluationItem[] = []
  const coveredSessionIds = new Set<string>()

  // 4a. A partir de scale_assignments
  for (const a of assignments) {
    const sessId = a.session_id || a.id
    if (a.session_id) coveredSessionIds.add(a.session_id)

    const fb = a.session_id ? feedbackBySession.get(a.session_id) : null
    const responses = a.session_id ? responsesBySession.get(a.session_id) || [] : []

    let score: number | null = null
    let riskLevel: 'low' | 'medium' | 'high' | null = null
    let mchatScore: number | null = null
    let snapivInattention: number | null = fb?.snap_iv_inattention ?? null
    let snapivHyperactivity: number | null = fb?.snap_iv_hyperactivity ?? null

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
      score = mchatScore
    }

    // SNAP-IV
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
        const maxAvg = Math.max(snapivInattention, snapivHyperactivity)
        riskLevel = getSnapivRiskLevel(maxAvg)
        score = +maxAvg.toFixed(2)
      }
    } else {
      const maxAvg = Math.max(snapivInattention, snapivHyperactivity)
      riskLevel = getSnapivRiskLevel(maxAvg)
      score = +maxAvg.toFixed(2)
    }

    // Escores a partir do feedback
    if (score === null && fb) {
      score =
        fb.phq9_score ??
        fb.gad7_score ??
        fb.moca_score ??
        fb.meem_score ??
        fb.hamd_score ??
        fb.hama_score ??
        fb.ftdrs_score ??
        fb.fas_score ??
        fb.sds_score ??
        fb.snap_iv_score ??
        null
    }

    // Avaliação de risco secundária
    if (!riskLevel && fb) {
      if (fb.global_severity === 'high' || (fb.phq9_score && fb.phq9_score >= 15)) {
        riskLevel = 'high'
      } else if (
        fb.global_severity === 'moderate' ||
        (fb.phq9_score && fb.phq9_score >= 10) ||
        (fb.gad7_score && fb.gad7_score >= 10)
      ) {
        riskLevel = 'medium'
      } else if (fb.global_severity === 'low' || fb.phq9_score != null) {
        riskLevel = 'low'
      }
    }

    const interpretationText =
      fb?.admin_edited_interpretation || fb?.system_suggestion || fb?.comments || null

    evaluations.push({
      id: a.id,
      session_id: sessId,
      scale_type: a.scale_type,
      started_at: a.assigned_at,
      completed_at: a.completed_at,
      status: a.status,
      translatedStatus: translateStatus(a.status),
      score,
      risk_level: riskLevel,
      risk_label:
        riskLevel === 'high'
          ? 'Risco Alto'
          : riskLevel === 'medium'
            ? 'Risco Médio'
            : riskLevel === 'low'
              ? 'Risco Baixo'
              : 'Não avaliado',
      interpretation: interpretationText,
      system_suggestion: fb?.system_suggestion || null,
      mchat_score: mchatScore,
      snapiv_inattention: snapivInattention,
      snapiv_hyperactivity: snapivHyperactivity,
      response_count: responses.length,
      source: 'assignment',
      has_report: !!interpretationText || !!fb,
      report_id: fb?.id,
    })
  }

  // 4b. A partir de anamnesis_sessions (não cobertas por assignments)
  for (const s of guestSessions) {
    if (coveredSessionIds.has(s.id)) continue
    coveredSessionIds.add(s.id)

    const meta = metaOf(s.metadata)
    const scaleType =
      (meta?.type as string) ||
      (meta?.scale_type as string) ||
      (meta?.scale as string) ||
      (meta?.scaleType as string) ||
      'Anamnese'

    const fb = feedbackBySession.get(s.id)
    const responses = responsesBySession.get(s.id) || []

    let score: number | null = null
    let riskLevel: 'low' | 'medium' | 'high' | null = null
    let mchatScore: number | null = null
    let snapivInattention: number | null = fb?.snap_iv_inattention ?? null
    let snapivHyperactivity: number | null = fb?.snap_iv_hyperactivity ?? null

    const mchatResp = responses.filter((r) => r.question_key?.startsWith('mchat_'))
    if (mchatResp.length > 0) {
      mchatScore = mchatResp.reduce((acc: number, r: any) => {
        const q = mchatQuestions.find((mq) => mq.key === r.question_key)
        if (!q) return acc
        const val = parseValue(r.response_value)
        return val === q.riskAnswer ? acc + 1 : acc
      }, 0)
      riskLevel = getMChatRiskLevel(mchatScore)
      score = mchatScore
    }

    if (score === null && meta) {
      const rawMeta =
        (meta.totalScore as number | string | undefined) ??
        (meta.total_score as number | string | undefined)
      if (rawMeta !== null && rawMeta !== undefined && !isNaN(Number(rawMeta))) {
        score = Number(rawMeta)
      }
    }

    if (score === null && fb) {
      score =
        fb.phq9_score ??
        fb.gad7_score ??
        fb.moca_score ??
        fb.meem_score ??
        fb.hamd_score ??
        fb.hama_score ??
        fb.ftdrs_score ??
        fb.fas_score ??
        fb.sds_score ??
        null
    }

    if (!riskLevel && fb) {
      if (fb.global_severity === 'high' || (fb.phq9_score && fb.phq9_score >= 15)) {
        riskLevel = 'high'
      } else if (
        fb.global_severity === 'moderate' ||
        (fb.phq9_score && fb.phq9_score >= 10) ||
        (fb.gad7_score && fb.gad7_score >= 10)
      ) {
        riskLevel = 'medium'
      } else if (fb.global_severity === 'low' || fb.phq9_score != null) {
        riskLevel = 'low'
      }
    }

    const interpretationText =
      fb?.admin_edited_interpretation || fb?.system_suggestion || fb?.comments || null

    evaluations.push({
      id: s.id,
      session_id: s.id,
      scale_type: scaleType,
      started_at: s.started_at,
      completed_at: s.completed_at,
      status: s.status,
      translatedStatus: translateStatus(s.status),
      score,
      risk_level: riskLevel,
      risk_label:
        riskLevel === 'high'
          ? 'Risco Alto'
          : riskLevel === 'medium'
            ? 'Risco Médio'
            : riskLevel === 'low'
              ? 'Risco Baixo'
              : 'Não avaliado',
      interpretation: interpretationText,
      system_suggestion: fb?.system_suggestion || null,
      mchat_score: mchatScore,
      snapiv_inattention: snapivInattention,
      snapiv_hyperactivity: snapivHyperactivity,
      response_count: responses.length,
      source: 'session',
      has_report: !!interpretationText || !!fb,
      report_id: fb?.id,
    })
  }

  // Ordena decrescente por data
  evaluations.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())

  // 5. Constrói laudos / relatórios gerados
  const reports: PatientReportItem[] = []
  for (const fb of feedbackList) {
    const matchingEval = evaluations.find((e) => e.session_id === fb.session_id)
    reports.push({
      id: fb.id,
      session_id: fb.session_id,
      scale_type: matchingEval?.scale_type || 'Avaliação Clínica',
      created_at: fb.created_at,
      admin_edited_interpretation: fb.admin_edited_interpretation || null,
      system_suggestion: fb.system_suggestion || null,
      comments: fb.comments || null,
      is_accurate: fb.is_accurate,
      score: matchingEval?.score ?? null,
    })
  }
  reports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // 6. Métricas consolidadas
  const totalEvaluations = evaluations.length
  const completedEvaluations = evaluations.filter((e) => e.status === 'completed').length
  const inProgressEvaluations = evaluations.filter(
    (e) => e.status === 'in_progress' || e.status === 'in-progress' || e.status === 'pending',
  ).length
  const highRiskEvaluations = evaluations.filter((e) => e.risk_level === 'high').length

  const firstDate = evaluations.length > 0 ? evaluations[evaluations.length - 1].started_at : null
  const latestDate = evaluations.length > 0 ? evaluations[0].started_at : null

  return {
    identification: idData,
    evaluations,
    reports,
    metrics: {
      totalEvaluations,
      completedEvaluations,
      inProgressEvaluations,
      highRiskEvaluations,
      reportsCount: reports.length,
      firstEvaluationDate: firstDate,
      latestEvaluationDate: latestDate,
    },
  }
}
