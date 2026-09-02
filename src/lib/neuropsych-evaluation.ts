/**
 * NeuroFlow — Engine de Avaliação Neuropsiquiátrica e Neurodesenvolvimento
 *
 * Implementa o playbook padronizado de laudos da Casa Branca Saúde:
 * 10 seções, disclaimer obrigatório, linguagem cautelosa, iniciais do
 * paciente, detecção de lacunas e alerta de risco iminente.
 *
 * REGRAS NÃO NEGOCIÁVEIS (aplicadas aqui):
 *  - Nunca inventa dados, hipóteses, pontuações, conclusões ou diagnósticos.
 *  - Nunca usa "diagnóstico"/"fechamento diagnóstico"/"sinais definitivos".
 *    Usa "sinais compatíveis com", "hipótese clínica a confirmar",
 *    "áreas de atenção".
 *  - Apresenta-se como apoio à decisão clínica, não como substituto do
 *    profissional responsável.
 *  - Sinaliza lacunas e itens a confirmar.
 *  - Não prescreve medicamentos, doses nem conduta fechada.
 *  - Preserva confidencialidade: usa apenas iniciais do sobrenome do paciente.
 *  - Em sinais de risco iminente (ideação suicida, auto/heteroagressão),
 *    orienta encaminhamento imediato a urgência/emergência.
 */

import type { InterpretationResult } from '@/services/clinical-interpretation'

/** Disclaimer obrigatório do playbook (texto canônico). */
export const NEUROPSYCH_DISCLAIMER =
  '⚠️ Este laudo é um instrumento de apoio à decisão clínica gerado por inteligência artificial com base exclusivamente nas informações fornecidas pelo profissional responsável. Não substitui avaliação presencial, não constitui diagnóstico e não substitui o julgamento clínico do profissional habilitado. Resultados e conclusões devem ser revisados, validados e assinados pelo profissional responsável antes de qualquer uso.'

/** Status possível para cada domínio avaliado. */
export type DomainStatus = 'presente' | 'ausente' | 'nao_informado'

/** Classificação de severidade por domínio (linguagem cautelosa). */
export type DomainSeverity = 'baixa' | 'moderada' | 'alta' | null

export interface DomainFinding {
  status: DomainStatus
  descricao: string
  severity: DomainSeverity
}

export interface InstrumentRecord {
  nome: string
  data: string
  pontuacao: string
  classificacao: string
  detalhes?: string
}

/** Resumo de um módulo MINI positivo (para mapear em domínios). */
export interface MiniModuleSummary {
  letter: string
  title: string
  status: string
  details?: string
}

export interface NeuropsychPatient {
  /** Iniciais já prontas (ex.: "J.S."). Se ausente, calculadas de fullName. */
  iniciais?: string | null
  fullName?: string | null
  idade?: number | null
  birthDate?: string | null
  sexo?: string | null
  escolaridade?: string | null
}

export interface NeuropsychProfessional {
  nome: string
  registro: string
  especialidade?: string | null
}

export interface NeuropsychContext {
  patient: NeuropsychPatient
  professional: NeuropsychProfessional
  assessmentDate?: string | null
  scaleType?: string | null
  score?: number | null
  protocol?: string | null
  interviewerName?: string | null
  startTime?: string | null
  endTime?: string | null
  queixaPrincipal?: string | null
  historiaEvolucao?: string | null
  /** Interpretação rica da sessão (PHQ-9, GAD-7, etc.). */
  aiInterpretation?: InterpretationResult | null
  /** Módulos MINI 5.0.0 positivos ou avaliados. */
  miniResults?: MiniModuleSummary[] | null
  /** Alertas clínicos explícitos. */
  alerts?: string[] | null
  /** Interpretação salva pelo profissional (clinical_feedback). */
  savedInterpretation?: string | null
  /** Performance cognitiva (VRC) de sessão de foco, se houver. */
  cognitiveVrc?: number | null
  /** Pontuações de instrumentos aplicados informadas manualmente. */
  instruments?: InstrumentRecord[]
}

/** Objeto JSON canônico do playbook para integração. */
export interface NeuropsychReportJSON {
  identificacao: {
    iniciais: string
    idade: number | null
    sexo: string
    escolaridade: string
  }
  queixa_principal: string
  dominios: {
    humor: { status: DomainStatus; descricao: string }
    ansiedade: { status: DomainStatus; descricao: string }
    cognicao: { status: DomainStatus; descricao: string }
    comportamento: { status: DomainStatus; descricao: string }
    neurodesenvolvimento: { status: DomainStatus; descricao: string }
  }
  instrumentos: InstrumentRecord[]
  sintese_clinica: string
  areas_de_atencao: string[]
  lacunas: string[]
  encaminhamentos: string[]
  profissional: { nome: string; registro: string; especialidade: string }
  disclaimer: string
  /** Alerta de risco iminente (ideação suicida / auto-heteroagressão). */
  risco_iminente: string | null
  comorbidades: string[]
}

/** Seção estruturada para renderização em PDF (mantém ordem do playbook). */
export interface ReportSection {
  index: number
  title: string
  lines: string[]
}

export interface NeuropsychReport {
  /** Texto markdown completo com as 10 seções. */
  markdown: string
  /** Objeto JSON para integração. */
  json: NeuropsychReportJSON
  /** Seções estruturadas (para PDF). */
  sections: ReportSection[]
  /** Alerta de risco iminente (null se ausente). */
  riscoIminente: string | null
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Calcula iniciais do sobrenome a partir do nome completo.
 * "João da Silva" → "J.S.". Nunca expõe o nome completo em saídas.
 */
function computeInitials(name?: string | null): string {
  if (!name) return '—'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '—'
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase() + '.'
  }
  const first = parts[0].charAt(0).toUpperCase()
  const last = parts[parts.length - 1].charAt(0).toUpperCase()
  return `${first}.${last}.`
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return String(iso)
  return d.toLocaleDateString('pt-BR')
}

function fmtNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  return String(n)
}

/** Formata pontuação como string (nunca calcula/infer). */
function fmtScore(n: number | null | undefined, max?: number): string {
  if (n === null || n === undefined) return 'não informada'
  return max !== undefined ? `${n}/${max}` : String(n)
}

/* ------------------------------------------------------------------ */
/* Mapeamento escala → domínio                                        */
/* ------------------------------------------------------------------ */

interface DomainAssessment {
  status: DomainStatus
  descricao: string
  severity: DomainSeverity
  instruments: InstrumentRecord[]
}

/**
 * Avalia o domínio HUMOR a partir de PHQ-9 e HAM-D.
 * Linguagem cautelosa: "sinais compatíveis com indicadores depressivos".
 */
