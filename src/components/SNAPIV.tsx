import { useState } from 'react'
import {
  snapivQuestions,
  snapivScaleLabels,
  getSnapivRiskLevel,
  SNAP_IV_CUTOFF,
} from '@/lib/scales-data'
import { getSnapivInterpretation } from '@/lib/clinical-references'
import { Button } from '@/components/ui/button'
import { Loader2, Check, AlertTriangle, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { saveScaleResponses } from '@/services/scales'
import { useToast } from '@/hooks/use-toast'

interface SNAPIVProps {
  sessionId: string | null
}

export function SNAPIV({ sessionId }: SNAPIVProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [inattentionAvg, setInattentionAvg] = useState(0)
  const [hyperactivityAvg, setHyperactivityAvg] = useState(0)
  const { toast } = useToast()

  const answeredCount = Object.keys(answers).length

  const handleAnswer = (key: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    if (!sessionId) return
    setSubmitting(true)
    const inattentionQuestions = snapivQuestions.filter((q) => q.subscale === 'inattention')
    const hyperactivityQuestions = snapivQuestions.filter((q) => q.subscale === 'hyperactivity')
    const inattentionSum = inattentionQuestions.reduce((sum, q) => sum + (answers[q.key] ?? 0), 0)
    const hyperactivitySum = hyperactivityQuestions.reduce(
      (sum, q) => sum + (answers[q.key] ?? 0),
      0,
    )
    const inAvg = inattentionSum / inattentionQuestions.length
    const hypAvg = hyperactivitySum / hyperactivityQuestions.length
    setInattentionAvg(inAvg)
    setHyperactivityAvg(hypAvg)
    const responses = snapivQuestions.map((q) => ({
      question_key: q.key,
      question_label: q.question,
      response_value: answers[q.key] ?? 0,
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
    setInattentionAvg(0)
    setHyperactivityAvg(0)
  }

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 text-[#00FFFF] animate-spin" />
        <span className="ml-2 text-white/60 text-sm">Aguardando sessão...</span>
      </div>
    )
  }

  if (submitted) {
    const maxAvg = Math.max(inattentionAvg, hyperactivityAvg)
    const riskLevel = getSnapivRiskLevel(maxAvg)
    const interpretation = getSnapivInterpretation(maxAvg)
    const riskColors = {
      low: 'border-green-400/30 bg-green-500/10 text-green-400',
      medium: 'border-yellow-400/30 bg-yellow-500/10 text-yellow-400',
      high: 'border-red-400/30 bg-red-500/10 text-red-400',
    }
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-2xl font-bold text-[#00FFFF]">{inattentionAvg.toFixed(1)}</p>
            <p className="text-xs text-white/50">Desatenção</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-2xl font-bold text-[#00FFFF]">{hyperactivityAvg.toFixed(1)}</p>
            <p className="text-xs text-white/50">Hiperatividade</p>
          </div>
        </div>
        <div className={cn('p-4 rounded-xl border', riskColors[riskLevel])}>
          <div className="flex items-center gap-2 mb-2">
            {riskLevel === 'low' ? (
              <Check className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
            <p className="font-semibold">{interpretation.interpretation.label}</p>
          </div>
          <p className="text-sm text-white/70">{interpretation.interpretation.action}</p>
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
        <span className="text-xs text-white/50">{answeredCount}/18 respondidas</span>
        <span className="text-xs text-white/40">Corte: {SNAP_IV_CUTOFF}</span>
      </div>
      {snapivQuestions.map((q, i) => (
        <div key={q.key} className="p-3 rounded-xl bg-white/5 border border-white/10">
          <p className="text-white text-sm mb-2.5">
            <span className="text-[#00FFFF] font-medium">{i + 1}.</span> {q.question}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {snapivScaleLabels.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(q.key, opt.value)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                  answers[q.key] === opt.value
                    ? 'bg-[#00FFFF] text-[#0A192F]'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      <Button
        onClick={handleSubmit}
        disabled={answeredCount < 18 || submitting}
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
