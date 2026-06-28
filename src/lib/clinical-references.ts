export interface ClinicalReference {
  source: string
  section: string
  code: string
  title: string
  content: string
  category: string
  keywords: string[]
  metadata: Record<string, unknown>
}

export interface ClinicalCitation {
  source: string
  code: string
  title: string
  section: string
}

export const CLINICAL_CATEGORIES = {
  TEA: 'Transtorno do Espectro Autista',
  TDAH: 'Transtorno de Déficit de Atenção e Hiperatividade',
  DI: 'Transtornos do Desenvolvimento Intelectual',
  SAFETY: 'Protocolos de Segurança',
  TELEMEDICINE: 'Telemedicina e Conformidade',
} as const

export function getCitation(ref: ClinicalReference): ClinicalCitation {
  return {
    source: ref.source,
    code: ref.code,
    title: ref.title,
    section: ref.section,
  }
}

export function formatCitation(citation: ClinicalCitation): string {
  return `${citation.source} - ${citation.code} (${citation.section})`
}

export const MCHAT_RF_FLOWCHART = {
  lowRisk: {
    scoreRange: '0-2',
    label: 'Baixo Risco',
    action:
      'Nenhuma ação imediata necessária. Continuar monitoramento de rotina do desenvolvimento.',
    nextStep: 'Monitoramento regular nas consultas de puericultura.',
    citations: [{ source: 'M-CHAT-R/F', code: 'M-CHAT-R', section: 'Protocolo de Triagem' }],
  },
  mediumRisk: {
    scoreRange: '3-7',
    label: 'Risco Médio',
    action: 'Aplicar M-CHAT-R/F (Follow-up Interview) para confirmação.',
    nextStep: 'Agendar entrevista de seguimento estruturada com os responsáveis.',
    citations: [
      { source: 'M-CHAT-R/F', code: 'M-CHAT-R/F', section: 'Protocolo de Seguimento' },
      { source: 'M-CHAT-R/F', code: 'FLOWCHART', section: 'Fluxograma de Seguimento' },
    ],
  },
  highRisk: {
    scoreRange: '8-20',
    label: 'Alto Risco',
    action:
      'Encaminhar diretamente para avaliação diagnóstica com neuropediatra ou psiquiatra infantil.',
    nextStep: 'Não é necessário aplicar M-CHAT-R/F. Encaminhamento imediato para diagnóstico.',
    citations: [
      { source: 'M-CHAT-R/F', code: 'FLOWCHART', section: 'Fluxograma de Seguimento' },
      { source: 'DSM-5-TR', code: 'F84.0', section: 'Critérios Diagnósticos' },
    ],
  },
  followUpLowRisk: {
    scoreRange: '0-2',
    label: 'Sem Risco Após Follow-up',
    action:
      'Após M-CHAT-R/F com pontuação 0-2, não há indicação de risco. Continuar monitoramento de rotina.',
    nextStep: 'Reaplicar M-CHAT-R nas consultas de rotina conforme protocolo.',
    citations: [{ source: 'M-CHAT-R/F', code: 'M-CHAT-R/F', section: 'Protocolo de Seguimento' }],
  },
  followUpPositiveRisk: {
    scoreRange: '3+',
    label: 'Risco Confirmado Após Follow-up',
    action: 'Após M-CHAT-R/F com pontuação 3+, encaminhar para avaliação diagnóstica completa.',
    nextStep:
      'Encaminhamento para neuropediatra/psiquiatra infantil para diagnóstico conforme DSM-5-TR e CID-11.',
    citations: [
      { source: 'M-CHAT-R/F', code: 'FLOWCHART', section: 'Fluxograma de Seguimento' },
      { source: 'CID-11', code: '6A02', section: 'Neurodesenvolvimento' },
      { source: 'DSM-5-TR', code: 'F84.0', section: 'Critérios Diagnósticos' },
    ],
  },
} as const

export const SNAP_IV_INTERPRETATION = {
  lowRisk: {
    avgRange: '< 1.5',
    label: 'Baixo Risco',
    action: 'Nenhum indicador significativo de TDAH nesta subescala. Monitoramento contínuo.',
    citations: [{ source: 'SNAP-IV', code: 'SNAP-IV-INTERP', section: 'Interpretação' }],
  },
  mediumRisk: {
    avgRange: '1.5 - 2.0',
    label: 'Risco Moderado',
    action:
      'Indicadores sugestivos de TDAH. Recomenda-se reavaliação e monitoramento comportamental.',
    citations: [{ source: 'SNAP-IV', code: 'SNAP-IV-INTERP', section: 'Interpretação' }],
  },
  highRisk: {
    avgRange: '> 2.0',
    label: 'Alto Risco',
    action:
      'Indicadores significativos de TDAH. Encaminhar para avaliação diagnóstica com neuropediatra ou psicólogo especializado.',
    citations: [
      { source: 'SNAP-IV', code: 'SNAP-IV-INTERP', section: 'Interpretação' },
      { source: 'DSM-5-TR', code: 'F90.0', section: 'Critérios Diagnósticos' },
      { source: 'CID-11', code: '6A05', section: 'Neurodesenvolvimento' },
    ],
  },
} as const

export const TELEMEDICINE_DISCLAIMER = {
  text: 'Esta triagem remota é realizada conforme a Resolução CFM nº 2.314/2022. A telemedicina é uma ferramenta de apoio e NÃO substitui a avaliação presencial para diagnóstico definitivo de transtornos do neurodesenvolvimento. Resultados de risco devem ser confirmados em consulta presencial multidisciplinar.',
  citations: [
    { source: 'CFM-2314-2022', code: 'CFM-ART-4', section: 'Telemedicina' },
    { source: 'CFM-2314-2022', code: 'CFM-ART-1', section: 'Telemedicina' },
  ],
} as const

export function getMChatFlowchartResult(score: number): {
  level: keyof typeof MCHAT_RF_FLOWCHART
  flowchart: (typeof MCHAT_RF_FLOWCHART)[keyof typeof MCHAT_RF_FLOWCHART]
} {
  if (score >= 8) {
    return { level: 'highRisk', flowchart: MCHAT_RF_FLOWCHART.highRisk }
  }
  if (score >= 3) {
    return { level: 'mediumRisk', flowchart: MCHAT_RF_FLOWCHART.mediumRisk }
  }
  return { level: 'lowRisk', flowchart: MCHAT_RF_FLOWCHART.lowRisk }
}

export function getSnapivInterpretation(avg: number): {
  level: keyof typeof SNAP_IV_INTERPRETATION
  interpretation: (typeof SNAP_IV_INTERPRETATION)[keyof typeof SNAP_IV_INTERPRETATION]
} {
  if (avg > 2.0) {
    return { level: 'highRisk', interpretation: SNAP_IV_INTERPRETATION.highRisk }
  }
  if (avg >= 1.5) {
    return { level: 'mediumRisk', interpretation: SNAP_IV_INTERPRETATION.mediumRisk }
  }
  return { level: 'lowRisk', interpretation: SNAP_IV_INTERPRETATION.lowRisk }
}
