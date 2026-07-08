export interface ScaleScores {
  phq9: number | null
  gad7: number | null
  assq: number | null
  snapIv: number | null
  asrs18: number | null
  moca: number | null
  meem: number | null
  hamd: number | null
  hama: number | null
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
      suggestion: 'Sinais sugestivos de TDAH',
      scale: 'ASRS-18',
      score: scores.asrs18,
      threshold: '≥ 36',
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
      suggestion: 'Sinais sugestivos de Transtorno de Humor',
      scale: 'HAM-D',
      score: scores.hamd,
      threshold: '≥ 8',
    })
  }
  if (scores.hama !== null && scores.hama >= 8) {
    findings.push({
      category: 'Ansiedade',
      suggestion: 'Sinais sugestivos de Transtorno de Humor',
      scale: 'HAM-A',
      score: scores.hama,
      threshold: '≥ 8',
    })
  }

  const cats = new Set(findings.map((f) => f.category))
  const comorbidities: string[] = []
  if (cats.has('TDAH') && cats.has('Depressão')) comorbidities.push('TDAH + Depressão')
  if (cats.has('TEA') && cats.has('Ansiedade')) comorbidities.push('TEA + Ansiedade')
  if (cats.has('Declínio Cognitivo') && cats.has('Depressão'))
    comorbidities.push('Declínio cognitivo + Depressão')

  const lines =
    findings.length === 0
      ? [
          'Os resultados das escalas estão dentro dos parâmetros esperados. Nenhuma indicação clínica significativa no momento.',
        ]
      : findings.map((f) => `- ${f.suggestion} (${f.scale}: ${f.score}, corte ${f.threshold})`)
  if (comorbidities.length > 0) {
    lines.push('', 'Comorbidades detectadas:')
    comorbidities.forEach((c) => lines.push(`- ${c}`))
  }
  if (findings.length > 0) {
    lines.push(
      '',
      'Esta é uma triagem inicial. O diagnóstico definitivo requer avaliação clínica presencial especializada.',
    )
  }

  return { findings, comorbidities, fullSuggestion: lines.join('\n'), hasData: findings.length > 0 }
}
