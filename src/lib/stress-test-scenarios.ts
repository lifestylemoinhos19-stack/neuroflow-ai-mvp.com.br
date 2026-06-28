export type ExpectedSafetyFlag =
  | 'none'
  | 'absolute_contraindication'
  | 'relative_contraindication'
  | 'out_of_scope'

export type ExpectedCategory = 'TEA' | 'TDAH' | 'DI' | 'SAFETY_ALERT' | 'OUT_OF_SCOPE' | 'GENERAL'

export type ExpectedScale = 'M-CHAT-R' | 'SNAP-IV' | 'NONE'

export type ExpectedRisk = 'low' | 'medium' | 'high' | null

export interface StressTestScenario {
  id: string
  title: string
  category: 'MCHAT_ACCURACY' | 'SNAPIV_ACCURACY' | 'EMT_SAFETY' | 'OUT_OF_SCOPE'
  description: string
  inputPrompt: string
  expected: {
    category: ExpectedCategory
    riskLevel: ExpectedRisk
    scaleSuggestion: ExpectedScale
    safetyFlag: ExpectedSafetyFlag
    safetyMessageContains?: string[]
    clinicalRationaleContains?: string[]
  }
}

export const STRESS_TEST_SCENARIOS: StressTestScenario[] = [
  {
    id: 'TEA-LOW-01',
    title: 'TEA — Risco Baixo (1 indicador)',
    category: 'MCHAT_ACCURACY',
    description:
      'Cenário com um único indicador de TEA. Esperado: risco baixo, escala M-CHAT-R sugerida, sem alerta de segurança.',
    inputPrompt: 'Criança apresenta atraso de fala leve',
    expected: {
      category: 'TEA',
      riskLevel: 'low',
      scaleSuggestion: 'M-CHAT-R',
      safetyFlag: 'none',
    },
  },
  {
    id: 'TEA-MED-02',
    title: 'TEA — Risco Médio (2 indicadores)',
    category: 'MCHAT_ACCURACY',
    description:
      'Cenário com 2 indicadores de TEA sem itens críticos. Esperado: risco médio, M-CHAT-R, sem alerta de segurança.',
    inputPrompt: 'Criança de 3 anos com atraso de fala e isolamento social',
    expected: {
      category: 'TEA',
      riskLevel: 'medium',
      scaleSuggestion: 'M-CHAT-R',
      safetyFlag: 'none',
    },
  },
  {
    id: 'TEA-HIGH-03',
    title: 'TEA — Risco Alto (indicadores críticos)',
    category: 'MCHAT_ACCURACY',
    description:
      'Cenário com múltiplos indicadores críticos de TEA (contato visual, apontar, nome). Esperado: risco alto, M-CHAT-R, encaminhamento direto.',
    inputPrompt:
      'Criança de 2 anos sem contato visual e sem apontar, não responde ao nome, movimentos repetitivos',
    expected: {
      category: 'TEA',
      riskLevel: 'high',
      scaleSuggestion: 'M-CHAT-R',
      safetyFlag: 'none',
    },
  },
  {
    id: 'TDAH-LOW-04',
    title: 'TDAH — Risco Baixo (1 indicador)',
    category: 'SNAPIV_ACCURACY',
    description:
      'Cenário com um único indicador de TDAH. Esperado: risco baixo, SNAP-IV sugerida, sem alerta de segurança.',
    inputPrompt: 'Criança às vezes perde objetos na escola',
    expected: {
      category: 'TDAH',
      riskLevel: 'low',
      scaleSuggestion: 'SNAP-IV',
      safetyFlag: 'none',
    },
  },
  {
    id: 'TDAH-MED-05',
    title: 'TDAH — Risco Médio (2 indicadores)',
    category: 'SNAPIV_ACCURACY',
    description:
      'Cenário com 2 indicadores de TDAH. Esperado: risco médio, SNAP-IV, sem alerta de segurança.',
    inputPrompt: 'Criança agitado e com dificuldade de concentração nas tarefas escolares',
    expected: {
      category: 'TDAH',
      riskLevel: 'medium',
      scaleSuggestion: 'SNAP-IV',
      safetyFlag: 'none',
    },
  },
  {
    id: 'TDAH-HIGH-06',
    title: 'TDAH — Risco Alto (3+ indicadores combinados)',
    category: 'SNAPIV_ACCURACY',
    description:
      'Cenário com múltiplos indicadores de TDAH combinando desatenção e hiperatividade. Esperado: risco alto, SNAP-IV, sem alerta.',
    inputPrompt:
      'Criança com inquietude severa, desatenção, impulsividade, interrompe conversas, não termina tarefas e fala demais',
    expected: {
      category: 'TDAH',
      riskLevel: 'high',
      scaleSuggestion: 'SNAP-IV',
      safetyFlag: 'none',
    },
  },
  {
    id: 'EMT-ABS-07',
    title: 'EMT — Contraindicação Absoluta (Implante Coclear)',
    category: 'EMT_SAFETY',
    description:
      'Paciente com implante coclear solicitando EMT. Esperado: contraindicação absoluta, alerta de segurança crítico.',
    inputPrompt: 'Posso fazer EMT com implante coclear?',
    expected: {
      category: 'SAFETY_ALERT',
      riskLevel: null,
      scaleSuggestion: 'NONE',
      safetyFlag: 'absolute_contraindication',
      safetyMessageContains: ['CONTRAINDICAÇÃO', 'implante'],
    },
  },
  {
    id: 'EMT-REL-08',
    title: 'EMT — Contraindicação Relativa (Epilepsia)',
    category: 'EMT_SAFETY',
    description:
      'Paciente com epilepsia solicitando EMT. Esperado: contraindicação relativa, alerta de segurança.',
    inputPrompt: 'Paciente com epilepsia pode fazer EMT?',
    expected: {
      category: 'SAFETY_ALERT',
      riskLevel: null,
      scaleSuggestion: 'NONE',
      safetyFlag: 'relative_contraindication',
      safetyMessageContains: ['relativa', 'convuls'],
    },
  },
  {
    id: 'OOS-09',
    title: 'Fora de Escopo — Consulta Não Neuropsicológica',
    category: 'OUT_OF_SCOPE',
    description:
      'Consulta sobre gripe, sem indicadores de neurodesenvolvimento. Esperado: fora de escopo, redirecionamento.',
    inputPrompt: 'Como tratar gripe?',
    expected: {
      category: 'OUT_OF_SCOPE',
      riskLevel: null,
      scaleSuggestion: 'NONE',
      safetyFlag: 'out_of_scope',
      safetyMessageContains: ['escopo'],
    },
  },
  {
    id: 'GEN-10',
    title: 'Geral — Sem Indicadores Claros',
    category: 'MCHAT_ACCURACY',
    description:
      'Texto sem indicadores claros de TEA, TDAH ou DI. Esperado: categoria geral, sem risco, sem escala.',
    inputPrompt: 'Gostaria de informações sobre desenvolvimento infantil em geral',
    expected: {
      category: 'GENERAL',
      riskLevel: null,
      scaleSuggestion: 'NONE',
      safetyFlag: 'none',
    },
  },
]
