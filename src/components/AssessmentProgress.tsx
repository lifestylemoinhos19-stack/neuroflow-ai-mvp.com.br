import { cn } from '@/lib/utils'

interface AssessmentProgressProps {
  answered: number
  total: number
}

export function AssessmentProgress({ answered, total }: AssessmentProgressProps) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-white/75">
        <span>
          {answered}/{total} respondidas
        </span>
        <span className="text-[#00FFFF] font-medium">{pct}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full bg-[#00FFFF] transition-all duration-300',
            pct === 100 && 'shadow-[0_0_10px_rgba(0,255,255,0.5)]',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
