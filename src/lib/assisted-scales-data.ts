/**
 * NeuroFlow — Dados das Escalas em "Aplicação Assistida" (com mediação)
 *
 * Segue o playbook "Aplicação Assistida de Escalas ao Paciente":
 *  - Cada item traz o estímulo em linguagem simples e acolhedora (PT-BR),
 *    adaptado ao paciente.
 *  - Itens que exigem material físico (folha, lápis, figuras) são marcados
 *    com `requiresMaterial` + `materialNote` (orientação ao profissional).
 *  - Itens cujo protocolo permite repetição do estímulo trazem
 *    `allowRepetition` (a repetição é registrada, nunca ocultada).
 *  - Itens que exigem correção manual do profissional (ex.: desenho do
 *    relógio, contagem de palavras no FAS) são marcados com
 *    `requiresManualScoring` → saída sinaliza "[REQUER CORREÇÃO DO
 *    PROFISSIONAL]".
 *  - As chaves (`key`) espelham as `question_key` já usadas pelas escalas
 *    existentes (phq9_q1, moca_trail, meem_q1, ...) para que as respostas
 *    salvos alimentem o motor de laudos (generateNeuropsychReport) e a
 *    interpretação de sessão (getSessionInterpretation) sem retrabalho.
 *
 * REGRAS NÃO NEGOCIÁVEIS (refletidas na interface):
 *  - Nunca usar "diagnóstico" — usar "pontuação compatível com",
 *    "desempenho sugestivo de", "área de atenção".
 *  - Nunca inventar respostas, pontuações ou interpretações.
 *  - Nunca inferir pontuação de itens não respondidos — "[ITEM NÃO APLICADO]".
 *  - Separar sempre: RESPOSTA DO PACIENTE vs PONTUAÇÃO vs INTERPRETAÇÃO.
 */

export type AssistedResponseType = 'likert' | 'points' | 'literal'

export interface AssistedOption {
  value: number
  label: string
  /** Versão falada/acolhedora da opção (lida ao paciente). */
  spoken: string
}

export interface AssistedItem {
  /** Chave idêntica à question_key usada pelas escalas existentes. */
  key: string
  /** Domínio/área avaliada (ex.: "Orientação temporal"). */
  domain: string
  /** Estímulo em linguagem simples e acolhedora, lido ao paciente. */
  stimulus: string
  /** Tipo de resposta esperada. */
  responseType: AssistedResponseType
  /** Opções (modo likert). */
  options?: AssistedOption[]
  /** Pontuação máxima do item (modo points). */
  maxScore?: number
  /** Exige material físico (folha/lápis/figuras/cronômetro). */
  requiresMaterial?: boolean
  /** Orientação ao profissional sobre o material. */
  materialNote?: string
  /** Protocolo permite repetir o estímulo. */
  allowRepetition?: boolean
  /** Exige correção manual do profissional (nunca inferida). */
  requiresManualScoring?: boolean
  /** Texto-base da pausa a cada N itens (controle de ritmo). */
  pauseAfter?: boolean
}

export interface AssistedScale {
  /** Chave normalizada (phq9, moca, meem, clock, fas, phq9, gad7, mchat, snapiv). */
  key: string
  /** Nome do instrumento (técnico, para o registro). */
  name: string
  /** Versão. */
  version: string
  /** Modo de aplicação (ex.: "Aplicação assistida por voz"). */
  applicationMode: string
  /** A quem a escala é aplicada (paciente/responsável). */
  target: 'paciente' | 'responsavel'
  /** Itens na ordem de aplicação. */
  items: AssistedItem[]
  /** Disclaimer curto do instrumento. */
  disclaimer: string
  /** Chave do total armazenado (ex.: "moca_total"). */
  totalKey: string
  /** Pontuação máxima total (para a barra de progresso). */
  maxTotal: number
}

/** Texto canônico do disclaimer do modo assistido (início e fim do registro). */
export const ASSISTED_DISCLAIMER =
  '⚠️ Registro de aplicação assistida por voz. As respostas foram registradas de forma literal, sem inferência, correção ou dica pelo sistema. A pontuação de itens que exigem correção manual permanece sinalizada como "[REQUER CORREÇÃO DO PROFISSIONAL]". Este registro é um instrumento de apoio à decisão clínica e NÃO constitui diagnóstico. Resultados e conclusões devem ser revisados e validados pelo profissional habilitado antes de qualquer uso.'

/** Intervalo (a cada N itens) em que se oferece pausa explícita. */
export const PAUSE_EVERY = 4

/* ----------------------------------------------------------------- */
/* PHQ-9 — leitura assistida ao paciente                              */
/* ----------------------------------------------------------------- */
const PHQ9_OPTIONS: AssistedOption[] = [
  { value: 0, label: 'De modo algum', spoken: 'De modo algum' },
  { value: 1, label: 'Vários dias', spoken: 'Vários dias' },
  { value: 2, label: 'Mais da metade dos dias', spoken: 'Mais da metade dos dias' },
  { value: 3, label: 'Quase todos os dias', spoken: 'Quase todos os dias' },
]

