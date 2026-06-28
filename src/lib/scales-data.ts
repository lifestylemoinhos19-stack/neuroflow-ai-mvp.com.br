export interface MChatQuestion {
  id: number
  key: string
  question: string
  riskAnswer: 'Sim' | 'Não'
  isCritical: boolean
}

export interface SNAPQuestion {
  id: number
  key: string
  question: string
  subscale: 'inattention' | 'hyperactivity'
}

export const mchatQuestions: MChatQuestion[] = [
  {
    id: 1,
    key: 'mchat_q1',
    question: 'Se você apontar para algo do outro lado da sala, sua criança olha para isso?',
    riskAnswer: 'Não',
    isCritical: false,
  },
  {
    id: 2,
    key: 'mchat_q2',
    question: 'Você já se perguntou se sua criança é surda?',
    riskAnswer: 'Sim',
    isCritical: true,
  },
  {
    id: 3,
    key: 'mchat_q3',
    question: 'Sua criança brinca de faz-de-conta ou imagina coisas?',
    riskAnswer: 'Não',
    isCritical: false,
  },
  {
    id: 4,
    key: 'mchat_q4',
    question: 'Sua criança gosta de escalar coisas?',
    riskAnswer: 'Não',
    isCritical: false,
  },
  {
    id: 5,
    key: 'mchat_q5',
    question: 'Sua criança faz movimentos incomuns com os dedos perto dos olhos?',
    riskAnswer: 'Sim',
    isCritical: true,
  },
  {
    id: 6,
    key: 'mchat_q6',
    question: 'Sua criança aponta com um dedo para pedir algo ou pedir ajuda?',
    riskAnswer: 'Não',
    isCritical: false,
  },
  {
    id: 7,
    key: 'mchat_q7',
    question: 'Sua criança aponta com um dedo para mostrar algo interessante?',
    riskAnswer: 'Não',
    isCritical: false,
  },
  {
    id: 8,
    key: 'mchat_q8',
    question: 'Sua criança se interessa por outras crianças?',
    riskAnswer: 'Não',
    isCritical: false,
  },
  {
    id: 9,
    key: 'mchat_q9',
    question: 'Sua criança olha nos seus olhos quando você conversa ou brinca com ela?',
    riskAnswer: 'Não',
    isCritical: false,
  },
  {
    id: 10,
    key: 'mchat_q10',
    question: 'Sua criança sorri quando você sorri para ela?',
    riskAnswer: 'Não',
    isCritical: false,
  },
  {
    id: 11,
    key: 'mchat_q11',
    question: 'Sua criança se incomoda com ruídos do dia a dia?',
    riskAnswer: 'Sim',
    isCritical: false,
  },
  { id: 12, key: 'mchat_q12', question: 'Sua criança anda?', riskAnswer: 'Não', isCritical: true },
  {
    id: 13,
    key: 'mchat_q13',
    question:
      'Sua criança olha para seu rosto para verificar sua reação ao enfrentar algo desconhecido?',
    riskAnswer: 'Não',
    isCritical: false,
  },
  {
    id: 14,
    key: 'mchat_q14',
    question: 'Sua criança tenta copiar o que você faz (ex: acenar, bater palmas)?',
    riskAnswer: 'Não',
    isCritical: false,
  },
  {
    id: 15,
    key: 'mchat_q15',
    question:
      'Se você virar a cabeça para olhar algo, sua criança olha ao redor para ver o que você está olhando?',
    riskAnswer: 'Não',
    isCritical: true,
  },
  {
    id: 16,
    key: 'mchat_q16',
    question: 'Sua criança tenta fazer você assistir a ela?',
    riskAnswer: 'Não',
    isCritical: true,
  },
  {
    id: 17,
    key: 'mchat_q17',
    question: 'Sua criança entende quando você diz para fazer algo?',
    riskAnswer: 'Não',
    isCritical: false,
  },
  {
    id: 18,
    key: 'mchat_q18',
    question: 'Se algo novo acontece, sua criança olha para seu rosto?',
    riskAnswer: 'Não',
    isCritical: true,
  },
  {
    id: 19,
    key: 'mchat_q19',
    question: 'Sua criança gosta de atividades de movimento (ser balançada, pular no colo)?',
    riskAnswer: 'Não',
    isCritical: true,
  },
  {
    id: 20,
    key: 'mchat_q20',
    question: 'Sua criança responde quando você chama pelo nome?',
    riskAnswer: 'Não',
    isCritical: true,
  },
]

