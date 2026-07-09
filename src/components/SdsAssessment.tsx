import { useState, useEffect, useRef } from 'react'
import { Loader2, RotateCcw, Eye, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AssessmentProgress } from '@/components/AssessmentProgress'
import { saveAssessmentToSupabase } from '@/services/assessment'
import {
  sdsQuestions,
  sdsSections,
  getSdsImpairmentLevel,
  getSdsTotalScore,
  getSherraTotalScore,
  SDS_DRAFT_KEY,
  SDS_DISCLAIMER,
} from '@/lib/sds-data'

const REQUIRED_KEYS = ['sds_q1', 'sds_q2', 'sds_q3']

function ScaleGrid({
  qKey,
  max,
  value,
  onSelect,
}: {
  qKey: string
  max: number
  value: number | undefined
  onSelect: (k: string, v: number) => void
}) {
  return (
    <div
      className={cn(
        'grid gap-1.5',
        max === 7 ? 'grid-cols-4 sm:grid-cols-8' : 'grid-cols-6 sm:grid-cols-11',
      )}
    >
      {Array.from({ length: max + 1 }, (_, i) => (
        <button
          key={i}
          onClick={() => onSelect(qKey, i)}
          className={cn(
            'h-9 rounded-lg text-xs font-bold transition-all border',
            value === i
              ? 'bg-[#00FFFF] border-[#00FFFF] text-[#0A192F]'
              : 'border-white/10 text-white/60 hover:bg-[rgba(0,255,255,0.08)] hover:border-[#00FFFF]/30',
          )}
        >
          {i}
        </button>
      ))}
    </div>
  )
}

export function SdsAssessment() {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [showResult, setShowResult] = useState(false)
  const [saving, setSaving] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const draft = localStorage.getItem(SDS_DRAFT_KEY)
      if (draft) setAnswers(JSON.parse(draft).answers || {})
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(SDS_DRAFT_KEY, JSON.stringify({ answers }))
    } catch {
      /* ignore */
    }
  }, [answers])

  const totalSds = getSdsTotalScore(answers)
  const totalSherra = getSherraTotalScore(answers)
  const daysLost = answers['sds_days_lost'] ?? 0
  const requiredAnswered = REQUIRED_KEYS.filter((k) => answers[k] !== undefined).length
  const answeredCount = Object.keys(answers).length

  const handleAnswer = (key: string, value: number) => {
    setAnswers((p) => ({ ...p, [key]: value }))
    if (showResult) setShowResult(false)
  }

  const handleSubmit = async () => {
    setSaving(true)
    const responses = sdsQuestions.map((q) => ({
      question_key: q.key,
      question_label: q.text,
      response_value: answers[q.key] ?? 0,
    }))
    const ok = await saveAssessmentToSupabase('sds', responses, { totalSds, totalSherra, daysLost })
    setSaving(false)
    if (ok) {
      localStorage.removeItem(SDS_DRAFT_KEY)
      setShowResult(true)
      setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
      toast.success('Avaliação SDS salva com sucesso!', {
        style: { background: '#00FFFF', color: '#0A192F', fontWeight: 600 },
      })
    } else {
      toast.error('Erro ao salvar avaliação.')
    }
  }

  const handleReset = () => {
    setAnswers({})
    setShowResult(false)
    localStorage.removeItem(SDS_DRAFT_KEY)
  }

  if (showResult) {
    return (
      <div ref={topRef} className="space-y-4 animate-fade-in-up">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            className="text-center py-4 rounded-xl border border-white/10"
            style={{ backgroundColor: 'rgba(17, 34, 64, 0.85)' }}
          >
            <p className="text-4xl font-bold text-[#00FFFF]">{totalSds}</p>
            <p className="text-sm text-white/50 mt-1">Total SDS (0-30)</p>
          </div>
          <div
            className="text-center py-4 rounded-xl border border-white/10"
            style={{ backgroundColor: 'rgba(17, 34, 64, 0.85)' }}
          >
            <p className="text-4xl font-bold text-[#00FFFF]">{totalSherra}</p>
            <p className="text-sm text-white/50 mt-1">Total Sherra (0-30)</p>
          </div>
          <div
            className="text-center py-4 rounded-xl border border-white/10"
            style={{ backgroundColor: 'rgba(17, 34, 64, 0.85)' }}
          >
            <p className="text-4xl font-bold text-[#00FFFF]">{daysLost}</p>
            <p className="text-sm text-white/50 mt-1">Dias Perdidos (0-7)</p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#00FFFF]" /> Detalhamento por questão
          </h3>
          {sdsQuestions.map((q) => {
            const score = answers[q.key] ?? 0
            const level = getSdsImpairmentLevel(score)
            return (
              <div
                key={q.key}
                className="flex items-start justify-between gap-3 p-2.5 rounded-lg border border-white/10"
                style={{ backgroundColor: 'rgba(17, 34, 64, 0.85)' }}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-[#00FFFF] font-medium">{q.label}</span>
                  <span className="block text-xs text-white/60 mt-0.5">{q.text}</span>
                  <span className="block text-xs mt-0.5" style={{ color: level.color }}>
                    {level.label}
                  </span>
                </div>
                <span className="text-lg font-bold text-[#00FFFF] whitespace-nowrap">{score}</span>
              </div>
            )
          })}
        </div>

        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-xs text-yellow-400/80 italic">{SDS_DISCLAIMER}</p>
        </div>

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
    <div ref={topRef} className="space-y-4">
      <AssessmentProgress answered={answeredCount} total={7} />
      {sdsSections.map((section) => {
        const sectionQuestions = sdsQuestions.filter((q) => q.section === section.id)
        return (
          <div key={section.id} className="space-y-2">
            <div className="pt-2">
              <h2 className="text-sm font-bold text-[#00FFFF]">{section.title}</h2>
              <p className="text-xs text-white/50">{section.description}</p>
            </div>
            {sectionQuestions.map((q) => (
              <div
                key={q.key}
                className="p-4 rounded-xl border border-white/10 transition-colors hover:border-[#00FFFF]/20"
                style={{ backgroundColor: 'rgba(17, 34, 64, 0.85)' }}
              >
                <p className="text-white text-sm mb-2">
                  <span className="text-[#00FFFF] font-medium">{q.label}.</span> {q.text}
                </p>
                <ScaleGrid
                  qKey={q.key}
                  max={q.max}
                  value={answers[q.key]}
                  onSelect={handleAnswer}
                />
                {q.max === 10 && (
                  <p className="text-xs text-white/30 mt-1.5 flex justify-between">
                    <span>0 = Nenhum</span>
                    <span>10 = Extremo</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )
      })}
      <Button
        onClick={handleSubmit}
        disabled={requiredAnswered < 3 || saving}
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