const PHQ9_ITEMS: AssistedItem[] = [
  {
    key: 'phq9_q1',
    domain: 'Humor/Anedonia',
    stimulus:
      'Nas últimas duas semanas, com que frequência você sentiu pouco interesse ou prazer em fazer as coisas que costumava gostar?',
    responseType: 'likert',
    options: PHQ9_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'phq9_q2',
    domain: 'Humor',
    stimulus:
      'Nas últimas duas semanas, com que frequência você se sentiu desanimado, deprimido ou sem esperança?',
    responseType: 'likert',
    options: PHQ9_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'phq9_q3',
    domain: 'Sono',
    stimulus: 'Com que frequência você teve dificuldade para dormir, ou dormiu demais?',
    responseType: 'likert',
    options: PHQ9_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'phq9_q4',
    domain: 'Energia',
    stimulus: 'Com que frequência você se sentiu cansado ou com pouca energia?',
    responseType: 'likert',
    options: PHQ9_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'phq9_q5',
    domain: 'Apetite',
    stimulus: 'Com que frequência você ficou sem apetite ou comeu demais?',
    responseType: 'likert',
    options: PHQ9_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'phq9_q6',
    domain: 'Autoimagem',
    stimulus:
      'Com que frequência você se sentiu mal consigo mesmo, ou sentiu ser um fracasso ou ter decepcionado sua família?',
    responseType: 'likert',
    options: PHQ9_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'phq9_q7',
    domain: 'Concentração',
    stimulus:
      'Com que frequência você teve dificuldade para se concentrar em coisas, como ler o jornal ou ver televisão?',
    responseType: 'likert',
    options: PHQ9_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'phq9_q8',
    domain: 'Psicomotricidade',
    stimulus:
      'Com que frequência você se moveu ou falou tão devagar que outras pessoas notaram? Ou esteve tão inquieto que se mexeu muito mais do que costume?',
    responseType: 'likert',
    options: PHQ9_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'phq9_q9',
    domain: 'Risco',
    stimulus:
      'Com que frequência você pensou que seria melhor estar morto, ou de se machucar de alguma forma?',
    responseType: 'likert',
    options: PHQ9_OPTIONS,
    allowRepetition: true,
    requiresMaterial: false,
  },
]

/* ----------------------------------------------------------------- */
/* GAD-7 — leitura assistida ao paciente                             */
/* ----------------------------------------------------------------- */
const GAD7_OPTIONS = PHQ9_OPTIONS // mesma escala de frequência

const GAD7_ITEMS: AssistedItem[] = [
  {
    key: 'gad7_q1',
    domain: 'Ansiedade',
    stimulus: 'Nas últimas duas semanas, com que frequência você se sentiu nervoso, ansioso ou tenso?',
    responseType: 'likert',
    options: GAD7_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'gad7_q2',
    domain: 'Preocupação',
    stimulus: 'Com que frequência você não conseguiu parar de se preocupar ou controlar a preocupação?',
    responseType: 'likert',
    options: GAD7_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'gad7_q3',
    domain: 'Preocupação',
    stimulus: 'Com que frequência você se preocupou demais com diferentes coisas?',
    responseType: 'likert',
    options: GAD7_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'gad7_q4',
    domain: 'Relaxamento',
    stimulus: 'Com que frequência você teve dificuldade para relaxar?',
    responseType: 'likert',
    options: GAD7_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'gad7_q5',
    domain: 'Inquietação',
    stimulus: 'Com que frequência você esteve tão inquieto que era difícil ficar parado?',
    responseType: 'likert',
    options: GAD7_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'gad7_q6',
    domain: 'Irritabilidade',
    stimulus: 'Com que frequência você ficou facilmente irritado ou aborrecido?',
    responseType: 'likert',
    options: GAD7_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'gad7_q7',
    domain: 'Medo',
    stimulus: 'Com que frequência você sentiu medo como se algo terrível fosse acontecer?',
    responseType: 'likert',
    options: GAD7_OPTIONS,
    allowRepetition: true,
  },
]

