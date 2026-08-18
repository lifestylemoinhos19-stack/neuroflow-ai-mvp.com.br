/**
 * Escalas agrupadas por patologia.
 *
 * Usado tanto pelo painel admin (AssignScales) quanto pelo fluxo público
 * do paciente (/minhas-escalas) para exibir as escalas de forma agrupada,
 * com sigla, nome descritivo completo e tempo estimado.
 */
export interface ScaleOption {
  id: string
  label: string
  name: string
  time: string
}

export const SCALE_GROUPS: Record<string, ScaleOption[]> = {
  Depressão: [
    { id: 'phq9', label: 'PHQ-9', name: 'Questionário de Saúde do Paciente', time: '3-5 min' },
    { id: 'hamd', label: 'HAM-D', name: 'Escala de Depressão de Hamilton', time: '15-20 min' },
  ],
  Ansiedade: [
    { id: 'gad7', label: 'GAD-7', name: 'Transtorno de Ansiedade Generalizada', time: '3-5 min' },
    { id: 'hama', label: 'HAM-A', name: 'Escala de Ansiedade de Hamilton', time: '10-15 min' },
  ],
  TDAH: [
    { id: 'snapiv', label: 'SNAP-IV', name: 'Avaliação de TDAH', time: '10-15 min' },
    { id: 'asrs18', label: 'ASRS-18', name: 'Auto-Relato de TDAH Adulto', time: '5-10 min' },
  ],
  'TEA (Autismo)': [
    { id: 'assq', label: 'ASSQ', name: 'Questionário de Triagem de Autismo', time: '10-15 min' },
  ],
  Cognição: [
    { id: 'moca', label: 'MoCA', name: 'Avaliação Cognitiva Montreal', time: '10-15 min' },
    { id: 'meem', label: 'MEEM', name: 'Mini Exame do Estado Mental', time: '7-10 min' },
    { id: 'fas', label: 'FAS', name: 'Teste de Fluência Verbal', time: '3-5 min' },
  ],
  TOC: [{ id: 'ybocs', label: 'Y-BOCS', name: 'Escala de Obsessão-Compulsão', time: '15-20 min' }],
  Demência: [
    { id: 'ftdrs', label: 'FTDRS', name: 'Escala de Avaliação de Demência', time: '15-20 min' },
  ],
}

/**
 * Lista plana de todas as escalas (para compatibilidade).
 */
export const ALL_SCALES: ScaleOption[] = Object.values(SCALE_GROUPS).flat()

/**
 * Mapa de id da escala -> opção (para lookup rápido).
 */
export const SCALE_BY_ID: Record<string, ScaleOption> = Object.fromEntries(
  ALL_SCALES.map((s) => [s.id, s]),
)

/**
 * Mapa de label (sigla usada no banco, ex: "PHQ-9") -> opção.
 */
export const SCALE_BY_LABEL: Record<string, ScaleOption> = Object.fromEntries(
  ALL_SCALES.map((s) => [s.label, s]),
)

/**
 * Encontra a opção de escala a partir de um scale_type armazenado no banco.
 * Aceita tanto o id (ex: "phq9") quanto a sigla (ex: "PHQ-9").
 */
export function findScaleOption(scaleType: string): ScaleOption | undefined {
  if (!scaleType) return undefined
  const normalized = scaleType.trim()
  return (
    SCALE_BY_ID[normalized.toLowerCase()] ||
    SCALE_BY_LABEL[normalized] ||
    SCALE_BY_LABEL[normalized.toUpperCase()]
  )
}
