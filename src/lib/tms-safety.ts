export interface TmsAlert {
  message: string
  level: 'critical' | 'warning'
}

const TMS_KEYWORDS = [
  'emt',
  'tms',
  'estimulação magnética transcraniana',
  'estimulacao magnetica transcraniana',
]

const CONTRAINDICATION_KEYWORDS = [
  'implante coclear',
  'implante metálico',
  'implante metalico',
  'marcapasso',
  'clip de aneurisma',
  'clipe de aneurisma',
  'clipe metálico',
  'clipe metalico',
  'fragmento metálico',
  'fragmento metalico',
  'metal na cabeça',
  'metal no crânio',
  'metal na cabeca',
  'metal no cranio',
  'eletrodos',
  'dispositivo eletrônico',
  'dispositivo eletronico',
  'chumbo metálico',
  'chumbo metalico',
]

const SEIZURE_KEYWORDS = ['convulsão', 'convulsao', 'epilepsia', 'crise convulsiva']

export function checkTmsContraindication(text: string): TmsAlert | null {
  const lower = text.toLowerCase()
  const hasTms = TMS_KEYWORDS.some((k) => lower.includes(k))
  const hasContraindication = CONTRAINDICATION_KEYWORDS.some((k) => lower.includes(k))
  const hasSeizure = SEIZURE_KEYWORDS.some((k) => lower.includes(k))

  if (hasTms && hasContraindication) {
    return {
      message:
        'CONTRAINDICAÇÃO ABSOLUTA: A Estimulação Magnética Transcraniana (EMT/TMS) é ESTRIAMENTE CONTRAINDICADA em pacientes com implantes metálicos, marcapassos, clips de aneurisma ou implantes cocleares. O campo magnético pode deslocar o implante, causar aquecimento tecidual e lesões graves. NÃO prosseguir com EMT/TMS. Encaminhar para avaliação presencial imediata.',
      level: 'critical',
    }
  }

  if (hasTms && hasSeizure) {
    return {
      message:
        'CONTRAINDICAÇÃO RELATIVA: História de convulsões/epilepsia é uma contraindicação relativa para EMT/TMS. O campo magnético pode reduzir o limiar convulsivo. Avaliação médica obrigatória antes de qualquer protocolo de estimulação.',
      level: 'warning',
    }
  }

  if (hasContraindication) {
    return {
      message:
        'ALERTA: Foram identificados termos relacionados a possíveis contraindicações para procedimentos de EMT/TMS (implantes metálicos, marcapassos, etc.). Uma avaliação médica especializada é obrigatória antes de qualquer protocolo de estimulação magnética transcraniana.',
      level: 'warning',
    }
  }

  return null
}