/* ----------------------------------------------------------------- */
/* MEEM — mediação ativa (pontos por item)                            */
/* ----------------------------------------------------------------- */
const MEEM_ITEMS: AssistedItem[] = [
  {
    key: 'meem_q1',
    domain: 'Orientação temporal',
    stimulus:
      'Vou pedir que você me diga: qual é o ano, o mês, o dia do mês, o dia da semana e a estação do ano em que estamos.',
    responseType: 'points',
    maxScore: 5,
    allowRepetition: true,
  },
  {
    key: 'meem_q2',
    domain: 'Orientação espacial',
    stimulus:
      'Agora me diga: em qual estado, cidade, bairro, local (nome deste lugar) e andar nós estamos agora.',
    responseType: 'points',
    maxScore: 5,
    allowRepetition: true,
  },
  {
    key: 'meem_q3',
    domain: 'Memória imediata',
    stimulus:
      'Vou dizer três palavras para você guardar. Repita cada uma depois que eu falar: "Laranja", "Cadeira", "Balão". Repita agora.',
    responseType: 'points',
    maxScore: 3,
    allowRepetition: true,
  },
  {
    key: 'meem_q4',
    domain: 'Atenção e cálculo',
    stimulus:
      'Agora peço que você subtraia 7 de 100, e continue subtraindo 7 do resultado, cinco vezes: 100 menos 7…',
    responseType: 'points',
    maxScore: 5,
    allowRepetition: true,
  },
  {
    key: 'meem_q5',
    domain: 'Memória de evocação',
    stimulus: 'Lembra das três palavras que pedi para guardar? Quais eram?',
    responseType: 'points',
    maxScore: 3,
    allowRepetition: false,
    pauseAfter: true,
  },
  {
    key: 'meem_q6',
    domain: 'Linguagem — nomeação',
    stimulus: 'Por favor, me diga o nome deste objeto e deste outro (mostrar relógio e caneta).',
    responseType: 'points',
    maxScore: 2,
    requiresMaterial: true,
    materialNote: 'Profissional: disponibilize um relógio e uma caneta reais para a nomeação.',
    allowRepetition: true,
  },
  {
    key: 'meem_q7',
    domain: 'Linguagem — repetição',
    stimulus: 'Repita comigo, por favor: "Nem aqui, nem ali, nem lá."',
    responseType: 'points',
    maxScore: 1,
    allowRepetition: true,
  },
  {
    key: 'meem_q8',
    domain: 'Linguagem — compreensão',
    stimulus:
      'Pegue esta folha com a mão direita, dobre ao meio e coloque no chão. Vou observar cada etapa.',
    responseType: 'points',
    maxScore: 3,
    requiresMaterial: true,
    materialNote: 'Profissional: entregue uma folha em branco ao paciente.',
    allowRepetition: true,
  },
  {
    key: 'meem_q9',
    domain: 'Linguagem — escrita',
    stimulus: 'Por favor, escreva nesta folha uma frase completa, de sua escolha.',
    responseType: 'points',
    maxScore: 1,
    requiresMaterial: true,
    materialNote: 'Profissional: entregue folha e caneta. A frase deve ter sujeito e verbo.',
    requiresManualScoring: true,
    allowRepetition: true,
  },
  {
    key: 'meem_q10',
    domain: 'Praxia visuoespacial',
    stimulus:
      'Aqui está um desenho. Por favor, copie este desenho exatamente como ele é, na folha.',
    responseType: 'points',
    maxScore: 1,
    requiresMaterial: true,
    materialNote: 'Profissional: apresente a figura de polígonos sobrepostos e entregue folha/lápis.',
    requiresManualScoring: true,
    allowRepetition: true,
  },
]

