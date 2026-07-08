import { useId } from 'react'
import { cn } from '@/lib/utils'
import { Heart, Waves, Zap, Activity } from 'lucide-react'

interface EnergyBarProps {
  bpm: number
  energy: number
  stateLevel: 'calm' | 'alert' | 'agitated'
}

export function EnergyBar({ bpm, energy, stateLevel }: EnergyBarProps) {
  const rawId = useId()
  const patternId = rawId.replace(/:/g, '')

  const stateLabel = stateLevel === 'calm' ? 'Calmo' : stateLevel === 'alert' ? 'Atento' : 'Agitado'
  const stateTextureLabel =
    stateLevel === 'calm'
      ? 'Ondas Suaves'
      : stateLevel === 'agitated'
        ? 'Padrão Geométrico'
        : 'Neutro'
  const energyColor =
    bpm < 70 ? 'bg-[#00FFFF]' : bpm > 90 ? 'bg-[#1E3A5F] border border-white/30' : 'bg-[#3B82F6]'
  const energyPulse =
    bpm < 70 ? 'animate-pulse-slow' : bpm > 90 ? 'animate-pulse-fast' : 'animate-pulse'

  const waveId = `wave-${patternId}`
  const geoId = `geo-${patternId}`
  const dotId = `dot-${patternId}`
  const activePattern = stateLevel === 'calm' ? waveId : stateLevel === 'agitated' ? geoId : dotId

  return (
    <div className="flex flex-col items-center z-10 sm:z-20">
      <span
        className="text-xs font-medium text-[#00FFFF] mb-2 w-16 text-center leading-tight"
        id="energy-bar-label"
      >
        Energia da Calma
      </span>
      <div
        className="h-44 sm:h-56 w-7 sm:w-8 bg-white/10 rounded-full border border-[#00FFFF]/20 p-1 flex flex-col justify-end overflow-hidden relative"
        role="progressbar"
        aria-labelledby="energy-bar-label"
        aria-valuenow={Math.round(energy)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Energia: ${Math.round(energy)}%. Estado: ${stateLabel}, Textura: ${stateTextureLabel}. BPM: ${bpm}.`}
      >
        <div
          className={cn(
            'w-full rounded-full transition-all duration-1000 relative overflow-hidden',
            energyColor,
            energyPulse,
            bpm > 100 && 'border border-white/30',
          )}
          style={{ height: `${energy}%` }}
        >
          <svg
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <pattern id={waveId} width="20" height="20" patternUnits="userSpaceOnUse">
                <path
                  d="M0,10 Q5,5 10,10 T20,10"
                  stroke="rgba(255,255,255,0.4)"
                  fill="none"
                  strokeWidth="1.5"
                />
              </pattern>
              <pattern id={geoId} width="14" height="14" patternUnits="userSpaceOnUse">
                <path
                  d="M0,14 L7,0 L14,14 Z"
                  stroke="rgba(255,255,255,0.4)"
                  fill="none"
                  strokeWidth="1.5"
                />
              </pattern>
              <pattern id={dotId} width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="5" cy="5" r="1.5" fill="rgba(255,255,255,0.4)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${activePattern})`} />
          </svg>
          <span className="text-white text-[9px] font-medium flex justify-center pt-1 relative z-10">
            {Math.round(energy)}%
          </span>
        </div>
      </div>
      <div className="mt-2 sm:mt-4 flex flex-col items-center bg-white/5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-[#00FFFF]/10">
        <Heart
          className={cn(
            'h-5 w-5 mb-1',
            stateLevel === 'calm'
              ? 'text-[#00FFFF]'
              : stateLevel === 'alert'
                ? 'text-blue-400'
                : 'text-white/40 animate-pulse',
          )}
          style={{ animationDuration: `${60 / bpm}s` }}
        />
        <span className="text-[10px] text-white/70 font-medium">BPM</span>
        <span className="font-medium text-white">{bpm}</span>
        <span
          className={cn(
            'text-[9px] mt-0.5 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1',
            stateLevel === 'calm'
              ? 'bg-[#00FFFF]/20 text-[#00FFFF]'
              : stateLevel === 'alert'
                ? 'bg-blue-400/20 text-blue-300'
                : 'bg-white/15 text-white/70',
          )}
          aria-live="polite"
          aria-label={`Estado: ${stateLabel}, Textura: ${stateTextureLabel}`}
        >
          {stateLevel === 'calm' && <Waves className="h-2.5 w-2.5" />}
          {stateLevel === 'agitated' && <Zap className="h-2.5 w-2.5" />}
          {stateLevel === 'alert' && <Activity className="h-2.5 w-2.5" />}
          {stateLabel} · {stateTextureLabel}
        </span>
      </div>
    </div>
  )
}
