import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Loader2, CheckCircle2, RotateCcw, Brain, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import {
  gad7Questions,
  likertScaleLabels,
  getGad7Severity,
  gad7SeverityLabels,
  type Gad7Severity,
} from '@/lib/phq9-gad7-data'
import { CLINIC_BRANDING } from '@/lib/clinic-branding'
import { cn } from '@/lib/utils'
import { useGuestScale } from '@/contexts/guest-scale-context'
import {
  createAnamnesisSessionForGuest,
  saveAnamnesisResponses,
  completeAnamnesisSession,
} from '@/services/anamnesis'
import { returnToMinhasEscalas } from '@/lib/assessment-redirect'

const severityStyles: Record<Gad7Severity, { badge: string; bar: string }> = {
  minimal: { badge: 'bg-emerald-500/20 text-emerald-300', bar: 'bg-emerald-400' },
  mild: { badge: 'bg-yellow-500/20 text-yellow-300', bar: 'bg-yellow-400' },
  moderate: { badge: 'bg-orange-500/20 text-orange-300', bar: 'bg-orange-400' },
  severe: { badge: 'bg-red-500/20 text-red-300', bar: 'bg-red-400' },
}

export function Gad7Assessment() {
  const location = useLocation()
  const guestId = useGuestScale()
  const passedSessionId = (location.state as { sessionId?: string } | null)?.sessionId
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ score: number; severity: Gad7Severity } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const allAnswered = gad7Questions.every((q) => answers[q.id] !== undefined)

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const ensureSession = async (): Promise<string | null> => {
    if (passedSessionId) return passedSessionId
    // Fluxo público (guest): cria uma sessão anon vinculada ao guest_id.
    if (guestId) {
      const session = await createAnamnesisSessionForGuest(guestId, 'GAD-7')
      return session?.id ?? null
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error: err } = await supabase
      .from('anamnesis_sessions')
      .insert({
        user_id: user.id,
        profile_id: user.id,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        metadata: { scale_key: 'gad7', scale_name: 'GAD-7', source: 'gad7_page' },
      })
      .select()
      .single()
    if (err) return null
    return data.id
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const sessionId = await ensureSession()
      if (!sessionId) {
        setError('Não foi possível criar a sessão. Verifique sua autenticação.')
        setSubmitting(false)
        return
      }

      const totalScore = Object.values(answers).reduce((sum, v) => sum + v, 0)
      const responses = gad7Questions.map((q) => ({
        session_id: sessionId,
        question_key: q.key,
        question_label: q.question,
        response_value: answers[q.id],
      }))

      const { error: respError } = await supabase.from('anamnesis_responses').insert(responses)
      if (respError) throw respError

      await supabase
        .from('anamnesis_sessions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', sessionId)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      // clinical_feedback é gravada apenas quando há médico/usuário autenticado;
      // no fluxo público (guest), as respostas já estão persistidas na sessão.
      if (user) {
        await supabase.from('clinical_feedback').insert({
          session_id: sessionId,
          gad7_score: totalScore,
          doctor_id: user.id,
          system_suggestion: gad7SeverityLabels[getGad7Severity(totalScore)],
          global_severity: getGad7Severity(totalScore),
        })
      } else {
        await completeAnamnesisSession(sessionId)
      }

      // Atualiza o scale_assignments correspondente com o session_id gerado
      try {
        let updated = false
        if (guestId) {
          const { data: updatedRows, error: updateError } = await supabase
            .from('scale_assignments')
            .update({
              session_id: sessionId,
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('guest_id', guestId)
            .eq('scale_type', 'GAD-7')
            .select('id')

          if (!updateError && updatedRows && updatedRows.length > 0) {
            updated = true
          } else if (updateError) {
            console.warn('Tentativa com guest_id em scale_assignments (GAD-7) falhou:', updateError)
          }
        }

        // Fallback: se não atualizou (guestId null ou 0 linhas afetadas), tenta sem guest_id
        if (!updated) {
          const { data: pendingRows } = await supabase
            .from('scale_assignments')
            .select('id')
            .eq('scale_type', 'GAD-7')
            .eq('status', 'pending')
            .is('session_id', null)
            .order('created_at', { ascending: false })
            .limit(1)

          if (pendingRows && pendingRows.length > 0) {
            await supabase
              .from('scale_assignments')
              .update({
                session_id: sessionId,
                status: 'completed',
                completed_at: new Date().toISOString(),
              })
              .eq('id', pendingRows[0].id)
          }
        }
      } catch (err) {
        console.error('Erro ao atualizar scale_assignments (GAD-7):', err)
      }

      setResult({ score: totalScore, severity: getGad7Severity(totalScore) })
    } catch {
      setError('Erro ao salvar respostas. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRestart = () => {
    setAnswers({})
    setResult(null)
    setError(null)
  }

  if (result) {
    const style = severityStyles[result.severity]
    return (
      <Card className="border-white/10 bg-white/5">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-cyan-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Avaliação Concluída</h2>
              <p className="text-sm text-white/75">GAD-7 — Generalized Anxiety Disorder 7-item</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-white">{result.score}</div>
            <div className={cn('px-3 py-1 rounded-full text-sm font-medium', style.badge)}>
              {gad7SeverityLabels[result.severity]}
            </div>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', style.bar)}
              style={{ width: `${(result.score / 21) * 100}%` }}
            />
          </div>
          <p className="text-xs text-white/70 pt-2">
            {CLINIC_BRANDING.name} — Esta ferramenta é apenas para triagem e não substitui avaliação
            clínica.
          </p>
          {!guestId && (
            <Button
              onClick={() => returnToMinhasEscalas(guestId)}
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-semibold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Minhas Escalas
            </Button>
          )}
          {guestId && (
            <p className="text-xs text-white/60 text-center">Voltando para suas escalas...</p>
          )}
          <Button
            onClick={handleRestart}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Nova Avaliação
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-white/10 bg-white/5">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-white/10">
          <Brain className="h-5 w-5 text-cyan-400" />
          <span className="text-sm text-white/85">{CLINIC_BRANDING.name}</span>
        </div>
        <p className="text-sm text-white/75">
          Nas últimas 2 semanas, com que frequência você foi incomodado pelos seguintes problemas?
        </p>
        {gad7Questions.map((q, idx) => (
          <div key={q.id} className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs text-cyan-400/80 font-mono mt-0.5">{idx + 1}.</span>
              <Label className="text-sm text-white/80 leading-relaxed">{q.question}</Label>
            </div>
            <RadioGroup
              value={answers[q.id]?.toString() ?? ''}
              onValueChange={(v) => handleAnswer(q.id, parseInt(v))}
              className="flex flex-wrap gap-3"
            >
              {likertScaleLabels.map((opt) => (
                <div key={opt.value} className="flex items-center gap-1.5">
                  <RadioGroupItem value={opt.value.toString()} id={`gad7-${q.id}-${opt.value}`} />
                  <Label
                    htmlFor={`gad7-${q.id}-${opt.value}`}
                    className="text-xs text-white/85 cursor-pointer"
                  >
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          className="w-full bg-cyan-400 text-[#0A192F] hover:bg-cyan-400/90 disabled:opacity-40"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            'Enviar Avaliação'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
