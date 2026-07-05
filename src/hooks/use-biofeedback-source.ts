import { useState, useEffect, useCallback } from 'react'
import { useRppg } from '@/hooks/use-rppg'
import { useHeartRate, BleConnectionState } from '@/hooks/use-heart-rate'

export type SensorMode = 'camera' | 'bluetooth' | 'simulation'

export interface BiofeedbackSourceState {
  bpm: number | null
  mode: SensorMode
  isConnecting: boolean
  error: string | null
  bleConnectionState: BleConnectionState
  bleConnecting: boolean
  bleError: string | null
  cameraConnecting: boolean
  isCameraActive: boolean
  isBleSupported: boolean
  isCameraSupported: boolean
  bleBpm: number | null
  cameraBpm: number | null
  connectCamera: () => Promise<void>
  connectBle: () => Promise<void>
  disconnectCamera: () => void
  disconnectBle: () => void
  setMode: (mode: SensorMode) => void
  autoReconnectBle: () => Promise<void>
}

export function useBiofeedbackSource(): BiofeedbackSourceState {
  const rppg = useRppg()
  const ble = useHeartRate()
  const [mode, setMode] = useState<SensorMode>('camera')

  useEffect(() => {
    if (ble.connectionState === 'connected' && mode !== 'bluetooth') {
      setMode('bluetooth')
    }
  }, [ble.connectionState, mode])

  const bpm = mode === 'bluetooth' ? ble.bpm : mode === 'camera' ? rppg.bpm : null
  const isConnecting =
    mode === 'camera' ? rppg.isConnecting : mode === 'bluetooth' ? ble.isConnecting : false
  const error = mode === 'camera' ? rppg.error : mode === 'bluetooth' ? ble.error : null

  const connectCamera = useCallback(async () => {
    setMode('camera')
    await rppg.connect()
  }, [rppg])

  const connectBle = useCallback(async () => {
    setMode('bluetooth')
    await ble.connect()
  }, [ble])

  const disconnectCamera = useCallback(() => {
    rppg.disconnect()
    setMode('simulation')
  }, [rppg])

  const disconnectBle = useCallback(() => {
    ble.disconnect()
    setMode('camera')
  }, [ble])

  return {
    bpm,
    mode,
    isConnecting,
    error,
    bleConnectionState: ble.connectionState,
    bleConnecting: ble.isConnecting,
    bleError: ble.error,
    cameraConnecting: rppg.isConnecting,
    isCameraActive: rppg.isConnected,
    isBleSupported: ble.isSupported,
    isCameraSupported: rppg.isSupported,
    bleBpm: ble.bpm,
    cameraBpm: rppg.bpm,
    connectCamera,
    connectBle,
    disconnectCamera,
    disconnectBle,
    setMode,
    autoReconnectBle: ble.autoReconnect,
  }
}