function assessHumor(ctx: NeuropsychContext): DomainAssessment {
  const ai = ctx.aiInterpretation
  const instruments: InstrumentRecord[] = []
  const dataStr = fmtDate(ctx.assessmentDate)
  const parts: string[] = []

  let severity: DomainSeverity = null
  let hasScore = false

  const scaleTypeNormalized = (ctx.scaleType || '').toUpperCase().trim()

  if (
    ai &&
    ((ai.phq9Score !== undefined && ai.phq9Score !== null) ||
      (ai.bdiScore !== undefined && ai.bdiScore !== null) ||
      (ai.hamdScore !== undefined && ai.hamdScore !== null))
  ) {
    if (
      ai.bdiScore !== undefined &&
      ai.bdiScore !== null &&
      (scaleTypeNormalized.includes('BDI') ||
        (ai.bdiScore > 0 && !scaleTypeNormalized.includes('MINI')))
    ) {
      hasScore = true
      const s = ai.bdiScore
      let faixa = 'faixa mínima'
      if (s >= 29) {
        faixa = 'faixa grave'
        severity = 'alta'
      } else if (s >= 20) {
        faixa = 'faixa moderada'
        severity = severity === 'alta' ? 'alta' : 'moderada'
      } else if (s >= 14) {
        faixa = 'faixa leve'
        severity = severity ?? 'baixa'
      }
      parts.push(
        `BDI-II: pontuação informada ${s}/63, compatível com ${faixa} para indicadores depressivos.`,
      )
      instruments.push({
        nome: 'BDI-II (Inventário de Beck)',
        data: dataStr,
        pontuacao: fmtScore(s, 63),
        classificacao: `compatível com ${faixa}`,
      })
    }
    if (
      ai.phq9Score !== undefined &&
      ai.phq9Score !== null &&
      (scaleTypeNormalized.includes('PHQ') ||
        (ai.phq9Score > 0 && !scaleTypeNormalized.includes('MINI')))
    ) {
      hasScore = true
      const s = ai.phq9Score
      let faixa = 'faixa mínima'
      if (s >= 20) {
        faixa = 'faixa alta (severa)'
        severity = 'alta'
      } else if (s >= 15) {
        faixa = 'faixa moderadamente severa'
        severity = severity === 'alta' ? 'alta' : 'moderada'
      } else if (s >= 10) {
        faixa = 'faixa moderada'
        severity = severity === 'alta' ? 'alta' : 'moderada'
      } else if (s >= 5) {
        faixa = 'faixa leve'
        severity = severity ?? 'baixa'
      }
      parts.push(
        `PHQ-9: pontuação informada ${s}/27, compatível com ${faixa} para indicadores depressivos.`,
      )
      instruments.push({
        nome: 'PHQ-9',
        data: dataStr,
        pontuacao: fmtScore(s, 27),
        classificacao: `compatível com ${faixa}`,
      })
    }
    if (
      ai.hamdScore !== null &&
      ai.hamdScore !== undefined &&
      (scaleTypeNormalized.includes('HAM-D') ||
        (ai.hamdScore > 0 && !scaleTypeNormalized.includes('MINI')))
    ) {
      hasScore = true
      const s = ai.hamdScore
      let faixa = 'dentro do esperado'
      if (s >= 20) {
        faixa = 'faixa alta'
        severity = 'alta'
      } else if (s >= 8) {
        faixa = 'faixa moderada'
        severity = severity === 'alta' ? 'alta' : 'moderada'
      }
      parts.push(
        `HAM-D: pontuação informada ${s}, compatível com ${faixa} para indicadores de humor.`,
      )
      instruments.push({
        nome: 'HAM-D',
        data: dataStr,
        pontuacao: fmtScore(s),
        classificacao: `compatível com ${faixa}`,
      })
    }
  }

  // Módulos MINI relacionados a humor (A: depressão maior, B: distimia, D: mania)
  const miniHumor = (ctx.miniResults || []).filter((m) => ['A', 'B', 'D'].includes(m.letter))
  for (const m of miniHumor) {
    parts.push(
      `MINI módulo ${m.letter} (${m.title}): resultado ${m.status.toLowerCase()} — sinais compatíveis com alteração de humor a confirmar.`,
    )
    if (m.letter === 'A' || m.letter === 'D') {
      severity = severity === 'alta' ? 'alta' : 'moderada'
    }
  }

  const status: DomainStatus =
    hasScore || miniHumor.length > 0 ? (severity ? 'presente' : 'ausente') : 'nao_informado'

  const descricao =
    parts.length > 0
      ? parts.join(' ')
      : status === 'nao_informado'
        ? ''
        : 'Pontuações dentro dos parâmetros esperados para humor e afeto.'

  return { status, descricao, severity, instruments }
}

/**
 * Avalia o domínio ANSIEDADE a partir de GAD-7, HAM-A e módulos MINI
 * (E: pânico, F: agorafobia, G: ansiedade social, O: TAG, I: TEPT).
 */
function assessAnsiedade(ctx: NeuropsychContext): DomainAssessment {
  const ai = ctx.aiInterpretation
  const instruments: InstrumentRecord[] = []
  const dataStr = fmtDate(ctx.assessmentDate)
  const parts: string[] = []
  let severity: DomainSeverity = null
  let hasScore = false

  const scaleTypeNormalized = (ctx.scaleType || '').toUpperCase().trim()

  if (
    ai &&
    ((ai.gad7Score !== undefined && ai.gad7Score !== null) ||
      (ai.baiScore !== undefined && ai.baiScore !== null) ||
      (ai.hamaScore !== undefined && ai.hamaScore !== null))
  ) {
    if (
      ai.baiScore !== undefined &&
      ai.baiScore !== null &&
      (scaleTypeNormalized.includes('BAI') ||
        (ai.baiScore > 0 && !scaleTypeNormalized.includes('MINI')))
    ) {
      hasScore = true
      const s = ai.baiScore
      let faixa = 'faixa mínima'
      if (s >= 26) {
        faixa = 'faixa grave'
        severity = 'alta'
      } else if (s >= 16) {
        faixa = 'faixa moderada'
        severity = severity === 'alta' ? 'alta' : 'moderada'
      } else if (s >= 8) {
        faixa = 'faixa leve'
        severity = severity ?? 'baixa'
      }
      parts.push(
        `BAI: pontuação informada ${s}/63, compatível com ${faixa} para indicadores ansiosos.`,
      )
      instruments.push({
        nome: 'BAI (Inventário de Beck)',
        data: dataStr,
        pontuacao: fmtScore(s, 63),
        classificacao: `compatível com ${faixa}`,
      })
    }
    if (
      ai.gad7Score !== undefined &&
      ai.gad7Score !== null &&
      (scaleTypeNormalized.includes('GAD') ||
        (ai.gad7Score > 0 && !scaleTypeNormalized.includes('MINI')))
    ) {
      hasScore = true
      const s = ai.gad7Score
      let faixa = 'faixa mínima'
      if (s >= 15) {
        faixa = 'faixa alta (severa)'
        severity = 'alta'
      } else if (s >= 10) {
        faixa = 'faixa moderada'
        severity = severity === 'alta' ? 'alta' : 'moderada'
      } else if (s >= 5) {
        faixa = 'faixa leve'
        severity = severity ?? 'baixa'
      }
      parts.push(
        `GAD-7: pontuação informada ${s}/21, compatível com ${faixa} para indicadores ansiosos.`,
      )
      instruments.push({
        nome: 'GAD-7',
        data: dataStr,
        pontuacao: fmtScore(s, 21),
        classificacao: `compatível com ${faixa}`,
      })
    }
    if (
      ai.hamaScore !== null &&
      ai.hamaScore !== undefined &&
      (scaleTypeNormalized.includes('HAM-A') ||
        (ai.hamaScore > 0 && !scaleTypeNormalized.includes('MINI')))
    ) {
      hasScore = true
      const s = ai.hamaScore
      let faixa = 'dentro do esperado'
      if (s >= 20) {
        faixa = 'faixa alta'
        severity = 'alta'
      } else if (s >= 8) {
        faixa = 'faixa moderada'
        severity = severity === 'alta' ? 'alta' : 'moderada'
      }
      parts.push(
        `HAM-A: pontuação informada ${s}, compatível com ${faixa} para indicadores de ansiedade.`,
      )
      instruments.push({
        nome: 'HAM-A',
        data: dataStr,
        pontuacao: fmtScore(s),
        classificacao: `compatível com ${faixa}`,
      })
    }
  }

  const miniAns = (ctx.miniResults || []).filter((m) =>
    ['E', 'F', 'G', 'O', 'I'].includes(m.letter),
  )
  for (const m of miniAns) {
    parts.push(
      `MINI módulo ${m.letter} (${m.title}): resultado ${m.status.toLowerCase()} — sinais compatíveis com ansiedade a confirmar.`,
    )
    severity = severity === 'alta' ? 'alta' : 'moderada'
  }

  const status: DomainStatus =
    hasScore || miniAns.length > 0 ? (severity ? 'presente' : 'ausente') : 'nao_informado'

  const descricao =
    parts.length > 0
      ? parts.join(' ')
      : status === 'nao_informado'
        ? ''
        : 'Pontuações dentro dos parâmetros esperados para ansiedade.'

  return { status, descricao, severity, instruments }
}

