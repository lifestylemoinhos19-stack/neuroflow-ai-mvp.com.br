import { useState, useRef, useCallback, useEffect } from 'react'

const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
const EEG_CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'
const CMD_CHAR_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'
const SENSOR_NAME = 'NeuroFlow-Sensor'
const RECONNECT_TIMEOUT = 15000

export type BleSensorState = 'idle' | 'scanning' | 'connecting' | 'connected' | 'error'

export function useBleSensor() {
  const [state, setState] = useState<BleSensorState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [heartRate, setHeartRate] = useState<number | null>(null)
  const [sensorId, setSensorId] = useState<string | null>(null)

  const deviceRef = useRef<any>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const connectedRef = useRef(false)
  const lastOpRef = useRef<{ type: 'request' | 'reconnect'; sensorId?: string | null } | null>(null)
  const abortRef = useRef(false)

  const isSupported = typeof navigator !== 'undefined' && !!(navigator as any).bluetooth

  const handleNotification = useCallback((event: any) => {
    const value = event?.target?.value
    if (value?.getUint8) {
      setHeartRate(value.getUint8(0))
    }
  }, [])

  const setupGATT = useCallback(
    async (device: any) => {
      const server = await device.gatt.connect()
      const service = await server.getPrimaryService(SERVICE_UUID)
      const eegChar = await service.getCharacteristic(EEG_CHAR_UUID)
      await service.getCharacteristic(CMD_CHAR_UUID)
      eegChar.addEventListener('characteristicvaluechanged', handleNotification)
      await eegChar.startNotifications()
      return device
    },
    [handleNotification],
  )

  const connectDevice = useCallback(
    async (device: any) => {
      setState('connecting')
      setError(null)
      try {
        await setupGATT(device)
        deviceRef.current = device
        setSensorId(device.id)
        connectedRef.current = true
        setState('connected')
      } catch (err) {
        connectedRef.current = false
        setState('error')
        setError(err instanceof Error ? err.message : 'Falha ao conectar ao sensor')
      }
    },
    [setupGATT],
  )

  const requestDevice = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Bluetooth não suportado neste navegador.')
      setState('error')
      return false
    }
    lastOpRef.current = { type: 'request' }
    setState('scanning')
    setError(null)
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ name: SENSOR_NAME, services: [SERVICE_UUID] }],
      })
      await connectDevice(device)
      return true
    } catch (err: any) {
      if (err?.name === 'NotFoundError') {
        setState('idle')
      } else {
        setState('error')
        setError('Falha ao procurar sensor NeuroFlow')
      }
      return false
    }
  }, [connectDevice, isSupported])

  const startAutoReconnect = useCallback(
    async (pairedId?: string | null): Promise<void> => {
      if (!isSupported) {
        setError('Bluetooth não suportado neste navegador.')
        setState('error')
        return
      }
      lastOpRef.current = { type: 'reconnect', sensorId: pairedId }
      abortRef.current = false
      connectedRef.current = false
      setState('scanning')
      setError(null)

      timeoutRef.current = setTimeout(() => {
        if (!connectedRef.current && !abortRef.current) {
          setState('error')
          setError('Não foi possível reconectar ao sensor NeuroFlow. Verifique se ele está ligado.')
        }
      }, RECONNECT_TIMEOUT)

      try {
        const devices: any[] = await (navigator as any).bluetooth.getDevices()
        const target = devices.find(
          (d) => d.name === SENSOR_NAME && (!pairedId || d.id === pairedId),
        )

        if (target) {
          if (!abortRef.current && !connectedRef.current) {
            await connectDevice(target)
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
          }
        } else {
          for (const device of devices) {
            if (device.name !== SENSOR_NAME) continue
            const handler = async () => {
              if (abortRef.current || connectedRef.current) return
              await connectDevice(device)
              if (timeoutRef.current) clearTimeout(timeoutRef.current)
            }
            device.addEventListener('advertisementreceived', handler)
            try {
              await device.watchAdvertisements()
            } catch {
              /* ignore */
            }
          }
        }
      } catch {
        if (!connectedRef.current && !abortRef.current) {
          setState('error')
          setError('Não foi possível reconectar ao sensor NeuroFlow. Verifique se ele está ligado.')
        }
      }
    },
    [connectDevice, isSupported],
  )

  const retry = useCallback(() => {
    const last = lastOpRef.current
    if (!last) return
    if (last.type === 'request') requestDevice()
    else startAutoReconnect(last.sensorId)
  }, [requestDevice, startAutoReconnect])

  const disconnect = useCallback(() => {
    abortRef.current = true
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (deviceRef.current?.gatt?.connected) deviceRef.current.gatt.disconnect()
    deviceRef.current = null
    connectedRef.current = false
    setState('idle')
    setHeartRate(null)
  }, [])

  useEffect(() => {
    return () => {
      abortRef.current = true
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (deviceRef.current?.gatt?.connected) deviceRef.current.gatt.disconnect()
    }
  }, [])

  return {
    state,
    error,
    heartRate,
    sensorId,
    isSupported,
    requestDevice,
    startAutoReconnect,
    retry,
    disconnect,
  }
}
