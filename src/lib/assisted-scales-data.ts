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
    stimulus:
      'Nas últimas duas semanas, com que frequência você se sentiu nervoso, ansioso ou tenso?',
    responseType: 'likert',
    options: GAD7_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'gad7_q2',
    domain: 'Preocupação',
    stimulus:
      'Com que frequência você não conseguiu parar de se preocupar ou controlar a preocupação?',
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
    materialNote:
      'Profissional: apresente a figura de polígonos sobrepostos e entregue folha/lápis.',
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
/* Trail Making Test (TMT A/B) — Partes A e B cronometradas         */
/* ----------------------------------------------------------------- */
const TMT_ITEMS: AssistedItem[] = [
  {
    key: 'tmt_a_time',
    domain: 'TMT Parte A — Atenção visual e velocidade psicomotora (segundos)',
    stimulus:
      'No Trail Making Test Parte A, você deve conectar os círculos numerados em ordem crescente (1 a 25) o mais rápido possível sem tirar o lápis do papel. Teremos cronometragem em segundos. Pode começar quando estiver pronto.',
    responseType: 'literal',
    requiresMaterial: true,
    materialNote:
      'Profissional: cronometre o tempo total em SEGUNDOS e conte os erros cometidos. Corte: ≤29s preservado, 30-78s limítrofe, >78s lentificação significativa.',
    requiresManualScoring: true,
    allowRepetition: false,
  },
  {
    key: 'tmt_b_time',
    domain: 'TMT Parte B — Flexibilidade cognitiva e alternância executiva (segundos)',
    stimulus:
      'No Trail Making Test Parte B, você deve alternar entre números e letras em ordem: 1-A-2-B-3-C até o final, o mais rápido possível. Cronometre em segundos. Pode começar.',
    responseType: 'literal',
    requiresMaterial: true,
    materialNote:
      'Profissional: cronometre em SEGUNDOS e registre erros. Corte: ≤75s preservado, 76-272s lentificação leve/moderada, >272s déficit executivo.',
    requiresManualScoring: true,
    allowRepetition: false,
    pauseAfter: true,
  },
]

/* ----------------------------------------------------------------- */
/* Fluência Verbal Semântica — Animais e Frutas (60s cada)           */
/* ----------------------------------------------------------------- */
const SEMANTIC_FLUENCY_ITEMS: AssistedItem[] = [
  {
    key: 'fluencia_animais',
    domain: 'Fluência Semântica — Categoria Animais (60 segundos)',
    stimulus:
      'Diga o maior número de nomes de ANIMAIS que você conseguir em 60 segundos. Não repita. Pode começar.',
    responseType: 'literal',
    requiresMaterial: true,
    materialNote:
      'Profissional: cronometre 60s exatos. Conte palavras válidas únicas (>15 preservado, 12-14 limítrofe, <12 rebaixado).',
    requiresManualScoring: true,
    allowRepetition: false,
  },
  {
    key: 'fluencia_frutas',
    domain: 'Fluência Semântica — Categoria Frutas (60 segundos)',
    stimulus:
      'Agora, diga o maior número de nomes de FRUTAS que conseguir em 60 segundos. Não repita. Pode começar.',
    responseType: 'literal',
    requiresMaterial: true,
    materialNote:
      'Profissional: cronometre 60s exatos. Conte palavras válidas únicas (>12 preservado, 9-11 limítrofe, <9 rebaixado).',
    requiresManualScoring: true,
    allowRepetition: false,
    pauseAfter: true,
  },
]

