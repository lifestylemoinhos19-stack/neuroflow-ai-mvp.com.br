import { supabase } from '@/lib/supabase/client'

const STORAGE_KEY = 'neuroflow_paired_sensor_id'

export function saveSensorIdToLocalStorage(sensorId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, sensorId)
  } catch {
    /* localStorage may be unavailable */
  }
}

export function getSensorIdFromLocalStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function clearSensorIdFromLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* localStorage may be unavailable */
  }
}

export interface BrowserInfo {
  name: string
  isChrome: boolean
  isEdge: boolean
  isBluefy: boolean
  isSafari: boolean
  isFirefox: boolean
  supportsBle: boolean
}

export function detectBrowser(): BrowserInfo {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const isBluefy = /Bluefy/i.test(ua)
  const isEdge = /Edg\//i.test(ua)
  const isChrome = /Chrome/i.test(ua) && !isEdge && !isBluefy
  const isSafari = /Safari/i.test(ua) && !isChrome && !isEdge && !isBluefy
  const isFirefox = /Firefox/i.test(ua)

  let name = 'Unknown'
  if (isBluefy) name = 'Bluefy'
  else if (isEdge) name = 'Edge'
  else if (isChrome) name = 'Chrome'
  else if (isSafari) name = 'Safari'
  else if (isFirefox) name = 'Firefox'

  const supportsBle = typeof navigator !== 'undefined' && !!(navigator as any).bluetooth

  return { name, isChrome, isEdge, isBluefy, isSafari, isFirefox, supportsBle }
}

export async function syncSensorToSupabase(userId: string, sensorId: string): Promise<boolean> {
  saveSensorIdToLocalStorage(sensorId)

  const { error } = await supabase.from('user_onboarding').upsert(
    {
      user_id: userId,
      is_first_access: false,
      paired_sensor_id: sensorId,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )

  return !error
}

export async function getSyncedSensorId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_onboarding')
    .select('paired_sensor_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) return null
  return data.paired_sensor_id
}

export async function ensureSensorConsistency(userId: string): Promise<string | null> {
  const lsSensor = getSensorIdFromLocalStorage()
  const dbSensor = await getSyncedSensorId(userId)

  if (lsSensor && dbSensor && lsSensor === dbSensor) {
    return lsSensor
  }

  if (dbSensor && !lsSensor) {
    saveSensorIdToLocalStorage(dbSensor)
    return dbSensor
  }

  if (lsSensor && !dbSensor) {
    await syncSensorToSupabase(userId, lsSensor)
    return lsSensor
  }

  if (lsSensor && dbSensor && lsSensor !== dbSensor) {
    await syncSensorToSupabase(userId, lsSensor)
    return lsSensor
  }

  return null
}
