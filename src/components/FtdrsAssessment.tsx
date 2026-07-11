import { useState, useEffect, useRef } from 'react'
import { Loader2, RotateCcw, Eye, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AssessmentProgress } from '@/components/AssessmentProgress'
import { saveDementiaAssessment } from '@/services/dementia-assessments'
import {
  ftdrsItems,
  ftdrsDomains,
  ftdrsOptions,
  getFtdrsTotal,
  getFtdrsSeverity,
  getFtdrsOptionLabel,
  FTDRS_DRAFT_KEY,
  FTDRS_DISCLAIMER,
} from '@/lib/ftdrs-data'

const CARD_BG = { backgroundColor: 'rgba(17, 34, 64, 0.85)' }

export function FtdrsAssessment() {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [showResult, setShowResult] = useState(false)
  const [saving, setSaving] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const draft = localStorage.getItem(FTDRS_DRAFT_KEY)
      if (draft) setAnswers(JSON.parse(draft).answers || {})
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(FTDRS_DRAFT_KEY, JSON.stringify({ answers }))
    } catch {
      /* ignore */
    }
  }, [answers])

  const answeredCount = Object.keys(answers).length
  const totalScore = getFtdrsTotal(answers)
  const severity = getFtdrsSeverity(totalScore)

  const handleAnswer = (key: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    if (showResult) setShowResult(false)
  }

  const handleSubmit = async () => {
    setSaving(true)
    const responses = ftdrsItems.map((item) => ({
      question_key: item.key,
      question_label: item.text,
      response_value: answers[item.key] ?? 0,
    }))
    const ok = await saveDementiaAssessment('ftdrs', responses, totalScore)
    setSaving(false)
    if (ok) {
      localStorage.removeItem(FTDRS_DRAFT_KEY)
      setShowResult(true)
      setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
      toast.success('Avaliação FTDRS salva com sucesso!', {
        style: { background: '#00FFFF', color: '#0A192F', fontWeight: 600 },
      })
    } else {
      toast.error('Erro ao salvar avaliação.')
    }
  }

  const handleReset = () => {
    setAnswers({})
    setShowResult(false)
    localStorage.removeItem(FTDRS_DRAFT_KEY)
  }

  if (showResult) {
    return (
      <div ref={topRef} className="space-y-4 animate-fade-in-up">
        <div className="text-center py-4 rounded-xl border border-white/10" style={CARD_BG}>
          <p className="text-4xl font-bold" style={{ color: severity.color }}>
            {totalScore}
          </p>
          <p className="text-sm text-white/50 mt-1">Pontuação total (0-45)</p>
          <p className="text-lg font-semibold mt-2" style={{ color: severity.color }}>
            {severity.label}
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#00FFFF]" /> Detalhamento por questão
          </h3>
          {ftdrsItems.map((item, i) => (
            <div
              key={item.key}
              className="flex items-start justify-between gap-3 p-2.5 rounded-lg border border-white/10"
              style={CARD_BG}
            >
              <span className="text-xs text-white/60 flex-1">
                <span className="text-[#00FFFF] font-medium">{i + 1}.</span> {item.text}
              </span>
              <span className="text-xs font-medium text-[#00FFFF] whitespace-nowrap">
                {getFtdrsOptionLabel(answers[item.key] ?? -1)}
              </span>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-xs text-yellow-400/80 italic">{FTDRS_DISCLAIMER}</p>
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
      <AssessmentProgress answered={answeredCount} total={ftdrsItems.length} />
      {ftdrsDomains.map((domain) => {
        const domainItems = ftdrsItems.filter((i) => i.domain === domain.id)
        return (
          <div key={domain.id} className="space-y-2">
            <div className="pt-2">
              <h2 className="text-sm font-bold text-[#00FFFF]">{domain.title}</h2>
              <p className="text-xs text-white/50">{domain.description}</p>
            </div>
            {domainItems.map((item) => (
              <div
                key={item.key}
                className="p-4 rounded-xl border border-white/10 transition-colors hover:border-[#00FFFF]/20"
                style={CARD_BG}
              >
                <p className="text-white text-sm mb-3">
                  <span className="text-[#00FFFF] font-medium">{item.label}.</span> {item.text}
                </p>
                <div className="flex flex-col gap-1.5">
                  {ftdrsOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(item.key, opt.value)}
                      className={cn(
                        'px-3 py-2.5 rounded-lg text-xs font-medium transition-all border text-left',
                        answers[item.key] === opt.value
                          ? 'border-[#00FFFF] text-[#00FFFF]'
                          : 'border-white/10 text-white/60 hover:border-[#00FFFF]/30',
                      )}
                      style={
                        answers[item.key] === opt.value
                          ? { backgroundColor: 'rgba(0, 255, 255, 0.1)' }
                          : undefined
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      })}
      <Button
        onClick={handleSubmit}
        disabled={answeredCount < ftdrsItems.length || saving}
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
