/**
 * Módulo de Dados e Regras de Avaliação para o TMT (Trail Making Test - Partes A e B)
 *
 * O Trail Making Test avalia velocidade de processamento, atenção visual sustentada/alternada,
 * rastreamento visual e flexibilidade cognitiva (funções executivas).
 *
 * Critérios padronizados exigidos:
 * Parte A:
 *   - ≤ 29s: preservado
 *   - 30–78s: limítrofe
 *   - > 78s: lentificação significativa
 *
 * Parte B:
 *   - ≤ 75s: preservado
 *   - 76–272s: lentificação leve/moderada
 *   - > 272s: déficit executivo
 *
 * Diferencial B - A e contagem de erros.
 */

export interface TmtClassification {
  status: 'preservado' | 'limitrofe' | 'deficit'
  label: string
  color: string
}

export interface TmtResult {
  timeA: number // segundos
  timeB: number // segundos
  diffBA: number // tempo B - tempo A
  errorsA: number
  errorsB: number
  classA: TmtClassification
  classB: TmtClassification
  globalClassification: string
}

export const TMT_DISCLAIMER =
  'O Trail Making Test (TMT A/B) avalia atenção visual, velocidade psicomotora e flexibilidade executiva. Resultados acima dos pontos de corte sugerem lentificação ou prejuízo executivo e devem ser correlacionados com o contexto clínico e escolaridade.'

export function classifyTmtA(seconds: number): TmtClassification {
  if (seconds <= 29) {
    return { status: 'preservado', label: 'Desempenho preservado (≤29s)', color: '#2ECC71' }
  }
  if (seconds <= 78) {
    return { status: 'limitrofe', label: 'Desempenho limítrofe (30–78s)', color: '#F39C12' }
  }
  return {
    status: 'deficit',
    label: 'Lentificação psicomotora significativa (>78s)',
    color: '#E74C3C',
  }
}

export function classifyTmtB(seconds: number): TmtClassification {
  if (seconds <= 75) {
    return { status: 'preservado', label: 'Desempenho preservado (≤75s)', color: '#2ECC71' }
  }
  if (seconds <= 272) {
    return {
      status: 'limitrofe',
      label: 'Lentificação executiva leve a moderada (76–272s)',
      color: '#F39C12',
    }
  }
  return { status: 'deficit', label: 'Déficit executivo significativo (>272s)', color: '#E74C3C' }
}

export function calculateTmtResult(
  timeA: number,
  timeB: number,
  errorsA: number = 0,
  errorsB: number = 0,
): TmtResult {
  const classA = classifyTmtA(timeA)
  const classB = classifyTmtB(timeB)
  const diffBA = Math.max(0, timeB - timeA)

  let globalClassification = 'Desempenho preservado em atenção e flexibilidade cognitiva'
  if (classB.status === 'deficit' || classA.status === 'deficit') {
    globalClassification =
      'Sinais compatíveis com lentificação e prejuízo no controle executivo/alternância'
  } else if (classB.status === 'limitrofe' || classA.status === 'limitrofe') {
    globalClassification = 'Desempenho limítrofe em velocidade psicomotora e alternância'
  }

  return {
    timeA,
    timeB,
    diffBA,
    errorsA,
    errorsB,
    classA,
    classB,
    globalClassification,
  }
}

/** Chaves canônicas gravadas em anamnesis_responses */
export const TMT_KEYS = {
  TIME_A: 'tmt_a_time',
  TIME_B: 'tmt_b_time',
  DIFF_BA: 'tmt_diff_ba',
  ERRORS_A: 'tmt_a_errors',
  ERRORS_B: 'tmt_b_errors',
  TOTAL_SCORE: 'tmt_total',
} as const
