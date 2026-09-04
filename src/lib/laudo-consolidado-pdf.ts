import { jsPDF } from 'jspdf'
import { CLINIC_BRANDING, CLINICIAN_CREDENTIALS, getValidationUrl } from '@/lib/clinic-branding'
import { sanitizePdfText } from '@/lib/laudo-pdf'
import { NEUROPSYCH_DISCLAIMER } from '@/lib/neuropsych-evaluation'
import {
  type PatientIdentification,
  type PatientEvaluationItem,
  type PatientFullHistory,
  getPatientFullHistory,
} from '@/services/patient-full-history'
import {
  getSessionInterpretation,
  type InterpretationResult,
} from '@/services/clinical-interpretation'
import {
  generateScreening,
  computeGlobalSeverity,
  type ScaleScores,
} from '@/lib/clinical-screening'

export interface ConsolidatedPdfInput {
  identification: PatientIdentification
  evaluations: PatientEvaluationItem[]
  fullHistory?: PatientFullHistory | null
}

/**
 * Converte hex (#7B5B3A) para [r, g, b].
 */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const n = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h,
    16,
  )
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/**
 * Carrega imagem e devolve data URL PNG para doc.addImage
 */
async function fetchImageAsPngData(
  url: string,
): Promise<{ dataUrl: string; format: 'PNG' | 'JPEG' } | null> {
  try {
    return await new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || img.width || 300
        canvas.height = img.naturalHeight || img.height || 300
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(null)
        ctx.drawImage(img, 0, 0)
        resolve({ dataUrl: canvas.toDataURL('image/png'), format: 'PNG' })
      }
      img.onerror = () => resolve(null)
      img.src = url
    })
  } catch {
    return null
  }
}

