export interface ScaleScores {
  phq9: number | null
  gad7: number | null
  assq: number | null
  snapIv: number | null
  asrs18: number | null
  wurs25?: number | null
  aq10?: number | null
  aq50?: number | null
  vanderbilt?: number | null
  scq?: number | null
  moca: number | null
  meem: number | null
  hamd: number | null
  hama: number | null
  bdi?: number | null
  bai?: number | null
  ybocs: number | null
  sds: number | null
  tmtA?: number | null
  tmtB?: number | null
  tmtDiff?: number | null
  fluenciaAnimais?: number | null
  fluenciaFrutas?: number | null
  fluenciaSemanticaTotal?: number | null
}

export interface ScreeningFinding {
  category: string
  suggestion: string
  scale: string
  score: number | null
  threshold: string
}

export interface ScreeningResult {
  findings: ScreeningFinding[]
  comorbidities: string[]
  fullSuggestion: string
  hasData: boolean
}

export const snapKeys: string[] = Array.from({ length: 18 }, (_, i) => `snapiv_q${i + 1}`)
export const snapLegacyKeys: string[] = Array.from({ length: 18 }, (_, i) => `snap_${i + 1}`)
export const meemKeys: string[] = Array.from({ length: 10 }, (_, i) => `meem_q${i + 1}`)
export const mocaKeys: string[] = Array.from({ length: 30 }, (_, i) => `moca_q${i + 1}`)
export const asrs18Keys: string[] = Array.from({ length: 18 }, (_, i) => `asrs_q${i + 1}`)
export const hamdKeys: string[] = Array.from({ length: 17 }, (_, i) => `hamd_q${i + 1}`)
export const hamaKeys: string[] = Array.from({ length: 14 }, (_, i) => `hama_q${i + 1}`)
export const bdiKeys: string[] = Array.from({ length: 21 }, (_, i) => `bdi_q${i + 1}`)
export const baiKeys: string[] = Array.from({ length: 21 }, (_, i) => `bai_q${i + 1}`)
export const ybocsKeys: string[] = Array.from({ length: 10 }, (_, i) => `ybocs_q${i + 1}`)
export const sdsKeys: string[] = ['sds_q1', 'sds_q2', 'sds_q3']
export const tmtKeys: string[] = [
  'tmt_a_time',
  'tmt_b_time',
  'tmt_diff_ba',
  'tmt_a_errors',
  'tmt_b_errors',
  'tmt_total',
]
export const semanticFluencyKeys: string[] = [
  'fluencia_animais',
  'fluencia_frutas',
  'fluencia_semantica_total',
  'fluencia_animais_words',
  'fluencia_frutas_words',
]
export const wursKeys: string[] = Array.from({ length: 25 }, (_, i) => `wurs_q${i + 1}`)
export const aq10Keys: string[] = Array.from({ length: 10 }, (_, i) => `aq10_q${i + 1}`)
export const aq50Keys: string[] = Array.from({ length: 50 }, (_, i) => `aq_q${i + 1}`)
export const vanderbiltKeys: string[] = Array.from({ length: 55 }, (_, i) => `vadrs_q${i + 1}`)
export const scqKeys: string[] = Array.from({ length: 40 }, (_, i) => `scq_q${i + 1}`)

