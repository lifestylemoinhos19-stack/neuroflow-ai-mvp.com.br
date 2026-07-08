export interface EducationalInterpretation {
  title: string
  severity: 'baixo' | 'moderado' | 'elevado'
  summary: string
  guidance: string[]
  recommendations: string
}

type ScaleType = 'snap-iv' | 'assq' | 'cbcl'

export function generateEducationalInterpretation(
  scaleType: ScaleType,
  result: Record<string, unknown>,
): EducationalInterpretation {
  if (scaleType === 'snap-iv') return snapIVInterpretation(result)
  if (scaleType === 'assq') return assqInterpretation(result)
  return cbclInterpretation(result)
}

function snapIVInterpretation(r: Record<string, unknown>): EducationalInterpretation {
  const sev = (r.severity as string) || 'baixo'
  const inatt = Number(r.inattentionAvg) || 0
  const hyper = Number(r.hyperactivityAvg) || 0
  const summaries: Record<string, string> = {
    baixo: `As pontuações médias (${inatt.toFixed(1)} desatenção, ${hyper.toFixed(1)} hiperatividade) estão dentro dos parâmetros esperados para a idade. Não há indicadores significativos de dificuldades atencionais neste momento.`,
    moderado: `Algumas respostas sugerem dificuldades leves de atenção (${inatt.toFixed(1)}) ou hiperatividade (${hyper.toFixed(1)}). Recomenda-se monitorar o comportamento e implementar estratégias de apoio educacional.`,
    elevado: `As pontuações (${inatt.toFixed(1)} desatenção, ${hyper.toFixed(1)} hiperatividade) indicam indicadores significativos. Recomenda-se busca por avaliação profissional especializada para investigação complementar.`,
  }
  return {
    title: 'SNAP-IV — Triagem de TDAH',
    severity: sev as EducationalInterpretation['severity'],
    summary: summaries[sev] || summaries.baixo,
    guidance: [
      'Esta triagem é educacional e não constitui diagnóstico clínico.',
      'Os resultados refletem observações do momento e podem variar.',
      'Estratégias de organização e rotina podem beneficiar todas as crianças.',
    ],
    recommendations:
      sev === 'elevado'
        ? 'Consulte um profissional de saúde especializado para avaliação detalhada.'
        : 'Continue monitorando o desenvolvimento e mantenha diálogo com a escola.',
  }
}

function assqInterpretation(r: Record<string, unknown>): EducationalInterpretation {
  const sev = (r.severity as string) || 'baixo'
  const total = Number(r.total) || 0
  const threshold = Number(r.threshold) || 19
  const summaries: Record<string, string> = {
    baixo: `A pontuação total (${total}) está abaixo do limiar de triagem (${threshold}). As habilidades de comunicação social estão dentro do esperado para a idade.`,
    moderado: `A pontuação (${total}) aproxima-se do limiar (${threshold}). Algumas características de comunicação social podem merecer atenção. Monitorar o desenvolvimento.`,
    elevado: `A pontuação (${total}) ultrapassa o limiar (${threshold}), indicando indicadores significativos. Avaliação profissional especializada é recomendada.`,
  }
  return {
    title: 'ASSQ — Triagem do Espectro Autista',
    severity: sev as EducationalInterpretation['severity'],
    summary: summaries[sev] || summaries.baixo,
    guidance: [
      'Esta triagem é educacional e não constitui diagnóstico.',
      'Habilidades sociais se desenvolvem de forma única em cada criança.',
      'Interações sociais estruturadas podem apoiar o desenvolvimento.',
    ],
    recommendations:
      sev === 'elevado'
        ? 'Busque avaliação com neuropediatra ou psiquiatra infantil.'
        : 'Continue observando o desenvolvimento social da criança.',
  }
}

function cbclInterpretation(r: Record<string, unknown>): EducationalInterpretation {
  const sev = (r.severity as string) || 'baixo'
  const int = Number(r.internalizing) || 0
  const ext = Number(r.externalizing) || 0
  const total = Number(r.total) || 0
  const summaries: Record<string, string> = {
    baixo: `Os escores comportamentais (internalizante: ${int}, externalizante: ${ext}, total: ${total}) estão dentro da faixa esperada. Não há indicadores comportamentais significativos.`,
    moderado: `Alguns comportamentos (internalizante: ${int}, externalizante: ${ext}) merecem atenção. Monitorar e implementar estratégias de apoio emocional e comportamental.`,
    elevado: `Os escores (${total} total) indicam indicadores comportamentais significativos. Avaliação profissional especializada é recomendada.`,
  }
  return {
    title: 'CBCL — Checklist Comportamental',
    severity: sev as EducationalInterpretation['severity'],
    summary: summaries[sev] || summaries.baixo,
    guidance: [
      'Esta triagem é educacional e não constitui diagnóstico.',
      'Comportamentos internalizantes (ansiedade, retraimento) e externalizantes (agressividade) foram avaliados.',
      'Ambientes estruturados e previsíveis apoiam o bem-estar emocional.',
    ],
    recommendations:
      sev === 'elevado'
        ? 'Consulte um psicólogo ou psicopedagogo para avaliação detalhada.'
        : 'Continue oferecendo apoio emocional e monitorando o comportamento.',
  }
}
