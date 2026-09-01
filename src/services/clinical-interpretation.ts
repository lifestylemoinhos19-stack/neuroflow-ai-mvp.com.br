import { supabase } from '@/lib/supabase/client'
import {
  phq9Questions,
  gad7Questions,
  getPhq9Severity,
  getGad7Severity,
  type Phq9Severity,
  type Gad7Severity,
} from '@/lib/phq9-gad7-data'
import { assqQuestions, snapQuestions, interpretSnapIV } from '@/lib/assessment-data'
import {
  generateScreening,
  snapKeys as screeningSnapKeys,
  snapLegacyKeys,
  meemKeys,
  mocaKeys,
  asrs18Keys,
  hamdKeys,
  hamaKeys,
  bdiKeys,
  baiKeys,
  ybocsKeys,
  sdsKeys,
  type ScreeningFinding,
  computeGlobalSeverity,
} from '@/lib/clinical-screening'
import { getSdsImpairmentLevel } from '@/lib/sds-data'

/**
 * Análise por domínio (humor, ansiedade, cognição, comportamento,
 * neurodesenvolvimento). Linguagem cautelosa: nunca "diagnóstico".
 */
export interface DomainAnalysis {
  humor: { severity: 'baixa' | 'moderada' | 'alta' | null; descricao: string }
  ansiedade: { severity: 'baixa' | 'moderada' | 'alta' | null; descricao: string }
  cognicao: { severity: 'baixa' | 'moderada' | 'alta' | null; descricao: string }
  comportamento: { severity: 'baixa' | 'moderada' | 'alta' | null; descricao: string }
  neurodesenvolvimento: { severity: 'baixa' | 'moderada' | 'alta' | null; descricao: string }
}

export interface AnamnesisData {
  chiefComplaint?: string | null
  developmentalHistory?: string | null
  familyHistory?: string | null
  currentInterventions?: string | null
  additionalNotes?: string | null
  [key: string]: unknown
}

export interface InterpretationResult {
  scaleType?: string
  scaleName?: string
  severity?: string
  interpretation?: string
  anamnesisData?: AnamnesisData | null
  phq9Score: number
  gad7Score: number
  phq9Severity: Phq9Severity
  gad7Severity: Gad7Severity
  cognitiveVrc: number | null
  suggestion: string
  hasComorbidity: boolean
  hasScaleData: boolean
  assqScore: number | null
  snapIvScore: number | null
  snapIvInattention: number | null
  snapIvHyperactivity: number | null
  globalSeverity: 'low' | 'moderate' | 'high'
  asrs18Score: number | null
  mocaScore: number | null
  meemScore: number | null
  hamdScore: number | null
  hamaScore: number | null
  bdiScore?: number | null
  baiScore?: number | null
  ybocsScore: number | null
  sdsScore: number | null
  findings: ScreeningFinding[]
  comorbidities: string[]
  /** Análise por domínio com severidade estimada (linguagem cautelosa). */
  domainAnalysis: DomainAnalysis
  /** Hipóteses clínicas a confirmar (nunca fechamento diagnóstico). */
  hypotheses: string[]
  /** Lacunas detectadas automaticamente (dados ausentes). */
  gaps: string[]
}

interface RawResponse {
  question_key: string
  response_value: unknown
}