/**
 * Avalia o domínio COGNIÇÃO a partir de MoCA, MEEM, FAS, FTDRS e VRC.
 */
function assessCognicao(ctx: NeuropsychContext): DomainAssessment {
  const ai = ctx.aiInterpretation
  const instruments: InstrumentRecord[] = []
  const dataStr = fmtDate(ctx.assessmentDate)
  const parts: string[] = []
  let severity: DomainSeverity = null
  let hasScore = false

  const scaleTypeNormalized = (ctx.scaleType || '').toUpperCase().trim()

  if (ai && !scaleTypeNormalized.includes('MINI')) {
    if (ai.mocaScore !== null && ai.mocaScore !== undefined) {
      hasScore = true
      const s = ai.mocaScore
      let faixa = 'dentro do esperado'
      if (s < 18) {
        faixa = 'faixa de comprometimento grave'
        severity = 'alta'
      } else if (s < 24) {
        faixa = 'faixa de comprometimento leve a moderado'
        severity = severity === 'alta' ? 'alta' : 'moderada'
      } else {
        faixa = 'dentro do esperado'
      }
      parts.push(`MoCA: pontuação informada ${s}/30, compatível com ${faixa} para cognição.`)
      instruments.push({
        nome: 'MoCA',
        data: dataStr,
        pontuacao: fmtScore(s, 30),
        classificacao: `compatível com ${faixa}`,
      })
    }
    if (ai.meemScore !== null && ai.meemScore !== undefined) {
      hasScore = true
      const s = ai.meemScore
      let faixa = 'dentro do esperado'
      if (s < 18) {
        faixa = 'faixa de comprometimento grave'
        severity = 'alta'
      } else if (s < 24) {
        faixa = 'faixa de comprometimento leve a moderado'
        severity = severity === 'alta' ? 'alta' : 'moderada'
      }
      parts.push(`MEEM: pontuação informada ${s}/30, compatível com ${faixa} para cognição.`)
      instruments.push({
        nome: 'MEEM',
        data: dataStr,
        pontuacao: fmtScore(s, 30),
        classificacao: `compatível com ${faixa}`,
      })
    }
    if (ai.tmtAScore !== null && ai.tmtAScore !== undefined) {
      hasScore = true
      const s = ai.tmtAScore
      let faixa = 'preservado (≤29s)'
      if (s > 78) {
        faixa = 'lentificação significativa (>78s)'
        severity = 'alta'
      } else if (s >= 30) {
        faixa = 'limítrofe (30–78s)'
        severity = severity === 'alta' ? 'alta' : 'moderada'
      }
      parts.push(`TMT Parte A: tempo informado ${s}s, ${faixa}.`)
      instruments.push({
        nome: 'Trail Making Test - Parte A (TMT-A)',
        data: dataStr,
        pontuacao: `${s}s`,
        classificacao: faixa,
      })
    }
    if (ai.tmtBScore !== null && ai.tmtBScore !== undefined) {
      hasScore = true
      const s = ai.tmtBScore
      let faixa = 'preservado (≤75s)'
      if (s > 272) {
        faixa = 'déficit executivo significativo (>272s)'
        severity = 'alta'
      } else if (s >= 76) {
        faixa = 'lentificação executiva leve a moderada (76–272s)'
        severity = severity === 'alta' ? 'alta' : 'moderada'
      }
      parts.push(`TMT Parte B: tempo informado ${s}s, ${faixa}.`)
      instruments.push({
        nome: 'Trail Making Test - Parte B (TMT-B)',
        data: dataStr,
        pontuacao: `${s}s`,
        classificacao: faixa,
      })
    }
    if (ai.fluenciaAnimaisScore !== null && ai.fluenciaAnimaisScore !== undefined) {
      hasScore = true
      const s = ai.fluenciaAnimaisScore
      let faixa = 'preservado (>15)'
      if (s < 12) {
        faixa = 'rebaixado (<12)'
        severity = 'alta'
      } else if (s <= 14) {
        faixa = 'limítrofe (12–14)'
        severity = severity === 'alta' ? 'alta' : 'moderada'
      }
      parts.push(`Fluência Semântica (Animais): ${s} palavras em 60s, ${faixa}.`)
      instruments.push({
        nome: 'Fluência Verbal Semântica - Animais',
        data: dataStr,
        pontuacao: `${s} palavras`,
        classificacao: faixa,
      })
    }
    if (ai.fluenciaFrutasScore !== null && ai.fluenciaFrutasScore !== undefined) {
      hasScore = true
      const s = ai.fluenciaFrutasScore
      let faixa = 'preservado (>12)'
      if (s < 9) {
        faixa = 'rebaixado (<9)'
        severity = 'alta'
      } else if (s <= 11) {
        faixa = 'limítrofe (9–11)'
        severity = severity === 'alta' ? 'alta' : 'moderada'
      }
      parts.push(`Fluência Semântica (Frutas): ${s} palavras em 60s, ${faixa}.`)
      instruments.push({
        nome: 'Fluência Verbal Semântica - Frutas',
        data: dataStr,
        pontuacao: `${s} palavras`,
        classificacao: faixa,
      })
    }
    if (ai.fas !== null && ai.fas !== undefined) {
      hasScore = true
      const s = ai.fas
      let faixa = 'dentro do esperado'
      if (s < 15) {
        faixa = 'possível comprometimento (abaixo de 15)'
        severity = severity === 'alta' ? 'alta' : 'moderada'
      }
      parts.push(`FAS: pontuação informada ${s} palavras, compatível com ${faixa}.`)
      instruments.push({
        nome: 'Fluência Verbal Fonêmica (FAS)',
        data: dataStr,
        pontuacao: `${s} palavras`,
        classificacao: faixa,
      })
    }
    // FTDRS (Frontotemporal Dementia Rating Scale — 0–45, chaves ftdrs_q1..q15)
    if (ai.ftdrs !== null && ai.ftdrs !== undefined) {
      hasScore = true
      const s = ai.ftdrs
      let faixa = 'gravidade mínima'
      if (s >= 30) {
        faixa = 'faixa de gravidade grave'
        severity = 'alta'
      } else if (s >= 20) {
        faixa = 'faixa de gravidade moderada'
        severity = severity === 'alta' ? 'alta' : 'moderada'
      } else if (s >= 10) {
        faixa = 'faixa de gravidade leve'
        severity = severity === 'alta' ? 'alta' : 'baixa'
      }
      parts.push(
        `FTDRS: pontuação informada ${s}/45, compatível com ${faixa} para indicadores de demência frontotemporal.`,
      )
      instruments.push({
        nome: 'FTDRS (Frontotemporal Dementia Rating Scale)',
        data: dataStr,
        pontuacao: fmtScore(s, 45),
        classificacao: `compatível com ${faixa}`,
      })
    }
    // WURS-25 (Wender Utah Rating Scale — 0–100, corte clínico ≥ 46)
    if (ai.wurs25Score !== null && ai.wurs25Score !== undefined) {
      hasScore = true
      const s = ai.wurs25Score
      let faixa = 'abaixo do corte retrospectivo (< 46)'
      if (s >= 46) {
        faixa = 'sinais compatíveis com história infantil de TDAH (corte ≥ 46)'
        severity = 'alta'
      } else if (s >= 36) {
        faixa = 'pontuação limítrofe para história infantil de TDAH (36–45)'
        if (!severity) severity = 'moderada'
      }
      parts.push(`WURS-25: pontuação informada ${s}/100, ${faixa}.`)
      instruments.push({
        nome: 'WURS-25 (Wender Utah Rating Scale)',
        data: dataStr,
        pontuacao: fmtScore(s, 100),
        classificacao: faixa,
      })
    }
  }

  // VRC (performance cognitiva em sessão de foco) — omitido quando ausente/null
  const vrc = !scaleTypeNormalized.includes('MINI')
    ? (ctx.cognitiveVrc ?? ai?.cognitiveVrc ?? null)
    : null
  if (vrc !== null && vrc !== undefined && !isNaN(vrc) && vrc > 0) {
    hasScore = true
    if (vrc < 0.5) {
      parts.push(
        `Performance cognitiva (VRC): ${vrc.toFixed(2)} — abaixo do esperado; recomenda-se investigação complementar.`,
      )
      severity = severity === 'alta' ? 'alta' : 'moderada'
    } else {
      parts.push(`Performance cognitiva (VRC): ${vrc.toFixed(2)} — dentro do esperado.`)
    }
  }

  const status: DomainStatus = hasScore ? (severity ? 'presente' : 'ausente') : 'nao_informado'
  const descricao =
    parts.length > 0
      ? parts.join(' ')
      : status === 'nao_informado'
        ? ''
        : 'Pontuações cognitivas dentro dos parâmetros esperados.'

  return { status, descricao, severity, instruments }
}

