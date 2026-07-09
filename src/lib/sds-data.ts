export interface SdsQuestion {
  key: string
  label: string
  text: string
  section: string
  max: number
}

export interface SdsImpairmentLevel {
  label: string
  color: string
  min: number
  max: number
}

export interface SdsSection {
  id: string
  title: string
  description: string
}

export const sdsSections: SdsSection[] = [
  {
    id: 'sds',
    title: 'SDS Principal',
    description: 'Avaliação de incapacidade funcional nas áreas trabalho, social e familiar.',
  },
  {
    id: 'productivity',
    title: 'Métrica de Produtividade',
    description: 'Dias perdidos por causa dos sintomas nos últimos 7 dias.',
  },
  {
    id: 'sherra',
    title: 'Sherra para o Trabalho',
    description: 'Avaliação específica de foco, relacionamento e produtividade profissional.',
  },
]

export const sdsQuestions: SdsQuestion[] = [
  {
    key: 'sds_q1',
    label: 'Q1',
    text: 'Os sintomas prejudicaram seu trabalho ou seus estudos?',
    section: 'sds',
    max: 10,
  },
  {
    key: 'sds_q2',
    label: 'Q2',
    text: 'Os sintomas prejudicaram sua vida social e atividades de lazer?',
    section: 'sds',
    max: 10,
  },
  {
    key: 'sds_q3',
    label: 'Q3',
    text: 'Os sintomas prejudicaram sua vida familiar ou responsabilidades em casa?',
    section: 'sds',
    max: 10,
  },
  {
    key: 'sds_days_lost',
    label: 'DaysLost',
    text: 'Quantos dias nos últimos 7 dias você deixou de ir ao trabalho/escola ou perdeu dias produtivos por causa dos sintomas?',
    section: 'productivity',
    max: 7,
  },
  {
    key: 'sds_qw1',
    label: 'QW1',
    text: 'Capacidade de manter o foco em tarefas profissionais',
    section: 'sherra',
    max: 10,
  },
  {
    key: 'sds_qw2',
    label: 'QW2',
    text: 'Relacionamento com colegas e superiores',
    section: 'sherra',
    max: 10,
  },
  {
    key: 'sds_qw3',
    label: 'QW3',
    text: 'Produtividade e cumprimento de prazos',
    section: 'sherra',
    max: 10,
  },
]

export const sdsImpairmentLevels: SdsImpairmentLevel[] = [
  { label: 'Normal / Leve', min: 0, max: 4, color: '#2ECC71' },
  { label: 'Moderado', min: 5, max: 7, color: '#E67E22' },
  { label: 'Severo', min: 8, max: 10, color: '#E74C3C' },
]

export const SDS_DRAFT_KEY = 'sds_sheehan_draft'
export const SDS_DISCLAIMER =
  '* Interpretação por item: < 5 (Normal/Leve), 5-7 (Moderado), 8-10 (Severo). Pontuações mais altas indicam maior incapacidade.'

export function getSdsImpairmentLevel(score: number): SdsImpairmentLevel {
  return sdsImpairmentLevels.find((l) => score >= l.min && score <= l.max) || sdsImpairmentLevels[0]
}

export function getSdsTotalScore(answers: Record<string, number>): number {
  return (answers['sds_q1'] ?? 0) + (answers['sds_q2'] ?? 0) + (answers['sds_q3'] ?? 0)
}

export function getSherraTotalScore(answers: Record<string, number>): number {
  return (answers['sds_qw1'] ?? 0) + (answers['sds_qw2'] ?? 0) + (answers['sds_qw3'] ?? 0)
}