/* ----------------------------------------------------------------- */
/* MoCA — mediação ativa (pontos por item)                            */
/* ----------------------------------------------------------------- */
const MOCA_ITEMS: AssistedItem[] = [
  {
    key: 'moca_trail',
    domain: 'Visuoespacial/Executivo',
    stimulus:
      'Nesta folha, conecte os pontos alternando números e letras, começando em 1, depois A, 2, B, e assim por diante.',
    responseType: 'points',
    maxScore: 1,
    requiresMaterial: true,
    materialNote: 'Profissional: apresente a folha do Teste de Trilha (1-A-2-B-3-C…).',
    requiresManualScoring: true,
    allowRepetition: true,
  },
  {
    key: 'moca_cube',
    domain: 'Visuoespacial/Executivo',
    stimulus: 'Por favor, copie este cubo desenhado na folha, exatamente como ele aparece.',
    responseType: 'points',
    maxScore: 1,
    requiresMaterial: true,
    materialNote: 'Profissional: apresente o modelo do cubo e entregue folha/lápis.',
    requiresManualScoring: true,
    allowRepetition: true,
  },
  {
    key: 'moca_clock',
    domain: 'Visuoespacial/Executivo',
    stimulus:
      'Desenhe um relógio com todos os números no lugar correto, e coloque os ponteiros marcando 11 e 10.',
    responseType: 'points',
    maxScore: 3,
    requiresMaterial: true,
    materialNote: 'Profissional: entregue folha em branco. Pontuar contorno, números e ponteiros.',
    requiresManualScoring: true,
    allowRepetition: true,
  },
  {
    key: 'moca_lion',
    domain: 'Nomeação',
    stimulus: 'Qual é o nome deste animal? (mostrar figura do leão)',
    responseType: 'points',
    maxScore: 1,
    requiresMaterial: true,
    materialNote: 'Profissional: apresente a figura do leão.',
    allowRepetition: true,
  },
  {
    key: 'moca_rhino',
    domain: 'Nomeação',
    stimulus: 'E este animal? (mostrar figura do rinoceronte)',
    responseType: 'points',
    maxScore: 1,
    requiresMaterial: true,
    materialNote: 'Profissional: apresente a figura do rinoceronte.',
    allowRepetition: true,
  },
  {
    key: 'moca_camel',
    domain: 'Nomeação',
    stimulus: 'E este? (mostrar figura do camelo)',
    responseType: 'points',
    maxScore: 1,
    requiresMaterial: true,
    materialNote: 'Profissional: apresente a figura do camelo.',
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'moca_memory',
    domain: 'Memória (imediata — não pontuada)',
    stimulus:
      'Vou ler uma lista de palavras. Repita cada uma logo depois que eu falar: "Rosto", "Veludo", "Igreja", "Margarida", "Vermelho".',
    responseType: 'points',
    maxScore: 0,
    requiresMaterial: false,
    allowRepetition: true,
  },
  {
    key: 'moca_digits_fwd',
    domain: 'Atenção',
    stimulus: 'Escute com atenção e repita estes números na mesma ordem: 2-1-8-3-6.',
    responseType: 'points',
    maxScore: 1,
    allowRepetition: true,
  },
  {
    key: 'moca_digits_bwd',
    domain: 'Atenção',
    stimulus: 'Agora escute estes números e repita na ordem inversa: 2-4-7-1-8.',
    responseType: 'points',
    maxScore: 1,
    allowRepetition: true,
  },
  {
    key: 'moca_vigilance',
    domain: 'Atenção',
    stimulus:
      'Vou ler uma sequência de letras. Bata na mesa sempre que eu disser a letra A. Atenção, vamos começar.',
    responseType: 'points',
    maxScore: 1,
    requiresMaterial: true,
    materialNote: 'Profissional: leia a sequência de letras ao paciente; observe o toque na mesa.',
    allowRepetition: true,
  },
  {
    key: 'moca_serial7',
    domain: 'Atenção',
    stimulus: 'Subtraia 7 de 100 e continue subtraindo 7 do resultado: 100 menos 7…',
    responseType: 'points',
    maxScore: 3,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'moca_repetition',
    domain: 'Linguagem',
    stimulus: 'Repita esta frase após mim: "Eu só sei que João é o único filho de Maria."',
    responseType: 'points',
    maxScore: 2,
    allowRepetition: true,
  },
  {
    key: 'moca_fluency',
    domain: 'Linguagem/Fluência',
    stimulus:
      'Diga o maior número possível de palavras começando com a letra F em um minuto. Pode começar.',
    responseType: 'points',
    maxScore: 1,
    requiresMaterial: true,
    materialNote: 'Profissional: cronometre 60 segundos. Pontuar se ≥11 palavras válidas.',
    requiresManualScoring: true,
    allowRepetition: false,
  },
  {
    key: 'moca_abs1',
    domain: 'Abstração',
    stimulus: 'O que um trem e uma bicicleta têm em comum?',
    responseType: 'points',
    maxScore: 1,
    allowRepetition: true,
  },
  {
    key: 'moca_abs2',
    domain: 'Abstração',
    stimulus: 'O que um relógio e uma régua têm em comum?',
    responseType: 'points',
    maxScore: 1,
    allowRepetition: true,
  },
  {
    key: 'moca_recall1',
    domain: 'Evocação tardia',
    stimulus: 'Lembra da lista de palavras que pedi para guardar? Qual era a primeira palavra?',
    responseType: 'points',
    maxScore: 1,
    allowRepetition: false,
  },
  {
    key: 'moca_recall2',
    domain: 'Evocação tardia',
    stimulus: 'E a segunda palavra da lista?',
    responseType: 'points',
    maxScore: 1,
    allowRepetition: false,
  },
  {
    key: 'moca_recall3',
    domain: 'Evocação tardia',
    stimulus: 'E a terceira palavra?',
    responseType: 'points',
    maxScore: 1,
    allowRepetition: false,
  },
  {
    key: 'moca_recall4',
    domain: 'Evocação tardia',
    stimulus: 'A quarta palavra?',
    responseType: 'points',
    maxScore: 1,
    allowRepetition: false,
  },
  {
    key: 'moca_recall5',
    domain: 'Evocação tardia',
    stimulus: 'E a quinta e última palavra da lista?',
    responseType: 'points',
    maxScore: 1,
    allowRepetition: false,
    pauseAfter: true,
  },
  {
    key: 'moca_date',
    domain: 'Orientação',
    stimulus: 'Qual é a data de hoje?',
    responseType: 'points',
    maxScore: 1,
    allowRepetition: true,
  },
  {
    key: 'moca_month',
    domain: 'Orientação',
    stimulus: 'Em qual mês estamos?',
    responseType: 'points',
    maxScore: 1,
    allowRepetition: true,
  },
  {
    key: 'moca_year',
    domain: 'Orientação',
    stimulus: 'Em qual ano estamos?',
    responseType: 'points',
    maxScore: 1,
    allowRepetition: true,
  },
  {
    key: 'moca_day',
    domain: 'Orientação',
    stimulus: 'Que dia da semana é hoje?',
    responseType: 'points',
    maxScore: 1,
    allowRepetition: true,
  },
  {
    key: 'moca_place',
    domain: 'Orientação',
    stimulus: 'Onde estamos agora? (nome do lugar ou endereço)',
    responseType: 'points',
    maxScore: 1,
    allowRepetition: true,
  },
  {
    key: 'moca_city',
    domain: 'Orientação',
    stimulus: 'Em qual cidade estamos?',
    responseType: 'points',
    maxScore: 1,
    allowRepetition: true,
  },
]

