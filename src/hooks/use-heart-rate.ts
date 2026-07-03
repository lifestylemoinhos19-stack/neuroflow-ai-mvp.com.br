import { useState, useEffect, useRef, useCallback } from 'react'

export function useHeartRate() {
  const [bpm, setBpm] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const characteristicRef = useRef<any>(null)

  const isSupported = typeof navigator !== 'undefined' && !!(navigator as any).bluetooth

  const disconnect = useCallback(() => {
    if (characteristicRef.current) {
      try {
        characteristicRef.current.service?.device?.gatt?.disconnect()
      } catch {
        /* noop */
      }
      characteristicRef.current = null
    }
    setIsConnected(false)
    setBpm(null)
  }, [])

  const connect = useCallback(async () => {
    setError(null)
    if (!isSupported) {
      setError('Web Bluetooth não suportado neste navegador.')
      return
    }
    setIsConnecting(true)
    try {
      const nav = navigator as any
      const device = await nav.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
      })
      const server = await device.gatt.connect()
      const service = await server.getPrimaryService('heart_rate')
      const characteristic = await service.getCharacteristic('heart_rate_measurement')
      await characteristic.startNotifications()
      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value
        const flags = value.getUint8(0)
        const rate16Bit = flags & 0x1
        const heartRate = rate16Bit ? value.getUint16(1, true) : value.getUint8(1)
        setBpm(heartRate)
      })
      device.addEventListener('gattserverdisconnected', () => {
        setIsConnected(false)
        setBpm(null)
        characteristicRef.current = null
      })
      characteristicRef.current = characteristic
      setIsConnected(true)
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        setError('Nenhum dispositivo encontrado.')
      } else {
        setError(err.message || 'Erro ao conectar sensor.')
      }
    } finally {
      setIsConnecting(false)
    }
  }, [isSupported])

  useEffect(() => () => disconnect(), [disconnect])

  return { bpm, isConnected, isConnecting, isSupported, connect, disconnect, error }
}