/**
 * Avalia o domínio COMPORTAMENTO a partir de Y-BOCS, SDS e módulos MINI
 * (H: TOC, J/K: substâncias, L: psicose, M/N: transtornos alimentares,
 *  P: antissocial, C: risco suicida).
 */
function assessComportamento(ctx: NeuropsychContext): DomainAssessment {
  const instruments: InstrumentRecord[] = []
  const dataStr = fmtDate(ctx.assessmentDate)
  const parts: string[] = []
  let severity: DomainSeverity = null
  let hasScore = false

  const ai = ctx.aiInterpretation

  const scaleTypeNormalized = (ctx.scaleType || '').toUpperCase().trim()
  const isMini = scaleTypeNormalized.includes('MINI')

  // Y-BOCS via score bruto do input ou aiInterpretation (ignorado se for MINI)
  const ybocsScore = !isMini
    ? ((ctx.scaleType && ctx.scaleType.toUpperCase().trim() === 'Y-BOCS' ? ctx.score : null) ??
      (ai as any)?.ybocsScore ??
      null)
    : null
  if (ybocsScore !== null) {
    hasScore = true
    const s = ybocsScore
    let faixa = 'sintomas subclínicos'
    if (s >= 24) {
      faixa = 'faixa grave'
      severity = 'alta'
    } else if (s >= 16) {
      faixa = 'faixa moderada'
      severity = 'moderada'
    } else if (s >= 8) {
      faixa = 'faixa leve'
      severity = 'baixa'
    }
    parts.push(
      `Y-BOCS: pontuação informada ${s}/40, compatível com ${faixa} para obsessões/compulsões.`,
    )
    instruments.push({
      nome: 'Y-BOCS',
      data: dataStr,
      pontuacao: fmtScore(s, 40),
      classificacao: `compatível com ${faixa}`,
    })
  }

  // SDS via score bruto do input ou aiInterpretation (ignorado se for MINI)
  const sdsScore = !isMini
    ? ((ctx.scaleType &&
      (ctx.scaleType.toUpperCase().trim() === 'SDS' ||
        ctx.scaleType.toLowerCase().includes('sheehan'))
        ? ctx.score
        : null) ??
      ai?.sdsScore ??
      null)
    : null
  if (sdsScore !== null) {
    hasScore = true
    const s = sdsScore
    let faixa = 'incapacidade normal/leve'
    if (s >= 8) {
      faixa = 'faixa de incapacidade severa'
      severity = 'alta'
    } else if (s >= 5) {
      faixa = 'faixa de incapacidade moderada'
      severity = 'moderada'
    }
    parts.push(`SDS / Sheehan: pontuação informada ${s}/30, compatível com ${faixa}.`)
    instruments.push({
      nome: 'SDS (Escala de Incapacidade de Sheehan)',
      data: dataStr,
      pontuacao: fmtScore(s, 30),
      classificacao: `compatível com ${faixa}`,
    })
  }
  const miniComp = (ctx.miniResults || []).filter((m) =>
    ['H', 'J', 'K', 'L', 'M', 'N', 'P', 'C'].includes(m.letter),
  )
  for (const m of miniComp) {
    parts.push(
      `MINI módulo ${m.letter} (${m.title}): resultado ${m.status.toLowerCase()} — sinais compatíveis com alteração de comportamento a confirmar.`,
    )
    if (['C', 'L', 'J', 'K'].includes(m.letter)) {
      severity = 'alta'
    } else {
      severity = severity === 'alta' ? 'alta' : 'moderada'
    }
  }

  const status: DomainStatus =
    hasScore || miniComp.length > 0 ? (severity ? 'presente' : 'ausente') : 'nao_informado'
  const descricao =
    parts.length > 0
      ? parts.join(' ')
      : status === 'nao_informado'
        ? ''
        : 'Comportamento dentro dos parâmetros esperados.'

  return { status, descricao, severity, instruments }
}

