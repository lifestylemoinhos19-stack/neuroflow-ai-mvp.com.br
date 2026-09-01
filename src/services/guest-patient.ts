import { supabase } from '@/lib/supabase/client'

export interface IdentifiedGuest {
  id: string
  first_name: string
  last_name: string
  birth_date: string | null
  document: string | null
  profession: string | null
  address: string | null
  responsible_name: string | null
}

export interface GuestAssignment {
  id: string
  scale_type: string
  status: string
  assigned_at: string
  completed_at: string | null
}

export interface GuestAssessmentResponse {
  question_key: string
  question_label: string | null
  response_value: string
}

export interface GuestAssessmentResult {
  assignment_id: string | null
  scale_type: string
  status: string
  assigned_at: string | null
  completed_at: string | null
  session_id: string | null
  total_score: number | null
  severity: string | null
  responses: GuestAssessmentResponse[]
}

export interface GuestFull {
  id: string
  first_name: string
  last_name: string
  birth_date: string | null
  document: string | null
  email: string | null
  profession: string | null
  address: string | null
  responsible_name: string | null
}

/**
 * Identify a patient by CPF via the identify_guest_public RPC.
 * Finds an existing guest by document (decrypted server-side) or creates a new one.
 * Callable by anon (public patient form, no login required).
 */
export async function identifyGuest(
  fullName: string,
  birthDate: string,
  document: string,
  profession: string,
  address: string,
  responsibleName: string,
): Promise<{ data: IdentifiedGuest | null; error: string | null }> {
  const parts = fullName.trim().split(/\s+/)
  const first_name = parts[0] || ''
  const last_name = parts.slice(1).join(' ') || ''

  const { data, error } = await supabase.rpc('identify_guest_public', {
    p_first_name: first_name,
    p_last_name: last_name,
    p_birth_date: birthDate,
    p_document: document,
    p_profession: profession,
    p_address: address,
    p_responsible_name: responsibleName,
  })

  if (error) return { data: null, error: error.message }
  if (!data || data.length === 0) return { data: null, error: 'Nenhum dado retornado.' }

  const row = data[0]
  return {
    data: {
      id: row.out_id,
      first_name: row.out_first_name,
      last_name: row.out_last_name,
      birth_date: row.out_birth_date,
      document: row.out_document,
      profession: row.out_profession,
      address: row.out_address,
      responsible_name: row.out_responsible_name,
    },
    error: null,
  }
}

/**
 * Get the scale assignments for a guest via the get_guest_assignments RPC.
 * Callable by anon — returns ONLY the scales assigned to this guest.
 */
export async function getGuestAssignments(
  guestId: string,
): Promise<{ data: GuestAssignment[]; error: string | null }> {
  const { data, error } = await supabase.rpc('get_guest_assignments', {
    p_guest_id: guestId,
  })

  if (error) return { data: [], error: error.message }
  return {
    data: (data || []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      scale_type: r.scale_type as string,
      status: r.status as string,
      assigned_at: r.assigned_at as string,
      completed_at: r.completed_at as string,
    })),
    error: null,
  }
}

/**
 * Mark a scale assignment as completed via the complete_assignment RPC.
 */
export async function completeAssignment(assignmentId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('complete_assignment', {
    p_assignment_id: assignmentId,
  })
  return { error: error?.message ?? null }
}

/**
 * Get decrypted guest data for the admin PDF laudo.
 * Restricted to admin/doctor/staff roles.
 */
export async function getGuestFull(
  guestId: string,
): Promise<{ data: GuestFull | null; error: string | null }> {
  const { data, error } = await supabase.rpc('get_guest_full', {
    p_guest_id: guestId,
  })

  if (error) return { data: null, error: error.message }
  if (!data || data.length === 0) return { data: null, error: 'Guest não encontrado.' }

  const row = data[0]
  return {
    data: {
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      birth_date: row.birth_date,
      document: row.document,
      email: row.email,
      profession: row.profession,
      address: row.address,
      responsible_name: row.responsible_name,
    },
    error: null,
  }
}

