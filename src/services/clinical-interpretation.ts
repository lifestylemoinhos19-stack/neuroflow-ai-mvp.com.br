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
  asrs18Keys,
  hamdKeys,
  hamaKeys,
  type ScreeningFinding,
  computeGlobalSeverity,
} from '@/lib/clinical-screening'

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
  snapIvInattention: number | null
  snapIvHyperactivity: number | null
  globalSeverity: 'low' | 'moderate' | 'high'
  asrs18Score: number | null
  mocaScore: number | null
  meemScore: number | null
  hamdScore: number | null
  hamaScore: number | null
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

function getSingleScore(responses: RawResponse[], key: string): number | null {
  const r = responses.find((resp) => resp.question_key === key)
  return r ? parseValue(r.response_value) : null
}

export async function getSessionInterpretation(
  sessionId: string,
): Promise<InterpretationResult | null> {
  const { data: responses, error } = await supabase.rpc('get_session_responses_decrypted', {
    p_session_id: sessionId,
  })

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
  const hamdScore = scoreQuestionnaire(raw, hamdKeys)
  const hamaScore = scoreQuestionnaire(raw, hamaKeys)

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

  // Análise por domínios + hipóteses + lacunas (linguagem cautelosa).
  const domainAnalysis = buildDomainAnalysis({
    phq9Score,
    gad7Score,
    assqScore: assqScore || null,
    snapIvScore: snapIvScore || null,
    asrs18Score: asrs18Score || null,
    mocaScore,
    meemScore,
    hamdScore,
    hamaScore,
    cognitiveVrc,
  })
  const hypotheses = buildHypotheses(screening.findings)
  const gaps = buildGaps({
    phq9Score,
    gad7Score,
    assqScore: assqScore || null,
    snapIvScore: snapIvScore || null,
    asrs18Score: asrs18Score || null,
    mocaScore,
    meemScore,
    hamdScore,
    hamaScore,
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
    snapIvInattention: snapResult.inattentionAvg || null,
    snapIvHyperactivity: snapResult.hyperactivityAvg || null,
    globalSeverity: computeGlobalSeverity({
      phq9: phq9Score,
      gad7: gad7Score,
      assq: assqScore || null,
      snapIv: snapIvScore || null,
      asrs18: asrs18Score || null,
      moca: mocaScore,
      meem: meemScore,
      hamd: hamdScore,
      hama: hamaScore,
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
  if (parts.length === 0) {
    return { severity: null, descricao: 'Sem instrumentos fornecidos para o domínio de humor.' }
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
  if (parts.length === 0) {
    return { severity: null, descricao: 'Sem instrumentos fornecidos para o domínio de ansiedade.' }
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
    return { severity: null, descricao: 'Sem instrumentos fornecidos para o domínio cognitivo.' }
  }
  return { severity: sev, descricao: parts.join(' ') }
}

function domainComportamento(): {
  severity: Sev
  descricao: string
} {
  // Comportamento no InterpretationResult reflete escalas; o detalhe por escala
  // (Y-BOCS, SDS) entra via laudo-pdf. Aqui sinalizamos apenas ausência de dados
  // diretos, para não inventar.
  return {
    severity: null,
    descricao: 'Sem instrumentos de comportamento fornecidos neste fluxo.',
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
    return { severity: null, descricao: 'Sem instrumentos fornecidos para neurodesenvolvimento.' }
  }
  return { severity: sev, descricao: parts.join(' ') }
}

function buildDomainAnalysis(s: ScoreBag): DomainAnalysis {
  return {
    humor: domainHumor(s),
    ansiedade: domainAnsiedade(s),
    cognicao: domainCognicao(s),
    comportamento: domainComportamento(),
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
  const gaps: string[] = []
  if (!s.phq9Score) gaps.push('PHQ-9 sem pontuação informada.')
  if (!s.gad7Score) gaps.push('GAD-7 sem pontuação informada.')
  if (s.assqScore === null) gaps.push('ASSQ sem pontuação informada.')
  if (s.snapIvScore === null) gaps.push('SNAP-IV sem pontuação informada.')
  if (s.asrs18Score === null) gaps.push('ASRS-18 sem pontuação informada.')
  if (s.mocaScore === null) gaps.push('MoCA sem pontuação informada.')
  if (s.meemScore === null) gaps.push('MEEM sem pontuação informada.')
  if (s.hamdScore === null) gaps.push('HAM-D sem pontuação informada.')
  if (s.hamaScore === null) gaps.push('HAM-A sem pontuação informada.')
  if (s.cognitiveVrc === null) gaps.push('VRC não disponível.')
  return gaps
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
      snap_iv_inattention: snapIvInattention,
      snap_iv_hyperactivity: snapIvHyperactivity,
      global_severity: globalSeverity,
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