/**
 * Avalia o domínio NEURODESENVOLVIMENTO a partir de ASSQ, SNAP-IV,
 * ASRS-18, M-CHAT-R.
 */
function assessNeurodesenvolvimento(ctx: NeuropsychContext): DomainAssessment {
  const ai = ctx.aiInterpretation
  const instruments: InstrumentRecord[] = []
  const dataStr = fmtDate(ctx.assessmentDate)
  const parts: string[] = []
  let severity: DomainSeverity = null
  let hasScore = false

  const scaleTypeNormalized = (ctx.scaleType || '').toUpperCase().trim()

  if (ai && !scaleTypeNormalized.includes('MINI')) {
    if (ai.assqScore !== null && ai.assqScore !== undefined && ai.assqScore > 0) {
      hasScore = true
      const s = ai.assqScore
      let faixa = 'abaixo do ponto de corte'
      if (s >= 22) {
        faixa = 'faixa de risco elevado'
        severity = 'alta'
      } else if (s >= 15) {
        faixa = 'faixa de risco moderado'
        severity = 'moderada'
      }
      parts.push(
        `ASSQ: pontuação informada ${s}, compatível com ${faixa} para indicadores de espectro autista.`,
      )
      instruments.push({
        nome: 'ASSQ',
        data: dataStr,
        pontuacao: fmtScore(s),
        classificacao: `compatível com ${faixa}`,
      })
    }
    if (ai.snapIvScore !== null && ai.snapIvScore !== undefined && ai.snapIvScore > 0) {
      hasScore = true
      const s = ai.snapIvScore
      let faixa = 'abaixo do ponto de corte'
      if (s > 2) {
        faixa = 'faixa de risco elevado'
        severity = 'alta'
      } else if (s >= 1.5) {
        faixa = 'faixa de risco moderado'
        severity = 'moderada'
      }
      parts.push(
        `SNAP-IV: média informada ${s.toFixed(2)}/3.00, compatível com ${faixa} para indicadores de TDAH.`,
      )
      instruments.push({
        nome: 'SNAP-IV',
        data: dataStr,
        pontuacao: `${s.toFixed(2)}/3.00`,
        classificacao: `compatível com ${faixa}`,
      })
    }
    if (ai.asrs18Score !== null && ai.asrs18Score !== undefined && ai.asrs18Score > 0) {
      hasScore = true
      const s = ai.asrs18Score
      let faixa = 'abaixo do ponto de corte'
      if (s >= 48) {
        faixa = 'faixa de risco elevado'
        severity = 'alta'
      } else if (s >= 36) {
        faixa = 'faixa de risco moderado'
        severity = 'moderada'
      }
      parts.push(
        `ASRS-18: pontuação informada ${s}, compatível com ${faixa} para indicadores de TDAH em adultos.`,
      )
      instruments.push({
        nome: 'ASRS-18',
        data: dataStr,
        pontuacao: fmtScore(s),
        classificacao: `compatível com ${faixa}`,
      })
    }
  }

  // WURS-25 (Wender Utah Rating Scale - TDAH retrospectivo)
  const wursScore =
    ((ctx.scaleType &&
    (ctx.scaleType.toLowerCase().includes('wurs') || ctx.scaleType.toLowerCase().includes('wender'))
      ? ctx.score
      : null) ??
      ai?.wurs25Score ??
      null) ||
    null
  if (wursScore !== null) {
    hasScore = true
    const s = wursScore
    let faixa = 'abaixo do corte retrospectivo (< 46)'
    if (s >= 46) {
      faixa = 'sinais compatíveis com história infantil de TDAH (≥ 46)'
      severity = 'alta'
    } else if (s >= 36) {
      faixa = 'pontuação limítrofe para história infantil de TDAH (36–45)'
      if (!severity) severity = 'moderada'
    }
    parts.push(`WURS-25: pontuação informada ${s}/100, ${faixa}.`)
    instruments.push({
      nome: 'WURS-25 (Wender Utah Rating Scale)',
      data: dataStr,
      pontuacao: fmtScore(s, 100),
      classificacao: faixa,
    })
  }

  // AQ-10 (Quociente do Espectro Autista - Triagem)
  if (
    ctx.scaleType &&
    (ctx.scaleType.toLowerCase().includes('aq-10') || ctx.scaleType.toLowerCase() === 'aq10') &&
    ctx.score !== null &&
    ctx.score > 0
  ) {
    hasScore = true
    const s = ctx.score
    let faixa = 'abaixo do corte de triagem (< 6)'
    if (s >= 6) {
      faixa = 'sinais compatíveis com traços de TEA (≥ 6) — encaminhar para avaliação completa'
      severity = 'alta'
    }
    parts.push(`AQ-10: pontuação informada ${s}/10, ${faixa}.`)
    instruments.push({
      nome: 'AQ-10',
      data: dataStr,
      pontuacao: fmtScore(s, 10),
      classificacao: faixa,
    })
  }

  // AQ Completo (AQ-50)
  if (
    ctx.scaleType &&
    (ctx.scaleType.toLowerCase().includes('aq-50') ||
      ctx.scaleType.toLowerCase() === 'aq50' ||
      ctx.scaleType.toLowerCase() === 'aq') &&
    ctx.score !== null &&
    ctx.score > 0
  ) {
    hasScore = true
    const s = ctx.score
    let faixa = 'padrão neurotípico (< 26)'
    if (s >= 32) {
      faixa = 'fortemente compatível com traços de TEA no adulto (≥ 32)'
      severity = 'alta'
    } else if (s >= 26) {
      faixa = 'traços moderados no espectro autista (26–31)'
      if (!severity) severity = 'moderada'
    }
    parts.push(`AQ-50: pontuação informada ${s}/50, ${faixa}.`)
    instruments.push({
      nome: 'AQ-50',
      data: dataStr,
      pontuacao: fmtScore(s, 50),
      classificacao: faixa,
    })
  }

  // Vanderbilt (VADRS)
  if (
    ctx.scaleType &&
    (ctx.scaleType.toLowerCase().includes('vanderbilt') ||
      ctx.scaleType.toLowerCase().includes('vadrs')) &&
    ctx.score !== null &&
    ctx.score > 0
  ) {
    hasScore = true
    const s = ctx.score
    let faixa = 'dentro do padrão comportamental esperado'
    if (s >= 50) {
      faixa = 'sinais elevados de TDAH e/ou comorbidades comportamentais'
      severity = 'alta'
    } else if (s >= 30) {
      faixa = 'sinais moderados em desatenção/hiperatividade/comorbidades'
      if (!severity) severity = 'moderada'
    }
    parts.push(`Vanderbilt (VADRS): pontuação informada ${s}, ${faixa}.`)
    instruments.push({
      nome: 'Vanderbilt (VADRS)',
      data: dataStr,
      pontuacao: fmtScore(s),
      classificacao: faixa,
    })
  }

  // SCQ (Social Communication Questionnaire)
  if (
    ctx.scaleType &&
    (ctx.scaleType.toLowerCase().includes('scq') ||
      ctx.scaleType.toLowerCase().includes('social communication')) &&
    ctx.score !== null &&
    ctx.score > 0
  ) {
    hasScore = true
    const s = ctx.score
    let faixa = 'abaixo do corte de risco (< 15)'
    if (s >= 15) {
      faixa = 'sinais compatíveis com risco de TEA infantil (corte ≥ 15)'
      severity = 'alta'
    } else if (s >= 11) {
      faixa = 'risco limítrofe para alterações na comunicação social (11–14)'
      if (!severity) severity = 'moderada'
    }
    parts.push(`SCQ: pontuação informada ${s}/39, ${faixa}.`)
    instruments.push({
      nome: 'SCQ',
      data: dataStr,
      pontuacao: fmtScore(s, 39),
      classificacao: faixa,
    })
  }

  // M-CHAT-R via score bruto do input
  if (ctx.scaleType && ctx.scaleType.toUpperCase().trim() === 'M-CHAT-R' && ctx.score !== null) {
    hasScore = true
    const s = ctx.score
    let faixa = 'baixo risco'
    if (s >= 8) {
      faixa = 'faixa de risco elevado'
      severity = 'alta'
    } else if (s >= 3) {
      faixa = 'faixa de risco moderado'
      severity = 'moderada'
    }
    parts.push(
      `M-CHAT-R/F: pontuação informada ${s}/20, compatível com ${faixa} para indicadores de espectro autista em primeira infância.`,
    )
    instruments.push({
      nome: 'M-CHAT-R/F',
      data: dataStr,
      pontuacao: fmtScore(s, 20),
      classificacao: `compatível com ${faixa}`,
    })
  }

  // FTDRS via score bruto ou aiInterpretation (chaves reais ftdrs_q1..q15)
  const ftdrsScore =
    ((ctx.scaleType && ctx.scaleType.toUpperCase().trim() === 'FTDRS' ? ctx.score : null) ??
      ai?.ftdrs ??
      null) ||
    null
  if (ftdrsScore !== null) {
    hasScore = true
    const s = ftdrsScore
    let faixa = 'gravidade mínima'
    if (s >= 30) {
      faixa = 'faixa de gravidade grave'
      severity = 'alta'
    } else if (s >= 20) {
      faixa = 'faixa de gravidade moderada'
      severity = 'moderada'
    } else if (s >= 10) {
      faixa = 'faixa de gravidade leve'
      severity = 'baixa'
    }
    parts.push(
      `FTDRS: pontuação informada ${s}/45, compatível com ${faixa} para indicadores de demência frontotemporal.`,
    )
    instruments.push({
      nome: 'FTDRS (Frontotemporal Dementia Rating Scale)',
      data: dataStr,
      pontuacao: fmtScore(s, 45),
      classificacao: `compatível com ${faixa}`,
    })
  }

  // FAS via score bruto ou aiInterpretation
  const fasScore =
    ((ctx.scaleType && ctx.scaleType.toUpperCase().trim() === 'FAS' ? ctx.score : null) ??
      ai?.fas ??
      null) ||
    null
  if (fasScore !== null) {
    hasScore = true
    const s = fasScore
    const faixa = s < 15 ? 'possível comprometimento (abaixo de 15)' : 'dentro do esperado'
    if (s < 15) severity = 'moderada'
    parts.push(`FAS: pontuação informada ${s} palavras, compatível com ${faixa}.`)
    instruments.push({
      nome: 'FAS (Fluência Verbal Fonêmica)',
      data: dataStr,
      pontuacao: fmtScore(s),
      classificacao: `compatível com ${faixa}`,
    })
  }

  const status: DomainStatus = hasScore ? (severity ? 'presente' : 'ausente') : 'nao_informado'
  const descricao =
    parts.length > 0
      ? parts.join(' ')
      : status === 'nao_informado'
        ? ''
        : 'Marcos de neurodesenvolvimento dentro dos parâmetros esperados.'

  return { status, descricao, severity, instruments }
}

