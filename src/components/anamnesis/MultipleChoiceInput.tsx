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
      className="space-y-2.5"
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
                ? 'border-[#00FFFF] bg-[#00FFFF]/10 shadow-md text-white font-semibold'
                : 'border-slate-700 bg-slate-900/90 text-slate-100 hover:border-slate-500 hover:bg-slate-800',
            )}
            onClick={() => onChange(choice)}
          >
            <RadioGroupItem
              value={choice}
              id={`${question.key}-${idx}`}
              className="shrink-0 border-slate-400 text-[#00FFFF]"
            />
            <Label
              htmlFor={`${question.key}-${idx}`}
              className="flex-1 cursor-pointer text-sm sm:text-base font-medium text-slate-100"
            >
              {choice}
            </Label>
          </div>
        )
      })}
    </RadioGroup>
  )
}