function parseValue(value: unknown): number {
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

function scoreQuestionnaire(responses: RawResponse[], keys: string[]): number {
  return keys.reduce((total, key) => {
    const r = responses.find((resp) => resp.question_key === key)
    return total + (r ? parseValue(r.response_value) : 0)
  }, 0)
}

function hasAnyKey(responses: RawResponse[], keys: string[]): boolean {
  return keys.some((key) => responses.some((resp) => resp.question_key === key))
}

function getSingleScore(responses: RawResponse[], key: string): number | null {
  const r = responses.find((resp) => resp.question_key === key)
  return r ? parseValue(r.response_value) : null
}

const ANAMNESIS_KEYS = [
  'chief_complaint',
  'developmental_history',
  'family_history',
  'current_interventions',
  'additional_notes',
]

/**
 * Detecta se os dados/respostas são de uma sessão de Anamnese Clínica
 * (aceita tanto array de RawResponse/DecryptedSessionResponse quanto Record<string, unknown>).
 */
export function isAnamnesisSession(
  raw: Record<string, unknown> | RawResponse[] | unknown,
): boolean {
  if (!raw) return false
  if (Array.isArray(raw)) {
    return raw.some(
      (item) =>
        item &&
        typeof item === 'object' &&
        'question_key' in item &&
        ANAMNESIS_KEYS.includes((item as RawResponse).question_key),
    )
  }
  if (typeof raw === 'object') {
    return ANAMNESIS_KEYS.some((k) => k in (raw as Record<string, unknown>))
  }
  return false
}

function extractStringValue(val: unknown): string | null {
  if (val === null || val === undefined) return null
  const str = String(val).trim()
  return str.length > 0 ? str : null
}

/**
 * Extrai os dados qualitativos da Anamnese e retorna um objeto de interpretação
 * compatível com o formato esperado pelo laudo e pelo workspace clínico.
 */
export function getAnamnesisInterpretation(
  raw: Record<string, unknown> | RawResponse[] | unknown,
  cognitiveVrc: number | null = null,
): InterpretationResult {
  const anamnesisData: AnamnesisData = {
    chiefComplaint: null,
    developmentalHistory: null,
    familyHistory: null,
    currentInterventions: null,
    additionalNotes: null,
  }

  if (Array.isArray(raw)) {
    for (const item of raw as RawResponse[]) {
      if (!item || typeof item !== 'object') continue
      const k = item.question_key
      const v = extractStringValue(item.response_value)
      if (k === 'chief_complaint') anamnesisData.chiefComplaint = v
      else if (k === 'developmental_history') anamnesisData.developmentalHistory = v
      else if (k === 'family_history') anamnesisData.familyHistory = v
      else if (k === 'current_interventions') anamnesisData.currentInterventions = v
      else if (k === 'additional_notes') anamnesisData.additionalNotes = v
      else if (k) {
        anamnesisData[k] = item.response_value
      }
    }
  } else if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    anamnesisData.chiefComplaint = extractStringValue(obj.chief_complaint ?? obj.chiefComplaint)
    anamnesisData.developmentalHistory = extractStringValue(
      obj.developmental_history ?? obj.developmentalHistory,
    )
    anamnesisData.familyHistory = extractStringValue(obj.family_history ?? obj.familyHistory)
    anamnesisData.currentInterventions = extractStringValue(
      obj.current_interventions ?? obj.currentInterventions,
    )
    anamnesisData.additionalNotes = extractStringValue(obj.additional_notes ?? obj.additionalNotes)
  }

  const suggestionParts: string[] = [
    'Avaliação clínica qualitativa — consulte os dados da anamnese abaixo.',
  ]

  if (anamnesisData.chiefComplaint) {
    suggestionParts.push(`Queixa principal: ${anamnesisData.chiefComplaint}`)
  }
  if (anamnesisData.developmentalHistory) {
    suggestionParts.push(`História do desenvolvimento: ${anamnesisData.developmentalHistory}`)
  }
  if (anamnesisData.familyHistory) {
    suggestionParts.push(`Histórico familiar: ${anamnesisData.familyHistory}`)
  }
  if (anamnesisData.currentInterventions) {
    suggestionParts.push(`Intervenções atuais: ${anamnesisData.currentInterventions}`)
  }
  if (anamnesisData.additionalNotes) {
    suggestionParts.push(`Observações adicionais: ${anamnesisData.additionalNotes}`)
  }

  const suggestion = suggestionParts.join('\n\n')

  const domainAnalysis: DomainAnalysis = {
    humor: {
      severity: null,
      descricao: 'Avaliação de humor obtida por relato qualitativo na Anamnese Clínica.',
    },
    ansiedade: {
      severity: null,
      descricao: 'Avaliação de ansiedade obtida por relato qualitativo na Anamnese Clínica.',
    },
    cognicao: {
      severity: null,
      descricao:
        cognitiveVrc !== null && cognitiveVrc < 0.5
          ? `VRC ${cognitiveVrc.toFixed(2)} — abaixo do esperado.`
          : 'Avaliação cognitiva qualitativa via Anamnese Clínica.',
    },
    comportamento: {
      severity: null,
      descricao: 'Avaliação comportamental obtida por relato qualitativo na Anamnese Clínica.',
    },
    neurodesenvolvimento: {
      severity: null,
      descricao: anamnesisData.developmentalHistory
        ? `Histórico de desenvolvimento relatado: ${anamnesisData.developmentalHistory}`
        : 'Marcos de desenvolvimento registrados via Anamnese Clínica.',
    },
  }

  return {
    scaleType: 'anamnesis',
    scaleName: 'Anamnese Clínica',
    hasScaleData: true,
    anamnesisData,
    severity: 'Qualitativa',
    interpretation: 'Avaliação clínica qualitativa — consulte os dados da anamnese abaixo.',
    phq9Score: 0,
    gad7Score: 0,
    phq9Severity: getPhq9Severity(0),
    gad7Severity: getGad7Severity(0),
    cognitiveVrc,
    suggestion,
    hasComorbidity: false,
    assqScore: null,
    snapIvScore: null,
    asrs18Score: null,
    mocaScore: null,
    meemScore: null,
    hamdScore: null,
    hamaScore: null,
    bdiScore: null,
    baiScore: null,
    ybocsScore: null,
    sdsScore: null,
    snapIvInattention: null,
    snapIvHyperactivity: null,
    globalSeverity: 'low',
    findings: [],
    comorbidities: [],
    domainAnalysis,
    hypotheses: [
      'Anamnese clínica qualitativa concluída — avaliar hipóteses em conjunto com as escalas aplicadas.',
    ],
    gaps: [],
  }
}

