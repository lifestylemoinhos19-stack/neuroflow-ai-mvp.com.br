import { useState } from 'react'
import { mchatQuestions, getMChatRiskLevel } from '@/lib/scales-data'
import { getMChatFlowchartResult } from '@/lib/clinical-references'
import { Button } from '@/components/ui/button'
import { Loader2, Check, AlertTriangle, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { saveScaleResponses } from '@/services/scales'
import { useToast } from '@/hooks/use-toast'

interface MChatRProps {
  sessionId: string | null
}

export function MChatR({ sessionId }: MChatRProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const { toast } = useToast()

  const answeredCount = Object.keys(answers).length

  const handleAnswer = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    if (!sessionId) return
    setSubmitting(true)
    const riskScore = mchatQuestions.filter((q) => answers[q.key] === q.riskAnswer).length
    setScore(riskScore)
    const responses = mchatQuestions.map((q) => ({
      question_key: q.key,
      question_label: q.question,
      response_value: answers[q.key] || 'Sem resposta',
    }))
    const ok = await saveScaleResponses(sessionId, responses)
    if (!ok) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao salvar respostas.' })
    }
    setSubmitting(false)
    setSubmitted(true)
  }

  const handleReset = () => {
    setAnswers({})
    setSubmitted(false)
    setScore(0)
  }

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 text-[#00FFFF] animate-spin" />
        <span className="ml-2 text-white/85 text-sm">Aguardando sessão...</span>
      </div>
    )
  }

  if (submitted) {
    const riskLevel = getMChatRiskLevel(score)
    const flowchart = getMChatFlowchartResult(score)
    const riskColors = {
      low: 'border-green-400/30 bg-green-500/10 text-green-400',
      medium: 'border-yellow-400/30 bg-yellow-500/10 text-yellow-400',
      high: 'border-red-400/30 bg-red-500/10 text-red-400',
    }
    return (
      <div className="space-y-4">
        <div className="text-center py-4">
          <p className="text-4xl font-bold text-[#00FFFF]">{score}</p>
          <p className="text-sm text-white/75 mt-1">respostas de risco em 20 questões</p>
        </div>
        <div className={cn('p-4 rounded-xl border', riskColors[riskLevel])}>
          <div className="flex items-center gap-2 mb-2">
            {riskLevel === 'low' ? (
              <Check className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
            <p className="font-semibold">{flowchart.flowchart.label}</p>
          </div>
          <p className="text-sm text-white/70">{flowchart.flowchart.action}</p>
          <p className="text-xs text-white/75 mt-2">{flowchart.flowchart.nextStep}</p>
        </div>
        <Button
          variant="outline"
          onClick={handleReset}
          className="border-white/20 text-white hover:bg-white/10"
        >
          <RotateCcw className="h-4 w-4 mr-2" /> Refazer
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/75">{answeredCount}/20 respondidas</span>
      </div>
      {mchatQuestions.map((q, i) => (
        <div key={q.key} className="p-3 rounded-xl bg-white/5 border border-white/10">
          <p className="text-white text-sm mb-2.5">
            <span className="text-[#00FFFF] font-medium">{i + 1}.</span> {q.question}
          </p>
          <div className="flex gap-2">
            {['Sim', 'Não'].map((opt) => (
              <button
                key={opt}
                onClick={() => handleAnswer(q.key, opt)}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                  answers[q.key] === opt
                    ? 'bg-[#00FFFF] text-[#0A192F]'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10',
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      <Button
        onClick={handleSubmit}
        disabled={answeredCount < 20 || submitting}
        className="w-full bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-medium"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Check className="h-4 w-4 mr-2" />
        )}
        Salvar & Continuar
      </Button>
    </div>
  )
}