/* ----------------------------------------------------------------- */
/* Teste do Desenho do Relógio — praxia e função executiva            */
/* ----------------------------------------------------------------- */
const CLOCK_ITEMS: AssistedItem[] = [
  {
    key: 'clock_contour',
    domain: 'Praxia — contorno',
    stimulus:
      'Desenhe um relógio nesta folha. Comece desenhando o contorno (o círculo) do relógio.',
    responseType: 'points',
    maxScore: 2,
    requiresMaterial: true,
    materialNote: 'Profissional: entregue folha em branco e lápis/caneta.',
    requiresManualScoring: true,
    allowRepetition: true,
  },
  {
    key: 'clock_numbers',
    domain: 'Praxia — números',
    stimulus: 'Agora coloque todos os números do relógio nos lugares corretos.',
    responseType: 'points',
    maxScore: 2,
    requiresMaterial: true,
    materialNote: 'Profissional: observe a disposição e a completude dos números (1-12).',
    requiresManualScoring: true,
    allowRepetition: true,
  },
  {
    key: 'clock_hands',
    domain: 'Função executiva — ponteiros',
    stimulus:
      'Agora desenhe os ponteiros marcando 11 horas e 10 minutos. Coloque o ponteiro das horas e o dos minutos.',
    responseType: 'points',
    maxScore: 6,
    requiresMaterial: true,
    materialNote:
      'Profissional: pontuar conforme método de Sunderland (0-10 distribuído). Requer correção manual.',
    requiresManualScoring: true,
    allowRepetition: true,
    pauseAfter: true,
  },
]

/* ----------------------------------------------------------------- */
/* Fluência Verbal — FAS (fonêmica) e Animais (semântica)            */
/* ----------------------------------------------------------------- */
const FAS_ITEMS: AssistedItem[] = [
  {
    key: 'fas_f',
    domain: 'Fluência fonêmica — letra F',
    stimulus:
      'Vou pedir que você diga o maior número de palavras que começam com a letra F. Terá um minuto. Pode começar.',
    responseType: 'literal',
    requiresMaterial: true,
    materialNote: 'Profissional: cronometre 60 segundos. Registre todas as palavras; a contagem é manual.',
    requiresManualScoring: true,
    allowRepetition: false,
  },
  {
    key: 'fas_a',
    domain: 'Fluência fonêmica — letra A',
    stimulus:
      'Agora, palavras que comecem com a letra A. Novamente, um minuto. Pode começar.',
    responseType: 'literal',
    requiresMaterial: true,
    materialNote: 'Profissional: cronometre 60 segundos. Contagem manual de palavras válidas e únicas.',
    requiresManualScoring: true,
    allowRepetition: false,
    pauseAfter: true,
  },
  {
    key: 'fas_s',
    domain: 'Fluência fonêmica — letra S',
    stimulus:
      'Por fim, palavras que comecem com a letra S. Um minuto. Pode começar.',
    responseType: 'literal',
    requiresMaterial: true,
    materialNote: 'Profissional: cronometre 60 segundos. Contagem manual de palavras válidas e únicas.',
    requiresManualScoring: true,
    allowRepetition: false,
  },
  {
    key: 'fas_animals',
    domain: 'Fluência semântica — animais',
    stimulus:
      'Agora, diga o maior número de nomes de animais que conseguir. Tem um minuto. Pode começar.',
    responseType: 'literal',
    requiresMaterial: true,
    materialNote: 'Profissional: cronometre 60 segundos. Contagem manual de animais válidos e únicos.',
    requiresManualScoring: true,
    allowRepetition: false,
  },
]

/* ----------------------------------------------------------------- */
/* M-CHAT-R — aplicação ao responsável                               */
/* ----------------------------------------------------------------- */
const MCHAT_OPTIONS: AssistedOption[] = [
  { value: 1, label: 'Sim', spoken: 'Sim' },
  { value: 0, label: 'Não', spoken: 'Não' },
]