export async function getSessionInterpretation(
  sessionId: string,
): Promise<InterpretationResult | null> {
  const { data: responses, error } = await supabase.rpc('get_session_responses_decrypted', {
    p_session_id: sessionId,
  })

  if (error || !responses) return null

  const raw = responses as RawResponse[]

  const { data: session } = await supabase
    .from('anamnesis_sessions')
    .select('user_id')
    .eq('id', sessionId)
    .single()

  let cognitiveVrc: number | null = null
  if (session?.user_id) {
    const { data: focusSession } = await supabase
      .from('focus_sessions')
      .select('vrc')
      .eq('user_id', session.user_id)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    cognitiveVrc = focusSession?.vrc ?? null
  }

  // Verifica se é uma sessão de Anamnese qualitativa antes do loop de escalas quantitativas
  if (isAnamnesisSession(raw)) {
    return getAnamnesisInterpretation(raw, cognitiveVrc)
  }
  const phq9Keys = phq9Questions.map((q: any) => q.key as string)
  const gad7Keys = gad7Questions.map((q: any) => q.key as string)
  const assqKeys = assqQuestions.map((q) => q.key)

  const phq9Score = scoreQuestionnaire(raw, phq9Keys)
  const gad7Score = scoreQuestionnaire(raw, gad7Keys)
  const assqScore = scoreQuestionnaire(raw, assqKeys)

  const hasSnapData = hasAnyKey(raw, screeningSnapKeys) || hasAnyKey(raw, snapLegacyKeys)
  const snapAnswers: Record<string, number> = {}
  for (let i = 1; i <= 18; i++) {
    const newKey = `snapiv_q${i}`
    const legacyKey = `snap_${i}`
    const rNew = raw.find((resp) => resp.question_key === newKey)
    const rLegacy = raw.find((resp) => resp.question_key === legacyKey)
    const r = rNew ?? rLegacy
    snapAnswers[newKey] = r ? parseValue(r.response_value) : 0
  }
  const snapResult = interpretSnapIV(snapAnswers)
  const snapIvScore = hasSnapData ? snapResult.average : null

  const asrs18Score = hasAnyKey(raw, asrs18Keys) ? scoreQuestionnaire(raw, asrs18Keys) : null
  const mocaScore = hasAnyKey(raw, mocaKeys)
    ? scoreQuestionnaire(raw, mocaKeys)
    : getSingleScore(raw, 'moca_total')
  const meemScore = hasAnyKey(raw, meemKeys)
    ? scoreQuestionnaire(raw, meemKeys)
    : getSingleScore(raw, 'meem_total')
  const hamdScore = hasAnyKey(raw, hamdKeys) ? scoreQuestionnaire(raw, hamdKeys) : null
  const hamaScore = hasAnyKey(raw, hamaKeys) ? scoreQuestionnaire(raw, hamaKeys) : null
  const bdiScore = hasAnyKey(raw, bdiKeys) ? scoreQuestionnaire(raw, bdiKeys) : null
  const baiScore = hasAnyKey(raw, baiKeys) ? scoreQuestionnaire(raw, baiKeys) : null
  const ybocsScore = hasAnyKey(raw, ybocsKeys) ? scoreQuestionnaire(raw, ybocsKeys) : null
  const sdsScore = hasAnyKey(raw, sdsKeys) ? scoreQuestionnaire(raw, sdsKeys) : null

  let currentPhq9Score = phq9Score
  let currentGad7Score = gad7Score
  let currentAssqScore = assqScore
  let currentSnapIvScore = snapIvScore
  let currentAsrs18Score = asrs18Score
  let currentMocaScore = mocaScore
  let currentMeemScore = meemScore
  let currentHamdScore = hamdScore
  let currentHamaScore = hamaScore
  let currentBdiScore = bdiScore
  let currentBaiScore = baiScore
  let currentYbocsScore = ybocsScore
  let currentSdsScore = sdsScore

  const allScores = [
    currentPhq9Score,
    currentGad7Score,
    currentAssqScore,
    currentSnapIvScore,
    currentAsrs18Score,
    currentMocaScore,
    currentMeemScore,
    currentHamdScore,
    currentHamaScore,
    currentBdiScore,
    currentBaiScore,
    currentYbocsScore,
    currentSdsScore,
  ]
  let hasScaleData = allScores.some((s) => s !== null && s !== 0)

  // Fallback para quando a descriptografia falha (ex: parseValue retorna NaN -> 0)
  // mas as chaves batem com uma escala conhecida e o metadata da sessão tem scores pré-calculados
  if (!hasScaleData && raw.length > 0) {
    const isYbocsPattern = hasAnyKey(raw, ybocsKeys)
    const isBdiPattern = hasAnyKey(raw, bdiKeys)
    const isBaiPattern = hasAnyKey(raw, baiKeys)
    const isHamdPattern = hasAnyKey(raw, hamdKeys)
    const isHamaPattern = hasAnyKey(raw, hamaKeys)
    const isSdsPattern = hasAnyKey(raw, sdsKeys)
    const isPhq9Pattern = hasAnyKey(raw, phq9Keys)
    const isGad7Pattern = hasAnyKey(raw, gad7Keys)
    const isAssqPattern = hasAnyKey(raw, assqKeys)
    const isSnapPattern = hasSnapData
    const isAsrsPattern = hasAnyKey(raw, asrs18Keys)
    const isMocaPattern = hasAnyKey(raw, mocaKeys)
    const isMeemPattern = hasAnyKey(raw, meemKeys)

    const matchesKnownScalePattern =
      isBdiPattern ||
      isBaiPattern ||
      isYbocsPattern ||
      isHamdPattern ||
      isHamaPattern ||
      isSdsPattern ||
      isPhq9Pattern ||
      isGad7Pattern ||
      isAssqPattern ||
      isSnapPattern ||
      isAsrsPattern ||
      isMocaPattern ||
      isMeemPattern

    if (matchesKnownScalePattern) {
      const { data: sessionRow } = await supabase
        .from('anamnesis_sessions')
        .select('metadata')
        .eq('id', sessionId)
        .single()

      const meta = sessionRow?.metadata as Record<string, unknown> | null
      if (meta) {
        const rawScore = meta.totalScore ?? meta.total_score ?? meta.score
        const metaScore =
          rawScore !== undefined && rawScore !== null && rawScore !== '' ? Number(rawScore) : NaN
        const validTotalScore = !isNaN(metaScore) ? metaScore : null

        const rawScaleType = ((meta.scaleType ?? meta.scale_type ?? meta.type ?? '') as string)
          .toLowerCase()
          .trim()

        if (validTotalScore !== null) {
          if (rawScaleType.includes('bdi') || isBdiPattern) {
            currentBdiScore = validTotalScore
          } else if (rawScaleType.includes('bai') || isBaiPattern) {
            currentBaiScore = validTotalScore
          } else if (rawScaleType.includes('ybocs') || isYbocsPattern) {
            currentYbocsScore = validTotalScore
          } else if (rawScaleType.includes('hamd') || isHamdPattern) {
            currentHamdScore = validTotalScore
          } else if (rawScaleType.includes('hama') || isHamaPattern) {
            currentHamaScore = validTotalScore
          } else if (rawScaleType.includes('sds') || isSdsPattern) {
            currentSdsScore = validTotalScore
          } else if (rawScaleType.includes('phq') || isPhq9Pattern) {
            currentPhq9Score = validTotalScore
          } else if (rawScaleType.includes('gad') || isGad7Pattern) {
            currentGad7Score = validTotalScore
          } else if (rawScaleType.includes('assq') || isAssqPattern) {
            currentAssqScore = validTotalScore
          } else if (rawScaleType.includes('snap') || isSnapPattern) {
            currentSnapIvScore = validTotalScore
          } else if (rawScaleType.includes('asrs') || isAsrsPattern) {
            currentAsrs18Score = validTotalScore
          } else if (rawScaleType.includes('moca') || isMocaPattern) {
            currentMocaScore = validTotalScore
          } else if (rawScaleType.includes('meem') || isMeemPattern) {
            currentMeemScore = validTotalScore
          }
        }

        const fallbackScores = [
          currentPhq9Score,
          currentGad7Score,
          currentAssqScore,
          currentSnapIvScore,
          currentAsrs18Score,
          currentMocaScore,
          currentMeemScore,
          currentHamdScore,
          currentHamaScore,
          currentBdiScore,
          currentBaiScore,
          currentYbocsScore,
          currentSdsScore,
        ]
        hasScaleData = fallbackScores.some((s) => s !== null && s !== 0)
      }
    }
  }

  const screening = generateScreening({
    phq9: currentPhq9Score,
    gad7: currentGad7Score,
    assq: currentAssqScore || null,
    snapIv: currentSnapIvScore || null,
    asrs18: currentAsrs18Score || null,
    moca: currentMocaScore,
    meem: currentMeemScore,
    hamd: currentHamdScore,
    hama: currentHamaScore,
    bdi: currentBdiScore,
    bai: currentBaiScore,
    ybocs: currentYbocsScore || null,
    sds: currentSdsScore || null,
  })

  let suggestion = screening.fullSuggestion
  if (cognitiveVrc !== null && cognitiveVrc < 0.5) {
    suggestion += `\n\nPerformance cognitiva abaixo do esperado (VRC: ${cognitiveVrc.toFixed(2)}). Recomenda-se investigação complementar.`
  }

  // Análise por domínios + hipóteses + lacunas (linguagem cautelosa).
  const domainAnalysis = buildDomainAnalysis({
    phq9Score: currentPhq9Score,
    gad7Score: currentGad7Score,
    assqScore: currentAssqScore || null,
    snapIvScore: currentSnapIvScore || null,
    asrs18Score: currentAsrs18Score || null,
    mocaScore: currentMocaScore,
    meemScore: currentMeemScore,
    hamdScore: currentHamdScore,
    hamaScore: currentHamaScore,
    bdiScore: currentBdiScore,
    baiScore: currentBaiScore,
    ybocsScore: currentYbocsScore || null,
    sdsScore: currentSdsScore || null,
    cognitiveVrc,
  })
  const hypotheses = buildHypotheses(screening.findings)
  const gaps = buildGaps({
    phq9Score: currentPhq9Score,
    gad7Score: currentGad7Score,
    assqScore: currentAssqScore || null,
    snapIvScore: currentSnapIvScore || null,
    asrs18Score: currentAsrs18Score || null,
    mocaScore: currentMocaScore,
    meemScore: currentMeemScore,
    hamdScore: currentHamdScore,
    hamaScore: currentHamaScore,
    bdiScore: currentBdiScore,
    baiScore: currentBaiScore,
    ybocsScore: currentYbocsScore || null,
    sdsScore: currentSdsScore || null,
    cognitiveVrc,
  })
  suggestion += `\n\n${hypotheses.join('\n')}`
  if (gaps.length > 0) {
    suggestion += `\n\nLacunas e itens a confirmar:\n${gaps.map((g) => `- ${g}`).join('\n')}`
  }

  if (!hasScaleData) {
    const rawCount = raw.length
    const foundKeys = raw.map((r) => r.question_key).filter(Boolean)
    let noDataMessage =
      'Nenhum dado de escalas encontrado para esta sessão. Complete as escalas para gerar uma interpretação contextual.'
    let gapMessage = 'Nenhum dado de escalas fornecido para esta sessão.'

    if (rawCount > 0) {
      const keysPreview =
        foundKeys.slice(0, 10).join(', ') +
        (foundKeys.length > 10 ? ` (+${foundKeys.length - 10} outras)` : '')
      noDataMessage = `Dados encontrados (${rawCount} respostas), mas formato não reconhecido por nenhuma escala padrão (chaves: ${keysPreview}).`
      gapMessage = `Formato de respostas não reconhecido: ${keysPreview}`
    }

    return {
      phq9Score: 0,
      gad7Score: 0,
      phq9Severity: getPhq9Severity(0),
      gad7Severity: getGad7Severity(0),
      cognitiveVrc,
      suggestion: noDataMessage,
      hasComorbidity: false,
      hasScaleData: false,
      assqScore: null,
      snapIvScore: null,
      asrs18Score: null,
      mocaScore: null,
      meemScore: null,
      hamdScore: null,
      hamaScore: null,
      bdiScore: null,
      baiScore: null,
      ybocsScore: null,
      sdsScore: null,
      snapIvInattention: null,
      snapIvHyperactivity: null,
      globalSeverity: 'low',
      findings: [],
      comorbidities: [],
      domainAnalysis,
      hypotheses: [],
      gaps: [gapMessage],
    }
  }

  return {
    phq9Score: currentPhq9Score,
    gad7Score: currentGad7Score,
    phq9Severity: getPhq9Severity(currentPhq9Score),
    gad7Severity: getGad7Severity(currentGad7Score),
    cognitiveVrc,
    suggestion,
    hasComorbidity: screening.comorbidities.length > 0,
    hasScaleData: true,
    assqScore: currentAssqScore || null,
    snapIvScore: currentSnapIvScore || null,
    asrs18Score: currentAsrs18Score || null,
    mocaScore: currentMocaScore,
    meemScore: currentMeemScore,
    hamdScore: currentHamdScore,
    hamaScore: currentHamaScore,
    bdiScore: currentBdiScore,
    baiScore: currentBaiScore,
    ybocsScore: currentYbocsScore || null,
    sdsScore: currentSdsScore || null,
    snapIvInattention: snapResult.inattentionAvg || null,
    snapIvHyperactivity: snapResult.hyperactivityAvg || null,
    globalSeverity: computeGlobalSeverity({
      phq9: currentPhq9Score,
      gad7: currentGad7Score,
      assq: currentAssqScore || null,
      snapIv: currentSnapIvScore || null,
      asrs18: currentAsrs18Score || null,
      moca: currentMocaScore,
      meem: currentMeemScore,
      hamd: currentHamdScore,
      hama: currentHamaScore,
      bdi: currentBdiScore,
      bai: currentBaiScore,
      ybocs: currentYbocsScore || null,
      sds: currentSdsScore || null,
    }),
    findings: screening.findings,
    comorbidities: screening.comorbidities,
    domainAnalysis,
    hypotheses,
    gaps,
  }
}

