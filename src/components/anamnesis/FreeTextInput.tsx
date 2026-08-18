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
        className="resize-none bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-400 focus-visible:bg-slate-900 focus-visible:ring-primary focus-visible:border-primary text-base leading-relaxed font-medium"
        autoFocus
      />
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="text-slate-300">{question.description}</span>
        <span
          id={`${question.key}-counter`}
          className={
            charCount >= maxLength ? 'text-amber-400 font-bold' : 'text-slate-300 font-medium'
          }
          aria-live="polite"
        >
          {charCount} / {maxLength} caracteres
        </span>
      </div>
    </div>
  )
}
