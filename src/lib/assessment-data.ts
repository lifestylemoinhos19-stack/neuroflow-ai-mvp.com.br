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
    key: 'snap_1',
    text: 'Comete erros por descuido nos trabalhos escolares ou outras atividades',
    group: 'inattention',
  },
  {
    key: 'snap_2',
    text: 'Tem dificuldade de manter a atenção em tarefas ou atividades lúdicas',
    group: 'inattention',
  },
  {
    key: 'snap_3',
    text: 'Parece não estar ouvindo quando se fala diretamente com ela',
    group: 'inattention',
  },
  {
    key: 'snap_4',
    text: 'Não segue instruções até o fim e não termina tarefas',
    group: 'inattention',
  },
  {
    key: 'snap_5',
    text: 'Tem dificuldade de organizar tarefas e atividades',
    group: 'inattention',
  },
  {
    key: 'snap_6',
    text: 'Evita ou reluta em se envolver em tarefas que exigem esforço mental',
    group: 'inattention',
  },
  {
    key: 'snap_7',
    text: 'Perde coisas necessárias para tarefas ou atividades',
    group: 'inattention',
  },
  { key: 'snap_8', text: 'Distrai-se facilmente com estímulos externos', group: 'inattention' },
  { key: 'snap_9', text: 'Esquece-se de atividades diárias', group: 'inattention' },
  {
    key: 'snap_10',
    text: 'Move as mãos ou pés inquietamente ou se remexe na cadeira',
    group: 'hyperactivity',
  },
  {
    key: 'snap_11',
    text: 'Sai do lugar em situações em que se espera que fique sentado',
    group: 'hyperactivity',
  },
  {
    key: 'snap_12',
    text: 'Corre ou escala excessivamente em situações inadequadas',
    group: 'hyperactivity',
  },
  {
    key: 'snap_13',
    text: 'Tem dificuldade em brincar ou se envolver silenciosamente em atividades',
    group: 'hyperactivity',
  },
  {
    key: 'snap_14',
    text: 'Está sempre "a mil" ou age como se fosse impulsionada por um motor',
    group: 'hyperactivity',
  },
  { key: 'snap_15', text: 'Fala em excesso', group: 'hyperactivity' },
  {
    key: 'snap_16',
    text: 'Responde precipitadamente antes que as perguntas tenham sido completadas',
    group: 'hyperactivity',
  },
  { key: 'snap_17', text: 'Tem dificuldade de esperar sua vez', group: 'hyperactivity' },
  { key: 'snap_18', text: 'Interrompe ou se intromete nos outros', group: 'hyperactivity' },
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

export interface SnapIVResult {
  inattentionHigh: number
  hyperactivityHigh: number
  isSuggestive: boolean
}

export function interpretSnapIV(answers: Record<string, number>): SnapIVResult {
  const inattentionHigh = snapQuestions
    .filter((q) => q.group === 'inattention')
    .filter((q) => (answers[q.key] ?? -1) >= 2).length
  const hyperactivityHigh = snapQuestions
    .filter((q) => q.group === 'hyperactivity')
    .filter((q) => (answers[q.key] ?? -1) >= 2).length
  return {
    inattentionHigh,
    hyperactivityHigh,
    isSuggestive: inattentionHigh >= 6 || hyperactivityHigh >= 6,
  }
}

export interface AssqResult {
  total: number
  threshold: number
  isSuggestive: boolean
}

export function interpretASSQ(answers: Record<string, number>, gender: 'boy' | 'girl'): AssqResult {
  const total = assqQuestions.reduce((sum, q) => sum + (answers[q.key] ?? 0), 0)
  const threshold = gender === 'boy' ? 22 : 19
  return { total, threshold, isSuggestive: total >= threshold }
}
