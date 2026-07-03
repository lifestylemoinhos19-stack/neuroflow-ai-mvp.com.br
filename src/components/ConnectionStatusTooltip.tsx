import { Bluetooth, BluetoothConnected, Loader2, AlertCircle, RefreshCw, Check } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { BleSensorState } from '@/hooks/use-ble-sensor'

interface ConnectionStatusTooltipProps {
  state: BleSensorState
  error: string | null
  onRetry: () => void
}

const stateConfig: Record<
  BleSensorState,
  { label: string; tooltip: string; color: string; icon: typeof Bluetooth }
> = {
  idle: {
    label: 'Desconectado',
    tooltip: 'Sensor não conectado.',
    color: 'text-white/40',
    icon: Bluetooth,
  },
  scanning: {
    label: 'Escaneando',
    tooltip: 'Escaneando sensores próximos...',
    color: 'text-[#00FFFF]',
    icon: Bluetooth,
  },
  connecting: {
    label: 'Conectando',
    tooltip: 'Estabelecendo conexão...',
    color: 'text-[#00FFFF]',
    icon: Bluetooth,
  },
  connected: {
    label: 'Conectado',
    tooltip: 'Sensor conectado!',
    color: 'text-[#00FFFF]',
    icon: BluetoothConnected,
  },
  error: {
    label: 'Erro',
    tooltip: 'Falha na conexão',
    color: 'text-red-400',
    icon: AlertCircle,
  },
}

export function ConnectionStatusTooltip({ state, error, onRetry }: ConnectionStatusTooltipProps) {
  const config = stateConfig[state]
  const Icon = config.icon
  const isScanning = state === 'scanning'
  const isConnecting = state === 'connecting'
  const isConnected = state === 'connected'
  const isError = state === 'error'

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-200 font-sans font-medium border',
              isConnected
                ? 'bg-[#00FFFF]/10 border-[#00FFFF]/30'
                : isError
                  ? 'bg-red-500/10 border-red-400/30'
                  : 'bg-[#0A192F] border-[#00FFFF]/30',
            )}
          >
            {isScanning ? (
              <Loader2 className={cn('h-4 w-4 animate-spin', config.color)} />
            ) : isConnecting ? (
              <span className="relative flex h-4 w-4 items-center justify-center">
                <span
                  className={cn(
                    'absolute h-3 w-3 rounded-full animate-ping',
                    config.color,
                    'bg-[#00FFFF]/40',
                  )}
                />
                <Bluetooth className={cn('h-4 w-4 relative', config.color)} />
              </span>
            ) : isConnected ? (
              <Check className={cn('h-4 w-4', config.color)} />
            ) : (
              <Icon className={cn('h-4 w-4', config.color)} />
            )}
            <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-[#0A192F] border-[#00FFFF]/30 text-white">
          <div className="flex flex-col gap-2 max-w-xs">
            <p className={cn('text-xs font-medium', config.color)}>{config.tooltip}</p>
            {error && isError && <p className="text-xs text-red-400">{error}</p>}
            {isError && (
              <Button
                size="sm"
                onClick={onRetry}
                className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-lg text-xs font-medium h-7"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Tentar novamente
              </Button>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
