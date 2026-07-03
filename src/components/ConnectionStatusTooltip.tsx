import { Bluetooth, BluetoothConnected, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
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
  { label: string; color: string; icon: typeof Bluetooth }
> = {
  idle: { label: 'Desconectado', color: 'text-white/30', icon: Bluetooth },
  scanning: { label: 'Buscando sensor...', color: 'text-[#00FFFF]', icon: Bluetooth },
  connecting: { label: 'Conectando...', color: 'text-[#00FFFF]', icon: Bluetooth },
  connected: { label: 'Sensor conectado', color: 'text-[#00FFFF]', icon: BluetoothConnected },
  error: { label: 'Falha na conexão', color: 'text-red-400', icon: AlertCircle },
}

export function ConnectionStatusTooltip({ state, error, onRetry }: ConnectionStatusTooltipProps) {
  const config = stateConfig[state]
  const Icon = config.icon
  const isLoading = state === 'scanning' || state === 'connecting'

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all duration-200 font-sans font-medium',
              state === 'connected' ? 'bg-[#00FFFF]/10' : 'bg-white/5',
            )}
          >
            {isLoading ? (
              <Loader2 className={cn('h-4 w-4 animate-spin', config.color)} />
            ) : (
              <Icon
                className={cn('h-4 w-4', config.color, state === 'scanning' && 'animate-pulse')}
              />
            )}
            <span className={cn('text-xs font-medium', config.color)}>
              {state === 'connected' ? 'HR' : config.label}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-[#0A192F] border-white/10">
          <div className="flex flex-col gap-2 max-w-xs">
            <p className={cn('text-xs font-medium', config.color)}>{config.label}</p>
            {error && <p className="text-xs text-red-400">{error}</p>}
            {state === 'error' && (
              <Button
                size="sm"
                onClick={onRetry}
                className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full text-xs font-medium h-7"
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
