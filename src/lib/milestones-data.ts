/**
 * Marcos do Desenvolvimento Infantil (0-6 anos).
 *
 * Baseado nos marcos do CDC (Centers for Disease Control and Prevention),
 * organizados por faixa etária e domínio (motor, linguagem, social, cognitivo).
 *
 * Respostas: "Atingiu" (2), "Atingiu com atraso" (1), "Não atingiu" (0),
 * "Não sei" (sem pontuação). A interpretação considera a porcentagem de
 * marcos atingidos por domínio e por faixa etária, com sinalização de atraso
 * quando abaixo de 70%.
 */

export type MilestoneDomain = 'motor' | 'linguagem' | 'social' | 'cognitivo'

export interface MilestoneItem {
  key: string
  ageRangeId: string
  domain: MilestoneDomain
  text: string
}

export interface AgeRange {
  id: string
  label: string
  description: string
}

export interface MilestoneOption {
  value: number
  label: string
}

export interface DomainResult {
  domain: MilestoneDomain
  total: number
  reached: number
  percentage: number
  delayed: boolean
}

export interface AgeRangeResult {
  ageRangeId: string
  label: string
  total: number
  reached: number
  percentage: number
  delayed: boolean
}

export interface MilestonesResult {
  totalScore: number
  maxScore: number
  overallPercentage: number
  byDomain: DomainResult[]
  byAgeRange: AgeRangeResult[]
  delayedAreas: string[]
}

export const ageRanges: AgeRange[] = [
  {
    id: '0-6',
    label: '0 a 6 meses',
    description: 'Recém-nascido e lactente jovem',
  },
  {
    id: '6-12',
    label: '6 a 12 meses',
    description: 'Lactente no segundo semestre',
  },
  {
    id: '12-18',
    label: '12 a 18 meses',
    description: 'Início da fase de aquisição da marcha e fala',
  },
  {
    id: '18-24',
    label: '18 a 24 meses',
    description: 'Criança pequena em exploração ativa',
  },
  {
    id: '2-3',
    label: '2 a 3 anos',
    description: 'Consolidação da marcha, fala e interação',
  },
  {
    id: '3-4',
    label: '3 a 4 anos',
    description: 'Pré-escola: autonomia e linguagem complexa',
  },
  {
    id: '4-5',
    label: '4 a 5 anos',
    description: 'Pré-escola: habilidades sociais e cognitivas',
  },
  {
    id: '5-6',
    label: '5 a 6 anos',
    description: 'Prontidão escolar',
  },
]

export const milestoneOptions: MilestoneOption[] = [
  { value: 2, label: 'Atingiu' },
  { value: 1, label: 'Atingiu com atraso' },
  { value: 0, label: 'Não atingiu' },
  { value: -1, label: 'Não sei' },
]

export const DOMAIN_LABELS: Record<MilestoneDomain, string> = {
  motor: 'Motor',
  linguagem: 'Linguagem',
  social: 'Social',
  cognitivo: 'Cognitivo',
}