/** QR Code apontando para validação */
async function fetchQrCodePng(codeId: string): Promise<string | null> {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=2&data=${encodeURIComponent(
    getValidationUrl(codeId),
  )}`
  const data = await fetchImageAsPngData(url)
  return data?.dataUrl ?? null
}

/**
 * Classifica a gravidade do escore por tipo de instrumento de forma robusta e estandardizada.
 */
function classifyScaleScore(
  scaleType: string,
  score: number | null,
  interp?: InterpretationResult | null,
  rawInterpText?: string | null,
): { label: string; interpretation: string; isPending: boolean } {
  const norm = (scaleType || '').toLowerCase().trim()

  // Se não há escore numérico nem resposta
  if (score === null || score === undefined || isNaN(score)) {
    if (rawInterpText && rawInterpText.trim()) {
      return {
        label: 'Avaliação Qualitativa',
        interpretation: rawInterpText.trim(),
        isPending: false,
      }
    }
    return {
      label: 'Pendente de revisão clínica',
      interpretation:
        'Instrumento sem escore calculado ou respostas pendentes de validação médica.',
      isPending: true,
    }
  }

  // PHQ-9
  if (norm.includes('phq') || norm === 'phq9' || norm === 'phq-9') {
    if (score >= 20)
      return {
        label: 'Depressão Grave',
        interpretation: 'Sintomas depressivos severos com risco funcional alto.',
        isPending: false,
      }
    if (score >= 15)
      return {
        label: 'Depressão Moderadamente Grave',
        interpretation: 'Sintomas clinicamente significativos necessitando intervenção.',
        isPending: false,
      }
    if (score >= 10)
      return {
        label: 'Depressão Moderada',
        interpretation: 'Sintomas clinicamente relevantes de humor deprimido.',
        isPending: false,
      }
    if (score >= 5)
      return {
        label: 'Sintomas Leves',
        interpretation: 'Sintomas subclínicos/leves; monitorar evolução.',
        isPending: false,
      }
    return {
      label: 'Mínimo / Sem Depressão',
      interpretation: 'Escore dentro dos parâmetros normativos esperados.',
      isPending: false,
    }
  }

  // GAD-7
  if (norm.includes('gad') || norm === 'gad7' || norm === 'gad-7') {
    if (score >= 15)
      return {
        label: 'Ansiedade Grave',
        interpretation: 'Sintomas ansiosos intensos e incapacitantes.',
        isPending: false,
      }
    if (score >= 10)
      return {
        label: 'Ansiedade Moderada',
        interpretation: 'Quadro ansioso moderado com necessidade de acompanhamento.',
        isPending: false,
      }
    if (score >= 5)
      return {
        label: 'Ansiedade Leve',
        interpretation: 'Sintomas ansiosos leves ou situacionais.',
        isPending: false,
      }
    return {
      label: 'Ansiedade Mínima',
      interpretation: 'Dentro da faixa de normalidade psíquica.',
      isPending: false,
    }
  }

  // HAM-D
  if (norm.includes('ham-d') || norm.includes('hamd')) {
    if (score >= 20)
      return {
        label: 'Depressão Grave',
        interpretation: 'Sintomas depressivos de intensidade severa.',
        isPending: false,
      }
    if (score >= 14)
      return {
        label: 'Depressão Moderada',
        interpretation: 'Sintomas depressivos moderados.',
        isPending: false,
      }
    if (score >= 8)
      return {
        label: 'Depressão Leve',
        interpretation: 'Sintomas depressivos leves.',
        isPending: false,
      }
    return {
      label: 'Remissão / Normal',
      interpretation: 'Sem evidência de quadro depressivo ativo.',
      isPending: false,
    }
  }

  // HAM-A
  if (norm.includes('ham-a') || norm.includes('hama')) {
    if (score >= 25)
      return {
        label: 'Ansiedade Severa',
        interpretation: 'Quadro ansioso generalizado com repercussão somática importante.',
        isPending: false,
      }
    if (score >= 18)
      return {
        label: 'Ansiedade Moderada',
        interpretation: 'Sintomas ansiosos clinicamente evidentes.',
        isPending: false,
      }
    if (score >= 8)
      return {
        label: 'Ansiedade Leve',
        interpretation: 'Ansiedade psíquica ou somática de baixa magnitude.',
        isPending: false,
      }
    return {
      label: 'Normal / Mínimo',
      interpretation: 'Ausência de queixas ansiosas significativas.',
      isPending: false,
    }
  }

  // BDI-II
  if (norm.includes('bdi')) {
    if (score >= 29)
      return {
        label: 'Depressão Grave',
        interpretation: 'Indicadores intensos de depressão segundo corte de Beck.',
        isPending: false,
      }
    if (score >= 20)
      return {
        label: 'Depressão Moderada',
        interpretation: 'Quadro depressivo moderado.',
        isPending: false,
      }
    if (score >= 14)
      return {
        label: 'Depressão Leve',
        interpretation: 'Sintomatologia depressiva leve.',
        isPending: false,
      }
    return { label: 'Mínimo', interpretation: 'Faixa de normalidade.', isPending: false }
  }

  // BAI
  if (norm.includes('bai')) {
    if (score >= 26)
      return {
        label: 'Ansiedade Grave',
        interpretation: 'Sintomas ansiosos de alta gravidade clínica.',
        isPending: false,
      }
    if (score >= 16)
      return {
        label: 'Ansiedade Moderada',
        interpretation: 'Sintomatologia ansiosa moderada.',
        isPending: false,
      }
    if (score >= 8)
      return {
        label: 'Ansiedade Leve',
        interpretation: 'Sintomas ansiosos leves.',
        isPending: false,
      }
    return { label: 'Mínimo', interpretation: 'Faixa de normalidade.', isPending: false }
  }

  // MoCA
  if (norm.includes('moca')) {
    if (score < 18)
      return {
        label: 'Declínio Cognitivo Grave',
        interpretation: 'Comprometimento global severo (ponto de corte normativo < 24).',
        isPending: false,
      }
    if (score < 24)
      return {
        label: 'Declínio Cognitivo Leve/Moderado',
        interpretation: 'Escore abaixo do corte de 24 pontos; rastreio de CCL positivo.',
        isPending: false,
      }
    return {
      label: 'Cognição Preservada',
      interpretation: 'Desempenho dentro dos padrões normativos esperados (≥ 24/30).',
      isPending: false,
    }
  }

  // MEEM
  if (norm.includes('meem')) {
    if (score < 18)
      return {
        label: 'Comprometimento Cognitivo Grave',
        interpretation: 'Declínio cognitivo severo.',
        isPending: false,
      }
    if (score < 24)
      return {
        label: 'Comprometimento Cognitivo Leve',
        interpretation: 'Pontuação abaixo do corte clínico de 24 pontos.',
        isPending: false,
      }
    return {
      label: 'Preservado',
      interpretation: 'Desempenho cognitivo global satisfatório (≥ 24/30).',
      isPending: false,
    }
  }

  // FTDRS
  if (norm.includes('ftdrs')) {
    if (score >= 30)
      return {
        label: 'Demência Frontotemporal Severa',
        interpretation: 'Comprometimento funcional grave compatível com DFT.',
        isPending: false,
      }
    if (score >= 20)
      return {
        label: 'Demência Frontotemporal Moderada',
        interpretation: 'Sintomas comportamentais e cognitivos moderados de DFT.',
        isPending: false,
      }
    if (score >= 10)
      return {
        label: 'Demência Frontotemporal Leve',
        interpretation: 'Sintomas comportamentais iniciais (corte ≥ 10).',
        isPending: false,
      }
    return {
      label: 'Sem Evidência de DFT',
      interpretation: 'Escore na faixa de estabilidade comportamental (< 10/45).',
      isPending: false,
    }
  }

  // FAS (Fluência Fonêmica)
  if (norm.includes('fas') && !norm.includes('fluencia_semantica')) {
    if (score < 15)
      return {
        label: 'Fluência Fonêmica Rebaixada',
        interpretation:
          'Desempenho abaixo do corte normativo (< 15 palavras). Sugere lentificação ou disfunção executiva.',
        isPending: false,
      }
    return {
      label: 'Fluência Fonêmica Preservada',
      interpretation: 'Acesso lexical fonêmico satisfatório (≥ 15 palavras).',
      isPending: false,
    }
  }

  // WURS-25
  if (norm.includes('wurs')) {
    if (score >= 46)
      return {
        label: 'Compatível com TDAH na Infância',
        interpretation:
          'Escore retrospectivo atinge ou supera o ponto de corte clínico (≥ 46/100).',
        isPending: false,
      }
    if (score >= 36)
      return {
        label: 'Faixa Limítrofe',
        interpretation: 'História infantil limítrofe de desatenção/hiperatividade (36–45).',
        isPending: false,
      }
    return {
      label: 'Abaixo do Corte',
      interpretation: 'História prévia infantil não sugestiva de TDAH (< 46).',
      isPending: false,
    }
  }

  // SNAP-IV
  if (norm.includes('snap')) {
    if (score > 2.0)
      return {
        label: 'TDAH Risco Elevado',
        interpretation: 'Média de respostas acima de 2.0 indicativa de sintomas proeminentes.',
        isPending: false,
      }
    if (score >= 1.5)
      return {
        label: 'TDAH Risco Moderado',
        interpretation: 'Escore médio acima do ponto de corte de 1.5.',
        isPending: false,
      }
    return {
      label: 'Sem Risco Significativo',
      interpretation: 'Escore médio abaixo do corte clínico (< 1.5).',
      isPending: false,
    }
  }

  // ASRS-18
  if (norm.includes('asrs')) {
    if (score >= 48)
      return {
        label: 'TDAH Adulto Risco Elevado',
        interpretation: 'Forte probabilidade de TDAH na vida adulta.',
        isPending: false,
      }
    if (score >= 36)
      return {
        label: 'TDAH Adulto Risco Moderado',
        interpretation: 'Sinais sugestivos de TDAH em adultos (corte ≥ 36).',
        isPending: false,
      }
    return {
      label: 'Abaixo do Ponto de Corte',
      interpretation: 'Sintomas de TDAH não atingem significância clínica.',
      isPending: false,
    }
  }

  // ASSQ
  if (norm.includes('assq')) {
    if (score >= 22)
      return {
        label: 'TEA Risco Elevado',
        interpretation:
          'Indicadores clínicos expressivos para TEA; encaminhar para avaliação aprofundada.',
        isPending: false,
      }
    if (score >= 15)
      return {
        label: 'TEA Risco Moderado',
        interpretation: 'Triagem positiva para TEA (corte ≥ 15); indicado ADOS-2.',
        isPending: false,
      }
    return {
      label: 'Abaixo do Ponto de Corte',
      interpretation: 'Dentro dos parâmetros neurotípicos esperados (< 15).',
      isPending: false,
    }
  }

  // AQ-10
  if (norm.includes('aq10') || norm.includes('aq-10')) {
    if (score >= 6)
      return {
        label: 'Triagem TEA Positiva',
        interpretation:
          'Escore atinge ponto de corte de rastreio (≥ 6/10); aprofundar investigação.',
        isPending: false,
      }
    return {
      label: 'Triagem Negativa',
      interpretation: 'Abaixo do ponto de corte de rastreio de TEA (< 6).',
      isPending: false,
    }
  }

  // AQ-50
  if (norm.includes('aq50') || norm.includes('aq-50')) {
    if (score >= 32)
      return {
        label: 'Traços Clínicos Significativos',
        interpretation: 'Pontuação fortemente indicativa de traços do espectro autista (≥ 32).',
        isPending: false,
      }
    if (score >= 26)
      return {
        label: 'Traços Moderados',
        interpretation: 'Traços autísticos presentes em faixa moderada.',
        isPending: false,
      }
    return {
      label: 'Padrão Neurotípico',
      interpretation: 'Escore compatível com padrão neurotípico (< 26).',
      isPending: false,
    }
  }

  // SCQ
  if (norm.includes('scq')) {
    if (score >= 15)
      return {
        label: 'Risco Clínico TEA',
        interpretation: 'Questionário de comunicação social positivo (corte ≥ 15).',
        isPending: false,
      }
    return {
      label: 'Abaixo do Ponto de Corte',
      interpretation: 'Comunicação social e reciprocidade sem risco clínico rastreado.',
      isPending: false,
    }
  }

  // Vanderbilt / VADRS
  if (norm.includes('vanderbilt') || norm.includes('vadrs')) {
    if (score >= 30)
      return {
        label: 'Sinais Comportamentais Indicativos',
        interpretation: 'Evidência de desatenção, hiperatividade ou oposição segundo VADRS.',
        isPending: false,
      }
    return {
      label: 'Comportamento Adequado',
      interpretation: 'Sem indicativos de distúrbios comportamentais ou atencionais proeminentes.',
      isPending: false,
    }
  }

  // Y-BOCS
  if (norm.includes('ybocs') || norm.includes('y-bocs')) {
    if (score >= 24)
      return {
        label: 'TOC Grave',
        interpretation: 'Sintomas obsessivo-compulsivos severos e incapacitantes.',
        isPending: false,
      }
    if (score >= 16)
      return {
        label: 'TOC Moderado',
        interpretation: 'Sintomatologia obsessiva-compulsiva de intensidade moderada.',
        isPending: false,
      }
    if (score >= 8)
      return {
        label: 'TOC Leve',
        interpretation: 'Sintomas leves a subclínicos.',
        isPending: false,
      }
    return {
      label: 'Subclínico',
      interpretation: 'Sem evidência de obsessões/compulsões significativas (< 8).',
      isPending: false,
    }
  }

  // SDS
  if (norm.includes('sds')) {
    if (score >= 8)
      return {
        label: 'Incapacidade Funcional Severa',
        interpretation: 'Prejuízo expressivo em trabalho, vida social ou familiar.',
        isPending: false,
      }
    if (score >= 5)
      return {
        label: 'Incapacidade Funcional Moderada',
        interpretation: 'Comprometimento funcional moderado nas atividades rotineiras.',
        isPending: false,
      }
    return {
      label: 'Impacto Leve/Mínimo',
      interpretation: 'Funcionamento adaptativo preservado.',
      isPending: false,
    }
  }

  // TMT (Trail Making Test)
  if (norm.includes('tmt')) {
    return {
      label: 'Tempo Cronometrado',
      interpretation:
        interp?.domainAnalysis?.cognicao?.descricao ||
        'Avaliação da velocidade psicomotora e alternância mental.',
      isPending: false,
    }
  }

  // Fluência Semântica
  if (norm.includes('fluencia') || norm.includes('semantica')) {
    if (score < 12)
      return {
        label: 'Fluência Semântica Rebaixada',
        interpretation: 'Evocação léxica semântica abaixo do corte clínico (< 12).',
        isPending: false,
      }
    if (score <= 14)
      return {
        label: 'Faixa Limítrofe',
        interpretation: 'Desempenho limítrofe em fluência verbal semântica (12–14).',
        isPending: false,
      }
    return {
      label: 'Fluência Preservada',
      interpretation: 'Busca e organização categorial dentro do esperado (≥ 15).',
      isPending: false,
    }
  }

  // Fallback com interpretação do próprio sistema ou genérica
  const suggestionFallback =
    interp?.suggestion ||
    rawInterpText ||
    'Instrumento concluído e registrado no prontuário do paciente.'
  return {
    label: score > 0 ? `Escore: ${score}` : 'Concluído',
    interpretation: suggestionFallback,
    isPending: false,
  }
}

/**
 * Constrói ScaleScores agregado com base nas avaliações do paciente.
 */
function aggregateScaleScores(
  evaluations: PatientEvaluationItem[],
  interpretations: Map<string, InterpretationResult>,
): ScaleScores {
  const scores: ScaleScores = {
    phq9: null,
    gad7: null,
    assq: null,
    snapIv: null,
    asrs18: null,
    wurs25: null,
    aq10: null,
    aq50: null,
    vanderbilt: null,
    scq: null,
    moca: null,
    meem: null,
    hamd: null,
    hama: null,
    bdi: null,
    bai: null,
    ybocs: null,
    sds: null,
    tmtA: null,
    tmtB: null,
    tmtDiff: null,
    fluenciaAnimais: null,
    fluenciaFrutas: null,
    fluenciaSemanticaTotal: null,
    ftdrs: null,
    fas: null,
  }

  for (const ev of evaluations) {
    const norm = (ev.scale_type || '').toLowerCase()
    const interp = ev.session_id ? interpretations.get(ev.session_id) : null

    // Copia do interp se houver
    if (interp) {
      if (interp.phq9Score && interp.phq9Score > 0) scores.phq9 = interp.phq9Score
      if (interp.gad7Score && interp.gad7Score > 0) scores.gad7 = interp.gad7Score
      if (interp.mocaScore !== null && interp.mocaScore !== undefined)
        scores.moca = interp.mocaScore
      if (interp.meemScore !== null && interp.meemScore !== undefined)
        scores.meem = interp.meemScore
      if (interp.hamdScore !== null && interp.hamdScore !== undefined)
        scores.hamd = interp.hamdScore
      if (interp.hamaScore !== null && interp.hamaScore !== undefined)
        scores.hama = interp.hamaScore
      if (interp.bdiScore !== null && interp.bdiScore !== undefined) scores.bdi = interp.bdiScore
      if (interp.baiScore !== null && interp.baiScore !== undefined) scores.bai = interp.baiScore
      if (interp.ybocsScore !== null && interp.ybocsScore !== undefined)
        scores.ybocs = interp.ybocsScore
      if (interp.sdsScore !== null && interp.sdsScore !== undefined) scores.sds = interp.sdsScore
      if (interp.assqScore !== null && interp.assqScore !== undefined)
        scores.assq = interp.assqScore
      if (interp.snapIvScore !== null && interp.snapIvScore !== undefined)
        scores.snapIv = interp.snapIvScore
      if (interp.asrs18Score !== null && interp.asrs18Score !== undefined)
        scores.asrs18 = interp.asrs18Score
      if (interp.wurs25Score !== null && interp.wurs25Score !== undefined)
        scores.wurs25 = interp.wurs25Score
      if (interp.ftdrs !== null && interp.ftdrs !== undefined) scores.ftdrs = interp.ftdrs
      if (interp.fas !== null && interp.fas !== undefined) scores.fas = interp.fas
      if (interp.tmtAScore !== null && interp.tmtAScore !== undefined)
        scores.tmtA = interp.tmtAScore
      if (interp.tmtBScore !== null && interp.tmtBScore !== undefined)
        scores.tmtB = interp.tmtBScore
      if (interp.tmtDiffScore !== null && interp.tmtDiffScore !== undefined)
        scores.tmtDiff = interp.tmtDiffScore
      if (interp.fluenciaAnimaisScore !== null && interp.fluenciaAnimaisScore !== undefined)
        scores.fluenciaAnimais = interp.fluenciaAnimaisScore
      if (interp.fluenciaFrutasScore !== null && interp.fluenciaFrutasScore !== undefined)
        scores.fluenciaFrutas = interp.fluenciaFrutasScore
    }

    // Copia de ev.score se ainda não preenchido
    if (ev.score !== null && ev.score !== undefined) {
      if (norm.includes('phq') && scores.phq9 === null) scores.phq9 = ev.score
      else if (norm.includes('gad') && scores.gad7 === null) scores.gad7 = ev.score
      else if (norm.includes('moca') && scores.moca === null) scores.moca = ev.score
      else if (norm.includes('meem') && scores.meem === null) scores.meem = ev.score
      else if (norm.includes('ham-d') && scores.hamd === null) scores.hamd = ev.score
      else if (norm.includes('ham-a') && scores.hama === null) scores.hama = ev.score
      else if (norm.includes('bdi') && scores.bdi === null) scores.bdi = ev.score
      else if (norm.includes('bai') && scores.bai === null) scores.bai = ev.score
      else if (norm.includes('ybocs') && scores.ybocs === null) scores.ybocs = ev.score
      else if (norm.includes('sds') && scores.sds === null) scores.sds = ev.score
      else if (norm.includes('snap') && scores.snapIv === null) scores.snapIv = ev.score
      else if (norm.includes('asrs') && scores.asrs18 === null) scores.asrs18 = ev.score
      else if (norm.includes('assq') && scores.assq === null) scores.assq = ev.score
      else if (norm.includes('wurs') && scores.wurs25 === null) scores.wurs25 = ev.score
      else if (norm.includes('ftdrs') && scores.ftdrs === null) scores.ftdrs = ev.score
      else if (norm.includes('fas') && scores.fas === null) scores.fas = ev.score
    }
  }

  return scores
}

/**
 * Função principal exportada: Gera e dispara o download do Laudo Consolidado por Paciente.
 */
export async function generateConsolidatedPatientPdf(
  input: ConsolidatedPdfInput | string,
): Promise<void> {
  let identification: PatientIdentification
  let evaluations: PatientEvaluationItem[]
  let fullHistory: PatientFullHistory | null = null

  if (typeof input === 'string') {
    // input é guestId
    const history = await getPatientFullHistory(input)
    if (!history) {
      throw new Error(
        'Não foi possível carregar o prontuário do paciente para emissão do laudo consolidado.',
      )
    }
    fullHistory = history
    identification = history.identification
    evaluations = history.evaluations
  } else {
    identification = input.identification
    evaluations = input.evaluations || []
    fullHistory = input.fullHistory || null
  }

  // Se não temos fullHistory carregado, tenta buscar caso tenhamos guest_id
  if (!fullHistory && identification.guest_id) {
    try {
      fullHistory = await getPatientFullHistory(identification.guest_id)
    } catch {
      /* non-fatal */
    }
  }

  // Carrega interpretações clínicas profundas das sessões com ID válido
  const interpretationMap = new Map<string, InterpretationResult>()
  const sessionIdsToFetch = Array.from(
    new Set(evaluations.map((e) => e.session_id).filter(Boolean)),
  )

  await Promise.all(
    sessionIdsToFetch.map(async (sessId) => {
      try {
        const interp = await getSessionInterpretation(sessId)
        if (interp) interpretationMap.set(sessId, interp)
      } catch (err) {
        console.warn(`[LaudoConsolidado] Falha ao carregar interpretação da sessão ${sessId}:`, err)
      }
    }),
  )

  // Escores agregados e screening clínico
  const aggregatedScores = aggregateScaleScores(evaluations, interpretationMap)
  const screening = generateScreening(aggregatedScores)
  const globalSeverity = computeGlobalSeverity(aggregatedScores)

  // Cálculos de métricas e períodos
  const totalScales = evaluations.length
  const completedScales = evaluations.filter((e) => e.status === 'completed').length
  const inProgressScales = evaluations.filter(
    (e) => e.status === 'in_progress' || e.status === 'in-progress' || e.status === 'pending',
  ).length
  const highRiskCount = evaluations.filter((e) => e.risk_level === 'high').length

  const sortedDates = evaluations
    .map((e) => e.started_at)
    .filter(Boolean)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  const firstDateStr =
    sortedDates.length > 0 ? new Date(sortedDates[0]).toLocaleDateString('pt-BR') : '—'
  const latestDateStr =
    sortedDates.length > 0
      ? new Date(sortedDates[sortedDates.length - 1]).toLocaleDateString('pt-BR')
      : '—'
  const periodEvaluated =
    sortedDates.length > 1
      ? `${firstDateStr} a ${latestDateStr}`
      : sortedDates.length === 1
        ? firstDateStr
        : 'Período não informado'

  // Nome e identificação segura do paciente
  const patientDisplayName =
    identification.full_name && identification.full_name.trim() !== ''
      ? identification.full_name.trim()
      : 'Paciente não identificado'

  const patientAgeStr =
    identification.age !== null && identification.age !== undefined
      ? `${identification.age} anos`
      : identification.birth_date
        ? (() => {
            const b = new Date(identification.birth_date)
            if (isNaN(b.getTime())) return 'Não informada'
            const today = new Date()
            let age = today.getFullYear() - b.getFullYear()
            const m = today.getMonth() - b.getMonth()
            if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--
            return age >= 0 ? `${age} anos` : 'Não informada'
          })()
        : 'Não informada'

  // Documento PDF via jsPDF
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 18
  let y = 18

  const c = CLINIC_BRANDING.colors
  const primary = hexToRgb(c.primary)
  const secondary = hexToRgb(c.secondary)
  const medium = hexToRgb(c.medium)
  const dark = hexToRgb(c.dark)
  const accent = hexToRgb(c.accent)

  // Função auxiliar de controle de quebra de página
  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 24) {
      doc.addPage()
      y = 18
    }
  }

  const writeSectionHeader = (index: number, text: string) => {
    ensureSpace(12)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(primary[0], primary[1], primary[2])
    doc.text(`${index}. ${sanitizePdfText(text).toUpperCase()}`, marginX, y)
    doc.setDrawColor(secondary[0], secondary[1], secondary[2])
    doc.setLineWidth(0.4)
    doc.line(marginX, y + 2, pageWidth - marginX, y + 2)
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(dark[0], dark[1], dark[2])
  }

  const writeParagraph = (text: string, gap = 3.5) => {
    const clean = sanitizePdfText(text)
    const lines = doc.splitTextToSize(clean, pageWidth - marginX * 2)
    ensureSpace(lines.length * 4.5 + 2)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(dark[0], dark[1], dark[2])
    doc.text(lines, marginX, y)
    y += lines.length * 4.5 + gap
  }

  const writeBullet = (text: string) => {
    const clean = sanitizePdfText(text)
    const indent = marginX + 4
    const lines = doc.splitTextToSize(clean, pageWidth - marginX * 2 - 6)
    ensureSpace(lines.length * 4.5 + 1.5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(dark[0], dark[1], dark[2])
    doc.text('-', marginX + 1, y)
    doc.text(lines, indent, y)
    y += lines.length * 4.5 + 1.5
  }

  const writeLabel = (label: string, value: string, valueIndent = 46) => {
    ensureSpace(6)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(primary[0], primary[1], primary[2])
    doc.text(sanitizePdfText(label), marginX, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(dark[0], dark[1], dark[2])
    const maxValW = pageWidth - marginX * 2 - valueIndent
    const valLines = doc.splitTextToSize(sanitizePdfText(value), maxValW)
    doc.text(valLines, marginX + valueIndent, y)
    y += Math.max(5.5, valLines.length * 4.2 + 1.5)
  }

  const writeVisualSeparator = (label: string) => {
    ensureSpace(10)
    doc.setFillColor(accent[0], accent[1], accent[2])
    doc.setDrawColor(secondary[0], secondary[1], secondary[2])
    doc.roundedRect(marginX, y, pageWidth - marginX * 2, 7, 1, 1, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(primary[0], primary[1], primary[2])
    doc.text(sanitizePdfText(label).toUpperCase(), marginX + 3, y + 4.8)
    y += 10
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(dark[0], dark[1], dark[2])
  }

  // ================= CABEÇALHO INSTITUCIONAL CASA BRANCA SAÚDE =================
  try {
    const logoData = await fetchImageAsPngData(CLINIC_BRANDING.logoUrl)
    if (logoData) {
      doc.addImage(logoData.dataUrl, logoData.format, marginX, y, 24, 16)
    }
  } catch {
    /* fallback se logo falhar */
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(primary[0], primary[1], primary[2])
  doc.text(sanitizePdfText(CLINIC_BRANDING.name), marginX + 28, y + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(medium[0], medium[1], medium[2])
  doc.text(
    sanitizePdfText('Laudo Consolidado de Avaliação Neuropsiquiátrica e Neurodesenvolvimento'),
    marginX + 28,
    y + 11,
  )
  doc.setFontSize(7.5)
  doc.text(
    sanitizePdfText('Consolidação Multimodal Longitudinal de Instrumentos Clínicos Padronizados'),
    marginX + 28,
    y + 15,
  )

  doc.setDrawColor(secondary[0], secondary[1], secondary[2])
  doc.setLineWidth(0.6)
  doc.line(marginX, y + 18, pageWidth - marginX, y + 18)
  y += 24

  // Disclaimer obrigatório no topo
  ensureSpace(14)
  doc.setFillColor(accent[0], accent[1], accent[2])
  doc.setDrawColor(secondary[0], secondary[1], secondary[2])
  doc.roundedRect(marginX, y, pageWidth - marginX * 2, 12, 1.5, 1.5, 'FD')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(primary[0], primary[1], primary[2])
  const introLines = doc.splitTextToSize(
    sanitizePdfText(NEUROPSYCH_DISCLAIMER),
    pageWidth - marginX * 2 - 6,
  )
  doc.text(introLines.slice(0, 3), marginX + 3, y + 4.2)
  y += 16

  // ================= SEÇÃO 1: IDENTIFICAÇÃO DO PACIENTE =================
  writeVisualSeparator('1. IDENTIFICAÇÃO DO PACIENTE E DADOS CLÍNICOS')
  writeLabel('Nome do Paciente:', patientDisplayName, 46)
  writeLabel('Idade Cronológica:', patientAgeStr, 46)
  if (identification.birth_date) {
    writeLabel(
      'Data de Nascimento:',
      new Date(identification.birth_date).toLocaleDateString('pt-BR'),
      46,
    )
  }
  if (identification.document) {
    writeLabel('Documento / Prontuário:', identification.document, 46)
  }
  writeLabel('Período Avaliado:', periodEvaluated, 46)
  writeLabel(
    'Profissional Responsável:',
    `${CLINICIAN_CREDENTIALS.name} — ${CLINICIAN_CREDENTIALS.crm} / ${CLINICIAN_CREDENTIALS.rqe}`,
    46,
  )
  writeLabel('Instituição:', `${CLINIC_BRANDING.name} — ${CLINIC_BRANDING.tagline}`, 46)
  y += 2

  // ================= SEÇÃO 2: PANORAMA GERAL DE RISCO =================
  writeVisualSeparator('2. PANORAMA DE RISCO E ESTRATIFICAÇÃO CLÍNICA')

  const sevLabel =
    globalSeverity === 'high'
      ? 'SEVERIDADE GLOBAL ALTA'
      : globalSeverity === 'moderate'
        ? 'SEVERIDADE GLOBAL MODERADA'
        : 'SEVERIDADE GLOBAL BAIXA / MONITORAMENTO'

  const sevBg =
    globalSeverity === 'high'
      ? [254, 226, 226]
      : globalSeverity === 'moderate'
        ? [254, 243, 199]
        : [236, 253, 245]
  const sevBorder =
    globalSeverity === 'high'
      ? [220, 38, 38]
      : globalSeverity === 'moderate'
        ? [217, 119, 6]
        : [16, 185, 129]
  const sevText =
    globalSeverity === 'high'
      ? [185, 28, 28]
      : globalSeverity === 'moderate'
        ? [180, 83, 9]
        : [4, 120, 87]

  ensureSpace(16)
  doc.setFillColor(sevBg[0], sevBg[1], sevBg[2])
  doc.setDrawColor(sevBorder[0], sevBorder[1], sevBorder[2])
  doc.roundedRect(marginX, y, pageWidth - marginX * 2, 11, 1.5, 1.5, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(sevText[0], sevText[1], sevText[2])
  doc.text(
    sanitizePdfText(
      `${sevLabel} | Total de Instrumentos: ${totalScales} (${completedScales} concluídos, ${inProgressScales} em andamento, ${highRiskCount} risco elevado)`,
    ),
    marginX + 4,
    y + 6.8,
  )
  y += 14

  // Alerta EMT e contraindicações quando houver severidade alta ou risco elevado
  if (globalSeverity === 'high' || highRiskCount > 0) {
    ensureSpace(18)
    doc.setFillColor(254, 242, 242)
    doc.setDrawColor(239, 68, 68)
    doc.roundedRect(marginX, y, pageWidth - marginX * 2, 14, 1.5, 1.5, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(185, 28, 28)
    doc.text(
      'ALERTA CLÍNICO & SEGURANÇA EMT (Estimulação Magnética Transcraniana):',
      marginX + 3,
      y + 4.8,
    )
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const emtLines = doc.splitTextToSize(
      sanitizePdfText(
        'Paciente com escores na faixa clínica de gravidade elevada. Recomenda-se triagem presencial detalhada para EMT, verificação de comorbidades epileptogênicas, avaliação de risco psíquico iminente e validação do plano terapêutico pela médica assistente antes do início do protocolo.',
      ),
      pageWidth - marginX * 2 - 6,
    )
    doc.text(emtLines, marginX + 3, y + 9)
    y += 17
  }

  // Comorbidades detectadas
  if (screening.comorbidities.length > 0) {
    writeParagraph(`Comorbidades Clínicas Rastreadas: ${screening.comorbidities.join(' | ')}`)
  } else {
    writeParagraph(
      'Nenhuma sobreposição de comorbidades atípica detectada no cruzamento inicial dos instrumentos.',
    )
  }
  y += 1

  // ================= SEÇÃO 3: TABELA CONSOLIDADA DOS TESTES =================
  writeVisualSeparator('3. CONSOLIDAÇÃO MULTIMODAL DE INSTRUMENTOS APLICADOS')

  // Colunas da Tabela Consolidada: Instrumento | Data | Escore | Classificação/Gravidade | Interpretação
  const colX = [
    marginX,
    marginX + 38,
    marginX + 62,
    marginX + 82,
    marginX + 124,
    pageWidth - marginX,
  ]

  const drawConsolidatedRow = (cells: string[], isHeader = false, isPending = false) => {
    const colMaxWs = [
      colX[1] - colX[0] - 2,
      colX[2] - colX[1] - 2,
      colX[3] - colX[2] - 2,
      colX[4] - colX[3] - 2,
      colX[5] - colX[4] - 2,
    ]

    const renderedCells = cells.map((cell, idx) => {
      const clean = sanitizePdfText(cell)
      return doc.splitTextToSize(clean, colMaxWs[idx])
    })

    const maxLineCount = isHeader ? 1 : Math.max(1, ...renderedCells.map((lines) => lines.length))
    const rowHeight = isHeader ? 7 : Math.max(7, maxLineCount * 4 + 2.5)

    ensureSpace(rowHeight + 1)

    if (isHeader) {
      doc.setFillColor(accent[0], accent[1], accent[2])
      doc.rect(marginX, y, pageWidth - marginX * 2, rowHeight, 'FD')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(primary[0], primary[1], primary[2])
    } else {
      if (isPending) {
        doc.setFillColor(250, 250, 250)
        doc.rect(marginX, y, pageWidth - marginX * 2, rowHeight, 'F')
      }
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(dark[0], dark[1], dark[2])
    }

    renderedCells.forEach((lines, idx) => {
      if (isHeader) {
        doc.text(lines[0] || '', colX[idx] + 1.5, y + 4.6)
      } else {
        doc.text(lines, colX[idx] + 1.5, y + 4)
      }
    })

    doc.setDrawColor(secondary[0], secondary[1], secondary[2])
    doc.setLineWidth(isHeader ? 0.35 : 0.1)
    doc.line(marginX, y + rowHeight, pageWidth - marginX, y + rowHeight)
    y += rowHeight
  }

  drawConsolidatedRow(
    [
      'Instrumento',
      'Data Aplicação',
      'Escore',
      'Classificação / Gravidade',
      'Interpretação Clínica',
    ],
    true,
  )

  if (evaluations.length === 0) {
    drawConsolidatedRow(
      [
        'Nenhum teste',
        '—',
        '—',
        'Sem registros',
        'Nenhum instrumento registrado para este paciente até o momento.',
      ],
      false,
    )
  } else {
    for (const ev of evaluations) {
      const interp = ev.session_id ? interpretationMap.get(ev.session_id) : null
      const dateStr = ev.started_at ? new Date(ev.started_at).toLocaleDateString('pt-BR') : '—'

      // Não exibir "0.00" falso se o escore for nulo/ausente
      let scoreDisplay = '—'
      if (ev.score !== null && ev.score !== undefined && !isNaN(ev.score)) {
        scoreDisplay = `${ev.score}`
      }

      const classified = classifyScaleScore(
        ev.scale_type,
        ev.score,
        interp,
        ev.interpretation || ev.system_suggestion,
      )

      drawConsolidatedRow(
        [
          ev.scale_type || 'Escala',
          dateStr,
          scoreDisplay,
          classified.label,
          classified.interpretation,
        ],
        false,
        classified.isPending,
      )
    }
  }
  y += 4

  // ================= SEÇÃO 4: SÍNTESE POR DOMÍNIOS NEUROPSIQUIÁTRICOS =================
  writeVisualSeparator('4. SÍNTESE CLÍNICA POR DOMÍNIOS (DSM-5-TR / CID-11)')

  // 4.1 Humor e Afeto
  ensureSpace(12)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(primary[0], primary[1], primary[2])
  doc.text('A. Domínio de Humor e Afeto (PHQ-9, HAM-D, BDI-II):', marginX, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(dark[0], dark[1], dark[2])

  const humorParts: string[] = []
  if (aggregatedScores.phq9 !== null) {
    const s = aggregatedScores.phq9
    humorParts.push(
      `PHQ-9: ${s} pontos (${s >= 15 ? 'faixa grave/moderadamente grave' : s >= 10 ? 'faixa moderada' : s >= 5 ? 'faixa leve' : 'faixa mínima'})`,
    )
  }
  if (aggregatedScores.hamd !== null) {
    humorParts.push(`HAM-D: ${aggregatedScores.hamd} pontos`)
  }
  if (aggregatedScores.bdi !== null && aggregatedScores.bdi !== undefined) {
    humorParts.push(`BDI-II: ${aggregatedScores.bdi} pontos`)
  }
  if (humorParts.length > 0) {
    writeParagraph(
      `${humorParts.join(' | ')}. Monitoramento sistemático do afeto, anedonia, energia e vitalidade geral.`,
    )
  } else {
    writeParagraph(
      'Sem escalas específicas de humor preenchidas no período consolidado. Avaliação dependente de impressão clínica.',
    )
  }
  y += 2

  // 4.2 Ansiedade e Estresse
  ensureSpace(12)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(primary[0], primary[1], primary[2])
  doc.text('B. Domínio de Ansiedade e Reatividade Autonômica (GAD-7, HAM-A, BAI):', marginX, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(dark[0], dark[1], dark[2])

  const ansParts: string[] = []
  if (aggregatedScores.gad7 !== null) {
    const s = aggregatedScores.gad7
    ansParts.push(
      `GAD-7: ${s} pontos (${s >= 15 ? 'ansiedade severa' : s >= 10 ? 'ansiedade moderada' : s >= 5 ? 'ansiedade leve' : 'mínima'})`,
    )
  }
  if (aggregatedScores.hama !== null) {
    ansParts.push(`HAM-A: ${aggregatedScores.hama} pontos`)
  }
  if (aggregatedScores.bai !== null && aggregatedScores.bai !== undefined) {
    ansParts.push(`BAI: ${aggregatedScores.bai} pontos`)
  }
  if (ansParts.length > 0) {
    writeParagraph(
      `${ansParts.join(' | ')}. Avaliação de tensão motora, hipervigilância, manifestações autonômicas e ruminações.`,
    )
  } else {
    writeParagraph('Sem escalas quantitativas de ansiedade aplicadas no período consolidado.')
  }
  y += 2

  // 4.3 Cognição e Funções Executivas
  ensureSpace(12)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(primary[0], primary[1], primary[2])
  doc.text(
    'C. Domínio Cognitivo e Funções Executivas (MoCA, MEEM, TMT, Fluências, FTDRS):',
    marginX,
    y,
  )
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(dark[0], dark[1], dark[2])

  const cogParts: string[] = []
  if (aggregatedScores.moca !== null)
    cogParts.push(`MoCA: ${aggregatedScores.moca}/30 (corte < 24)`)
  if (aggregatedScores.meem !== null)
    cogParts.push(`MEEM: ${aggregatedScores.meem}/30 (corte < 24)`)
  if (aggregatedScores.ftdrs !== null && aggregatedScores.ftdrs !== undefined)
    cogParts.push(`FTDRS: ${aggregatedScores.ftdrs}/45`)
  if (aggregatedScores.fas !== null && aggregatedScores.fas !== undefined)
    cogParts.push(`FAS Fonêmico: ${aggregatedScores.fas} palavras (corte < 15)`)
  if (aggregatedScores.fluenciaAnimais !== null && aggregatedScores.fluenciaAnimais !== undefined)
    cogParts.push(`Fluência Animais: ${aggregatedScores.fluenciaAnimais} (corte < 12)`)
  if (aggregatedScores.tmtA !== null && aggregatedScores.tmtA !== undefined)
    cogParts.push(`TMT A: ${aggregatedScores.tmtA}s`)
  if (aggregatedScores.tmtB !== null && aggregatedScores.tmtB !== undefined)
    cogParts.push(`TMT B: ${aggregatedScores.tmtB}s`)

  if (cogParts.length > 0) {
    writeParagraph(
      `${cogParts.join(' | ')}. Análise dos circuitos fronto-estriatais, flexibilidade mental, velocidade de processamento e reserva mnêmica.`,
    )
  } else {
    writeParagraph('Rastreio cognitivo padronizado pendente de aplicação para este paciente.')
  }
  y += 2

  // 4.4 Neurodesenvolvimento e Comportamento
  ensureSpace(12)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(primary[0], primary[1], primary[2])
  doc.text(
    'D. Domínio do Neurodesenvolvimento e Comportamento (SNAP-IV, ASRS-18, WURS-25, ASSQ, AQ, Y-BOCS):',
    marginX,
    y,
  )
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(dark[0], dark[1], dark[2])

  const ndParts: string[] = []
  if (aggregatedScores.snapIv !== null)
    ndParts.push(`SNAP-IV: média ${aggregatedScores.snapIv.toFixed(2)} (corte ≥ 1.5)`)
  if (aggregatedScores.asrs18 !== null)
    ndParts.push(`ASRS-18: ${aggregatedScores.asrs18} (corte ≥ 36)`)
  if (aggregatedScores.wurs25 !== null && aggregatedScores.wurs25 !== undefined)
    ndParts.push(`WURS-25 Retrospectivo: ${aggregatedScores.wurs25}/100 (corte ≥ 46)`)
  if (aggregatedScores.assq !== null) ndParts.push(`ASSQ: ${aggregatedScores.assq} (corte ≥ 15)`)
  if (aggregatedScores.aq10 !== null && aggregatedScores.aq10 !== undefined)
    ndParts.push(`AQ-10: ${aggregatedScores.aq10}/10 (corte ≥ 6)`)
  if (aggregatedScores.ybocs !== null)
    ndParts.push(`Y-BOCS: ${aggregatedScores.ybocs}/40 (corte ≥ 8)`)
  if (aggregatedScores.sds !== null)
    ndParts.push(`SDS Funcional: ${aggregatedScores.sds}/30 (corte ≥ 5)`)

  if (ndParts.length > 0) {
    writeParagraph(
      `${ndParts.join(' | ')}. Rastreio longitudinal de traços de espectro atencional, executivo, social e obsessivo-compulsivo.`,
    )
  } else {
    writeParagraph(
      'Sem escalas padronizadas de neurodesenvolvimento registradas no prontuário até o presente momento.',
    )
  }
  y += 3

  // ================= SEÇÃO 5: ENCAMINHAMENTOS E CONDUTA SUGERIDA =================
  writeVisualSeparator('5. CONDUTA SUGERIDA, ENCAMINHAMENTOS E RESSALVA CLÍNICA')

  writeBullet(
    'Validação presencial obrigatória: Este laudo sintetiza dados quantitativos de escalas e biofeedback para suporte à decisão médica, não constituindo diagnóstico fechado isoladamente.',
  )
  writeBullet(
    'Monitoramento longitudinal: Recomenda-se reaplicação periódica dos instrumentos de humor e cognição (intervalo de 60 a 90 dias) para aferição de curva de resposta terapêutica.',
  )

  if (globalSeverity === 'high' || highRiskCount > 0) {
    writeBullet(
      'Priorização clínica: Avaliar intervenção farmacológica adjuvante, psicoterapia estruturada e rastreio de refratariedade para protocolos de EMT.',
    )
  } else {
    writeBullet(
      'Manutenção e promoção de bem-estar: Manter acompanhamento clínico de rotina e fortalecimento de hábitos de neuroproteção (sono, atividade física e manejo do estresse).',
    )
  }
  y += 4

  // ================= SEÇÃO 6: ASSINATURA DA MÉDICA COM QR CODE =================
  ensureSpace(42)
  y += 4

  const patientToken = identification.guest_id || 'validacao-geral'
  const [qrPng, sigImg] = await Promise.all([
    fetchQrCodePng(patientToken),
    fetchImageAsPngData(CLINICIAN_CREDENTIALS.signatureUrl),
  ])

  const sigBlockX = marginX + 38

  if (qrPng) {
    try {
      doc.addImage(qrPng, 'PNG', marginX, y, 26, 26)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(medium[0], medium[1], medium[2])
      doc.text(
        doc.splitTextToSize('Escaneie para validar autenticidade deste laudo consolidado', 26),
        marginX,
        y + 29,
      )
    } catch {
      /* fallback se qr falhar */
    }
  }

  // Linha da assinatura
  doc.setDrawColor(medium[0], medium[1], medium[2])
  doc.setLineWidth(0.3)
  doc.line(sigBlockX, y + 17, sigBlockX + 100, y + 17)

  // Imagem da assinatura
  if (sigImg) {
    try {
      const sigW = 46
      const sigH = 13
      const sigX = sigBlockX + (100 - sigW) / 2
      doc.addImage(sigImg.dataUrl, sigImg.format, sigX, y + 17 - sigH, sigW, sigH)
    } catch {
      /* fallback se assinatura imagem falhar */
    }
  }

  // Identificação da Médica
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(dark[0], dark[1], dark[2])
  doc.text(sanitizePdfText(CLINICIAN_CREDENTIALS.name), sigBlockX, y + 22)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(medium[0], medium[1], medium[2])
  doc.text(
    sanitizePdfText(`${CLINICIAN_CREDENTIALS.crm} / ${CLINICIAN_CREDENTIALS.rqe} — Psiquiatria`),
    sigBlockX,
    y + 26.5,
  )

  const sigNow = new Date()
  const sigDate = sigNow.toLocaleDateString('pt-BR')
  const sigTime = sigNow.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  doc.setFontSize(8)
  doc.text(sanitizePdfText(`Assinado digitalmente em ${sigDate} às ${sigTime}`), sigBlockX, y + 31)

  // ================= RODAPÉ INSTITUCIONAL LGPD =================
  const footerY = pageHeight - 11
  doc.setDrawColor(primary[0], primary[1], primary[2])
  doc.setLineWidth(0.4)
  doc.line(marginX, footerY, pageWidth - marginX, footerY)

  doc.setFontSize(6.8)
  doc.setTextColor(medium[0], medium[1], medium[2])
  doc.text(
    sanitizePdfText(
      `${CLINIC_BRANDING.name} — ${CLINIC_BRANDING.address} | Contato: ${CLINIC_BRANDING.whatsapp}`,
    ),
    marginX,
    footerY + 3.8,
  )
  doc.text(
    sanitizePdfText(
      `Laudo Consolidado gerado em ${sigDate} às ${sigTime} · Prontuário em estrita conformidade com a LGPD (Lei nº 13.709/2018).`,
    ),
    marginX,
    footerY + 7.2,
  )

  // Disparo do download do arquivo
  const safePatientName = patientDisplayName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .slice(0, 30)

  doc.save(`laudo-consolidado-${safePatientName}.pdf`)
}