/* ------------------------------------------------------------------ */
/* Detecção de risco iminente                                          */
/* ------------------------------------------------------------------ */

/**
 * Detecta sinais de risco iminente (ideação suicida, auto/heteroagressão)
 * APENAS a partir de dados fornecidos — nunca infere.
 *
 * Sinais considerados:
 *  - Módulo C do MINI positivo (risco de suicídio).
 *  - Texto fornecido (queixa, história, interpretação salva) que mencione
 *    ideação suicida, autolesão ou heteroagressão.
 */
function detectImminentRisk(ctx: NeuropsychContext): string | null {
  const alerts: string[] = []

  // Alertas explícitos passados no contexto
  if (ctx.alerts && ctx.alerts.length > 0) {
    for (const a of ctx.alerts) {
      alerts.push(a)
    }
  }

  // MINI módulo C (risco de suicídio)
  const modC = (ctx.miniResults || []).find((m) => m.letter === 'C')
  if (modC) {
    alerts.push(
      `Sinal compatível com risco suicida identificado no MINI (módulo C: ${modC.status}).`,
    )
  }

  // MENI módulo L (psicose) positivo → risco de auto/heteroagressão
  const modL = (ctx.miniResults || []).find((m) => m.letter === 'L')
  if (modL) {
    alerts.push(
      `Sinal compatível com síndrome psicótica (MINI módulo L) — avaliar risco de auto/heteroagressão.`,
    )
  }

  // Busca textual em campos fornecidos (nunca infere; apenas reflete).
  const haystack = [ctx.queixaPrincipal, ctx.historiaEvolucao, ctx.savedInterpretation]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (haystack) {
    const suicidalTerms = [
      'ideação suicida',
      'ideacao suicida',
      'pensamento de morte',
      'intento suicida',
      'autolesão',
      'autolesao',
      'automutilação',
      'automutilacao',
      'heteroagress',
      'suicíd',
      'suicid',
      'matar-se',
      'tirar a vida',
    ]
    for (const term of suicidalTerms) {
      if (haystack.includes(term)) {
        alerts.push(
          `Menção a "${term}" registrada nas informações fornecidas — exige avaliação de segurança imediata.`,
        )
        break
      }
    }
  }

  if (alerts.length === 0) return null
  return (
    '⚠️ RISCO IMINENTE: ' +
    alerts.join(' ') +
    ' Encaminhamento imediato a serviço de urgência/emergência em saúde mental é obrigatório. Remover meios de autolesão. Acompanhamento contínuo até estabilização.'
  )
}

/* ------------------------------------------------------------------ */
/* Síntese, áreas de atenção, lacunas, encaminhamentos                */
/* ------------------------------------------------------------------ */

