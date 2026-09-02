/**
 * Dados das escalas sem componente dedicado: HAM-D, HAM-A, ASRS-18 e MEEM.
 *
 * Cada escala segue um de dois modos de renderização:
 *  - "likert": itens com opções fixas 0..N (HAM-D, HAM-A, ASRS-18)
 *  - "points": itens com maxScore individual (MEEM, semelhante ao MoCA)
 *
 * O componente GenericScaleAssessment renderiza ambos os modos a partir
 * destas definições. As questões são versões simplificadas para triagem,
 * suficientes para o fluxo público do paciente no MVP.
 */

export interface ScaleOption {
  value: number
  label: string
}

export interface ScaleItem {
  key: string
  text: string
  /** Usado apenas no modo "points": pontuação máxima do item. */
  maxScore?: number
  /** Opções personalizadas para este item (ex.: opções ricas do BDI-II). */
  options?: ScaleOption[]
}

export type ScaleRenderMode = 'likert' | 'points'

export interface ExtraScale {
  key: string
  title: string
  subtitle: string
  mode: ScaleRenderMode
  items: ScaleItem[]
  /** Usado no modo "likert". */
  options?: ScaleOption[]
  /** Pontuação máxima total (para a barra de progresso do resultado). */
  maxTotal: number
  disclaimer: string
  getSeverity: (score: number) => { label: string; color: string }
}

const LIKERT_5: ScaleOption[] = [
  { value: 0, label: 'Nunca' },
  { value: 1, label: 'Raramente' },
  { value: 2, label: 'Às vezes' },
  { value: 3, label: 'Frequentemente' },
  { value: 4, label: 'Muito frequentemente' },
]

const SEVERITY_5 = (score: number, max: number) => {
  const pct = score / max
  if (pct >= 0.75) return { label: 'Severo', color: '#ef4444' }
  if (pct >= 0.5) return { label: 'Moderado', color: '#f97316' }
  if (pct >= 0.25) return { label: 'Leve', color: '#eab308' }
  return { label: 'Mínimo', color: '#22c55e' }
}

const HAMD_ITEMS: ScaleItem[] = [
  { key: 'hamd_q1', text: 'Humor deprimido (tristeza, desesperança, vazio)' },
  { key: 'hamd_q2', text: 'Sentimento de culpa' },
  { key: 'hamd_q3', text: 'Suicídio (ideação ou pensamentos)' },
  { key: 'hamd_q4', text: 'Insônia inicial (dificuldade para adormecer)' },
  { key: 'hamd_q5', text: 'Insônia intermediária (despertar durante a noite)' },
  { key: 'hamd_q6', text: 'Insônia tardia (despertar muito cedo)' },
  { key: 'hamd_q7', text: 'Trabalho e atividades (perda de interesse/energia)' },
  { key: 'hamd_q8', text: 'Retardo (lentificação psicomotora)' },
  { key: 'hamd_q9', text: 'Agitação (inquietação psicomotora)' },
  { key: 'hamd_q10', text: 'Ansiedade psicológica' },
  { key: 'hamd_q11', text: 'Ansiedade somática (sintomas físicos)' },
  { key: 'hamd_q12', text: 'Sintomas gastrointestinais' },
  { key: 'hamd_q13', text: 'Sintomas sexuais (libido, disfunções)' },
  { key: 'hamd_q14', text: 'Hipocôndria (preocupação com saúde)' },
  { key: 'hamd_q15', text: 'Perda de peso' },
  { key: 'hamd_q16', text: 'Insight (consciência da doença)' },
  { key: 'hamd_q17', text: 'Sintomas gerais (fadiga, fadigabilidade)' },
]

const HAMA_ITEMS: ScaleItem[] = [
  { key: 'hama_q1', text: 'Humor ansioso (preocupação, apreensão, medo)' },
  { key: 'hama_q2', text: 'Tensão (inquietação, tremores, fadiga)' },
  { key: 'hama_q3', text: 'Medos (de escuro, estranhos, solidão)' },
  { key: 'hama_q4', text: 'Insônia (dificuldade para dormir)' },
  { key: 'hama_q5', text: 'Memória/concentração (dificuldade de atenção)' },
  { key: 'hama_q6', text: 'Humor deprimido (perda de interesse)' },
  { key: 'hama_q7', text: 'Somas musculares (dores, rigidez)' },
  { key: 'hama_q8', text: 'Somas sensoriais (zumbidos, visão turva)' },
  { key: 'hama_q9', text: 'Somas cardiovasculares (taquicardia, palpitações)' },
  { key: 'hama_q10', text: 'Somas respiratórios (falta de ar, suspiros)' },
  { key: 'hama_q11', text: 'Somas gastrointestinais (náusea, dor abdominal)' },
  { key: 'hama_q12', text: 'Somas geniturinários (urgência, amenorreia)' },
  { key: 'hama_q13', text: 'Somas autonômicos (boca seca, rubor)' },
  { key: 'hama_q14', text: 'Comportamento na entrevista (tenso, agitado)' },
]

const ASRS_ITEMS: ScaleItem[] = [
  {
    key: 'asrs_q1',
    text: 'Com que frequência você deixa de prestar atenção a detalhes ou comete erros por descuido?',
  },
  {
    key: 'asrs_q2',
    text: 'Com que frequência você tem dificuldade de manter a atenção em tarefas ou atividades?',
  },
  {
    key: 'asrs_q3',
    text: 'Com que frequência você não escuta quando alguém fala diretamente com você?',
  },
  {
    key: 'asrs_q4',
    text: 'Com que frequência você deixa de seguir instruções ou não termina tarefas?',
  },
  {
    key: 'asrs_q5',
    text: 'Com que frequência você tem dificuldade de organizar tarefas e atividades?',
  },
  {
    key: 'asrs_q6',
    text: 'Com que frequência você evita ou reluta em iniciar tarefas que exigem esforço mental?',
  },
  {
    key: 'asrs_q7',
    text: 'Com que frequência você perde coisas necessárias para tarefas (chaves, documentos)?',
  },
  { key: 'asrs_q8', text: 'Com que frequência você se distrai facilmente por estímulos externos?' },
  { key: 'asrs_q9', text: 'Com que frequência você é esquecido nas atividades diárias?' },
  { key: 'asrs_q10', text: 'Com que frequência você movimenta mãos ou pés inquietamente?' },
  {
    key: 'asrs_q11',
    text: 'Com que frequência você se levanta em situações em que deveria ficar sentado?',
  },
  { key: 'asrs_q12', text: 'Com que frequência você se sente inquieto ou agitado?' },
  { key: 'asrs_q13', text: 'Com que frequência você tem dificuldade de relaxar?' },
  { key: 'asrs_q14', text: 'Com que frequência você fala em excesso?' },
  { key: 'asrs_q15', text: 'Com que frequência você completa frases dos outros ou interrompe?' },
  { key: 'asrs_q16', text: 'Com que frequência você tem dificuldade de esperar sua vez?' },
  { key: 'asrs_q17', text: 'Com que frequência você se intromete em conversas ou atividades?' },
  {
    key: 'asrs_q18',
    text: 'Com que frequência os sintomas acima prejudicam sua vida pessoal, social ou profissional?',
  },
]

