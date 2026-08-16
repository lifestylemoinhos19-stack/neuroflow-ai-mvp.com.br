import { useState } from 'react'
import { Camera, Fingerprint, Bluetooth, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CaptureModeSelectorProps {
  onSelect: (mode: 'camera_rppg' | 'camera_ppg' | 'bluetooth') => Promise<void>
}

export function CaptureModeSelector({ onSelect }: CaptureModeSelectorProps) {
  const [selecting, setSelecting] = useState<string | null>(null)

  const handleSelect = async (mode: 'camera_rppg' | 'camera_ppg' | 'bluetooth') => {
    setSelecting(mode)
    await onSelect(mode)
    setSelecting(null)
  }

  const options = [
    {
      mode: 'camera_rppg' as const,
      icon: Camera,
      title: 'Câmera (Facial)',
      desc: 'Detecta batimentos via análise facial. Recomendado para a maioria dos dispositivos.',
      badge: 'Recomendado',
    },
    {
      mode: 'camera_ppg' as const,
      icon: Fingerprint,
      title: 'Câmera (Dedo)',
      desc: 'Coloque o dedo sobre a câmera. Ideal para ambientes com pouca luz.',
      badge: null,
    },
    {
      mode: 'bluetooth' as const,
      icon: Bluetooth,
      title: 'Sensor Bluetooth',
      desc: 'Use um sensor de batimentos cardíacos externo via Bluetooth Low Energy.',
      badge: 'Legacy',
    },
  ]

  return (
    <div className="min-h-screen bg-[#0A192F] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <h2 className="text-xl font-medium text-center mb-2">Escolha o Método de Captura</h2>
        <p className="text-sm text-white/85 text-center mb-8">
          Selecione como deseja monitorar seus batimentos cardíacos durante a sessão de foco.
        </p>
        <div className="space-y-3">
          {options.map((opt) => {
            const Icon = opt.icon
            return (
              <button
                key={opt.mode}
                onClick={() => handleSelect(opt.mode)}
                disabled={!!selecting}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left',
                  'bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#00FFFF]/30',
                  selecting === opt.mode && 'border-[#00FFFF]/50 bg-[#00FFFF]/5',
                )}
              >
                <div className="h-12 w-12 rounded-full bg-[#00FFFF]/10 flex items-center justify-center shrink-0">
                  {selecting === opt.mode ? (
                    <Loader2 className="h-6 w-6 text-[#00FFFF] animate-spin" />
                  ) : (
                    <Icon className="h-6 w-6 text-[#00FFFF]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">{opt.title}</h3>
                    {opt.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#00FFFF]/20 text-[#00FFFF] font-medium">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/75 mt-0.5 leading-relaxed">{opt.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-white/70 shrink-0" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
