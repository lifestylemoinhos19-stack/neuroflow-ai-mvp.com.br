import { useState, useEffect, useRef } from 'react'
import {
  Loader2,
  RotateCcw,
  Play,
  Timer,
  FileText,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useSpeech } from '@/hooks/use-speech'
import { useGuestScale } from '@/contexts/guest-scale-context'
import { saveDementiaAssessment } from '@/services/dementia-assessments'
import {
  calculateSemanticFluencyResult,
  SEMANTIC_FLUENCY_DISCLAIMER,
  SEMANTIC_FLUENCY_KEYS,
  type SemanticFluencyResult,
} from '@/lib/semantic-fluency-data'

const CARD_BG = { backgroundColor: 'rgba(17, 34, 64, 0.85)' }
const TIME_PER_CATEGORY = 60

type Phase =
  | 'intro'
  | 'animais_ready'
  | 'animais_running'
  | 'animais_done'
  | 'frutas_ready'
  | 'frutas_running'
  | 'result'

export function SemanticFluencyAssessment() {
  const guestId = useGuestScale()
  const [phase, setPhase] = useState<Phase>('intro')
  const [timeLeft, setTimeLeft] = useState(TIME_PER_CATEGORY)

  const [animaisWords, setAnimaisWords] = useState('')
  const [frutasWords, setFrutasWords] = useState('')
  const [saving, setSaving] = useState(false)
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
  } = useSpeech({ lang: 'pt-BR' })

  // Cronômetro 60s
  useEffect(() => {
    if (phase !== 'animais_running' && phase !== 'frutas_running') return
    if (timeLeft <= 0) {
      if (phase === 'animais_running') {
        setPhase('animais_done')
        speak('Tempo esgotado para animais. Prepare-se para a categoria frutas.')
      } else if (phase === 'frutas_running') {
        setPhase('result')
        speak('Tempo esgotado. Teste de fluência semântica concluído.')
      }
      return
    }

    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [phase, timeLeft])

  const computedResult: SemanticFluencyResult | null =
    phase === 'result' ? calculateSemanticFluencyResult(animaisWords, frutasWords) : null

  const handleToggleMic = (category: 'animais' | 'frutas') => {
    if (listening) {
      stopListening()
    } else {
      startListening((text) => {
        if (category === 'animais') {
          setAnimaisWords((prev) => (prev ? `${prev}\n${text}`.trim() : text))
        } else {
          setFrutasWords((prev) => (prev ? `${prev}\n${text}`.trim() : text))
        }
      })
    }
  }

  const handleStartAnimais = () => {
    setPhase('animais_running')
    setTimeLeft(TIME_PER_CATEGORY)
    speak(
      'Categoria Animais. Diga ou digite o maior número de animais em 60 segundos. Pode começar.',
    )
  }

  const handleFinishAnimais = () => {
    if (listening) stopListening()
    setPhase('animais_done')
    speak('Primeira etapa concluída. Prepare-se para a categoria Frutas.')
  }

  const handleStartFrutas = () => {
    setPhase('frutas_running')
    setTimeLeft(TIME_PER_CATEGORY)
    speak('Categoria Frutas. Diga ou digite o maior número de frutas em 60 segundos. Pode começar.')
  }

  const handleFinishFrutas = () => {
    if (listening) stopListening()
    setPhase('result')
    speak('Teste de fluência semântica concluído.')
  }

  const handleSubmit = async () => {
    if (!computedResult) return
    setSaving(true)

    const responses = [
      {
        question_key: SEMANTIC_FLUENCY_KEYS.ANIMAIS_WORDS,
        question_label: 'Fluência Semântica - Animais (Palavras)',
        response_value: JSON.stringify(computedResult.animals.words),
      },
      {
        question_key: SEMANTIC_FLUENCY_KEYS.ANIMAIS_COUNT,
        question_label: 'Fluência Semântica - Animais (Total Válido)',
        response_value: computedResult.animals.uniqueCount,
      },
      {
        question_key: SEMANTIC_FLUENCY_KEYS.FRUTAS_WORDS,
        question_label: 'Fluência Semântica - Frutas (Palavras)',
        response_value: JSON.stringify(computedResult.fruits.words),
      },
      {
        question_key: SEMANTIC_FLUENCY_KEYS.FRUTAS_COUNT,
        question_label: 'Fluência Semântica - Frutas (Total Válido)',
        response_value: computedResult.fruits.uniqueCount,
      },
      {
        question_key: SEMANTIC_FLUENCY_KEYS.TOTAL,
        question_label: 'Fluência Semântica - Total Combinado',
        response_value: computedResult.totalUnique,
      },
      {
        question_key: 'fluencia_semantica_classification',
        question_label: 'Fluência Semântica - Classificação Geral',
        response_value: computedResult.globalClassification,
      },
    ]

    const ok = await saveDementiaAssessment(
      'fas' as any,
      responses,
      computedResult.totalUnique,
      guestId,
    )
    setSaving(false)

    if (ok) {
      toast.success('Fluência Verbal Semântica salva com sucesso!', {
        style: { background: '#00FFFF', color: '#0A192F', fontWeight: 600 },
      })
    } else {
      toast.error('Erro ao salvar fluência verbal semântica.')
    }
  }

  const handleReset = () => {
    setPhase('intro')
    setAnimaisWords('')
    setFrutasWords('')
    setTimeLeft(TIME_PER_CATEGORY)
  }

  /* ---- TELA DE INTRODUÇÃO ---- */
  if (phase === 'intro') {
    return (
      <div ref={topRef} className="space-y-4 animate-fade-in-up">
        <div className="p-6 rounded-xl border border-white/10 text-center" style={CARD_BG}>
          <Timer className="h-10 w-10 text-[#00FFFF] mx-auto mb-3" />
          <h2 className="text-white font-bold text-lg mb-2">
            Fluência Verbal por Categorias Semânticas
          </h2>
          <p className="text-sm text-white/85 leading-relaxed max-w-xl mx-auto">
            Você terá <strong className="text-[#00FFFF]">60 segundos</strong> para cada categoria
            temática:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-left">
            <div className="p-3 rounded-lg border border-white/10 bg-white/5">
              <span className="font-bold text-[#00FFFF] block mb-1">1. Animais (60 segundos)</span>
              <p className="text-xs text-white/70">
                Cite o maior número possível de animais (cão, gato, leão...).
                <br />
                <span className="text-emerald-400">&gt;15 preservado</span> |{' '}
                <span className="text-amber-400">12–14 limítrofe</span> |{' '}
                <span className="text-red-400">&lt;12 rebaixado</span>
              </p>
            </div>
            <div className="p-3 rounded-lg border border-white/10 bg-white/5">
              <span className="font-bold text-[#00FFFF] block mb-1">2. Frutas (60 segundos)</span>
              <p className="text-xs text-white/70">
                Cite o maior número possível de frutas (maçã, banana, uva...).
                <br />
                <span className="text-emerald-400">&gt;12 preservado</span> |{' '}
                <span className="text-amber-400">9–11 limítrofe</span> |{' '}
                <span className="text-red-400">&lt;9 rebaixado</span>
              </p>
            </div>
          </div>

          {ttsSupported && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (speaking) cancelSpeak()
                else
                  speak(
                    'Teste de Fluência Verbal Semântica. Você terá 60 segundos para citar o máximo de animais que conseguir e depois 60 segundos para citar frutas. Digite ou fale as palavras.',
                  )
              }}
              className="mt-4 text-[#00FFFF] hover:bg-[#00FFFF]/10 text-xs cursor-pointer"
            >
              {speaking ? (
                <>
                  <VolumeX className="h-3.5 w-3.5 mr-1 text-red-400" /> Parar Narração
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5 mr-1" /> Ouvir Instruções
                </>
              )}
            </Button>
          )}
        </div>

        <Button
          onClick={() => setPhase('animais_ready')}
          size="lg"
          className="w-full bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-semibold"
        >
          <Play className="h-4 w-4 mr-2" /> Iniciar Teste (Categoria 1: Animais)
        </Button>
      </div>
    )
  }

  /* ---- ANIMAIS: PRONTO OU RODANDO ---- */
  if (phase === 'animais_ready' || phase === 'animais_running') {
    return (
      <div ref={topRef} className="space-y-4 animate-fade-in-up">
        <div className="text-center py-6 rounded-xl border border-white/10" style={CARD_BG}>
          <Badge className="bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/40 mb-2">
            Etapa 1 de 2: Categoria Semântica
          </Badge>
          <h2 className="text-3xl font-bold text-[#00FFFF] mb-1">ANIMAIS</h2>
          <p className="text-xs text-white/70 mb-4">
            Digite ou fale nomes de animais — um por linha
          </p>

          <div className="my-4">
            <span className="text-6xl font-mono font-bold text-white">{timeLeft}s</span>
            <p className="text-xs text-white/50 mt-1">Tempo restante</p>
          </div>

          {phase === 'animais_ready' ? (
            <Button
              onClick={handleStartAnimais}
              size="lg"
              className="mt-2 bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-bold"
            >
              <Play className="h-4 w-4 mr-2" /> Iniciar Cronômetro (60s)
            </Button>
          ) : (
            <Button
              onClick={handleFinishAnimais}
              variant="outline"
              size="sm"
              className="mt-2 border-white/20 text-white hover:bg-white/10"
            >
              Concluir Etapa Antes do Tempo
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {sttSupported && phase === 'animais_running' && (
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleToggleMic('animais')}
                className={cn(
                  'text-xs border transition-all',
                  listening
                    ? 'border-red-500 bg-red-500/20 text-red-300 animate-pulse'
                    : 'border-[#00FFFF]/40 text-[#00FFFF] hover:bg-[#00FFFF]/10',
                )}
              >
                {listening ? (
                  <MicOff className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <Mic className="h-3.5 w-3.5 mr-1" />
                )}
                {listening ? 'Ouvindo animais...' : 'Falar Nomes de Animais (Microfone)'}
              </Button>
            </div>
          )}
          <Textarea
            value={animaisWords}
            onChange={(e) => setAnimaisWords(e.target.value)}
            placeholder="Exemplo:\ncachorro\ngato\nelefante\nleão\n..."
            disabled={phase === 'animais_ready'}
            className="min-h-[180px] bg-[rgba(17,34,64,0.85)] border-white/10 text-white font-medium"
          />
        </div>
      </div>
    )
  }

  /* ---- TRANSIÇÃO ENTRE ANIMAIS E FRUTAS ---- */
  if (phase === 'animais_done') {
    return (
      <div ref={topRef} className="space-y-4 animate-fade-in-up">
        <div className="p-6 rounded-xl border border-white/10 text-center" style={CARD_BG}>
          <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
          <h2 className="text-white font-bold text-lg mb-1">Categoria Animais Concluída!</h2>
          <p className="text-xs text-white/70 mb-6">
            Prepare-se para a segunda etapa. Na próxima etapa você terá 60 segundos para citar nomes
            de FRUTAS.
          </p>

          <Button
            onClick={() => {
              setPhase('frutas_ready')
              setTimeLeft(TIME_PER_CATEGORY)
            }}
            size="lg"
            className="w-full bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-bold"
          >
            <Play className="h-4 w-4 mr-2" /> Prosseguir para Categoria FRUTAS
          </Button>
        </div>
      </div>
    )
  }

  /* ---- FRUTAS: PRONTO OU RODANDO ---- */
  if (phase === 'frutas_ready' || phase === 'frutas_running') {
    return (
      <div ref={topRef} className="space-y-4 animate-fade-in-up">
        <div className="text-center py-6 rounded-xl border border-white/10" style={CARD_BG}>
          <Badge className="bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/40 mb-2">
            Etapa 2 de 2: Categoria Semântica
          </Badge>
          <h2 className="text-3xl font-bold text-[#00FFFF] mb-1">FRUTAS</h2>
          <p className="text-xs text-white/70 mb-4">
            Digite ou fale nomes de frutas — um por linha
          </p>

          <div className="my-4">
            <span className="text-6xl font-mono font-bold text-white">{timeLeft}s</span>
            <p className="text-xs text-white/50 mt-1">Tempo restante</p>
          </div>

          {phase === 'frutas_ready' ? (
            <Button
              onClick={handleStartFrutas}
              size="lg"
              className="mt-2 bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-bold"
            >
              <Play className="h-4 w-4 mr-2" /> Iniciar Cronômetro (60s)
            </Button>
          ) : (
            <Button
              onClick={handleFinishFrutas}
              variant="outline"
              size="sm"
              className="mt-2 border-white/20 text-white hover:bg-white/10"
            >
              Concluir e Ver Resultados
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {sttSupported && phase === 'frutas_running' && (
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleToggleMic('frutas')}
                className={cn(
                  'text-xs border transition-all',
                  listening
                    ? 'border-red-500 bg-red-500/20 text-red-300 animate-pulse'
                    : 'border-[#00FFFF]/40 text-[#00FFFF] hover:bg-[#00FFFF]/10',
                )}
              >
                {listening ? (
                  <MicOff className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <Mic className="h-3.5 w-3.5 mr-1" />
                )}
                {listening ? 'Ouvindo frutas...' : 'Falar Nomes de Frutas (Microfone)'}
              </Button>
            </div>
          )}
          <Textarea
            value={frutasWords}
            onChange={(e) => setFrutasWords(e.target.value)}
            placeholder="Exemplo:\nmaçã\nbanana\nuva\nabacaxi\n..."
            disabled={phase === 'frutas_ready'}
            className="min-h-[180px] bg-[rgba(17,34,64,0.85)] border-white/10 text-white font-medium"
          />
        </div>
      </div>
    )
  }

  /* ---- RESULTADO CONSOLIDADO ---- */
  if (phase === 'result' && computedResult) {
    return (
      <div ref={topRef} className="space-y-4 animate-fade-in-up">
        <div className="p-5 rounded-xl border border-white/10 text-center" style={CARD_BG}>
          <h2 className="text-white font-bold text-lg mb-1">
            Resultado da Fluência Verbal Semântica
          </h2>
          <p className="text-xs text-white/70">
            Acesso léxico e memória semântica (60s cada categoria)
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div className="p-3 rounded-lg border border-white/10 bg-white/5 text-center">
              <span className="text-xs text-white/60 block">Animais</span>
              <span className="text-2xl font-mono font-bold text-[#00FFFF]">
                {computedResult.animals.uniqueCount}
              </span>
              <p
                className="text-[11px] mt-1 font-semibold"
                style={{ color: computedResult.animals.classification.color }}
              >
                {computedResult.animals.classification.label}
              </p>
            </div>

            <div className="p-3 rounded-lg border border-white/10 bg-white/5 text-center">
              <span className="text-xs text-white/60 block">Frutas</span>
              <span className="text-2xl font-mono font-bold text-[#00FFFF]">
                {computedResult.fruits.uniqueCount}
              </span>
              <p
                className="text-[11px] mt-1 font-semibold"
                style={{ color: computedResult.fruits.classification.color }}
              >
                {computedResult.fruits.classification.label}
              </p>
            </div>

            <div className="p-3 rounded-lg border border-white/10 bg-white/5 text-center">
              <span className="text-xs text-white/60 block">Total Semântico</span>
              <span className="text-2xl font-mono font-bold text-amber-400">
                {computedResult.totalUnique}
              </span>
              <p className="text-[11px] text-white/60 mt-1">Palavras válidas únicas</p>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg border border-[#00FFFF]/20 bg-[#00FFFF]/5 text-left">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#00FFFF]">
              Classificação Geral:
            </span>
            <p className="text-sm font-medium text-white mt-1">
              {computedResult.globalClassification}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-400/90 italic">{SEMANTIC_FLUENCY_DISCLAIMER}</p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-bold"
        >
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Salvar Resultados da Fluência Semântica
        </Button>

        <Button
          onClick={handleReset}
          variant="outline"
          className="w-full border-white/20 text-white hover:bg-white/10"
        >
          <RotateCcw className="h-4 w-4 mr-2" /> Refazer Teste
        </Button>
      </div>
    )
  }

  return null
}