// MEEM — itens simplificados com pontuação individual (semelhante ao MoCA).
const MEEM_ITEMS: ScaleItem[] = [
  { key: 'meem_q1', text: 'Orientação temporal (ano, mês, dia, semana, estação)', maxScore: 5 },
  {
    key: 'meem_q2',
    text: 'Orientação espacial (estado, cidade, bairro, local, andar)',
    maxScore: 5,
  },
  { key: 'meem_q3', text: 'Registro de três palavras (lembrar imediatamente)', maxScore: 3 },
  { key: 'meem_q4', text: 'Atenção e cálculo (subtrair 7 de 100, cinco vezes)', maxScore: 5 },
  { key: 'meem_q5', text: 'Evocação das três palavras (lembrar após intervalo)', maxScore: 3 },
  { key: 'meem_q6', text: 'Linguagem — nomear objetos (relógio, caneta)', maxScore: 2 },
  { key: 'meem_q7', text: 'Linguagem — repetir frase ("Nem aqui, nem ali, nem lá")', maxScore: 1 },
  { key: 'meem_q8', text: 'Linguagem — compreensão (feche os olhos / pegue o papel)', maxScore: 3 },
  { key: 'meem_q9', text: 'Linguagem — escrever uma frase espontânea', maxScore: 1 },
  {
    key: 'meem_q10',
    text: 'Habilidade visuoespacial — copiar figura (polígonos sobrepostos)',
    maxScore: 1,
  },
]

const DISCLAIMER =
  'Esta escala é uma ferramenta de triagem e não substitui uma avaliação clínica realizada por profissional de saúde.'

export const HAMD_SCALE: ExtraScale = {
  key: 'hamd',
  title: 'Escala de Depressão de Hamilton (HAM-D)',
  subtitle: 'Triagem de gravidade de sintomas depressivos',
  mode: 'likert',
  items: HAMD_ITEMS,
  options: [
    { value: 0, label: 'Ausente' },
    { value: 1, label: 'Leve' },
    { value: 2, label: 'Moderado' },
    { value: 3, label: 'Severo' },
    { value: 4, label: 'Muito severo' },
  ],
  maxTotal: 68,
  disclaimer: DISCLAIMER,
  getSeverity: (s) => {
    if (s >= 23) return { label: 'Depressão severa', color: '#ef4444' }
    if (s >= 19) return { label: 'Depressão moderada-severa', color: '#f97316' }
    if (s >= 14) return { label: 'Depressão moderada', color: '#eab308' }
    if (s >= 8) return { label: 'Depressão leve', color: '#84cc16' }
    return { label: 'Sem depressão', color: '#22c55e' }
  },
}

export const HAMA_SCALE: ExtraScale = {
  key: 'hama',
  title: 'Escala de Ansiedade de Hamilton (HAM-A)',
  subtitle: 'Triagem de gravidade de sintomas ansiosos',
  mode: 'likert',
  items: HAMA_ITEMS,
  options: [
    { value: 0, label: 'Ausente' },
    { value: 1, label: 'Leve' },
    { value: 2, label: 'Moderado' },
    { value: 3, label: 'Severo' },
    { value: 4, label: 'Muito severo' },
  ],
  maxTotal: 56,
  disclaimer: DISCLAIMER,
  getSeverity: (s) => {
    if (s >= 25) return { label: 'Ansiedade severa', color: '#ef4444' }
    if (s >= 18) return { label: 'Ansiedade moderada', color: '#f97316' }
    if (s >= 8) return { label: 'Ansiedade leve', color: '#eab308' }
    return { label: 'Sem ansiedade', color: '#22c55e' }
  },
}

export const ASRS_SCALE: ExtraScale = {
  key: 'asrs18',
  title: 'ASRS-18 (Escala de Auto-Relato de TDAH Adulto)',
  subtitle: 'Triagem de sintomas de TDAH em adultos',
  mode: 'likert',
  items: ASRS_ITEMS,
  options: LIKERT_5,
  maxTotal: 72,
  disclaimer: DISCLAIMER,
  getSeverity: (s) => SEVERITY_5(s, 72),
}

export const MEEM_SCALE: ExtraScale = {
  key: 'meem',
  title: 'Mini Exame do Estado Mental (MEEM)',
  subtitle: 'Triagem cognitiva geral — 30 pontos',
  mode: 'points',
  items: MEEM_ITEMS,
  maxTotal: 30,
  disclaimer: DISCLAIMER,
  getSeverity: (s) => {
    if (s <= 19) return { label: 'Comprometimento cognitivo severo', color: '#ef4444' }
    if (s <= 23) return { label: 'Comprometimento cognitivo leve/moderado', color: '#f97316' }
    return { label: 'Normal', color: '#22c55e' }
  },
}

// Triagem Cognitiva NeuroFlow — itens com pontuação individual (0-30).
// Avalia memória, atenção, funções executivas, linguagem e orientação.
// Complementa MoCA e MEEM e serve como escala atribuível isolada.
const COGNITIVE_TRIAGE_ITEMS: ScaleItem[] = [
  // Orientação (5 pontos)
  { key: 'ct_q1', text: 'Orientação temporal — data atual (dia, mês e ano)', maxScore: 2 },
  { key: 'ct_q2', text: 'Orientação temporal — dia da semana e estação do ano', maxScore: 1 },
  { key: 'ct_q3', text: 'Orientação espacial — local onde se encontra', maxScore: 1 },
  { key: 'ct_q4', text: 'Orientação espacial — cidade e estado', maxScore: 1 },
  // Atenção (6 pontos)
  {
    key: 'ct_q5',
    text: 'Atenção sustentada — repete sequência diretamente (ex.: 3-1-5-2-4)',
    maxScore: 2,
  },
  { key: 'ct_q6', text: 'Atenção dividida — repete sequência inversa', maxScore: 2 },
  {
    key: 'ct_q7',
    text: 'Atenção seletiva — subtrai 7 de 100 cinco vezes (100-93-86-79-72-65)',
    maxScore: 2,
  },
  // Memória (6 pontos)
  {
    key: 'ct_q8',
    text: 'Memória imediata — repete 3 palavras (ex.: casa, árvore, livro)',
    maxScore: 1,
  },
  { key: 'ct_q9', text: 'Memória recente — lembra de eventos das últimas 24 horas', maxScore: 2 },
  {
    key: 'ct_q10',
    text: 'Memória de evocação — recorda as 3 palavras após intervalo',
    maxScore: 3,
  },
  // Funções executivas (6 pontos)
  {
    key: 'ct_q11',
    text: 'Fluência verbal — nomeia palavras começando com a letra "F" (1 min)',
    maxScore: 2,
  },
  {
    key: 'ct_q12',
    text: 'Flexibilidade cognitiva — nomeia semelhanças (ex.: trem e bicicleta)',
    maxScore: 2,
  },
  {
    key: 'ct_q13',
    text: 'Inibição e planejamento — desenha um relógio com ponteiros corretos',
    maxScore: 2,
  },
  // Linguagem (4 pontos)
  { key: 'ct_q14', text: 'Nomeação — nomeia objetos comuns (ex.: relógio, caneta)', maxScore: 2 },
  { key: 'ct_q15', text: 'Repetição — repete uma frase complexa corretamente', maxScore: 1 },
  { key: 'ct_q16', text: 'Compreensão — segue instrução de 3 etapas', maxScore: 1 },
  // Raciocínio visuoespacial (3 pontos)
  {
    key: 'ct_q17',
    text: 'Habilidade visuoespacial — copia figura geométrica (polígonos)',
    maxScore: 1,
  },
  {
    key: 'ct_q18',
    text: 'Reconhecimento visuoespacial — identifica figuras sobrepostas',
    maxScore: 1,
  },
  {
    key: 'ct_q19',
    text: 'Organização visuoespacial — desenha um cubo em perspectiva',
    maxScore: 1,
  },
]

export const COGNITIVE_TRIAGE_SCALE: ExtraScale = {
  key: 'cognitive-triage',
  title: 'Triagem Cognitiva NeuroFlow',
  subtitle: 'Triagem cognitiva complementar (MoCA/MEEM) — 30 pontos',
  mode: 'points',
  items: COGNITIVE_TRIAGE_ITEMS,
  maxTotal: 30,
  disclaimer: DISCLAIMER,
  getSeverity: (s) => {
    if (s <= 12) return { label: 'Comprometimento cognitivo severo', color: '#ef4444' }
    if (s <= 18) return { label: 'Comprometimento cognitivo moderado', color: '#f97316' }
    if (s <= 23) return { label: 'Comprometimento cognitivo leve', color: '#eab308' }
    return { label: 'Cognição dentro do esperado', color: '#22c55e' }
  },
}