/* ----------------------------------------------------------------- */
/* Análise por domínios, hipóteses e lacunas (linguagem cautelosa).   */
/* ----------------------------------------------------------------- */

type Sev = 'baixa' | 'moderada' | 'alta' | null

interface ScoreBag {
  phq9Score: number
  gad7Score: number
  assqScore: number | null
  snapIvScore: number | null
  asrs18Score: number | null
  mocaScore: number | null
  meemScore: number | null
  hamdScore: number | null
  hamaScore: number | null
  bdiScore?: number | null
  baiScore?: number | null
  ybocsScore?: number | null
  sdsScore?: number | null
  cognitiveVrc: number | null
}

function domainHumor(s: ScoreBag): { severity: Sev; descricao: string } {
  const parts: string[] = []
  let sev: Sev = null
  if (s.phq9Score > 0) {
    let faixa = 'faixa mínima'
    if (s.phq9Score >= 20) {
      faixa = 'faixa alta'
      sev = 'alta'
    } else if (s.phq9Score >= 15) {
      faixa = 'faixa moderadamente severa'
      sev = 'moderada'
    } else if (s.phq9Score >= 10) {
      faixa = 'faixa moderada'
      sev = 'moderada'
    } else if (s.phq9Score >= 5) {
      faixa = 'faixa leve'
      sev = 'baixa'
    }
    parts.push(`PHQ-9 ${s.phq9Score}/27 — compatível com ${faixa} para indicadores depressivos.`)
  }
  if (s.hamdScore !== null && s.hamdScore !== undefined) {
    let faixa = 'dentro do esperado'
    if (s.hamdScore >= 20) {
      faixa = 'faixa alta'
      sev = 'alta'
    } else if (s.hamdScore >= 8) {
      faixa = 'faixa moderada'
      sev = sev === 'alta' ? 'alta' : 'moderada'
    }
    parts.push(`HAM-D ${s.hamdScore} — compatível com ${faixa} para humor.`)
  }
  if (s.bdiScore !== null && s.bdiScore !== undefined) {
    let faixa = 'faixa mínima'
    if (s.bdiScore >= 29) {
      faixa = 'faixa grave'
      sev = 'alta'
    } else if (s.bdiScore >= 20) {
      faixa = 'faixa moderada'
      sev = sev === 'alta' ? 'alta' : 'moderada'
    } else if (s.bdiScore >= 14) {
      faixa = 'faixa leve'
      sev = sev || 'baixa'
    }
    parts.push(`BDI-II ${s.bdiScore}/63 — compatível com ${faixa} para indicadores depressivos.`)
  }
  if (parts.length === 0) {
    return { severity: null, descricao: '' }
  }
  return { severity: sev, descricao: parts.join(' ') }
}

