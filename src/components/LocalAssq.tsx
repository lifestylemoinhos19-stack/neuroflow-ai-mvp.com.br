import { useState, useEffect } from 'react'
import { Check, AlertTriangle, RotateCcw, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { assqQuestions, assqOptions, interpretASSQ } from '@/lib/assessment-data'
import { AssessmentProgress } from '@/components/AssessmentProgress'
import { QuestionCard } from '@/components/QuestionCard'

const STORAGE_KEY = 'neuroflow_public_avaliacao'

export function LocalAssq() {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [gender, setGender] = useState<'boy' | 'girl'>('boy')
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    try {
      const d = localStorage.getItem(STORAGE_KEY)
      if (d) {
        const p = JSON.parse(d)
        if (p.assq?.answers) setAnswers(p.assq.answers)
        if (p.assq?.gender) setGender(p.assq.gender)
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      const d = localStorage.getItem(STORAGE_KEY)
      const p = d ? JSON.parse(d) : {}
      p.assq = { ...p.assq, answers, gender }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    } catch {
      /* ignore */
    }
  }, [answers, gender])

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
      delete p.assq
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    } catch {
      /* ignore */
    }
  }

  if (showResult) {
    const result = interpretASSQ(answers, gender)
    return (
      <div className="space-y-4 animate-fade-in-up">
        <div className="text-center py-4">
          <p className="text-4xl font-bold text-[#00FFFF]">{result.total}</p>
          <p className="text-sm text-white/50 mt-1">Pontuação total (máx. 54)</p>
          <p className="text-xs text-white/40 mt-1">
            Limiar: {result.threshold} ({gender === 'boy' ? 'Menino' : 'Menina'})
          </p>
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
              {result.isSuggestive
                ? 'Vale a pena conversar com um profissional'
                : 'Sinais dentro do esperado'}
            </p>
          </div>
          <p className="text-sm text-white/70">
            {result.isSuggestive
              ? `Pontuação ${result.total} ≥ ${result.threshold}. Recomenda-se avaliação diagnóstica.`
              : `Pontuação ${result.total} < ${result.threshold}. Continue monitorando.`}
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
      <AssessmentProgress answered={answeredCount} total={27} />
      <div className="mt-2">
        <p className="text-xs text-white/50 mb-1.5">Sexo da criança</p>
        <div className="flex gap-2">
          {(['boy', 'girl'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                gender === g
                  ? 'bg-[#00FFFF] text-[#0A192F]'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10',
              )}
            >
              {g === 'boy' ? 'Menino' : 'Menina'}
            </button>
          ))}
        </div>
      </div>
      {assqQuestions.map((q, i) => (
        <QuestionCard
          key={q.key}
          index={i + 1}
          question={q.text}
          options={assqOptions}
          selectedValue={answers[q.key] ?? null}
          onSelect={(v) => handleAnswer(q.key, v)}
        />
      ))}
      <Button
        onClick={() => setShowResult(true)}
        disabled={answeredCount < 27}
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
