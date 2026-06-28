import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { AnamnesisQuestion } from '@/lib/anamnesis-questions'

interface MultipleChoiceInputProps {
  question: AnamnesisQuestion
  value: string
  onChange: (value: string) => void
}

export function MultipleChoiceInput({ question, value, onChange }: MultipleChoiceInputProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      className="space-y-2"
      aria-label={question.label}
    >
      {question.choices?.map((choice, idx) => {
        const isSelected = value === choice
        return (
          <div
            key={idx}
            className={cn(
              'flex items-center space-x-3 rounded-xl border p-4 transition-all cursor-pointer',
              isSelected
                ? 'border-primary bg-primary/5 shadow-subtle'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
            )}
            onClick={() => onChange(choice)}
          >
            <RadioGroupItem value={choice} id={`${question.key}-${idx}`} className="shrink-0" />
            <Label
              htmlFor={`${question.key}-${idx}`}
              className="flex-1 cursor-pointer text-sm font-medium text-slate-700"
            >
              {choice}
            </Label>
          </div>
        )
      })}
    </RadioGroup>
  )
}
