import { useState, useEffect, useRef } from 'react'
import { Loader2, RotateCcw, Eye, FileText, ArrowLeft, Volume2, VolumeX } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AssessmentProgress } from '@/components/AssessmentProgress'
import { supabase } from '@/lib/supabase/client'
import { useSpeech } from '@/hooks/use-speech'
import {
  saveAnamnesisResponses,
  completeAnamnesisSession,
  createAnamnesisSessionForGuest,
} from '@/services/anamnesis'
import type { ExtraScale } from '@/lib/extra-scales-data'
import { useGuestScale } from '@/contexts/guest-scale-context'
import { returnToMinhasEscalas } from '@/lib/assessment-redirect'

const CARD_BG = { backgroundColor: 'rgba(17, 34, 64, 0.85)' }

/**
 * Componente genérico que renderiza escalas baseadas em Likert (0..N opções)
 * ou em pontuação por item (modo "points", semelhante ao MoCA). Usado para
 * as escalas sem componente dedicado: HAM-D, HAM-A, ASRS-18, MEEM.
 */
export function GenericScaleAssessment({ scale }: { scale: ExtraScale }) {
  const guestId = useGuestScale()
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [showResult, setShowResult] = useState(false)
  const [saving, setSaving] = useState(false)
  const [speakingKey, setSpeakingKey] = useState<string | null>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const draftKey = `neuroflow_${scale.key}_draft`

  const { speak, cancelSpeak, speaking, ttsSupported } = useSpeech({
    lang: 'pt-BR',
  })

  const handleToggleSpeak = (key: string, text: string) => {
    if (speaking && speakingKey === key) {
      cancelSpeak()
      setSpeakingKey(null)
    } else {
      setSpeakingKey(key)
      speak(text)
    }
  }

  useEffect(() => {
    try {
      const draft = localStorage.getItem(draftKey)
      if (draft) setAnswers(JSON.parse(draft).answers || {})
    } catch {
      /* ignore */
    }
  }, [draftKey])

  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify({ answers }))
    } catch {
      /* ignore */
    }
  }, [answers, draftKey])

  const totalItems = scale.items.length
  const answeredCount = Object.keys(answers).length
  const totalScore = Object.values(answers).reduce((sum, v) => sum + v, 0)
  const severity = scale.getSeverity(totalScore)

  const handleAnswer = (key: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    if (showResult) setShowResult(false)
  }

  const handleSubmit = async () => {
    setSaving(true)
    const responses = scale.items.map((q) => ({
      question_key: q.key,
      question_label: q.text,
      response_value: answers[q.key] ?? 0,
    }))

    // Cria a sessão (autenticada ou anon via guest) e salva respostas.
    const session = await createAnamnesisSessionForGuest(guestId, scale.title)
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
          .eq('scale_type', scale.title)
          .select('id')

        if (!updateError && updatedRows && updatedRows.length > 0) {
          updated = true
        } else if (updateError) {
          console.warn('Tentativa com guest_id em scale_assignments falhou:', updateError)
        }
      }

      // Fallback: se não atualizou (guestId null ou 0 linhas afetadas), tenta sem guest_id
      if (!updated) {
        const { data: pendingRows } = await supabase
          .from('scale_assignments')
          .select('id')
          .eq('scale_type', scale.title)
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
      console.error('Erro ao atualizar scale_assignments:', err)
    }

    setSaving(false)
    localStorage.removeItem(draftKey)
    setShowResult(true)
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
    toast.success(`${scale.title} salva com sucesso!`, {
      style: { background: '#00FFFF', color: '#0A192F', fontWeight: 600 },
    })
  }

  const handleReset = () => {
    setAnswers({})
    setShowResult(false)
    localStorage.removeItem(draftKey)
  }

  if (showResult) {
    return (
      <div ref={topRef} className="space-y-4 animate-fade-in-up">
        <div className="text-center py-4 rounded-xl border border-white/10" style={CARD_BG}>
          <p className="text-4xl font-bold" style={{ color: severity.color }}>
            {totalScore}
          </p>
          <p className="text-sm text-white/75 mt-1">Pontuação total (0-{scale.maxTotal})</p>
          <p className="text-lg font-semibold mt-2" style={{ color: severity.color }}>
            {severity.label}
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#00FFFF]" /> Detalhamento por questão
          </h3>
          {scale.items.map((q, i) => (
            <div
              key={q.key}
              className="flex items-start justify-between gap-3 p-2.5 rounded-lg border border-white/10"
              style={CARD_BG}
            >
              <span className="text-xs text-white/85 flex-1">
                <span className="text-[#00FFFF] font-medium">{i + 1}.</span> {q.text}
              </span>
              <span className="text-xs font-medium text-[#00FFFF] whitespace-nowrap">
                {answers[q.key] ?? 0}
              </span>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-xs text-yellow-400/80 italic">{scale.disclaimer}</p>
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
      {scale.items.map((q, i) => (
        <div
          key={q.key}
          className="p-4 rounded-xl border border-white/10 transition-colors hover:border-[#00FFFF]/20"
          style={CARD_BG}
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <p className="text-white text-sm">
              <span className="text-[#00FFFF] font-medium">{i + 1}.</span> {q.text}
            </p>
            {ttsSupported && (
              <button
                type="button"
                onClick={() => handleToggleSpeak(q.key, `${i + 1}. ${q.text}`)}
                className={cn(
                  'shrink-0 p-1.5 rounded-lg border transition-all text-xs flex items-center gap-1 cursor-pointer',
                  speaking && speakingKey === q.key
                    ? 'border-[#00FFFF] bg-[#00FFFF]/20 text-[#00FFFF]'
                    : 'border-white/10 text-white/60 hover:text-[#00FFFF] hover:border-[#00FFFF]/30',
                )}
                title="Ouvir questão"
              >
                {speaking && speakingKey === q.key ? (
                  <VolumeX className="h-3.5 w-3.5 text-[#00FFFF]" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
          {scale.mode === 'points' ? (
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: (q.maxScore ?? 1) + 1 }, (_, n) => (
                <button
                  key={n}
                  onClick={() => handleAnswer(q.key, n)}
                  className={cn(
                    'h-8 w-8 rounded-lg text-xs font-bold transition-all border',
                    answers[q.key] === n
                      ? 'bg-[#00FFFF] border-[#00FFFF] text-[#0A192F]'
                      : 'border-white/10 text-white/85 hover:bg-[rgba(0,255,255,0.08)]',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {scale.options!.map((opt) => (
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
          )}
        </div>
      ))}
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
