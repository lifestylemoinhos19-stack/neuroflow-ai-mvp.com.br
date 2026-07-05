import { supabase } from '@/lib/supabase/client'

export interface BpmRangeConfig {
  min: number
  max: number
  tolerance: number
}

export const BPM_RANGES: Record<string, BpmRangeConfig> = {
  neuroflow_v1: { min: 50, max: 120, tolerance: 8 },
  neuroflow_v2: { min: 55, max: 130, tolerance: 6 },
  neuroflow_v3: { min: 60, max: 140, tolerance: 5 },
}

export type SuggestionType = 'KEEP' | 'WIDEN_TOLERANCE' | 'EXPAND'

export interface ModelMetrics {
  model: string
  avgMae: number
  sampleCount: number
  minMae: number
  maxMae: number
}

export interface CalibrationSuggestion {
  model: string
  type: SuggestionType
  currentRange: BpmRangeConfig
  suggestedRange: BpmRangeConfig
  metrics: ModelMetrics
  reason: string
}

export interface FeedbackMonitorReport {
  models: ModelMetrics[]
  suggestions: CalibrationSuggestion[]
  totalLogs: number
  fetchedAt: string
}

export async function fetchCalibrationLogs(
  limit: number = 1000,
  since?: string,
): Promise<{ data: Record<string, unknown>[] | null; error: string | null }> {
  let query = supabase
    .from('calibration_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (since) {
    query = query.gte('created_at', since)
  }

  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  return { data: data as Record<string, unknown>[] | null, error: null }
}

function getModelFromLog(log: Record<string, unknown>): string | null {
  const meta = log.metadata as Record<string, unknown> | null
  if (meta?.model && typeof meta.model === 'string') return meta.model
  return null
}

export function calculateModelMetrics(
  logs: Record<string, unknown>[],
  model: string,
): ModelMetrics {
  const modelLogs = logs.filter((l) => getModelFromLog(l) === model)
  const maeValues = modelLogs
    .map((l) => l.mae)
    .filter((m): m is number => typeof m === 'number' && !isNaN(m))

  if (maeValues.length === 0) {
    return { model, avgMae: 0, sampleCount: 0, minMae: 0, maxMae: 0 }
  }

  const sum = maeValues.reduce((a, b) => a + b, 0)
  return {
    model,
    avgMae: sum / maeValues.length,
    sampleCount: maeValues.length,
    minMae: Math.min(...maeValues),
    maxMae: Math.max(...maeValues),
  }
}

export function generateSuggestion(metrics: ModelMetrics): CalibrationSuggestion {
  const currentRange = BPM_RANGES[metrics.model] ?? { min: 50, max: 120, tolerance: 8 }

  if (metrics.avgMae <= 5.0) {
    return {
      model: metrics.model,
      type: 'KEEP',
      currentRange,
      suggestedRange: currentRange,
      metrics,
      reason: 'MAE ' + metrics.avgMae.toFixed(2) + ' <= 5.0: Nenhum ajuste necessario.',
    }
  }

  if (metrics.avgMae <= 10.0) {
    return {
      model: metrics.model,
      type: 'WIDEN_TOLERANCE',
      currentRange,
      suggestedRange: { ...currentRange, tolerance: currentRange.tolerance + 2 },
      metrics,
      reason:
        'MAE ' +
        metrics.avgMae.toFixed(2) +
        ' entre 5.0 e 10.0: Aumentar tolerancia em 2 unidades.',
    }
  }

  return {
    model: metrics.model,
    type: 'EXPAND',
    currentRange,
    suggestedRange: {
      min: currentRange.min - 4,
      max: currentRange.max + 4,
      tolerance: currentRange.tolerance + 4,
    },
    metrics,
    reason:
      'MAE ' +
      metrics.avgMae.toFixed(2) +
      ' > 10.0: Expandir range em 4 unidades e aumentar tolerancia em 4.',
  }
}

export async function generateFeedbackReport(
  limit: number = 1000,
  since?: string,
): Promise<FeedbackMonitorReport> {
  const { data, error } = await fetchCalibrationLogs(limit, since)
  const fetchedAt = new Date().toISOString()

  if (error || !data) {
    return { models: [], suggestions: [], totalLogs: 0, fetchedAt }
  }

  const models = Object.keys(BPM_RANGES).map((m) => calculateModelMetrics(data, m))
  const suggestions = models.map(generateSuggestion)

  return { models, suggestions, totalLogs: data.length, fetchedAt }
}

export function formatReport(report: FeedbackMonitorReport): string {
  const lines: string[] = [
    '=== NeuroFlow Feedback Monitor Report ===',
    'Generated: ' + report.fetchedAt,
    'Total Logs: ' + report.totalLogs,
    '',
  ]

  for (const s of report.suggestions) {
    lines.push('Model: ' + s.model)
    lines.push(
      '  MAE: avg=' +
        s.metrics.avgMae.toFixed(2) +
        ', min=' +
        s.metrics.minMae.toFixed(2) +
        ', max=' +
        s.metrics.maxMae.toFixed(2) +
        ', n=' +
        s.metrics.sampleCount,
    )
    lines.push('  Suggestion: ' + s.type)
    lines.push(
      '  Current:  min=' +
        s.currentRange.min +
        ', max=' +
        s.currentRange.max +
        ', tolerance=' +
        s.currentRange.tolerance,
    )
    lines.push(
      '  Suggested: min=' +
        s.suggestedRange.min +
        ', max=' +
        s.suggestedRange.max +
        ', tolerance=' +
        s.suggestedRange.tolerance,
    )
    lines.push('  Reason: ' + s.reason)
    lines.push('')
  }

  return lines.join('\n')
}
