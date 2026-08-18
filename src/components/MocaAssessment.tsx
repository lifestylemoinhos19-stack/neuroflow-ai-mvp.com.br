import { useState, useEffect, useRef } from 'react'
import { Loader2, RotateCcw, Eye, FileText, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AssessmentProgress } from '@/components/AssessmentProgress'
import { saveDementiaAssessment } from '@/services/dementia-assessments'
import {
  mocaItems,
  mocaDomains,
  getMocaTotal,
  getMocaDomainScore,
  getMocaSeverity,
  MOCA_DRAFT_KEY,
  MOCA_DISCLAIMER,
} from '@/lib/moca-data'
import { useGuestScale } from '@/contexts/guest-scale-context'
import { returnToMinhasEscalas } from '@/lib/assessment-redirect'

const CARD_BG = { backgroundColor: 'rgba(17, 34, 64, 0.85)' }

function ScoreInput({
  max,
  value,
  onSelect,
}: {
  max: number
  value: number
  onSelect: (v: number) => void
}) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: max + 1 }, (_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={cn(
            'h-8 w-8 rounded-lg text-xs font-bold transition-all border',
            value === i
              ? 'bg-[#00FFFF] border-[#00FFFF] text-[#0A192F]'
              : 'border-white/10 text-white/85 hover:bg-[rgba(0,255,255,0.08)]',
          )}
        >
          {i}
        </button>
      ))}
    </div>
  )
}

export function MocaAssessment() {
  const guestId = useGuestScale()
  const [scores, setScores] = useState<Record<string, number>>({})
  const [showResult, setShowResult] = useState(false)
  const [saving, setSaving] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const draft = localStorage.getItem(MOCA_DRAFT_KEY)
      if (draft) setScores(JSON.parse(draft).scores || {})
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(MOCA_DRAFT_KEY, JSON.stringify({ scores }))
    } catch {
      /* ignore */
    }
  }, [scores])

  const totalScore = getMocaTotal(scores)
  const severity = getMocaSeverity(totalScore)
  const answeredCount = Object.keys(scores).length

  const handleScore = (key: string, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }))
    if (showResult) setShowResult(false)
  }

  const handleSubmit = async () => {
    setSaving(true)
    const responses = mocaItems.map((item) => ({
      question_key: item.key,
      question_label: item.text,
      response_value: scores[item.key] ?? 0,
    }))
    const ok = await saveDementiaAssessment('moca', responses, totalScore, guestId)
    setSaving(false)
    if (ok) {
      localStorage.removeItem(MOCA_DRAFT_KEY)
      setShowResult(true)
      setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
      toast.success('Avaliação MoCA salva com sucesso!', {
        style: { background: '#00FFFF', color: '#0A192F', fontWeight: 600 },
      })
    } else {
      toast.error('Erro ao salvar avaliação.')
    }
  }

  const handleReset = () => {
    setScores({})
    setShowResult(false)
    localStorage.removeItem(MOCA_DRAFT_KEY)
  }

  if (showResult) {
    return (
      <div ref={topRef} className="space-y-4 animate-fade-in-up">
        <div className="text-center py-4 rounded-xl border border-white/10" style={CARD_BG}>
          <p className="text-4xl font-bold" style={{ color: severity.color }}>
            {totalScore}
          </p>
          <p className="text-sm text-white/75 mt-1">Pontuação total (0-30)</p>
          <p className="text-lg font-semibold mt-2" style={{ color: severity.color }}>
            {severity.label}
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#00FFFF]" /> Pontuação por domínio
          </h3>
          {mocaDomains
            .filter((d) => d.id !== 'memory')
            .map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-white/10"
                style={CARD_BG}
              >
                <span className="text-xs text-white/85">{d.title}</span>
                <span className="text-xs font-medium text-[#00FFFF]">
                  {getMocaDomainScore(d.id, scores)}/{d.maxScore}
                </span>
              </div>
            ))}
        </div>
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-xs text-yellow-400/80 italic">{MOCA_DISCLAIMER}</p>
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
      <AssessmentProgress answered={answeredCount} total={mocaItems.length} />
      {mocaDomains.map((domain) => {
        const domainItems = mocaItems.filter((i) => i.domain === domain.id)
        return (
          <div key={domain.id} className="space-y-2">
            <div className="pt-2">
              <h2 className="text-sm font-bold text-[#00FFFF]">{domain.title}</h2>
              <p className="text-xs text-white/75">{domain.description}</p>
            </div>
            {domainItems.map((item) => (
              <div
                key={item.key}
                className="p-4 rounded-xl border border-white/10 transition-colors hover:border-[#00FFFF]/20"
                style={CARD_BG}
              >
                <p className="text-white text-sm mb-3">
                  <span className="text-[#00FFFF] font-medium">{item.label}.</span> {item.text}
                  {!item.scored && (
                    <span className="text-white/70 text-xs ml-2">(não pontuado)</span>
                  )}
                </p>
                <ScoreInput
                  max={item.maxScore}
                  value={scores[item.key] ?? -1}
                  onSelect={(v) => handleScore(item.key, v)}
                />
              </div>
            ))}
          </div>
        )
      })}
      <Button
        onClick={handleSubmit}
        disabled={answeredCount < mocaItems.length || saving}
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
