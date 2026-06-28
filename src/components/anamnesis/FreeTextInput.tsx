import { Textarea } from '@/components/ui/textarea'
import { AnamnesisQuestion } from '@/lib/anamnesis-questions'

interface FreeTextInputProps {
  question: AnamnesisQuestion
  value: string
  onChange: (value: string) => void
}

export function FreeTextInput({ question, value, onChange }: FreeTextInputProps) {
  const maxLength = question.maxLength || 500
  const charCount = value.length

  return (
    <div className="space-y-3">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={question.placeholder || 'Digite sua resposta...'}
        aria-label={question.label}
        aria-describedby={`${question.key}-counter`}
        rows={5}
        className="resize-none bg-slate-50 focus-visible:bg-white text-base leading-relaxed"
        autoFocus
      />
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{question.description}</span>
        <span
          id={`${question.key}-counter`}
          className={charCount >= maxLength ? 'text-amber-600 font-medium' : ''}
          aria-live="polite"
        >
          {charCount} / {maxLength} caracteres
        </span>
      </div>
    </div>
  )
}