const MCHAT_ITEMS: AssistedItem[] = [
  {
    key: 'mchat_q1',
    domain: 'Interação social',
    stimulus:
      'Se você aponta para algo do outro lado da sala, sua criança olha para isso?',
    responseType: 'likert',
    options: MCHAT_OPTIONS,
    target: 'responsavel',
  } as AssistedItem,
  {
    key: 'mchat_q2',
    domain: 'Comunicação',
    stimulus: 'Você já se perguntou se sua criança é surda?',
    responseType: 'likert',
    options: MCHAT_OPTIONS,
  },
  {
    key: 'mchat_q3',
    domain: 'Simbólico',
    stimulus: 'Sua criança brinca de faz-de-conta ou imagina coisas?',
    responseType: 'likert',
    options: MCHAT_OPTIONS,
  },
  {
    key: 'mchat_q4',
    domain: 'Motor',
    stimulus: 'Sua criança gosta de escalar coisas?',
    responseType: 'likert',
    options: MCHAT_OPTIONS,
  },
  {
    key: 'mchat_q5',
    domain: 'Comportamento repetitivo',
    stimulus: 'Sua criança faz movimentos incomuns com os dedos perto dos olhos?',
    responseType: 'likert',
    options: MCHAT_OPTIONS,
    pauseAfter: true,
  },
  {
    key: 'mchat_q6',
    domain: 'Comunicação instrumental',
    stimulus: 'Sua criança aponta com um dedo para pedir algo ou pedir ajuda?',
    responseType: 'likert',
    options: MCHAT_OPTIONS,
  },
  {
    key: 'mchat_q7',
    domain: 'Atenção compartilhada',
    stimulus: 'Sua criança aponta com um dedo para mostrar algo interessante?',
    responseType: 'likert',
    options: MCHAT_OPTIONS,
  },
  {
    key: 'mchat_q8',
    domain: 'Interação social',
    stimulus: 'Sua criança se interessa por outras crianças?',
    responseType: 'likert',
    options: MCHAT_OPTIONS,
  },
  {
    key: 'mchat_q9',
    domain: 'Contato visual',
    stimulus: 'Sua criança olha nos seus olhos quando você conversa ou brinca com ela?',
    responseType: 'likert',
    options: MCHAT_OPTIONS,
  },
  {
    key: 'mchat_q10',
    domain: 'Afeto',
    stimulus: 'Sua criança sorri quando você sorri para ela?',
    responseType: 'likert',
    options: MCHAT_OPTIONS,
    pauseAfter: true,
  },
  {
    key: 'mchat_q11',
    domain: 'Sensibilidade sensorial',
    stimulus: 'Sua criança se incomoda com ruídos do dia a dia?',
    responseType: 'likert',
    options: MCHAT_OPTIONS,
  },
  {
    key: 'mchat_q12',
    domain: 'Motor',
    stimulus: 'Sua criança anda?',
    responseType: 'likert',
    options: MCHAT_OPTIONS,
  },
  {
    key: 'mchat_q13',
    domain: 'Referência social',
    stimulus:
      'Sua criança olha para seu rosto para verificar sua reação ao enfrentar algo desconhecido?',
    responseType: 'likert',
    options: MCHAT_OPTIONS,
  },
  {
    key: 'mchat_q14',
    domain: 'Imitação',
    stimulus: 'Sua criança tenta copiar o que você faz (ex.: acenar, bater palmas)?',
    responseType: 'likert',
    options: MCHAT_OPTIONS,
  },
  {
    key: 'mchat_q15',
    domain: 'Atenção compartilhada',
    stimulus:
      'Se você virar a cabeça para olhar algo, sua criança olha ao redor para ver o que você está olhando?',
    responseType: 'likert',
    options: MCHAT_OPTIONS,
    pauseAfter: true,
  },
  {
    key: 'mchat_q16',
    domain: 'Atenção compartilhada',
    stimulus: 'Sua criança tenta fazer você assistir a ela?',
    responseType: 'likert',
    options: MCHAT_OPTIONS,
  },
  {
    key: 'mchat_q17',
    domain: 'Compreensão',
    stimulus: 'Sua criança entende quando você diz para fazer algo?',
    responseType: 'likert',
    options: MCHAT_OPTIONS,
  },
  {
    key: 'mchat_q18',
    domain: 'Referência social',
    stimulus: 'Se algo novo acontece, sua criança olha para seu rosto?',
    responseType: 'likert',
    options: MCHAT_OPTIONS,
  },
  {
    key: 'mchat_q19',
    domain: 'Sensibilidade sensorial',
    stimulus: 'Sua criança gosta de atividades de movimento (ser balançada, pular no colo)?',
    responseType: 'likert',
    options: MCHAT_OPTIONS,
  },
  {
    key: 'mchat_q20',
    domain: 'Orientação ao nome',
    stimulus: 'Sua criança responde quando você chama pelo nome?',
    responseType: 'likert',
    options: MCHAT_OPTIONS,
    pauseAfter: true,
  },
]

/* ----------------------------------------------------------------- */
/* SNAP-IV — aplicação ao responsável                                */
/* ----------------------------------------------------------------- */
const SNAPIV_OPTIONS: AssistedOption[] = [
  { value: 0, label: 'De modo algum', spoken: 'De modo algum' },
  { value: 1, label: 'Só um pouco', spoken: 'Só um pouco' },
  { value: 2, label: 'Bastante', spoken: 'Bastante' },
  { value: 3, label: 'Muito', spoken: 'Muito' },
]

