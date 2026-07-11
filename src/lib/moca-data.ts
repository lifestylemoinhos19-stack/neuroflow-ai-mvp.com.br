export interface MocaItem {
  key: string
  domain: string
  label: string
  text: string
  maxScore: number
  scored: boolean
}

export interface MocaDomain {
  id: string
  title: string
  description: string
  maxScore: number
}

export interface MocaSeverity {
  label: string
  color: string
  min: number
  max: number
}

export const mocaDomains: MocaDomain[] = [
  {
    id: 'visuospatial',
    title: 'Visuoespacial/Executivo',
    description: 'Trilha, cubo e relógio',
    maxScore: 5,
  },
  { id: 'naming', title: 'Nomeação', description: 'Nomear animais', maxScore: 3 },
  {
    id: 'memory',
    title: 'Memória',
    description: 'Recordação imediata (não pontuada)',
    maxScore: 5,
  },
  {
    id: 'attention',
    title: 'Atenção',
    description: 'Dígitos, vigilância e seriais 7',
    maxScore: 6,
  },
  { id: 'language', title: 'Linguagem', description: 'Repetição e fluência', maxScore: 3 },
  { id: 'abstraction', title: 'Abstração', description: 'Similaridades', maxScore: 2 },
  {
    id: 'recall',
    title: 'Evocação Tardia',
    description: 'Recordação de palavras após intervalo',
    maxScore: 5,
  },
  { id: 'orientation', title: 'Orientação', description: 'Data, local e cidade', maxScore: 6 },
]