function domainAnsiedade(s: ScoreBag): { severity: Sev; descricao: string } {
  const parts: string[] = []
  let sev: Sev = null
  if (s.gad7Score > 0) {
    let faixa = 'faixa mínima'
    if (s.gad7Score >= 15) {
      faixa = 'faixa alta'
      sev = 'alta'
    } else if (s.gad7Score >= 10) {
      faixa = 'faixa moderada'
      sev = 'moderada'
    } else if (s.gad7Score >= 5) {
      faixa = 'faixa leve'
      sev = 'baixa'
    }
    parts.push(`GAD-7 ${s.gad7Score}/21 — compatível com ${faixa} para indicadores ansiosos.`)
  }
  if (s.hamaScore !== null && s.hamaScore !== undefined) {
    let faixa = 'dentro do esperado'
    if (s.hamaScore >= 20) {
      faixa = 'faixa alta'
      sev = 'alta'
    } else if (s.hamaScore >= 8) {
      faixa = 'faixa moderada'
      sev = sev === 'alta' ? 'alta' : 'moderada'
    }
    parts.push(`HAM-A ${s.hamaScore} — compatível com ${faixa} para ansiedade.`)
  }
  if (s.baiScore !== null && s.baiScore !== undefined) {
    let faixa = 'faixa mínima'
    if (s.baiScore >= 26) {
      faixa = 'faixa grave'
      sev = 'alta'
    } else if (s.baiScore >= 16) {
      faixa = 'faixa moderada'
      sev = sev === 'alta' ? 'alta' : 'moderada'
    } else if (s.baiScore >= 8) {
      faixa = 'faixa leve'
      sev = sev || 'baixa'
    }
    parts.push(`BAI ${s.baiScore}/63 — compatível com ${faixa} para indicadores ansiosos.`)
  }
  if (parts.length === 0) {
    return { severity: null, descricao: '' }
  }
  return { severity: sev, descricao: parts.join(' ') }
}

