import { useState, useEffect, useRef } from 'react'
import { Loader2, RotateCcw, Eye, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AssessmentProgress } from '@/components/AssessmentProgress'
import { saveAssessmentToSupabase } from '@/services/assessment'
import {
  ybocsQuestions,
  ybocsOptions,
  ybocsSections,
  getYbocsSeverity,
  getYbocsOptionLabel,
  getObsessionsSubtotal,
  getCompulsionsSubtotal,
  getYbocsTotal,
  YBOCS_DRAFT_KEY,
  YBOCS_DISCLAIMER,
} from '@/lib/ybocs-data'

const CARD_BG = { backgroundColor: 'rgba(17, 34, 64, 0.85)' }

export function YbocsAssessment() {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [showResult, setShowResult] = useState(false)
  const [saving, setSaving] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const draft = localStorage.getItem(YBOCS_DRAFT_KEY)
      if (draft) setAnswers(JSON.parse(draft).answers || {})
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(YBOCS_DRAFT_KEY, JSON.stringify({ answers }))
    } catch {
      /* ignore */
    }
  }, [answers])

  const answeredCount = Object.keys(answers).length
  const obsessionsSubtotal = getObsessionsSubtotal(answers)
  const compulsionsSubtotal = getCompulsionsSubtotal(answers)
  const totalScore = getYbocsTotal(answers)
  const severity = getYbocsSeverity(totalScore)

  const handleAnswer = (key: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    if (showResult) setShowResult(false)
  }

  const handleSubmit = async () => {
    setSaving(true)
    const responses = ybocsQuestions.map((q) => ({
      question_key: q.key,
      question_label: q.text,
      response_value: answers[q.key] ?? 0,
    }))
    const ok = await saveAssessmentToSupabase('ybocs', responses, {
      totalScore,
      obsessionsSubtotal,
      compulsionsSubtotal,
      severity: severity.label,
    })
    setSaving(false)
    if (ok) {
      localStorage.removeItem(YBOCS_DRAFT_KEY)
      setShowResult(true)
      setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
      toast.success('Avaliação Y-BOCS salva com sucesso!', {
        style: { background: '#00FFFF', color: '#0A192F', fontWeight: 600 },
      })
    } else {
      toast.error('Erro ao salvar avaliação.')
    }
  }

  const handleReset = () => {
    setAnswers({})
    setShowResult(false)
    localStorage.removeItem(YBOCS_DRAFT_KEY)
  }

  if (showResult) {
    return (
      <div ref={topRef} className="space-y-4 animate-fade-in-up">
        <div className="text-center py-4 rounded-xl border border-white/10" style={CARD_BG}>
          <span
            className="inline-block px-5 py-2 rounded-full text-base font-bold border"
            style={{
              backgroundColor: `${severity.color}25`,
              color: severity.color,
              borderColor: `${severity.color}50`,
            }}
          >
            {severity.label} — {totalScore}/40
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="text-center py-3 rounded-xl border border-white/10" style={CARD_BG}>
            <p className="text-2xl sm:text-3xl font-bold text-[#00FFFF]">{obsessionsSubtotal}</p>
            <p className="text-xs text-white/50 mt-0.5">Obsessões (0-20)</p>
          </div>
          <div className="text-center py-3 rounded-xl border border-white/10" style={CARD_BG}>
            <p className="text-2xl sm:text-3xl font-bold text-[#00FFFF]">{compulsionsSubtotal}</p>
            <p className="text-xs text-white/50 mt-0.5">Compulsões (0-20)</p>
          </div>
          <div className="text-center py-3 rounded-xl border border-white/10" style={CARD_BG}>
            <p className="text-2xl sm:text-3xl font-bold text-[#00FFFF]">{totalScore}</p>
            <p className="text-xs text-white/50 mt-0.5">Total (0-40)</p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#00FFFF]" /> Detalhamento por questão
          </h3>
          {ybocsQuestions.map((q, i) => (
            <div
              key={q.key}
              className="flex items-start justify-between gap-3 p-2.5 rounded-lg border border-white/10"
              style={CARD_BG}
            >
              <span className="text-xs text-white/60 flex-1">
                <span className="text-[#00FFFF] font-medium">{i + 1}.</span> {q.text}
              </span>
              <span className="text-xs font-medium text-[#00FFFF] whitespace-nowrap">
                {getYbocsOptionLabel(answers[q.key] ?? -1)}
              </span>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-xs text-yellow-400/80 italic">{YBOCS_DISCLAIMER}</p>
        </div>

        <Button
          onClick={handleReset}
          variant="outline"
          className="w-full border-white/20 text-white hover:bg-white/10"
        >
          <RotateCcw className="h-4 w-4 mr-2" /> Realizar Nova Avaliação
        </Button>
      </div>
    )
  }

  return (
    <div ref={topRef} className="space-y-4">
      <AssessmentProgress answered={answeredCount} total={10} />
      {ybocsSections.map((section) => {
        const sectionQuestions = ybocsQuestions.filter((q) => q.section === section.id)
        return (
          <div key={section.id} className="space-y-2">
            <div className="pt-2">
              <h2 className="text-sm font-bold text-[#00FFFF]">{section.title}</h2>
              <p className="text-xs text-white/50">{section.description}</p>
            </div>
            {sectionQuestions.map((q) => {
              const globalIndex = ybocsQuestions.indexOf(q) + 1
              return (
                <div
                  key={q.key}
                  className="p-4 rounded-xl border border-white/10 transition-colors hover:border-[#00FFFF]/20"
                  style={CARD_BG}
                >
                  <p className="text-white text-sm mb-3">
                    <span className="text-[#00FFFF] font-medium">{globalIndex}.</span> {q.text}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {ybocsOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleAnswer(q.key, opt.value)}
                        className={cn(
                          'px-3 py-2.5 rounded-lg text-xs font-medium transition-all border text-left',
                          answers[q.key] === opt.value
                            ? 'border-[#00FFFF] text-[#00FFFF]'
                            : 'border-white/10 text-white/60 hover:border-[#00FFFF]/30',
                        )}
                        style={
                          answers[q.key] === opt.value
                            ? { backgroundColor: 'rgba(0, 255, 255, 0.1)' }
                            : undefined
                        }
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
      <Button
        onClick={handleSubmit}
        disabled={answeredCount < 10 || saving}
        className="w-full bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Eye className="h-4 w-4 mr-2" />
        )}
        Enviar Avaliação
      </Button>
    </div>
  )
}
