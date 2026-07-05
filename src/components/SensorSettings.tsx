import { Button } from '@/components/ui/button'
import { Camera, Bluetooth, BluetoothConnected, Loader2, Monitor } from 'lucide-react'
import type { BiofeedbackSourceState } from '@/hooks/use-biofeedback-source'
import { cn } from '@/lib/utils'

export function SensorSettings({ source }: { source: BiofeedbackSourceState }) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-[#00FFFF]">Modo de Captura</h4>
      <div className="grid grid-cols-3 gap-2">
        {(['camera', 'bluetooth', 'simulation'] as const).map((m) => (
          <button
            key={m}
            onClick={() => source.setMode(m)}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-all',
              source.mode === m
                ? 'bg-[#00FFFF]/10 border-[#00FFFF]/30 text-[#00FFFF]'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white',
            )}
          >
            {m === 'camera' && <Camera className="h-4 w-4" />}
            {m === 'bluetooth' && <Bluetooth className="h-4 w-4" />}
            {m === 'simulation' && <Monitor className="h-4 w-4" />}
            {m === 'camera' ? 'Câmera' : m === 'bluetooth' ? 'Bluetooth' : 'Simulação'}
          </button>
        ))}
      </div>

      {source.mode === 'camera' && (
        <div className="space-y-2">
          <Button
            variant={source.isCameraActive ? 'outline' : 'default'}
            size="sm"
            className="w-full"
            onClick={source.isCameraActive ? source.disconnectCamera : source.connectCamera}
            disabled={source.cameraConnecting || !source.isCameraSupported}
          >
            {source.cameraConnecting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Camera className="h-4 w-4 mr-2" />
            )}
            {source.cameraConnecting
              ? 'Conectando...'
              : source.isCameraActive
                ? 'Câmera Ativa'
                : 'Conectar Câmera'}
          </Button>
          {source.error && <p className="text-xs text-red-400">{source.error}</p>}
          {source.isCameraActive && source.cameraBpm && (
            <p className="text-xs text-[#00FFFF]">BPM (rPPG): {source.cameraBpm}</p>
          )}
          {!source.isCameraSupported && (
            <p className="text-xs text-amber-400">Câmera não suportada neste dispositivo.</p>
          )}
        </div>
      )}

      {source.mode === 'bluetooth' && (
        <div className="space-y-2">
          <Button
            variant={source.bleConnectionState === 'connected' ? 'outline' : 'default'}
            size="sm"
            className="w-full"
            onClick={
              source.bleConnectionState === 'connected' ? source.disconnectBle : source.connectBle
            }
            disabled={source.bleConnecting || !source.isBleSupported}
          >
            {source.bleConnecting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : source.bleConnectionState === 'connected' ? (
              <BluetoothConnected className="h-4 w-4 mr-2" />
            ) : (
              <Bluetooth className="h-4 w-4 mr-2" />
            )}
            {source.bleConnecting
              ? 'Conectando...'
              : source.bleConnectionState === 'connected'
                ? 'Conectado'
                : 'Conectar Sensor'}
          </Button>
          {source.bleError && <p className="text-xs text-red-400">{source.bleError}</p>}
          {source.bleConnectionState === 'connected' && source.bleBpm && (
            <p className="text-xs text-[#00FFFF]">BPM (BLE): {source.bleBpm}</p>
          )}
          {!source.isBleSupported && (
            <p className="text-xs text-amber-400">Bluetooth não suportado. Usando simulação.</p>
          )}
        </div>
      )}

      {source.mode === 'simulation' && (
        <p className="text-xs text-white/50">
          Modo simulação ativo. Dados de BPM são gerados automaticamente para teste.
        </p>
      )}
    </div>
  )
}