/* ----------------------------------------------------------------- */
/* BDI-II — Inventário de Depressão de Beck (21 itens, 0–63)         */
/* Faixas: 0–13 mínima, 14–19 leve, 20–28 moderada, 29–63 grave.    */
/* ----------------------------------------------------------------- */
const BDI_ITEMS: ScaleItem[] = [
  {
    key: 'bdi_q1',
    text: 'Tristeza',
    options: [
      { value: 0, label: '0 - Não me sinto triste.' },
      { value: 1, label: '1 - Eu me sinto triste na maior parte do tempo.' },
      { value: 2, label: '2 - Estou sempre triste e não consigo sair disso.' },
      { value: 3, label: '3 - Estou tão triste ou infeliz que não consigo suportar.' },
    ],
  },
  {
    key: 'bdi_q2',
    text: 'Pessimismo',
    options: [
      { value: 0, label: '0 - Não estou desanimado(a) quanto ao meu futuro.' },
      {
        value: 1,
        label: '1 - Sinto-me mais desanimado(a) quanto ao futuro do que costumava estar.',
      },
      { value: 2, label: '2 - Não espero que as coisas deem certo para mim.' },
      { value: 3, label: '3 - Sinto que meu futuro é sem esperança e só vai piorar.' },
    ],
  },
  {
    key: 'bdi_q3',
    text: 'Fracasso passado',
    options: [
      { value: 0, label: '0 - Não me sinto um(a) fracassado(a).' },
      { value: 1, label: '1 - Tenho fracassado mais do que deveria.' },
      { value: 2, label: '2 - Quando olho para trás, vejo muitos fracassos.' },
      { value: 3, label: '3 - Sinto que sou um fracasso total como pessoa.' },
    ],
  },
  {
    key: 'bdi_q4',
    text: 'Perda de prazer (anedonia)',
    options: [
      { value: 0, label: '0 - Tenho tanto prazer quanto antes nas coisas que gosto.' },
      { value: 1, label: '1 - Não sinto tanto prazer nas coisas como costumava sentir.' },
      { value: 2, label: '2 - Tenho muito pouco prazer nas coisas que antes gostava.' },
      { value: 3, label: '3 - Não consigo ter prazer algum nas coisas que costumava gostar.' },
    ],
  },
  {
    key: 'bdi_q5',
    text: 'Sentimento de culpa',
    options: [
      { value: 0, label: '0 - Não me sinto particularmente culpado(a).' },
      {
        value: 1,
        label: '1 - Sinto-me culpado(a) por muitas coisas que fiz ou deveria ter feito.',
      },
      { value: 2, label: '2 - Sinto-me bastante culpado(a) na maior parte do tempo.' },
      { value: 3, label: '3 - Sinto-me constantemente culpado(a).' },
    ],
  },
  {
    key: 'bdi_q6',
    text: 'Sentimentos de punição',
    options: [
      { value: 0, label: '0 - Não sinto que esteja sendo punido(a).' },
      { value: 1, label: '1 - Sinto que posso ser punido(a).' },
      { value: 2, label: '2 - Espero ser punido(a).' },
      { value: 3, label: '3 - Sinto que estou sendo punido(a).' },
    ],
  },
  {
    key: 'bdi_q7',
    text: 'Autoestima / Autoaversão',
    options: [
      { value: 0, label: '0 - Sinto-me da mesma forma em relação a mim mesmo(a).' },
      { value: 1, label: '1 - Perdi a confiança em mim mesmo(a).' },
      { value: 2, label: '2 - Estou decepcionado(a) comigo mesmo(a).' },
      { value: 3, label: '3 - Não gosto de mim / Eu me odeio.' },
    ],
  },
  {
    key: 'bdi_q8',
    text: 'Autocrítica',
    options: [
      { value: 0, label: '0 - Não me critico nem me culpo mais do que o habitual.' },
      { value: 1, label: '1 - Sou mais crítico(a) comigo mesmo(a) do que costumava ser.' },
      { value: 2, label: '2 - Critico-me por todos os meus defeitos.' },
      { value: 3, label: '3 - Culpo-me por tudo de ruim que acontece.' },
    ],
  },
  {
    key: 'bdi_q9',
    text: 'Ideação ou pensamentos suicidas (Alerta de risco)',
    options: [
      { value: 0, label: '0 - Não tenho nenhum pensamento de me matar.' },
      { value: 1, label: '1 - Tenho pensamentos de me matar, mas não os levaria a cabo.' },
      { value: 2, label: '2 - Gostaria de me matar.' },
      { value: 3, label: '3 - Eu me mataria se tivesse oportunidade.' },
    ],
  },
  {
    key: 'bdi_q10',
    text: 'Choro',
    options: [
      { value: 0, label: '0 - Não choro mais do que costumava.' },
      { value: 1, label: '1 - Choro mais agora do que costumava.' },
      { value: 2, label: '2 - Choro por qualquer coisa.' },
      { value: 3, label: '3 - Tenho vontade de chorar, mas não consigo.' },
    ],
  },
  {
    key: 'bdi_q11',
    text: 'Agitação / Inquietação',
    options: [
      { value: 0, label: '0 - Não me sinto mais inquieto(a) ou agitado(a) do que o habitual.' },
      { value: 1, label: '1 - Sinto-me mais inquieto(a) ou agitado(a) que o habitual.' },
      { value: 2, label: '2 - Estou tão inquieto(a) que é difícil ficar parado(a).' },
      {
        value: 3,
        label: '3 - Estou tão agitado(a) que tenho que ficar me mexendo ou fazendo algo.',
      },
    ],
  },
  {
    key: 'bdi_q12',
    text: 'Perda de interesse',
    options: [
      { value: 0, label: '0 - Não perdi o interesse nas outras pessoas ou atividades.' },
      {
        value: 1,
        label: '1 - Estou menos interessado(a) nas outras pessoas ou coisas do que antes.',
      },
      { value: 2, label: '2 - Perdi quase todo o interesse nas outras pessoas ou coisas.' },
      { value: 3, label: '3 - É difícil ter interesse em qualquer coisa.' },
    ],
  },
  {
    key: 'bdi_q13',
    text: 'Indecisão',
    options: [
      { value: 0, label: '0 - Tomo decisões tão bem quanto antes.' },
      { value: 1, label: '1 - Acho mais difícil tomar decisões agora do que costumava.' },
      { value: 2, label: '2 - Tenho muito mais dificuldade para tomar decisões do que antes.' },
      { value: 3, label: '3 - Tenho problemas para tomar qualquer decisão.' },
    ],
  },
  {
    key: 'bdi_q14',
    text: 'Desvalia / Sentimento de inutilidade',
    options: [
      { value: 0, label: '0 - Não me sinto sem valor / inútil.' },
      { value: 1, label: '1 - Não me considero tão útil ou valoroso(a) quanto antes.' },
      { value: 2, label: '2 - Sinto-me mais inútil quando me comparo com outras pessoas.' },
      { value: 3, label: '3 - Sinto-me completamente sem valor / inútil.' },
    ],
  },
  {
    key: 'bdi_q15',
    text: 'Falta de energia',
    options: [
      { value: 0, label: '0 - Tenho tanta energia quanto sempre tive.' },
      { value: 1, label: '1 - Tenho menos energia do que costumava ter.' },
      { value: 2, label: '2 - Não tenho energia suficiente para fazer muitas coisas.' },
      { value: 3, label: '3 - Não tenho energia suficiente para fazer nada.' },
    ],
  },
  {
    key: 'bdi_q16',
    text: 'Alterações no padrão de sono',
    options: [
      { value: 0, label: '0 - Não tive nenhuma mudança no meu padrão de sono.' },
      { value: 1, label: '1 - Durmo um pouco mais ou um pouco menos que o habitual.' },
      { value: 2, label: '2 - Durmo muito mais ou muito menos que o habitual.' },
      {
        value: 3,
        label: '3 - Durmo a maior parte do dia ou acordo 1–2h mais cedo e não volto a dormir.',
      },
    ],
  },
  {
    key: 'bdi_q17',
    text: 'Irritabilidade',
    options: [
      { value: 0, label: '0 - Não estou mais irritado(a) que o habitual.' },
      { value: 1, label: '1 - Estou mais irritável do que costumava estar.' },
      { value: 2, label: '2 - Estou muito mais irritado(a) do que costumava estar.' },
      { value: 3, label: '3 - Estou irritado(a) o tempo todo.' },
    ],
  },
  {
    key: 'bdi_q18',
    text: 'Alterações de apetite',
    options: [
      { value: 0, label: '0 - Não tive nenhuma mudança no meu apetite.' },
      { value: 1, label: '1 - Meu apetite está um pouco menor ou um pouco maior que o habitual.' },
      { value: 2, label: '2 - Meu apetite está muito menor ou muito maior que o habitual.' },
      { value: 3, label: '3 - Não tenho apetite algum ou tenho vontade de comer o tempo todo.' },
    ],
  },
  {
    key: 'bdi_q19',
    text: 'Dificuldade de concentração',
    options: [
      { value: 0, label: '0 - Consigo me concentrar tão bem quanto antes.' },
      { value: 1, label: '1 - Não consigo me concentrar tão bem quanto costumava.' },
      { value: 2, label: '2 - É difícil manter a mente em qualquer coisa por muito tempo.' },
      { value: 3, label: '3 - Acho que não consigo me concentrar em nada.' },
    ],
  },
  {
    key: 'bdi_q20',
    text: 'Cansaço ou fadiga',
    options: [
      { value: 0, label: '0 - Não estou mais cansado(a) ou fadigado(a) do que o habitual.' },
      { value: 1, label: '1 - Fico cansado(a) ou fadigado(a) mais facilmente do que costumava.' },
      {
        value: 2,
        label: '2 - Fico cansado(a) ou fadigado(a) demais para fazer muitas das coisas que fazia.',
      },
      {
        value: 3,
        label:
          '3 - Fico cansado(a) ou fadigado(a) demais para fazer a maioria das coisas que fazia.',
      },
    ],
  },
  {
    key: 'bdi_q21',
    text: 'Perda de interesse por sexo',
    options: [
      { value: 0, label: '0 - Não notei nenhuma mudança recente no meu interesse por sexo.' },
      { value: 1, label: '1 - Estou menos interessado(a) por sexo do que costumava estar.' },
      { value: 2, label: '2 - Estou muito menos interessado(a) por sexo agora.' },
      { value: 3, label: '3 - Perdi completamente o interesse por sexo.' },
    ],
  },
]

