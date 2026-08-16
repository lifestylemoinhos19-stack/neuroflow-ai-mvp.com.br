import { useState, useEffect } from 'react'
import { Check, AlertTriangle, RotateCcw, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { snapQuestions, snapOptions, interpretSnapIV } from '@/lib/assessment-data'
import { AssessmentProgress } from '@/components/AssessmentProgress'
import { QuestionCard } from '@/components/QuestionCard'

const STORAGE_KEY = 'neuroflow_public_avaliacao'
const inattentionQs = snapQuestions.filter((q) => q.group === 'inattention')
const hyperactivityQs = snapQuestions.filter((q) => q.group === 'hyperactivity')

export function LocalSnapIV() {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    try {
      const d = localStorage.getItem(STORAGE_KEY)
      if (d) {
        const p = JSON.parse(d)
        if (p.snap?.answers) setAnswers(p.snap.answers)
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      const d = localStorage.getItem(STORAGE_KEY)
      const p = d ? JSON.parse(d) : {}
      p.snap = { ...p.snap, answers }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    } catch {
      /* ignore */
    }
  }, [answers])

  const answeredCount = Object.keys(answers).length

  const handleAnswer = (key: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    if (showResult) setShowResult(false)
  }

  const handleReset = () => {
    setAnswers({})
    setShowResult(false)
    try {
      const d = localStorage.getItem(STORAGE_KEY)
      const p = d ? JSON.parse(d) : {}
      delete p.snap
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    } catch {
      /* ignore */
    }
  }

  if (showResult) {
    const result = interpretSnapIV(answers)
    return (
      <div className="space-y-4 animate-fade-in-up">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-xl bg-[#112240] border border-white/10">
            <p className="text-2xl font-bold text-[#00FFFF]">{result.inattentionHigh}</p>
            <p className="text-xs text-white/75">Itens altos — Desatenção</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-[#112240] border border-white/10">
            <p className="text-2xl font-bold text-[#00FFFF]">{result.hyperactivityHigh}</p>
            <p className="text-xs text-white/75">Itens altos — Hiperatividade</p>
          </div>
        </div>
        <div
          className={cn(
            'p-4 rounded-xl border',
            result.isSuggestive
              ? 'border-yellow-400/30 bg-yellow-500/10 text-yellow-400'
              : 'border-green-400/30 bg-green-500/10 text-green-400',
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            {result.isSuggestive ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <Check className="h-5 w-5" />
            )}
            <p className="font-semibold">
              {result.isSuggestive ? 'Sinais que merecem atenção' : 'Tudo tranquilo por aqui'}
            </p>
          </div>
          <p className="text-sm text-white/70">
            {result.isSuggestive
              ? '6+ itens com pontuação alta em um grupo. Recomenda-se avaliação profissional.'
              : 'Menos de 6 itens altos. Continue monitorando.'}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleReset}
          className="w-full border-white/20 text-white hover:bg-white/10"
        >
          <RotateCcw className="h-4 w-4 mr-2" /> Reiniciar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <AssessmentProgress answered={answeredCount} total={18} />
      <p className="text-sm font-semibold text-[#00FFFF] mt-3 mb-1">Desatenção (1-9)</p>
      {inattentionQs.map((q, i) => (
        <QuestionCard
          key={q.key}
          index={i + 1}
          question={q.text}
          options={snapOptions}
          selectedValue={answers[q.key] ?? null}
          onSelect={(v) => handleAnswer(q.key, v)}
        />
      ))}
      <p className="text-sm font-semibold text-[#00FFFF] mt-3 mb-1">
        Hiperatividade/Impulsividade (10-18)
      </p>
      {hyperactivityQs.map((q, i) => (
        <QuestionCard
          key={q.key}
          index={i + 10}
          question={q.text}
          options={snapOptions}
          selectedValue={answers[q.key] ?? null}
          onSelect={(v) => handleAnswer(q.key, v)}
        />
      ))}
      <Button
        onClick={() => setShowResult(true)}
        disabled={answeredCount < 18}
        className="w-full bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-medium disabled:opacity-40"
      >
        <Eye className="h-4 w-4 mr-2" /> Ver interpretação
      </Button>
      <Button
        variant="outline"
        onClick={handleReset}
        className="w-full border-white/20 text-white hover:bg-white/10"
      >
        <RotateCcw className="h-4 w-4 mr-2" /> Reiniciar
      </Button>
    </div>
  )
}