/* ----------------------------------------------------------------- */
/* Fluência Verbal Fonêmica — FAS (letras F, A, S)                   */
/* ----------------------------------------------------------------- */
const FAS_ITEMS: AssistedItem[] = [
  {
    key: 'fas_f',
    domain: 'Fluência fonêmica — letra F',
    stimulus:
      'Vou pedir que você diga o maior número de palavras que começam com a letra F. Terá um minuto. Pode começar.',
    responseType: 'literal',
    requiresMaterial: true,
    materialNote:
      'Profissional: cronometre 60 segundos. Registre todas as palavras; a contagem é manual.',
    requiresManualScoring: true,
    allowRepetition: false,
  },
  {
    key: 'fas_a',
    domain: 'Fluência fonêmica — letra A',
    stimulus: 'Agora, palavras que comecem com a letra A. Novamente, um minuto. Pode começar.',
    responseType: 'literal',
    requiresMaterial: true,
    materialNote:
      'Profissional: cronometre 60 segundos. Contagem manual de palavras válidas e únicas.',
    requiresManualScoring: true,
    allowRepetition: false,
    pauseAfter: true,
  },
  {
    key: 'fas_s',
    domain: 'Fluência fonêmica — letra S',
    stimulus: 'Por fim, palavras que comecem com a letra S. Um minuto. Pode começar.',
    responseType: 'literal',
    requiresMaterial: true,
    materialNote:
      'Profissional: cronometre 60 segundos. Contagem manual de palavras válidas e únicas.',
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
    materialNote:
      'Profissional: cronometre 60 segundos. Contagem manual de animais válidos e únicos.',
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
    stimulus: 'Se você aponta para algo do outro lado da sala, sua criança olha para isso?',
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
    stimulus:
      'Com que frequência a criança comete erros por descuido nos trabalhos escolares ou outras atividades?',
    responseType: 'likert',
    options: SNAPIV_OPTIONS,
  },
  {
    key: 'snapiv_q2',
    domain: 'Desatenção',
    stimulus:
      'Com que frequência tem dificuldade de manter a atenção em tarefas ou atividades lúdicas?',
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
    stimulus:
      'Com que frequência evita ou reluta em se envolver em tarefas que exigem esforço mental?',
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
    stimulus:
      'Com que frequência tem dificuldade em brincar ou se envolver silenciosamente em atividades?',
    responseType: 'likert',
    options: SNAPIV_OPTIONS,
    pauseAfter: true,
  },
  {
    key: 'snapiv_q14',
    domain: 'Hiperatividade',
    stimulus:
      'Com que frequência está sempre "a mil" ou age como se fosse impulsionada por um motor?',
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
    stimulus:
      'Com que frequência responde precipitadamente antes que as perguntas tenham sido completadas?',
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
/* ----------------------------------------------------------------- */
/* BDI-II — Leitura assistida ao paciente (21 itens)                 */
/* ----------------------------------------------------------------- */
const BDI_ASSISTED_ITEMS: AssistedItem[] = [
  {
    key: 'bdi_q1',
    domain: 'Humor/Tristeza',
    stimulus:
      'Nas últimas duas semanas, incluindo hoje, como você tem se sentido em relação à tristeza? (0: Não me sinto triste; 1: Me sinto triste na maior parte do tempo; 2: Estou sempre triste; 3: Tão triste que não suporto).',
    responseType: 'likert',
    options: [
      { value: 0, label: '0 - Não me sinto triste', spoken: 'Não me sinto triste' },
      {
        value: 1,
        label: '1 - Triste na maior parte do tempo',
        spoken: 'Triste na maior parte do tempo',
      },
      { value: 2, label: '2 - Sempre triste', spoken: 'Sempre triste' },
      { value: 3, label: '3 - Tão triste que não suporto', spoken: 'Tão triste que não suporto' },
    ],
    allowRepetition: true,
  },
  {
    key: 'bdi_q2',
    domain: 'Pessimismo/Futuro',
    stimulus:
      'Como você tem se sentido em relação ao seu futuro? (0: Não desanimado; 1: Mais desanimado que antes; 2: Não espero que nada dê certo; 3: Sem esperança, só vai piorar).',
    responseType: 'likert',
    options: [
      { value: 0, label: '0 - Não desanimado com o futuro', spoken: 'Não desanimado' },
      { value: 1, label: '1 - Mais desanimado que antes', spoken: 'Mais desanimado que antes' },
      { value: 2, label: '2 - Não espero que dê certo', spoken: 'Não espero que dê certo' },
      { value: 3, label: '3 - Sem esperança no futuro', spoken: 'Sem esperança no futuro' },
    ],
    allowRepetition: true,
  },
  {
    key: 'bdi_q3',
    domain: 'Fracasso passado',
    stimulus:
      'Você tem sentido que é um fracasso? (0: Não me sinto fracassado; 1: Fracassei mais do que deveria; 2: Vejo muitos fracassos; 3: Sou um fracasso total).',
    responseType: 'likert',
    options: [
      { value: 0, label: '0 - Não me sinto fracassado', spoken: 'Não me sinto fracassado' },
      { value: 1, label: '1 - Fracassei mais que o normal', spoken: 'Fracassei mais que o normal' },
      { value: 2, label: '2 - Vejo muitos fracassos atrás', spoken: 'Vejo muitos fracassos' },
      { value: 3, label: '3 - Fracasso total como pessoa', spoken: 'Fracasso total' },
    ],
    allowRepetition: true,
  },
  {
    key: 'bdi_q4',
    domain: 'Perda de prazer',
    stimulus:
      'Quanto prazer você tem sentido nas coisas que costumava gostar? (0: O mesmo prazer; 1: Menos prazer que antes; 2: Muito pouco prazer; 3: Nenhum prazer).',
    responseType: 'likert',
    options: [
      { value: 0, label: '0 - Mesmo prazer de sempre', spoken: 'Mesmo prazer de sempre' },
      { value: 1, label: '1 - Não sinto tanto prazer', spoken: 'Não sinto tanto prazer' },
      { value: 2, label: '2 - Muito pouco prazer', spoken: 'Muito pouco prazer' },
      { value: 3, label: '3 - Não tenho prazer em nada', spoken: 'Não tenho prazer em nada' },
    ],
    allowRepetition: true,
  },
  {
    key: 'bdi_q5',
    domain: 'Culpa',
    stimulus:
      'Você tem sentido culpa? (0: Não particularmente; 1: Culpado por muitas coisas; 2: Bastante culpado quase sempre; 3: Constantemente culpado).',
    responseType: 'likert',
    options: [
      { value: 0, label: '0 - Sem sentimento de culpa', spoken: 'Sem culpa' },
      { value: 1, label: '1 - Culpado por muitas coisas', spoken: 'Culpado por muitas coisas' },
      {
        value: 2,
        label: '2 - Culpado na maior parte do tempo',
        spoken: 'Culpado na maior parte do tempo',
      },
      { value: 3, label: '3 - Constantemente culpado', spoken: 'Constantemente culpado' },
    ],
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'bdi_q6',
    domain: 'Punição',
    stimulus:
      'Você sente que está sendo ou será punido? (0: Não sinto punição; 1: Posso ser punido; 2: Espero ser punido; 3: Sinto que estou sendo punido).',
    responseType: 'likert',
    options: [
      { value: 0, label: '0 - Não sinto que serei punido', spoken: 'Não sinto punição' },
      { value: 1, label: '1 - Sinto que posso ser punido', spoken: 'Posso ser punido' },
      { value: 2, label: '2 - Espero ser punido', spoken: 'Espero ser punido' },
      { value: 3, label: '3 - Sinto que estou sendo punido', spoken: 'Estou sendo punido' },
    ],
    allowRepetition: true,
  },
  {
    key: 'bdi_q7',
    domain: 'Autoestima',
    stimulus:
      'Como você se sente sobre si mesmo? (0: Da mesma forma que antes; 1: Perdi a confiança em mim; 2: Decepcionado comigo mesmo; 3: Não gosto de mim / Eu me odeio).',
    responseType: 'likert',
    options: [
      { value: 0, label: '0 - Mesmo sentimento sobre mim', spoken: 'Mesmo sentimento sobre mim' },
      { value: 1, label: '1 - Perdi a confiança em mim', spoken: 'Perdi a confiança' },
      { value: 2, label: '2 - Decepcionado comigo mesmo', spoken: 'Decepcionado comigo' },
      { value: 3, label: '3 - Eu me odeio / não gosto de mim', spoken: 'Eu me odeio' },
    ],
    allowRepetition: true,
  },
  {
    key: 'bdi_q8',
    domain: 'Autocrítica',
    stimulus:
      'Você tem se criticado ou culpado? (0: Não mais que o habitual; 1: Mais crítico que antes; 2: Critico todos os meus defeitos; 3: Me culpo por tudo de ruim).',
    responseType: 'likert',
    options: [
      {
        value: 0,
        label: '0 - Não me critico mais que antes',
        spoken: 'Não me critico mais que antes',
      },
      { value: 1, label: '1 - Mais crítico que antes', spoken: 'Mais crítico que antes' },
      {
        value: 2,
        label: '2 - Critico todos os meus defeitos',
        spoken: 'Critico todos meus defeitos',
      },
      { value: 3, label: '3 - Me culpo por tudo de ruim', spoken: 'Me culpo por tudo de ruim' },
    ],
    allowRepetition: true,
  },
  {
    key: 'bdi_q9',
    domain: 'Ideação Suicida (Risco)',
    stimulus:
      'Você tem tido pensamentos sobre suicídio ou morte? (0: Nenhum pensamento; 1: Pensamentos sem intenção; 2: Gostaria de me matar; 3: Me mataria se pudesse).',
    responseType: 'likert',
    options: [
      { value: 0, label: '0 - Sem pensamentos suicidas', spoken: 'Sem pensamentos suicidas' },
      {
        value: 1,
        label: '1 - Pensamentos mas não levaria a cabo',
        spoken: 'Pensamentos sem intenção',
      },
      { value: 2, label: '2 - Gostaria de me matar', spoken: 'Gostaria de me matar' },
      {
        value: 3,
        label: '3 - Me mataria se tivesse chance',
        spoken: 'Me mataria se tivesse chance',
      },
    ],
    allowRepetition: true,
  },
  {
    key: 'bdi_q10',
    domain: 'Choro',
    stimulus:
      'Você tem chorado mais que o habitual? (0: Não mais que antes; 1: Choro mais agora; 2: Choro por qualquer coisa; 3: Quero chorar mas não consigo).',
    responseType: 'likert',
    options: [
      { value: 0, label: '0 - Não choro mais que antes', spoken: 'Não choro mais que antes' },
      { value: 1, label: '1 - Choro mais agora', spoken: 'Choro mais agora' },
      { value: 2, label: '2 - Choro por qualquer coisa', spoken: 'Choro por qualquer coisa' },
      { value: 3, label: '3 - Quero chorar e não consigo', spoken: 'Quero chorar e não consigo' },
    ],
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'bdi_q11',
    domain: 'Agitação',
    stimulus:
      'Tem se sentido agitado ou inquieto? (0: Não mais que o habitual; 1: Mais inquieto que o normal; 2: Difícil ficar parado; 3: Agitado demais, tenho que me mexer o tempo todo).',
    responseType: 'likert',
    options: [
      { value: 0, label: '0 - Inquietação normal', spoken: 'Inquietação normal' },
      { value: 1, label: '1 - Mais inquieto que o habitual', spoken: 'Mais inquieto' },
      { value: 2, label: '2 - Difícil ficar parado', spoken: 'Difícil ficar parado' },
      {
        value: 3,
        label: '3 - Preciso me mexer o tempo todo',
        spoken: 'Preciso me mexer o tempo todo',
      },
    ],
    allowRepetition: true,
  },
  {
    key: 'bdi_q12',
    domain: 'Interesse',
    stimulus:
      'Como está seu interesse pelas outras pessoas ou atividades? (0: Não perdi o interesse; 1: Menos interessado que antes; 2: Perdi quase todo o interesse; 3: Difícil ter interesse em algo).',
    responseType: 'likert',
    options: [
      { value: 0, label: '0 - Sem perda de interesse', spoken: 'Sem perda de interesse' },
      { value: 1, label: '1 - Menos interessado que antes', spoken: 'Menos interessado' },
      { value: 2, label: '2 - Quase nenhum interesse', spoken: 'Quase nenhum interesse' },
      { value: 3, label: '3 - Sem interesse em nada', spoken: 'Sem interesse em nada' },
    ],
    allowRepetition: true,
  },
  {
    key: 'bdi_q13',
    domain: 'Indecisão',
    stimulus:
      'Como está sua capacidade de tomar decisões? (0: Tão bem quanto antes; 1: Mais difícil decidir agora; 2: Muito mais dificuldade; 3: Problemas para qualquer decisão).',
    responseType: 'likert',
    options: [
      { value: 0, label: '0 - Tomo decisões normalmente', spoken: 'Decisões normais' },
      { value: 1, label: '1 - Mais difícil decidir agora', spoken: 'Mais difícil decidir' },
      { value: 2, label: '2 - Muito difícil tomar decisões', spoken: 'Muito difícil decidir' },
      { value: 3, label: '3 - Não consigo tomar decisões', spoken: 'Não consigo tomar decisões' },
    ],
    allowRepetition: true,
  },
  {
    key: 'bdi_q14',
    domain: 'Desvalia',
    stimulus:
      'Tem se sentido sem valor ou inútil? (0: Não me sinto inútil; 1: Menos valoroso que antes; 2: Mais inútil comparado aos outros; 3: Totalmente sem valor).',
    responseType: 'likert',
    options: [
      { value: 0, label: '0 - Não me sinto inútil', spoken: 'Não me sinto inútil' },
      { value: 1, label: '1 - Menos útil que antes', spoken: 'Menos útil que antes' },
      {
        value: 2,
        label: '2 - Sinto-me mais inútil que os outros',
        spoken: 'Mais inútil que os outros',
      },
      { value: 3, label: '3 - Completamente sem valor', spoken: 'Completamente sem valor' },
    ],
    allowRepetition: true,
  },
  {
    key: 'bdi_q15',
    domain: 'Energia',
    stimulus:
      'Como está seu nível de energia? (0: Tanta energia quanto antes; 1: Menos energia que costumava; 2: Sem energia para quase nada; 3: Sem energia para nada).',
    responseType: 'likert',
    options: [
      { value: 0, label: '0 - Tanta energia quanto sempre', spoken: 'Energia normal' },
      { value: 1, label: '1 - Menos energia que antes', spoken: 'Menos energia' },
      { value: 2, label: '2 - Sem energia pra muitas coisas', spoken: 'Pouca energia' },
      { value: 3, label: '3 - Sem energia pra nada', spoken: 'Sem energia pra nada' },
    ],
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'bdi_q16',
    domain: 'Sono',
    stimulus:
      'Houve mudanças no seu sono? (0: Nenhuma mudança; 1: Durmo um pouco mais ou menos; 2: Durmo muito mais ou menos; 3: Durmo quase o dia todo ou acordo horas antes).',
    responseType: 'likert',
    options: [
      { value: 0, label: '0 - Sem alterações no sono', spoken: 'Sono normal' },
      { value: 1, label: '1 - Durmo um pouco mais ou menos', spoken: 'Pouca alteração no sono' },
      { value: 2, label: '2 - Durmo muito mais ou menos', spoken: 'Muita alteração no sono' },
      { value: 3, label: '3 - Sono gravemente alterado', spoken: 'Sono gravemente alterado' },
    ],
    allowRepetition: true,
  },
  {
    key: 'bdi_q17',
    domain: 'Irritabilidade',
    stimulus:
      'Você tem se sentido irritado(a)? (0: Não mais que antes; 1: Mais irritável que o habitual; 2: Muito mais irritado; 3: Irritado o tempo todo).',
    responseType: 'likert',
    options: [
      { value: 0, label: '0 - Não mais irritado que antes', spoken: 'Irritabilidade normal' },
      { value: 1, label: '1 - Mais irritável que antes', spoken: 'Mais irritável' },
      { value: 2, label: '2 - Muito mais irritado', spoken: 'Muito mais irritado' },
      { value: 3, label: '3 - Irritado o tempo todo', spoken: 'Irritado o tempo todo' },
    ],
    allowRepetition: true,
  },
  {
    key: 'bdi_q18',
    domain: 'Apetite',
    stimulus:
      'Houve alterações no seu apetite? (0: Sem mudanças; 1: Um pouco mais ou menos apetite; 2: Muito mais ou menos; 3: Sem nenhum apetite ou fome o tempo todo).',
    responseType: 'likert',
    options: [
      { value: 0, label: '0 - Apetite normal', spoken: 'Apetite normal' },
      {
        value: 1,
        label: '1 - Um pouco mais ou menos apetite',
        spoken: 'Pouca alteração no apetite',
      },
      { value: 2, label: '2 - Muito mais ou menos apetite', spoken: 'Muita alteração no apetite' },
      {
        value: 3,
        label: '3 - Sem apetite ou comendo o tempo todo',
        spoken: 'Apetite gravemente alterado',
      },
    ],
    allowRepetition: true,
  },
  {
    key: 'bdi_q19',
    domain: 'Concentração',
    stimulus:
      'Como está sua capacidade de concentração? (0: Tão bem quanto antes; 1: Não tão bem quanto costumava; 2: Difícil manter a mente em algo; 3: Não consigo me concentrar em nada).',
    responseType: 'likert',
    options: [
      { value: 0, label: '0 - Me concentro normalmente', spoken: 'Concentração normal' },
      { value: 1, label: '1 - Não me concentro tão bem', spoken: 'Concentração reduzida' },
      { value: 2, label: '2 - Difícil manter a atenção', spoken: 'Difícil manter a atenção' },
      { value: 3, label: '3 - Não consigo me concentrar em nada', spoken: 'Sem concentração' },
    ],
    allowRepetition: true,
  },
  {
    key: 'bdi_q20',
    domain: 'Fadiga',
    stimulus:
      'Tem se sentido cansado ou com fadiga? (0: Não mais que antes; 1: Me canso mais facilmente; 2: Muito cansado para fazer muitas coisas; 3: Cansado demais para quase tudo).',
    responseType: 'likert',
    options: [
      { value: 0, label: '0 - Cansaço normal', spoken: 'Cansaço normal' },
      { value: 1, label: '1 - Fico cansado mais fácil', spoken: 'Canso mais fácil' },
      { value: 2, label: '2 - Cansado demais pra muitas coisas', spoken: 'Muito cansado' },
      { value: 3, label: '3 - Cansado demais pra quase tudo', spoken: 'Fadiga extrema' },
    ],
    allowRepetition: true,
  },
  {
    key: 'bdi_q21',
    domain: 'Libido',
    stimulus:
      'Houve alterações no seu interesse por sexo? (0: Nenhuma mudança; 1: Menos interessado que antes; 2: Muito menos interessado; 3: Perdi completamente o interesse).',
    responseType: 'likert',
    options: [
      { value: 0, label: '0 - Sem alteração na libido', spoken: 'Sem alteração' },
      { value: 1, label: '1 - Menos interesse que antes', spoken: 'Menos interesse' },
      { value: 2, label: '2 - Muito menos interesse', spoken: 'Muito menos interesse' },
      { value: 3, label: '3 - Perda completa do interesse', spoken: 'Perda completa de interesse' },
    ],
    allowRepetition: true,
    pauseAfter: true,
  },
]

/* ----------------------------------------------------------------- */
/* BAI — Leitura assistida ao paciente (21 itens)                    */
/* ----------------------------------------------------------------- */
const BAI_ASSISTED_OPTIONS = [
  { value: 0, label: '0 - Absolutamente não', spoken: 'Absolutamente não' },
  { value: 1, label: '1 - Levemente', spoken: 'Levemente' },
  { value: 2, label: '2 - Moderadamente', spoken: 'Moderadamente' },
  { value: 3, label: '3 - Gravemente', spoken: 'Gravemente' },
]

const BAI_ASSISTED_ITEMS: AssistedItem[] = [
  {
    key: 'bai_q1',
    domain: 'Neurovegetativo',
    stimulus: 'Dormência ou formigamento no corpo?',
    responseType: 'likert',
    options: BAI_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'bai_q2',
    domain: 'Autonômico',
    stimulus: 'Sensação de calor ou ondas de calor repentinas?',
    responseType: 'likert',
    options: BAI_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'bai_q3',
    domain: 'Motor',
    stimulus: 'Tremores ou fraqueza nas pernas?',
    responseType: 'likert',
    options: BAI_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'bai_q4',
    domain: 'Tensão',
    stimulus: 'Incapacidade ou grande dificuldade de relaxar?',
    responseType: 'likert',
    options: BAI_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'bai_q5',
    domain: 'Cognitivo/Medo',
    stimulus: 'Medo constante de que o pior possa acontecer?',
    responseType: 'likert',
    options: BAI_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'bai_q6',
    domain: 'Neurovegetativo',
    stimulus: 'Tontura, vertigem ou sensação de cabeça oca?',
    responseType: 'likert',
    options: BAI_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'bai_q7',
    domain: 'Cardiovascular',
    stimulus: 'Palpitações, taquicardia ou coração acelerado?',
    responseType: 'likert',
    options: BAI_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'bai_q8',
    domain: 'Motor/Equilíbrio',
    stimulus: 'Sensação de instabilidade ou desequilíbrio?',
    responseType: 'likert',
    options: BAI_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'bai_q9',
    domain: 'Cognitivo/Pavor',
    stimulus: 'Sensação de terror, pavor ou desespero?',
    responseType: 'likert',
    options: BAI_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'bai_q10',
    domain: 'Tensão',
    stimulus: 'Sensação de nervosismo ou tensão intensa?',
    responseType: 'likert',
    options: BAI_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'bai_q11',
    domain: 'Respiratório',
    stimulus: 'Sensação de sufocamento ou aperto na garganta?',
    responseType: 'likert',
    options: BAI_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'bai_q12',
    domain: 'Motor',
    stimulus: 'Tremores involuntários nas mãos?',
    responseType: 'likert',
    options: BAI_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'bai_q13',
    domain: 'Motor',
    stimulus: 'Corpo trêmulo ou abalado por inteiro?',
    responseType: 'likert',
    options: BAI_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'bai_q14',
    domain: 'Cognitivo/Controle',
    stimulus: 'Medo intenso de perder o controle?',
    responseType: 'likert',
    options: BAI_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'bai_q15',
    domain: 'Respiratório',
    stimulus: 'Dificuldade para respirar ou falta de ar?',
    responseType: 'likert',
    options: BAI_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'bai_q16',
    domain: 'Cognitivo/Morte',
    stimulus: 'Medo de morrer?',
    responseType: 'likert',
    options: BAI_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'bai_q17',
    domain: 'Sobressalto',
    stimulus: 'Assustado(a) ou sobressaltado(a) facilmente?',
    responseType: 'likert',
    options: BAI_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'bai_q18',
    domain: 'Gastrointestinal',
    stimulus: 'Indigestão, náusea ou desconforto no abdômen?',
    responseType: 'likert',
    options: BAI_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'bai_q19',
    domain: 'Neurovegetativo',
    stimulus: 'Sensação de desmaio iminente?',
    responseType: 'likert',
    options: BAI_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'bai_q20',
    domain: 'Autonômico',
    stimulus: 'Rosto afogueado ou rubor facial?',
    responseType: 'likert',
    options: BAI_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'bai_q21',
    domain: 'Autonômico',
    stimulus: 'Suor excessivo (não decorrente de calor ambiente)?',
    responseType: 'likert',
    options: BAI_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
]

/* ----------------------------------------------------------------- */
/* WURS-25 — Aplicação Assistida ao Paciente Adulto (Retrospectivo)  */
/* ----------------------------------------------------------------- */
const WURS_ASSISTED_OPTIONS: AssistedOption[] = [
  { value: 0, label: 'Nada ou muito pouco', spoken: 'Nada ou muito pouco' },
  { value: 1, label: 'Leve', spoken: 'Leve' },
  { value: 2, label: 'Moderado', spoken: 'Moderado' },
  { value: 3, label: 'Bastante', spoken: 'Bastante' },
  { value: 4, label: 'Muito / Muitíssimo', spoken: 'Muito ou muitíssimo' },
]

const WURS_ASSISTED_ITEMS: AssistedItem[] = [
  {
    key: 'wurs_q1',
    domain: 'Hiperatividade na infância',
    stimulus:
      'Pensando na sua infância (dos 6 aos 12 anos): com que frequência você era hiperativo, inquieto ou incapaz de ficar parado?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'wurs_q2',
    domain: 'Atenção na infância',
    stimulus:
      'Quando criança, você tinha problemas de atenção ou se distraía facilmente das tarefas?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'wurs_q3',
    domain: 'Impulsividade',
    stimulus:
      'Quando criança, você era impulsivo, agia ou falava antes de pensar nas consequências?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'wurs_q4',
    domain: 'Controle de temperamento',
    stimulus: 'Quando criança, você tinha explosões de raiva ou perdia o controle facilmente?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'wurs_q5',
    domain: 'Labilidade afetiva',
    stimulus: 'Quando criança, você tinha mudanças bruscas e repentinas de humor?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'wurs_q6',
    domain: 'Ansiedade infantil',
    stimulus: 'Quando criança, você era muito ansioso ou preocupado com as coisas?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'wurs_q7',
    domain: 'Organização',
    stimulus:
      'Quando criança, você era desorganizado ou tinha dificuldade para planejar suas atividades?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'wurs_q8',
    domain: 'Desatenção interna',
    stimulus: 'Quando criança, você costumava "sonhar acordado" ou parecer desligado do ambiente?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'wurs_q9',
    domain: 'Oposição',
    stimulus: 'Quando criança, você era considerado teimoso ou desafiador?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'wurs_q10',
    domain: 'Relação com autoridade',
    stimulus:
      'Quando criança, você tinha problemas frequentes com figuras de autoridade, como pais ou professores?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'wurs_q11',
    domain: 'Tolerância à frustração',
    stimulus:
      'Quando criança, você se frustrava facilmente quando as coisas não saíam como queria?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'wurs_q12',
    domain: 'Persistência',
    stimulus: 'Quando criança, você costumava deixar tarefas ou brincadeiras inacabadas?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'wurs_q13',
    domain: 'Rendimento escolar',
    stimulus:
      'Na escola, suas notas ou rendimento ficavam abaixo da sua real capacidade intelectual?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'wurs_q14',
    domain: 'Socialização',
    stimulus:
      'Quando criança, você tinha dificuldade de se relacionar ou manter amizades com outras crianças?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'wurs_q15',
    domain: 'Coordenação motora',
    stimulus:
      'Quando criança, você era desajeitado, descoordenado ou propenso a tropeçar e derrubar coisas?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'wurs_q16',
    domain: 'Autoestima infantil',
    stimulus:
      'Quando criança, você se sentia com baixa autoestima ou com sentimento de inferioridade?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'wurs_q17',
    domain: 'Conduta escolar',
    stimulus: 'Na escola, você recebia advertências ou queixas de comportamento com frequência?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'wurs_q18',
    domain: 'Controle inibitório',
    stimulus:
      'Quando criança, você tinha grande dificuldade para aguardar a sua vez em filas ou jogos?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'wurs_q19',
    domain: 'Verbalização excessiva',
    stimulus: 'Quando criança, você falava excessivamente ou interrompia a conversa dos outros?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'wurs_q20',
    domain: 'Memória de rotina',
    stimulus:
      'Quando criança, você esquecia recados, deveres ou materiais escolares frequentemente?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'wurs_q21',
    domain: 'Perda de pertences',
    stimulus:
      'Quando criança, você perdia agasalhos, estojos, livros ou brinquedos com facilidade?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'wurs_q22',
    domain: 'Busca de sensações',
    stimulus:
      'Quando criança, você se envolvia em brincadeiras perigosas ou imprudentes sem avaliar o perigo?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'wurs_q23',
    domain: 'Autorregulação',
    stimulus: 'Quando você ficava animado ou excitado, era muito difícil conseguir se acalmar?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'wurs_q24',
    domain: 'Inquietação interna',
    stimulus:
      'Quando criança, você sentia uma inquietação interna constante, como um motor ligado por dentro?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'wurs_q25',
    domain: 'Percepção global',
    stimulus:
      'De modo geral, você sentia que tinha mais dificuldades de atenção ou comportamento que a maioria das outras crianças?',
    responseType: 'likert',
    options: WURS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
]

/* ----------------------------------------------------------------- */
/* AQ-10 — Aplicação Assistida ao Paciente Adulto (Triagem TEA)       */
/* ----------------------------------------------------------------- */
const AQ_ASSISTED_OPTIONS: AssistedOption[] = [
  { value: 0, label: 'Discordo totalmente', spoken: 'Discordo totalmente' },
  { value: 1, label: 'Discordo parcialmente', spoken: 'Discordo parcialmente' },
  { value: 2, label: 'Concordo parcialmente', spoken: 'Concordo parcialmente' },
  { value: 3, label: 'Concordo totalmente', spoken: 'Concordo totalmente' },
]

const AQ10_ASSISTED_ITEMS: AssistedItem[] = [
  {
    key: 'aq10_q1',
    domain: 'Atenção aos detalhes',
    stimulus:
      'Muitas vezes você nota pequenos sons ao seu redor que as outras pessoas não percebem?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq10_q2',
    domain: 'Atenção global',
    stimulus:
      'Geralmente você se concentra mais no quadro geral de uma situação do que nos pequenos detalhes?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq10_q3',
    domain: 'Alternância de atenção',
    stimulus: 'Você acha fácil fazer mais de uma coisa ao mesmo tempo?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq10_q4',
    domain: 'Retomada de foco',
    stimulus: 'Se houver uma interrupção, você consegue voltar rapidamente ao que estava fazendo?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'aq10_q5',
    domain: 'Comunicação social',
    stimulus:
      'Você acha fácil "ler nas entrelinhas" ou entender o sentido implícito quando alguém conversa com você?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq10_q6',
    domain: 'Percepção do outro',
    stimulus:
      'Você consegue reconhecer facilmente quando alguém que está te ouvindo está ficando entediado?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq10_q7',
    domain: 'Teoria da mente',
    stimulus:
      'Quando está lendo uma história ou vendo um filme, você acha difícil decifrar as intenções e sentimentos dos personagens?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq10_q8',
    domain: 'Padrões e categorias',
    stimulus:
      'Você gosta de colecionar ou catalogar informações sobre categorias específicas de coisas (tipos de carros, plantas, datas)?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'aq10_q9',
    domain: 'Expressão facial',
    stimulus:
      'Você acha fácil descobrir o que alguém está sentindo apenas olhando para a expressão do rosto dela?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq10_q10',
    domain: 'Intenções sociais',
    stimulus:
      'Em conversas ou situações sociais, você acha difícil entender as reais intenções das outras pessoas?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
]

/* ----------------------------------------------------------------- */
/* AQ-50 — Aplicação Assistida ao Paciente Adulto (TEA Completo)     */
/* ----------------------------------------------------------------- */
const AQ50_ASSISTED_ITEMS: AssistedItem[] = [
  {
    key: 'aq_q1',
    domain: 'Social',
    stimulus: 'Você prefere fazer atividades com outras pessoas ou prefere fazê-las sozinho?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q2',
    domain: 'Rotina',
    stimulus: 'Você prefere fazer as coisas sempre do mesmo modo e rotina?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q3',
    domain: 'Imaginação',
    stimulus: 'Se tenta imaginar algo, acha muito fácil criar uma imagem nítida na sua mente?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q4',
    domain: 'Hiperfoco',
    stimulus: 'Frequentemente fica tão absorvido em uma tarefa que perde a noção de tudo ao redor?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'aq_q5',
    domain: 'Sensorial',
    stimulus: 'Costuma notar pequenos sons no ambiente que outras pessoas não percebem?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q6',
    domain: 'Padrões',
    stimulus:
      'Costuma prestar atenção especial a placas de carros, números ou sequências semelhantes?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q7',
    domain: 'Pragmática',
    stimulus:
      'Outras pessoas dizem que o que você disse foi indelicado, embora você achasse apenas sincero?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q8',
    domain: 'Imaginação',
    stimulus: 'Quando lê uma história, consegue imaginar facilmente a aparência dos personagens?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'aq_q9',
    domain: 'Interesse',
    stimulus: 'Você é fascinado por datas e calendários?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q10',
    domain: 'Social',
    stimulus: 'Em um grupo, consegue acompanhar facilmente as conversas de diferentes pessoas?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q11',
    domain: 'Social',
    stimulus: 'Você acha situações e encontros sociais fáceis e naturais?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q12',
    domain: 'Detalhes',
    stimulus: 'Costuma notar pequenos detalhes em objetos ou ambientes que os outros não reparam?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'aq_q13',
    domain: 'Preferência',
    stimulus: 'Você prefere ir a uma biblioteca calma do que a uma festa movimentada?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q14',
    domain: 'Imaginação',
    stimulus: 'Você acha fácil inventar histórias fictícias ou contos espontâneos?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q15',
    domain: 'Social',
    stimulus: 'Você se sente mais atraído por pessoas ou por objetos, sistemas e coisas?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q16',
    domain: 'Interesse',
    stimulus: 'Tem interesses tão intensos que fica chateado se não pode se dedicar a eles?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'aq_q17',
    domain: 'Comunicação',
    stimulus: 'Você gosta de conversar socialmente e bater papo informal com pessoas?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q18',
    domain: 'Conversação',
    stimulus:
      'Quando você fala de um assunto do seu interesse, é difícil dar espaço para os outros falarem?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q19',
    domain: 'Padrões',
    stimulus: 'Você é fascinado por números, tabelas ou cálculos?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q20',
    domain: 'Teoria da mente',
    stimulus:
      'Ao ler uma história, acha difícil descobrir os motivos e sentimentos dos personagens?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'aq_q21',
    domain: 'Preferência',
    stimulus: 'Você prefere livros de fatos e informações a livros de ficção?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q22',
    domain: 'Social',
    stimulus: 'Você acha difícil fazer novos amigos?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q23',
    domain: 'Padrões',
    stimulus: 'Você nota padrões e simetrias nas coisas o tempo todo?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q24',
    domain: 'Preferência',
    stimulus: 'Prefere ir a um museu tranquilo do que a uma sessão de cinema movimentada?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'aq_q25',
    domain: 'Flexibilidade',
    stimulus: 'Você fica incomodado ou ansioso se a sua rotina diária for alterada de repente?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q26',
    domain: 'Conversação',
    stimulus: 'Frequentemente não sabe como manter uma conversa casual fluindo?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q27',
    domain: 'Entrelinhas',
    stimulus: 'Acha fácil ler nas entrelinhas quando alguém conversa com você?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q28',
    domain: 'Foco global',
    stimulus: 'Costuma se concentrar mais no quadro geral do que nos pequenos detalhes?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'aq_q29',
    domain: 'Memória',
    stimulus: 'Você tem boa facilidade para memorizar números de telefone e sequências?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q30',
    domain: 'Mudanças',
    stimulus: 'Costuma notar pequenas mudanças em uma sala ou na aparência de alguém?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q31',
    domain: 'Empatia social',
    stimulus: 'Reconhece com facilidade quando a pessoa com quem conversa está entediada?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q32',
    domain: 'Multitarefa',
    stimulus: 'Acha fácil realizar mais de uma tarefa simultaneamente?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'aq_q33',
    domain: 'Turnos',
    stimulus: 'Ao falar ao telefone, acha difícil saber exatamente quando é sua vez de falar?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q34',
    domain: 'Espontaneidade',
    stimulus: 'Gosta de fazer planos de surpresa e coisas espontâneas?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q35',
    domain: 'Humor/Ironia',
    stimulus:
      'Costuma demorar mais que os outros para entender a graça de uma piada ou duplo sentido?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q36',
    domain: 'Expressão facial',
    stimulus: 'Acha fácil saber o que alguém está pensando apenas olhando para o rosto da pessoa?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'aq_q37',
    domain: 'Foco',
    stimulus: 'Se for interrompido, consegue retomar a atividade de onde parou rapidamente?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q38',
    domain: 'Social',
    stimulus: 'Você se considera bom em conversas casuais de elevador ou encontros sociais?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q39',
    domain: 'Monotrópico',
    stimulus:
      'As pessoas já disseram que você insiste sempre nos mesmos tópicos e temas de interesse?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q40',
    domain: 'Infância',
    stimulus: 'Quando criança, gostava de brincar de faz-de-conta com outras crianças?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'aq_q41',
    domain: 'Padrões',
    stimulus: 'Gosta de colecionar ou classificar informações sobre temas bem específicos?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q42',
    domain: 'Empatia cognitiva',
    stimulus:
      'Acha difícil imaginar como seria estar no lugar de outra pessoa e sentir o que ela sente?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q43',
    domain: 'Planejamento',
    stimulus: 'Gosta de planejar cuidadosamente cada etapa de qualquer atividade antes de começar?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q44',
    domain: 'Social',
    stimulus: 'Gosta de festas, encontros e ocasiões com muitas pessoas?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'aq_q45',
    domain: 'Intenções',
    stimulus: 'Acha difícil decifrar o que as pessoas realmente querem dizer ou pretendem fazer?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q46',
    domain: 'Novidade',
    stimulus: 'Situações inéditas ou novos ambientes costumam te deixar bastante ansioso?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q47',
    domain: 'Social',
    stimulus: 'Você gosta de conhecer pessoas novas e interagir com elas?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q48',
    domain: 'Tato social',
    stimulus: 'Você se considera uma pessoa diplomática ao lidar com divergências interpessoais?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'aq_q49',
    domain: 'Memória social',
    stimulus: 'Tem facilidade para se lembrar de datas comemorativas e aniversários de conhecidos?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'aq_q50',
    domain: 'Imaginação',
    stimulus: 'Acha fácil participar de brincadeiras de imaginação e faz-de-conta com crianças?',
    responseType: 'likert',
    options: AQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
]

/* ----------------------------------------------------------------- */
/* SCQ — Aplicação Assistida ao Responsável (TEA em Crianças 4+ anos) */
/* ----------------------------------------------------------------- */
const SCQ_ASSISTED_OPTIONS: AssistedOption[] = [
  { value: 0, label: 'Não', spoken: 'Não' },
  { value: 1, label: 'Sim', spoken: 'Sim' },
]

const SCQ_ASSISTED_ITEMS: AssistedItem[] = [
  {
    key: 'scq_q1',
    domain: 'Fala inicial',
    stimulus: 'A criança é capaz de conversar usando frases ou sentenças curtas no dia a dia?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q2',
    domain: 'Reciprocidade',
    stimulus:
      'Você consegue manter uma conversa com ela em que ambos alternam a fala de modo natural?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q3',
    domain: 'Linguagem repetitiva',
    stimulus: 'Ela costuma usar frases estranhas ou repetir as mesmas expressões de modo mecânico?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q4',
    domain: 'Pragmática',
    stimulus: 'Ela costuma fazer perguntas ou afirmações socialmente inadequadas sem perceber?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'scq_q5',
    domain: 'Pronomes',
    stimulus: 'Ela costuma trocar pronomes, dizendo "você" para se referir a si mesma ("eu")?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q6',
    domain: 'Neologismos',
    stimulus: 'Ela inventa palavras ou usa termos de forma peculiar que só a família compreende?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q7',
    domain: 'Ecolalia',
    stimulus:
      'Ela repete frases ou falas de desenhos e vídeos exatamente da mesma maneira (ecolalia)?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q8',
    domain: 'Rituais',
    stimulus:
      'Ela tem rituais rígidos ou necessidade estrita de fazer as coisas sempre na mesma ordem?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'scq_q9',
    domain: 'Expressão facial',
    stimulus: 'As expressões faciais dela costumam ser comunicativas e adequadas às situações?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q10',
    domain: 'Instrumentalização',
    stimulus:
      'Ela já usou a sua mão como ferramenta, puxando seu braço para pegar algo sem olhar para o seu rosto?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q11',
    domain: 'Interesse restrito',
    stimulus: 'Ela tem interesses específicos muito intensos que parecem incomuns para a idade?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q12',
    domain: 'Partes de objetos',
    stimulus:
      'Ela parece mais interessada em partes de brinquedos (ex.: girar rodinhas) do que na função deles?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'scq_q13',
    domain: 'Sensorial incomum',
    stimulus:
      'Ela tem comportamentos sensoriais atípicos, como cheirar, lamber ou tocar insistentemente texturas?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q14',
    domain: 'Hiper-reatividade auditiva',
    stimulus:
      'Ela reage com grande incômodo, medo ou tapa os ouvidos diante de certos sons cotidianos?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q15',
    domain: 'Estereotipias manuais',
    stimulus:
      'Ela faz movimentos repetitivos com as mãos ou dedos, como abanar as mãos (flapping) ou estalar dedos perto dos olhos?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q16',
    domain: 'Estereotipias corporais',
    stimulus:
      'Ela tem movimentos repetitivos com o corpo todo, como balançar o tronco ou girar sobre si mesma?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'scq_q17',
    domain: 'Autolesão',
    stimulus:
      'Ela já teve comportamentos de se machucar intencionalmente, como morder a própria mão ou bater a cabeça?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q18',
    domain: 'Apego a objetos',
    stimulus:
      'Ela costuma carregar objetos incomuns e específicos (como tampas, fios, pedaços de plástico) para todo lugar?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q19',
    domain: 'Amizades',
    stimulus: 'Ela tem algum amigo próximo da mesma idade com quem mantém brincadeiras recíprocas?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q20',
    domain: 'Compartilhamento social',
    stimulus:
      'Ela costuma conversar com você apenas para compartilhar algo interessante, sem pedir nada em troca?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'scq_q21',
    domain: 'Imitação',
    stimulus:
      'Ela costuma imitar espontaneamente ações suas no dia a dia, como varrer, cozinhar ou dar tchau?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q22',
    domain: 'Apontar para mostrar',
    stimulus:
      'Ela aponta com o dedo indicador para coisas distantes apenas para te mostrar algo legal?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q23',
    domain: 'Gestos sociais',
    stimulus: 'Ela usa gestos sociais espontâneos, como acenar, mandar beijo ou pedir silêncio?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q24',
    domain: 'Assentimento',
    stimulus: 'Ela acena com a cabeça para cima e para baixo para dizer "sim"?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'scq_q25',
    domain: 'Negação',
    stimulus: 'Ela balança a cabeça de um lado para o outro para dizer "não"?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q26',
    domain: 'Contato visual',
    stimulus: 'Ela olha nos seus olhos com naturalidade enquanto conversa ou brinca com você?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q27',
    domain: 'Sorriso social',
    stimulus: 'Ela sorri de volta com facilidade quando você sorri afetuosamente para ela?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q28',
    domain: 'Atenção compartilhada',
    stimulus:
      'Ela costuma trazer brinquedos ou objetos para te mostrar, buscando compartilhar a satisfação dela?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'scq_q29',
    domain: 'Oferta espontânea',
    stimulus: 'Ela já ofereceu espontaneamente um brinquedo ou comida dela para você?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q30',
    domain: 'Empatia afetiva',
    stimulus:
      'Ela parece perceber e reagir quando você ou outra pessoa da família está triste ou machucado?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q31',
    domain: 'Busca de conforto',
    stimulus:
      'Quando se machuca ou fica assustada, ela procura ativamente o seu abraço para se consolar?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q32',
    domain: 'Convite social',
    stimulus:
      'Ela tenta chamar você para participar das brincadeiras dela ou olhar o que ela está construindo?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'scq_q33',
    domain: 'Interesse por pares',
    stimulus:
      'Ela demonstra interesse genuíno por outras crianças e tenta se aproximar para brincar junto?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q34',
    domain: 'Seguimento de olhar',
    stimulus:
      'Se você aponta para algo no outro lado da sala e diz "olha lá", ela olha na direção do seu dedo?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q35',
    domain: 'Faz-de-conta',
    stimulus:
      'Ela brinca de faz-de-conta (como dar comidinha para bonecos, dirigir um carrinho imaginário)?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q36',
    domain: 'Jogos de regras',
    stimulus:
      'Ela consegue participar de brincadeiras com regras simples junto com outras crianças?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'scq_q37',
    domain: 'Modulação de voz',
    stimulus: 'Ela fala com tom de voz natural e expressivo, sem parecer monótona ou robótica?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q38',
    domain: 'Grupo',
    stimulus: 'Ela se integra com tranquilidade a brincadeiras coletivas na escola ou parques?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q39',
    domain: 'Resposta social',
    stimulus:
      'Ela responde de forma positiva quando outra criança ou adulto inicia contato amigável com ela?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'scq_q40',
    domain: 'Flexibilidade',
    stimulus:
      'Ela reage bem e com calma quando há mudanças previamente combinadas na rotina do dia?',
    responseType: 'likert',
    options: SCQ_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
]

/* ----------------------------------------------------------------- */
/* Vanderbilt (VADRS) — Aplicação Assistida ao Responsável/Professor */
/* ----------------------------------------------------------------- */
const VADRS_ASSISTED_OPTIONS: AssistedOption[] = [
  { value: 0, label: 'Nunca', spoken: 'Nunca' },
  { value: 1, label: 'Ocasionalmente', spoken: 'Ocasionalmente' },
  { value: 2, label: 'Frequentemente', spoken: 'Frequentemente' },
  { value: 3, label: 'Muito frequentemente', spoken: 'Muito frequentemente' },
]

const VADRS_PERFORMANCE_ASSISTED_OPTIONS: AssistedOption[] = [
  { value: 1, label: 'Excelente', spoken: 'Excelente' },
  { value: 2, label: 'Acima da média', spoken: 'Acima da média' },
  { value: 3, label: 'Na média', spoken: 'Na média' },
  { value: 4, label: 'Com problemas', spoken: 'Com problemas' },
  { value: 5, label: 'Muito problemático', spoken: 'Muito problemático' },
]

const VADRS_ASSISTED_ITEMS: AssistedItem[] = [
  // Desatenção
  {
    key: 'vadrs_q1',
    domain: 'Desatenção',
    stimulus:
      'A criança não presta atenção a detalhes ou comete erros por descuido nos trabalhos escolares?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q2',
    domain: 'Desatenção',
    stimulus: 'Tem dificuldade em manter a atenção em tarefas ou atividades de brincadeira?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q3',
    domain: 'Desatenção',
    stimulus: 'Parece não escutar quando se fala diretamente com ela?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q4',
    domain: 'Desatenção',
    stimulus: 'Não segue instruções até o fim e deixa de concluir tarefas ou lições escolares?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'vadrs_q5',
    domain: 'Desatenção',
    stimulus: 'Tem dificuldade para organizar tarefas, materiais e atividades?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q6',
    domain: 'Desatenção',
    stimulus: 'Evita ou reluta em se envolver em tarefas que exijam esforço mental constante?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q7',
    domain: 'Desatenção',
    stimulus:
      'Perde objetos necessários para tarefas escolares ou atividades (lápis, cadernos, roupas)?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q8',
    domain: 'Desatenção',
    stimulus: 'Distrai-se facilmente com qualquer estímulo do ambiente ao redor?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'vadrs_q9',
    domain: 'Desatenção',
    stimulus: 'É esquecida nas atividades e compromissos cotidianos?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  // Hiperatividade / Impulsividade
  {
    key: 'vadrs_q10',
    domain: 'Hiperatividade',
    stimulus: 'Remexe as mãos ou pés com inquietude ou se contorce na cadeira?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q11',
    domain: 'Hiperatividade',
    stimulus: 'Levanta-se da cadeira em situações nas quais se espera que fique sentada?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q12',
    domain: 'Hiperatividade',
    stimulus: 'Corre ou escala coisas excessivamente em locais inapropriados?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'vadrs_q13',
    domain: 'Hiperatividade',
    stimulus: 'Tem dificuldade para brincar ou se envolver silenciosamente em atividades de lazer?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q14',
    domain: 'Hiperatividade',
    stimulus: 'Está sempre "a mil" ou parece impulsionada por um motor?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q15',
    domain: 'Hiperatividade',
    stimulus: 'Fala em excesso durante as atividades?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q16',
    domain: 'Impulsividade',
    stimulus: 'Dá respostas precipitadas antes de as perguntas terem sido completadas?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'vadrs_q17',
    domain: 'Impulsividade',
    stimulus: 'Tem grande dificuldade para esperar a sua vez em filas ou jogos?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q18',
    domain: 'Impulsividade',
    stimulus: 'Interrompe ou se intromete nas conversas ou brincadeiras dos outros?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  // TOD
  {
    key: 'vadrs_q19',
    domain: 'TOD',
    stimulus: 'Perde a calma ou tem acessos de raiva com frequência?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q20',
    domain: 'TOD',
    stimulus: 'Discute e bate boca com adultos ou figuras de autoridade?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'vadrs_q21',
    domain: 'TOD',
    stimulus: 'Desafia ativamente pedidos ou recusa-se a cumprir regras de adultos?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q22',
    domain: 'TOD',
    stimulus: 'Incomoda ou provoca outras pessoas deliberadamente?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q23',
    domain: 'TOD',
    stimulus: 'Culpa outras pessoas pelos seus próprios erros ou mau comportamento?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q24',
    domain: 'TOD',
    stimulus: 'É muito sensível ou se irrita com grande facilidade pelos outros?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'vadrs_q25',
    domain: 'TOD',
    stimulus: 'Mostra-se raivosa, ressentida ou emburrada com frequência?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q26',
    domain: 'TOD',
    stimulus: 'É vingativa ou guarda rancor das pessoas?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  // Conduta
  {
    key: 'vadrs_q27',
    domain: 'Conduta',
    stimulus: 'Intimida, ameaça ou amedronta outras crianças?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q28',
    domain: 'Conduta',
    stimulus: 'Inicia brigas físicas com colegas ou familiares?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'vadrs_q29',
    domain: 'Conduta',
    stimulus: 'Usa armas ou objetos perigosos que podem machucar fisicamente?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q30',
    domain: 'Conduta',
    stimulus: 'É fisicamente cruel ou agressiva com pessoas?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q31',
    domain: 'Conduta',
    stimulus: 'É cruel ou maltrata animais intencionalmente?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q32',
    domain: 'Conduta',
    stimulus: 'Rouba objetos confrontando a vítima?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'vadrs_q33',
    domain: 'Conduta',
    stimulus: 'Força alguém a atividade física ou íntima indesejada?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q34',
    domain: 'Conduta',
    stimulus: 'Ateia fogo intencionalmente com o intuito de causar danos?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q35',
    domain: 'Conduta',
    stimulus: 'Destrói deliberadamente coisas ou propriedades de outras pessoas?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q36',
    domain: 'Conduta',
    stimulus: 'Invade casas, prédios ou propriedades sem autorização?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'vadrs_q37',
    domain: 'Conduta',
    stimulus: 'Mente com frequência para conseguir vantagens, presentes ou evitar punições?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q38',
    domain: 'Conduta',
    stimulus: 'Foge de casa à noite sem autorização?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q39',
    domain: 'Conduta',
    stimulus: 'Falta à escola e mata aulas sem conhecimento dos pais?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q40',
    domain: 'Conduta',
    stimulus: 'Permanece na rua à noite desobedecendo os limites da família?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  // Ansiedade / Humor
  {
    key: 'vadrs_q41',
    domain: 'Ansiedade/Humor',
    stimulus: 'Mostra-se medrosa, receosa ou ansiosa diante das situações?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q42',
    domain: 'Ansiedade/Humor',
    stimulus: 'Tem medo excessivo de tentar coisas novas por receio de errar?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q43',
    domain: 'Ansiedade/Humor',
    stimulus: 'Sente-se sem valor, diminuída ou inferior aos outros?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q44',
    domain: 'Ansiedade/Humor',
    stimulus: 'Culpa a si mesma pelos problemas e carrega sentimentos de culpa?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'vadrs_q45',
    domain: 'Ansiedade/Humor',
    stimulus: 'Sente-se solitária, rejeitada ou não amada?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q46',
    domain: 'Ansiedade/Humor',
    stimulus: 'Apresenta-se triste, deprimida ou chora sem motivo aparente?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q47',
    domain: 'Ansiedade/Humor',
    stimulus: 'Fica envergonhada ou constrangida com grande facilidade?',
    responseType: 'likert',
    options: VADRS_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  // Desempenho
  {
    key: 'vadrs_q48',
    domain: 'Desempenho',
    stimulus: 'Como você avalia o desempenho da criança na Leitura?',
    responseType: 'likert',
    options: VADRS_PERFORMANCE_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q49',
    domain: 'Desempenho',
    stimulus: 'Como você avalia o desempenho da criança na Matemática?',
    responseType: 'likert',
    options: VADRS_PERFORMANCE_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q50',
    domain: 'Desempenho',
    stimulus: 'Como você avalia o desempenho da criança na Escrita e Português?',
    responseType: 'likert',
    options: VADRS_PERFORMANCE_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q51',
    domain: 'Desempenho',
    stimulus: 'Como é o relacionamento da criança com os pais e cuidadores?',
    responseType: 'likert',
    options: VADRS_PERFORMANCE_ASSISTED_OPTIONS,
    allowRepetition: true,
    pauseAfter: true,
  },
  {
    key: 'vadrs_q52',
    domain: 'Desempenho',
    stimulus: 'Como é o relacionamento da criança com os irmãos?',
    responseType: 'likert',
    options: VADRS_PERFORMANCE_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q53',
    domain: 'Desempenho',
    stimulus: 'Como é o relacionamento da criança com os colegas e amigos da mesma idade?',
    responseType: 'likert',
    options: VADRS_PERFORMANCE_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q54',
    domain: 'Desempenho',
    stimulus: 'Como é a participação dela em atividades organizadas (esportes, jogos em equipe)?',
    responseType: 'likert',
    options: VADRS_PERFORMANCE_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
  {
    key: 'vadrs_q55',
    domain: 'Desempenho',
    stimulus: 'Como é o comportamento geral da criança na rotina de casa?',
    responseType: 'likert',
    options: VADRS_PERFORMANCE_ASSISTED_OPTIONS,
    allowRepetition: true,
  },
]

export const ASSISTED_SCALES: Record<string, AssistedScale> = {
  wurs25: {
    key: 'wurs25',
    name: 'Wender Utah Rating Scale (WURS-25)',
    version: 'Versão brasileira (25 itens)',
    applicationMode: 'Leitura assistida por voz ao paciente adulto',
    target: 'paciente',
    items: WURS_ASSISTED_ITEMS,
    disclaimer:
      'O WURS-25 avalia retrospectivamente sintomas de TDAH na infância (corte ≥ 46). Não constitui diagnóstico.',
    totalKey: 'wurs25_total',
    maxTotal: 100,
  },
  aq10: {
    key: 'aq10',
    name: 'Quociente do Espectro Autista (AQ-10)',
    version: 'Versão de triagem rápida (10 itens)',
    applicationMode: 'Leitura assistida por voz ao paciente adulto',
    target: 'paciente',
    items: AQ10_ASSISTED_ITEMS,
    disclaimer:
      'O AQ-10 é instrumento de triagem para traços do espectro autista em adultos (corte ≥ 6). Não constitui diagnóstico.',
    totalKey: 'aq10_total',
    maxTotal: 10,
  },
  aq50: {
    key: 'aq50',
    name: 'Quociente do Espectro Autista (AQ Completo - 50 Itens)',
    version: 'Baron-Cohen et al. (50 itens)',
    applicationMode: 'Leitura assistida por voz ao paciente adulto',
    target: 'paciente',
    items: AQ50_ASSISTED_ITEMS,
    disclaimer:
      'O AQ-50 avalia traços do espectro autista em adultos (corte ≥ 32). Não constitui diagnóstico.',
    totalKey: 'aq50_total',
    maxTotal: 50,
  },
  scq: {
    key: 'scq',
    name: 'Questionário de Comunicação Social (SCQ)',
    version: 'Versão brasileira (40 itens)',
    applicationMode: 'Aplicação assistida por voz ao responsável (TEA 4+ anos)',
    target: 'responsavel',
    items: SCQ_ASSISTED_ITEMS,
    disclaimer:
      'O SCQ é instrumento de triagem para o espectro autista em crianças (corte ≥ 15). Não constitui diagnóstico.',
    totalKey: 'scq_total',
    maxTotal: 39,
  },
  vanderbilt: {
    key: 'vanderbilt',
    name: 'Escala Vanderbilt de TDAH e Comorbidades (VADRS)',
    version: 'Versão para pais e professores (55 itens)',
    applicationMode: 'Aplicação assistida por voz ao responsável',
    target: 'responsavel',
    items: VADRS_ASSISTED_ITEMS,
    disclaimer:
      'A Escala Vanderbilt avalia sintomas de TDAH, TOD, Conduta e Ansiedade/Depressão infantil. Não constitui diagnóstico.',
    totalKey: 'vanderbilt_total',
    maxTotal: 181,
  },
  bdi: {
    key: 'bdi',
    name: 'Inventário de Depressão de Beck (BDI-II)',
    version: 'Versão brasileira (21 itens)',
    applicationMode: 'Leitura assistida por voz ao paciente',
    target: 'paciente',
    items: BDI_ASSISTED_ITEMS,
    disclaimer:
      'O BDI-II é instrumento de triagem de gravidade de indicadores depressivos. Não constitui diagnóstico.',
    totalKey: 'bdi_total',
    maxTotal: 63,
  },
  bai: {
    key: 'bai',
    name: 'Inventário de Ansiedade de Beck (BAI)',
    version: 'Versão brasileira (21 itens)',
    applicationMode: 'Leitura assistida por voz ao paciente',
    target: 'paciente',
    items: BAI_ASSISTED_ITEMS,
    disclaimer:
      'O BAI é instrumento de triagem de gravidade de sintomas ansiosos. Não constitui diagnóstico.',
    totalKey: 'bai_total',
    maxTotal: 63,
  },
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
  tmt: {
    key: 'tmt',
    name: 'Trail Making Test (TMT A e B)',
    version: 'Partes A e B cronometradas em segundos',
    applicationMode: 'Aplicação assistida por voz com cronômetro em segundos',
    target: 'paciente',
    items: TMT_ITEMS,
    disclaimer:
      'O TMT A/B avalia velocidade de processamento, atenção alternada e flexibilidade cognitiva.',
    totalKey: 'tmt_total',
    maxTotal: 0,
  },
  'fluencia-semantica': {
    key: 'fluencia-semantica',
    name: 'Fluência Verbal Semântica (Animais e Frutas)',
    version: 'Categorias semânticas (60s cada)',
    applicationMode: 'Aplicação assistida por voz com cronometragem',
    target: 'paciente',
    items: SEMANTIC_FLUENCY_ITEMS,
    disclaimer: 'O teste de fluência verbal semântica avalia acesso léxico e memória semântica.',
    totalKey: 'fluencia_semantica_total',
    maxTotal: 0,
  },
  fas: {
    key: 'fas',
    name: 'Teste de Fluência Verbal Fonêmica (FAS)',
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
  if (
    lower === 'bdi' ||
    lower === 'bdi-ii' ||
    lower === 'bdi2' ||
    lower === 'bdi_ii' ||
    lower === 'beck depressao' ||
    lower === 'beck-depressao' ||
    lower === 'beck dm'
  )
    return 'bdi'
  if (
    lower === 'bai' ||
    lower === 'beck ansiedade' ||
    lower === 'beck-ansiedade' ||
    lower === 'beck ans'
  )
    return 'bai'
  if (lower === 'phq-9' || lower === 'phq9' || lower === 'phq') return 'phq9'
  if (lower === 'gad-7' || lower === 'gad7' || lower === 'gad') return 'gad7'
  if (lower === 'meem' || lower === 'mini mental' || lower === 'mini-mental') return 'meem'
  if (lower === 'moca' || lower === 'montreal cognitive assessment') return 'moca'
  if (lower === 'clock' || lower === 'desenho do relogio' || lower === 'relogio') return 'clock'
  if (
    lower === 'tmt' ||
    lower === 'tmt a/b' ||
    lower === 'tmt a' ||
    lower === 'tmt b' ||
    lower === 'tmta' ||
    lower === 'tmtb' ||
    lower === 'trail making'
  )
    return 'tmt'
  if (
    lower === 'fluencia-semantica' ||
    lower === 'fluência semântica' ||
    lower === 'fluencia semantica' ||
    lower === 'fluenciasemantica'
  )
    return 'fluencia-semantica'
  if (lower === 'fas' || lower === 'fluencia verbal' || lower === 'fluência fonêmica') return 'fas'
  if (lower === 'm-chat' || lower === 'mchat' || lower === 'mchat-r') return 'mchat'
  if (lower === 'snap-iv' || lower === 'snapiv' || lower === 'snap iv') return 'snapiv'
  if (lower === 'wurs' || lower === 'wurs25' || lower === 'wurs-25' || lower === 'wender utah')
    return 'wurs25'
  if (lower === 'aq10' || lower === 'aq-10' || lower === 'aq 10') return 'aq10'
  if (lower === 'aq50' || lower === 'aq-50' || lower === 'aq 50' || lower === 'aq') return 'aq50'
  if (lower === 'scq' || lower === 'social communication') return 'scq'
  if (lower === 'vanderbilt' || lower === 'vadrs' || lower === 'vanderbilt adhd')
    return 'vanderbilt'
  return null
}

/** Rótulo amigável da escala para o painel admin. */
export function getAssistedScaleLabel(key: string): string {
  return ASSISTED_SCALES[key]?.name ?? key
}
