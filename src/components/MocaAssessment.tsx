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
  Sparkles,
  CheckCircle2,
  PenTool,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { AssessmentProgress } from '@/components/AssessmentProgress'
import { saveDementiaAssessment } from '@/services/dementia-assessments'
import { useSpeech } from '@/hooks/use-speech'
import { DrawingCanvas } from '@/components/DrawingCanvas'
import { InteractiveTrail } from '@/components/InteractiveTrail'
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

// Imagens para o teste de nomeação do MoCA
const ANIMAL_IMAGES: Record<string, { name: string; url: string }> = {
  moca_lion: {
    name: 'Leão',
    url: 'https://img.usecurling.com/p/300/200?q=lion%20animal&color=amber',
  },
  moca_rhino: {
    name: 'Rinoceronte',
    url: 'https://img.usecurling.com/p/300/200?q=rhinoceros%20wildlife&color=slate',
  },
  moca_camel: {
    name: 'Camelo',
    url: 'https://img.usecurling.com/p/300/200?q=camel%20desert&color=sand',
  },
}

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
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs text-white/60 mr-1">Pontuação atribuída:</span>
      {Array.from({ length: max + 1 }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          className={cn(
            'h-8 w-8 rounded-lg text-xs font-bold transition-all border',
            value === i
              ? 'bg-[#00FFFF] border-[#00FFFF] text-[#0A192F] shadow-[0_0_10px_rgba(0,255,255,0.4)]'
              : 'border-white/10 text-white/85 hover:bg-[rgba(0,255,255,0.08)] hover:border-[#00FFFF]/30',
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
  const [patientAnswers, setPatientAnswers] = useState<Record<string, string>>({})
  const [drawings, setDrawings] = useState<Record<string, string>>({})
  const [showResult, setShowResult] = useState(false)
  const [saving, setSaving] = useState(false)
  const [speakingItem, setSpeakingItem] = useState<string | null>(null)
  const [activeListeningItem, setActiveListeningItem] = useState<string | null>(null)
  const topRef = useRef<HTMLDivElement>(null)

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

  const handleToggleSpeakItem = (itemKey: string, text: string) => {
    if (speaking && speakingItem === itemKey) {
      cancelSpeak()
      setSpeakingItem(null)
    } else {
      setSpeakingItem(itemKey)
      speak(text)
    }
  }

  const handleToggleMic = (itemKey: string) => {
    if (listening && activeListeningItem === itemKey) {
      stopListening()
      setActiveListeningItem(null)
    } else {
      setActiveListeningItem(itemKey)
      startListening((text) => {
        setPatientAnswers((prev) => ({
          ...prev,
          [itemKey]: prev[itemKey] ? `${prev[itemKey]} ${text}`.trim() : text,
        }))
      })
    }
  }

  useEffect(() => {
    try {
      const draft = localStorage.getItem(MOCA_DRAFT_KEY)
      if (draft) {
        const parsed = JSON.parse(draft)
        setScores(parsed.scores || {})
        setPatientAnswers(parsed.patientAnswers || {})
        setDrawings(parsed.drawings || {})
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(MOCA_DRAFT_KEY, JSON.stringify({ scores, patientAnswers, drawings }))
    } catch {
      /* ignore */
    }
  }, [scores, patientAnswers, drawings])

  const totalScore = getMocaTotal(scores)
  const severity = getMocaSeverity(totalScore)
  const answeredCount = Object.keys(scores).length

  const handleScore = (key: string, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }))
    if (showResult) setShowResult(false)
  }

  const handleAnswerChange = (key: string, text: string) => {
    setPatientAnswers((prev) => ({ ...prev, [key]: text }))
  }

  const handleDrawingChange = (key: string, dataUrl: string) => {
    setDrawings((prev) => ({ ...prev, [key]: dataUrl }))
  }

  const handleSubmit = async () => {
    setSaving(true)
    const responses = mocaItems.map((item) => ({
      question_key: item.key,
      question_label: item.text,
      response_value: scores[item.key] ?? 0,
      metadata: {
        text_response: patientAnswers[item.key] ?? '',
        drawing_data: drawings[item.key] ? 'captured' : null,
      },
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
    setPatientAnswers({})
    setDrawings({})
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
    <div ref={topRef} className="space-y-4">
      {/* Banner de orientações com IA e voz */}
      <div className="p-4 rounded-xl border border-[#00FFFF]/20 bg-[#00FFFF]/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#00FFFF] shrink-0" />
          <p className="text-xs text-white/90">
            <strong>MoCA 100% Interativo:</strong> use os botões de áudio para ouvir as perguntas,
            fale ou digite suas respostas e desenhe nos quadros em tela.
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
                  'Avaliação Montreal Cognitive Assessment MoCA. Siga as instruções em cada item, ouça o áudio ou responda diretamente na tela.',
                )
            }}
            className="border-[#00FFFF]/40 text-[#00FFFF] hover:bg-[#00FFFF]/10 text-xs shrink-0"
          >
            {speaking ? (
              <VolumeX className="h-3.5 w-3.5 mr-1 text-red-400" />
            ) : (
              <Volume2 className="h-3.5 w-3.5 mr-1" />
            )}
            {speaking ? 'Parar Áudio' : 'Ouvir Visão Geral'}
          </Button>
        )}
      </div>

      <AssessmentProgress answered={answeredCount} total={mocaItems.length} />

      {mocaDomains.map((domain) => {
        const domainItems = mocaItems.filter((i) => i.domain === domain.id)
        return (
          <div key={domain.id} className="space-y-3">
            <div className="pt-2">
              <h2 className="text-sm font-bold text-[#00FFFF] uppercase tracking-wider">
                {domain.title}
              </h2>
              <p className="text-xs text-white/75">{domain.description}</p>
            </div>
            {domainItems.map((item) => {
              const isTrail = item.key === 'moca_trail'
              const isCube = item.key === 'moca_cube'
              const isClock = item.key === 'moca_clock'
              const isNaming = ['moca_lion', 'moca_rhino', 'moca_camel'].includes(item.key)
              const isSerial7 = item.key === 'moca_serial7'
              const animalMeta = isNaming ? ANIMAL_IMAGES[item.key] : null

              return (
                <div
                  key={item.key}
                  className="p-4 sm:p-5 rounded-xl border border-white/10 transition-colors hover:border-[#00FFFF]/20 space-y-3"
                  style={CARD_BG}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-white text-sm leading-relaxed">
                      <span className="text-[#00FFFF] font-bold mr-1">{item.label}.</span>
                      {item.text}
                      {!item.scored && (
                        <span className="text-white/60 text-xs ml-2">(não pontuado)</span>
                      )}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      {ttsSupported && (
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleSpeakItem(item.key, `${item.label}. ${item.text}`)
                          }
                          className={cn(
                            'p-1.5 rounded-lg border transition-all text-xs flex items-center gap-1 cursor-pointer',
                            speaking && speakingItem === item.key
                              ? 'border-[#00FFFF] bg-[#00FFFF]/20 text-[#00FFFF]'
                              : 'border-white/10 text-white/60 hover:text-[#00FFFF] hover:border-[#00FFFF]/30',
                          )}
                          title="Ouvir instrução"
                        >
                          {speaking && speakingItem === item.key ? (
                            <VolumeX className="h-3.5 w-3.5 text-[#00FFFF]" />
                          ) : (
                            <Volume2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                      {sttSupported && (
                        <button
                          type="button"
                          onClick={() => handleToggleMic(item.key)}
                          className={cn(
                            'p-1.5 rounded-lg border transition-all text-xs flex items-center gap-1 cursor-pointer',
                            listening && activeListeningItem === item.key
                              ? 'border-red-500 bg-red-500/20 text-red-400 animate-pulse'
                              : 'border-white/10 text-white/60 hover:text-[#00FFFF] hover:border-[#00FFFF]/30',
                          )}
                          title="Falar resposta via microfone"
                        >
                          {listening && activeListeningItem === item.key ? (
                            <MicOff className="h-3.5 w-3.5" />
                          ) : (
                            <Mic className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 1) Trilha Interativa com Círculos Clicáveis e Canvas de Desenho Opcional */}
                  {isTrail && (
                    <div className="space-y-4">
                      <div className="p-3 rounded-xl border border-[#00FFFF]/20 bg-[#00FFFF]/5">
                        <p className="text-xs text-white/90 mb-2">
                          <strong className="text-[#00FFFF]">Trilha Interativa:</strong> toque ou
                          clique nos círculos alternando número e letra (
                          <span className="text-[#00FFFF] font-mono font-bold">
                            1 &rarr; A &rarr; 2 &rarr; B &rarr; 3 &rarr; C &rarr; 4 &rarr; D &rarr;
                            5 &rarr; E
                          </span>
                          ) o mais rápido que puder:
                        </p>
                        <InteractiveTrail
                          variant="moca"
                          onComplete={({ errors: errCount, timeSeconds }) => {
                            // Se terminou com 0 erros, auto pontua 1 ponto
                            if (errCount === 0) {
                              handleScore(item.key, 1)
                              toast.success(
                                `Trilha completada sem erros em ${timeSeconds}s! Pontuação máxima atribuída.`,
                              )
                            } else {
                              handleScore(item.key, 0)
                              toast.warning(`Trilha concluída com ${errCount} erro(s).`)
                            }
                          }}
                        />
                      </div>

                      <DrawingCanvas
                        title="Ou trace manualmente no Quadro Branco (opcional)"
                        instruction="Se preferir, desenhe os traços conectando 1 &rarr; A &rarr; 2 &rarr; B &rarr; 3 &rarr; C &rarr; 4 &rarr; D &rarr; 5 &rarr; E:"
                        referenceTemplate="trail"
                        initialValue={drawings[item.key]}
                        onChange={(dataUrl) => handleDrawingChange(item.key, dataUrl)}
                        height={200}
                      />
                    </div>
                  )}

                  {/* 2) Canvas interativo para cópia do cubo */}
                  {isCube && (
                    <DrawingCanvas
                      title="Cópia do Cubo em Perspectiva"
                      instruction="Observe o modelo ao lado e copie o cubo no quadro branco:"
                      referenceTemplate="cube"
                      initialValue={drawings[item.key]}
                      onChange={(dataUrl) => handleDrawingChange(item.key, dataUrl)}
                      height={240}
                    />
                  )}

                  {/* 3) Canvas interativo para teste do desenho do relógio */}
                  {isClock && (
                    <DrawingCanvas
                      title="Desenho do Relógio (Contorno, Números e Ponteiros)"
                      instruction="Desenhe um relógio circular com todos os números e ponteiros marcando 11:10:"
                      referenceTemplate="clock"
                      initialValue={drawings[item.key]}
                      onChange={(dataUrl) => handleDrawingChange(item.key, dataUrl)}
                      height={280}
                    />
                  )}

                  {/* 4) Imagem para nomeação de animais com Auto-avaliação inteligente */}
                  {isNaming && animalMeta && (
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
                      <div className="relative group shrink-0">
                        <img
                          src={animalMeta.url}
                          alt={`Identificar animal: ${animalMeta.name}`}
                          className="w-44 h-32 object-cover rounded-xl border-2 border-[#00FFFF]/30 shadow-lg"
                        />
                        <div className="absolute bottom-1 right-1 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white/80">
                          Estímulo visual
                        </div>
                      </div>
                      <div className="flex-1 w-full space-y-2">
                        <span className="text-xs text-white/90 font-medium block">
                          Qual é o nome deste animal? (Diga pelo microfone ou digite):
                        </span>
                        <div className="flex gap-2">
                          <Input
                            placeholder={`Ex: ${animalMeta.name.toLowerCase()}...`}
                            value={patientAnswers[item.key] || ''}
                            onChange={(e) => {
                              const text = e.target.value
                              handleAnswerChange(item.key, text)
                              // Auto reconhecimento de acerto em tempo real
                              const val = text.toLowerCase().trim()
                              const correct =
                                (item.key === 'moca_lion' &&
                                  (val.includes('le') ||
                                    val.includes('leão') ||
                                    val.includes('leao'))) ||
                                (item.key === 'moca_rhino' &&
                                  (val.includes('rino') || val.includes('rinoceronte'))) ||
                                (item.key === 'moca_camel' &&
                                  (val.includes('camel') ||
                                    val.includes('dromed') ||
                                    val.includes('camelo')))
                              if (correct) {
                                handleScore(item.key, 1)
                              }
                            }}
                            className="bg-slate-900 border-white/20 text-white text-sm"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const val = patientAnswers[item.key]?.toLowerCase().trim() || ''
                              const correct =
                                (item.key === 'moca_lion' &&
                                  (val.includes('le') ||
                                    val.includes('leão') ||
                                    val.includes('leao'))) ||
                                (item.key === 'moca_rhino' &&
                                  (val.includes('rino') || val.includes('rinoceronte'))) ||
                                (item.key === 'moca_camel' &&
                                  (val.includes('camel') ||
                                    val.includes('dromed') ||
                                    val.includes('camelo')))
                              handleScore(item.key, correct ? 1 : 0)
                              if (correct) {
                                toast.success(
                                  `Resposta correta para ${animalMeta.name}! 1 ponto atribuído.`,
                                )
                              } else {
                                toast.info(`Resposta avaliada. Pontuação: ${correct ? 1 : 0}`)
                              }
                            }}
                            className="text-xs border-[#00FFFF]/40 text-[#00FFFF] hover:bg-[#00FFFF]/10 whitespace-nowrap"
                          >
                            <Sparkles className="h-3.5 w-3.5 mr-1" />
                            Verificar
                          </Button>
                        </div>
                        {scores[item.key] === 1 && (
                          <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Nomeação correta reconhecida (1
                            ponto)
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 5) Subtração serial interativa (100 - 7...) */}
                  {isSerial7 && (
                    <div className="p-3 rounded-lg border border-white/10 bg-white/5 space-y-2">
                      <p className="text-xs text-white/80">
                        Digite a sequência das 5 subtrações (ex.: 93, 86, 79, 72, 65):
                      </p>
                      <Input
                        placeholder="Ex: 93, 86, 79, 72, 65"
                        value={patientAnswers[item.key] || ''}
                        onChange={(e) => handleAnswerChange(item.key, e.target.value)}
                        className="bg-slate-900 border-white/20 text-white text-sm font-mono"
                      />
                    </div>
                  )}

                  {/* Entrada de texto padrão para outros itens verbais/recordação */}
                  {!isTrail && !isCube && !isClock && !isNaming && !isSerial7 && (
                    <div className="space-y-1">
                      <Input
                        placeholder="Resposta do paciente (digite ou use o microfone)..."
                        value={patientAnswers[item.key] || ''}
                        onChange={(e) => handleAnswerChange(item.key, e.target.value)}
                        className="bg-slate-900/60 border-white/10 text-white text-xs"
                      />
                    </div>
                  )}

                  <div className="pt-1">
                    <ScoreInput
                      max={item.maxScore}
                      value={scores[item.key] ?? -1}
                      onSelect={(v) => handleScore(item.key, v)}
                    />
                  </div>
                </div>
              )
            })}
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
        Gerar Resultados do MoCA
      </Button>
    </div>
  )
}
