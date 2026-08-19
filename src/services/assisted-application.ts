/**
 * NeuroFlow — Serviço de Aplicação Assistida por Voz
 *
 * Persiste o registro de aplicação assistida na tabela `assisted_applications`
 * (uma linha por aplicação), seguindo o playbook "Aplicação Assistida de
 * Escalas ao Paciente".
 *
 * Regras não negociáveis refletidas na modelagem:
 *  - `items` (jsonb) guarda as respostas LITERAIS do paciente + a pontuação
 *    calculada conforme o protocolo + as sinalizações ("[ITEM NÃO APLICADO]",
 *    "[REQUER CORREÇÃO DO PROFISSIONAL]", "[RESPOSTA AMBÍGUA...]"). A skill
 *    NUNCA infere respostas ou pontuações de itens não respondidos.
 *  - `total_score` é a pontuação bruta calculada; fica NULL quando há itens
 *    com correção manual pendente (desenho, praxia, fluência).
 *  - `interpretation` é a leitura assistida SEMPRE com ressalva — nunca usa a
 *    palavra "diagnóstico".
 *  - `observations` é a seção 6 do registro (fadiga, distração, material).
 *
 * O JSON retornado por `generateApplicationJson` é a versão de integração com
 * o motor de laudos existente (generateNeuropsychReport).
 */
import { supabase } from '@/lib/supabase/client'
import { type AssistedScale, type AssistedItem } from '@/lib/assisted-scales-data'
import {
  type AssistedResponseRecord,
  type AssistedRecordContext,
  generateAssistedRecordJSON,
  detectImminentRisk,
} from '@/lib/assisted-record-export'

/**
 * Constrói o texto da interpretação assistida (seção 5) reaproveitando o
 * builder canônico de `assisted-record-export` (via JSON). SEMPRE com a
 * linguagem "compatível com" / "sugestivo de" / "área de atenção", nunca
 * "diagnóstico". Mantém PDF, JSON e banco 100% consistentes.
 */
function buildInterpretationText(ctx: AssistedRecordContext): string {
  const json = generateAssistedRecordJSON(ctx)
  const interp = (json as { interpretation?: unknown }).interpretation
  if (Array.isArray(interp)) return (interp as string[]).join(' ')
  if (typeof interp === 'string') return interp
  return ''
}

/** Linha de `assisted_applications` (lida do Supabase). */
export interface AssistedApplicationRow {
  id: string
  professional_id: string | null
  patient_id: string | null
  guest_id: string | null
  assignment_id: string | null
  session_id: string | null
  scale_type: string
  scale_name: string | null
  items: AssistedResponseRecord[]
  total_score: number | null
  interpretation: string | null
  observations: string | null
  metadata: Record<string, unknown>
  created_at: string
}

/** Payload de inserção. */
export interface SaveAssistedApplicationInput {
  professionalId: string | null
  patientId: string | null
  guestId: string | null
  assignmentId: string | null
  sessionId: string | null
  scale: AssistedScale
  /** Respostas registradas (buildRecordResponses). */
  items: AssistedResponseRecord[]
  /** Pontuação bruta ou NULL. */
  totalScore: number | null
  /** Observações do profissional (seção 6). */
  observations: string
  /** Contexto completo (para gerar a interpretação + JSON). */
  recordContext: AssistedRecordContext
}

/** Resultado de uma query Supabase (data + error). */
interface AssistedResult<T> {
  data: T
  error: { message: string } | null
}

/**
 * Builder fluente para leitura (select/eq/order/limit/maybeSingle). Cada
 * método encadeável devolve o próprio builder, que é thenable (pode ser
 * aguardado com `await` em qualquer ponto da cadeia).
 */
interface AssistedReadBuilder {
  select: (cols: string) => AssistedReadBuilder
  eq: (col: string, val: string) => AssistedReadBuilder
  order: (col: string, opts: { ascending: boolean }) => AssistedReadBuilder
  limit: (n: number) => AssistedReadBuilder
  maybeSingle: () => AssistedReadBuilder
  then: <R>(
    onfulfilled: (v: AssistedResult<unknown[] | unknown | null>) => R | PromiseLike<R>,
    onrejected?: (reason: unknown) => R | PromiseLike<R>,
  ) => Promise<R>
}

/**
 * Handle "não-tipado" para a tabela `assisted_applications` (tabela fora do
 * `Database` gerado — adicionada por migration após a última geração do
 * Supabase CLI). A forma/colunas/políticas são garantidas pela migration
 * `20260819225216_create_assisted_applications.sql`.
 */
const assistedTable = supabase.from('assisted_applications' as never) as never as {
  insert: (row: Record<string, unknown>) => {
    select: (cols: string) => { single: () => Promise<AssistedResult<unknown>> }
  }
  upsert: (
    row: Record<string, unknown>,
    opts: { onConflict: string },
  ) => {
    select: (cols: string) => { maybeSingle: () => Promise<AssistedResult<unknown>> }
  }
  select: (cols: string) => AssistedReadBuilder
}

/**
 * Persiste o registro de aplicação assistida. Idempotente em re-envios do
 * mesmo assignment (atualiza a linha existente em vez de duplicar).
 */