export const BDI_SCALE: ExtraScale = {
  key: 'bdi',
  title: 'Inventário de Depressão de Beck (BDI-II)',
  subtitle: 'Triagem de gravidade de sintomas depressivos — 21 itens',
  mode: 'likert',
  items: BDI_ITEMS,
  options: [
    { value: 0, label: '0 - Ausente / Mínimo' },
    { value: 1, label: '1 - Leve' },
    { value: 2, label: '2 - Moderado' },
    { value: 3, label: '3 - Grave' },
  ],
  maxTotal: 63,
  disclaimer: DISCLAIMER,
  getSeverity: (s) => {
    if (s >= 29) return { label: 'Depressão grave', color: '#ef4444' }
    if (s >= 20) return { label: 'Depressão moderada', color: '#f97316' }
    if (s >= 14) return { label: 'Depressão leve', color: '#eab308' }
    return { label: 'Depressão mínima / Dentro do esperado', color: '#22c55e' }
  },
}

/* ----------------------------------------------------------------- */
/* BAI — Inventário de Ansiedade de Beck (21 itens, 0–63)            */
/* Faixas: 0–7 mínima, 8–15 leve, 16–25 moderada, 26–63 grave.      */
/* ----------------------------------------------------------------- */
const BAI_OPTIONS: ScaleOption[] = [
  { value: 0, label: '0 - Absolutamente não' },
  { value: 1, label: '1 - Levemente (não me incomodou muito)' },
  { value: 2, label: '2 - Moderadamente (foi desagradável, mas pude suportar)' },
  { value: 3, label: '3 - Gravemente (quase não pude suportar)' },
]

const BAI_ITEMS: ScaleItem[] = [
  { key: 'bai_q1', text: 'Dormência ou formigamento' },
  { key: 'bai_q2', text: 'Sensação de calor / Ondas de calor' },
  { key: 'bai_q3', text: 'Tremores nas pernas' },
  { key: 'bai_q4', text: 'Incapaz de relaxar' },
  { key: 'bai_q5', text: 'Medo de que o pior aconteça' },
  { key: 'bai_q6', text: 'Tontura ou vertigem' },
  { key: 'bai_q7', text: 'Palpitações ou coração acelerado' },
  { key: 'bai_q8', text: 'Sensação de instabilidade / Desequilíbrio' },
  { key: 'bai_q9', text: 'Aterrorizado(a) ou com pavor' },
  { key: 'bai_q10', text: 'Nervoso(a)' },
  { key: 'bai_q11', text: 'Sensação de sufocamento / Falta de ar' },
  { key: 'bai_q12', text: 'Tremores nas mãos' },
  { key: 'bai_q13', text: 'Corpo trêmulo / Abalado' },
  { key: 'bai_q14', text: 'Medo de perder o controle' },
  { key: 'bai_q15', text: 'Dificuldade de respirar' },
  { key: 'bai_q16', text: 'Medo de morrer' },
  { key: 'bai_q17', text: 'Assustado(a) / Sobressaltado(a)' },
  { key: 'bai_q18', text: 'Indigestão ou desconforto no abdômen' },
  { key: 'bai_q19', text: 'Sensação de desmaio' },
  { key: 'bai_q20', text: 'Rosto afogueado / Rubor facial' },
  { key: 'bai_q21', text: 'Suores (não devido ao calor)' },
]

export const BAI_SCALE: ExtraScale = {
  key: 'bai',
  title: 'Inventário de Ansiedade de Beck (BAI)',
  subtitle: 'Triagem de gravidade de sintomas ansiosos — 21 itens',
  mode: 'likert',
  items: BAI_ITEMS,
  options: BAI_OPTIONS,
  maxTotal: 63,
  disclaimer: DISCLAIMER,
  getSeverity: (s) => {
    if (s >= 26) return { label: 'Ansiedade grave', color: '#ef4444' }
    if (s >= 16) return { label: 'Ansiedade moderada', color: '#f97316' }
    if (s >= 8) return { label: 'Ansiedade leve', color: '#eab308' }
    return { label: 'Ansiedade mínima / Dentro do esperado', color: '#22c55e' }
  },
}

/* ----------------------------------------------------------------- */
/* WURS-25 — Wender Utah Rating Scale (25 itens, 0–100)              */
/* TDAH no adulto: avaliação retrospectiva de sintomas na infância   */
/* Pontuação: 0=Nada/Muito pouco, 1=Leve, 2=Moderado, 3=Bastante, 4=Muitíssimo */
/* Corte clínico: ≥ 46 pontos sugere história de TDAH na infância    */
/* ----------------------------------------------------------------- */
const WURS_OPTIONS: ScaleOption[] = [
  { value: 0, label: '0 - Nada ou muito pouco' },
  { value: 1, label: '1 - Leve' },
  { value: 2, label: '2 - Moderado' },
  { value: 3, label: '3 - Bastante' },
  { value: 4, label: '4 - Muito / Muitíssimo' },
]