const SNAPIV_ITEMS: AssistedItem[] = [
  {
    key: 'snapiv_q1',
    domain: 'Desatenção',
    stimulus: 'Com que frequência a criança comete erros por descuido nos trabalhos escolares ou outras atividades?',
    responseType: 'likert',
    options: SNAPIV_OPTIONS,
  },
  {
    key: 'snapiv_q2',
    domain: 'Desatenção',
    stimulus: 'Com que frequência tem dificuldade de manter a atenção em tarefas ou atividades lúdicas?',
    responseType: 'likert',
    options: SNAPIV_OPTIONS,
  },
  {
    key: 'snapiv_q3',
    domain: 'Desatenção',
    stimulus: 'Com que frequência parece não estar ouvindo quando se fala diretamente com ela?',
    responseType: 'likert',
    options: SNAPIV_OPTIONS,
  },
  {
    key: 'snapiv_q4',
    domain: 'Desatenção',
    stimulus: 'Com que frequência não segue instruções até o fim e não termina tarefas?',
    responseType: 'likert',
    options: SNAPIV_OPTIONS,
    pauseAfter: true,
  },
  {
    key: 'snapiv_q5',
    domain: 'Desatenção',
    stimulus: 'Com que frequência tem dificuldade de organizar tarefas e atividades?',
    responseType: 'likert',
    options: SNAPIV_OPTIONS,
  },
  {
    key: 'snapiv_q6',
    domain: 'Desatenção',
    stimulus: 'Com que frequência evita ou reluta em se envolver em tarefas que exigem esforço mental?',
    responseType: 'likert',
    options: SNAPIV_OPTIONS,
  },
  {
    key: 'snapiv_q7',
    domain: 'Desatenção',
    stimulus: 'Com que frequência perde coisas necessárias para tarefas ou atividades?',
    responseType: 'likert',
    options: SNAPIV_OPTIONS,
  },
  {
    key: 'snapiv_q8',
    domain: 'Desatenção',
    stimulus: 'Com que frequência se distrai facilmente com estímulos externos?',
    responseType: 'likert',
    options: SNAPIV_OPTIONS,
  },
  {
    key: 'snapiv_q9',
    domain: 'Desatenção',
    stimulus: 'Com que frequência esquece-se de atividades diárias?',
    responseType: 'likert',
    options: SNAPIV_OPTIONS,
    pauseAfter: true,
  },
  {
    key: 'snapiv_q10',
    domain: 'Hiperatividade',
    stimulus: 'Com que frequência move as mãos ou pés inquietamente ou se remexe na cadeira?',
    responseType: 'likert',
    options: SNAPIV_OPTIONS,
  },
  {
    key: 'snapiv_q11',
    domain: 'Hiperatividade',
    stimulus: 'Com que frequência sai do lugar em situações em que se espera que fique sentado?',
    responseType: 'likert',
    options: SNAPIV_OPTIONS,
  },
  {
    key: 'snapiv_q12',
    domain: 'Hiperatividade',
    stimulus: 'Com que frequência corre ou escala excessivamente em situações inadequadas?',
    responseType: 'likert',
    options: SNAPIV_OPTIONS,
  },
  {
    key: 'snapiv_q13',
    domain: 'Hiperatividade',
    stimulus: 'Com que frequência tem dificuldade em brincar ou se envolver silenciosamente em atividades?',
    responseType: 'likert',
    options: SNAPIV_OPTIONS,
    pauseAfter: true,
  },
  {
    key: 'snapiv_q14',
    domain: 'Hiperatividade',
    stimulus: 'Com que frequência está sempre "a mil" ou age como se fosse impulsionada por um motor?',
    responseType: 'likert',
    options: SNAPIV_OPTIONS,
  },
  {
    key: 'snapiv_q15',
    domain: 'Hiperatividade',
    stimulus: 'Com que frequência fala em excesso?',
    responseType: 'likert',
    options: SNAPIV_OPTIONS,
  },
  {
    key: 'snapiv_q16',
    domain: 'Impulsividade',
    stimulus: 'Com que frequência responde precipitadamente antes que as perguntas tenham sido completadas?',
    responseType: 'likert',
    options: SNAPIV_OPTIONS,
  },
  {
    key: 'snapiv_q17',
    domain: 'Impulsividade',
    stimulus: 'Com que frequência tem dificuldade de esperar sua vez?',
    responseType: 'likert',
    options: SNAPIV_OPTIONS,
  },
  {
    key: 'snapiv_q18',
    domain: 'Impulsividade',
    stimulus: 'Com que frequência interrompe ou se intromete nos outros?',
    responseType: 'likert',
    options: SNAPIV_OPTIONS,
    pauseAfter: true,
  },
]

