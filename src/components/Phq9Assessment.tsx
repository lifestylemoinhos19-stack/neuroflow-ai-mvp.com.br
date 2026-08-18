import { useState, useEffect, useRef } from 'react'
import { Loader2, RotateCcw, Eye, ShieldAlert, FileText, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AssessmentProgress } from '@/components/AssessmentProgress'
import { saveAssessmentToSupabaseForGuest } from '@/services/assessment'
import {
  phq9Questions,
  phq9Options,
  getPhq9Severity,
  getPhq9OptionLabel,
  PHQ9_CRITICAL_ALERT,
  PHQ9_DISCLAIMER,
  PHQ9_DRAFT_KEY,
} from '@/lib/phq9-data'
import { useGuestScale } from '@/contexts/guest-scale-context'
import { returnToMinhasEscalas } from '@/lib/assessment-redirect'

export function Phq9Assessment() {
  const guestId = useGuestScale()
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [showResult, setShowResult] = useState(false)
  const [saving, setSaving] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const draft = localStorage.getItem(PHQ9_DRAFT_KEY)
      if (draft) {
        const parsed = JSON.parse(draft)
        if (parsed.answers) setAnswers(parsed.answers)
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(PHQ9_DRAFT_KEY, JSON.stringify({ answers }))
    } catch {
      /* ignore */
    }
  }, [answers])

  const answeredCount = Object.keys(answers).length
  const totalScore = Object.values(answers).reduce((sum, v) => sum + v, 0)
  const severity = getPhq9Severity(totalScore)
  const isCritical = (answers['phq9_q9'] ?? 0) >= 1

  const handleAnswer = (key: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    if (showResult) setShowResult(false)
  }

  const handleSubmit = async () => {
    setSaving(true)
    const responses = phq9Questions.map((q) => ({
      question_key: q.key,
      question_label: q.text,
      response_value: answers[q.key] ?? 0,
    }))
    const ok = await saveAssessmentToSupabaseForGuest(
      'phq9',
      responses,
      {
        totalScore,
        severity: severity.label,
      },
      guestId,
    )
    setSaving(false)
    if (ok) {
      localStorage.removeItem(PHQ9_DRAFT_KEY)
      setShowResult(true)
      setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
      toast.success('Avaliação PHQ-9 salva com sucesso!', {
        style: { background: '#00FFFF', color: '#0A192F', fontWeight: 600 },
      })
    } else {
      toast.error('Erro ao salvar avaliação.')
    }
  }

  const handleReset = () => {
    setAnswers({})
    setShowResult(false)
    localStorage.removeItem(PHQ9_DRAFT_KEY)
  }

  if (showResult) {
    return (
      <div ref={topRef} className="space-y-4 animate-fade-in-up">
        <div
          className="text-center py-4 rounded-xl border border-white/10"
          style={{ backgroundColor: 'rgba(17, 34, 64, 0.85)' }}
        >
          <p className="text-4xl font-bold" style={{ color: severity.color }}>
            {totalScore}
          </p>
          <p className="text-sm text-white/75 mt-1">Pontuação total (0-27)</p>
          <p className="text-lg font-semibold mt-2" style={{ color: severity.color }}>
            {severity.label}
          </p>
        </div>

        {isCritical && (
          <div className="p-4 rounded-xl border border-red-500/40 bg-red-500/10">
            <div className="flex items-center gap-2 text-red-400">
              <ShieldAlert className="h-5 w-5" />
              <p className="font-bold">Alerta de Segurança</p>
            </div>
            <p className="text-sm text-white/80 mt-2">{PHQ9_CRITICAL_ALERT}</p>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#00FFFF]" /> Detalhamento por questão
          </h3>
          {phq9Questions.map((q, i) => (
            <div
              key={q.key}
              className="flex items-start justify-between gap-3 p-2.5 rounded-lg border border-white/10"
              style={{ backgroundColor: 'rgba(17, 34, 64, 0.85)' }}
            >
              <span className="text-xs text-white/85 flex-1">
                <span className="text-[#00FFFF] font-medium">{i + 1}.</span> {q.text}
              </span>
              <span className="text-xs font-medium text-[#00FFFF] whitespace-nowrap">
                {getPhq9OptionLabel(answers[q.key] ?? -1)}
              </span>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-xs text-yellow-400/80 italic">{PHQ9_DISCLAIMER}</p>
        </div>

        <Button
          onClick={() => returnToMinhasEscalas(guestId)}
          className="w-full bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-semibold"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Minhas Escalas
        </Button>

        <Button
          onClick={handleReset}
          variant="outline"
          className="w-full border-white/20 text-white hover:bg-white/10"
        >
          <RotateCcw className="h-4 w-4 mr-2" /> Nova avaliação
        </Button>
      </div>
    )
  }

  return (
    <div ref={topRef} className="space-y-3">
      <AssessmentProgress answered={answeredCount} total={9} />
      {phq9Questions.map((q, i) => (
        <div
          key={q.key}
          className="p-4 rounded-xl border border-white/10 transition-colors hover:border-[#00FFFF]/20"
          style={{ backgroundColor: 'rgba(17, 34, 64, 0.85)' }}
        >
          <p className="text-white text-sm mb-3">
            <span className="text-[#00FFFF] font-medium">{i + 1}.</span> {q.text}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {phq9Options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(q.key, opt.value)}
                className={cn(
                  'px-3 py-2.5 rounded-lg text-xs font-medium transition-all border text-center',
                  answers[q.key] === opt.value
                    ? 'bg-[rgba(0,255,255,0.18)] border-[#00FFFF] text-[#00FFFF]'
                    : 'border-white/10 text-white/85 hover:bg-[rgba(0,255,255,0.08)] hover:border-[#00FFFF]/30',
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
        disabled={answeredCount < 9 || saving}
        className="w-full bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Eye className="h-4 w-4 mr-2" />
        )}
        Gerar Resultados
      </Button>
    </div>
  )
}
