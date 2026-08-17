import { type BpmRange, type BpmProfile, getRanges } from '@/lib/bpm-classifier'
import { supabase } from '@/lib/supabase/client'

export interface BetaFeedbackParams {
  minDelta: number
  maxDelta: number
}

export function applyBetaFeedback(currentRanges: BpmRange, feedback: BetaFeedbackParams): BpmRange {
  const { minDelta, maxDelta } = feedback
  return {
    rest: [
      Math.max(30, currentRanges.rest[0] + minDelta),
      Math.max(35, currentRanges.rest[1] + minDelta),
    ],
    calm: [currentRanges.calm[0] + minDelta, currentRanges.calm[1] + maxDelta],
    active: [currentRanges.active[0] + maxDelta, currentRanges.active[1] + maxDelta],
    agitation: [
      currentRanges.agitation[0] + maxDelta,
      Math.min(200, currentRanges.agitation[1] + maxDelta),
    ],
  }
}

export interface FieldTestMetrics {
  mae: number
  rmse: number
  samples: number
  durationMs: number
}

interface DeviceInfo {
  id: string
  model: string
  platform: string
}

function getDeviceInfo(): DeviceInfo {
  if (typeof navigator === 'undefined') {
    return { id: 'unknown', model: 'unknown', platform: 'server' }
  }
  const ua = navigator.userAgent
  let platform = 'unknown'
  if (/Windows/.test(ua)) platform = 'Windows'
  else if (/Mac/.test(ua)) platform = 'macOS'
  else if (/Linux/.test(ua)) platform = 'Linux'
  else if (/Android/.test(ua)) platform = 'Android'
  else if (/iPhone|iPad|iPod/.test(ua)) platform = 'iOS'
  return {
    id: ua.slice(0, 100),
    model: platform,
    platform,
  }
}

export async function captureFieldTestMetrics(
  userId: string,
  metrics: FieldTestMetrics,
  sessionId?: string | null,
  metadata?: Record<string, unknown>,
): Promise<{ error: string | null }> {
  const info = getDeviceInfo()
  const { error } = await supabase.from('calibration_logs').insert({
    user_id: userId,
    session_id: sessionId || null,
    device_id: info.id,
    device_model: info.model,
    platform: info.platform,
    mae: metrics.mae,
    rmse: metrics.rmse,
    samples: metrics.samples,
    duration_ms: metrics.durationMs,
    metadata: (metadata || {}) as unknown as Record<string, import('@/lib/supabase/types').Json>,
  })
  if (error) return { error: error.message }
  return { error: null }
}

export async function saveTunedRanges(
  userId: string,
  ranges: BpmRange,
  profile: BpmProfile,
  sessionId?: string | null,
): Promise<{ error: string | null }> {
  const info = getDeviceInfo()
  const { error } = await supabase.from('calibration_logs').insert({
    user_id: userId,
    session_id: sessionId || null,
    device_id: info.id,
    device_model: info.model,
    platform: info.platform,
    mae: 0,
    rmse: 0,
    samples: 0,
    duration_ms: 0,
    metadata: { tunedRanges: ranges, profile, type: 'sensitivity_tuning' },
  })
  if (error) return { error: error.message }
  return { error: null }
}

export async function loadTunedRanges(userId: string): Promise<BpmRange | null> {
  const { data, error } = await supabase
    .from('calibration_logs')
    .select('metadata')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
  if (error || !data || data.length === 0) return null
  const meta = data[0].metadata as Record<string, unknown> | null
  if (meta?.tunedRanges) return meta.tunedRanges as BpmRange
  return null
}

export function createDefaultRanges(profile: BpmProfile = 'default'): BpmRange {
  return getRanges(profile)
}
