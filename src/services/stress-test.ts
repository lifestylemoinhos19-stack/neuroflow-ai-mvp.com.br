import { supabase } from '@/lib/supabase/client'
import { runNeuroValidation, type ValidationResult } from '@/services/neuro-validation'
import type { StressTestScenario } from '@/lib/stress-test-scenarios'

export interface ScenarioResult {
  scenario: StressTestScenario
  passed: boolean
  actualOutput: ValidationResult | null
  failures: string[]
  durationMs: number
}

export interface BatchResult {
  results: ScenarioResult[]
  totalPassed: number
  totalFailed: number
  totalDurationMs: number
  startedAt: string
  completedAt: string
}

function mapRiskLevel(risk: 'low' | 'medium' | 'high' | null): string | null {
  if (risk === 'high') return 'Alto'
  if (risk === 'medium') return 'Moderado'
  if (risk === 'low') return 'Baixo'
  return null
}

export function validateScenario(
  scenario: StressTestScenario,
  actual: ValidationResult,
): { passed: boolean; failures: string[] } {
  const failures: string[] = []

  if (actual.category !== scenario.expected.category) {
    failures.push(
      `Categoria: esperado "${scenario.expected.category}", obtido "${actual.category}"`,
    )
  }
  if (actual.riskLevel !== scenario.expected.riskLevel) {
    failures.push(
      `Risco: esperado "${scenario.expected.riskLevel ?? 'null'}", obtido "${actual.riskLevel ?? 'null'}"`,
    )
  }
  if (actual.scaleSuggestion !== scenario.expected.scaleSuggestion) {
    failures.push(
      `Escala: esperado "${scenario.expected.scaleSuggestion}", obtido "${actual.scaleSuggestion}"`,
    )
  }
  if (actual.safetyFlag !== scenario.expected.safetyFlag) {
    failures.push(
      `Safety Flag: esperado "${scenario.expected.safetyFlag}", obtido "${actual.safetyFlag}"`,
    )
  }

  if (scenario.expected.safetyMessageContains && actual.safetyMessage) {
    const lowerMsg = actual.safetyMessage.toLowerCase()
    for (const expected of scenario.expected.safetyMessageContains) {
      if (!lowerMsg.includes(expected.toLowerCase())) {
        failures.push(`Mensagem de segurança deveria conter "${expected}"`)
      }
    }
  }

  if (
    scenario.expected.safetyFlag !== 'none' &&
    scenario.expected.safetyFlag !== 'out_of_scope' &&
    !actual.safetyMessage
  ) {
    failures.push('Mensagem de segurança ausente para alerta de segurança')
  }
  if (scenario.expected.safetyFlag !== 'none' && !actual.telemedicineDisclaimer) {
    failures.push('Aviso de telemedicina deveria estar presente para alerta de segurança')
  }

  return { passed: failures.length === 0, failures }
}

export async function runSingleScenario(scenario: StressTestScenario): Promise<ScenarioResult> {
  const startTime = performance.now()
  const response = await runNeuroValidation(scenario.inputPrompt, true)
  const durationMs = Math.round(performance.now() - startTime)

  if (!response || !response.result) {
    return {
      scenario,
      passed: false,
      actualOutput: null,
      failures: ['Falha ao executar validação: sem resposta do motor'],
      durationMs,
    }
  }

  const { passed, failures } = validateScenario(scenario, response.result)
  await logStressTestResult(scenario, response.result, passed, failures, durationMs)

  return { scenario, passed, actualOutput: response.result, failures, durationMs }
}

export async function logStressTestResult(
  scenario: StressTestScenario,
  actualOutput: ValidationResult,
  passed: boolean,
  failures: string[],
  durationMs: number,
): Promise<void> {
  try {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id ?? null

    const ragSources = actualOutput.clinicalCitations.map((c) => ({
      source: c.source,
      code: c.code,
      title: c.title,
      section: c.section,
    }))

    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'STRESS_TEST',
      entity_type: 'stress_test_scenario',
      entity_id: null,
      details: {
        scenario_id: scenario.id,
        scenario_title: scenario.title,
        scenario_category: scenario.category,
        input_prompt: scenario.inputPrompt,
        expected_output: scenario.expected,
        actual_output: {
          category: actualOutput.category,
          riskLevel: actualOutput.riskLevel,
          scaleSuggestion: actualOutput.scaleSuggestion,
          safetyFlag: actualOutput.safetyFlag,
          safetyMessage: actualOutput.safetyMessage,
          clinicalRationale: actualOutput.clinicalRationale,
          suggestedAction: actualOutput.suggestedAction,
          telemedicineDisclaimer: actualOutput.telemedicineDisclaimer,
          clinicalCitations: actualOutput.clinicalCitations,
        },
        validation_status: passed ? 'Passed' : 'Failed',
        failure_reasons: failures.length > 0 ? failures : null,
        timestamp: new Date().toISOString(),
      },
    })

    await supabase.from('stress_test_logs').insert({
      scenario_name: scenario.title,
      input_text: scenario.inputPrompt,
      expected_risk_level: mapRiskLevel(scenario.expected.riskLevel),
      expected_suggestion: scenario.expected.scaleSuggestion,
      actual_output: {
        category: actualOutput.category,
        riskLevel: actualOutput.riskLevel,
        scaleSuggestion: actualOutput.scaleSuggestion,
        safetyFlag: actualOutput.safetyFlag,
        safetyMessage: actualOutput.safetyMessage,
        clinicalRationale: actualOutput.clinicalRationale,
        suggestedAction: actualOutput.suggestedAction,
        telemedicineDisclaimer: actualOutput.telemedicineDisclaimer,
      },
      is_success: passed,
      rag_sources: ragSources,
      latency_ms: durationMs,
    })
  } catch (err) {
    console.error('Failed to log stress test result:', err)
  }
}

export async function runAllScenarios(
  scenarios: StressTestScenario[],
  onProgress?: (completed: number, total: number, result: ScenarioResult) => void,
): Promise<BatchResult> {
  const startedAt = new Date().toISOString()
  const results: ScenarioResult[] = []
  let totalDurationMs = 0

  for (let i = 0; i < scenarios.length; i++) {
    const result = await runSingleScenario(scenarios[i])
    results.push(result)
    totalDurationMs += result.durationMs
    if (onProgress) onProgress(i + 1, scenarios.length, result)
  }

  const totalPassed = results.filter((r) => r.passed).length
  return {
    results,
    totalPassed,
    totalFailed: results.length - totalPassed,
    totalDurationMs,
    startedAt,
    completedAt: new Date().toISOString(),
  }
}

export interface CategoryStats {
  category: string
  total: number
  passed: number
  failed: number
}

export function getCategoryStats(results: ScenarioResult[]): CategoryStats[] {
  const map = new Map<string, CategoryStats>()
  for (const r of results) {
    const cat = r.scenario.category
    if (!map.has(cat)) map.set(cat, { category: cat, total: 0, passed: 0, failed: 0 })
    const s = map.get(cat)!
    s.total++
    if (r.passed) s.passed++
    else s.failed++
  }
  return Array.from(map.values())
}
