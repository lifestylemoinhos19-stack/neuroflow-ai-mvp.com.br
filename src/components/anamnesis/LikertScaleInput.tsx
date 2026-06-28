import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AnamnesisQuestion } from '@/lib/anamnesis-questions'

interface LikertScaleInputProps {
  question: AnamnesisQuestion
  value: number | null
  onChange: (value: number) => void
}

export function LikertScaleInput({ question, value, onChange }: LikertScaleInputProps) {
  const min = question.likertMin || 1
  const max = question.likertMax || 5
  const points = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  const getLabel = (point: number) => {
    if (point === min) return question.likertMinLabel || 'Mínimo'
    if (point === max) return question.likertMaxLabel || 'Máximo'
    return ''
  }

  return (
    <div className="space-y-6" role="radiogroup" aria-label={question.label}>
      <div className="flex justify-between text-xs font-medium text-slate-500 px-1">
        <span className="text-left max-w-[120px]">{question.likertMinLabel || 'Mínimo'}</span>
        <span className="text-right max-w-[120px]">{question.likertMaxLabel || 'Máximo'}</span>
      </div>
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        {points.map((point) => {
          const isSelected = value === point
          return (
            <div key={point} className="flex flex-col items-center gap-2 flex-1">
              <Button
                type="button"
                variant="outline"
                role="radio"
                aria-checked={isSelected}
                aria-label={`Opção ${point}: ${getLabel(point)}`}
                onClick={() => onChange(point)}
                className={cn(
                  'h-12 w-full rounded-xl border-2 font-display font-bold text-lg transition-all',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground shadow-subtle scale-105'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-primary/50 hover:bg-primary/5',
                )}
              >
                {point}
              </Button>
            </div>
          )
        })}
      </div>
      {value !== null && (
        <p
          className="text-center text-sm font-medium text-primary animate-fade-in-up"
          aria-live="polite"
        >
          Selecionado: {getLabel(value) || value}
        </p>
      )}
    </div>
  )
}
