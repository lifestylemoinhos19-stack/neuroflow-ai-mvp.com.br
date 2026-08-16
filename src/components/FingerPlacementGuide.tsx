import { Button } from '@/components/ui/button'
import { Fingerprint, Zap, ZapOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FingerPlacementGuideProps {
  flashEnabled: boolean
  onToggleFlash: () => void
}

export function FingerPlacementGuide({ flashEnabled, onToggleFlash }: FingerPlacementGuideProps) {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-20 gap-4">
      <div className="h-24 w-24 rounded-full border-2 border-[#00FFFF]/40 flex items-center justify-center animate-pulse">
        <Fingerprint className="h-12 w-12 text-[#00FFFF]/80" />
      </div>
      <div className="text-center px-6">
        <p className="text-sm text-[#00FFFF]/85 font-medium">
          Coloque seu dedo sobre a câmera frontal
        </p>
        <p className="text-xs text-white/70 mt-1">
          Cubra completamente a lente da câmera com a ponta do dedo
        </p>
      </div>
      <div className="pointer-events-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFlash}
          className={cn(
            'rounded-full border text-xs',
            flashEnabled
              ? 'bg-[#00FFFF]/20 border-[#00FFFF]/40 text-[#00FFFF]'
              : 'bg-white/5 border-white/10 text-white/75',
          )}
        >
          {flashEnabled ? (
            <Zap className="h-3.5 w-3.5 mr-1" />
          ) : (
            <ZapOff className="h-3.5 w-3.5 mr-1" />
          )}
          {flashEnabled ? 'Flash Ativado' : 'Ativar Flash'}
        </Button>
      </div>
    </div>
  )
}
