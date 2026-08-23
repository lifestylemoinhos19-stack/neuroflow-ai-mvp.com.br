export interface AssessmentQuestion {
  key: string
  text: string
  group?: string
}

export interface AssessmentOption {
  value: number
  label: string
}

export const snapQuestions: AssessmentQuestion[] = [
  {
    key: 'snapiv_q1',
    text: 'Comete erros por descuido nos trabalhos escolares ou outras atividades',
    group: 'inattention',
  },
  {
    key: 'snapiv_q2',
    text: 'Tem dificuldade de manter a atenção em tarefas ou atividades lúdicas',
    group: 'inattention',
  },
  {
    key: 'snapiv_q3',
    text: 'Parece não estar ouvindo quando se fala diretamente com ela',
    group: 'inattention',
  },
  {
    key: 'snapiv_q4',
    text: 'Não segue instruções até o fim e não termina tarefas',
    group: 'inattention',
  },
  {
    key: 'snapiv_q5',
    text: 'Tem dificuldade de organizar tarefas e atividades',
    group: 'inattention',
  },
  {
    key: 'snapiv_q6',
    text: 'Evita ou reluta em se envolver em tarefas que exigem esforço mental',
    group: 'inattention',
  },
  {
    key: 'snapiv_q7',
    text: 'Perde coisas necessárias para tarefas ou atividades',
    group: 'inattention',
  },
  { key: 'snapiv_q8', text: 'Distrai-se facilmente com estímulos externos', group: 'inattention' },
  { key: 'snapiv_q9', text: 'Esquece-se de atividades diárias', group: 'inattention' },
  {
    key: 'snapiv_q10',
    text: 'Move as mãos ou pés inquietamente ou se remexe na cadeira',
    group: 'hyperactivity',
  },
  {
    key: 'snapiv_q11',
    text: 'Sai do lugar em situações em que se espera que fique sentado',
    group: 'hyperactivity',
  },
  {
    key: 'snapiv_q12',
    text: 'Corre ou escala excessivamente em situações inadequadas',
    group: 'hyperactivity',
  },
  {
    key: 'snapiv_q13',
    text: 'Tem dificuldade em brincar ou se envolver silenciosamente em atividades',
    group: 'hyperactivity',
  },
  {
    key: 'snapiv_q14',
    text: 'Está sempre "a mil" ou age como se fosse impulsionada por um motor',
    group: 'hyperactivity',
  },
  { key: 'snapiv_q15', text: 'Fala em excesso', group: 'hyperactivity' },
  {
    key: 'snapiv_q16',
    text: 'Responde precipitadamente antes que as perguntas tenham sido completadas',
    group: 'hyperactivity',
  },
  { key: 'snapiv_q17', text: 'Tem dificuldade de esperar sua vez', group: 'hyperactivity' },
  { key: 'snapiv_q18', text: 'Interrompe ou se intromete nos outros', group: 'hyperactivity' },
]

export const snapOptions: AssessmentOption[] = [
  { value: 0, label: 'Nem um pouco' },
  { value: 1, label: 'Só um pouco' },
  { value: 2, label: 'Bastante' },
  { value: 3, label: 'Demais' },
]

