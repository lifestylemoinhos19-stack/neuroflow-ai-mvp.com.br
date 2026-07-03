import { Bluetooth, BluetoothConnected } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BleConnectionState } from '@/hooks/use-heart-rate'

interface BleStatusIndicatorProps {
  state: BleConnectionState
  className?: string
}

export function BleStatusIndicator({ state, className }: BleStatusIndicatorProps) {
  if (state === 'connected') {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00FFFF]/10',
          className,
        )}
      >
        <BluetoothConnected className="h-4 w-4 text-[#00FFFF]" />
        <span className="text-xs font-medium text-[#00FFFF]">HR</span>
      </div>
    )
  }

  if (state === 'searching') {
    return (
      <div
        className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5', className)}
      >
        <Bluetooth className="h-4 w-4 text-[#00FFFF] animate-pulse" />
        <span className="text-xs font-medium text-white/50">Buscando</span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5', className)}>
      <Bluetooth className="h-4 w-4 text-white/30" />
      <span className="text-xs font-medium text-white/30">Offline</span>
    </div>
  )
}