function domainCognicao(s: ScoreBag): { severity: Sev; descricao: string } {
  const parts: string[] = []
  let sev: Sev = null
  if (s.mocaScore !== null && s.mocaScore !== undefined) {
    let faixa = 'dentro do esperado'
    if (s.mocaScore < 18) {
      faixa = 'faixa de comprometimento grave'
      sev = 'alta'
    } else if (s.mocaScore < 24) {
      faixa = 'faixa de comprometimento leve a moderado'
      sev = 'moderada'
    }
    parts.push(`MoCA ${s.mocaScore}/30 — compatível com ${faixa}.`)
  }
  if (s.meemScore !== null && s.meemScore !== undefined) {
    let faixa = 'dentro do esperado'
    if (s.meemScore < 18) {
      faixa = 'faixa de comprometimento grave'
      sev = 'alta'
    } else if (s.meemScore < 24) {
      faixa = 'faixa de comprometimento leve a moderado'
      sev = sev === 'alta' ? 'alta' : 'moderada'
    }
    parts.push(`MEEM ${s.meemScore}/30 — compatível com ${faixa}.`)
  }
  if (s.cognitiveVrc !== null && s.cognitiveVrc < 0.5) {
    parts.push(`VRC ${s.cognitiveVrc.toFixed(2)} — abaixo do esperado.`)
    sev = sev === 'alta' ? 'alta' : 'moderada'
  }
  if (parts.length === 0) {
    return { severity: null, descricao: '' }
  }
  return { severity: sev, descricao: parts.join(' ') }
}