export const snapivQuestions: SNAPQuestion[] = [
  {
    id: 1,
    key: 'snapiv_q1',
    question: 'Comete erros por descuido nos trabalhos escolares ou outras atividades',
    subscale: 'inattention',
  },
  {
    id: 2,
    key: 'snapiv_q2',
    question: 'Tem dificuldade de manter a atenção em tarefas ou atividades lúdicas',
    subscale: 'inattention',
  },
  {
    id: 3,
    key: 'snapiv_q3',
    question: 'Parece não estar ouvindo quando se fala diretamente com ela',
    subscale: 'inattention',
  },
  {
    id: 4,
    key: 'snapiv_q4',
    question: 'Não segue instruções até o fim e não termina tarefas',
    subscale: 'inattention',
  },
  {
    id: 5,
    key: 'snapiv_q5',
    question: 'Tem dificuldade de organizar tarefas e atividades',
    subscale: 'inattention',
  },
  {
    id: 6,
    key: 'snapiv_q6',
    question: 'Evita ou reluta em se envolver em tarefas que exigem esforço mental',
    subscale: 'inattention',
  },
  {
    id: 7,
    key: 'snapiv_q7',
    question: 'Perde coisas necessárias para tarefas ou atividades',
    subscale: 'inattention',
  },
  {
    id: 8,
    key: 'snapiv_q8',
    question: 'Distrai-se facilmente com estímulos externos',
    subscale: 'inattention',
  },
  {
    id: 9,
    key: 'snapiv_q9',
    question: 'Esquece-se de atividades diárias',
    subscale: 'inattention',
  },
  {
    id: 10,
    key: 'snapiv_q10',
    question: 'Move as mãos ou pés inquietamente ou se remexe na cadeira',
    subscale: 'hyperactivity',
  },
  {
    id: 11,
    key: 'snapiv_q11',
    question: 'Sai do lugar em situações em que se espera que fique sentado',
    subscale: 'hyperactivity',
  },
  {
    id: 12,
    key: 'snapiv_q12',
    question: 'Corre ou escala excessivamente em situações inadequadas',
    subscale: 'hyperactivity',
  },
  {
    id: 13,
    key: 'snapiv_q13',
    question: 'Tem dificuldade em brincar ou se envolver silenciosamente em atividades',
    subscale: 'hyperactivity',
  },
  {
    id: 14,
    key: 'snapiv_q14',
    question: 'Está sempre "a mil" ou age como se fosse impulsionada por um motor',
    subscale: 'hyperactivity',
  },
  { id: 15, key: 'snapiv_q15', question: 'Fala em excesso', subscale: 'hyperactivity' },
  {
    id: 16,
    key: 'snapiv_q16',
    question: 'Responde precipitadamente antes que as perguntas tenham sido completadas',
    subscale: 'hyperactivity',
  },
  {
    id: 17,
    key: 'snapiv_q17',
    question: 'Tem dificuldade de esperar sua vez',
    subscale: 'hyperactivity',
  },
  {
    id: 18,
    key: 'snapiv_q18',
    question: 'Interrompe ou se intromete nos outros',
    subscale: 'hyperactivity',
  },
]

export const snapivScaleLabels = [
  { value: 0, label: 'De modo algum' },
  { value: 1, label: 'Só um pouco' },
  { value: 2, label: 'Bastante' },
  { value: 3, label: 'Muito' },
]

export function getMChatRiskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 8) return 'high'
  if (score >= 3) return 'medium'
  return 'low'
}

export function getSnapivRiskLevel(avg: number): 'low' | 'medium' | 'high' {
  if (avg > 2) return 'high'
  if (avg > 1.5) return 'medium'
  return 'low'
}