export function generateScreening(scores: ScaleScores): ScreeningResult {
  const findings: ScreeningFinding[] = []

  if (scores.assq !== null && scores.assq >= 15) {
    findings.push({
      category: 'TEA',
      suggestion: 'Sinais sugestivos de Autismo - Encaminhar para ADOS',
      scale: 'ASSQ',
      score: scores.assq,
      threshold: '≥ 15',
    })
  }
  if (scores.snapIv !== null && scores.snapIv >= 1.5) {
    findings.push({
      category: 'TDAH',
      suggestion: 'Sinais sugestivos de TDAH',
      scale: 'SNAP-IV',
      score: scores.snapIv,
      threshold: '≥ 1.5',
    })
  }
  if (scores.asrs18 !== null && scores.asrs18 >= 36) {
    findings.push({
      category: 'TDAH',
      suggestion: 'Sinais sugestivos de TDAH (Adulto)',
      scale: 'ASRS-18',
      score: scores.asrs18,
      threshold: '≥ 36',
    })
  }
  if (scores.wurs25 !== null && scores.wurs25 !== undefined && scores.wurs25 >= 46) {
    findings.push({
      category: 'TDAH',
      suggestion: 'Sinais compatíveis com história de TDAH na infância (WURS-25)',
      scale: 'WURS-25',
      score: scores.wurs25,
      threshold: '≥ 46',
    })
  }
  if (scores.vanderbilt !== null && scores.vanderbilt !== undefined && scores.vanderbilt >= 30) {
    findings.push({
      category: 'TDAH / Comportamento',
      suggestion: 'Sinais indicativos de TDAH e/ou comorbidades comportamentais (Vanderbilt)',
      scale: 'Vanderbilt (VADRS)',
      score: scores.vanderbilt,
      threshold: '≥ 30',
    })
  }
  if (scores.aq10 !== null && scores.aq10 !== undefined && scores.aq10 >= 6) {
    findings.push({
      category: 'TEA',
      suggestion: 'Triagem positiva para traços do espectro autista em adultos (AQ-10)',
      scale: 'AQ-10',
      score: scores.aq10,
      threshold: '≥ 6',
    })
  }
  if (scores.aq50 !== null && scores.aq50 !== undefined && scores.aq50 >= 32) {
    findings.push({
      category: 'TEA',
      suggestion: 'Traços clínicos significativos no espectro autista (AQ-50)',
      scale: 'AQ-50',
      score: scores.aq50,
      threshold: '≥ 32',
    })
  }
  if (scores.scq !== null && scores.scq !== undefined && scores.scq >= 15) {
    findings.push({
      category: 'TEA',
      suggestion: 'Risco clínico para Transtorno do Espectro Autista infantil (SCQ)',
      scale: 'SCQ',
      score: scores.scq,
      threshold: '≥ 15',
    })
  }
  if (scores.moca !== null && scores.moca < 24) {
    findings.push({
      category: 'Declínio Cognitivo',
      suggestion: 'Sinais sugestivos de Declínio Cognitivo',
      scale: 'MoCA',
      score: scores.moca,
      threshold: '< 24',
    })
  }
  if (scores.meem !== null && scores.meem < 24) {
    findings.push({
      category: 'Declínio Cognitivo',
      suggestion: 'Sinais sugestivos de Declínio Cognitivo',
      scale: 'MEEM',
      score: scores.meem,
      threshold: '< 24',
    })
  }
  if (scores.phq9 !== null && scores.phq9 >= 10) {
    findings.push({
      category: 'Depressão',
      suggestion: 'Sinais sugestivos de Transtorno de Humor (depressão)',
      scale: 'PHQ-9',
      score: scores.phq9,
      threshold: '≥ 10',
    })
  }
  if (scores.gad7 !== null && scores.gad7 >= 8) {
    findings.push({
      category: 'Ansiedade',
      suggestion: 'Sinais sugestivos de Transtorno de Humor (ansiedade)',
      scale: 'GAD-7',
      score: scores.gad7,
      threshold: '≥ 8',
    })
  }
  if (scores.hamd !== null && scores.hamd >= 8) {
    findings.push({
      category: 'Depressão',
      suggestion: 'Sinais sugestivos de Transtorno de Humor (depressão)',
      scale: 'HAM-D',
      score: scores.hamd,
      threshold: '≥ 8',
    })
  }
  if (scores.bdi !== null && scores.bdi !== undefined && scores.bdi >= 14) {
    findings.push({
      category: 'Depressão',
      suggestion: 'Sinais sugestivos de Depressão (Inventário de Beck BDI-II)',
      scale: 'BDI-II',
      score: scores.bdi,
      threshold: '≥ 14',
    })
  }
  if (scores.hama !== null && scores.hama >= 8) {
    findings.push({
      category: 'Ansiedade',
      suggestion: 'Sinais sugestivos de Transtorno de Ansiedade',
      scale: 'HAM-A',
      score: scores.hama,
      threshold: '≥ 8',
    })
  }
  if (scores.bai !== null && scores.bai !== undefined && scores.bai >= 8) {
    findings.push({
      category: 'Ansiedade',
      suggestion: 'Sinais sugestivos de Ansiedade (Inventário de Beck BAI)',
      scale: 'BAI',
      score: scores.bai,
      threshold: '≥ 8',
    })
  }
  if (scores.ybocs !== null && scores.ybocs >= 8) {
    findings.push({
      category: 'TOC',
      suggestion: 'Sinais sugestivos de TOC',
      scale: 'Y-BOCS',
      score: scores.ybocs,
      threshold: '≥ 8',
    })
  }
  if (scores.sds !== null && scores.sds >= 5) {
    findings.push({
      category: 'Incapacidade Funcional',
      suggestion: 'Sinais de comprometimento funcional significativo',
      scale: 'SDS',
      score: scores.sds,
      threshold: '≥ 5',
    })
  }
  if (scores.tmtA !== null && scores.tmtA !== undefined && scores.tmtA > 78) {
    findings.push({
      category: 'Atenção e Velocidade',
      suggestion: 'Sinais de lentificação psicomotora e atenção visual rebaixada',
      scale: 'TMT Parte A',
      score: scores.tmtA,
      threshold: '> 78s',
    })
  } else if (scores.tmtA !== null && scores.tmtA !== undefined && scores.tmtA >= 30) {
    findings.push({
      category: 'Atenção e Velocidade',
      suggestion: 'Desempenho limítrofe em velocidade de processamento visual',
      scale: 'TMT Parte A',
      score: scores.tmtA,
      threshold: '30–78s',
    })
  }
  if (scores.tmtB !== null && scores.tmtB !== undefined && scores.tmtB > 272) {
    findings.push({
      category: 'Funções Executivas',
      suggestion: 'Sinais compatíveis com déficit executivo significativo na alternância',
      scale: 'TMT Parte B',
      score: scores.tmtB,
      threshold: '> 272s',
    })
  } else if (scores.tmtB !== null && scores.tmtB !== undefined && scores.tmtB >= 76) {
    findings.push({
      category: 'Funções Executivas',
      suggestion: 'Lentificação executiva leve a moderada na alternância',
      scale: 'TMT Parte B',
      score: scores.tmtB,
      threshold: '76–272s',
    })
  }
  if (
    scores.fluenciaAnimais !== null &&
    scores.fluenciaAnimais !== undefined &&
    scores.fluenciaAnimais < 12
  ) {
    findings.push({
      category: 'Linguagem e Memória',
      suggestion: 'Rebaixamento em fluência verbal semântica (animais)',
      scale: 'Fluência Animais',
      score: scores.fluenciaAnimais,
      threshold: '< 12',
    })
  } else if (
    scores.fluenciaAnimais !== null &&
    scores.fluenciaAnimais !== undefined &&
    scores.fluenciaAnimais <= 14
  ) {
    findings.push({
      category: 'Linguagem e Memória',
      suggestion: 'Desempenho limítrofe em fluência verbal semântica (animais)',
      scale: 'Fluência Animais',
      score: scores.fluenciaAnimais,
      threshold: '12–14',
    })
  }
  if (
    scores.fluenciaFrutas !== null &&
    scores.fluenciaFrutas !== undefined &&
    scores.fluenciaFrutas < 9
  ) {
    findings.push({
      category: 'Linguagem e Memória',
      suggestion: 'Rebaixamento em fluência verbal semântica (frutas)',
      scale: 'Fluência Frutas',
      score: scores.fluenciaFrutas,
      threshold: '< 9',
    })
  } else if (
    scores.fluenciaFrutas !== null &&
    scores.fluenciaFrutas !== undefined &&
    scores.fluenciaFrutas <= 11
  ) {
    findings.push({
      category: 'Linguagem e Memória',
      suggestion: 'Desempenho limítrofe em fluência verbal semântica (frutas)',
      scale: 'Fluência Frutas',
      score: scores.fluenciaFrutas,
      threshold: '9–11',
    })
  }

  const comorbidities = detectComorbidities(findings)
  const fullSuggestion = buildSuggestion(findings, comorbidities)

  return { findings, comorbidities, fullSuggestion, hasData: findings.length > 0 }
}

