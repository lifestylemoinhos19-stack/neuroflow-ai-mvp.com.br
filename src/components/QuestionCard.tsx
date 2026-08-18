import { cn } from '@/lib/utils'
import type { AssessmentOption } from '@/lib/assessment-data'

interface QuestionCardProps {
  index: number
  question: string
  options: AssessmentOption[]
  selectedValue: number | null
  onSelect: (value: number) => void
}

export function QuestionCard({
  index,
  question,
  options,
  selectedValue,
  onSelect,
}: QuestionCardProps) {
  return (
    <div className="p-4 rounded-xl bg-[#112240] border border-slate-700/80 shadow-md transition-colors hover:border-[#00FFFF]/40">
      <p className="text-slate-100 text-sm sm:text-base font-medium mb-3 leading-relaxed">
        <span className="text-[#00FFFF] font-bold mr-1.5">{index}.</span> {question}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={cn(
              'px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#00FFFF]',
              selectedValue === opt.value
                ? 'bg-[#00FFFF] text-[#0A192F] shadow-[0_0_12px_rgba(0,255,255,0.4)] font-bold scale-[1.02]'
                : 'bg-slate-800/90 text-slate-100 hover:bg-slate-700 hover:text-white border border-slate-600/80',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
