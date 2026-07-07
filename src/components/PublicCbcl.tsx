import { useState, useEffect } from 'react'
import { Loader2, Check, AlertTriangle, RotateCcw, Eye, Save, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { cbclQuestions, cbclOptions, interpretCBCL } from '@/lib/cbcl-data'
import { AssessmentProgress } from '@/components/AssessmentProgress'
import { QuestionCard } from '@/components/QuestionCard'
import { savePublicAssessmentToSupabase } from '@/services/assessment'
import { useGuestSession } from '@/hooks/use-guest-session'

const STORAGE_KEY = 'neuroflow_avaliacao_resultados'
const internalizingQs = cbclQuestions.filter(
  (q) => q.subscale === 'anxious' || q.subscale === 'withdrawn' || q.subscale === 'somatic',
)
const externalizingQs = cbclQuestions.filter(
  (q) => q.subscale === 'rule_breaking' || q.subscale === 'aggressive',
)

interface PublicCbclProps {
  onDevolutiva?: () => void
}

export function PublicCbcl({ onDevolutiva }: PublicCbclProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [showResult, setShowResult] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const { guestToken } = useGuestSession()

  useEffect(() => {
    try {
      const draft = localStorage.getItem(STORAGE_KEY)
      if (draft) {
        const parsed = JSON.parse(draft)
        if (parsed.cbcl?.answers) setAnswers(parsed.cbcl.answers)
        if (parsed.cbcl?.lastSaved) setLastSaved(parsed.cbcl.lastSaved)
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      const draft = localStorage.getItem(STORAGE_KEY)
      const parsed = draft ? JSON.parse(draft) : {}
      parsed.cbcl = { ...parsed.cbcl, answers }
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
    const result = interpretCBCL(answers)
    const responses = cbclQuestions.map((q) => ({
      question_key: q.key,
      question_label: q.text,
      response_value: answers[q.key] ?? 0,
    }))
    const ok = await savePublicAssessmentToSupabase(
      'cbcl',
      responses,
      result as unknown as Record<string, unknown>,
      guestToken,
    )
    if (ok) {
      const now = new Date().toISOString()
      setLastSaved(now)
      try {
        const draft = localStorage.getItem(STORAGE_KEY)
        const parsed = draft ? JSON.parse(draft) : {}
        parsed.cbcl = { ...parsed.cbcl, lastSaved: now }
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
      delete parsed.cbcl
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    } catch {
      /* ignore */
    }
  }

  if (showResult) {
    const result = interpretCBCL(answers)
    const hasElevation = result.isInternalizingElevated || result.isExternalizingElevated
    return (
      <div className="space-y-4 animate-fade-in-up">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-xl bg-[#112240] border border-white/10">
            <p className="text-2xl font-bold text-[#00FFFF]">{result.internalizing}</p>
            <p className="text-xs text-white/50">Internalizante</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-[#112240] border border-white/10">
            <p className="text-2xl font-bold text-[#00FFFF]">{result.externalizing}</p>
            <p className="text-xs text-white/50">Externalizante</p>
          </div>
        </div>
        <div
          className={cn(
            'p-4 rounded-xl border',
            hasElevation
              ? 'border-yellow-400/30 bg-yellow-500/10 text-yellow-400'
              : 'border-green-400/30 bg-green-500/10 text-green-400',
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            {hasElevation ? <AlertTriangle className="h-5 w-5" /> : <Check className="h-5 w-5" />}
            <p className="font-semibold">
              {hasElevation ? 'Comportamentos que merecem atenção' : 'Tudo tranquilo por aqui'}
            </p>
          </div>
          <p className="text-sm text-white/70">
            {hasElevation
              ? 'Resultados sugerem elevação em comportamentos internalizantes ou externalizantes. Recomenda-se avaliação profissional.'
              : 'Pontuações dentro do esperado. Continue monitorando o desenvolvimento.'}
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
        {onDevolutiva && (
          <Button
            onClick={onDevolutiva}
            variant="outline"
            className="w-full border-[#00FFFF]/30 text-[#00FFFF] hover:bg-[#00FFFF]/10"
          >
            <Eye className="h-4 w-4 mr-2" /> Ver Devolutiva Completa
          </Button>
        )}
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
      <AssessmentProgress answered={answeredCount} total={25} />
      {lastSaved && (
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          <Clock className="h-3 w-3" />
          <span>
            Último salvamento:{' '}
            {new Date(lastSaved).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      )}
      <p className="text-sm font-semibold text-[#00FFFF] mt-3 mb-1">
        Comportamentos Internalizantes (1-13)
      </p>
      {internalizingQs.map((q, i) => (
        <QuestionCard
          key={q.key}
          index={i + 1}
          question={q.text}
          options={cbclOptions}
          selectedValue={answers[q.key] ?? null}
          onSelect={(v) => handleAnswer(q.key, v)}
        />
      ))}
      <p className="text-sm font-semibold text-[#00FFFF] mt-3 mb-1">
        Comportamentos Externalizantes (14-25)
      </p>
      {externalizingQs.map((q, i) => (
        <QuestionCard
          key={q.key}
          index={i + 14}
          question={q.text}
          options={cbclOptions}
          selectedValue={answers[q.key] ?? null}
          onSelect={(v) => handleAnswer(q.key, v)}
        />
      ))}
      <Button
        onClick={() => setShowResult(true)}
        disabled={answeredCount < 25}
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
