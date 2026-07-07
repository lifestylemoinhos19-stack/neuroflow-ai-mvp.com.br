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
    <div className="p-3 rounded-xl bg-[#112240] border border-white/10 transition-colors hover:border-[#00FFFF]/20">
      <p className="text-white text-sm mb-2.5">
        <span className="text-[#00FFFF] font-medium">{index}.</span> {question}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              selectedValue === opt.value
                ? 'bg-[#00FFFF] text-[#0A192F] shadow-[0_0_8px_rgba(0,255,255,0.3)]'
                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
