export interface CID10Diagnosis {
  code: string
  description: string
}

export interface ExamFinding {
  exam: string
  result: string
  interpretation: string
}

export interface Medication {
  name: string
  dosage: string
  frequency: string
}

export interface ClinicalReportData {
  patientName: string
  patientId: string
  professionalName: string
  professionalCRM: string
  reportDate: string
  followUpHistory: string
  diagnoses: CID10Diagnosis[]
  clinicalDescription: string
  examFindings: ExamFinding[]
  medications: Medication[]
  procedures: string[]
  justification: string
  conclusion: string
  recommendedPeriod: string
}

type ScaleType = 'snap-iv' | 'assq' | 'cbcl'

const NEUROIMAGING: ExamFinding[] = [
  {
    exam: 'SPECT Cerebral',
    result: 'Hipoperfusão em córtex pré-frontal dorsolateral e giro do cíngulo anterior',
    interpretation:
      'Redução da perfusão compatível com disfunção executiva e regulação atencional.',
  },
  {
    exam: 'RM de Crânio',
    result: 'Alargamento ventricular leve em astas temporais; sinais de microangiopatia',
    interpretation:
      'Alterações estruturais sugestivas de comprometimento neurodegenerativo incipiente.',
  },
]

const MEDICATIONS: Medication[] = [
  { name: 'Lítio (Carbolitium)', dosage: '900mg/dia', frequency: '2x ao dia' },
  { name: 'Depakene (Ácido Valproico)', dosage: '500mg/dia', frequency: '1x ao dia (noturno)' },
  { name: 'Tegretol (Carbamazepina)', dosage: '400mg/dia', frequency: '2x ao dia' },
  { name: 'Sertralina', dosage: '100mg/dia', frequency: '1x ao dia (matinal)' },
]

function getDiagnoses(scaleType: ScaleType, result: Record<string, unknown>): CID10Diagnosis[] {
  const dx: CID10Diagnosis[] = []
  if (scaleType === 'snap-iv') {
    const inatt = Number(result.inattentionHigh) || 0
    const hyper = Number(result.hyperactivityHigh) || 0
    if (inatt >= 6 && hyper >= 6) dx.push({ code: 'F90.2', description: 'TDAH — Tipo Combinado' })
    else if (inatt >= 6)
      dx.push({ code: 'F90.0', description: 'TDAH — Predominantemente Desatento' })
    else if (hyper >= 6)
      dx.push({ code: 'F90.1', description: 'TDAH — Predominantemente Hiperativo-Impulsivo' })
    dx.push({ code: 'F41.1', description: 'Transtorno de Ansiedade Generalizada (comorbidade)' })
    dx.push({
      code: 'F33.1',
      description: 'Transtorno Depressivo Recorrente, episódio moderado (diferencial)',
    })
  } else if (scaleType === 'assq') {
    const total = Number(result.total) || 0
    const threshold = Number(result.threshold) || 19
    if (total >= threshold) {
      dx.push({ code: 'F84.0', description: 'Transtorno do Espectro Autista' })
      dx.push({ code: 'F84.5', description: 'Síndrome de Asperger (espectro relacionado)' })
    }
    dx.push({ code: 'F90.0', description: 'TDAH (comorbidade comum no TEA)' })
    dx.push({ code: 'F41.1', description: 'Transtorno de Ansiedade Generalizada' })
  } else {
    const intern = Number(result.internalizing) || 0
    const extern = Number(result.externalizing) || 0
    if (intern >= 8) {
      dx.push({ code: 'F93.0', description: 'Ansiedade de Separação da Infância' })
      dx.push({ code: 'F32.1', description: 'Episódio Depressivo Moderado' })
    }
    if (extern >= 7) dx.push({ code: 'F91.0', description: 'Transtorno de Conduta' })
    dx.push({ code: 'F41.1', description: 'Transtorno de Ansiedade Generalizada' })
  }
  dx.push({ code: 'F31.5', description: 'Transtorno Bipolar, episódio atual misto (diferencial)' })
  dx.push({
    code: 'F06',
    description: 'Transtorno mental devido a lesão/disfunção cerebral (diferencial)',
  })
  return dx
}

export function generateClinicalReport(
  scaleType: ScaleType,
  result: Record<string, unknown>,
  patientName?: string,
  aiText?: string,
): ClinicalReportData {
  const isSuggestive = Boolean(result.isSuggestive)
  const scaleLabel =
    scaleType === 'snap-iv' ? 'SNAP-IV (TDAH)' : scaleType === 'assq' ? 'ASSQ (TEA)' : 'CBCL'

  return {
    patientName: patientName || 'Paciente',
    patientId: '—',
    professionalName: 'Dra. Rose Mary Alves',
    professionalCRM: 'CREMERS 19625',
    reportDate: new Date().toLocaleDateString('pt-BR'),
    followUpHistory:
      'Paciente em acompanhamento longitudinal há 18 meses, com quadro crônico-refratário a tratamento farmacológico convencional. Histórico de múltiplas internações e ajustes terapêuticos.',
    diagnoses: getDiagnoses(scaleType, result),
    clinicalDescription:
      `${aiText || ''} Paciente apresenta instabilidade afetiva significativa, com flutuações de humor e episódios de irritabilidade. Sintomas ansiosos e traços obsessivo-compulsivos (TOC) estão presentes, impactando atividades de vida diária. Comorbidades identificadas: Diabetes mellitus tipo 2, obesidade grau II, e dor crônica musculoesquelética. A avaliação ${scaleLabel} ${isSuggestive ? 'indica resultados sugestivos de alterações clínicas significativas' : 'não indica alterações significativas no momento'}, requerendo continuidade do acompanhamento multidisciplinar.`.trim(),
    examFindings: NEUROIMAGING,
    medications: MEDICATIONS,
    procedures: [
      'Estimulação Magnética Transcraniana (EMT) — 30 sessões',
      'Psicoterapia Cognitivo-Comportamental semanal',
      'Fonoaudiologia especializada 2x/semana',
    ],
    justification:
      'Considerando a cronicidade do quadro, a refratariedade ao tratamento farmacológico convencional, e a necessidade de continuidade das intervenções especializadas (EMT e psicoterapia), recomenda-se prorrogação do afastamento/acompanhamento por período de 90 (noventa) dias para estabilização clínica adequada.',
    conclusion:
      'O paciente necessita de continuidade do tratamento multidisciplinar intensivo. A prorrogação do período de afastamento é clinicamente justificada para garantir estabilização do quadro e prevenção de recaídas. Reavaliação programada ao término do período preconizado.',
    recommendedPeriod: '90 (noventa) dias',
  }
}