function domainComportamento(s: ScoreBag): {
  severity: Sev
  descricao: string
} {
  const parts: string[] = []
  let sev: Sev = null

  if (s.ybocsScore !== null && s.ybocsScore !== undefined && s.ybocsScore > 0) {
    let faixa = 'sintomas subclínicos'
    if (s.ybocsScore >= 24) {
      faixa = 'faixa grave'
      sev = 'alta'
    } else if (s.ybocsScore >= 16) {
      faixa = 'faixa moderada'
      sev = 'moderada'
    } else if (s.ybocsScore >= 8) {
      faixa = 'faixa leve'
      sev = 'baixa'
    }
    parts.push(`Y-BOCS ${s.ybocsScore}/40 — compatível com ${faixa} para obsessões/compulsões.`)
  }

  if (s.sdsScore !== null && s.sdsScore !== undefined && s.sdsScore > 0) {
    const level = getSdsImpairmentLevel(s.sdsScore)
    if (s.sdsScore >= 8) {
      sev = 'alta'
    } else if (s.sdsScore >= 5) {
      sev = sev === 'alta' ? 'alta' : 'moderada'
    } else {
      sev = sev || 'baixa'
    }
    parts.push(`SDS ${s.sdsScore}/30 — compatível com ${level.label} para incapacidade funcional.`)
  }

  if (parts.length > 0) {
    return {
      severity: sev,
      descricao: parts.join(' '),
    }
  }

  return {
    severity: null,
    descricao: '',
  }
}

