type SeverityLevel = 'baixo' | 'moderado' | 'elevado'

export interface CbclQuestion {
  key: string
  text: string
  subscale: 'anxious' | 'withdrawn' | 'somatic' | 'rule_breaking' | 'aggressive'
}

export interface CbclOption {
  value: number
  label: string
}

export const cbclQuestions: CbclQuestion[] = [
  { key: 'cbcl_1', text: 'Chora muito', subscale: 'anxious' },
  { key: 'cbcl_2', text: 'Medo de fazer coisas erradas', subscale: 'anxious' },
  { key: 'cbcl_3', text: 'Precisa ser perfeito(a)', subscale: 'anxious' },
  { key: 'cbcl_4', text: 'Sentimentos feridos facilmente', subscale: 'anxious' },
  { key: 'cbcl_5', text: 'Ansioso(a) ou preocupado(a)', subscale: 'anxious' },
  { key: 'cbcl_6', text: 'Gosta de ficar sozinho(a)', subscale: 'withdrawn' },
  { key: 'cbcl_7', text: 'Recusa-se a falar', subscale: 'withdrawn' },
  { key: 'cbcl_8', text: 'Calado(a), reservado(a)', subscale: 'withdrawn' },
  { key: 'cbcl_9', text: 'Triste ou deprimido(a)', subscale: 'withdrawn' },
  { key: 'cbcl_10', text: 'Tonturas ou vertigens', subscale: 'somatic' },
  { key: 'cbcl_11', text: 'Cansaço ou falta de energia', subscale: 'somatic' },
  { key: 'cbcl_12', text: 'Dores de cabeça frequentes', subscale: 'somatic' },
  { key: 'cbcl_13', text: 'Náuseas ou desconforto abdominal', subscale: 'somatic' },
  { key: 'cbcl_14', text: 'Desobedece as regras em casa', subscale: 'rule_breaking' },
  { key: 'cbcl_15', text: 'Desobedece as regras na escola', subscale: 'rule_breaking' },
  { key: 'cbcl_16', text: 'Mente ou engana', subscale: 'rule_breaking' },
  { key: 'cbcl_17', text: 'Envolve-se em brigas físicas', subscale: 'rule_breaking' },
  { key: 'cbcl_18', text: 'Tem acessos de raiva ou explosões', subscale: 'aggressive' },
  { key: 'cbcl_19', text: 'Ameaça ou intimida as pessoas', subscale: 'aggressive' },
  { key: 'cbcl_20', text: 'Destroi coisas pertencentes a outros', subscale: 'aggressive' },
  { key: 'cbcl_21', text: 'É desrespeitoso(a) com adultos', subscale: 'aggressive' },
  { key: 'cbcl_22', text: 'Discute excessivamente', subscale: 'aggressive' },
  { key: 'cbcl_23', text: 'É teimoso(a) ou irritado(a)', subscale: 'aggressive' },
  { key: 'cbcl_24', text: 'Muda de humor repentinamente', subscale: 'aggressive' },
  { key: 'cbcl_25', text: 'Exige muita atenção', subscale: 'aggressive' },
]

export const cbclOptions: CbclOption[] = [
  { value: 0, label: 'Não é verdade' },
  { value: 1, label: 'Às vezes' },
  { value: 2, label: 'Muitas vezes' },
]

export interface CbclResult {
  internalizing: number
  externalizing: number
  total: number
  isInternalizingElevated: boolean
  isExternalizingElevated: boolean
  maxScore: number
  severity: SeverityLevel
}

export function interpretCBCL(answers: Record<string, number>): CbclResult {
  const internalizingQs = cbclQuestions.filter(
    (q) => q.subscale === 'anxious' || q.subscale === 'withdrawn' || q.subscale === 'somatic',
  )
  const externalizingQs = cbclQuestions.filter(
    (q) => q.subscale === 'rule_breaking' || q.subscale === 'aggressive',
  )
  const internalizing = internalizingQs.reduce((s, q) => s + (answers[q.key] ?? 0), 0)
  const externalizing = externalizingQs.reduce((s, q) => s + (answers[q.key] ?? 0), 0)
  const intMax = internalizingQs.length * 2
  const extMax = externalizingQs.length * 2
  const total = internalizing + externalizing
  let severity: SeverityLevel = 'baixo'
  if (total > 14) severity = 'elevado'
  else if (total >= 8) severity = 'moderado'
  return {
    internalizing,
    externalizing,
    total,
    isInternalizingElevated: internalizing >= intMax * 0.3,
    isExternalizingElevated: externalizing >= extMax * 0.3,
    maxScore: cbclQuestions.length * 2,
    severity,
  }
}