/* ----------------------------------------------------------------- */
/* Registro consolidado das escalas assistidas                       */
/* ----------------------------------------------------------------- */
export const ASSISTED_SCALES: Record<string, AssistedScale> = {
  phq9: {
    key: 'phq9',
    name: 'Patient Health Questionnaire-9 (PHQ-9)',
    version: 'Versão brasileira',
    applicationMode: 'Leitura assistida por voz ao paciente',
    target: 'paciente',
    items: PHQ9_ITEMS,
    disclaimer:
      'O PHQ-9 é instrumento de triagem de indicadores depressivos. Não constitui diagnóstico.',
    totalKey: 'phq9_total',
    maxTotal: 27,
  },
  gad7: {
    key: 'gad7',
    name: 'Generalized Anxiety Disorder-7 (GAD-7)',
    version: 'Versão brasileira',
    applicationMode: 'Leitura assistida por voz ao paciente',
    target: 'paciente',
    items: GAD7_ITEMS,
    disclaimer:
      'O GAD-7 é instrumento de triagem de indicadores ansiosos. Não constitui diagnóstico.',
    totalKey: 'gad7_total',
    maxTotal: 21,
  },
  meem: {
    key: 'meem',
    name: 'Mini Exame do Estado Mental (MEEM)',
    version: 'Folstein et al., adaptado',
    applicationMode: 'Aplicação assistida por voz com mediação ativa',
    target: 'paciente',
    items: MEEM_ITEMS,
    disclaimer:
      'O MEEM é instrumento de triagem cognitiva. Pontuação < 24 sugere área de atenção. Não substitui avaliação neuropsicológica formal.',
    totalKey: 'meem_total',
    maxTotal: 30,
  },
  moca: {
    key: 'moca',
    name: 'Montreal Cognitive Assessment (MoCA)',
    version: 'Versão 7.1 (brasileira)',
    applicationMode: 'Aplicação assistida por voz com mediação ativa',
    target: 'paciente',
    items: MOCA_ITEMS,
    disclaimer:
      'O MoCA é instrumento de triagem cognitiva. Pontuação < 26 sugere área de atenção. Não substitui avaliação neuropsicológica formal.',
    totalKey: 'moca_total',
    maxTotal: 30,
  },
  clock: {
    key: 'clock',
    name: 'Teste do Desenho do Relógio',
    version: 'Método de Sunderland (0–10)',
    applicationMode: 'Aplicação assistida por voz com mediação ativa (material físico)',
    target: 'paciente',
    items: CLOCK_ITEMS,
    disclaimer:
      'O Teste do Desenho do Relógio avalia praxia construtiva e função executiva. A pontuação requer correção manual do profissional.',
    totalKey: 'clock_total',
    maxTotal: 10,
  },
  fas: {
    key: 'fas',
    name: 'Teste de Fluência Verbal (FAS + Animais)',
    version: 'Fonêmica (FAS) e semântica (Animais)',
    applicationMode: 'Aplicação assistida por voz com cronometragem',
    target: 'paciente',
    items: FAS_ITEMS,
    disclaimer:
      'O teste de fluência verbal avalia função executiva e linguagem. A pontuação requer contagem manual de palavras válidas e únicas.',
    totalKey: 'fas_total',
    maxTotal: 0, // não há ponto de corte universal fixo — requer correção manual
  },
  mchat: {
    key: 'mchat',
    name: 'Modified Checklist for Autism in Toddlers, Revised (M-CHAT-R)',
    version: 'Versão brasileira (23 itens críticos)',
    applicationMode: 'Aplicação assistida por voz ao responsável',
    target: 'responsavel',
    items: MCHAT_ITEMS,
    disclaimer:
      'O M-CHAT-R é instrumento de triagem de risco para o espectro autista. Não constitui diagnóstico.',
    totalKey: 'mchat_total',
    maxTotal: 20,
  },
  snapiv: {
    key: 'snapiv',
    name: 'Swanson, Nolan and Pelham (SNAP-IV)',
    version: 'Versão brasileira (18 itens)',
    applicationMode: 'Aplicação assistida por voz ao responsável',
    target: 'responsavel',
    items: SNAPIV_ITEMS,
    disclaimer:
      'O SNAP-IV é instrumento de triagem de indicadores de TDAH. Não constitui diagnóstico.',
    totalKey: 'snapiv_total',
    maxTotal: 54,
  },
}

/** Lista das chaves de escala que suportam o modo assistido. */
export const ASSISTED_SCALE_KEYS = Object.keys(ASSISTED_SCALES)

/**
 * Normaliza o `scale_type` (que pode vir como "PHQ-9", "MoCA", etc.) para a
 * chave canônica usada em ASSISTED_SCALES.
 */
export function normalizeAssistedScaleType(raw: string | undefined): string | null {
  if (!raw) return null
  const lower = raw.toLowerCase().trim()
  if (lower === 'phq-9' || lower === 'phq9' || lower === 'phq') return 'phq9'
  if (lower === 'gad-7' || lower === 'gad7' || lower === 'gad') return 'gad7'
  if (lower === 'meem' || lower === 'mini mental' || lower === 'mini-mental') return 'meem'
  if (lower === 'moca' || lower === 'montreal cognitive assessment') return 'moca'
  if (lower === 'clock' || lower === 'desenho do relogio' || lower === 'relogio') return 'clock'
  if (lower === 'fas' || lower === 'fluencia verbal') return 'fas'
  if (lower === 'm-chat' || lower === 'mchat' || lower === 'mchat-r') return 'mchat'
  if (lower === 'snap-iv' || lower === 'snapiv' || lower === 'snap iv') return 'snapiv'
  return null
}

/** Rótulo amigável da escala para o painel admin. */
export function getAssistedScaleLabel(key: string): string {
  return ASSISTED_SCALES[key]?.name ?? key
}