export const mocaItems: MocaItem[] = [
  {
    key: 'moca_trail',
    domain: 'visuospatial',
    label: '1',
    text: 'Teste de trilha (conectar letras e números alternadamente)',
    maxScore: 1,
    scored: true,
  },
  {
    key: 'moca_cube',
    domain: 'visuospatial',
    label: '2',
    text: 'Cópia do cubo',
    maxScore: 1,
    scored: true,
  },
  {
    key: 'moca_clock',
    domain: 'visuospatial',
    label: '3',
    text: 'Desenho do relógio (contorno, números, ponteiros)',
    maxScore: 3,
    scored: true,
  },
  {
    key: 'moca_lion',
    domain: 'naming',
    label: '4',
    text: 'Nomear: Leão',
    maxScore: 1,
    scored: true,
  },
  {
    key: 'moca_rhino',
    domain: 'naming',
    label: '5',
    text: 'Nomear: Rinoceronte',
    maxScore: 1,
    scored: true,
  },
  {
    key: 'moca_camel',
    domain: 'naming',
    label: '6',
    text: 'Nomear: Camelo',
    maxScore: 1,
    scored: true,
  },
  {
    key: 'moca_memory',
    domain: 'memory',
    label: '7',
    text: 'Recordação imediata (Rosto, Veludo, Igreja, Margarida, Vermelho) — não pontuada',
    maxScore: 5,
    scored: false,
  },
  {
    key: 'moca_digits_fwd',
    domain: 'attention',
    label: '8',
    text: 'Dígitos em ordem direta',
    maxScore: 1,
    scored: true,
  },
  {
    key: 'moca_digits_bwd',
    domain: 'attention',
    label: '9',
    text: 'Dígitos em ordem inversa',
    maxScore: 1,
    scored: true,
  },
  {
    key: 'moca_vigilance',
    domain: 'attention',
    label: '10',
    text: 'Vigilância (bater na mesa ao ouvir a sequência alvo)',
    maxScore: 1,
    scored: true,
  },
  {
    key: 'moca_serial7',
    domain: 'attention',
    label: '11',
    text: 'Subtrações seriais de 7 (100-7-7-7-7)',
    maxScore: 3,
    scored: true,
  },
  {
    key: 'moca_repetition',
    domain: 'language',
    label: '12',
    text: 'Repetição de frases (2 frases, 1 ponto cada)',
    maxScore: 2,
    scored: true,
  },
  {
    key: 'moca_fluency',
    domain: 'language',
    label: '13',
    text: 'Fluência verbal (nomear ≥11 palavras com a letra F em 1 min)',
    maxScore: 1,
    scored: true,
  },
  {
    key: 'moca_abs1',
    domain: 'abstraction',
    label: '14',
    text: 'Similaridade: Trem e Bicicleta',
    maxScore: 1,
    scored: true,
  },
  {
    key: 'moca_abs2',
    domain: 'abstraction',
    label: '15',
    text: 'Similaridade: Relógio e Régua',
    maxScore: 1,
    scored: true,
  },
  {
    key: 'moca_recall1',
    domain: 'recall',
    label: '16',
    text: 'Evocação: Rosto',
    maxScore: 1,
    scored: true,
  },
  {
    key: 'moca_recall2',
    domain: 'recall',
    label: '17',
    text: 'Evocação: Veludo',
    maxScore: 1,
    scored: true,
  },
  {
    key: 'moca_recall3',
    domain: 'recall',
    label: '18',
    text: 'Evocação: Igreja',
    maxScore: 1,
    scored: true,
  },
  {
    key: 'moca_recall4',
    domain: 'recall',
    label: '19',
    text: 'Evocação: Margarida',
    maxScore: 1,
    scored: true,
  },
  {
    key: 'moca_recall5',
    domain: 'recall',
    label: '20',
    text: 'Evocação: Vermelho',
    maxScore: 1,
    scored: true,
  },
  {
    key: 'moca_date',
    domain: 'orientation',
    label: '21',
    text: 'Data de hoje',
    maxScore: 1,
    scored: true,
  },
  {
    key: 'moca_month',
    domain: 'orientation',
    label: '22',
    text: 'Mês atual',
    maxScore: 1,
    scored: true,
  },
  {
    key: 'moca_year',
    domain: 'orientation',
    label: '23',
    text: 'Ano atual',
    maxScore: 1,
    scored: true,
  },
  {
    key: 'moca_day',
    domain: 'orientation',
    label: '24',
    text: 'Dia da semana',
    maxScore: 1,
    scored: true,
  },
  {
    key: 'moca_place',
    domain: 'orientation',
    label: '25',
    text: 'Local (nome do edifício/endereço)',
    maxScore: 1,
    scored: true,
  },
  {
    key: 'moca_city',
    domain: 'orientation',
    label: '26',
    text: 'Cidade',
    maxScore: 1,
    scored: true,
  },
]

export const mocaSeverityLevels: MocaSeverity[] = [
  { min: 26, max: 30, label: 'Cognição normal', color: '#2ECC71' },
  { min: 18, max: 25, label: 'Comprometimento cognitivo leve', color: '#F1C40F' },
  { min: 10, max: 17, label: 'Comprometimento cognitivo moderado', color: '#E67E22' },
  { min: 0, max: 9, label: 'Comprometimento cognitivo grave', color: '#E74C3C' },
]

export const MOCA_DRAFT_KEY = 'neuroflow_moca_draft'
export const MOCA_DISCLAIMER =
  'O MoCA é um instrumento de triagem cognitiva. Pontuação < 26 sugere comprometimento cognitivo. Não substitui avaliação clínica formal.'

export function getMocaTotal(scores: Record<string, number>): number {
  return mocaItems.filter((i) => i.scored).reduce((sum, item) => sum + (scores[item.key] ?? 0), 0)
}

export function getMocaDomainScore(domain: string, scores: Record<string, number>): number {
  return mocaItems
    .filter((i) => i.domain === domain && i.scored)
    .reduce((sum, item) => sum + (scores[item.key] ?? 0), 0)
}

export function getMocaSeverity(score: number): MocaSeverity {
  return mocaSeverityLevels.find((s) => score >= s.min && score <= s.max) || mocaSeverityLevels[3]
}
