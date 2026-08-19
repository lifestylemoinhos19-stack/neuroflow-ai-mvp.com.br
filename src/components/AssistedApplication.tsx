/**
 * NeuroFlow — AssistedApplication
 *
 * Componente de aplicação assistida por voz (uma pergunta por vez) para as
 * escalas que exigem mediação (MEEM, MoCA, Desenho do Relógio, FAS, PHQ-9,
 * GAD-7, M-CHAT-R, SNAP-IV).
 *
 * Segue o playbook "Aplicação Assistida de Escalas ao Paciente":
 *  - Uma pergunta por vez, em linguagem simples e acolhedora (PT-BR).
 *  - Pausa explícita ("Podemos continuar?") a cada 3-4 itens.
 *  - Repete o estímulo (quando permitido) e REGISTRA a repetição.
 *  - Registra a resposta LITERAL — nunca infere, corrige ou dá dicas.
 *  - Resposta vaga/ambígua → pergunta neutra; se persistir, sinaliza
 *    "[RESPOSTA AMBÍGUA — REQUER MEDIAÇÃO DO PROFISSIONAL]".
 *  - Itens com material físico → orienta o profissional e registra.
 *  - Itens com correção manual → sinaliza "[REQUER CORREÇÃO DO PROFISSIONAL]".
 *  - Ideação suicida/risco iminente (PHQ-9 #9 ≥ 1) → interrompe e orienta
 *    encaminhamento urgente.
 *  - Voz: TTS lê cada pergunta; STT captura a resposta (ou digitação).
 *  - Ao final: tela de resumo com todas as respostas + botões
 *    "Gerar Registro PDF" / "Salvar para Revisão".
 *
 * Integração: salva via createAnamnesisSessionForGuest/saveAnamnesisResponses
 * (mesmo padrão das outras escalas) e alimenta o motor de laudos existente
 * (generateNeuropsychReport) através do registro JSON.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Mic,
  MicOff,
  Pause,
  Play,
  Volume2,
  Loader2,
  AlertTriangle,
  FileDown,
  Save,
  Hand,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useSpeech } from '@/hooks/use-speech'
import { ASSISTED_DISCLAIMER, PAUSE_EVERY, type AssistedScale } from '@/lib/assisted-scales-data'
import { createAnamnesisSessionForGuest, saveAnamnesisResponses } from '@/services/anamnesis'
import {
  buildRecordResponses,
  generateAssistedRecordPDF,
  generateAssistedRecordJSON,
  detectImminentRisk,
  downloadTextFile,
  type AssistedRecordContext,
  type AssistedResponseRecord,
} from '@/lib/assisted-record-export'
import { saveAssistedApplication } from '@/services/assisted-application'
import { CLINIC_BRANDING } from '@/lib/clinic-branding'

/** Resposta registrada por item (literal — nunca inferida). */
interface ItemAnswer {
  response: string
  numeric: number | null
  observation: string
  flags: string[]
  repetitions: number
  /** Estado de ambiguidade: 0 = nada, 1 = pediu esclarecimento, 2 = persiste. */
  ambiguity: number
}

/** Props do componente (a página resolve escala + assignment + paciente). */
export interface AssistedApplicationProps {
  scale: AssistedScale
  /** Iniciais do paciente (ex.: "J.S."). */
  iniciais: string
  /** Idade ou null. */
  idade: number | null
  /** Escolaridade. */
  escolaridade: string
  /** guest_id do paciente (para salvar respostas). */
  guestId: string | null
  /** Nome do profissional (para o registro). */
  professionalName: string
  /** ID do scale_assignment (para vincular a sessão). */
  assignmentId: string
  /** ID do profissional (auth.users.id) que aplica. Opcional (página resolve). */
  professionalId?: string | null
  /** ID do paciente (profiles.id) vinculado ao assignment, se houver. */
  patientId?: string | null
  /** Callback ao concluir salvamento. */
  onSaved?: (sessionId: string | null) => void
}

type Phase = 'intro' | 'item' | 'pause' | 'risk' | 'summary'

