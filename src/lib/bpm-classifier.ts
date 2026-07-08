export type BpmProfile = 'default' | 'beta'
export type BpmZone = 'rest' | 'calm' | 'active' | 'agitation'

export interface BpmRange {
  rest: [number, number]
  calm: [number, number]
  active: [number, number]
  agitation: [number, number]
}

export const DEFAULT_RANGES: BpmRange = {
  rest: [50, 60],
  calm: [60, 70],
  active: [70, 90],
  agitation: [90, 140],
}

export const BETA_RANGES: BpmRange = {
  rest: [55, 65],
  calm: [65, 70],
  active: [70, 90],
  agitation: [90, 150],
}

export function getRanges(profile: BpmProfile = 'default', custom?: BpmRange): BpmRange {
  if (custom) return custom
  return profile === 'beta' ? BETA_RANGES : DEFAULT_RANGES
}

export function classifyBpm(
  bpm: number,
  profile: BpmProfile = 'default',
  custom?: BpmRange,
): BpmZone {
  const ranges = getRanges(profile, custom)
  if (bpm < ranges.rest[1]) return 'rest'
  if (bpm < ranges.calm[1]) return 'calm'
  if (bpm < ranges.active[1]) return 'active'
  return 'agitation'
}

export function getZoneLabel(zone: BpmZone): string {
  const labels: Record<BpmZone, string> = {
    rest: 'Repouso',
    calm: 'Calmo',
    active: 'Ativo',
    agitation: 'Agitação',
  }
  return labels[zone]
}

export function getZoneColor(zone: BpmZone): string {
  const colors: Record<BpmZone, string> = {
    rest: '#00FFFF',
    calm: '#7DF9FF',
    active: '#FFD700',
    agitation: '#FF4444',
  }
  return colors[zone]
}
