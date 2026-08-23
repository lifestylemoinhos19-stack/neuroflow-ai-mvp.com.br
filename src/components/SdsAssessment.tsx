import { useState, useEffect, useRef } from 'react'
import { Loader2, Eye, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AssessmentProgress } from '@/components/AssessmentProgress'
import { SdsResult } from '@/components/SdsResult'
import { supabase } from '@/lib/supabase/client'
import {
  createAnamnesisSessionForGuest,
  saveAnamnesisResponses,
  completeAnamnesisSession,
} from '@/services/anamnesis'
import { sdsQuestions, sdsSections, getSdsTotalScore, getSherraTotalScore } from '@/lib/sds-data'
import { useGuestScale } from '@/contexts/guest-scale-context'
import { returnToMinhasEscalas } from '@/lib/assessment-redirect'

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
              : 'border-white/10 text-white/85 hover:bg-[rgba(0,255,255,0.08)] hover:border-[#00FFFF]/30',
          )}
        >
          {i}
        </button>
      ))}
    </div>
  )
}

export function SdsAssessment() {
  const guestId = useGuestScale()
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [showResult, setShowResult] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true
    const initSession = async () => {
      const session = await createAnamnesisSessionForGuest(guestId, 'SDS')
      if (mounted && session) setSessionId(session.id)
      if (mounted) setSessionLoading(false)
    }
    initSession()
    return () => {
      mounted = false
    }
  }, [guestId])

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
    if (!sessionId) {
      toast.error('Sessão não inicializada. Tente recarregar a página.')
      return
    }
    setSaving(true)
    const responses = sdsQuestions.map((q) => ({
      question_key: q.key,
      question_label: q.text,
      response_value: answers[q.key] ?? 0,
    }))
    const saved = await saveAnamnesisResponses(sessionId, responses)
    if (!saved) {
      setSaving(false)
      toast.error('Erro ao salvar respostas.')
      return
    }
    await completeAnamnesisSession(sessionId)

    if (guestId) {
      try {
        await supabase
          .from('scale_assignments')
          .update({
            session_id: sessionId,
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('guest_id', guestId)
          .eq('scale_type', 'SDS')
      } catch (err) {
        console.error('Erro ao atualizar scale_assignments (SDS):', err)
      }
    }

    setSaving(false)
    setShowResult(true)
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
    toast.success('Avaliação SDS salva com sucesso!', {
      style: { background: '#00FFFF', color: '#0A192F', fontWeight: 600 },
    })
  }

  const handleReset = async () => {
    setAnswers({})
    setShowResult(false)
    setSessionLoading(true)
    setSessionId(null)
    const session = await createAnamnesisSessionForGuest(guestId, 'SDS')
    if (session) setSessionId(session.id)
    setSessionLoading(false)
  }

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#00FFFF]" />
      </div>
    )
  }

  if (showResult) {
    return (
      <div ref={topRef} className="space-y-3">
        <SdsResult
          answers={answers}
          totalSds={totalSds}
          totalSherra={totalSherra}
          daysLost={daysLost}
          onReset={handleReset}
        />
        <Button
          onClick={() => returnToMinhasEscalas(guestId)}
          className="w-full bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-semibold"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Minhas Escalas
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
              <p className="text-xs text-white/75">{section.description}</p>
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
                  <p className="text-xs text-white/70 mt-1.5 flex justify-between">
                    <span>0 = Nada prejudicou</span>
                    <span>10 = Extremamente prejudicou</span>
                  </p>
                )}
                {q.max === 7 && (
                  <p className="text-xs text-white/70 mt-1.5 flex justify-between">
                    <span>0 = Nenhum dia</span>
                    <span>7 = Todos os dias</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )
      })}
      <Button
        onClick={handleSubmit}
        disabled={requiredAnswered < 3 || saving || !sessionId}
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
