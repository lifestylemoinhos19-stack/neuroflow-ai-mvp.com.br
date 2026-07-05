import { BiofeedbackAccuracyTester } from '@/lib/biofeedback-accuracy'

export interface TestScenario {
  id: string
  name: string
  lighting: number
  skinTone: 'Light' | 'Medium' | 'Dark'
}

export interface FieldTestResult {
  scenario: TestScenario
  mae: number
  rmse: number
  accuracy: number
  sampleCount: number
}

export const SCENARIOS: TestScenario[] = [
  { id: 'low-light', name: 'Luz Baixa', lighting: 25, skinTone: 'Medium' },
  { id: 'bright-light', name: 'Luz Forte', lighting: 90, skinTone: 'Medium' },
  { id: 'light-skin', name: 'Tom de Pele Claro', lighting: 60, skinTone: 'Light' },
  { id: 'medium-skin', name: 'Tom de Pele Médio', lighting: 60, skinTone: 'Medium' },
  { id: 'dark-skin', name: 'Tom de Pele Escuro', lighting: 60, skinTone: 'Dark' },
]

export const DEFAULT_SAMPLES = 30

export function simulateBpm(scenario: TestScenario, reference: number): number {
  const lightDrift = Math.abs(scenario.lighting - 60) / 60
  const skinDrift =
    scenario.skinTone === 'Dark' ? 0.15 : scenario.skinTone === 'Light' ? 0.05 : 0.08
  const totalDrift = lightDrift + skinDrift
  const noise = (Math.random() - 0.5) * 2 * (1 + totalDrift * 10)
  return Math.max(40, Math.min(180, Math.round(reference + noise)))
}

export async function runAllFieldTests(
  onProgress?: (progress: number, results: FieldTestResult[]) => void,
): Promise<FieldTestResult[]> {
  const all: FieldTestResult[] = []

  for (let i = 0; i < SCENARIOS.length; i++) {
    const scenario = SCENARIOS[i]
    const tester = new BiofeedbackAccuracyTester()

    for (let s = 0; s < DEFAULT_SAMPLES; s++) {
      const ref = 60 + Math.floor(Math.random() * 40)
      const cam = simulateBpm(scenario, ref)
      tester.addSample(cam, ref)
      await new Promise((r) => setTimeout(r, 15))
    }

    const m = tester.calculate()
    all.push({
      scenario,
      mae: m.mae,
      rmse: m.rmse,
      accuracy: m.accuracyPercentage,
      sampleCount: m.sampleCount,
    })

    if (onProgress) {
      onProgress(((i + 1) / SCENARIOS.length) * 100, [...all])
    }
  }

  return all
}

export function aggregateResults(results: FieldTestResult[]): {
  avgMae: number
  avgRmse: number
  totalSamples: number
} {
  if (results.length === 0) return { avgMae: 0, avgRmse: 0, totalSamples: 0 }
  const avgMae = results.reduce((a, r) => a + r.mae, 0) / results.length
  const avgRmse = results.reduce((a, r) => a + r.rmse, 0) / results.length
  const totalSamples = results.reduce((a, r) => a + r.sampleCount, 0)
  return { avgMae, avgRmse, totalSamples }
}
