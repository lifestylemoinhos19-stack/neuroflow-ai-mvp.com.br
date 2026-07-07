import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import {
  getOnboardingState,
  markOnboardingComplete,
  getCachedSensorId,
  type UserOnboarding,
} from '@/services/user-onboarding'
import { ensureSensorConsistency, detectBrowser } from '@/lib/sensor-persistence'
import { useBleSensor } from '@/hooks/use-ble-sensor'
import { BluetoothPairingTutorial } from '@/components/BluetoothPairingTutorial'
import { ConnectionStatusTooltip } from '@/components/ConnectionStatusTooltip'
import { Loader2 } from 'lucide-react'

export function AdaptiveBleConnect({ onConnected }: { onConnected?: () => void }) {
  const { user } = useAuth()
  const { state, error, sensorId, isSupported, requestDevice, startAutoReconnect } = useBleSensor()
  const [onboarding, setOnboarding] = useState<UserOnboarding | null>(null)
  const [loading, setLoading] = useState(true)
  const autoReconnectStarted = useRef(false)
  const connectedNotifiedRef = useRef(false)
  const onConnectedRef = useRef(onConnected)

  useEffect(() => {
    onConnectedRef.current = onConnected
  }, [onConnected])

  const fetchOnboarding = useCallback(async () => {
    if (!user) {
      setOnboarding(null)
      setLoading(false)
      return
    }
    try {
      const data = await getOnboardingState(user.id)
      setOnboarding(data)
    } catch {
      setOnboarding(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchOnboarding()
  }, [fetchOnboarding])

  useEffect(() => {
    if (state === 'connected') {
      if (!connectedNotifiedRef.current && onConnectedRef.current) {
        connectedNotifiedRef.current = true
        onConnectedRef.current()
      }
    } else {
      connectedNotifiedRef.current = false
    }
  }, [state])

  useEffect(() => {
    if (loading || !user) return

    const browser = detectBrowser()
    const cachedSensor = getCachedSensorId()

    if (
      onboarding &&
      !onboarding.is_first_access &&
      (onboarding.paired_sensor_id || cachedSensor) &&
      !autoReconnectStarted.current &&
      state !== 'connected'
    ) {
      autoReconnectStarted.current = true
      const sensorToReconnect = onboarding.paired_sensor_id || cachedSensor
      startAutoReconnect(sensorToReconnect)
    } else if (
      !onboarding &&
      cachedSensor &&
      browser.supportsBle &&
      !autoReconnectStarted.current &&
      state !== 'connected'
    ) {
      autoReconnectStarted.current = true
      ensureSensorConsistency(user.id).then((consistentId) => {
        if (consistentId) {
          startAutoReconnect(consistentId)
        }
      })
    }
  }, [loading, onboarding, user, startAutoReconnect, state])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-[#00FFFF]" />
      </div>
    )
  }

  const isFirstAccess = !onboarding || onboarding.is_first_access

  if (isFirstAccess) {
    return (
      <BluetoothPairingTutorial
        bleState={state}
        isSupported={isSupported}
        error={error}
        sensorId={sensorId}
        onConnect={async () => {
          await requestDevice()
        }}
        onComplete={async () => {
          if (user && sensorId) {
            await markOnboardingComplete(user.id, sensorId)
            await fetchOnboarding()
          }
        }}
        onSkip={async () => {
          if (user) {
            await markOnboardingComplete(user.id, 'simulation')
            await fetchOnboarding()
          }
        }}
      />
    )
  }

  return (
    <ConnectionStatusTooltip
      state={state}
      error={error}
      onRetry={() => startAutoReconnect(onboarding?.paired_sensor_id || getCachedSensorId())}
    />
  )
}
