import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Wind } from 'lucide-react'

export function BreathingOverlay({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale')

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((p) => (p === 'inhale' ? 'exhale' : 'inhale'))
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-[#0A192F]/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
      <div className="relative flex items-center justify-center mb-8">
        <div
          className="rounded-full bg-[#00FFFF]/20 border-2 border-[#00FFFF]/40 flex items-center justify-center"
          style={{
            width: phase === 'inhale' ? '192px' : '128px',
            height: phase === 'inhale' ? '192px' : '128px',
            transition: 'all 4s ease-in-out',
          }}
        >
          <span className="text-[#00FFFF] font-medium text-lg">
            {phase === 'inhale' ? 'Inspire...' : 'Expire...'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-6 max-w-xs text-center">
        <Wind className="h-5 w-5 text-[#00FFFF]/70 shrink-0" />
        <p className="text-white/70 text-sm">
          Você esteve agitado por um tempo. Respire fundo para recuperar o foco.
        </p>
      </div>
      <Button
        onClick={onClose}
        variant="outline"
        className="text-white border-white/20 hover:bg-white/10"
      >
        Continuar
      </Button>
    </div>
  )
}
