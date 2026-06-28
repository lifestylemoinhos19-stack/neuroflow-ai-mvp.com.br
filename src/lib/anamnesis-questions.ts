export type QuestionType = 'free-text' | 'multiple-choice' | 'likert-scale'

export interface AnamnesisQuestion {
  key: string
  type: QuestionType
  label: string
  description?: string
  placeholder?: string
  maxLength?: number
  choices?: string[]
  likertMin?: number
  likertMax?: number
  likertMinLabel?: string
  likertMaxLabel?: string
  protocol?: string
}

export const anamnesisQuestions: AnamnesisQuestion[] = [
  {
    key: 'chief_complaint',
    type: 'free-text',
    label: 'Descreva a queixa principal do paciente',
    description:
      'Forneça uma descrição detalhada dos motivos da consulta, incluindo sintomas iniciais e duração.',
    placeholder: 'Ex: Dificuldade de concentração na escola há aproximadamente 6 meses...',
    maxLength: 1000,
    protocol: 'Anamnese Geral',
  },
  {
    key: 'developmental_history',
    type: 'free-text',
    label: 'Histórico de desenvolvimento',
    description:
      'Descreva marcos do desenvolvimento (motor, linguagem, social) e quaisquer atrasos observados.',
    placeholder:
      'Ex: A criança começou a andar aos 14 meses, falou primeiras palavras aos 18 meses...',
    maxLength: 1000,
    protocol: 'Anamnese Geral',
  },
  {
    key: 'mchat_q1',
    type: 'likert-scale',
    label: 'A criança gosta de ser balançada ou colocada no colo para brincar?',
    description: 'M-CHAT-R - Questão 1',
    likertMin: 1,
    likertMax: 5,
    likertMinLabel: 'Nunca',
    likertMaxLabel: 'Sempre',
    protocol: 'M-CHAT-R',
  },
  {
    key: 'mchat_q2',
    type: 'likert-scale',
    label: 'A criança tem interesse em outras crianças?',
    description: 'M-CHAT-R - Questão 2',
    likertMin: 1,
    likertMax: 5,
    likertMinLabel: 'Nenhum',
    likertMaxLabel: 'Muito',
    protocol: 'M-CHAT-R',
  },
  {
    key: 'snapiv_inattention',
    type: 'likert-scale',
    label:
      'Com que frequência a criança tem dificuldade em manter a atenção em tarefas ou atividades?',
    description: 'SNAP-IV - Desatenção',
    likertMin: 1,
    likertMax: 5,
    likertMinLabel: 'Nunca',
    likertMaxLabel: 'Muito Frequentemente',
    protocol: 'SNAP-IV',
  },
  {
    key: 'snapiv_hyperactivity',
    type: 'likert-scale',
    label: 'Com que frequência a criança se move excessivamente ou parece incapaz de ficar parada?',
    description: 'SNAP-IV - Hiperatividade',
    likertMin: 1,
    likertMax: 5,
    likertMinLabel: 'Nunca',
    likertMaxLabel: 'Muito Frequentemente',
    protocol: 'SNAP-IV',
  },
  {
    key: 'family_history',
    type: 'multiple-choice',
    label: 'Há histórico familiar de transtornos do neurodesenvolvimento?',
    description: 'Selecione a opção que melhor descreve a situação familiar.',
    choices: [
      'Sim - TEA (Transtorno do Espectro Autista)',
      'Sim - TDAH (Transtorno de Déficit de Atenção e Hiperatividade)',
      'Sim - Outros transtornos neurodesenvolvimentais',
      'Sim - Múltiplas condições',
      'Não há histórico conhecido',
      'Prefiro não responder',
    ],
    protocol: 'Anamnese Geral',
  },
  {
    key: 'current_interventions',
    type: 'multiple-choice',
    label: 'Quais intervenções ou tratamentos a criança já realizou ou realiza atualmente?',
    description: 'Selecione a opção mais relevante.',
    choices: [
      'Fonoaudiologia',
      'Terapia Ocupacional',
      'Psicoterapia',
      'Psicopedagogia',
      'Medicação',
      'Nenhuma intervenção anterior',
      'Outro',
    ],
    protocol: 'Anamnese Geral',
  },
  {
    key: 'additional_notes',
    type: 'free-text',
    label: 'Observações adicionais',
    description:
      'Adicione qualquer informação relevante que não foi abordada nas perguntas anteriores.',
    placeholder:
      'Ex: A criança apresenta sensibilidade a sons altos e prefere rotinas estruturadas...',
    maxLength: 500,
    protocol: 'Anamnese Geral',
  },
]