export async function saveAssistedApplication(
  input: SaveAssistedApplicationInput,
): Promise<{ data: AssistedApplicationRow | null; error: string | null }> {
  const interpretation = buildInterpretationText(input.recordContext)
  const metadata = {
    schema: 'neuroflow.assisted-record.v1',
    scale_key: input.scale.key,
    scale_version: input.scale.version,
    application_mode: input.scale.applicationMode,
    target: input.scale.target,
    iniciais: input.recordContext.iniciais,
    idade: input.recordContext.idade,
    escolaridade: input.recordContext.escolaridade,
    professional_name: input.recordContext.professionalName,
    imminent_risk: detectImminentRisk(input.items),
    json: generateAssistedRecordJSON(input.recordContext),
  }

  const row: Record<string, unknown> = {
    professional_id: input.professionalId,
    patient_id: input.patientId,
    guest_id: input.guestId,
    assignment_id: input.assignmentId,
    session_id: input.sessionId,
    scale_type: input.scale.key,
    scale_name: input.scale.name,
    items: input.items as unknown as Record<string, unknown>[],
    total_score: input.totalScore,
    interpretation,
    observations: input.observations,
    metadata: metadata as unknown as Record<string, unknown>,
  }

  // Upsert por assignment_id quando houver (evita duplicar ao re-salvar).
  const query = input.assignmentId
    ? assistedTable.upsert(row, { onConflict: 'assignment_id' }).select('*').maybeSingle()
    : assistedTable.insert(row).select('*').single()

  const { data, error } = await query

  if (error) {
    // Fallback: tenta insert puro quando o upsert por assignment_id falha
    // (ex.: constraint inesperada).
    if (input.assignmentId) {
      const { data: data2, error: error2 } = await assistedTable.insert(row).select('*').single()
      if (error2) return { data: null, error: (error2 as { message: string }).message }
      return { data: normalizeRow(data2), error: null }
    }
    return { data: null, error: (error as { message: string }).message }
  }

  return { data: normalizeRow(data), error: null }
}

/** Lista as aplicações assistidas de um profissional (ou todas p/ admin). */
export async function listAssistedApplications(
  professionalId?: string | null,
  limit = 50,
): Promise<{ data: AssistedApplicationRow[]; error: string | null }> {
  let q = assistedTable.select('*').order('created_at', { ascending: false })
  if (professionalId) q = q.eq('professional_id', professionalId)
  const { data, error } = await q.limit(limit)
  if (error) return { data: [], error: (error as { message: string }).message }
  return { data: ((data as unknown[]) || []).map(normalizeRow), error: null }
}

/** Busca uma aplicação assistida pelo id. */
export async function getAssistedApplication(
  id: string,
): Promise<{ data: AssistedApplicationRow | null; error: string | null }> {
  const { data, error } = await assistedTable.select('*').eq('id', id).maybeSingle()
  if (error) return { data: null, error: (error as { message: string }).message }
  return { data: normalizeRow(data), error: null }
}

/** Lista as aplicações assistidas vinculadas a um scale_assignment. */
export async function listByAssignment(
  assignmentId: string,
): Promise<{ data: AssistedApplicationRow[]; error: string | null }> {
  const { data, error } = await assistedTable
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('created_at', { ascending: false })
  if (error) return { data: [], error: (error as { message: string }).message }
  return { data: ((data as unknown[]) || []).map(normalizeRow), error: null }
}

/** Gera o JSON de integração a partir de um registro persistido. */
export function generateApplicationJson(row: AssistedApplicationRow): Record<string, unknown> {
  const meta = (row.metadata ?? {}) as { json?: Record<string, unknown> }
  if (meta.json) return meta.json
  // Fallback: reconstrói um JSON mínimo a partir da linha.
  return {
    schema: 'neuroflow.assisted-record.v1',
    id: row.id,
    scale: { key: row.scale_type, name: row.scale_name ?? row.scale_type },
    items: row.items,
    totalScore: row.total_score,
    interpretation: row.interpretation,
    observations: row.observations,
    createdAt: row.created_at,
  }
}

/* ------------------------------------------------------------------ */
/* Helpers internos                                                   */
/* ------------------------------------------------------------------ */

function normalizeRow(raw: unknown | null): AssistedApplicationRow {
  if (!raw) {
    return {
      id: '',
      professional_id: null,
      patient_id: null,
      guest_id: null,
      assignment_id: null,
      session_id: null,
      scale_type: '',
      scale_name: null,
      items: [],
      total_score: null,
      interpretation: null,
      observations: null,
      metadata: {},
      created_at: '',
    }
  }
  const r = raw as Record<string, unknown>
  return {
    id: String(r.id ?? ''),
    professional_id: (r.professional_id as string | null) ?? null,
    patient_id: (r.patient_id as string | null) ?? null,
    guest_id: (r.guest_id as string | null) ?? null,
    assignment_id: (r.assignment_id as string | null) ?? null,
    session_id: (r.session_id as string | null) ?? null,
    scale_type: String(r.scale_type ?? ''),
    scale_name: (r.scale_name as string | null) ?? null,
    items: Array.isArray(r.items) ? (r.items as AssistedResponseRecord[]) : [],
    total_score:
      r.total_score !== null && r.total_score !== undefined ? Number(r.total_score) : null,
    interpretation: (r.interpretation as string | null) ?? null,
    observations: (r.observations as string | null) ?? null,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    created_at: String(r.created_at ?? ''),
  }
}

/** Reexporta tipos/helpers úteis para quem consome o serviço. */
export type { AssistedItem, AssistedScale } from '@/lib/assisted-scales-data'
export type { AssistedResponseRecord, AssistedRecordContext } from '@/lib/assisted-record-export'
export { detectImminentRisk } from '@/lib/assisted-record-export'
