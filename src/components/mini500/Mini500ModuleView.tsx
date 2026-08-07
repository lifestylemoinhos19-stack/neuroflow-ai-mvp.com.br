import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import {
  Mini500Module,
  Mini500Answers,
  Mini500Question,
  SUBSTANCE_LIST_500,
} from '@/lib/mini500-data'
import { getVisibleQuestions } from '@/lib/mini500-skip-logic'

interface Mini500ModuleViewProps {
  module: Mini500Module
  answers: Mini500Answers
  onAnswer: (key: string, label: string, value: string) => void
}

function SubstanceMultiSelect({
  answer,
  onAnswer,
}: {
  answer: string | undefined
  onAnswer: (v: string) => void
}) {
  const selected = answer ? answer.split(',').filter(Boolean) : []
  const toggle = (substance: string) => {
    const next = selected.includes(substance)
      ? selected.filter((s) => s !== substance)
      : [...selected, substance]
    onAnswer(next.join(','))
  }
  return (
    <div className="space-y-2">
      {SUBSTANCE_LIST_500.map((s) => (
        <label key={s} className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={selected.includes(s)} onCheckedChange={() => toggle(s)} />
          <span className="text-sm text-[#E6F1FF]">{s}</span>
        </label>
      ))}
    </div>
  )
}

function QuestionRow({
  question,
  answer,
  onAnswer,
}: {
  question: Mini500Question
  answer: string | undefined
  onAnswer: (k: string, l: string, v: string) => void
}) {
  const cardStyle = { backgroundColor: '#112240', border: '1px solid #233554' }
  const isFollowUp = !!question.followUpOf

  if (question.type === 'text') {
    if (question.key === 'K1_specify') {
      return (
        <div
          className={cn('p-4 rounded-xl ml-4', isFollowUp && 'border-l-2 border-[#00FFFF]/30')}
          style={cardStyle}
        >
          <p className="text-sm text-[#E6F1FF] mb-3">{question.label}</p>
          <SubstanceMultiSelect
            answer={answer}
            onAnswer={(v) => onAnswer(question.key, question.label, v)}
          />
        </div>
      )
    }
    return (
      <div className="p-4 rounded-xl" style={cardStyle}>
        <p className="text-sm text-[#E6F1FF] mb-2">{question.label}</p>
        <Textarea
          value={answer || ''}
          onChange={(e) => onAnswer(question.key, question.label, e.target.value)}
          placeholder="Digite a resposta..."
          className="bg-[#0A192F] text-[#E6F1FF] border-[#233554] min-h-[60px] resize-none"
        />
      </div>
    )
  }

  return (
    <div
      className={cn('p-4 rounded-xl', isFollowUp && 'ml-4 border-l-2 border-[#00FFFF]/30')}
      style={cardStyle}
    >
      <p className="text-sm text-[#E6F1FF] mb-3">
        {isFollowUp && <span className="text-[#00FFFF] text-xs mr-1.5">↳ Seguimento:</span>}
        {question.label}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onAnswer(question.key, question.label, 'Sim')}
          className={cn(
            'px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            answer === 'Sim'
              ? 'bg-[#00FFFF] text-[#0A192F] shadow-[0_0_12px_rgba(0,255,255,0.3)]'
              : 'border border-[#233554] text-[#E6F1FF]/80 hover:border-[#00FFFF]/40 hover:text-[#E6F1FF]',
          )}
        >
          Sim
        </button>
        <button
          onClick={() => onAnswer(question.key, question.label, 'Não')}
          className={cn(
            'px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            answer === 'Não'
              ? 'bg-[#FF6B6B] text-white shadow-[0_0_12px_rgba(255,107,107,0.3)]'
              : 'border border-[#233554] text-[#E6F1FF]/80 hover:border-[#FF6B6B]/40 hover:text-[#E6F1FF]',
          )}
        >
          Não
        </button>
      </div>
    </div>
  )
}

export function Mini500ModuleView({ module, answers, onAnswer }: Mini500ModuleViewProps) {
  const visibleQuestions = getVisibleQuestions(module, answers)
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-3xl font-bold text-[#00FFFF]">{module.letter}</span>
        <div>
          <h2 className="text-lg font-bold text-white">{module.title}</h2>
          <p className="text-sm text-[#E6F1FF] mt-0.5">{module.description}</p>
        </div>
      </div>
      {visibleQuestions.map((q, i) => {
        const prevQ = visibleQuestions[i - 1]
        const showGroupLabel = q.group && (!prevQ || prevQ.group !== q.group)
        return (
          <div key={q.key}>
            {showGroupLabel && (
              <p className="text-xs text-[#00FFFF] font-medium uppercase tracking-wide mt-4 mb-1.5">
                {q.group}
              </p>
            )}
            <QuestionRow question={q} answer={answers[q.key]} onAnswer={onAnswer} />
          </div>
        )
      })}
    </div>
  )
}
