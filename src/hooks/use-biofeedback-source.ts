import { useState, useEffect, useCallback, useRef } from 'react'
import { useRppg, type CameraCaptureMode } from '@/hooks/use-rppg'
import { useHeartRate, BleConnectionState } from '@/hooks/use-heart-rate'
import {
  BiofeedbackAccuracyTester,
  calculateFusedBpm,
  type AccuracyMetrics,
} from '@/lib/biofeedback-accuracy'

export type SensorMode = 'camera' | 'bluetooth' | 'simulation'

export interface BiofeedbackSourceState {
  bpm: number | null
  fusedBpm: number | null
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
  cameraCaptureMode: CameraCaptureMode
  flashEnabled: boolean
  connectionTimedOut: boolean
  captureMethod: string
  accuracyMetrics: AccuracyMetrics | null
  connectCamera: () => Promise<void>
  connectBle: () => Promise<void>
  disconnectCamera: () => void
  disconnectBle: () => void
  setMode: (mode: SensorMode) => void
  setCameraCaptureMode: (mode: CameraCaptureMode) => void
  toggleFlash: () => Promise<void>
  autoReconnectBle: (sensorId?: string | null) => Promise<void>
  generateAccuracyReport: () => string
}

export function useBiofeedbackSource(): BiofeedbackSourceState {
  const rppg = useRppg()
  const ble = useHeartRate()
  const [mode, setMode] = useState<SensorMode>('camera')
  const accuracyTesterRef = useRef(new BiofeedbackAccuracyTester())

  const bothConnected = rppg.isConnected && ble.connectionState === 'connected'

  useEffect(() => {
    if (rppg.isConnected && mode !== 'camera') {
      setMode('camera')
    } else if (!rppg.isConnected && ble.connectionState === 'connected' && mode !== 'bluetooth') {
      setMode('bluetooth')
    }
  }, [ble.connectionState, rppg.isConnected, mode])

  useEffect(() => {
    if (bothConnected) {
      accuracyTesterRef.current.addSample(rppg.bpm, ble.bpm)
    }
  }, [bothConnected, rppg.bpm, ble.bpm])

  const fusedBpm = bothConnected ? calculateFusedBpm(rppg.bpm, ble.bpm) : null
  const bpm = fusedBpm ?? (mode === 'bluetooth' ? ble.bpm : mode === 'camera' ? rppg.bpm : null)
  const isConnecting =
    mode === 'camera' ? rppg.isConnecting : mode === 'bluetooth' ? ble.isConnecting : false
  const error = mode === 'camera' ? rppg.error : mode === 'bluetooth' ? ble.error : null
  const captureMethod =
    mode === 'camera'
      ? `camera_${rppg.captureMode}`
      : mode === 'bluetooth'
        ? 'bluetooth_ble'
        : 'simulation'

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

  const setCameraCaptureMode = useCallback(
    (m: CameraCaptureMode) => {
      rppg.setCaptureMode(m)
    },
    [rppg],
  )

  const toggleFlash = useCallback(async () => {
    await rppg.toggleFlash()
  }, [rppg])

  const generateAccuracyReport = useCallback(() => accuracyTesterRef.current.generateReport(), [])

  return {
    bpm,
    fusedBpm,
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
    cameraCaptureMode: rppg.captureMode,
    flashEnabled: rppg.flashEnabled,
    connectionTimedOut: rppg.connectionTimedOut,
    captureMethod,
    accuracyMetrics: accuracyTesterRef.current.calculate(),
    connectCamera,
    connectBle,
    disconnectCamera,
    disconnectBle,
    setMode,
    setCameraCaptureMode,
    toggleFlash,
    autoReconnectBle: ble.autoReconnect,
    generateAccuracyReport,
  }
}