function buildSintese(
  domains: Record<string, DomainAssessment>,
  comorbidities: string[],
  riscoIminente: string | null,
): string {
  const lines: string[] = []

  if (riscoIminente) {
    lines.push(
      '⚠️ Sinais compatíveis com risco iminente identificados — encaminhamento de urgência prioritário.',
    )
  }

  const presentDomains = Object.entries(domains).filter(([, d]) => d.status === 'presente')

  if (presentDomains.length === 0) {
    lines.push(
      'Não foram identificados sinais compatíveis com alterações clínicas significativas nos domínios avaliados, com base exclusivamente nas pontuações fornecidas. Hipóteses clínicas só devem ser consideradas mediante avaliação presencial.',
    )
    return lines.join('\n\n')
  }

  lines.push(
    'Sinais compatíveis observados por domínio (interpretação assistida, não constitui diagnóstico):',
  )
  for (const [name, d] of presentDomains) {
    const sev = d.severity ? ` (severidade estimada: ${d.severity})` : ''
    lines.push(
      `- ${labelDomain(name)}${sev}: sinais compatíveis presentes a confirmar clinicamente.`,
    )
  }

  if (comorbidities.length > 0) {
    lines.push('')
    lines.push('Indicadores sugestivos de comorbidade (hipóteses a confirmar):')
    for (const c of comorbidities) lines.push(`- ${c}`)
  }

  lines.push('')
  lines.push(
    'As hipóteses acima são áreas de atenção a confirmar e não constituem fechamento diagnóstico. A conduta final é de responsabilidade exclusiva do profissional habilitado.',
  )

  return lines.join('\n')
}

function labelDomain(key: string): string {
  switch (key) {
    case 'humor':
      return 'Humor e afeto'
    case 'ansiedade':
      return 'Ansiedade'
    case 'cognicao':
      return 'Cognição'
    case 'comportamento':
      return 'Comportamento'
    case 'neurodesenvolvimento':
      return 'Neurodesenvolvimento'
    default:
      return key
  }
}

function buildAreasAtencao(
  domains: Record<string, DomainAssessment>,
  comorbidities: string[],
): string[] {
  const areas: string[] = []
  for (const [key, d] of Object.entries(domains)) {
    if (d.status === 'presente') {
      areas.push(
        `${labelDomain(key)}: indicadores sugestivos presentes — hipótese clínica a confirmar (severidade estimada: ${d.severity ?? 'não classificada'}).`,
      )
    }
  }
  for (const c of comorbidities) {
    areas.push(`Possível comorbidade sugerida pelos instrumentos: ${c} (a confirmar).`)
  }
  return areas
}

function buildLacunas(ctx: NeuropsychContext, domains: Record<string, DomainAssessment>): string[] {
  const lacunas: string[] = []

  const p = ctx.patient
  if (!p.idade && !p.birthDate) lacunas.push('Idade/data de nascimento não informada.')
  if (p.sexo === '—' || !p.sexo) {
    // Demográfico opcional
  }
  if (!ctx.queixaPrincipal || ctx.queixaPrincipal === 'Não fornecida.') {
    lacunas.push('Queixa principal não informada nesta avaliação.')
  }

  // Apenas aponta lacunas clinicamente relevantes se houver necessidade
  if (lacunas.length === 0) {
    lacunas.push('Nenhuma lacuna crítica de dados identificada para os instrumentos aplicados.')
  }

  return lacunas
}

function buildEncaminhamentos(
  domains: Record<string, DomainAssessment>,
  comorbidities: string[],
  riscoIminente: string | null,
): string[] {
  const enc: string[] = []

  if (riscoIminente) {
    enc.push('Encaminhamento imediato a serviço de urgência/emergência em saúde mental.')
    enc.push('Avaliação de segurança e proteção do paciente com acompanhamento contínuo.')
  }

  // Encaminhamentos complementares não vinculantes, por domínio alterado
  if (domains.humor.status === 'presente')
    enc.push('Avaliação clínica presencial para investigação de transtorno de humor (a confirmar).')
  if (domains.ansiedade.status === 'presente')
    enc.push(
      'Avaliação clínica presencial para investigação de transtorno de ansiedade (a confirmar).',
    )
  if (domains.cognicao.status === 'presente')
    enc.push('Avaliação neuropsicológica complementar para investigação cognitiva (a confirmar).')
  if (domains.comportamento.status === 'presente')
    enc.push(
      'Avaliação clínica presencial para investigação de comportamento/obsessões-compulsões (a confirmar).',
    )
  if (domains.neurodesenvolvimento.status === 'presente')
    enc.push('Avaliação multidisciplinar para investigação de neurodesenvolvimento (a confirmar).')

  if (comorbidities.length > 0) {
    enc.push('Avaliação integrada para investigação de comorbidades sugeridas (a confirmar).')
  }

  // Sempre genérico e não vinculante
  enc.push('Revisão e validação por profissional habilitado antes de qualquer conduta.')

  // Evita duplicatas mantendo ordem
  return Array.from(new Set(enc))
}

/* ------------------------------------------------------------------ */
/* Geração do laudo                                                    */
/* ------------------------------------------------------------------ */

/**
 * Gera o laudo padronizado (10 seções) a partir do contexto fornecido.
 *
 * NÃO inventa dados: reflete apenas o que foi fornecido. Campos ausentes
 * viram lacunas explicitamente sinalizadas. Nunca emite diagnóstico.
 */