/**
 * Marca o TCLE (Termo de Consentimento Livre e Esclarecido) como aceito
 * para um guest. Callable por anon (paciente público).
 */
export async function acceptGuestTcle(guestId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('accept_guest_tcle', {
    p_guest_id: guestId,
  })
  return { error: error?.message ?? null }
}

/**
 * Verifica se um guest já aceitou o TCLE.
 */
export async function getGuestTcleStatus(
  guestId: string,
): Promise<{ accepted: boolean; error: string | null }> {
  const { data, error } = await supabase.rpc('get_guest_tcle_status', {
    p_guest_id: guestId,
  })
  if (error) return { accepted: false, error: error.message }
  const rows = data as { tcle_accepted: boolean }[] | null
  if (!rows || rows.length === 0) return { accepted: false, error: null }
  return { accepted: !!rows[0].tcle_accepted, error: null }
}

/**
 * Procura um guest pelo CPF (document) para o fluxo de "acesso simplificado".
 * Usa o RPC find_guest_by_document, que descriptografa o campo document
 * server-side e NÃO cria um novo guest (apenas retorna o existente).
 */
export async function findGuestByCpf(
  document: string,
): Promise<{ data: IdentifiedGuest | null; error: string | null }> {
  const { data, error } = await supabase.rpc('find_guest_by_document', {
    p_document: document,
  })

  if (error) return { data: null, error: error.message }
  const rows = data as
    | {
        out_id: string
        out_first_name: string
        out_last_name: string
        out_birth_date: string | null
        out_document: string
        out_profession: string | null
        out_address: string | null
        out_responsible_name: string | null
        out_tcle_accepted: boolean
      }[]
    | null
  if (!rows || rows.length === 0) return { data: null, error: null }

  const row = rows[0]
  return {
    data: {
      id: row.out_id,
      first_name: row.out_first_name,
      last_name: row.out_last_name,
      birth_date: row.out_birth_date,
      document: row.out_document,
      profession: row.out_profession,
      address: row.out_address,
      responsible_name: row.out_responsible_name,
    },
    error: null,
  }
}

/**
 * Busca as respostas/pontuações das avaliações concluídas de um paciente
 * (guest), sem exigir login. Usado pela tela "Ver respostas" em
 * /minhas-escalas. Retorna tanto assignments vinculados a sessões quanto
 * sessões órfãs (criadas pelos componentes de escala via guest_token).
 */
export async function getGuestAssessmentResults(
  guestId: string,
): Promise<{ data: GuestAssessmentResult[]; error: string | null }> {
  const { data, error } = await supabase.rpc('get_guest_assessment_results', {
    p_guest_id: guestId,
  })
  if (error) return { data: [], error: error.message }
  const rows = (data || []) as Record<string, unknown>[]
  return {
    data: rows.map((r) => ({
      assignment_id: (r.assignment_id as string | null) ?? null,
      scale_type: (r.scale_type as string) ?? '',
      status: (r.status as string) ?? '',
      assigned_at: (r.assigned_at as string | null) ?? null,
      completed_at: (r.completed_at as string | null) ?? null,
      session_id: (r.session_id as string | null) ?? null,
      total_score:
        r.total_score !== null && r.total_score !== undefined ? Number(r.total_score) : null,
      severity: (r.severity as string | null) ?? null,
      responses: (r.responses as GuestAssessmentResponse[]) ?? [],
    })),
    error: null,
  }
}

/**
 * Calculate age from a birth date string. Returns null if invalid.
 */
export function calculateAge(birthDate: string): number | null {
  const birth = new Date(birthDate)
  if (isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age >= 0 ? age : null
}

/**
 * Check if a person is underage (< 18) based on birth date.
 */
export function isUnderage(birthDate: string): boolean {
  const age = calculateAge(birthDate)
  return age !== null && age < 18
}

/**
 * Format a CPF string with the mask ___.___.___-__
 */
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
}

/**
 * Scale display names and route mapping.
 */
