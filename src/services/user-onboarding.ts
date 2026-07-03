import { supabase } from '@/lib/supabase/client'
import {
  saveSensorIdToLocalStorage,
  getSensorIdFromLocalStorage,
  clearSensorIdFromLocalStorage,
  detectBrowser,
  type BrowserInfo,
} from '@/lib/sensor-persistence'

export interface UserOnboarding {
  user_id: string
  is_first_access: boolean
  paired_sensor_id: string | null
  onboarding_completed_at: string | null
  updated_at: string
}

export function getBrowserInfo(): BrowserInfo {
  return detectBrowser()
}

export function getCachedSensorId(): string | null {
  return getSensorIdFromLocalStorage()
}

export function clearCachedSensorId(): void {
  clearSensorIdFromLocalStorage()
}

export async function getOnboardingState(userId: string): Promise<UserOnboarding | null> {
  const { data, error } = await supabase
    .from('user_onboarding')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return null

  if (data && data.paired_sensor_id && !getSensorIdFromLocalStorage()) {
    saveSensorIdToLocalStorage(data.paired_sensor_id)
  }

  return data as UserOnboarding | null
}

export async function markOnboardingComplete(userId: string, sensorId: string): Promise<void> {
  saveSensorIdToLocalStorage(sensorId)

  await supabase.from('user_onboarding').upsert(
    {
      user_id: userId,
      is_first_access: false,
      paired_sensor_id: sensorId,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
}

export async function ensureOnboardingRecord(userId: string): Promise<void> {
  const existing = await getOnboardingState(userId)
  if (!existing) {
    await supabase.from('user_onboarding').upsert(
      {
        user_id: userId,
        is_first_access: true,
        paired_sensor_id: null,
        onboarding_completed_at: null,
      },
      { onConflict: 'user_id' },
    )
  }
}

export async function getPairedSensorId(userId: string): Promise<string | null> {
  const cached = getSensorIdFromLocalStorage()
  if (cached) return cached

  const data = await getOnboardingState(userId)
  return data?.paired_sensor_id ?? null
}