export function AssistedApplication({
  scale,
  iniciais,
  idade,
  escolaridade,
  guestId,
  professionalName,
  assignmentId,
  professionalId,
  patientId,
  onSaved,
}: AssistedApplicationProps) {
  const navigate = useNavigate()
  const speech = useSpeech({ lang: 'pt-BR', rate: 0.92 })
  const [phase, setPhase] = useState<Phase>('intro')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, ItemAnswer>>({})
  const [currentText, setCurrentText] = useState('')
  const [professionalNotes, setProfessionalNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const savedSessionRef = useRef<string | null>(null)

  const item = scale.items[index]
  const totalItems = scale.items.length
  const answeredCount = Object.keys(answers).length

  // --- Falar o estímulo ao entrar em um item (TTS) ---
  const speakItem = useCallback(
    (idx: number) => {
      const it = scale.items[idx]
      if (!it) return
      if (speech.ttsSupported) {
        speech.speak(it.stimulus)
      }
    },
    [scale.items, speech],
  )

  // Quando muda para a fase 'item' (ou o índice), lê a pergunta.
  useEffect(() => {
    if (phase === 'item') {
      setCurrentText('')
      // Pequeno atraso para o componente pintar antes de falar.
      const t = setTimeout(() => speakItem(index), 120)
      return () => clearTimeout(t)
    }
  }, [phase, index, speakItem])

  // --- Helpers de sinalização (respeitando o playbook) ---
  const flagsFor = useCallback((it: typeof item, text: string, ambiguity: number): string[] => {
    const flags: string[] = []
    const trimmed = text.trim()
    if (!trimmed) flags.push('[ITEM NÃO APLICADO]')
    else if (ambiguity >= 2) flags.push('[RESPOSTA AMBÍGUA — REQUER MEDIAÇÃO DO PROFISSIONAL]')
    if (it?.requiresManualScoring) flags.push('[REQUER CORREÇÃO DO PROFISSIONAL]')
    if (it?.requiresMaterial) flags.push('[MATERIAL FÍSICO — VER ORIENTAÇÃO AO PROFISSIONAL]')
    return flags
  }, [])

  /** Resposta numérica (para likert usa o valor selecionado; points/literal null). */
  const numericFromResponse = (it: typeof item, text: string): number | null => {
    if (!it) return null
    if (it.responseType === 'likert' && it.options) {
      const found = it.options.find(
        (o) =>
          o.label.toLowerCase() === text.trim().toLowerCase() ||
          o.spoken.toLowerCase() === text.trim().toLowerCase(),
      )
      return found ? found.value : null
    }
    // points/literal: o profissional fará a correção manual.
    return it.requiresManualScoring ? null : null
  }

  // --- Ações do fluxo ---
  const toggleMic = () => {
    if (!speech.sttSupported) {
      toast.error('Reconhecimento de voz não suportado neste navegador. Use a digitação.')
      return
    }
    if (speech.listening) {
      speech.stopListening()
    } else {
      speech.startListening((text) => {
        setCurrentText((prev) => (prev ? `${prev} ${text}`.trim() : text))
      })
    }
  }

  const repeatItem = () => {
    if (!item) return
    // Registra a repetição do estímulo (conforme protocolo).
    setAnswers((prev) => {
      const a = prev[item.key] ?? emptyAnswer()
      return {
        ...prev,
        [item.key]: { ...a, repetitions: a.repetitions + 1 },
      }
    })
    speakItem(index)
    toast.info('Estímulo repetido. Repetição registrada no registro final.')
  }

  const askClarification = () => {
    // Pergunta neutra de esclarecimento ("Pode me dizer mais uma vez?").
    setAnswers((prev) => {
      const a = prev[item.key] ?? emptyAnswer()
      return {
        ...prev,
        [item.key]: { ...a, ambiguity: Math.max(1, a.ambiguity) },
      }
    })
    if (speech.ttsSupported) {
      speech.speak('Pode me dizer mais uma vez, por favor?')
    }
  }

  const recordAnswer = () => {
    if (!item) return
    const trimmed = currentText.trim()
    const a = answers[item.key] ?? emptyAnswer()
    const updated: ItemAnswer = {
      ...a,
      response: trimmed,
      numeric: numericFromResponse(item, trimmed),
      flags: flagsFor(item, trimmed, a.ambiguity),
      observation: a.observation,
    }
    setAnswers((prev) => ({ ...prev, [item.key]: updated }))

    // --- Detecção de risco iminente (PHQ-9 #9) ---
    if (item.key === 'phq9_q9' && updated.numeric !== null && updated.numeric >= 1) {
      setPhase('risk')
      if (speech.ttsSupported) {
        speech.speak(
          'Obrigado. Vamos pausar aqui. Por favor, acolha o paciente e considere o encaminhamento urgente.',
        )
      }
      return
    }

    advance()
  }

  const advance = () => {
    speech.stopListening()
    // Pausa a cada PAUSE_EVERY itens (e sempre que o item.pauseAfter marque).
    const isPausePoint = (index + 1) % PAUSE_EVERY === 0 || !!item?.pauseAfter
    if (isPausePoint && index + 1 < totalItems) {
      setPhase('pause')
      if (speech.ttsSupported) speech.speak('Podemos continuar?')
    } else if (index + 1 < totalItems) {
      setIndex((i) => i + 1)
    } else {
      setPhase('summary')
    }
  }

  const continueFromPause = () => {
    setPhase('item')
    setIndex((i) => Math.min(i + 1, totalItems - 1))
  }

  const skipItem = () => {
    // Marca como não aplicado (resposta vazia) e avança.
    if (!item) return
    setAnswers((prev) => ({
      ...prev,
      [item.key]: {
        ...emptyAnswer(),
        response: '',
        numeric: null,
        flags: [
          '[ITEM NÃO APLICADO]',
          ...(item.requiresManualScoring ? ['[REQUER CORREÇÃO DO PROFISSIONAL]'] : []),
        ],
        observation: 'Item não aplicado.',
      },
    }))
    advance()
  }

  const back = () => {
    if (index > 0 && phase === 'item') {
      setIndex((i) => i - 1)
      setCurrentText(answers[scale.items[index - 1]?.key]?.response ?? '')
    } else if (phase === 'pause') {
      setPhase('item')
    } else if (phase === 'intro') {
      navigate(-1)
    } else if (phase === 'summary') {
      setPhase('item')
      setIndex(totalItems - 1)
    }
  }

  // --- Persistência (mesmo padrão das outras escalas) ---
  const recordResponses = useMemo(
    () =>
      buildRecordResponses(
        scale,
        answers as Record<
          string,
          {
            response: string
            numeric: number | null
            observation: string
            flags: string[]
            repetitions: number
          }
        >,
      ),
    [scale, answers],
  )

  const totalScore = useMemo(() => {
    // Soma apenas itens com pontuação numérica e SEM correção manual.
    const sum = recordResponses
      .filter((r) => !r.requiresManualScoring && r.numericValue !== null)
      .reduce((acc, r) => acc + (r.numericValue ?? 0), 0)
    // Se todos os itens pontuáveis foram não aplicados/manuais, não calcula.
    const anyScored = recordResponses.some(
      (r) => !r.requiresManualScoring && r.numericValue !== null,
    )
    return anyScored ? sum : null
  }, [recordResponses])

  const recordCtx: AssistedRecordContext = {
    scale,
    iniciais,
    idade,
    escolaridade,
    appliedAt: new Date().toISOString(),
    professionalName,
    professionalNotes,
    responses: recordResponses,
    totalScore,
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // 1) Cria a sessão (mesmo padrão das escalas: guest ou auth).
      const session = await createAnamnesisSessionForGuest(guestId)
      if (!session) {
        toast.error('Não foi possível criar a sessão de aplicação.')
        setSaving(false)
        return
      }
      // 2) Salva cada resposta (question_key = chave do item) + total.
      const responses = scale.items.map((it) => {
        const a = answers[it.key]
        const val = a?.numeric ?? (a?.response ? a.response : '[ITEM NÃO APLICADO]')
        return {
          question_key: it.key,
          question_label: `${it.domain} — ${it.stimulus.slice(0, 80)}`,
          response_value: typeof val === 'number' ? val : String(val),
        }
      })
      // Total bruto (quando calculável) — gravado como *_total para o motor de laudos.
      if (totalScore !== null) {
        responses.push({
          question_key: scale.totalKey,
          question_label: `${scale.name} — pontuação total`,
          response_value: totalScore,
        })
      }
      const ok = await saveAnamnesisResponses(session.id, responses)
      if (!ok) {
        toast.error('Erro ao salvar respostas.')
        setSaving(false)
        return
      }
      // 3) Persiste o registro de aplicação assistida (tabela dedicada) com
      //    itens/pontuação/interpretação separados — conforme o playbook.
      //    Não bloqueia o fluxo se falhar: a sessão de anamnese já foi salva.
      try {
        const { error: assistedErr } = await saveAssistedApplication({
          professionalId: professionalId ?? null,
          patientId: patientId ?? null,
          guestId,
          assignmentId,
          sessionId: session.id,
          scale,
          items: recordResponses,
          totalScore,
          observations: professionalNotes,
          recordContext: recordCtx,
        })
        if (assistedErr) {
          console.warn('Assisted application: falha ao salvar registro dedicado.', assistedErr)
        }
      } catch (e) {
        console.warn('Assisted application: erro ao salvar registro dedicado.', e)
      }
      // 4) Vincula ao scale_assignment quando possível (metadata).
      savedSessionRef.current = session.id
      toast.success('Aplicação salva para revisão do profissional.')
      onSaved?.(session.id)
    } catch (e) {
      console.error(e)
      toast.error('Erro inesperado ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true)
    try {
      await generateAssistedRecordPDF(recordCtx)
      toast.success('Registro PDF gerado.')
    } catch (e) {
      console.error(e)
      toast.error('Erro ao gerar PDF.')
    } finally {
      setGeneratingPdf(false)
    }
  }

  const handleDownloadJson = () => {
    const json = generateAssistedRecordJSON(recordCtx)
    const blob = JSON.stringify(json, null, 2)
    const safe = iniciais.replace(/[^a-zA-Z0-9]/g, '_')
    downloadTextFile(blob, `registro-assistido-${scale.key}-${safe}.json`, 'application/json')
  }

  // --- Renderização ---
  if (phase === 'intro') {
    return (
      <IntroScreen
        scale={scale}
        iniciais={iniciais}
        idade={idade}
        escolaridade={escolaridade}
        ttsSupported={speech.ttsSupported}
        sttSupported={speech.sttSupported}
        onStart={() => setPhase('item')}
        onBack={() => navigate(-1)}
      />
    )
  }

  if (phase === 'risk') {
    return (
      <RiskScreen
        scale={scale}
        iniciais={iniciais}
        onContinue={() => setPhase('summary')}
        onSpeak={(t) => speech.ttsSupported && speech.speak(t)}
      />
    )
  }

  if (phase === 'summary') {
    return (
      <SummaryScreen
        ctx={recordCtx}
        recordResponses={recordResponses}
        totalScore={totalScore}
        professionalNotes={professionalNotes}
        setProfessionalNotes={setProfessionalNotes}
        onBack={() => {
          setPhase('item')
          setIndex(totalItems - 1)
        }}
        onSave={handleSave}
        onPdf={handleGeneratePdf}
        onJson={handleDownloadJson}
        saving={saving}
        generatingPdf={generatingPdf}
        saved={!!savedSessionRef.current}
        assignmentId={assignmentId}
      />
    )
  }

  if (phase === 'pause') {
    return (
      <PauseScreen
        index={index}
        total={totalItems}
        onContinue={continueFromPause}
        onBack={() => setPhase('item')}
        onSpeak={() => speech.ttsSupported && speech.speak('Podemos continuar?')}
      />
    )
  }

  // --- Fase: item (uma pergunta por vez) ---
  const progressPct = Math.round(((index + 1) / totalItems) * 100)
  return (
    <div className="min-h-screen bg-[#FAF5EB]">
      {/* Cabeçalho */}
      <header
        className="sticky top-0 z-20 border-b"
        style={{
          backgroundColor: CLINIC_BRANDING.colors.accent,
          borderColor: CLINIC_BRANDING.colors.secondary,
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <img
            src={CLINIC_BRANDING.logoUrl}
            alt={CLINIC_BRANDING.name}
            className="h-9 w-9 rounded-md object-contain"
          />
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-bold truncate"
              style={{ color: CLINIC_BRANDING.colors.dark }}
            >
              {scale.name}
            </p>
            <p className="text-xs" style={{ color: CLINIC_BRANDING.colors.medium }}>
              Paciente: {iniciais} · {scale.applicationMode}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={back} className="text-[#3E2723]">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        </div>
        {/* Barra de progresso */}
        <div className="h-1.5 w-full" style={{ backgroundColor: '#E8DDC8' }}>
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${progressPct}%`, backgroundColor: CLINIC_BRANDING.colors.primary }}
          />
        </div>
        <div
          className="max-w-4xl mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between text-xs"
          style={{ color: CLINIC_BRANDING.colors.medium }}
        >
          <span>
            Item {index + 1} de {totalItems}
          </span>
          <span>{totalItems - answeredCount} restante(s)</span>
        </div>
      </header>

      {/* Corpo */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Domínio + sinalizações */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge style={{ backgroundColor: CLINIC_BRANDING.colors.secondary, color: '#fff' }}>
            {item.domain}
          </Badge>
          {item.requiresMaterial && (
            <Badge variant="outline" className="border-amber-500 text-amber-700">
              <Hand className="h-3 w-3 mr-1" /> Material físico
            </Badge>
          )}
          {item.requiresManualScoring && (
            <Badge variant="outline" className="border-rose-400 text-rose-700">
              Correção manual
            </Badge>
          )}
          {!item.allowRepetition && (
            <Badge variant="outline" className="border-slate-400 text-slate-600">
              Sem repetição
            </Badge>
          )}
        </div>

        {/* Orientação ao profissional (material) */}
        {item.requiresMaterial && item.materialNote && (
          <div
            className="mb-4 p-3 rounded-lg border text-sm"
            style={{
              backgroundColor: '#FFF7E6',
              borderColor: CLINIC_BRANDING.colors.secondary,
              color: CLINIC_BRANDING.colors.dark,
            }}
          >
            <p className="font-semibold mb-0.5">Orientação ao profissional</p>
            <p>{item.materialNote}</p>
          </div>
        )}

        {/* Área da pergunta (grande, legível) */}
        <Card
          className="mb-6 border-2 shadow-sm"
          style={{ borderColor: CLINIC_BRANDING.colors.secondary, backgroundColor: '#fff' }}
        >
          <CardContent className="p-6 sm:p-8">
            <p
              className="text-xl sm:text-2xl leading-relaxed font-medium"
              style={{ color: CLINIC_BRANDING.colors.dark }}
            >
              {item.stimulus}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => speakItem(index)}
                disabled={!speech.ttsSupported || speech.speaking}
                style={{
                  borderColor: CLINIC_BRANDING.colors.primary,
                  color: CLINIC_BRANDING.colors.primary,
                }}
              >
                {speech.speaking ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Volume2 className="h-4 w-4 mr-1" />
                )}
                {speech.speaking ? 'Falando...' : 'Ouvir pergunta'}
              </Button>
              {item.allowRepetition && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={repeatItem}
                  style={{
                    borderColor: CLINIC_BRANDING.colors.secondary,
                    color: CLINIC_BRANDING.colors.medium,
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-1" /> Repetir estímulo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Opções (likert) */}
        {item.responseType === 'likert' && item.options && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {item.options.map((opt) => {
              const selected = currentText.trim().toLowerCase() === opt.label.toLowerCase()
              return (
                <button
                  key={opt.value}
                  onClick={() => setCurrentText(opt.label)}
                  className={cn(
                    'px-3 py-3 rounded-lg text-sm font-medium border transition-all text-center',
                    selected ? 'border-2 text-white' : 'bg-white text-[#3E2723] hover:bg-[#FAF5EB]',
                  )}
                  style={
                    selected
                      ? {
                          backgroundColor: CLINIC_BRANDING.colors.primary,
                          borderColor: CLINIC_BRANDING.colors.dark,
                        }
                      : { borderColor: CLINIC_BRANDING.colors.secondary }
                  }
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Área de resposta (texto digitável + voz) */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium" style={{ color: CLINIC_BRANDING.colors.dark }}>
              Resposta do paciente (literal — sem inferência)
            </label>
            <button
              onClick={toggleMic}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                speech.listening
                  ? 'bg-red-50 border-red-300 text-red-700'
                  : 'bg-white border-[#C4A35A] text-[#7B5B3A] hover:bg-[#FAF5EB]',
              )}
              disabled={!speech.sttSupported}
              title={speech.sttSupported ? 'Ativar microfone' : 'Voz não suportada'}
            >
              {speech.listening ? (
                <>
                  <MicOff className="h-3.5 w-3.5" /> Parar
                </>
              ) : (
                <>
                  <Mic className="h-3.5 w-3.5" /> Falar
                </>
              )}
            </button>
          </div>
          <Textarea
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            placeholder={
              speech.listening
                ? 'Ouvindo... aguarde o paciente responder.'
                : 'Digite ou capture por voz a resposta literal do paciente...'
            }
            rows={3}
            className="bg-white border-2 focus-visible:ring-0"
            style={{ borderColor: CLINIC_BRANDING.colors.secondary }}
          />
          {speech.interimTranscript && (
            <p className="mt-1 text-xs italic" style={{ color: CLINIC_BRANDING.colors.medium }}>
              Ouvindo: "{speech.interimTranscript}"
            </p>
          )}
          {speech.error && <p className="mt-1 text-xs text-red-600">{speech.error}</p>}
          {answers[item.key]?.ambiguity ? (
            <p className="mt-1 text-xs text-amber-700">
              Resposta considerada ambígua — será sinalizada no registro.
            </p>
          ) : null}
        </div>

        {/* Ações */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={recordAnswer}
            className="text-white"
            style={{ backgroundColor: CLINIC_BRANDING.colors.primary }}
          >
            Próximo <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          <Button
            variant="outline"
            onClick={askClarification}
            className="border-[#C4A35A] text-[#7B5B3A]"
          >
            Pedir esclarecimento
          </Button>
          <Button variant="ghost" onClick={skipItem} className="text-slate-500">
            Não aplicado
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" onClick={() => setPhase('pause')} className="text-slate-500">
            <Pause className="h-4 w-4 mr-1" /> Pausar
          </Button>
        </div>

        {/* Disclaimer persistente */}
        <Disclaimer />
      </main>
    </div>
  )
}

/* ----------------------------------------------------------------- */
/* Subcomponentes                                                   */
/* ----------------------------------------------------------------- */
function emptyAnswer(): ItemAnswer {
  return {
    response: '',
    numeric: null,
    observation: '',
    flags: [],
    repetitions: 0,
    ambiguity: 0,
  }
}

function Disclaimer() {
  return (
    <div
      className="mt-8 p-3 rounded-lg border text-xs leading-relaxed"
      style={{
        backgroundColor: '#FFF7E6',
        borderColor: CLINIC_BRANDING.colors.secondary,
        color: CLINIC_BRANDING.colors.dark,
      }}
    >
      <p className="font-semibold mb-1">⚠️ Aplicação assistida — regras do playbook</p>
      <p>{ASSISTED_DISCLAIMER}</p>
    </div>
  )
}

function IntroScreen({
  scale,
  iniciais,
  idade,
  escolaridade,
  ttsSupported,
  sttSupported,
  onStart,
  onBack,
}: {
  scale: AssistedScale
  iniciais: string
  idade: number | null
  escolaridade: string
  ttsSupported: boolean
  sttSupported: boolean
  onStart: () => void
  onBack: () => void
}) {
  return (
    <div className="min-h-screen bg-[#FAF5EB]">
      <header
        className="border-b"
        style={{
          backgroundColor: CLINIC_BRANDING.colors.accent,
          borderColor: CLINIC_BRANDING.colors.secondary,
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <img
            src={CLINIC_BRANDING.logoUrl}
            alt={CLINIC_BRANDING.name}
            className="h-10 w-10 rounded-md object-contain"
          />
          <div className="flex-1">
            <p className="font-bold" style={{ color: CLINIC_BRANDING.colors.dark }}>
              {CLINIC_BRANDING.name}
            </p>
            <p className="text-xs" style={{ color: CLINIC_BRANDING.colors.medium }}>
              Aplicação Assistida de Escalas
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onBack} className="text-[#3E2723]">
            <ArrowLeft className="h-4 w-4 mr-1" /> Sair
          </Button>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Card
          className="border-2 shadow-sm"
          style={{ borderColor: CLINIC_BRANDING.colors.secondary, backgroundColor: '#fff' }}
        >
          <CardHeader>
            <CardTitle style={{ color: CLINIC_BRANDING.colors.primary }}>{scale.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm"
              style={{ color: CLINIC_BRANDING.colors.dark }}
            >
              <InfoRow label="Versão" value={scale.version} />
              <InfoRow label="Modo" value={scale.applicationMode} />
              <InfoRow
                label="Alvo"
                value={scale.target === 'responsavel' ? 'Responsável' : 'Paciente'}
              />
              <InfoRow label="Itens" value={String(scale.items.length)} />
              <InfoRow label="Paciente" value={iniciais} />
              <InfoRow label="Idade" value={idade !== null ? `${idade} anos` : '—'} />
              <InfoRow label="Escolaridade" value={escolaridade} />
            </div>
            <div
              className="p-3 rounded-lg border text-sm"
              style={{
                backgroundColor: '#FFF7E6',
                borderColor: CLINIC_BRANDING.colors.secondary,
                color: CLINIC_BRANDING.colors.dark,
              }}
            >
              <p className="font-semibold mb-1">Como funciona</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Uma pergunta por vez, em linguagem simples e acolhedora.</li>
                <li>Pausas explícitas a cada 3-4 itens ("Podemos continuar?").</li>
                <li>Resposta registrada de forma literal — sem inferência ou dica.</li>
                <li>Itens com material físico ou correção manual são sinalizados.</li>
                <li>Em risco iminente, a aplicação é interrompida.</li>
              </ul>
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              <Badge
                variant="outline"
                className={
                  ttsSupported
                    ? 'border-emerald-400 text-emerald-700'
                    : 'border-slate-400 text-slate-500'
                }
              >
                Voz (leitura): {ttsSupported ? 'disponível' : 'não suportada'}
              </Badge>
              <Badge
                variant="outline"
                className={
                  sttSupported
                    ? 'border-emerald-400 text-emerald-700'
                    : 'border-slate-400 text-slate-500'
                }
              >
                Microfone (resposta): {sttSupported ? 'disponível' : 'use digitação'}
              </Badge>
            </div>
            <Disclaimer />
            <Button
              onClick={onStart}
              className="w-full text-white"
              style={{ backgroundColor: CLINIC_BRANDING.colors.primary }}
            >
              <Play className="h-4 w-4 mr-2" /> Iniciar aplicação assistida
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b pb-1" style={{ borderColor: '#EFE6D6' }}>
      <span className="font-medium" style={{ color: CLINIC_BRANDING.colors.medium }}>
        {label}:
      </span>
      <span>{value}</span>
    </div>
  )
}

function PauseScreen({
  index,
  total,
  onContinue,
  onBack,
  onSpeak,
}: {
  index: number
  total: number
  onContinue: () => void
  onBack: () => void
  onSpeak: () => void
}) {
  return (
    <div className="min-h-screen bg-[#FAF5EB] flex items-center justify-center px-4">
      <Card
        className="max-w-md w-full border-2 shadow-sm text-center"
        style={{ borderColor: CLINIC_BRANDING.colors.secondary, backgroundColor: '#fff' }}
      >
        <CardContent className="p-8 space-y-4">
          <div
            className="mx-auto h-14 w-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: CLINIC_BRANDING.colors.accent }}
          >
            <Pause className="h-7 w-7" style={{ color: CLINIC_BRANDING.colors.primary }} />
          </div>
          <h2 className="text-xl font-bold" style={{ color: CLINIC_BRANDING.colors.dark }}>
            Podemos continuar?
          </h2>
          <p className="text-sm" style={{ color: CLINIC_BRANDING.colors.medium }}>
            Pausa sugerida pelo protocolo. Item {index + 1} de {total} concluído. Sem pressa —
            retome quando o paciente estiver confortável.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={onContinue}
              className="text-white"
              style={{ backgroundColor: CLINIC_BRANDING.colors.primary }}
            >
              <Play className="h-4 w-4 mr-2" /> Sim, continuar
            </Button>
            <Button variant="outline" onClick={onSpeak} className="border-[#C4A35A] text-[#7B5B3A]">
              <Volume2 className="h-4 w-4 mr-1" /> Repetir pergunta em voz alta
            </Button>
            <Button variant="ghost" onClick={onBack} className="text-slate-500">
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao item
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function RiskScreen({
  scale,
  iniciais,
  onContinue,
  onSpeak,
}: {
  scale: AssistedScale
  iniciais: string
  onContinue: () => void
  onSpeak: (text: string) => void
}) {
  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center px-4">
      <Card className="max-w-lg w-full border-2 border-red-400 shadow-sm bg-white">
        <CardContent className="p-8 space-y-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-7 w-7" />
            <h2 className="text-xl font-bold">Risco iminente detectado</h2>
          </div>
          <p className="text-sm text-red-900">
            Resposta ao item de risco (PHQ-9 #9) ≥ 1 registrada para o paciente{' '}
            <strong>{iniciais}</strong> na escala <strong>{scale.name}</strong>.
          </p>
          <div className="p-3 rounded-lg bg-red-100 border border-red-300 text-sm text-red-900 space-y-1">
            <p className="font-semibold">Orientação obrigatória:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Interromper a aplicação assistida imediatamente.</li>
              <li>Não deixar o paciente sozinho.</li>
              <li>Acolher e avaliar risco de suicídio de forma direta.</li>
              <li>Acionar serviço de emergência / CVV 188 quando indicado.</li>
              <li>Registrar encaminhamento no prontuário.</li>
            </ul>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => onSpeak('Por favor, aguarde aqui. Vou acolher você agora.')}
              variant="outline"
              className="border-red-300 text-red-700"
            >
              <Volume2 className="h-4 w-4 mr-1" /> Falar ao paciente
            </Button>
            <Button onClick={onContinue} className="bg-red-700 text-white hover:bg-red-800">
              Ir para o resumo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryScreen({
  ctx,
  recordResponses,
  totalScore,
  professionalNotes,
  setProfessionalNotes,
  onBack,
  onSave,
  onPdf,
  onJson,
  saving,
  generatingPdf,
  saved,
  assignmentId,
}: {
  ctx: AssistedRecordContext
  recordResponses: ReturnType<typeof buildRecordResponses>
  totalScore: number | null
  professionalNotes: string
  setProfessionalNotes: (v: string) => void
  onBack: () => void
  onSave: () => void
  onPdf: () => void
  onJson: () => void
  saving: boolean
  generatingPdf: boolean
  saved: boolean
  assignmentId: string
}) {
  const risk = detectImminentRisk(recordResponses)
  return (
    <div className="min-h-screen bg-[#FAF5EB]">
      <header
        className="border-b sticky top-0 z-20"
        style={{
          backgroundColor: CLINIC_BRANDING.colors.accent,
          borderColor: CLINIC_BRANDING.colors.secondary,
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <img
            src={CLINIC_BRANDING.logoUrl}
            alt={CLINIC_BRANDING.name}
            className="h-9 w-9 rounded-md object-contain"
          />
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: CLINIC_BRANDING.colors.dark }}>
              Resumo da Aplicação Assistida
            </p>
            <p className="text-xs" style={{ color: CLINIC_BRANDING.colors.medium }}>
              {ctx.scale.name} · {ctx.iniciais}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onBack} className="text-[#3E2723]">
            <ArrowLeft className="h-4 w-4 mr-1" /> Revisar
          </Button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {risk && (
          <div className="p-4 rounded-lg border-2 border-red-400 bg-red-50 text-red-900 text-sm">
            <p className="font-bold mb-1 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Risco iminente
            </p>
            <p>{risk}</p>
          </div>
        )}

        {/* Pontuação */}
        <Card
          className="border-2 shadow-sm"
          style={{ borderColor: CLINIC_BRANDING.colors.secondary, backgroundColor: '#fff' }}
        >
          <CardHeader>
            <CardTitle style={{ color: CLINIC_BRANDING.colors.primary }}>Pontuação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold" style={{ color: CLINIC_BRANDING.colors.dark }}>
                {totalScore ?? '—'}
              </span>
              <span className="text-sm" style={{ color: CLINIC_BRANDING.colors.medium }}>
                / {ctx.scale.maxTotal || 'manual'}
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: CLINIC_BRANDING.colors.medium }}>
              {totalScore === null
                ? 'Pontuação não calculada — itens manuais/não aplicados.'
                : 'Pontuação bruta. A interpretação requer validação do profissional.'}
            </p>
          </CardContent>
        </Card>

        {/* Itens e respostas */}
        <Card
          className="border-2 shadow-sm"
          style={{ borderColor: CLINIC_BRANDING.colors.secondary, backgroundColor: '#fff' }}
        >
          <CardHeader>
            <CardTitle style={{ color: CLINIC_BRANDING.colors.primary }}>
              Itens e Respostas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recordResponses.map((r, i) => (
              <div
                key={r.key}
                className="rounded-lg border p-3"
                style={{ borderColor: '#EFE6D6', backgroundColor: '#FFFCF6' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-xs font-semibold"
                    style={{ color: CLINIC_BRANDING.colors.medium }}
                  >
                    {i + 1}. [{r.domain}]
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {r.requiresManualScoring && (
                      <Badge
                        variant="outline"
                        className="border-rose-400 text-rose-700 text-[10px]"
                      >
                        Correção manual
                      </Badge>
                    )}
                    {r.requiresMaterial && (
                      <Badge
                        variant="outline"
                        className="border-amber-500 text-amber-700 text-[10px]"
                      >
                        Material
                      </Badge>
                    )}
                    {r.flags.map((f) => (
                      <Badge
                        key={f}
                        variant="outline"
                        className="border-slate-400 text-slate-600 text-[10px]"
                      >
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
                <p className="text-sm mt-1" style={{ color: CLINIC_BRANDING.colors.dark }}>
                  <span className="font-medium">Estímulo:</span> {r.stimulus}
                </p>
                <p className="text-sm" style={{ color: CLINIC_BRANDING.colors.dark }}>
                  <span className="font-medium">Resposta:</span>{' '}
                  {r.response ||
                    (r.numericValue === null ? '[ITEM NÃO APLICADO]' : '[SEM RESPOSTA LITERAL]')}
                </p>
                {(r.observation || r.flags.length > 0) && (
                  <p
                    className="text-xs mt-1 italic"
                    style={{ color: CLINIC_BRANDING.colors.medium }}
                  >
                    Obs: {(r.observation + ' ' + r.flags.join(' ')).trim()}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Observações do profissional */}
        <Card
          className="border-2 shadow-sm"
          style={{ borderColor: CLINIC_BRANDING.colors.secondary, backgroundColor: '#fff' }}
        >
          <CardHeader>
            <CardTitle style={{ color: CLINIC_BRANDING.colors.primary }}>
              Observações do Profissional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={professionalNotes}
              onChange={(e) => setProfessionalNotes(e.target.value)}
              placeholder="Registre observações clínicas, condições da aplicação, comportamento do paciente, etc."
              rows={4}
              className="bg-white border-2 focus-visible:ring-0"
              style={{ borderColor: CLINIC_BRANDING.colors.secondary }}
            />
          </CardContent>
        </Card>

        <Disclaimer />

        {/* Ações finais */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onSave}
            disabled={saving || saved}
            className="text-white"
            style={{ backgroundColor: CLINIC_BRANDING.colors.primary }}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saved ? 'Salvo para revisão' : 'Salvar para Revisão'}
          </Button>
          <Button
            onClick={onPdf}
            disabled={generatingPdf}
            variant="outline"
            className="border-[#C4A35A] text-[#7B5B3A]"
          >
            {generatingPdf ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            Gerar Registro PDF
          </Button>
          <Button variant="ghost" onClick={onJson} className="text-slate-600">
            Exportar JSON
          </Button>
        </div>
        <p className="text-xs" style={{ color: CLINIC_BRANDING.colors.medium }}>
          Assignment: {assignmentId}
        </p>
      </main>
    </div>
  )
}
