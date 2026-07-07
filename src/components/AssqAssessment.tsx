import { useState, useEffect } from 'react'
import { Loader2, Check, AlertTriangle, RotateCcw, Eye, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { assqQuestions, assqOptions, interpretASSQ } from '@/lib/assessment-data'
import { AssessmentProgress } from '@/components/AssessmentProgress'
import { QuestionCard } from '@/components/QuestionCard'
import { saveAssessmentToSupabase } from '@/services/assessment'

const STORAGE_KEY = 'neuroflow_avaliacao_resultados'

export function AssqAssessment() {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [gender, setGender] = useState<'boy' | 'girl'>('boy')
  const [showResult, setShowResult] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    try {
      const draft = localStorage.getItem(STORAGE_KEY)
      if (draft) {
        const parsed = JSON.parse(draft)
        if (parsed.assq?.answers) setAnswers(parsed.assq.answers)
        if (parsed.assq?.gender) setGender(parsed.assq.gender)
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      const draft = localStorage.getItem(STORAGE_KEY)
      const parsed = draft ? JSON.parse(draft) : {}
      parsed.assq = { answers, gender }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    } catch {
      /* ignore */
    }
  }, [answers, gender])

  const answeredCount = Object.keys(answers).length

  const handleAnswer = (key: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    if (showResult) setShowResult(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const result = interpretASSQ(answers, gender)
    const responses = assqQuestions.map((q) => ({
      question_key: q.key,
      question_label: q.text,
      response_value: answers[q.key] ?? 0,
    }))
    const ok = await saveAssessmentToSupabase(
      'assq',
      responses,
      result as unknown as Record<string, unknown>,
    )
    if (ok) {
      toast.success('Resultados salvos com sucesso! 💙', {
        style: { background: '#00FFFF', color: '#0A192F', fontWeight: 600 },
      })
    } else {
      toast.error('Erro ao salvar resultados.')
    }
    setSaving(false)
  }

  const handleReset = () => {
    setAnswers({})
    setShowResult(false)
    try {
      const draft = localStorage.getItem(STORAGE_KEY)
      const parsed = draft ? JSON.parse(draft) : {}
      delete parsed.assq
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
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
              {result.isSuggestive ? 'Sugestivo de TEA' : 'Não sugestivo de TEA'}
            </p>
          </div>
          <p className="text-sm text-white/70">
            {result.isSuggestive
              ? `Pontuação ${result.total} ≥ ${result.threshold}. Recomenda-se avaliação diagnóstica com especialista.`
              : `Pontuação ${result.total} < ${result.threshold}. Continue monitorando o desenvolvimento.`}
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-medium"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar e Enviar Resultados
        </Button>
        <Button
          variant="outline"
          onClick={handleReset}
          className="w-full border-white/20 text-white hover:bg-white/10"
        >
          <RotateCcw className="h-4 w-4 mr-2" /> Reiniciar avaliação
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
        className="w-full bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Eye className="h-4 w-4 mr-2" /> Ver interpretação
      </Button>
      <Button
        variant="outline"
        onClick={handleReset}
        className="w-full border-white/20 text-white hover:bg-white/10"
      >
        <RotateCcw className="h-4 w-4 mr-2" /> Reiniciar avaliação
      </Button>
    </div>
  )
}
