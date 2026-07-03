import { useState, useEffect, useRef, useCallback } from 'react'

export type BleConnectionState = 'disconnected' | 'searching' | 'connected'

const DEVICE_ID_KEY = 'neuroflow_ble_device_id'

export function useHeartRate() {
  const [bpm, setBpm] = useState<number | null>(null)
  const [connectionState, setConnectionState] = useState<BleConnectionState>('disconnected')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const characteristicRef = useRef<any>(null)
  const deviceRef = useRef<any>(null)

  const isSupported = typeof navigator !== 'undefined' && !!(navigator as any).bluetooth
  const isConnected = connectionState === 'connected'

  const setupCharacteristic = useCallback(async (characteristic: any) => {
    await characteristic.startNotifications()
    characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
      const value = event.target.value
      const flags = value.getUint8(0)
      const rate16Bit = flags & 0x1
      const heartRate = rate16Bit ? value.getUint16(1, true) : value.getUint8(1)
      setBpm(heartRate)
    })
    characteristicRef.current = characteristic
    setConnectionState('connected')
  }, [])

  const connectToDevice = useCallback(
    async (device: any) => {
      deviceRef.current = device
      device.addEventListener('gattserverdisconnected', () => {
        setConnectionState('disconnected')
        setBpm(null)
        characteristicRef.current = null
      })
      const server = await device.gatt.connect()
      const service = await server.getPrimaryService('heart_rate')
      const characteristic = await service.getCharacteristic('heart_rate_measurement')
      await setupCharacteristic(characteristic)
    },
    [setupCharacteristic],
  )

  const autoReconnect = useCallback(async () => {
    if (!isSupported) return
    const storedId = localStorage.getItem(DEVICE_ID_KEY)
    if (!storedId) return

    setConnectionState('searching')
    try {
      const nav = navigator as any
      if (typeof nav.bluetooth.getDevices === 'function') {
        const devices = await nav.bluetooth.getDevices()
        const device = devices.find((d: any) => d.id === storedId)
        if (device) {
          await connectToDevice(device)
          return
        }
      }
    } catch {
      // Silent failure — no pop-ups during auto-reconnection
    }
    setConnectionState('disconnected')
  }, [isSupported, connectToDevice])

  const disconnect = useCallback(() => {
    if (deviceRef.current?.gatt?.connected) {
      try {
        deviceRef.current.gatt.disconnect()
      } catch {
        /* noop */
      }
    }
    deviceRef.current = null
    characteristicRef.current = null
    setConnectionState('disconnected')
    setBpm(null)
  }, [])

  const connect = useCallback(async () => {
    setError(null)
    if (!isSupported) {
      setError('Web Bluetooth não suportado neste navegador.')
      return
    }
    setIsConnecting(true)
    setConnectionState('searching')
    try {
      const nav = navigator as any
      const device = await nav.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
      })
      localStorage.setItem(DEVICE_ID_KEY, device.id)
      await connectToDevice(device)
    } catch (err: any) {
      setConnectionState('disconnected')
      if (err.name === 'NotFoundError') {
        setError('Nenhum dispositivo encontrado.')
      } else {
        setError(err.message || 'Erro ao conectar sensor.')
      }
    } finally {
      setIsConnecting(false)
    }
  }, [isSupported, connectToDevice])

  useEffect(() => () => disconnect(), [disconnect])

  return {
    bpm,
    connectionState,
    isConnected,
    isConnecting,
    isSupported,
    connect,
    disconnect,
    autoReconnect,
    error,
  }
}
