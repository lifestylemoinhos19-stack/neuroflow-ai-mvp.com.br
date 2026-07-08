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
import { generateScreening, asrs18Keys, type ScreeningFinding } from '@/lib/clinical-screening'

export interface InterpretationResult {
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
  asrs18Score: number | null
  mocaScore: number | null
  meemScore: number | null
  hamdScore: number | null
  hamaScore: number | null
  findings: ScreeningFinding[]
  comorbidities: string[]
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

function getSingleScore(responses: RawResponse[], key: string): number | null {
  const r = responses.find((resp) => resp.question_key === key)
  return r ? parseValue(r.response_value) : null
}

export async function getSessionInterpretation(
  sessionId: string,
): Promise<InterpretationResult | null> {
  const { data: responses, error } = await supabase
    .from('anamnesis_responses')
    .select('question_key, response_value')
    .eq('session_id', sessionId)

  if (error || !responses) return null

  const raw = responses as RawResponse[]
  const phq9Keys = phq9Questions.map((q: any) => q.key as string)
  const gad7Keys = gad7Questions.map((q: any) => q.key as string)
  const assqKeys = assqQuestions.map((q) => q.key)
  const snapKeys = snapQuestions.map((q) => q.key)

  const phq9Score = scoreQuestionnaire(raw, phq9Keys)
  const gad7Score = scoreQuestionnaire(raw, gad7Keys)
  const assqScore = scoreQuestionnaire(raw, assqKeys)

  const snapAnswers: Record<string, number> = {}
  snapKeys.forEach((key) => {
    const r = raw.find((resp) => resp.question_key === key)
    snapAnswers[key] = r ? parseValue(r.response_value) : 0
  })
  const snapResult = interpretSnapIV(snapAnswers)
  const snapIvScore = snapResult.average

  const asrs18Score = scoreQuestionnaire(raw, asrs18Keys)
  const mocaScore = getSingleScore(raw, 'moca_total')
  const meemScore = getSingleScore(raw, 'meem_total')
  const hamdScore = getSingleScore(raw, 'hamd_total')
  const hamaScore = getSingleScore(raw, 'hama_total')

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

  const allScores = [
    phq9Score,
    gad7Score,
    assqScore,
    snapIvScore,
    asrs18Score,
    mocaScore,
    meemScore,
    hamdScore,
    hamaScore,
  ]
  const hasScaleData = allScores.some((s) => s !== null && s !== 0)

  const screening = generateScreening({
    phq9: phq9Score,
    gad7: gad7Score,
    assq: assqScore || null,
    snapIv: snapIvScore || null,
    asrs18: asrs18Score || null,
    moca: mocaScore,
    meem: meemScore,
    hamd: hamdScore,
    hama: hamaScore,
  })

  let suggestion = screening.fullSuggestion
  if (cognitiveVrc !== null && cognitiveVrc < 0.5) {
    suggestion += `\n\nPerformance cognitiva abaixo do esperado (VRC: ${cognitiveVrc.toFixed(2)}). Recomenda-se investigação complementar.`
  }

  if (!hasScaleData) {
    return {
      phq9Score: 0,
      gad7Score: 0,
      phq9Severity: getPhq9Severity(0),
      gad7Severity: getGad7Severity(0),
      cognitiveVrc,
      suggestion:
        'Nenhum dado de escalas encontrado para esta sessão. Complete as escalas para gerar uma interpretação contextual.',
      hasComorbidity: false,
      hasScaleData: false,
      assqScore: null,
      snapIvScore: null,
      asrs18Score: null,
      mocaScore: null,
      meemScore: null,
      hamdScore: null,
      hamaScore: null,
      findings: [],
      comorbidities: [],
    }
  }

  return {
    phq9Score,
    gad7Score,
    phq9Severity: getPhq9Severity(phq9Score),
    gad7Severity: getGad7Severity(gad7Score),
    cognitiveVrc,
    suggestion,
    hasComorbidity: screening.comorbidities.length > 0,
    hasScaleData: true,
    assqScore: assqScore || null,
    snapIvScore: snapIvScore || null,
    asrs18Score: asrs18Score || null,
    mocaScore,
    meemScore,
    hamdScore,
    hamaScore,
    findings: screening.findings,
    comorbidities: screening.comorbidities,
  }
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
