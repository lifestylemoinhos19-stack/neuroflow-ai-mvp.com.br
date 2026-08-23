import { useState, useEffect, useRef } from 'react'
import {
  Loader2,
  RotateCcw,
  Eye,
  FileText,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AssessmentProgress } from '@/components/AssessmentProgress'
import { supabase } from '@/lib/supabase/client'
import {
  createAnamnesisSessionForGuest,
  saveAnamnesisResponses,
  completeAnamnesisSession,
} from '@/services/anamnesis'
import {
  ageRanges,
  milestoneItems,
  milestoneOptions,
  DOMAIN_LABELS,
  calculateMilestonesResult,
  getMilestoneOptionLabel,
  MILESTONES_DRAFT_KEY,
  MILESTONES_DISCLAIMER,
} from '@/lib/milestones-data'
import { useGuestScale } from '@/contexts/guest-scale-context'
import { returnToMinhasEscalas } from '@/lib/assessment-redirect'

const CARD_BG = { backgroundColor: 'rgba(17, 34, 64, 0.85)' }

export function MarcosDesenvolvimentoAssessment() {
  const guestId = useGuestScale()
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [showResult, setShowResult] = useState(false)
  const [saving, setSaving] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const draft = localStorage.getItem(MILESTONES_DRAFT_KEY)
      if (draft) setAnswers(JSON.parse(draft).answers || {})
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(MILESTONES_DRAFT_KEY, JSON.stringify({ answers }))
    } catch {
      /* ignore */
    }
  }, [answers])

  const totalItems = milestoneItems.length
  const answeredCount = Object.keys(answers).length
  const result = calculateMilestonesResult(answers)

  const handleAnswer = (key: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    if (showResult) setShowResult(false)
  }

  const handleSubmit = async () => {
    setSaving(true)
    const responses = milestoneItems.map((q) => ({
      question_key: q.key,
      question_label: q.text,
      response_value: answers[q.key] ?? 0,
    }))

    // Cria a sessão (autenticada ou anon via guest) e salva respostas.
    const session = await createAnamnesisSessionForGuest(guestId, 'MARCOS')
    if (!session) {
      setSaving(false)
      toast.error('Não foi possível criar a sessão. Verifique sua identificação.')
      return
    }
    const saved = await saveAnamnesisResponses(session.id, responses)
    if (!saved) {
      setSaving(false)
      toast.error('Erro ao salvar respostas.')
      return
    }
    await completeAnamnesisSession(session.id)

    // Atualiza o scale_assignments correspondente com o session_id gerado
    try {
      let updated = false
      if (guestId) {
        const { data: updatedRows, error: updateError } = await supabase
          .from('scale_assignments')
          .update({
            session_id: session.id,
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('guest_id', guestId)
          .eq('scale_type', 'MARCOS')
          .select('id')

        if (!updateError && updatedRows && updatedRows.length > 0) {
          updated = true
        } else if (updateError) {
          console.warn('Tentativa com guest_id em scale_assignments (MARCOS) falhou:', updateError)
        }
      }

      // Fallback: se não atualizou (guestId null ou 0 linhas afetadas), tenta sem guest_id
      if (!updated) {
        const { data: pendingRows } = await supabase
          .from('scale_assignments')
          .select('id')
          .eq('scale_type', 'MARCOS')
          .eq('status', 'pending')
          .is('session_id', null)
          .order('created_at', { ascending: false })
          .limit(1)

        if (pendingRows && pendingRows.length > 0) {
          await supabase
            .from('scale_assignments')
            .update({
              session_id: session.id,
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', pendingRows[0].id)
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar scale_assignments (MARCOS):', err)
    }

    setSaving(false)
    localStorage.removeItem(MILESTONES_DRAFT_KEY)
    setShowResult(true)
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
    toast.success('Avaliação de Marcos do Desenvolvimento salva com sucesso!', {
      style: { background: '#00FFFF', color: '#0A192F', fontWeight: 600 },
    })
  }

  const handleReset = () => {
    setAnswers({})
    setShowResult(false)
    localStorage.removeItem(MILESTONES_DRAFT_KEY)
  }

  if (showResult) {
    const hasDelay = result.delayedAreas.length > 0
    return (
      <div ref={topRef} className="space-y-4 animate-fade-in-up">
        <div className="text-center py-4 rounded-xl border border-white/10" style={CARD_BG}>
          <p className="text-4xl font-bold" style={{ color: hasDelay ? '#f97316' : '#22c55e' }}>
            {result.overallPercentage}%
          </p>
          <p className="text-sm text-white/75 mt-1">
            Marcos atingidos ({result.totalScore}/{result.maxScore} pontos)
          </p>
          <p
            className="text-lg font-semibold mt-2"
            style={{ color: hasDelay ? '#f97316' : '#22c55e' }}
          >
            {hasDelay
              ? 'Atraso sinalizado em uma ou mais áreas'
              : 'Desenvolvimento dentro do esperado'}
          </p>
        </div>

        {hasDelay && (
          <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-bold">Áreas com sinalização de atraso</p>
            </div>
            <p className="text-sm text-white/80 mt-2">{result.delayedAreas.join(' • ')}</p>
            <p className="text-xs text-white/70 mt-2">
              Porcentagem abaixo de 70% sugere investigação complementar do desenvolvimento.
            </p>
          </div>
        )}

        {/* Por domínio */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#00FFFF]" /> Resultado por domínio
          </h3>
          {result.byDomain.map((d) => (
            <div
              key={d.domain}
              className="flex items-center justify-between p-2.5 rounded-lg border border-white/10"
              style={CARD_BG}
            >
              <span className="text-xs text-white/85 flex items-center gap-2">
                {d.delayed ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                )}
                {DOMAIN_LABELS[d.domain]}
              </span>
              <span
                className="text-xs font-medium whitespace-nowrap"
                style={{ color: d.delayed ? '#f97316' : '#22c55e' }}
              >
                {d.reached}/{d.total} ({d.percentage}%)
              </span>
            </div>
          ))}
        </div>

        {/* Por faixa etária */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#00FFFF]" /> Resultado por faixa etária
          </h3>
          {result.byAgeRange
            .filter((a) => a.total > 0)
            .map((a) => (
              <div
                key={a.ageRangeId}
                className="flex items-center justify-between p-2.5 rounded-lg border border-white/10"
                style={CARD_BG}
              >
                <span className="text-xs text-white/85 flex items-center gap-2">
                  {a.delayed ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                  {a.label}
                </span>
                <span
                  className="text-xs font-medium whitespace-nowrap"
                  style={{ color: a.delayed ? '#f97316' : '#22c55e' }}
                >
                  {a.reached}/{a.total} ({a.percentage}%)
                </span>
              </div>
            ))}
        </div>

        {/* Detalhamento por questão */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#00FFFF]" /> Detalhamento por questão
          </h3>
          {milestoneItems.map((q, i) => (
            <div
              key={q.key}
              className="flex items-start justify-between gap-3 p-2.5 rounded-lg border border-white/10"
              style={CARD_BG}
            >
              <span className="text-xs text-white/85 flex-1">
                <span className="text-[#00FFFF] font-medium">{i + 1}.</span> {q.text}
              </span>
              <span className="text-xs font-medium text-[#00FFFF] whitespace-nowrap">
                {getMilestoneOptionLabel(answers[q.key])}
              </span>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-xs text-yellow-400/80 italic">{MILESTONES_DISCLAIMER}</p>
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
      <AssessmentProgress answered={answeredCount} total={totalItems} />
      {ageRanges.map((ar) => {
        const items = milestoneItems.filter((i) => i.ageRangeId === ar.id)
        return (
          <div key={ar.id} className="space-y-2">
            <div className="pt-2">
              <h2 className="text-sm font-bold text-[#00FFFF]">{ar.label}</h2>
              <p className="text-xs text-white/75">{ar.description}</p>
            </div>
            {items.map((item) => (
              <div
                key={item.key}
                className="p-4 rounded-xl border border-white/10 transition-colors hover:border-[#00FFFF]/20"
                style={CARD_BG}
              >
                <p className="text-white text-sm mb-3">
                  <span className="text-[#00FFFF] font-medium capitalize">
                    {DOMAIN_LABELS[item.domain]}.
                  </span>{' '}
                  {item.text}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {milestoneOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(item.key, opt.value)}
                      className={cn(
                        'px-3 py-2.5 rounded-lg text-xs font-medium transition-all border text-center',
                        answers[item.key] === opt.value
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
          </div>
        )
      })}
      <Button
        onClick={handleSubmit}
        disabled={answeredCount < totalItems || saving}
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