export function generateNeuropsychReport(ctx: NeuropsychContext): NeuropsychReport {
  const iniciais = ctx.patient.iniciais || computeInitials(ctx.patient.fullName)

  const humor = assessHumor(ctx)
  const ansiedade = assessAnsiedade(ctx)
  const cognicao = assessCognicao(ctx)
  const comportamento = assessComportamento(ctx)
  const neurodesenvolvimento = assessNeurodesenvolvimento(ctx)

  const domains: Record<string, DomainAssessment> = {
    humor,
    ansiedade,
    cognicao,
    comportamento,
    neurodesenvolvimento,
  }

  // Comorbidades (linguagem cautelosa — reescrita)
  const rawComorbidities = ctx.aiInterpretation?.comorbidities || []
  const comorbidities = rawComorbidities.map((c) => c.replace(/^(-\s*)?/, '').trim())

  const riscoIminente = detectImminentRisk(ctx)

  // Instrumentos consolidados
  const instruments: InstrumentRecord[] = [
    ...(ctx.instruments || []),
    ...humor.instruments,
    ...ansiedade.instruments,
    ...cognicao.instruments,
    ...comportamento.instruments,
    ...neurodesenvolvimento.instruments,
  ]
  // Remove duplicatas por nome (mesmo instrumento em vários domínios)
  const seen = new Set<string>()
  const uniqueInstruments = instruments.filter((i) => {
    if (seen.has(i.nome)) return false
    seen.add(i.nome)
    return true
  })

  const sintese = buildSintese(domains, comorbidities, riscoIminente)
  const areasAtencao = buildAreasAtencao(domains, comorbidities)
  const lacunas = buildLacunas(ctx, domains)
  const encaminhamentos = buildEncaminhamentos(domains, comorbidities, riscoIminente)

  const profissional = {
    nome: ctx.professional.nome,
    registro: ctx.professional.registro,
    especialidade: ctx.professional.especialidade || '—',
  }

  const queixa = ctx.queixaPrincipal || 'Não fornecida.'
  const historia = ctx.historiaEvolucao || 'Não fornecida.'

  // Monta seção específica de dados da Anamnese se presente
  const anamnesis = ctx.aiInterpretation?.anamnesisData
  const anamnesisLines: string[] = []
  if (anamnesis) {
    if (anamnesis.chiefComplaint) {
      anamnesisLines.push(`Queixa principal: ${anamnesis.chiefComplaint}`)
    }
    if (anamnesis.developmentalHistory) {
      anamnesisLines.push(`História do desenvolvimento: ${anamnesis.developmentalHistory}`)
    }
    if (anamnesis.familyHistory) {
      anamnesisLines.push(`Histórico familiar: ${anamnesis.familyHistory}`)
    }
    if (anamnesis.currentInterventions) {
      anamnesisLines.push(`Intervenções atuais: ${anamnesis.currentInterventions}`)
    }
    if (anamnesis.additionalNotes) {
      anamnesisLines.push(`Observações adicionais: ${anamnesis.additionalNotes}`)
    }
  }

  // Instrumentos aplicados (inclui Anamnese Clínica se for avaliação qualitativa)
  const isAnamnesis = !!anamnesis || ctx.scaleType?.toLowerCase().includes('anamnese')
  let finalInstruments = uniqueInstruments
  if (isAnamnesis && !uniqueInstruments.some((i) => i.nome === 'Anamnese Clínica')) {
    finalInstruments = [
      {
        nome: 'Anamnese Clínica',
        data: fmtDate(ctx.assessmentDate),
        pontuacao: 'Qualitativa',
        classificacao: 'Questionário clínico estruturado',
      },
      ...uniqueInstruments,
    ]
  }

  // ---- Seções estruturadas (10) ----
  // Dados de identificação completos
  const identLines: string[] = [
    `Paciente: ${iniciais} | Idade: ${fmtNumber(ctx.patient.idade)} | Sexo: ${ctx.patient.sexo || '—'} | Escolaridade: ${ctx.patient.escolaridade || '—'}`,
  ]
  if (ctx.protocol) {
    identLines.push(`Protocolo: ${ctx.protocol}`)
  }
  if (ctx.interviewerName) {
    identLines.push(`Entrevistador(a): ${ctx.interviewerName}`)
  }
  const timeInfo: string[] = []
  if (ctx.startTime) timeInfo.push(`Início: ${ctx.startTime}`)
  if (ctx.endTime) timeInfo.push(`Fim: ${ctx.endTime}`)
  if (timeInfo.length > 0) {
    identLines.push(timeInfo.join(' | '))
  }
  identLines.push(
    `Profissional responsável: ${profissional.nome} — ${profissional.registro} — ${profissional.especialidade}`,
  )
  identLines.push(`Data da avaliação: ${fmtDate(ctx.assessmentDate)}`)

  const activeDomainsLines: string[] = []
  if (anamnesisLines.length > 0) {
    activeDomainsLines.push(...anamnesisLines)
  }
  if (humor.descricao) activeDomainsLines.push(`Humor e afeto: ${humor.descricao}`)
  if (ansiedade.descricao) activeDomainsLines.push(`Ansiedade: ${ansiedade.descricao}`)
  if (cognicao.descricao) activeDomainsLines.push(`Cognição: ${cognicao.descricao}`)
  if (comportamento.descricao) activeDomainsLines.push(`Comportamento: ${comportamento.descricao}`)
  if (neurodesenvolvimento.descricao)
    activeDomainsLines.push(`Neurodesenvolvimento: ${neurodesenvolvimento.descricao}`)

  if (activeDomainsLines.length === 0) {
    activeDomainsLines.push('Sinais clínicos observados em concordância com a escala aplicada.')
  }

  const sections: ReportSection[] = [
    {
      index: 1,
      title: 'IDENTIFICAÇÃO',
      lines: identLines,
    },
    {
      index: 2,
      title: 'QUEIXA PRINCIPAL',
      lines: [queixa],
    },
    {
      index: 3,
      title: 'HISTÓRIA E EVOLUÇÃO',
      lines: [historia],
    },
    {
      index: 4,
      title:
        anamnesisLines.length > 0
          ? 'DADOS DA ANAMNESE E SINAIS CLÍNICOS'
          : 'SINAIS E SINTOMAS OBSERVADOS',
      lines: activeDomainsLines,
    },
    {
      index: 5,
      title: 'INSTRUMENTOS APLICADOS',
      lines:
        finalInstruments.length > 0
          ? finalInstruments.map(
              (i) =>
                `${i.nome} | Data: ${i.data} | Pontuação informada: ${i.pontuacao} | Classificação: ${i.classificacao}`,
            )
          : ['Nenhum instrumento quantitativo pontuado registrado nesta avaliação.'],
    },
    {
      index: 6,
      title: 'SÍNTESE CLÍNICA (interpretação assistida)',
      lines: [sintese],
    },
    {
      index: 7,
      title: 'ÁREAS DE ATENÇÃO E HIPÓTESES A CONFIRMAR',
      lines:
        areasAtencao.length > 0
          ? areasAtencao
          : ['Pontuações e respostas dentro dos parâmetros esperados para a escala aplicada.'],
    },
    {
      index: 8,
      title: 'LACUNAS E ITENS A CONFIRMAR',
      lines: lacunas.length > 0 ? lacunas : ['Nenhuma lacuna crítica de dados identificada.'],
    },
    {
      index: 9,
      title: 'ENCAMINHAMENTOS SUGERIDOS',
      lines: encaminhamentos,
    },
    {
      index: 10,
      title: 'LIMITAÇÕES',
      lines: [NEUROPSYCH_DISCLAIMER],
    },
  ]

  // ---- Markdown ----
  const markdown = sections
    .map((s) => {
      const body = s.lines.map((l) => (l.startsWith('-') ? l : `- ${l}`)).join('\n')
      return `## ${s.index}. ${s.title}\n${body}`
    })
    .join('\n\n')

  // ---- JSON ----
  const json: NeuropsychReportJSON = {
    identificacao: {
      iniciais,
      idade: ctx.patient.idade ?? null,
      sexo: ctx.patient.sexo || '',
      escolaridade: ctx.patient.escolaridade || '',
    },
    queixa_principal: queixa,
    dominios: {
      humor: { status: humor.status, descricao: humor.descricao },
      ansiedade: { status: ansiedade.status, descricao: ansiedade.descricao },
      cognicao: { status: cognicao.status, descricao: cognicao.descricao },
      comportamento: { status: comportamento.status, descricao: comportamento.descricao },
      neurodesenvolvimento: {
        status: neurodesenvolvimento.status,
        descricao: neurodesenvolvimento.descricao,
      },
    },
    instrumentos: finalInstruments,
    sintese_clinica: sintese,
    areas_de_atencao: areasAtencao,
    lacunas: lacunas,
    encaminhamentos: encaminhamentos,
    profissional,
    disclaimer: NEUROPSYCH_DISCLAIMER,
    risco_iminente: riscoIminente,
    comorbidades: comorbidities,
  }

  return { markdown, json, sections, riscoIminente }
}
