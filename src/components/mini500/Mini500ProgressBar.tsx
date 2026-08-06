import { cn } from '@/lib/utils'

interface Mini500ProgressBarProps {
  current: number
  total: number
}

export function Mini500ProgressBar({ current, total }: Mini500ProgressBarProps) {
  const percentage = Math.round((current / total) * 100)
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-[#E6F1FF]/70 font-medium">
          Módulo {current} de {total}
        </span>
        <span className={cn('text-[#00FFFF] font-bold tabular-nums')}>{percentage}%</span>
      </div>
      <div className="h-2.5 w-full bg-[#233554] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#00FFFF] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