const WURS_ITEMS: ScaleItem[] = [
  {
    key: 'wurs_q1',
    text: 'Como criança, você era hiperativo(a), inquieto(a), incapaz de ficar parado(a)?',
  },
  {
    key: 'wurs_q2',
    text: 'Como criança, você tinha problemas de atenção, distraía-se facilmente?',
  },
  { key: 'wurs_q3', text: 'Como criança, você era impulsivo(a), agia ou falava sem pensar?' },
  {
    key: 'wurs_q4',
    text: 'Como criança, você tinha explosões de raiva ou perda de controle do temperamento?',
  },
  { key: 'wurs_q5', text: 'Como criança, você tinha mudanças bruscas de humor?' },
  { key: 'wurs_q6', text: 'Como criança, você era ansioso(a) ou preocupado(a)?' },
  {
    key: 'wurs_q7',
    text: 'Como criança, você tinha desorganização ou dificuldade para planejar suas atividades?',
  },
  { key: 'wurs_q8', text: 'Como criança, você tendia a sonhar acordado(a) ou desligar-se?' },
  { key: 'wurs_q9', text: 'Como criança, você era teimoso(a) ou desafiador(a)?' },
  {
    key: 'wurs_q10',
    text: 'Como criança, você tinha problemas com a autoridade (pais, professores)?',
  },
  {
    key: 'wurs_q11',
    text: 'Como criança, você se frustrava facilmente (baixa tolerância à frustração)?',
  },
  {
    key: 'wurs_q12',
    text: 'Como criança, você deixava tarefas inacabadas ou desistia antes do fim?',
  },
  {
    key: 'wurs_q13',
    text: 'Como criança, você tinha notas abaixo do seu potencial ou capacidade?',
  },
  {
    key: 'wurs_q14',
    text: 'Como criança, você tinha dificuldade de relacionamento com outras crianças?',
  },
  { key: 'wurs_q15', text: 'Como criança, você era desastrado(a) ou descoordenado(a)?' },
  { key: 'wurs_q16', text: 'Como criança, você tinha baixa autoestima ou sensação de fracasso?' },
  {
    key: 'wurs_q17',
    text: 'Como criança, você tinha problemas de conduta ou comportamento na escola?',
  },
  { key: 'wurs_q18', text: 'Como criança, você tinha dificuldade em esperar sua vez?' },
  { key: 'wurs_q19', text: 'Como criança, você falava excessivamente ou interrompia os outros?' },
  { key: 'wurs_q20', text: 'Como criança, você esquecia recados, deveres ou materiais escolares?' },
  { key: 'wurs_q21', text: 'Como criança, você perdia objetos pessoais com frequência?' },
  { key: 'wurs_q22', text: 'Como criança, você buscava sensações perigosas ou imprudentes?' },
  {
    key: 'wurs_q23',
    text: 'Como criança, você tinha dificuldade para se acalmar após ficar excitado(a)?',
  },
  { key: 'wurs_q24', text: 'Como criança, você sentia inquietação interna constante?' },
  {
    key: 'wurs_q25',
    text: 'De modo geral, como criança, você sentia que tinha mais dificuldades de atenção/comportamento do que seus colegas?',
  },
]

export const WURS_SCALE: ExtraScale = {
  key: 'wurs25',
  title: 'WURS-25 (Wender Utah Rating Scale)',
  subtitle: 'TDAH adulto — Avaliação retrospectiva dos sintomas na infância (corte ≥ 46)',
  mode: 'likert',
  items: WURS_ITEMS,
  options: WURS_OPTIONS,
  maxTotal: 100,
  disclaimer: DISCLAIMER,
  getSeverity: (s) => {
    if (s >= 46)
      return { label: 'Sinais compatíveis com história infantil de TDAH (≥ 46)', color: '#ef4444' }
    if (s >= 36)
      return { label: 'Pontuação limítrofe para história de TDAH (36–45)', color: '#f97316' }
    return { label: 'Abaixo do corte clínico para história de TDAH (< 46)', color: '#22c55e' }
  },
}

/* ----------------------------------------------------------------- */
/* AQ-10 — Autism Spectrum Quotient 10 (Triagem Rápida)              */
/* Adultos (TEA) — 10 itens com pontuação binária padronizada (0–10) */
/* Itens 1, 7, 8, 10 pontuam se Concordo; 2, 3, 4, 5, 6, 9 se Discordo*/
/* Corte clínico: ≥ 6 pontos indica necessidade de avaliação diagnóstica*/
/* ----------------------------------------------------------------- */
const AQ_OPTIONS: ScaleOption[] = [
  { value: 0, label: 'Discordo totalmente' },
  { value: 1, label: 'Discordo parcialmente' },
  { value: 2, label: 'Concordo parcialmente' },
  { value: 3, label: 'Concordo totalmente' },
]

const AQ10_ITEMS: ScaleItem[] = [
  { key: 'aq10_q1', text: 'Muitas vezes noto pequenos sons quando outros não notam.' },
  {
    key: 'aq10_q2',
    text: 'Geralmente me concentro mais no quadro geral do que nos pequenos detalhes.',
  },
  { key: 'aq10_q3', text: 'Acho fácil fazer mais de uma coisa ao mesmo tempo.' },
  {
    key: 'aq10_q4',
    text: 'Se houver uma interrupção, consigo voltar ao que estava fazendo muito rapidamente.',
  },
  {
    key: 'aq10_q5',
    text: 'Acho fácil "ler nas entrelinhas" quando alguém está conversando comigo.',
  },
  { key: 'aq10_q6', text: 'Sei reconhecer se alguém que está me ouvindo está ficando entediado.' },
  {
    key: 'aq10_q7',
    text: 'Quando estou lendo uma história, acho difícil descobrir as intenções dos personagens.',
  },
  {
    key: 'aq10_q8',
    text: 'Gosto de colecionar informações sobre categorias de coisas (tipos de carros, pássaros, plantas, etc.).',
  },
  {
    key: 'aq10_q9',
    text: 'Acho fácil descobrir o que alguém está pensando ou sentindo apenas olhando para o rosto da pessoa.',
  },
  {
    key: 'aq10_q10',
    text: 'Acho difícil descobrir as intenções das outras pessoas em situações sociais.',
  },
]

export const AQ10_SCALE: ExtraScale = {
  key: 'aq10',
  title: 'AQ-10 (Quociente do Espectro Autista — Triagem Rápida)',
  subtitle: 'Triagem de traços do espectro autista em adultos (10 itens, corte ≥ 6)',
  mode: 'likert',
  items: AQ10_ITEMS,
  options: AQ_OPTIONS,
  maxTotal: 10,
  disclaimer: DISCLAIMER,
  getSeverity: (s) => {
    if (s >= 6)
      return {
        label: 'Sinais compatíveis com traços de TEA — Encaminhar para avaliação completa (≥ 6)',
        color: '#ef4444',
      }
    return { label: 'Abaixo do corte de triagem (< 6)', color: '#22c55e' }
  },
}

