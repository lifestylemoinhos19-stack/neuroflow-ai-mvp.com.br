import { useState, useEffect, useRef } from 'react'
import {
  Loader2,
  RotateCcw,
  Eye,
  FileText,
  ArrowLeft,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  PenTool,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { AssessmentProgress } from '@/components/AssessmentProgress'
import { supabase } from '@/lib/supabase/client'
import { useSpeech } from '@/hooks/use-speech'
import { DrawingCanvas } from '@/components/DrawingCanvas'
import {
  saveAnamnesisResponses,
  completeAnamnesisSession,
  createAnamnesisSessionForGuest,
} from '@/services/anamnesis'
import type { ExtraScale } from '@/lib/extra-scales-data'
import { useGuestScale } from '@/contexts/guest-scale-context'
import { returnToMinhasEscalas } from '@/lib/assessment-redirect'

const CARD_BG = { backgroundColor: 'rgba(17, 34, 64, 0.85)' }

// Imagens para nomeação no MEEM (Relógio e Caneta)
const MEEM_OBJECT_IMAGES: Record<string, { name: string; url: string }> = {
  meem_relogio: {
    name: 'Relógio de Pulso',
    url: 'https://img.usecurling.com/p/260/180?q=wristwatch%20clock&color=dark',
  },
  meem_caneta: {
    name: 'Caneta',
    url: 'https://img.usecurling.com/p/260/180?q=pen%20stationery&color=silver',
  },
}

export function GenericScaleAssessment({ scale }: { scale: ExtraScale }) {
  const guestId = useGuestScale()
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [patientTexts, setPatientTexts] = useState<Record<string, string>>({})
  const [drawings, setDrawings] = useState<Record<string, string>>({})
  const [showResult, setShowResult] = useState(false)
  const [saving, setSaving] = useState(false)
  const [speakingKey, setSpeakingKey] = useState<string | null>(null)
  const [activeListeningKey, setActiveListeningKey] = useState<string | null>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const draftKey = `neuroflow_${scale.key}_draft`

  const {
    speak,
    cancelSpeak,
    speaking,
    ttsSupported,
    sttSupported,
    startListening,
    stopListening,
    listening,
  } = useSpeech({
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

  const handleToggleMic = (key: string) => {
    if (listening && activeListeningKey === key) {
      stopListening()
      setActiveListeningKey(null)
    } else {
      setActiveListeningKey(key)
      startListening((text) => {
        setPatientTexts((prev) => ({
          ...prev,
          [key]: prev[key] ? `${prev[key]} ${text}`.trim() : text,
        }))
      })
    }
  }

  useEffect(() => {
    try {
      const draft = localStorage.getItem(draftKey)
      if (draft) {
        const parsed = JSON.parse(draft)
        setAnswers(parsed.answers || {})
        setPatientTexts(parsed.patientTexts || {})
        setDrawings(parsed.drawings || {})
      }
    } catch {
      /* ignore */
    }
  }, [draftKey])

  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify({ answers, patientTexts, drawings }))
    } catch {
      /* ignore */
    }
  }, [answers, patientTexts, drawings, draftKey])

  const totalItems = scale.items.length
  const answeredCount = Object.keys(answers).length
  const totalScore = Object.values(answers).reduce((sum, v) => sum + v, 0)
  const severity = scale.getSeverity(totalScore)

  const handleAnswer = (key: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    if (showResult) setShowResult(false)
  }

  const handleTextChange = (key: string, text: string) => {
    setPatientTexts((prev) => ({ ...prev, [key]: text }))
  }

  const handleDrawingChange = (key: string, dataUrl: string) => {
    setDrawings((prev) => ({ ...prev, [key]: dataUrl }))
  }

  const handleSubmit = async () => {
    setSaving(true)
    const responses = scale.items.map((q) => ({
      question_key: q.key,
      question_label: q.text,
      response_value: answers[q.key] ?? 0,
      metadata: {
        patient_text: patientTexts[q.key] ?? '',
        has_drawing: !!drawings[q.key],
      },
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
    setPatientTexts({})
    setDrawings({})
    setShowResult(false)
    localStorage.removeItem(draftKey)
  }

  const isMeem = scale.key === 'meem'
  const isCognitiveTriage = scale.key === 'cognitive-triage'

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
    <div ref={topRef} className="space-y-4">
      {/* Banner de interatividade total para MEEM / Triagem Cognitiva */}
      {(isMeem || isCognitiveTriage) && (
        <div className="p-4 rounded-xl border border-[#00FFFF]/20 bg-[#00FFFF]/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#00FFFF] shrink-0" />
            <p className="text-xs text-white/90">
              <strong>Aplicação 100% Interativa com IA:</strong> todas as etapas de desenho
              (polígonos e figuras), escrita de frases, nomeação e cálculo podem ser feitas na
              própria tela.
            </p>
          </div>
          {ttsSupported && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                if (speaking) cancelSpeak()
                else
                  speak(
                    `${scale.title}. Você pode ouvir as perguntas, falar suas respostas e desenhar ou escrever diretamente na tela.`,
                  )
              }}
              className="border-[#00FFFF]/40 text-[#00FFFF] hover:bg-[#00FFFF]/10 text-xs shrink-0"
            >
              {speaking ? (
                <VolumeX className="h-3.5 w-3.5 mr-1 text-red-400" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 mr-1" />
              )}
              {speaking ? 'Parar Áudio' : 'Ouvir Instruções'}
            </Button>
          )}
        </div>
      )}

      <AssessmentProgress answered={answeredCount} total={totalItems} />

      {scale.items.map((q, i) => {
        // Casos interativos específicos do MEEM
        const isMeemDrawing = q.key === 'meem_q10'
        const isMeemSentence = q.key === 'meem_q9'
        const isMeemNaming = q.key === 'meem_q6'
        const isMeemSerial7 = q.key === 'meem_q4'
        const isCtClock = q.key === 'ct_q13'
        const isCtPolygons = q.key === 'ct_q17'
        const isCtCube = q.key === 'ct_q19'
        const isCtSerial7 = q.key === 'ct_q7'

        return (
          <div
            key={q.key}
            className="p-4 sm:p-5 rounded-xl border border-white/10 transition-colors hover:border-[#00FFFF]/20 space-y-3"
            style={CARD_BG}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-white text-sm leading-relaxed">
                <span className="text-[#00FFFF] font-bold mr-1">{i + 1}.</span> {q.text}
              </p>
              <div className="flex items-center gap-1 shrink-0">
                {ttsSupported && (
                  <button
                    type="button"
                    onClick={() => handleToggleSpeak(q.key, `${i + 1}. ${q.text}`)}
                    className={cn(
                      'p-1.5 rounded-lg border transition-all text-xs flex items-center gap-1 cursor-pointer',
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
                {sttSupported && (
                  <button
                    type="button"
                    onClick={() => handleToggleMic(q.key)}
                    className={cn(
                      'p-1.5 rounded-lg border transition-all text-xs flex items-center gap-1 cursor-pointer',
                      listening && activeListeningKey === q.key
                        ? 'border-red-500 bg-red-500/20 text-red-400 animate-pulse'
                        : 'border-white/10 text-white/60 hover:text-[#00FFFF] hover:border-[#00FFFF]/30',
                    )}
                    title="Falar resposta via microfone"
                  >
                    {listening && activeListeningKey === q.key ? (
                      <MicOff className="h-3.5 w-3.5" />
                    ) : (
                      <Mic className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* MEEM: Desenho de Polígonos Sobrepostos */}
            {(isMeemDrawing || isCtPolygons) && (
              <DrawingCanvas
                title="Cópia de Polígonos Sobrepostos"
                instruction="Copie a figura de dois pentágonos entrelaçados no quadro abaixo:"
                referenceTemplate="polygons"
                initialValue={drawings[q.key]}
                onChange={(dataUrl) => handleDrawingChange(q.key, dataUrl)}
                height={240}
              />
            )}

            {/* Triagem Cognitiva: Desenho do Relógio */}
            {isCtClock && (
              <DrawingCanvas
                title="Desenho do Relógio"
                instruction="Desenhe um relógio com números e ponteiros marcando 11:10:"
                referenceTemplate="clock"
                initialValue={drawings[q.key]}
                onChange={(dataUrl) => handleDrawingChange(q.key, dataUrl)}
                height={260}
              />
            )}

            {/* Triagem Cognitiva: Cubo */}
            {isCtCube && (
              <DrawingCanvas
                title="Cópia do Cubo em Perspectiva"
                instruction="Copie o cubo tridimensional no quadro abaixo:"
                referenceTemplate="cube"
                initialValue={drawings[q.key]}
                onChange={(dataUrl) => handleDrawingChange(q.key, dataUrl)}
                height={240}
              />
            )}

            {/* MEEM: Escrita de Frase Espontânea */}
            {isMeemSentence && (
              <div className="p-3 rounded-lg border border-white/10 bg-white/5 space-y-2">
                <span className="text-xs text-white/80 font-medium block">
                  Digite ou fale uma frase completa (com sujeito e predicado com sentido):
                </span>
                <Textarea
                  placeholder="Escreva sua frase completa aqui..."
                  value={patientTexts[q.key] || ''}
                  onChange={(e) => handleTextChange(q.key, e.target.value)}
                  className="bg-slate-900 border-white/20 text-white text-sm min-h-[70px]"
                />
              </div>
            )}

            {/* MEEM: Nomeação de Objetos com Imagens Interativas */}
            {isMeemNaming && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border border-white/10 bg-white/5">
                <div className="space-y-1.5 flex flex-col items-center p-2 rounded bg-slate-900/60 border border-white/10">
                  <img
                    src={MEEM_OBJECT_IMAGES.meem_relogio.url}
                    alt="Objeto 1"
                    className="w-28 h-20 object-cover rounded border border-white/20"
                  />
                  <span className="text-xs text-white/80">Identifique o objeto acima</span>
                </div>
                <div className="space-y-1.5 flex flex-col items-center p-2 rounded bg-slate-900/60 border border-white/10">
                  <img
                    src={MEEM_OBJECT_IMAGES.meem_caneta.url}
                    alt="Objeto 2"
                    className="w-28 h-20 object-cover rounded border border-white/20"
                  />
                  <span className="text-xs text-white/80">Identifique o objeto acima</span>
                </div>
                <div className="sm:col-span-2">
                  <Input
                    placeholder="Resposta do paciente: ex: relógio e caneta..."
                    value={patientTexts[q.key] || ''}
                    onChange={(e) => handleTextChange(q.key, e.target.value)}
                    className="bg-slate-900 border-white/20 text-white text-xs"
                  />
                </div>
              </div>
            )}

            {/* MEEM & Triagem Cognitiva: Subtração Serial (100 - 7...) */}
            {(isMeemSerial7 || isCtSerial7) && (
              <div className="p-3 rounded-lg border border-white/10 bg-white/5 space-y-2">
                <p className="text-xs text-white/80">
                  Digite os 5 resultados da subtração consecutiva de 7 a partir de 100:
                </p>
                <Input
                  placeholder="Ex: 93, 86, 79, 72, 65"
                  value={patientTexts[q.key] || ''}
                  onChange={(e) => handleTextChange(q.key, e.target.value)}
                  className="bg-slate-900 border-white/20 text-white text-sm font-mono"
                />
              </div>
            )}

            {/* Campo auxiliar de resposta para escalas abertas ou modo points */}
            {scale.mode === 'points' &&
              !isMeemDrawing &&
              !isMeemSentence &&
              !isMeemNaming &&
              !isMeemSerial7 &&
              !isCtClock &&
              !isCtPolygons &&
              !isCtCube &&
              !isCtSerial7 && (
                <div className="space-y-1">
                  <Input
                    placeholder="Resposta falada ou digitada pelo paciente..."
                    value={patientTexts[q.key] || ''}
                    onChange={(e) => handleTextChange(q.key, e.target.value)}
                    className="bg-slate-900/60 border-white/10 text-white text-xs"
                  />
                </div>
              )}

            {/* Controle de Pontuação / Seleção de Alternativa */}
            {scale.mode === 'points' ? (
              <div className="pt-1">
                <span className="text-xs text-white/60 block mb-1">
                  Pontos (0 a {q.maxScore ?? 1}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: (q.maxScore ?? 1) + 1 }, (_, n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleAnswer(q.key, n)}
                      className={cn(
                        'h-8 w-8 rounded-lg text-xs font-bold transition-all border',
                        answers[q.key] === n
                          ? 'bg-[#00FFFF] border-[#00FFFF] text-[#0A192F] shadow-[0_0_10px_rgba(0,255,255,0.4)]'
                          : 'border-white/10 text-white/85 hover:bg-[rgba(0,255,255,0.08)] hover:border-[#00FFFF]/30',
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  'grid gap-2',
                  (q.options || scale.options) &&
                    (q.options || scale.options)!.some((o) => o.label.length > 20)
                    ? 'grid-cols-1'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
                )}
              >
                {(q.options || scale.options)!.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleAnswer(q.key, opt.value)}
                    className={cn(
                      'px-3 py-2.5 rounded-lg text-xs font-medium transition-all border text-left sm:text-center',
                      answers[q.key] === opt.value
                        ? 'bg-[rgba(0,255,255,0.18)] border-[#00FFFF] text-[#00FFFF] shadow-[0_0_10px_rgba(0,255,255,0.25)]'
                        : 'border-white/10 text-white/85 hover:bg-[rgba(0,255,255,0.08)] hover:border-[#00FFFF]/30',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
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
        Gerar Resultados de {scale.title}
      </Button>
    </div>
  )
}
