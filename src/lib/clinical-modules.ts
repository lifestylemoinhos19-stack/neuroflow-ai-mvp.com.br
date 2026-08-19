export interface ScaleInfo {
  key: string
  name: string
  purpose: string
  targetAudience: string
  estimatedTime: string
  route: string | null
  available: boolean
  /** Categoria clínica do módulo (ex.: neurodesenvolvimento, cognição). */
  category?: string
}

export interface ClinicalModule {
  id: string
  title: string
  description: string
  scales: ScaleInfo[]
}

export const clinicalModules: ClinicalModule[] = [
  {
    id: 'autismo-tea',
    title: 'Autismo (TEA)',
    description: 'Triagem e avaliação de sinais do Transtorno do Espectro Autista.',
    scales: [
      {
        key: 'mchat-r',
        name: 'M-CHAT-R',
        purpose:
          'Triagem precoce para autismo em crianças pequenas através de 20 questões sobre comportamento social e comunicativo.',
        targetAudience: 'Pais/Cuidadores de crianças de 16 a 30 meses',
        estimatedTime: '5-10 min',
        route: '/scales',
        available: true,
      },
      {
        key: 'assq',
        name: 'ASSQ',
        purpose:
          'Triagem de traços do espectro autista em crianças em idade escolar e adolescentes.',
        targetAudience: 'Pais/Professores de crianças de 6 a 17 anos',
        estimatedTime: '10-15 min',
        route: '/avaliacao/assq',
        available: true,
      },
    ],
  },
  {
    id: 'desenvolvimento',
    title: 'Transtornos do Desenvolvimento',
    description: 'Avaliação de marcos do desenvolvimento e funções cognitivas.',
    scales: [
      {
        key: 'milestones',
        name: 'Marcos do Desenvolvimento',
        purpose:
          'Avaliação dos marcos do desenvolvimento motor, social e cognitivo da criança em diferentes faixas etárias (0-6 anos), baseada nos marcos do CDC.',
        targetAudience: 'Pais/Cuidadores de crianças de 0 a 6 anos',
        estimatedTime: '10-15 min',
        route: '/avaliacao/marcos-desenvolvimento',
        available: true,
        category: 'neurodesenvolvimento',
      },
      {
        key: 'cognitive-evaluation',
        name: 'Avaliação Cognitiva',
        purpose:
          'Triagem cognitiva complementar (memória, atenção, funções executivas, linguagem e orientação) que integra MoCA, MEEM e a Triagem Cognitiva NeuroFlow (0-30 pontos).',
        targetAudience: 'Adolescentes e Adultos',
        estimatedTime: '15-20 min',
        route: '/avaliacao/triagem-cognitiva',
        available: true,
        category: 'cognicao',
      },
    ],
  },
  {
    id: 'tdah',
    title: 'TDAH',
    description: 'Triagem e avaliação do Transtorno de Déficit de Atenção e Hiperatividade.',
    scales: [
      {
        key: 'snap-iv',
        name: 'SNAP-IV',
        purpose:
          'Avaliação de sintomas de desatenção e hiperatividade/impulsividade baseada nos critérios do DSM-5.',
        targetAudience: 'Pais/Professores de crianças e adolescentes',
        estimatedTime: '5-10 min',
        route: '/scales',
        available: true,
      },
      {
        key: 'asrs-18',
        name: 'ASRS-18',
        purpose:
          'Triagem de TDAH em adultos através de 18 questões sobre frequência de comportamentos relacionados à atenção e hiperatividade.',
        targetAudience: 'Adultos (18+ anos)',
        estimatedTime: '5-10 min',
        route: '/avaliacao/asrs18',
        available: true,
      },
    ],
  },
  {
    id: 'outras-patologias',
    title: 'Outras Patologias',
    description: 'Triagem para depressão, ansiedade, comportamentos compulsivos e dependência.',
    scales: [
      {
        key: 'phq9',
        name: 'PHQ-9',
        purpose:
          'Triagem e avaliação da gravidade da depressão major nos últimos 14 dias através de 9 questões.',
        targetAudience: 'Adolescentes e Adultos',
        estimatedTime: '3-5 min',
        route: '/evaluations/phq9',
        available: true,
      },
      {
        key: 'gad7',
        name: 'GAD-7',
        purpose:
          'Triagem do transtorno de ansiedade generalizada nos últimos 14 dias através de 7 questões.',
        targetAudience: 'Adolescentes e Adultos',
        estimatedTime: '3-5 min',
        route: '/evaluations/gad7',
        available: true,
      },
      {
        key: 'ybocs',
        name: 'Y-BOCS',
        purpose:
          'Avaliação da gravidade de sintomas obsessivo-compulsivos e monitoramento da resposta ao tratamento.',
        targetAudience: 'Adultos',
        estimatedTime: '10-15 min',
        route: '/ybocs-assessment',
        available: true,
      },
      {
        key: 'sds',
        name: 'SDS',
        purpose:
          'Avaliação da severidade da dependência de substâncias psicoativas nos últimos 12 meses.',
        targetAudience: 'Adultos',
        estimatedTime: '5-10 min',
        route: '/evaluations/sds',
        available: true,
      },
      {
        key: 'moca',
        name: 'MoCA',
        purpose:
          'Avaliação cognitiva geral (Montreal Cognitive Assessment) cobrindo visuo-espacial, nomeação, memória, atenção, linguagem, abstração, evocação e orientação.',
        targetAudience: 'Adultos/Idosos com queixas cognitivas',
        estimatedTime: '10-15 min',
        route: '/evaluations/moca',
        available: true,
      },
      {
        key: 'ftdrs',
        name: 'FTDRS',
        purpose:
          'Escala de avaliação específica para Demência Frontotemporal, focando em mudanças comportamentais e funcionais características.',
        targetAudience: 'Pacientes com suspeita de variantes comportamentais/linguagem de FTD',
        estimatedTime: '15-20 min',
        route: '/evaluations/ftdrs',
        available: true,
      },
      {
        key: 'fas',
        name: 'FAS',
        purpose:
          'Teste de fluência verbal que avalia função executiva frontal e capacidade de geração de palavras iniciadas com as letras F, A e S.',
        targetAudience: 'Adultos/Idosos',
        estimatedTime: '5 min',
        route: '/evaluations/fas',
        available: true,
      },
      {
        key: 'mini-5',
        name: 'MINI 5.0.0',
        purpose:
          'Entrevista diagnóstica breve para triagem dos principais transtornos psiquiátricos do eixo I do DSM.',
        targetAudience: 'Adultos',
        estimatedTime: '15-20 min',
        route: '/mini-interview',
        available: true,
      },
    ],
  },
]
