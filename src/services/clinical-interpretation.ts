import { supabase } from '@/lib/supabase/client'
import {
  phq9Questions,
  gad7Questions,
  getPhq9Severity,
  getGad7Severity,
  type Phq9Severity,
  type Gad7Severity,
} from '@/lib/phq9-gad7-data'

export interface InterpretationResult {
  phq9Score: number
  gad7Score: number
  phq9Severity: Phq9Severity
  gad7Severity: Gad7Severity
  cognitiveVrc: number | null
  suggestion: string
  hasComorbidity: boolean
  hasScaleData: boolean
}

interface RawResponse {
  question_key: string
  response_value: unknown
}

function parseResponseValue(value: unknown): number {
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

function scoreScale(responses: RawResponse[], questions: { key: string }[]): number {
  return questions.reduce((total, q) => {
    const response = responses.find((r) => r.question_key === q.key)
    return total + (response ? parseResponseValue(response.response_value) : 0)
  }, 0)
}

export function generateSuggestion(
  phq9Score: number,
  gad7Score: number,
  cognitiveVrc: number | null,
): string {
  const hasCognitiveImpact = cognitiveVrc !== null && cognitiveVrc < 0.5

  if (phq9Score >= 15 && gad7Score >= 10) {
    let suggestion =
      'Quadro compatível com comorbidade ansiedade-depressão. Recomenda-se avaliação do impacto cognitivo associado.'
    if (hasCognitiveImpact) {
      suggestion += ` Indicadores cognitivos observados (VRC: ${cognitiveVrc!.toFixed(2)}), reforçando a necessidade de avaliação neuropsicológica complementar.`
    }
    return suggestion
  }

  if (phq9Score >= 15) {
    let suggestion =
      'Indicadores significativos de depressão. Recomenda-se encaminhamento para avaliação profissional especializada.'
    if (hasCognitiveImpact) {
      suggestion += ` O impacto cognitivo observado (VRC: ${cognitiveVrc!.toFixed(2)}) sugere correlação com o quadro depressivo.`
    }
    return suggestion
  }

  if (gad7Score >= 10) {
    let suggestion =
      'Indicadores significativos de ansiedade. Recomenda-se acompanhamento e estratégias de manejo da ansiedade.'
    if (hasCognitiveImpact) {
      suggestion += ` A performance cognitiva (VRC: ${cognitiveVrc!.toFixed(2)}) pode estar sendo afetada pelo quadro ansioso.`
    }
    return suggestion
  }

  if (phq9Score >= 10 && gad7Score >= 5) {
    return 'Indicadores de sintomas depressivos e ansiosos em nível moderado. Recomenda-se monitoramento contínuo e estratégias de apoio.'
  }

  if (phq9Score >= 5 || gad7Score >= 5) {
    return 'Indicadores leves de sintomas emocionais. Monitoramento e estratégias de bem-estar são recomendados.'
  }

  if (hasCognitiveImpact) {
    return `Performance cognitiva abaixo do esperado (VRC: ${cognitiveVrc!.toFixed(2)}). Recomenda-se investigação de fatores que podem estar impactando o desempenho cognitivo.`
  }

  return 'Os resultados das escalas emocionais estão dentro dos parâmetros esperados. Nenhuma indicação clínica significativa no momento.'
}

export async function getSessionInterpretation(
  sessionId: string,
): Promise<InterpretationResult | null> {
  const { data: responses, error: respError } = await supabase
    .from('anamnesis_responses')
    .select('question_key, response_value')
    .eq('session_id', sessionId)

  if (respError || !responses) return null

  const phq9Keys = phq9Questions.map((q) => q.key)
  const gad7Keys = gad7Questions.map((q) => q.key)
  const phq9Count = responses.filter((r) => phq9Keys.includes(r.question_key)).length
  const gad7Count = responses.filter((r) => gad7Keys.includes(r.question_key)).length
  const hasScaleData = phq9Count > 0 || gad7Count > 0

  const phq9Score = scoreScale(responses as RawResponse[], phq9Questions)
  const gad7Score = scoreScale(responses as RawResponse[], gad7Questions)

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

  if (!hasScaleData) {
    return {
      phq9Score: 0,
      gad7Score: 0,
      phq9Severity: getPhq9Severity(0),
      gad7Severity: getGad7Severity(0),
      cognitiveVrc,
      suggestion:
        'Nenhum dado de PHQ-9 ou GAD-7 encontrado para esta sessão. Complete as escalas para gerar uma interpretação contextual.',
      hasComorbidity: false,
      hasScaleData: false,
    }
  }

  const suggestion = generateSuggestion(phq9Score, gad7Score, cognitiveVrc)

  return {
    phq9Score,
    gad7Score,
    phq9Severity: getPhq9Severity(phq9Score),
    gad7Severity: getGad7Severity(gad7Score),
    cognitiveVrc,
    suggestion,
    hasComorbidity: phq9Score >= 15 && gad7Score >= 10,
    hasScaleData: true,
  }
}

export async function saveInterpretation(
  sessionId: string,
  systemSuggestion: string,
  adminEditedText: string,
  phq9Score: number,
  gad7Score: number,
  cognitiveVrc: number | null,
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
