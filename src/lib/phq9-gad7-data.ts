export interface ScaleQuestion {
  id: number
  key: string
  question: string
}

export const phq9Questions: ScaleQuestion[] = [
  { id: 1, key: 'phq9_q1', question: 'Pouco interesse ou prazer em fazer as coisas' },
  { id: 2, key: 'phq9_q2', question: 'Sentir-se desanimado, deprimido ou sem esperança' },
  { id: 3, key: 'phq9_q3', question: 'Dificuldade para dormir ou dormir demais' },
  { id: 4, key: 'phq9_q4', question: 'Sentir-se cansado ou ter pouca energia' },
  { id: 5, key: 'phq9_q5', question: 'Falta de apetite ou comer demais' },
  { id: 6, key: 'phq9_q6', question: 'Sentir-se mal consigo mesmo ou que é um fracasso' },
  { id: 7, key: 'phq9_q7', question: 'Dificuldade para se concentrar em coisas' },
  { id: 8, key: 'phq9_q8', question: 'Movimento ou fala lentos, ou inquietação' },
  { id: 9, key: 'phq9_q9', question: 'Pensamentos de que seria melhor estar morto' },
]

export const gad7Questions: ScaleQuestion[] = [
  { id: 1, key: 'gad7_q1', question: 'Sentir-se nervoso, ansioso ou tenso' },
  { id: 2, key: 'gad7_q2', question: 'Não conseguir parar de se preocupar' },
  { id: 3, key: 'gad7_q3', question: 'Preocupar-se demais com diferentes coisas' },
  { id: 4, key: 'gad7_q4', question: 'Dificuldade para relaxar' },
  { id: 5, key: 'gad7_q5', question: 'Inquietação difícil de ficar parado' },
  { id: 6, key: 'gad7_q6', question: 'Ficar facilmente irritado ou aborrecido' },
  { id: 7, key: 'gad7_q7', question: 'Sentir medo como se algo terrível fosse acontecer' },
]

export const likertScaleLabels = [
  { value: 0, label: 'De modo algum' },
  { value: 1, label: 'Vários dias' },
  { value: 2, label: 'Mais da metade dos dias' },
  { value: 3, label: 'Quase todos os dias' },
]

export type Phq9Severity = 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe'
export type Gad7Severity = 'minimal' | 'mild' | 'moderate' | 'severe'

export function getPhq9Severity(score: number): Phq9Severity {
  if (score >= 20) return 'severe'
  if (score >= 15) return 'moderately_severe'
  if (score >= 10) return 'moderate'
  if (score >= 5) return 'mild'
  return 'minimal'
}

export function getGad7Severity(score: number): Gad7Severity {
  if (score >= 15) return 'severe'
  if (score >= 10) return 'moderate'
  if (score >= 5) return 'mild'
  return 'minimal'
}

export const phq9SeverityLabels: Record<Phq9Severity, string> = {
  minimal: 'Depressão Mínima',
  mild: 'Depressão Leve',
  moderate: 'Depressão Moderada',
  moderately_severe: 'Depressão Moderadamente Severa',
  severe: 'Depressão Severa',
}

export const gad7SeverityLabels: Record<Gad7Severity, string> = {
  minimal: 'Ansiedade Mínima',
  mild: 'Ansiedade Leve',
  moderate: 'Ansiedade Moderada',
  severe: 'Ansiedade Severa',
}

export const PHQ9_CUTOFF_SEVERE = 15
export const GAD7_CUTOFF_MODERATE = 10
