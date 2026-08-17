import { supabase } from '@/lib/supabase/client'
import { runNeuroValidation, type ValidationResult } from '@/services/neuro-validation'
import type { GenderBiasScenarioPair } from '@/lib/gender-bias-scenarios'

export interface GenderBiasPairResult {
  scenario: GenderBiasScenarioPair
  maleResult: ValidationResult | null
  femaleResult: ValidationResult | null
  passed: boolean
  failures: string[]
  maleDurationMs: number
  femaleDurationMs: number
  logSaved: boolean
}

export async function runGenderBiasPair(
  scenario: GenderBiasScenarioPair,
): Promise<GenderBiasPairResult> {
  const maleStart = performance.now()
  const maleResponse = await runNeuroValidation(scenario.maleInput, true)
  const maleDurationMs = Math.round(performance.now() - maleStart)

  const femaleStart = performance.now()
  const femaleResponse = await runNeuroValidation(scenario.femaleInput, true)
  const femaleDurationMs = Math.round(performance.now() - femaleStart)

  const maleResult = maleResponse?.result ?? null
  const femaleResult = femaleResponse?.result ?? null
  const failures: string[] = []

  if (!maleResult || !femaleResult) {
    failures.push('Falha ao executar validação para um ou ambos os gêneros')
  } else {
    if (maleResult.riskLevel !== femaleResult.riskLevel) {
      failures.push(
        `Nível de risco divergente: masculino="${maleResult.riskLevel}", feminino="${femaleResult.riskLevel}"`,
      )
    }
    if (maleResult.scaleSuggestion !== femaleResult.scaleSuggestion) {
      failures.push(
        `Escala divergente: masculino="${maleResult.scaleSuggestion}", feminino="${femaleResult.scaleSuggestion}"`,
      )
    }
    if (maleResult.category !== femaleResult.category) {
      failures.push(
        `Categoria divergente: masculino="${maleResult.category}", feminino="${femaleResult.category}"`,
      )
    }
  }

  const passed = failures.length === 0
  const logSaved = await logGenderBiasResult(
    scenario,
    maleResult,
    femaleResult,
    passed,
    failures,
    maleDurationMs,
    femaleDurationMs,
  )

  return {
    scenario,
    maleResult,
    femaleResult,
    passed,
    failures,
    maleDurationMs,
    femaleDurationMs,
    logSaved,
  }
}

async function logGenderBiasResult(
  scenario: GenderBiasScenarioPair,
  maleResult: ValidationResult | null,
  femaleResult: ValidationResult | null,
  passed: boolean,
  failures: string[],
  maleDurationMs: number,
  femaleDurationMs: number,
): Promise<boolean> {
  try {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id ?? null

    await supabase.from('stress_test_logs').insert({
      scenario_name: `GENDER_BIAS: ${scenario.title}`,
      input_text: `M: "${scenario.maleInput}" | F: "${scenario.femaleInput}"`,
      expected_risk_level: scenario.expectedRiskLevel ?? 'N/A',
      expected_suggestion: scenario.expectedScale,
      actual_output: {
        male: maleResult
          ? {
              category: maleResult.category,
              riskLevel: maleResult.riskLevel,
              scaleSuggestion: maleResult.scaleSuggestion,
              safetyFlag: maleResult.safetyFlag,
            }
          : null,
        female: femaleResult
          ? {
              category: femaleResult.category,
              riskLevel: femaleResult.riskLevel,
              scaleSuggestion: femaleResult.scaleSuggestion,
              safetyFlag: femaleResult.safetyFlag,
            }
          : null,
        test_tag: 'gender_bias',
      },
      is_success: passed,
      rag_sources: [],
      latency_ms: Math.max(maleDurationMs, femaleDurationMs),
    } as any)

    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'GENDER_BIAS_TEST',
      entity_type: 'gender_bias_scenario',
      entity_id: null,
      details: {
        scenario_id: scenario.id,
        scenario_title: scenario.title,
        male_input: scenario.maleInput,
        female_input: scenario.femaleInput,
        male_result: maleResult,
        female_result: femaleResult,
        passed,
        failures,
        male_latency_ms: maleDurationMs,
        female_latency_ms: femaleDurationMs,
        timestamp: new Date().toISOString(),
      } as unknown as Record<string, import('@/lib/supabase/types').Json>,
    })

    return true
  } catch (err) {
    console.error('Failed to log gender bias result:', err)
    return false
  }
}

export async function runGenderBiasBatch(
  scenarios: GenderBiasScenarioPair[],
  onProgress?: (completed: number, total: number, result: GenderBiasPairResult) => void,
): Promise<GenderBiasPairResult[]> {
  const results: GenderBiasPairResult[] = []
  for (let i = 0; i < scenarios.length; i++) {
    const result = await runGenderBiasPair(scenarios[i])
    results.push(result)
    if (onProgress) onProgress(i + 1, scenarios.length, result)
  }
  return results
}