/* ----------------------------------------------------------------- */
/* AQ-50 — Autism Spectrum Quotient Completo (50 itens, 0–50)        */
/* Baron-Cohen et al. Corte clínico ≥ 32 pontos                      */
/* ----------------------------------------------------------------- */
const AQ50_ITEMS: ScaleItem[] = [
  { key: 'aq_q1', text: 'Prefiro fazer coisas com outras pessoas a fazê-las sozinho.' },
  { key: 'aq_q2', text: 'Prefiro fazer as coisas sempre do mesmo modo.' },
  {
    key: 'aq_q3',
    text: 'Se tento imaginar algo, acho muito fácil construir uma imagem na minha mente.',
  },
  {
    key: 'aq_q4',
    text: 'Frequentemente fico tão absorvido em uma coisa que perco a noção de tudo o mais.',
  },
  { key: 'aq_q5', text: 'Costumo notar pequenos sons que outras pessoas não percebem.' },
  {
    key: 'aq_q6',
    text: 'Costumo prestar atenção a placas de carros ou sequências de informações semelhantes.',
  },
  {
    key: 'aq_q7',
    text: 'Outras pessoas frequentemente me dizem que o que eu disse foi indelicado, embora eu ache que foi apenas sincero.',
  },
  {
    key: 'aq_q8',
    text: 'Quando estou lendo uma história, consigo imaginar facilmente a aparência dos personagens.',
  },
  { key: 'aq_q9', text: 'Sou fascinado por datas.' },
  {
    key: 'aq_q10',
    text: 'Em um grupo social, consigo facilmente acompanhar a conversa de diferentes pessoas.',
  },
  { key: 'aq_q11', text: 'Acho as situações sociais fáceis.' },
  { key: 'aq_q12', text: 'Costumo notar detalhes que outras pessoas não percebem.' },
  { key: 'aq_q13', text: 'Prefiro ir a uma biblioteca do que a uma festa.' },
  { key: 'aq_q14', text: 'Acho fácil inventar histórias.' },
  { key: 'aq_q15', text: 'Sinto-me mais atraído por pessoas do que por coisas.' },
  {
    key: 'aq_q16',
    text: 'Costumo ter interesses muito fortes e fico chateado se não posso me dedicar a eles.',
  },
  { key: 'aq_q17', text: 'Gosto de conversar socialmente (bater papo informal).' },
  { key: 'aq_q18', text: 'Quando falo, nem sempre é fácil para os outros terem a vez de falar.' },
  { key: 'aq_q19', text: 'Sou fascinado por números.' },
  {
    key: 'aq_q20',
    text: 'Quando leio uma história, acho difícil descobrir as intenções dos personagens.',
  },
  { key: 'aq_q21', text: 'Não gosto particularmente de ler ficção.' },
  { key: 'aq_q22', text: 'Acho difícil fazer novos amigos.' },
  { key: 'aq_q23', text: 'Noto padrões nas coisas o tempo todo.' },
  { key: 'aq_q24', text: 'Prefiro ir ao cinema do que ao museu.' },
  { key: 'aq_q25', text: 'Não me incomodo se minha rotina diária for perturbada.' },
  { key: 'aq_q26', text: 'Frequentemente não sei como manter uma conversa fluindo.' },
  {
    key: 'aq_q27',
    text: 'Acho fácil "ler nas entrelinhas" quando alguém está conversando comigo.',
  },
  {
    key: 'aq_q28',
    text: 'Costumo me concentrar mais no quadro geral do que nos pequenos detalhes.',
  },
  { key: 'aq_q29', text: 'Não sou muito bom em lembrar números de telefone.' },
  {
    key: 'aq_q30',
    text: 'Não costumo notar pequenas mudanças em uma situação ou na aparência de uma pessoa.',
  },
  {
    key: 'aq_q31',
    text: 'Sei reconhecer quando alguém que está me ouvindo está ficando entediado.',
  },
  { key: 'aq_q32', text: 'Acho fácil fazer mais de uma coisa ao mesmo tempo.' },
  {
    key: 'aq_q33',
    text: 'Ao falar ao telefone, não tenho certeza de quando é a minha vez de falar.',
  },
  { key: 'aq_q34', text: 'Gosto de fazer coisas espontaneamente.' },
  { key: 'aq_q35', text: 'Costumo ser o último a entender a graça de uma piada.' },
  {
    key: 'aq_q36',
    text: 'Acho fácil perceber o que alguém está pensando ou sentindo apenas olhando para o rosto dela.',
  },
  {
    key: 'aq_q37',
    text: 'Se houver uma interrupção, consigo voltar ao que estava fazendo muito rapidamente.',
  },
  { key: 'aq_q38', text: 'Sou bom em bate-papo social.' },
  {
    key: 'aq_q39',
    text: 'As pessoas frequentemente me dizem que eu fico falando sobre o mesmo assunto repetidamente.',
  },
  {
    key: 'aq_q40',
    text: 'Quando era criança, costumava gostar de brincar de faz-de-conta com outras crianças.',
  },
  { key: 'aq_q41', text: 'Gosto de colecionar informações sobre categorias de coisas.' },
  { key: 'aq_q42', text: 'Acho difícil imaginar como seria ser outra pessoa.' },
  {
    key: 'aq_q43',
    text: 'Gosto de planejar cuidadosamente qualquer atividade da qual vou participar.',
  },
  { key: 'aq_q44', text: 'Gosto de ocasiões sociais.' },
  { key: 'aq_q45', text: 'Acho difícil decifrar as intenções das outras pessoas.' },
  { key: 'aq_q46', text: 'Novas situações me deixam ansioso(a).' },
  { key: 'aq_q47', text: 'Gosto de conhecer novas pessoas.' },
  { key: 'aq_q48', text: 'Sou uma pessoa diplomática.' },
  { key: 'aq_q49', text: 'Não sou muito bom em lembrar as datas de aniversário das pessoas.' },
  { key: 'aq_q50', text: 'Acho muito fácil brincar de jogos de faz-de-conta com crianças.' },
]

export const AQ50_SCALE: ExtraScale = {
  key: 'aq50',
  title: 'AQ (Quociente do Espectro Autista — Versão Completa 50 Itens)',
  subtitle: 'Avaliação de traços do espectro autista em adultos (corte ≥ 32)',
  mode: 'likert',
  items: AQ50_ITEMS,
  options: AQ_OPTIONS,
  maxTotal: 50,
  disclaimer: DISCLAIMER,
  getSeverity: (s) => {
    if (s >= 32)
      return { label: 'Sinais fortemente compatíveis com TEA no adulto (≥ 32)', color: '#ef4444' }
    if (s >= 26) return { label: 'Traços moderados no espectro autista (26–31)', color: '#f97316' }
    return { label: 'Pontuação dentro do padrão neurotípico (< 26)', color: '#22c55e' }
  },
}

/* ----------------------------------------------------------------- */
/* Vanderbilt (VADRS) — Escala de Avaliação de TDAH Infantil         */
/* Heteroaplicável (Pais / Professores). 55 itens (1-18 DSM TDAH,    */
/* 19-26 TOD, 27-40 Conduta, 41-47 Ansiedade/Depressão, 48-55 Desempenho)*/
/* ----------------------------------------------------------------- */
const VANDERBILT_BEHAVIOR_OPTIONS: ScaleOption[] = [
  { value: 0, label: '0 - Nunca' },
  { value: 1, label: '1 - Ocasionalmente' },
  { value: 2, label: '2 - Frequentemente' },
  { value: 3, label: '3 - Muito frequentemente' },
]

const VANDERBILT_PERFORMANCE_OPTIONS: ScaleOption[] = [
  { value: 1, label: '1 - Excelente' },
  { value: 2, label: '2 - Acima da média' },
  { value: 3, label: '3 - Na média' },
  { value: 4, label: '4 - Abaixo da média / Com problemas' },
  { value: 5, label: '5 - Muito problemático' },
]