export const milestoneItems: MilestoneItem[] = [
  // ---- 0-6 meses ----
  {
    key: 'm_0_6_1',
    ageRangeId: '0-6',
    domain: 'motor',
    text: 'Levanta a cabeça quando deitado de bruços',
  },
  {
    key: 'm_0_6_2',
    ageRangeId: '0-6',
    domain: 'motor',
    text: 'Move braços e pernas de forma simétrica',
  },
  { key: 'm_0_6_3', ageRangeId: '0-6', domain: 'motor', text: 'Segura objetos colocados na mão' },
  {
    key: 'm_0_6_4',
    ageRangeId: '0-6',
    domain: 'linguagem',
    text: 'Reage a sons e vozes familiares',
  },
  {
    key: 'm_0_6_5',
    ageRangeId: '0-6',
    domain: 'linguagem',
    text: 'Emite sons (balbucios, arrulhos)',
  },
  {
    key: 'm_0_6_6',
    ageRangeId: '0-6',
    domain: 'social',
    text: 'Sorri em resposta a sorrisos e estímulos',
  },
  {
    key: 'm_0_6_7',
    ageRangeId: '0-6',
    domain: 'social',
    text: 'Mantém contato visual com o cuidador',
  },
  {
    key: 'm_0_6_8',
    ageRangeId: '0-6',
    domain: 'cognitivo',
    text: 'Segue objetos em movimento com o olhar',
  },

  // ---- 6-12 meses ----
  { key: 'm_6_12_1', ageRangeId: '6-12', domain: 'motor', text: 'Senta sem apoio' },
  {
    key: 'm_6_12_2',
    ageRangeId: '6-12',
    domain: 'motor',
    text: 'Engatinha ou se arrasta para se locomover',
  },
  { key: 'm_6_12_3', ageRangeId: '6-12', domain: 'motor', text: 'Fica de pé com apoio' },
  {
    key: 'm_6_12_4',
    ageRangeId: '6-12',
    domain: 'linguagem',
    text: 'Balbucia sílabas ("da-da", "ma-ma")',
  },
  {
    key: 'm_6_12_5',
    ageRangeId: '6-12',
    domain: 'linguagem',
    text: 'Compreende gestos e comandos simples ("não", "vem")',
  },
  {
    key: 'm_6_12_6',
    ageRangeId: '6-12',
    domain: 'social',
    text: 'Demonstra ansiedade de separação',
  },
  {
    key: 'm_6_12_7',
    ageRangeId: '6-12',
    domain: 'social',
    text: 'Brinca de esconde-esconde (fica no seu corpo)',
  },
  {
    key: 'm_6_12_8',
    ageRangeId: '6-12',
    domain: 'cognitivo',
    text: 'Explora objetos batendo, sacudindo e jogando',
  },

  // ---- 12-18 meses ----
  { key: 'm_12_18_1', ageRangeId: '12-18', domain: 'motor', text: 'Anda sozinho' },
  { key: 'm_12_18_2', ageRangeId: '12-18', domain: 'motor', text: 'Sobe escadas com ajuda' },
  { key: 'm_12_18_3', ageRangeId: '12-18', domain: 'motor', text: 'Faz torre de 2 a 3 blocos' },
  {
    key: 'm_12_18_4',
    ageRangeId: '12-18',
    domain: 'linguagem',
    text: 'Diz as primeiras palavras com significado',
  },
  {
    key: 'm_12_18_5',
    ageRangeId: '12-18',
    domain: 'linguagem',
    text: 'Aponta para objetos que deseja',
  },
  {
    key: 'm_12_18_6',
    ageRangeId: '12-18',
    domain: 'social',
    text: 'Imita ações do adulto (varrer, falar ao telefone)',
  },
  {
    key: 'm_12_18_7',
    ageRangeId: '12-18',
    domain: 'cognitivo',
    text: 'Usa objetos para sua função (escova, colher)',
  },

  // ---- 18-24 meses ----
  { key: 'm_18_24_1', ageRangeId: '18-24', domain: 'motor', text: 'Corre com passos largos' },
  { key: 'm_18_24_2', ageRangeId: '18-24', domain: 'motor', text: 'Chuta bola' },
  { key: 'm_18_24_3', ageRangeId: '18-24', domain: 'motor', text: 'Faz torre de 4 a 6 blocos' },
  { key: 'm_18_24_4', ageRangeId: '18-24', domain: 'linguagem', text: 'Fala frases de 2 palavras' },
  {
    key: 'm_18_24_5',
    ageRangeId: '18-24',
    domain: 'linguagem',
    text: 'Nomeia partes do corpo e objetos familiares',
  },
  {
    key: 'm_18_24_6',
    ageRangeId: '18-24',
    domain: 'social',
    text: 'Demonstra interesse em brincar com outras crianças',
  },
  {
    key: 'm_18_24_7',
    ageRangeId: '18-24',
    domain: 'cognitivo',
    text: 'Aponta para figuras em livros',
  },
  {
    key: 'm_18_24_8',
    ageRangeId: '18-24',
    domain: 'cognitivo',
    text: 'Começa a mostrar preferência por uma mão',
  },

  // ---- 2-3 anos ----
  { key: 'm_2_3_1', ageRangeId: '2-3', domain: 'motor', text: 'Pula no mesmo lugar' },
  { key: 'm_2_3_2', ageRangeId: '2-3', domain: 'motor', text: 'Sobe escadas alternando os pés' },
  { key: 'm_2_3_3', ageRangeId: '2-3', domain: 'linguagem', text: 'Fala frases de 3 a 4 palavras' },
  { key: 'm_2_3_4', ageRangeId: '2-3', domain: 'linguagem', text: 'Segue instruções de 2 etapas' },
  {
    key: 'm_2_3_5',
    ageRangeId: '2-3',
    domain: 'social',
    text: 'Brinca ao lado de outras crianças (brincadeira paralela)',
  },
  { key: 'm_2_3_6', ageRangeId: '2-3', domain: 'social', text: 'Demonstra afeto por familiares' },
  {
    key: 'm_2_3_7',
    ageRangeId: '2-3',
    domain: 'cognitivo',
    text: 'Faz imitações (círculos e linhas)',
  },
  {
    key: 'm_2_3_8',
    ageRangeId: '2-3',
    domain: 'cognitivo',
    text: 'Ordena objetos por forma ou cor simples',
  },

  // ---- 3-4 anos ----
  { key: 'm_3_4_1', ageRangeId: '3-4', domain: 'motor', text: 'Peda num pé por 2 segundos' },
  { key: 'm_3_4_2', ageRangeId: '3-4', domain: 'motor', text: 'Pega e arremessa bola' },
  {
    key: 'm_3_4_3',
    ageRangeId: '3-4',
    domain: 'linguagem',
    text: 'Fala de forma compreensível para estranhos',
  },
  {
    key: 'm_3_4_4',
    ageRangeId: '3-4',
    domain: 'linguagem',
    text: 'Faz perguntas ("por quê?", "o que é?")',
  },
  {
    key: 'm_3_4_5',
    ageRangeId: '3-4',
    domain: 'social',
    text: 'Coopera com outras crianças em brincadeiras',
  },
  { key: 'm_3_4_6', ageRangeId: '3-4', domain: 'social', text: 'Compartilha objetos com ajuda' },
  { key: 'm_3_4_7', ageRangeId: '3-4', domain: 'cognitivo', text: 'Nomeia ao menos 4 cores' },
  {
    key: 'm_3_4_8',
    ageRangeId: '3-4',
    domain: 'cognitivo',
    text: 'Conta até pelo menos 3 objetos',
  },

  // ---- 4-5 anos ----
  { key: 'm_4_5_1', ageRangeId: '4-5', domain: 'motor', text: 'Pula num pé varias vezes' },
  { key: 'm_4_5_2', ageRangeId: '4-5', domain: 'motor', text: 'Sube e desce escadas sem apoio' },
  {
    key: 'm_4_5_3',
    ageRangeId: '4-5',
    domain: 'linguagem',
    text: 'Conta historias curtas com coerência',
  },
  {
    key: 'm_4_5_4',
    ageRangeId: '4-5',
    domain: 'linguagem',
    text: 'Usa frases completas com conectivos',
  },
  {
    key: 'm_4_5_5',
    ageRangeId: '4-5',
    domain: 'social',
    text: 'Prefere brincar com outras crianças',
  },
  { key: 'm_4_5_6', ageRangeId: '4-5', domain: 'social', text: 'Segue regras de jogos simples' },
  {
    key: 'm_4_5_7',
    ageRangeId: '4-5',
    domain: 'cognitivo',
    text: 'Desenha pessoas com 2 a 4 partes do corpo',
  },
  {
    key: 'm_4_5_8',
    ageRangeId: '4-5',
    domain: 'cognitivo',
    text: 'Entende conceitos de tempo (manhã, tarde, dia)',
  },

  // ---- 5-6 anos ----
  {
    key: 'm_5_6_1',
    ageRangeId: '5-6',
    domain: 'motor',
    text: 'Anda de bicicleta com ou sem rodas de apoio',
  },
  {
    key: 'm_5_6_2',
    ageRangeId: '5-6',
    domain: 'motor',
    text: 'Pula corda ou equilibra-se em uma viga',
  },
  {
    key: 'm_5_6_3',
    ageRangeId: '5-6',
    domain: 'linguagem',
    text: 'Fala de forma fluente e narrativa',
  },
  {
    key: 'm_5_6_4',
    ageRangeId: '5-6',
    domain: 'linguagem',
    text: 'Reconhece letras e alguns nomes escritos',
  },
  {
    key: 'm_5_6_5',
    ageRangeId: '5-6',
    domain: 'social',
    text: 'Faz amizades e prefere certos amigos',
  },
  {
    key: 'm_5_6_6',
    ageRangeId: '5-6',
    domain: 'social',
    text: 'Demonstra empatia e regras morais básicas',
  },
  { key: 'm_5_6_7', ageRangeId: '5-6', domain: 'cognitivo', text: 'Conta até pelo menos 10' },
  {
    key: 'm_5_6_8',
    ageRangeId: '5-6',
    domain: 'cognitivo',
    text: 'Compreende números e quantidades simples',
  },
]