export const SCALE_DISPLAY_NAMES: Record<string, string> = {
  BDI: 'BDI-II (Beck Depressão)',
  'BDI-II': 'BDI-II (Beck Depressão)',
  bdi: 'BDI-II (Beck Depressão)',
  BAI: 'BAI (Beck Ansiedade)',
  bai: 'BAI (Beck Ansiedade)',
  'PHQ-9': 'PHQ-9 (Depressão)',
  'GAD-7': 'GAD-7 (Ansiedade)',
  ASSQ: 'ASSQ (Autismo)',
  'SNAP-IV': 'SNAP-IV (TDAH)',
  'ASRS-18': 'ASRS-18 (TDAH Adulto)',
  MoCA: 'MoCA (Cognição)',
  MEEM: 'MEEM (Cognição)',
  'HAM-D': 'HAM-D (Depressão)',
  'HAM-A': 'HAM-A (Ansiedade)',
  'Y-BOCS': 'Y-BOCS (TOC)',
  FAS: 'FAS (Fluência Verbal)',
  FTDRS: 'FTDRS (Demência Frontotemporal)',
  'MINI 5.0.0': 'MINI 5.0.0 (Entrevista Neuropsiquiátrica Internacional)',
  ANAMNESE: 'Anamnese (Entrevista Clínica Inicial)',
  MARCOS: 'Marcos do Desenvolvimento (Neurodesenvolvimento)',
  'COG-TRIAGE': 'Triagem Cognitiva NeuroFlow (Cognição)',
  'TMT A/B': 'TMT A/B (Trail Making Test - Partes A e B)',
  TMT: 'TMT A/B (Trail Making Test)',
  'FLUENCIA-SEMANTICA': 'Fluência Verbal Semântica (Animais e Frutas)',
  'Fluência Semântica': 'Fluência Verbal Semântica (Animais e Frutas)',
}

export function getScaleDisplayName(scaleType: string): string {
  return SCALE_DISPLAY_NAMES[scaleType] || scaleType
}

/**
 * Map a scale_type to the public assessment route.
 */
export function getScaleRoute(scaleType: string): string {
  const normalized = scaleType.toUpperCase().trim()
  switch (normalized) {
    case 'SNAP-IV':
      return '/avaliacao/snapiv'
    case 'ASSQ':
      return '/avaliacao/assq'
    case 'CBCL':
      return '/avaliacao/cbcl'
    case 'PHQ-9':
      return '/avaliacao/phq9'
    case 'GAD-7':
      return '/avaliacao/gad7'
    case 'BDI':
    case 'BDI-II':
    case 'bdi':
      return '/avaliacao/bdi'
    case 'BAI':
    case 'bai':
      return '/avaliacao/bai'
    case 'HAM-A':
      return '/avaliacao/hama'
    case 'HAM-D':
      return '/avaliacao/hamd'
    case 'ASRS-18':
      return '/avaliacao/asrs18'
    case 'MOCA':
      return '/avaliacao/moca'
    case 'MEEM':
      return '/avaliacao/meem'
    case 'Y-BOCS':
      return '/avaliacao/ybocs'
    case 'FAS':
      return '/avaliacao/fas'
    case 'FTDRS':
      return '/avaliacao/ftdrs'
    case 'SDS':
      return '/avaliacao/sds'
    case 'MINI 5.0.0':
      return '/mini'
    case 'ANAMNESE':
      return '/avaliacao/anamnese'
    case 'MARCOS':
      return '/avaliacao/marcos-desenvolvimento'
    case 'COG-TRIAGE':
      return '/avaliacao/triagem-cognitiva'
    case 'TMT':
    case 'TMT A/B':
    case 'tmt':
      return '/avaliacao/tmt'
    case 'FLUENCIA-SEMANTICA':
    case 'FLUÊNCIA SEMÂNTICA':
    case 'FLUENCIA_SEMANTICA':
    case 'FLUÊNCIA SEMANTICA':
    case 'FLUENCIA SEMANTICA':
    case 'FLUÊNCIA VERBAL SEMÂNTICA':
    case 'fluencia-semantica':
      return '/avaliacao/fluencia-semantica'
    default:
      return '/avaliacao'
  }
}
