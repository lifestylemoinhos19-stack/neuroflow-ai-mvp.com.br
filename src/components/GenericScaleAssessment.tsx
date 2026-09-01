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

// Imagens para nomeação no MEEM (Relógio e Caneta) em alta resolução
const MEEM_OBJECT_IMAGES: Record<string, { name: string; url: string; prompt: string }> = {
  meem_relogio: {
    name: 'Relógio de Pulso',
    url: 'https://img.usecurling.com/p/320/220?q=wristwatch%20watch&color=metallic',
    prompt: 'Mostre o relógio ao paciente e peça para nomear o objeto.',
  },
  meem_caneta: {
    name: 'Caneta Esferográfica',
    url: 'https://img.usecurling.com/p/320/220?q=ballpoint%20pen&color=blue',
    prompt: 'Mostre a caneta ao paciente e peça para nomear o objeto.',
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
        const isMeemReading = q.key === 'meem_q8' // Texto para leitura e execução: "FECHE OS OLHOS"
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

            {/* MEEM: Leitura em voz alta e execução do comando */}
            {isMeemReading && (
              <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 space-y-3">
                <span className="text-xs font-semibold text-yellow-300 uppercase tracking-wider block">
                  Texto para leitura em voz alta pelo paciente:
                </span>
                <div className="p-4 rounded-xl bg-slate-950/80 border-2 border-yellow-400/50 text-center shadow-lg">
                  <span className="text-2xl sm:text-3xl font-black text-yellow-300 tracking-wider">
                    FECHE OS SEUS OLHOS
                  </span>
                </div>
                <p className="text-xs text-white/80">
                  Peça ao paciente que leia a frase acima e faça exatamente o que ela manda.
                </p>
                <Input
                  placeholder="Observação da leitura e execução (ex.: leu em voz alta e fechou os olhos)..."
                  value={patientTexts[q.key] || ''}
                  onChange={(e) => handleTextChange(q.key, e.target.value)}
                  className="bg-slate-900 border-white/20 text-white text-xs"
                />
              </div>
            )}

            {/* MEEM: Escrita de Frase Espontânea com Verificação Gramatical de Sujeito e Predicado */}
            {isMeemSentence && (
              <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/90 font-medium block">
                    Escreva ou dite uma frase completa (deve conter sujeito e predicado com
                    sentido):
                  </span>
                </div>
                <Textarea
                  placeholder="Digite a frase do paciente (ex: 'O sol brilha na praia')..."
                  value={patientTexts[q.key] || ''}
                  onChange={(e) => {
                    const text = e.target.value
                    handleTextChange(q.key, text)
                    // Validação rápida: frase com ao menos 3 palavras e verbo comum
                    const wordsCount = text.trim().split(/\s+/).filter(Boolean).length
                    if (wordsCount >= 3) {
                      handleAnswer(q.key, 1)
                    }
                  }}
                  className="bg-slate-900 border-white/20 text-white text-sm min-h-[80px]"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="text-xs text-white/70">
                    {patientTexts[q.key] ? (
                      (() => {
                        const words = patientTexts[q.key].trim().split(/\s+/).filter(Boolean)
                        const hasLen = words.length >= 3
                        return (
                          <span
                            className={cn(
                              'font-medium',
                              hasLen ? 'text-emerald-400' : 'text-amber-400',
                            )}
                          >
                            {hasLen
                              ? '✓ Estrutura com sujeito e predicado provável detectada'
                              : 'Frase curta — verifique se há verbo e sujeito com sentido'}
                          </span>
                        )
                      })()
                    ) : (
                      <span>Aguardando digitação ou fala...</span>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const text = patientTexts[q.key]?.trim() || ''
                      const words = text.split(/\s+/).filter(Boolean)
                      const valid = words.length >= 3
                      handleAnswer(q.key, valid ? 1 : 0)
                      if (valid) {
                        toast.success('Frase validada com sujeito e predicado! 1 ponto atribuído.')
                      } else {
                        toast.warning('A frase precisa ter sujeito, verbo e sentido completo.')
                      }
                    }}
                    className="text-xs border-[#00FFFF]/40 text-[#00FFFF] hover:bg-[#00FFFF]/10"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    Validar Frase
                  </Button>
                </div>
              </div>
            )}

            {/* MEEM: Nomeação de Objetos com Imagens Interativas em Alta Resolução */}
            {isMeemNaming && (
              <div className="space-y-3 p-4 rounded-xl border border-white/10 bg-white/5">
                <span className="text-xs text-white/90 font-medium block">
                  Identifique os dois objetos exibidos abaixo (Relógio e Caneta):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 flex flex-col items-center p-3 rounded-xl bg-slate-900/80 border border-white/15">
                    <img
                      src={MEEM_OBJECT_IMAGES.meem_relogio.url}
                      alt="Objeto 1 - Relógio de pulso"
                      className="w-40 h-28 object-cover rounded-lg border border-white/20 shadow"
                    />
                    <span className="text-xs text-[#00FFFF] font-semibold">
                      1. Relógio de Pulso
                    </span>
                    <span className="text-[11px] text-white/60 text-center">
                      Mostre na tela ao paciente
                    </span>
                  </div>
                  <div className="space-y-2 flex flex-col items-center p-3 rounded-xl bg-slate-900/80 border border-white/15">
                    <img
                      src={MEEM_OBJECT_IMAGES.meem_caneta.url}
                      alt="Objeto 2 - Caneta"
                      className="w-40 h-28 object-cover rounded-lg border border-white/20 shadow"
                    />
                    <span className="text-xs text-[#00FFFF] font-semibold">
                      2. Caneta Esferográfica
                    </span>
                    <span className="text-[11px] text-white/60 text-center">
                      Mostre na tela ao paciente
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Resposta do paciente: ex: relógio e caneta..."
                    value={patientTexts[q.key] || ''}
                    onChange={(e) => {
                      const text = e.target.value
                      handleTextChange(q.key, text)
                      const val = text.toLowerCase()
                      const hasClock =
                        val.includes('rel') || val.includes('relogio') || val.includes('relógio')
                      const hasPen = val.includes('caneta') || val.includes('esfer')
                      let pts = 0
                      if (hasClock) pts += 1
                      if (hasPen) pts += 1
                      if (pts > 0) handleAnswer(q.key, pts)
                    }}
                    className="bg-slate-900 border-white/20 text-white text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const val = (patientTexts[q.key] || '').toLowerCase()
                      const hasClock =
                        val.includes('rel') || val.includes('relogio') || val.includes('relógio')
                      const hasPen = val.includes('caneta') || val.includes('esfer')
                      let pts = 0
                      if (hasClock) pts += 1
                      if (hasPen) pts += 1
                      handleAnswer(q.key, pts)
                      toast.info(`Pontuação atribuída: ${pts} de 2 pontos.`)
                    }}
                    className="text-xs border-[#00FFFF]/40 text-[#00FFFF] hover:bg-[#00FFFF]/10 whitespace-nowrap"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" /> Auto-avaliar
                  </Button>
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
