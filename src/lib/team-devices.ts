export interface TeamDevice {
  id: string
  label: string
  owner: string
}

export const TEAM_DEVICES: TeamDevice[] = [
  { id: 'skip-001', label: 'Skip Lab - Estacao 01', owner: 'neuroflow-core' },
  { id: 'skip-002', label: 'Skip Lab - Estacao 02', owner: 'neuroflow-core' },
  { id: 'skip-003', label: 'Field Unit Alpha', owner: 'field-team-a' },
  { id: 'skip-004', label: 'Field Unit Bravo', owner: 'field-team-b' },
  { id: 'skip-005', label: 'QA Device Charlie', owner: 'qa-team' },
]
