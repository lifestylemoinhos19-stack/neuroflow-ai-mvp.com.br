import { useState, useEffect } from 'react'
import { Loader2, Check, AlertTriangle, RotateCcw, Eye, Save, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { snapQuestions, snapOptions, interpretSnapIV } from '@/lib/assessment-data'
import { AssessmentProgress } from '@/components/AssessmentProgress'
import { QuestionCard } from '@/components/QuestionCard'
import { saveAssessmentToSupabase } from '@/services/assessment'

const STORAGE_KEY = 'neuroflow_avaliacao_resultados'
const inattentionQs = snapQuestions.filter((q) => q.group === 'inattention')
const hyperactivityQs = snapQuestions.filter((q) => q.group === 'hyperactivity')

export function SnapIVAssessment() {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [showResult, setShowResult] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  useEffect(() => {
    try {
      const draft = localStorage.getItem(STORAGE_KEY)
      if (draft) {
        const parsed = JSON.parse(draft)
        if (parsed.snap?.answers) setAnswers(parsed.snap.answers)
        if (parsed.snap?.lastSaved) setLastSaved(parsed.snap.lastSaved)
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      const draft = localStorage.getItem(STORAGE_KEY)
      const parsed = draft ? JSON.parse(draft) : {}
      parsed.snap = { ...parsed.snap, answers }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    } catch {
      /* ignore */
    }
  }, [answers])

  const answeredCount = Object.keys(answers).length

  const handleAnswer = (key: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    if (showResult) setShowResult(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const result = interpretSnapIV(answers)
    const responses = snapQuestions.map((q) => ({
      question_key: q.key,
      question_label: q.text,
      response_value: answers[q.key] ?? 0,
    }))
    const ok = await saveAssessmentToSupabase(
      'snap-iv',
      responses,
      result as unknown as Record<string, unknown>,
    )
    if (ok) {
      const now = new Date().toISOString()
      setLastSaved(now)
      try {
        const draft = localStorage.getItem(STORAGE_KEY)
        const parsed = draft ? JSON.parse(draft) : {}
        parsed.snap = { ...parsed.snap, lastSaved: now }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
      } catch {
        /* ignore */
      }
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
    setLastSaved(null)
    try {
      const draft = localStorage.getItem(STORAGE_KEY)
      const parsed = draft ? JSON.parse(draft) : {}
      delete parsed.snap
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    } catch {
      /* ignore */
    }
  }

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  if (showResult) {
    const result = interpretSnapIV(answers)
    return (
      <div className="space-y-4 animate-fade-in-up">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-xl bg-[#112240] border border-white/10">
            <p className="text-2xl font-bold text-[#00FFFF]">{result.inattentionHigh}</p>
            <p className="text-xs text-white/50">Itens altos — Desatenção</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-[#112240] border border-white/10">
            <p className="text-2xl font-bold text-[#00FFFF]">{result.hyperactivityHigh}</p>
            <p className="text-xs text-white/50">Itens altos — Hiperatividade</p>
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
              {result.isSuggestive
                ? 'Sinais que merecem atenção carinhosa'
                : 'Tudo tranquilo por aqui'}
            </p>
          </div>
          <p className="text-sm text-white/70">
            {result.isSuggestive
              ? '6 ou mais itens com pontuação alta (2 ou 3) em pelo menos um grupo. Recomenda-se avaliação profissional.'
              : 'Menos de 6 itens altos em ambos os grupos. Continue monitorando o desenvolvimento.'}
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
      <AssessmentProgress answered={answeredCount} total={18} />
      {lastSaved && (
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          <Clock className="h-3 w-3" />
          <span>Último salvamento: {formatTimestamp(lastSaved)}</span>
        </div>
      )}
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
