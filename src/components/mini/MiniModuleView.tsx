import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { MiniModule, MiniAnswers, MiniQuestion } from '@/lib/mini-data'

interface MiniModuleViewProps {
  module: MiniModule
  answers: MiniAnswers
  onAnswer: (key: string, label: string, value: string) => void
}

function QuestionRow({
  question,
  answer,
  onAnswer,
}: {
  question: MiniQuestion
  answer: string | undefined
  onAnswer: (key: string, label: string, value: string) => void
}) {
  const cardStyle = { backgroundColor: '#112240', border: '1px solid #233554' }

  if (question.type === 'text') {
    return (
      <div className="p-4 rounded-xl" style={cardStyle}>
        <p className="text-sm text-[#E6F1FF] mb-2">{question.label}</p>
        <Textarea
          value={answer || ''}
          onChange={(e) => onAnswer(question.key, question.label, e.target.value)}
          placeholder="Digite a resposta..."
          className="bg-[#0A192F] text-[#E6F1FF] border-[#233554] focus:border-[#00FFFF]/50 min-h-[60px] resize-none"
        />
      </div>
    )
  }

  return (
    <div className="p-4 rounded-xl" style={cardStyle}>
      <p className="text-sm text-[#E6F1FF] mb-3">{question.label}</p>
      <div className="flex gap-2">
        <button
          onClick={() => onAnswer(question.key, question.label, 'Sim')}
          className={cn(
            'px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            answer === 'Sim'
              ? 'bg-[#00FFFF] text-[#0A192F] shadow-[0_0_12px_rgba(0,255,255,0.3)]'
              : 'border border-[#233554] text-[#E6F1FF]/60 hover:border-[#00FFFF]/40 hover:text-[#E6F1FF]',
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
              : 'border border-[#233554] text-[#E6F1FF]/60 hover:border-[#FF6B6B]/40 hover:text-[#E6F1FF]',
          )}
        >
          Não
        </button>
      </div>
    </div>
  )
}

export function MiniModuleView({ module, answers, onAnswer }: MiniModuleViewProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-3xl font-bold text-[#00FFFF]">{module.letter}</span>
        <div>
          <h2 className="text-lg font-semibold text-[#E6F1FF]">{module.title}</h2>
          <p className="text-xs text-[#E6F1FF]/50 mt-0.5">{module.description}</p>
        </div>
      </div>

      {module.questions.map((q, i) => {
        const prevQ = module.questions[i - 1]
        const showGroupLabel = q.group && (!prevQ || prevQ.group !== q.group)

        return (
          <div key={q.key}>
            {showGroupLabel && (
              <p className="text-xs text-[#00FFFF]/70 font-medium uppercase tracking-wide mt-4 mb-1.5">
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
