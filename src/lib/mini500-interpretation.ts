import { Mini500ModuleResult } from '@/lib/mini500-scoring'

export interface ClinicalInterpretation {
  moduleId: string
  moduleLetter: string
  title: string
  status: string
  severity: 'low' | 'moderate' | 'high' | 'critical'
  interpretation: string
  referral: string
  alert: string | null
}

const INTERPRETATION_MAP: Record<
  string,
  { interpretation: string; referral: string; alert: string | null }
> = {
  A: {
    interpretation:
      'Episódio Depressivo Maior identificado. Sintomas depressivos significativos com prejuízo funcional.',
    referral: 'Encaminhar a psiquiatra para farmacoterapia. Iniciar TCC.',
    alert: 'Avaliar risco suicida (Módulo C). Considerar afastamento laboral.',
  },
  B: {
    interpretation:
      'Transtorno Depressivo Persistente (Distimia). Humor deprimido crônico com sintomas somáticos.',
    referral: 'Encaminhar a psiquiatra e psicoterapeuta. Avaliar antidepressivos.',
    alert: null,
  },
  C: {
    interpretation: 'Risco de suicídio identificado.',
    referral: 'Encaminhamento de emergência a serviço de saúde mental.',
    alert: 'AVALIAÇÃO DE SEGURANÇA IMEDIATA OBRIGATÓRIA. Remover meios de autolesão.',
  },
  D: {
    interpretation:
      'Episódio (Hipo)Maníaco identificado. Alteração de humor com sintomas associados.',
    referral: 'Encaminhar a psiquiatra para avaliação de estabilizador de humor.',
    alert: 'Avaliar necessidade de internação se prejuízo grave.',
  },
  E: {
    interpretation:
      'Transtorno do Pânico identificado. Ataques de pânico recorrentes com preocupação persistente.',
    referral: 'Encaminhar a psiquiatra. TCC é tratamento de primeira linha.',
    alert: null,
  },
  F: {
    interpretation: 'Agorafobia identificada. Ansiedade em situações de difícil escape.',
    referral: 'TCC com exposição gradual. Avaliar farmacoterapia.',
    alert: null,
  },
  G: {
    interpretation:
      'Transtorno de Ansiedade Social identificado. Medo marcante em situações sociais.',
    referral: 'TCC e ISRS são tratamento de primeira linha.',
    alert: null,
  },
  H: {
    interpretation:
      'Transtorno Obsessivo-Compulsivo identificado. Obsessões e/ou compulsões com prejuízo.',
    referral:
      'Encaminhar a psiquiatra. TCC com exposição e prevenção de resposta. ISRS em altas doses.',
    alert: null,
  },
  I: {
    interpretation:
      'Transtorno de Estresse Pós-Traumático identificado. Revivescimento, evitação e hiperativação.',
    referral: 'Encaminhar a psiquiatra. TCC focada em trauma. Avaliar ISRS.',
    alert: null,
  },
  J: {
    interpretation: 'Dependência/Abuso de Álcool identificado.',
    referral: 'Encaminhar a CAPS-Álcool. Avaliar desintoxicação supervisionada.',
    alert: 'Avaliar risco de abstinência. Não suspender abruptamente.',
  },
  K: {
    interpretation: 'Dependência/Abuso de Substâncias identificado.',
    referral: 'Encaminhar a CAPS. Avaliar necessidade de internação para desintoxicação.',
    alert: 'Avaliar risco de abstinência e overdose.',
  },
  L: {
    interpretation:
      'Síndrome Psicótica identificada. Sintomas positivos ou negativos significativos.',
    referral: 'ENCAMINHAMENTO PSIQUIÁTRICO DE URGÊNCIA. Iniciar antipsicótico.',
    alert: 'Avaliar risco de autolesão e heteroagressividade. Considerar internação.',
  },
  M: {
    interpretation: 'Anorexia Nervosa identificada. Restrição alimentar com medo de ganho de peso.',
    referral: 'Encaminhar a equipe multidisciplinar (psiquiatra, nutricionista, psicólogo).',
    alert: 'Avaliar risco clínico (desequilíbrio eletrolítico, desnutrição).',
  },
  N: {
    interpretation:
      'Bulimia Nervosa identificada. Compulsão alimentar com comportamentos compensatórios.',
    referral: 'Encaminhar a equipe multidisciplinar. TCC é tratamento de primeira linha.',
    alert: null,
  },
  O: {
    interpretation:
      'Transtorno de Ansiedade Generalizada identificado. Preocupação excessiva e difícil de controlar.',
    referral: 'Encaminhar a psiquiatra. TCC e ISRS são tratamentos de primeira linha.',
    alert: null,
  },
  P: {
    interpretation:
      'Transtorno de Personalidade Antissocial identificado. Padrão persistente de violação de normas sociais.',
    referral: 'Encaminhar a psicoterapia. Avaluar comorbidades.',
    alert: 'Avaliar risco de heteroagressividade.',
  },
}

function getSeverity(result: Mini500ModuleResult): ClinicalInterpretation['severity'] {
  if (result.moduleId === 'C') {
    if (result.label === 'RISCO ALTO') return 'critical'
    if (result.label === 'RISCO MODERADO') return 'high'
    return 'low'
  }
  if (['L', 'J', 'K'].includes(result.moduleId)) return 'high'
  if (['A', 'D', 'M'].includes(result.moduleId)) return 'moderate'
  return 'low'
}

export function generateInterpretations(results: Mini500ModuleResult[]): ClinicalInterpretation[] {
  return results
    .filter((r) => r.isPositive)
    .map((r) => {
      const base = INTERPRETATION_MAP[r.moduleId]
      const severity = getSeverity(r)
      let interpretationText = base.interpretation
      if (r.moduleId === 'C') {
        interpretationText = `${base.interpretation} ${r.label} (pontuação: ${r.score ?? 0}/33).`
      } else {
        interpretationText = `${base.interpretation} ${r.details}.`
      }
      return {
        moduleId: r.moduleId,
        moduleLetter: r.letter,
        title: r.title,
        status: r.label,
        severity,
        interpretation: interpretationText,
        referral: base.referral,
        alert: base.alert,
      }
    })
}

export function getCriticalAlerts(interpretations: ClinicalInterpretation[]): string[] {
  return interpretations
    .filter((i) => i.alert !== null)
    .map((i) => `[${i.moduleLetter}] ${i.title}: ${i.alert}`)
}

export function generateSummaryText(results: Mini500ModuleResult[]): string {
  const positive = results.filter((r) => r.isPositive)
  if (positive.length === 0) {
    return 'Nenhum módulo positivo identificado. Os resultados estão dentro dos parâmetros esperados.'
  }
  const lines = positive.map((r) => `- ${r.letter}: ${r.title} — ${r.label} (${r.details})`)
  lines.push(
    '',
    'Esta é uma triagem inicial. O diagnóstico definitivo requer avaliação clínica presencial especializada.',
  )
  return lines.join('\n')
}
