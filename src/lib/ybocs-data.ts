export interface YbocsQuestion {
  key: string
  text: string
  section: 'obsessions' | 'compulsions'
}

export interface YbocsOption {
  value: number
  label: string
}

export interface YbocsSeverity {
  min: number
  max: number
  label: string
  color: string
}

export interface YbocsSection {
  id: string
  title: string
  description: string
}

export const ybocsSections: YbocsSection[] = [
  {
    id: 'obsessions',
    title: 'SEÇÃO 1 - OBSESSÕES',
    description: 'Avaliação da gravidade das obsessões nos últimos 7 dias.',
  },
  {
    id: 'compulsions',
    title: 'SEÇÃO 2 - COMPULSÕES',
    description: 'Avaliação da gravidade das compulsões nos últimos 7 dias.',
  },
]

export const ybocsQuestions: YbocsQuestion[] = [
  {
    key: 'ybocs_q1',
    text: 'Quanto do seu tempo é ocupado por pensamentos obsessivos?',
    section: 'obsessions',
  },
  {
    key: 'ybocs_q2',
    text: 'Quanto as obsessões interferem em seu funcionamento social, laboral ou outras áreas?',
    section: 'obsessions',
  },
  {
    key: 'ybocs_q3',
    text: 'Quanto desconforto ou angústia suas obsessões lhe causam?',
    section: 'obsessions',
  },
  {
    key: 'ybocs_q4',
    text: 'Quanto você tenta resistir aos pensamentos obsessivos?',
    section: 'obsessions',
  },
  {
    key: 'ybocs_q5',
    text: 'Quanto controle você tem sobre seus pensamentos obsessivos?',
    section: 'obsessions',
  },
  {
    key: 'ybocs_q6',
    text: 'Quanto do seu tempo é ocupado por comportamentos compulsivos?',
    section: 'compulsions',
  },
  {
    key: 'ybocs_q7',
    text: 'Quanto as compulsões interferem em seu funcionamento social, laboral ou outras áreas?',
    section: 'compulsions',
  },
  {
    key: 'ybocs_q8',
    text: 'Quanto desconforto você sente se é impedido de realizar comportamentos compulsivos?',
    section: 'compulsions',
  },
  {
    key: 'ybocs_q9',
    text: 'Quanto você tenta resistir aos comportamentos compulsivos?',
    section: 'compulsions',
  },
  {
    key: 'ybocs_q10',
    text: 'Quanto controle você tem sobre seus comportamentos compulsivos?',
    section: 'compulsions',
  },
]

export const ybocsOptions: YbocsOption[] = [
  { value: 0, label: '0 - Nenhum/Nunca' },
  { value: 1, label: '1 - Leve/Raramente' },
  { value: 2, label: '2 - Moderado/Às vezes' },
  { value: 3, label: '3 - Grave/Frequentemente' },
  { value: 4, label: '4 - Extremo/Quase sempre' },
]

export const ybocsSeverityLevels: YbocsSeverity[] = [
  { min: 0, max: 7, label: 'Subclínico', color: '#28a745' },
  { min: 8, max: 15, label: 'Leve', color: '#ffc107' },
  { min: 16, max: 23, label: 'Moderado', color: '#fd7e14' },
  { min: 24, max: 31, label: 'Grave', color: '#dc3545' },
  { min: 32, max: 40, label: 'Extremo', color: '#8b0000' },
]

export const YBOCS_DRAFT_KEY = 'ybocs_draft_responses'
export const YBOCS_DISCLAIMER =
  'Esta escala é uma ferramenta de triagem clínica e não substitui avaliação profissional. Os resultados devem ser interpretados por um profissional de saúde qualificado.'

export function getYbocsSeverity(score: number): YbocsSeverity {
  return ybocsSeverityLevels.find((s) => score >= s.min && score <= s.max) || ybocsSeverityLevels[0]
}

export function getYbocsOptionLabel(value: number): string {
  return ybocsOptions.find((o) => o.value === value)?.label || 'Não respondida'
}

export function getObsessionsSubtotal(answers: Record<string, number>): number {
  return ybocsQuestions
    .filter((q) => q.section === 'obsessions')
    .reduce((sum, q) => sum + (answers[q.key] ?? 0), 0)
}

export function getCompulsionsSubtotal(answers: Record<string, number>): number {
  return ybocsQuestions
    .filter((q) => q.section === 'compulsions')
    .reduce((sum, q) => sum + (answers[q.key] ?? 0), 0)
}

export function getYbocsTotal(answers: Record<string, number>): number {
  return ybocsQuestions.reduce((sum, q) => sum + (answers[q.key] ?? 0), 0)
}
