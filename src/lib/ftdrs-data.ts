export interface FtdrsItem {
  key: string
  label: string
  text: string
  domain: string
}

export interface FtdrsDomain {
  id: string
  title: string
  description: string
}

export interface FtdrsOption {
  value: number
  label: string
}

export interface FtdrsSeverity {
  label: string
  color: string
  min: number
  max: number
}

export const ftdrsDomains: FtdrsDomain[] = [
  {
    id: 'disinhibition',
    title: 'Desinibição',
    description: 'Comportamentos socialmente inadequados e impulsividade',
  },
  { id: 'apathy', title: 'Apatia', description: 'Redução de iniciativa e envolvimento social' },
  {
    id: 'behavior',
    title: 'Comportamento',
    description: 'Mudanças alimentares e comportamentos repetitivos',
  },
  { id: 'language', title: 'Linguagem', description: 'Mudanças na fala e compreensão' },
  {
    id: 'executive',
    title: 'Função Executiva',
    description: 'Planejamento e flexibilidade cognitiva',
  },
  { id: 'functional', title: 'Funcionalidade', description: 'Atividades de vida diária' },
]

export const ftdrsItems: FtdrsItem[] = [
  {
    key: 'ftdrs_q1',
    label: 'Q1',
    text: 'Comportamento socialmente inadequado',
    domain: 'disinhibition',
  },
  { key: 'ftdrs_q2', label: 'Q2', text: 'Impulsividade ou agitação', domain: 'disinhibition' },
  { key: 'ftdrs_q3', label: 'Q3', text: 'Desinibição sexual ou verbal', domain: 'disinhibition' },
  { key: 'ftdrs_q4', label: 'Q4', text: 'Apatia ou falta de iniciativa', domain: 'apathy' },
  { key: 'ftdrs_q5', label: 'Q5', text: 'Perda de empatia ou afeto', domain: 'apathy' },
  { key: 'ftdrs_q6', label: 'Q6', text: 'Isolamento social ou retirada', domain: 'apathy' },
  {
    key: 'ftdrs_q7',
    label: 'Q7',
    text: 'Mudanças alimentares (hiperfagia, preferências)',
    domain: 'behavior',
  },
  {
    key: 'ftdrs_q8',
    label: 'Q8',
    text: 'Comportamentos repetitivos ou estereotipados',
    domain: 'behavior',
  },
  { key: 'ftdrs_q9', label: 'Q9', text: 'Uso inadequado de objetos', domain: 'behavior' },
  { key: 'ftdrs_q10', label: 'Q10', text: 'Redução de fluência verbal', domain: 'language' },
  {
    key: 'ftdrs_q11',
    label: 'Q11',
    text: 'Dificuldade de compreensão de linguagem',
    domain: 'language',
  },
  {
    key: 'ftdrs_q12',
    label: 'Q12',
    text: 'Dificuldade de planejamento e organização',
    domain: 'executive',
  },
  {
    key: 'ftdrs_q13',
    label: 'Q13',
    text: 'Dificuldade de flexibilidade cognitiva',
    domain: 'executive',
  },
  {
    key: 'ftdrs_q14',
    label: 'Q14',
    text: 'Dificuldade nas atividades de vida diária',
    domain: 'functional',
  },
  {
    key: 'ftdrs_q15',
    label: 'Q15',
    text: 'Necessidade de supervisão constante',
    domain: 'functional',
  },
]

export const ftdrsOptions: FtdrsOption[] = [
  { value: 0, label: '0 - Ausente' },
  { value: 1, label: '1 - Leve' },
  { value: 2, label: '2 - Moderado' },
  { value: 3, label: '3 - Grave' },
]

export const ftdrsSeverityLevels: FtdrsSeverity[] = [
  { min: 0, max: 9, label: 'Minimal', color: '#2ECC71' },
  { min: 10, max: 19, label: 'Leve', color: '#F1C40F' },
  { min: 20, max: 29, label: 'Moderado', color: '#E67E22' },
  { min: 30, max: 45, label: 'Grave', color: '#E74C3C' },
]

export const FTDRS_DRAFT_KEY = 'neuroflow_ftdrs_draft'
export const FTDRS_DISCLAIMER =
  'O FTDRS é um instrumento de avaliação específico para Demência Frontotemporal. Os resultados devem ser interpretados por um profissional de saúde qualificado.'

export function getFtdrsTotal(answers: Record<string, number>): number {
  return ftdrsItems.reduce((sum, item) => sum + (answers[item.key] ?? 0), 0)
}

export function getFtdrsSeverity(score: number): FtdrsSeverity {
  return ftdrsSeverityLevels.find((s) => score >= s.min && score <= s.max) || ftdrsSeverityLevels[0]
}

export function getFtdrsOptionLabel(value: number): string {
  return ftdrsOptions.find((o) => o.value === value)?.label || 'Não respondida'
}
