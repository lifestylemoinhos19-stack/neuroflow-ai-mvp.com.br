import { supabase } from '@/lib/supabase/client'
import {
  saveSensorIdToLocalStorage,
  getSensorIdFromLocalStorage,
  clearSensorIdFromLocalStorage,
  detectBrowser,
  syncSensorToSupabase,
} from '@/lib/sensor-persistence'

export interface TestResult {
  name: string
  passed: boolean
  message: string
}

export async function runSensorPersistenceTests(userId: string): Promise<TestResult[]> {
  const results: TestResult[] = []

  const browser = detectBrowser()
  results.push({
    name: 'Browser Detection',
    passed: !!browser.name && browser.name !== 'Unknown',
    message: `Detected: ${browser.name} | BLE: ${browser.supportsBle ? 'Yes' : 'No'}`,
  })

  const testKey = 'neuroflow_test_ls'
  let lsAvailable = false
  try {
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    lsAvailable = true
  } catch {
    lsAvailable = false
  }
  results.push({
    name: 'LocalStorage Availability',
    passed: lsAvailable,
    message: lsAvailable ? 'LocalStorage is available' : 'LocalStorage is not available',
  })

  const testSensorId = 'test-sensor-12345'
  saveSensorIdToLocalStorage(testSensorId)
  const readValue = getSensorIdFromLocalStorage()
  results.push({
    name: 'LocalStorage Write/Read',
    passed: readValue === testSensorId,
    message:
      readValue === testSensorId
        ? 'Write/Read successful'
        : `Expected ${testSensorId}, got ${readValue}`,
  })

  clearSensorIdFromLocalStorage()
  const clearedValue = getSensorIdFromLocalStorage()
  results.push({
    name: 'LocalStorage Clear',
    passed: clearedValue === null,
    message: clearedValue === null ? 'Clear successful' : 'Clear failed',
  })

  const syncSensorId = 'test-sync-sensor-67890'
  const syncResult = await syncSensorToSupabase(userId, syncSensorId)
  results.push({
    name: 'Supabase Sync',
    passed: syncResult,
    message: syncResult ? 'Sync successful' : 'Sync failed',
  })

  const lsValue = getSensorIdFromLocalStorage()
  const { data } = await supabase
    .from('user_onboarding')
    .select('paired_sensor_id')
    .eq('user_id', userId)
    .maybeSingle()
  const dbValue = data?.paired_sensor_id ?? null
  results.push({
    name: 'Data Consistency (LS vs DB)',
    passed: lsValue === dbValue && lsValue === syncSensorId,
    message: lsValue === dbValue ? `Consistent: ${lsValue}` : `LS: ${lsValue}, DB: ${dbValue}`,
  })

  clearSensorIdFromLocalStorage()

  console.log('%c[Sensor Persistence Tests]', 'color: #00FFFF; font-weight: bold;')
  results.forEach((r) => {
    const icon = r.passed ? '✅' : '❌'
    const color = r.passed ? 'color: green' : 'color: red'
    console.log(`${icon} %c${r.name}: ${r.message}`, color)
  })

  const allPassed = results.every((r) => r.passed)
  console.log(
    `%c${allPassed ? 'All tests PASSED' : 'Some tests FAILED'}`,
    `color: ${allPassed ? 'green' : 'red'}; font-weight: bold;`,
  )

  return results
}
