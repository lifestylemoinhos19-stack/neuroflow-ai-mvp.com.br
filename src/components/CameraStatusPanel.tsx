import { Camera, CameraOff, AlertCircle, Loader2, RefreshCw, Video, Wifi } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CameraStatus } from '@/hooks/use-optical-capture'

interface CameraStatusPanelProps {
  status: CameraStatus
  error: string | null
  onInitialize: () => void
  onRetry: () => void
}

const statusConfig: Record<
  CameraStatus,
  { icon: typeof Camera; label: string; color: string; bgColor: string }
> = {
  idle: { icon: Camera, label: 'Câmera inativa', color: 'text-white/75', bgColor: 'bg-white/5' },
  active: {
    icon: Video,
    label: 'Câmera ativa',
    color: 'text-[#00FFFF]',
    bgColor: 'bg-[#00FFFF]/10',
  },
  blocked: {
    icon: CameraOff,
    label: 'Permissão bloqueada',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
  in_use: {
    icon: AlertCircle,
    label: 'Câmera em uso',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
  },
  error: {
    icon: AlertCircle,
    label: 'Erro de câmera',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
  unsupported: {
    icon: CameraOff,
    label: 'Não suportado',
    color: 'text-white/70',
    bgColor: 'bg-white/5',
  },
}

export function CameraStatusPanel({
  status,
  error,
  onInitialize,
  onRetry,
}: CameraStatusPanelProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'rounded-xl border border-white/10 p-4 flex items-center justify-between gap-3',
        config.bgColor,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
            config.bgColor,
          )}
        >
          <Icon className={cn('h-5 w-5', config.color)} />
        </div>
        <div className="min-w-0">
          <p className={cn('text-sm font-medium', config.color)}>{config.label}</p>
          {error && <p className="text-xs text-white/75 mt-0.5 truncate">{error}</p>}
          {status === 'active' && (
            <p className="text-xs text-[#00FFFF]/85 mt-0.5 flex items-center gap-1">
              <Wifi className="h-3 w-3" /> Pronto para biofeedback
            </p>
          )}
        </div>
      </div>
      {status === 'idle' && (
        <Button
          size="sm"
          onClick={onInitialize}
          className="bg-[#00FFFF]/10 text-[#00FFFF] hover:bg-[#00FFFF]/20 border border-[#00FFFF]/30 shrink-0"
        >
          <Camera className="h-4 w-4 mr-1.5" /> Iniciar
        </Button>
      )}
      {(status === 'blocked' || status === 'error' || status === 'in_use') && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="border-white/20 text-white hover:bg-white/10 shrink-0"
        >
          <RefreshCw className="h-4 w-4 mr-1.5" /> Tentar Novamente
        </Button>
      )}
    </div>
  )
}