export const MILESTONES_DRAFT_KEY = 'neuroflow_milestones_draft'
export const MILESTONES_DISCLAIMER =
  'Esta escala é uma ferramenta de triagem baseada nos marcos do CDC e não substitui uma avaliação clínica realizada por profissional de saúde. Resultados de atraso devem ser confirmados em consulta especializada.'

/**
 * Calcula o resultado da escala de marcos do desenvolvimento.
 *
 * - totalScore: soma dos pontos (apenas respostas >= 0 contam).
 * - maxScore: 2 * número de marcos efetivamente respondidos (exclui "Não sei").
 * - por domínio/faixa: % de marcos atingidos (respostas com valor 2 contam como
 *   "alcançado"; valor 1 e 0 contam como não totalmente alcançado para a %).
 * - atraso sinalizado quando a porcentagem de uma área fica abaixo de 70%.
 */
export function calculateMilestonesResult(answers: Record<string, number>): MilestonesResult {
  const domains: MilestoneDomain[] = ['motor', 'linguagem', 'social', 'cognitivo']

  const byDomain: DomainResult[] = domains.map((domain) => {
    const items = milestoneItems.filter((i) => i.domain === domain)
    const answered = items.filter((i) => answers[i.key] !== undefined && answers[i.key] >= 0)
    const total = answered.length
    const reached = answered.filter((i) => answers[i.key] >= 2).length
    const percentage = total > 0 ? Math.round((reached / total) * 100) : 0
    return {
      domain,
      total,
      reached,
      percentage,
      delayed: total > 0 && percentage < 70,
    }
  })

  const byAgeRange: AgeRangeResult[] = ageRanges.map((ar) => {
    const items = milestoneItems.filter((i) => i.ageRangeId === ar.id)
    const answered = items.filter((i) => answers[i.key] !== undefined && answers[i.key] >= 0)
    const total = answered.length
    const reached = answered.filter((i) => answers[i.key] >= 2).length
    const percentage = total > 0 ? Math.round((reached / total) * 100) : 0
    return {
      ageRangeId: ar.id,
      label: ar.label,
      total,
      reached,
      percentage,
      delayed: total > 0 && percentage < 70,
    }
  })

  const totalScore = milestoneItems
    .filter((i) => answers[i.key] !== undefined && answers[i.key] >= 0)
    .reduce((sum, i) => sum + (answers[i.key] ?? 0), 0)
  const maxScore =
    milestoneItems.filter((i) => answers[i.key] !== undefined && answers[i.key] >= 0).length * 2
  const overallPercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

  const delayedAreas = [
    ...byDomain.filter((d) => d.delayed).map((d) => DOMAIN_LABELS[d.domain]),
    ...byAgeRange.filter((a) => a.delayed).map((a) => a.label),
  ]

  return {
    totalScore,
    maxScore,
    overallPercentage,
    byDomain,
    byAgeRange,
    delayedAreas,
  }
}

export function getMilestoneOptionLabel(value: number | undefined): string {
  if (value === undefined) return 'Não respondida'
  return milestoneOptions.find((o) => o.value === value)?.label || 'Não respondida'
}