const VANDERBILT_ITEMS: ScaleItem[] = [
  // Desatenção (1 a 9)
  {
    key: 'vadrs_q1',
    text: 'Não presta atenção a detalhes ou comete erros por descuido nos trabalhos escolares.',
  },
  {
    key: 'vadrs_q2',
    text: 'Tem dificuldade de manter a atenção em tarefas ou atividades lúdicas.',
  },
  { key: 'vadrs_q3', text: 'Parece não escutar quando se fala diretamente com ela.' },
  {
    key: 'vadrs_q4',
    text: 'Não segue instruções até o fim e não termina deveres escolares ou tarefas.',
  },
  { key: 'vadrs_q5', text: 'Tem dificuldade de organizar tarefas e atividades.' },
  {
    key: 'vadrs_q6',
    text: 'Evita, não gosta ou reluta em envolver-se em tarefas que exijam esforço mental constante.',
  },
  {
    key: 'vadrs_q7',
    text: 'Perde coisas necessárias para tarefas ou atividades (lápis, livros, brinquedos).',
  },
  { key: 'vadrs_q8', text: 'Distrai-se facilmente com estímulos alheios à tarefa.' },
  { key: 'vadrs_q9', text: 'É esquecida nas atividades cotidianas.' },
  // Hiperatividade / Impulsividade (10 a 18)
  { key: 'vadrs_q10', text: 'Remexe as mãos ou pés ou se contorce na cadeira.' },
  {
    key: 'vadrs_q11',
    text: 'Levanta-se da cadeira em sala de aula ou em outras situações em que se espera que fique sentada.',
  },
  {
    key: 'vadrs_q12',
    text: 'Corre ou escala excessivamente em situações em que isso é inapropriado.',
  },
  {
    key: 'vadrs_q13',
    text: 'Tem dificuldade de brincar ou se envolver silenciosamente em atividades de lazer.',
  },
  { key: 'vadrs_q14', text: 'Está "a mil" ou age como se estivesse "a motor".' },
  { key: 'vadrs_q15', text: 'Fala excessivamente.' },
  {
    key: 'vadrs_q16',
    text: 'Dá respostas precipitadas antes de as perguntas terem sido completadas.',
  },
  { key: 'vadrs_q17', text: 'Tem dificuldade de esperar a sua vez.' },
  { key: 'vadrs_q18', text: 'Interrompe ou se intromete em conversas ou jogos dos outros.' },
  // TOD - Transtorno Opositor Desafiador (19 a 26)
  { key: 'vadrs_q19', text: 'Perde a calma / tem acessos de raiva.' },
  { key: 'vadrs_q20', text: 'Discute com adultos.' },
  {
    key: 'vadrs_q21',
    text: 'Desafia ativamente ou recusa-se a atender a pedidos ou regras de adultos.',
  },
  { key: 'vadrs_q22', text: 'Incomoda os outros de forma deliberada.' },
  { key: 'vadrs_q23', text: 'Culpa os outros por seus próprios erros ou mau comportamento.' },
  { key: 'vadrs_q24', text: 'É sensível ou facilmente irritável pelos outros.' },
  { key: 'vadrs_q25', text: 'É raivosa e ressentida.' },
  { key: 'vadrs_q26', text: 'É rancorosa ou vingativa.' },
  // Transtorno de Conduta (27 a 40)
  { key: 'vadrs_q27', text: 'Intimida, ameaça ou amedronta os outros.' },
  { key: 'vadrs_q28', text: 'Inicia brigas físicas.' },
  { key: 'vadrs_q29', text: 'Usa armas ou objetos que podem causar dano físico grave.' },
  { key: 'vadrs_q30', text: 'É fisicamente cruel com pessoas.' },
  { key: 'vadrs_q31', text: 'É fisicamente cruel com animais.' },
  { key: 'vadrs_q32', text: 'Rouba em confronto com a vítima.' },
  { key: 'vadrs_q33', text: 'Força alguém a atividade sexual.' },
  { key: 'vadrs_q34', text: 'Ateia fogo deliberadamente com a intenção de causar dano.' },
  { key: 'vadrs_q35', text: 'Destrói deliberadamente a propriedade alheia.' },
  { key: 'vadrs_q36', text: 'Invade a casa, prédio ou carro de outra pessoa.' },
  { key: 'vadrs_q37', text: 'Mente para obter ganhos, favores ou evitar obrigações.' },
  { key: 'vadrs_q38', text: 'Foge de casa à noite pelo menos duas vezes.' },
  { key: 'vadrs_q39', text: 'Falta à escola antes dos 13 anos de idade.' },
  { key: 'vadrs_q40', text: 'Permanece na rua à noite sem autorização antes dos 13 anos.' },
  // Ansiedade / Depressão (41 a 47)
  { key: 'vadrs_q41', text: 'Tem medo, é receosa ou ansiosa.' },
  { key: 'vadrs_q42', text: 'Tem medo de tentar coisas novas por receio de errar.' },
  { key: 'vadrs_q43', text: 'Sente-se sem valor ou inferior aos outros.' },
  { key: 'vadrs_q44', text: 'Culpa a si mesma pelos problemas ou se sente culpada.' },
  { key: 'vadrs_q45', text: 'Sente-se solitária, indesejada ou não amada.' },
  { key: 'vadrs_q46', text: 'É triste, infeliz ou deprimida.' },
  { key: 'vadrs_q47', text: 'Fica constrangida ou envergonhada com facilidade.' },
  // Desempenho acadêmico e relacional (48 a 55)
  {
    key: 'vadrs_q48',
    text: 'Desempenho geral na leitura',
    options: VANDERBILT_PERFORMANCE_OPTIONS,
  },
  {
    key: 'vadrs_q49',
    text: 'Desempenho geral na matemática',
    options: VANDERBILT_PERFORMANCE_OPTIONS,
  },
  {
    key: 'vadrs_q50',
    text: 'Desempenho geral na escrita',
    options: VANDERBILT_PERFORMANCE_OPTIONS,
  },
  {
    key: 'vadrs_q51',
    text: 'Relacionamento com os pais / responsáveis',
    options: VANDERBILT_PERFORMANCE_OPTIONS,
  },
  { key: 'vadrs_q52', text: 'Relacionamento com irmãos', options: VANDERBILT_PERFORMANCE_OPTIONS },
  {
    key: 'vadrs_q53',
    text: 'Relacionamento com colegas / amigos',
    options: VANDERBILT_PERFORMANCE_OPTIONS,
  },
  {
    key: 'vadrs_q54',
    text: 'Participação em atividades organizadas (jogos, esportes)',
    options: VANDERBILT_PERFORMANCE_OPTIONS,
  },
  {
    key: 'vadrs_q55',
    text: 'Comportamento geral em casa / rotina',
    options: VANDERBILT_PERFORMANCE_OPTIONS,
  },
]

export const VANDERBILT_SCALE: ExtraScale = {
  key: 'vanderbilt',
  title: 'Vanderbilt (VADRS — Escala de Avaliação de TDAH e Comorbidades)',
  subtitle: 'TDAH Infantil, TOD, Conduta, Ansiedade/Depressão e Desempenho (55 itens)',
  mode: 'likert',
  items: VANDERBILT_ITEMS,
  options: VANDERBILT_BEHAVIOR_OPTIONS,
  maxTotal: 181,
  disclaimer: DISCLAIMER,
  getSeverity: (s) => {
    if (s >= 50)
      return {
        label: 'Sinais altamente compatíveis com TDAH/Comorbidades em múltiplos domínios',
        color: '#ef4444',
      }
    if (s >= 30)
      return {
        label: 'Sinais moderados de desatenção/hiperatividade ou comorbidades',
        color: '#f97316',
      }
    return { label: 'Pontuação dentro do esperado para a faixa etária', color: '#22c55e' }
  },
}

