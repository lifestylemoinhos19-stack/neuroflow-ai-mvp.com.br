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

export const EXTRA_SCALES: Record<string, ExtraScale> = {
  hamd: HAMD_SCALE,
  hama: HAMA_SCALE,
  asrs18: ASRS_SCALE,
  meem: MEEM_SCALE,
  'cognitive-triage': COGNITIVE_TRIAGE_SCALE,
}
