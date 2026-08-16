import { cn } from '@/lib/utils'

interface OpticalCaptureOverlayProps {
  mode: 'rppg' | 'ppg'
  isCapturing: boolean
}

export function OpticalCaptureOverlay({ mode, isCapturing }: OpticalCaptureOverlayProps) {
  if (mode === 'rppg') {
    return (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
        <div className="relative">
          <div
            className={cn(
              'w-48 h-60 rounded-[50%] border-2 border-dashed border-[#00FFFF]/60',
              isCapturing && 'animate-pulse',
            )}
            style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)' }}
          />
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <p className="text-xs text-[#00FFFF]/85 font-medium">Posicione seu rosto no círculo</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-20 gap-4">
      <div
        className={cn(
          'w-28 h-36 rounded-lg border-2 border-dashed border-[#00FFFF]/60 flex items-center justify-center',
          isCapturing && 'animate-pulse',
        )}
        style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)' }}
      >
        <span className="text-4xl">👆</span>
      </div>
      <p className="text-xs text-[#00FFFF]/85 font-medium">Cubra a câmera traseira com o dedo</p>
    </div>
  )
}