export const assqQuestions: AssessmentQuestion[] = [
  { key: 'assq_1', text: 'É desajeitado(a), tem coordenação motora pobre' },
  { key: 'assq_2', text: 'Apresenta-se distraído(a) em situações sociais' },
  { key: 'assq_3', text: 'Tem dificuldade em participar de atividades em grupo' },
  { key: 'assq_4', text: 'Não compreende regras sociais convencionais' },
  { key: 'assq_5', text: 'Apresenta comportamentos incomuns sob estresse' },
  { key: 'assq_6', text: 'Tem dificuldade em fazer amigos' },
  { key: 'assq_7', text: 'Apresenta linguagem estereotipada ou repetitiva' },
  { key: 'assq_8', text: 'Tem expressões faciais incomuns' },
  { key: 'assq_9', text: 'Tem dificuldade em iniciar ou manter conversas' },
  { key: 'assq_10', text: 'Não entende piadas ou ironias' },
  { key: 'assq_11', text: 'É muito honesto(a), fala coisas inapropriadas' },
  { key: 'assq_12', text: 'Tem interesses restritos e específicos' },
  { key: 'assq_13', text: 'Apresenta movimentos repetitivos ou tiques' },
  { key: 'assq_14', text: 'Reage de forma incomum a estímulos sensoriais' },
  { key: 'assq_15', text: 'Fala de forma excessivamente formal ou pedante' },
  { key: 'assq_16', text: 'Prefere brincar sozinho(a) a brincar com outras crianças' },
  { key: 'assq_17', text: 'Tem dificuldade em entender sentimentos alheios' },
  { key: 'assq_18', text: 'Fala muito sobre temas de interesse restrito' },
  { key: 'assq_19', text: 'Tem memória excepcional para detalhes específicos' },
  { key: 'assq_20', text: 'Tem dificuldade em adaptar-se a mudanças de rotina' },
  { key: 'assq_21', text: 'Apresenta atraso no desenvolvimento da linguagem' },
  { key: 'assq_22', text: 'Tem contato visual incomum (muito intenso ou muito pouco)' },
  { key: 'assq_23', text: 'Ri ou sorri em momentos inapropriados' },
  { key: 'assq_24', text: 'Coleciona objetos de forma obsessiva' },
  { key: 'assq_25', text: 'Tem medos ou fobias incomuns' },
  { key: 'assq_26', text: 'Não responde quando chamado(a) pelo nome' },
  { key: 'assq_27', text: 'Tem dificuldade em brincar de faz-de-conta' },
]

export const assqOptions: AssessmentOption[] = [
  { value: 0, label: 'Não' },
  { value: 1, label: 'Um pouco' },
  { value: 2, label: 'Sim' },
]

export type SeverityLevel = 'baixo' | 'moderado' | 'elevado'

export interface SnapIVResult {
  inattentionHigh: number
  hyperactivityHigh: number
  isSuggestive: boolean
  average: number
  inattentionAvg: number
  hyperactivityAvg: number
  severity: SeverityLevel
}

export function interpretSnapIV(answers: Record<string, number>): SnapIVResult {
  const inattentionAnswers = snapQuestions.filter((q) => q.group === 'inattention')
  const hyperactivityAnswers = snapQuestions.filter((q) => q.group === 'hyperactivity')
  const inattentionSum = inattentionAnswers.reduce((s, q) => s + (answers[q.key] ?? 0), 0)
  const hyperactivitySum = hyperactivityAnswers.reduce((s, q) => s + (answers[q.key] ?? 0), 0)
  const totalSum = inattentionSum + hyperactivitySum
  const average = totalSum / 18
  const inattentionAvg = inattentionSum / 9
  const hyperactivityAvg = hyperactivitySum / 9
  const inattentionHigh = inattentionAnswers.filter((q) => (answers[q.key] ?? -1) >= 2).length
  const hyperactivityHigh = hyperactivityAnswers.filter((q) => (answers[q.key] ?? -1) >= 2).length
  let severity: SeverityLevel = 'baixo'
  if (average > 1.5) severity = 'elevado'
  else if (average >= 1.0) severity = 'moderado'
  return {
    inattentionHigh,
    hyperactivityHigh,
    isSuggestive: severity !== 'baixo',
    average,
    inattentionAvg,
    hyperactivityAvg,
    severity,
  }
}

export interface AssqResult {
  total: number
  threshold: number
  isSuggestive: boolean
  severity: SeverityLevel
}

export function interpretASSQ(answers: Record<string, number>, gender: 'boy' | 'girl'): AssqResult {
  const total = assqQuestions.reduce((sum, q) => sum + (answers[q.key] ?? 0), 0)
  const threshold = gender === 'boy' ? 22 : 19
  let severity: SeverityLevel = 'baixo'
  if (total > 21) severity = 'elevado'
  else if (total >= 14) severity = 'moderado'
  return { total, threshold, isSuggestive: severity !== 'baixo', severity }
}