/* ----------------------------------------------------------------- */
/* SCQ — Social Communication Questionnaire (40 itens SIM/NÃO)       */
/* TEA em crianças de 4+ anos. Respondido por pais/cuidadores        */
/* Item 1 verifica linguagem verbal (não pontua). Itens 2-40 = 0 ou 1*/
/* Pontuação máxima: 39. Ponto de corte clínico clássico: ≥ 15       */
/* ----------------------------------------------------------------- */
const SCQ_OPTIONS: ScaleOption[] = [
  { value: 0, label: 'Não' },
  { value: 1, label: 'Sim' },
]

const SCQ_ITEMS: ScaleItem[] = [
  {
    key: 'scq_q1',
    text: 'A criança é capaz de conversar usando frases ou sentenças curtas? (Pergunta inicial sobre fala)',
  },
  {
    key: 'scq_q2',
    text: 'Você consegue manter uma conversa com ela em que ambos alternam a fala de modo natural?',
  },
  {
    key: 'scq_q3',
    text: 'Ela costuma usar frases estranhas ou dizer as mesmas coisas repetidamente de modo mecânico?',
  },
  { key: 'scq_q4', text: 'Ela costuma usar perguntas ou afirmações socialmente inadequadas?' },
  {
    key: 'scq_q5',
    text: 'Ela costuma confundir pronomes (ex.: dizer "você" quando quer dizer "eu")?',
  },
  {
    key: 'scq_q6',
    text: 'Ela costuma usar palavras inventadas ou frases de formas peculiares que só ela entende?',
  },
  {
    key: 'scq_q7',
    text: 'Ela costuma repetir coisas que ouviu exatamente da mesma maneira (ecolalia)?',
  },
  {
    key: 'scq_q8',
    text: 'Ela já teve formas muito rígidas ou rituais ao fazer as coisas (necessidade de rotina estrita)?',
  },
  { key: 'scq_q9', text: 'As expressões faciais dela costumam ser apropriadas para a situação?' },
  {
    key: 'scq_q10',
    text: 'Ela já usou a sua mão como ferramenta (ex.: puxar a sua mão para pegar algo sem olhar para você)?',
  },
  {
    key: 'scq_q11',
    text: 'Ela já teve interesses especiais muito intensos que pareciam estranhos para outras pessoas?',
  },
  {
    key: 'scq_q12',
    text: 'Ela parece mais interessada em partes de um objeto (ex.: girar as rodas) do que na função do brinquedo?',
  },
  {
    key: 'scq_q13',
    text: 'Ela tem interesses sensoriais especiais ou incomuns (cheirar, lamber ou tocar excessivamente coisas)?',
  },
  { key: 'scq_q14', text: 'Ela reage de modo muito intenso ou adverso a certos sons cotidianos?' },
  {
    key: 'scq_q15',
    text: 'Ela costuma fazer movimentos estranhos com as mãos ou dedos (abanar mãos, estalar dedos perto dos olhos)?',
  },
  {
    key: 'scq_q16',
    text: 'Ela tem movimentos corporais repetitivos complexos (balançar o tronco, girar sobre si mesma)?',
  },
  {
    key: 'scq_q17',
    text: 'Ela já se machucou de forma deliberada (bater a cabeça, morder a própria mão)?',
  },
  {
    key: 'scq_q18',
    text: 'Ela costuma carregar objetos específicos e incomuns para todos os lugares?',
  },
  {
    key: 'scq_q19',
    text: 'Ela tem algum amigo próximo da mesma idade com quem mantém amizade recíproca?',
  },
  {
    key: 'scq_q20',
    text: 'Ela costuma conversar com você apenas para compartilhar algo interessante, sem pedir nada em troca?',
  },
  {
    key: 'scq_q21',
    text: 'Ela costuma imitar espontaneamente o que você faz (gestos, atividades)?',
  },
  {
    key: 'scq_q22',
    text: 'Ela costuma apontar espontaneamente para coisas para mostrar algo interessante para você?',
  },
  {
    key: 'scq_q23',
    text: 'Ela costuma usar gestos sociais apropriados (acenar tchau, assentir com a cabeça)?',
  },
  { key: 'scq_q24', text: 'Ela acena com a cabeça para dizer "sim"?' },
  { key: 'scq_q25', text: 'Ela balança a cabeça de um lado para o outro para dizer "não"?' },
  {
    key: 'scq_q26',
    text: 'Ela costuma olhar diretamente nos seus olhos quando conversa ou brinca com você?',
  },
  { key: 'scq_q27', text: 'Ela sorri de volta quando você sorri para ela?' },
  {
    key: 'scq_q28',
    text: 'Ela costuma mostrar coisas que gosta para você apenas para compartilhar a alegria?',
  },
  {
    key: 'scq_q29',
    text: 'Ela costuma oferecer coisas espontaneamente para você (ex.: um pedaço de biscoito)?',
  },
  {
    key: 'scq_q30',
    text: 'Ela costuma demonstrar quando percebe que você está triste ou machucado(a)?',
  },
  { key: 'scq_q31', text: 'Ela costuma procurar conforto quando está triste ou machucada?' },
  {
    key: 'scq_q32',
    text: 'Ela tenta fazer você participar das brincadeiras dela ou olhar para o que ela está fazendo?',
  },
  { key: 'scq_q33', text: 'Ela reage socialmente a outras crianças com interesse recíproco?' },
  {
    key: 'scq_q34',
    text: 'Se você olha e aponta para algo longe, ela olha na direção do seu dedo?',
  },
  {
    key: 'scq_q35',
    text: 'Ela brinca de faz-de-conta ou imaginação (ex.: fingir que alimenta uma boneca)?',
  },
  { key: 'scq_q36', text: 'Ela brinca de jogos cooperativos com regras com outras crianças?' },
  {
    key: 'scq_q37',
    text: 'Ela modula o tom de voz de modo natural ao falar (ou fala de modo monótono/cantado)?',
  },
  { key: 'scq_q38', text: 'Ela se interessa por brincadeiras em grupo de forma integrada?' },
  {
    key: 'scq_q39',
    text: 'Ela consegue responder ao contato social iniciado por outras pessoas de forma adequada?',
  },
  { key: 'scq_q40', text: 'Ela demonstra flexibilidade quando há mudanças planejadas na rotina?' },
]

export const SCQ_SCALE: ExtraScale = {
  key: 'scq',
  title: 'SCQ (Social Communication Questionnaire)',
  subtitle: 'TEA infantil (4+ anos) — Questionário de Comunicação Social (40 itens, corte ≥ 15)',
  mode: 'likert',
  items: SCQ_ITEMS,
  options: SCQ_OPTIONS,
  maxTotal: 39,
  disclaimer: DISCLAIMER,
  getSeverity: (s) => {
    if (s >= 15)
      return {
        label:
          'Sinais compatíveis com risco para Espectro Autista (≥ 15) — Recomenda-se avaliação completa (ex: ADOS/ADI-R)',
        color: '#ef4444',
      }
    if (s >= 11)
      return {
        label: 'Risco limítrofe para alterações na comunicação social (11–14)',
        color: '#f97316',
      }
    return { label: 'Abaixo do corte de risco para TEA (< 15)', color: '#22c55e' }
  },
}

export const EXTRA_SCALES: Record<string, ExtraScale> = {
  hamd: HAMD_SCALE,
  hama: HAMA_SCALE,
  bdi: BDI_SCALE,
  bai: BAI_SCALE,
  asrs18: ASRS_SCALE,
  meem: MEEM_SCALE,
  'cognitive-triage': COGNITIVE_TRIAGE_SCALE,
  wurs25: WURS_SCALE,
  wurs: WURS_SCALE,
  aq10: AQ10_SCALE,
  aq50: AQ50_SCALE,
  aq: AQ50_SCALE,
  vanderbilt: VANDERBILT_SCALE,
  vadrs: VANDERBILT_SCALE,
  scq: SCQ_SCALE,
}
