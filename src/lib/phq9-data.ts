export interface Phq9Question {
  key: string
  text: string
}

export interface Phq9Option {
  value: number
  label: string
}

export interface Phq9Severity {
  min: number
  max: number
  label: string
  color: string
}

export const phq9Questions: Phq9Question[] = [
  { key: 'phq9_q1', text: 'Pouco interesse ou prazer em fazer as coisas' },
  { key: 'phq9_q2', text: "Se sentir 'para baixo', deprimido(a) ou sem perspectiva" },
  { key: 'phq9_q3', text: 'Dificuldade para pegar no sono, permanecer dormindo ou dormir demais' },
  { key: 'phq9_q4', text: 'Se sentir cansado(a) ou com pouca energia' },
  { key: 'phq9_q5', text: 'Falta de apetite ou comendo demais' },
  {
    key: 'phq9_q6',
    text: 'Se sentir mal consigo mesmo(a) — ou que é um fracasso ou que decepcionou sua família ou a si mesmo(a)',
  },
  {
    key: 'phq9_q7',
    text: 'Dificuldade para se concentrar nas coisas, como ler o jornal ou ver televisão',
  },
  {
    key: 'phq9_q8',
    text: 'Se mover ou falar tão lentamente que outras pessoas podem ter notado? Ou o oposto — estar tão agitado(a) que você fica andando de um lado para o outro muito mais do que de costume',
  },
  {
    key: 'phq9_q9',
    text: 'Pensamentos de que seria melhor estar morto(a) ou de se machucar de alguma forma',
  },
]

export const phq9Options: Phq9Option[] = [
  { value: 0, label: 'Nem um pouco' },
  { value: 1, label: 'Vários dias' },
  { value: 2, label: 'Mais da metade dos dias' },
  { value: 3, label: 'Quase todos os dias' },
]

export const phq9SeverityLevels: Phq9Severity[] = [
  { min: 0, max: 4, label: 'Mínimo ou ausente', color: '#2ECC71' },
  { min: 5, max: 9, label: 'Leve', color: '#F1C40F' },
  { min: 10, max: 14, label: 'Moderado', color: '#E67E22' },
  { min: 15, max: 19, label: 'Moderadamente grave', color: '#E74C3C' },
  { min: 20, max: 27, label: 'Grave', color: '#7B0F0F' },
]

export const PHQ9_CRITICAL_ALERT = 'Sugere-se avaliação clínica imediata para risco de suicídio.'
export const PHQ9_DISCLAIMER =
  'Este instrumento é uma ferramenta de triagem. Não substitui avaliação clínica. Resultados devem ser validados por profissional de saúde.'
export const PHQ9_DRAFT_KEY = 'neuroflow_phq9_draft'

export function getPhq9Severity(score: number): Phq9Severity {
  return phq9SeverityLevels.find((s) => score >= s.min && score <= s.max) || phq9SeverityLevels[0]
}

export function getPhq9OptionLabel(value: number): string {
  return phq9Options.find((o) => o.value === value)?.label || 'Não respondida'
}