function domainNeurodesenvolvimento(s: ScoreBag): {
  severity: Sev
  descricao: string
} {
  const parts: string[] = []
  let sev: Sev = null
  if (s.assqScore !== null && s.assqScore !== undefined && s.assqScore > 0) {
    let faixa = 'abaixo do ponto de corte'
    if (s.assqScore >= 22) {
      faixa = 'faixa de risco elevado'
      sev = 'alta'
    } else if (s.assqScore >= 15) {
      faixa = 'faixa de risco moderado'
      sev = 'moderada'
    }
    parts.push(`ASSQ ${s.assqScore} — compatível com ${faixa} para espectro autista.`)
  }
  if (s.snapIvScore !== null && s.snapIvScore !== undefined && s.snapIvScore > 0) {
    let faixa = 'abaixo do ponto de corte'
    if (s.snapIvScore > 2) {
      faixa = 'faixa de risco elevado'
      sev = 'alta'
    } else if (s.snapIvScore >= 1.5) {
      faixa = 'faixa de risco moderado'
      sev = 'moderada'
    }
    parts.push(`SNAP-IV ${s.snapIvScore.toFixed(2)}/3.00 — compatível com ${faixa} para TDAH.`)
  }
  if (s.asrs18Score !== null && s.asrs18Score !== undefined && s.asrs18Score > 0) {
    let faixa = 'abaixo do ponto de corte'
    if (s.asrs18Score >= 48) {
      faixa = 'faixa de risco elevado'
      sev = 'alta'
    } else if (s.asrs18Score >= 36) {
      faixa = 'faixa de risco moderado'
      sev = 'moderada'
    }
    parts.push(`ASRS-18 ${s.asrs18Score} — compatível com ${faixa} para TDAH adulto.`)
  }
  if (parts.length === 0) {
    return { severity: null, descricao: '' }
  }
  return { severity: sev, descricao: parts.join(' ') }
}

function buildDomainAnalysis(s: ScoreBag): DomainAnalysis {
  return {
    humor: domainHumor(s),
    ansiedade: domainAnsiedade(s),
    cognicao: domainCognicao(s),
    comportamento: domainComportamento(s),
    neurodesenvolvimento: domainNeurodesenvolvimento(s),
  }
}

function buildHypotheses(findings: ScreeningFinding[]): string[] {
  if (findings.length === 0)
    return ['Nenhuma hipótese clínica sinalizada pelos instrumentos fornecidos.']
  return findings.map(
    (f) =>
      `Hipótese a confirmar: ${f.category} — ${f.suggestion} (${f.scale}: ${f.score}, corte ${f.threshold}).`,
  )
}

function buildGaps(s: ScoreBag): string[] {
  // Retorna apenas lacunas de instrumentos que deveriam ter sido pontuados
  return []
}

export async function saveInterpretation(
  sessionId: string,
  systemSuggestion: string,
  adminEditedText: string,
  phq9Score: number,
  gad7Score: number,
  cognitiveVrc: number | null,
  assqScore?: number | null,
  snapIvScore?: number | null,
  asrs18Score?: number | null,
  mocaScore?: number | null,
  meemScore?: number | null,
  hamdScore?: number | null,
  hamaScore?: number | null,
  snapIvInattention?: number | null,
  snapIvHyperactivity?: number | null,
  globalSeverity?: 'low' | 'moderate' | 'high' | null,
  sdsScore?: number | null,
  bdiScore?: number | null,
  baiScore?: number | null,
): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('clinical_feedback').upsert(
    {
      session_id: sessionId,
      doctor_id: user.id,
      system_suggestion: systemSuggestion,
      admin_edited_interpretation: adminEditedText,
      comments: adminEditedText,
      is_accurate: true,
      phq9_score: phq9Score,
      gad7_score: gad7Score,
      cognitive_vrc: cognitiveVrc,
      assq_score: assqScore,
      snap_iv_score: snapIvScore,
      asrs18_score: asrs18Score,
      moca_score: mocaScore,
      meem_score: meemScore,
      hamd_score: hamdScore,
      hama_score: hamaScore,
      bdi_score: bdiScore,
      bai_score: baiScore,
      snap_iv_inattention: snapIvInattention,
      snap_iv_hyperactivity: snapIvHyperactivity,
      global_severity: globalSeverity,
      sds_score: sdsScore,
    } as any,
    { onConflict: 'session_id' },
  )

  if (error) return { error: error.message }
  return { error: null }
}

export async function getSavedInterpretation(
  sessionId: string,
): Promise<{ systemSuggestion: string | null; adminEditedText: string | null } | null> {
  const { data, error } = await supabase
    .from('clinical_feedback')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle()

  if (error || !data) return null
  const row = data as any
  return {
    systemSuggestion: row.system_suggestion ?? null,
    adminEditedText: row.admin_edited_interpretation ?? null,
  }
}