function detectComorbidities(findings: ScreeningFinding[]): string[] {
  const cats = new Set(findings.map((f) => f.category))
  const combos: string[] = []
  if (cats.has('TDAH') && cats.has('Depressão')) combos.push('TDAH + Depressão')
  if (cats.has('TEA') && cats.has('Ansiedade')) combos.push('TEA + Ansiedade')
  if (cats.has('Declínio Cognitivo') && cats.has('Depressão'))
    combos.push('Declínio cognitivo + Depressão')
  return combos
}

function buildSuggestion(findings: ScreeningFinding[], comorbidities: string[]): string {
  if (findings.length === 0) {
    return 'Os resultados das escalas estão dentro dos parâmetros esperados. Nenhuma indicação clínica significativa no momento.'
  }
  const lines = findings.map(
    (f) => `- ${f.suggestion} (${f.scale}: ${f.score}, corte ${f.threshold})`,
  )
  if (comorbidities.length > 0) {
    lines.push('', 'Comorbidades detectadas:')
    comorbidities.forEach((c) => lines.push(`- ${c}`))
  }
  lines.push(
    '',
    'Esta é uma triagem inicial. O diagnóstico definitivo requer avaliação clínica presencial especializada.',
  )
  return lines.join('\n')
}

export function computeGlobalSeverity(scores: ScaleScores): 'low' | 'moderate' | 'high' {
  const screening = generateScreening(scores)
  if (screening.findings.length === 0) return 'low'

  const hasHighSeverity =
    (scores.phq9 !== null && scores.phq9 >= 15) ||
    (scores.gad7 !== null && scores.gad7 >= 15) ||
    (scores.snapIv !== null && scores.snapIv > 2.0) ||
    (scores.assq !== null && scores.assq >= 22) ||
    (scores.asrs18 !== null && scores.asrs18 >= 48) ||
    (scores.wurs25 !== null && scores.wurs25 !== undefined && scores.wurs25 >= 55) ||
    (scores.vanderbilt !== null && scores.vanderbilt !== undefined && scores.vanderbilt >= 50) ||
    (scores.aq10 !== null && scores.aq10 !== undefined && scores.aq10 >= 8) ||
    (scores.aq50 !== null && scores.aq50 !== undefined && scores.aq50 >= 35) ||
    (scores.scq !== null && scores.scq !== undefined && scores.scq >= 22) ||
    (scores.moca !== null && scores.moca < 18) ||
    (scores.meem !== null && scores.meem < 18) ||
    (scores.hamd !== null && scores.hamd >= 20) ||
    (scores.hama !== null && scores.hama >= 20) ||
    (scores.bdi !== null && scores.bdi !== undefined && scores.bdi >= 20) ||
    (scores.bai !== null && scores.bai !== undefined && scores.bai >= 16) ||
    (scores.ybocs !== null && scores.ybocs >= 24) ||
    (scores.sds !== null && scores.sds >= 8)

  if (hasHighSeverity) return 'high'
  return 'moderate'
}
