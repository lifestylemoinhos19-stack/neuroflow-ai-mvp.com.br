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

export interface FtdrsItem {
  key: string
  label: string
  text: string
  domain: string
  visualHint?: string
  iconType?: 'behavior' | 'speech' | 'social' | 'daily' | 'executive'
}

export const ftdrsItems: FtdrsItem[] = [
  {
    key: 'ftdrs_q1',
    label: 'Q1',
    text: 'Comportamento socialmente inadequado ou perda de tato social',
    domain: 'disinhibition',
    visualHint:
      'Comportamento fora do padrão social aceito (falta de inibição com estranhos, comentários indelicados).',
    iconType: 'social',
  },
  {
    key: 'ftdrs_q2',
    label: 'Q2',
    text: 'Impulsividade, agitação ou ações precipitadas',
    domain: 'disinhibition',
    visualHint: 'Tomadas de decisão imediatas e impulsivas sem considerar riscos.',
    iconType: 'behavior',
  },
  {
    key: 'ftdrs_q3',
    label: 'Q3',
    text: 'Desinibição verbal ou sexual evidente',
    domain: 'disinhibition',
    visualHint: 'Uso de linguagem desinibida, piadas inadequadas ou avanços descabidos.',
    iconType: 'social',
  },
  {
    key: 'ftdrs_q4',
    label: 'Q4',
    text: 'Apatia, passividade ou falta evidente de iniciativa',
    domain: 'apathy',
    visualHint:
      'Perda de interesse em iniciar atividades espontaneamente, necessita de estímulo constante.',
    iconType: 'behavior',
  },
  {
    key: 'ftdrs_q5',
    label: 'Q5',
    text: 'Perda de empatia, simpatia ou afeto por familiares e amigos',
    domain: 'apathy',
    visualHint: 'Indiferença aparente aos sentimentos ou sofrimento dos entes queridos.',
    iconType: 'social',
  },
  {
    key: 'ftdrs_q6',
    label: 'Q6',
    text: 'Isolamento social ou recusa de contato interpessoal',
    domain: 'apathy',
    visualHint: 'Retirada social progressiva e perda de interesse na convivência com grupos.',
    iconType: 'social',
  },
  {
    key: 'ftdrs_q7',
    label: 'Q7',
    text: 'Mudanças alimentares (hiperfagia, fixação por doces/carboidratos)',
    domain: 'behavior',
    visualHint:
      'Aumento voraz de apetite, preferência obsessiva por alimentos doces ou ingestão rápida.',
    iconType: 'daily',
  },
  {
    key: 'ftdrs_q8',
    label: 'Q8',
    text: 'Comportamentos repetitivos, rituais ou estereotipias motoras',
    domain: 'behavior',
    visualHint:
      'Passear em trajetos fixos, bater dedos, verificar portas repetidamente ou colecionar objetos.',
    iconType: 'behavior',
  },
  {
    key: 'ftdrs_q9',
    label: 'Q9',
    text: 'Uso inadequado de objetos cotidianos',
    domain: 'behavior',
    visualHint:
      'Manipulação incorreta de utensílios (ex.: usar colher como escova, tentar comer objetos).',
    iconType: 'daily',
  },
  {
    key: 'ftdrs_q10',
    label: 'Q10',
    text: 'Redução progressiva da fluência verbal ou fala econômica',
    domain: 'language',
    visualHint: 'Redução espontânea do discurso, respostas monossilábicas ou pausas frequentes.',
    iconType: 'speech',
  },
  {
    key: 'ftdrs_q11',
    label: 'Q11',
    text: 'Dificuldade de compreensão de palavras ou ordens complexas',
    domain: 'language',
    visualHint:
      'Perda do significado de palavras familiares ("o que é um garfo?") ou esforço para entender conversas.',
    iconType: 'speech',
  },
  {
    key: 'ftdrs_q12',
    label: 'Q12',
    text: 'Dificuldade de planejamento, sequenciamento e organização',
    domain: 'executive',
    visualHint:
      'Desorganização em tarefas de múltiplas etapas (preparar uma refeição, pagar contas).',
    iconType: 'executive',
  },
  {
    key: 'ftdrs_q13',
    label: 'Q13',
    text: 'Perda de flexibilidade cognitiva (rigidez mental e teimosia)',
    domain: 'executive',
    visualHint: 'Inflexibilidade a mudanças na rotina diária ou insistência obstinada.',
    iconType: 'executive',
  },
  {
    key: 'ftdrs_q14',
    label: 'Q14',
    text: 'Dificuldade nas atividades de vida diária (higiene, vestir, finanças)',
    domain: 'functional',
    visualHint: 'Comprometimento funcional em atividades instrumentais e básicas do dia a dia.',
    iconType: 'daily',
  },
  {
    key: 'ftdrs_q15',
    label: 'Q15',
    text: 'Necessidade de supervisão ou assistência constante',
    domain: 'functional',
    visualHint:
      'Insegurança para ficar desacompanhado(a) em casa ou na rua por riscos de segurança.',
    iconType: 'daily',
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
