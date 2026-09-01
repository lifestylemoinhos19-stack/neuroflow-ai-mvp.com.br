import { useState, useEffect, useRef } from 'react'
import {
  Loader2,
  RotateCcw,
  Play,
  Timer,
  FileText,
  ArrowLeft,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { saveDementiaAssessment } from '@/services/dementia-assessments'
import { useSpeech } from '@/hooks/use-speech'
import {
  FAS_LETTERS,
  FAS_TIME_PER_LETTER,
  FAS_DISCLAIMER,
  calculateFasResult,
} from '@/lib/fas-data'
import { useGuestScale } from '@/contexts/guest-scale-context'
import { returnToMinhasEscalas } from '@/lib/assessment-redirect'

const CARD_BG = { backgroundColor: 'rgba(17, 34, 64, 0.85)' }

type Phase = 'intro' | 'F' | 'A' | 'S' | 'result'

export function FasAssessment() {
  const guestId = useGuestScale()
  const [phase, setPhase] = useState<Phase>('intro')
  const [timeLeft, setTimeLeft] = useState(FAS_TIME_PER_LETTER)
  const [words, setWords] = useState<Record<string, string>>({ F: '', A: '', S: '' })
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

  useEffect(() => {
    if (phase === 'intro' || phase === 'result') return
    if (timeLeft <= 0) {
      if (phase === 'F') {
        setPhase('A')
        setTimeLeft(FAS_TIME_PER_LETTER)
      } else if (phase === 'A') {
        setPhase('S')
        setTimeLeft(FAS_TIME_PER_LETTER)
      } else if (phase === 'S') {
        setPhase('result')
      }
      return
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [phase, timeLeft])

  const result = phase === 'result' ? calculateFasResult(words) : null

  const handleStart = () => {
    setPhase('F')
    setTimeLeft(FAS_TIME_PER_LETTER)
    speak('Letra F. Diga ou digite palavras com a letra F.')
  }

  const handleToggleMic = (letter: string) => {
    if (listening) {
      stopListening()
    } else {
      startListening((text) => {
        setWords((prev) => ({
          ...prev,
          [letter]: prev[letter] ? `${prev[letter]}\n${text}`.trim() : text,
        }))
      })
    }
  }

  const handleNext = () => {
    if (listening) stopListening()
    if (phase === 'F') {
      setPhase('A')
      setTimeLeft(FAS_TIME_PER_LETTER)
      speak('Letra A. Diga ou digite palavras com a letra A.')
    } else if (phase === 'A') {
      setPhase('S')
      setTimeLeft(FAS_TIME_PER_LETTER)
      speak('Letra S. Diga ou digite palavras com a letra S.')
    } else if (phase === 'S') {
      setPhase('result')
    }
  }

  const handleSubmit = async () => {
    if (!result) return
    setSaving(true)
    const responses = result.perLetter.map((r) => ({
      question_key: `fas_${r.letter.toLowerCase()}_words`,
      question_label: `Palavras geradas - Letra ${r.letter}`,
      response_value: JSON.stringify(r.words),
    }))
    const ok = await saveDementiaAssessment('fas', responses, result.totalUnique, guestId)
    setSaving(false)
    if (ok) {
      toast.success('Teste FAS salvo com sucesso!', {
        style: { background: '#00FFFF', color: '#0A192F', fontWeight: 600 },
      })
    } else {
      toast.error('Erro ao salvar avaliação.')
    }
  }

  const handleReset = () => {
    setPhase('intro')
    setWords({ F: '', A: '', S: '' })
    setTimeLeft(FAS_TIME_PER_LETTER)
  }

  if (phase === 'intro') {
    return (
      <div ref={topRef} className="space-y-4 animate-fade-in-up">
        <div className="p-6 rounded-xl border border-white/10 text-center" style={CARD_BG}>
          <Timer className="h-10 w-10 text-[#00FFFF] mx-auto mb-3" />
          <h2 className="text-white font-bold text-lg mb-2">Teste de Fluência Verbal FAS</h2>
          <p className="text-sm text-white/85 leading-relaxed">
            Você terá <strong className="text-[#00FFFF]">60 segundos</strong> para cada letra (F, A,
            S). Digite o máximo de palavras que conseguir, uma por linha. Não use nomes próprios,
            nomes de lugares ou variações da mesma palavra.
          </p>
          {ttsSupported && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (speaking) cancelSpeak()
                else
                  speak(
                    'Teste de Fluência Verbal FAS. Você terá 60 segundos para cada letra: F, A e S. Digite o máximo de palavras que conseguir, uma por linha. Não use nomes próprios, nomes de lugares ou variações da mesma palavra.',
                  )
              }}
              className="mt-3 text-[#00FFFF] hover:bg-[#00FFFF]/10 text-xs cursor-pointer"
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
          onClick={handleStart}
          size="lg"
          className="w-full bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-semibold"
        >
          <Play className="h-4 w-4 mr-2" /> Iniciar Teste
        </Button>
      </div>
    )
  }

  if (phase === 'result' && result) {
    return (
      <div ref={topRef} className="space-y-4 animate-fade-in-up">
        <div className="text-center py-4 rounded-xl border border-white/10" style={CARD_BG}>
          <p className="text-4xl font-bold text-[#00FFFF]">{result.totalUnique}</p>
          <p className="text-sm text-white/75 mt-1">Total de palavras válidas únicas</p>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#00FFFF]" /> Resultado por letra
          </h3>
          {result.perLetter.map((r) => (
            <div
              key={r.letter}
              className="flex items-center justify-between p-3 rounded-lg border border-white/10"
              style={CARD_BG}
            >
              <span className="text-white font-bold text-lg">Letra {r.letter}</span>
              <div className="text-right">
                <p className="text-[#00FFFF] font-bold text-xl">{r.uniqueValid}</p>
                <p className="text-xs text-white/70">
                  {r.validWords} válidas / {r.totalEntered} digitadas
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-xs text-yellow-400/80 italic">{FAS_DISCLAIMER}</p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-medium"
        >
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Salvar Resultados
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

  const currentLetter = phase as 'F' | 'A' | 'S'
  const letterIndex = FAS_LETTERS.indexOf(currentLetter)
  return (
    <div ref={topRef} className="space-y-4">
      <div className="flex items-center justify-center gap-2">
        {FAS_LETTERS.map((l, i) => (
          <div
            key={l}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border',
              i < letterIndex
                ? 'bg-[#00FFFF]/20 border-[#00FFFF]/40 text-[#00FFFF]'
                : i === letterIndex
                  ? 'bg-[#00FFFF] border-[#00FFFF] text-[#0A192F]'
                  : 'border-white/10 text-white/70',
            )}
          >
            {l}
          </div>
        ))}
      </div>
      <div className="text-center py-6 rounded-xl border border-white/10" style={CARD_BG}>
        <p className="text-xs text-white/70 mb-1">Letra atual</p>
        <p className="text-6xl font-bold text-[#00FFFF] mb-2">{currentLetter}</p>
        <p className="text-3xl font-bold text-white">{timeLeft}s</p>
        {ttsSupported && (
          <button
            type="button"
            onClick={() => {
              if (speaking) cancelSpeak()
              else speak(`Letra ${currentLetter}. Restam ${timeLeft} segundos.`)
            }}
            className="mt-2 text-xs text-white/60 hover:text-[#00FFFF] inline-flex items-center gap-1 cursor-pointer"
          >
            <Volume2 className="h-3 w-3" /> Ouvir letra atual
          </button>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/70">Palavras com a letra {currentLetter}:</span>
          {sttSupported && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleToggleMic(currentLetter)}
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
              {listening ? 'Gravando voz...' : 'Falar Palavras (Microfone)'}
            </Button>
          )}
        </div>
        <Textarea
          value={words[currentLetter]}
          onChange={(e) => setWords((prev) => ({ ...prev, [currentLetter]: e.target.value }))}
          placeholder={`Digite ou fale palavras começando com "${currentLetter}" — uma por linha...`}
          className="min-h-[200px] bg-[rgba(17,34,64,0.85)] border-white/10 text-white"
        />
      </div>
      <Button
        onClick={handleNext}
        variant="outline"
        className="w-full border-white/20 text-white hover:bg-white/10"
      >
        {phase === 'S' ? 'Finalizar' : 'Próxima Letra'}
      </Button>
    </div>
  )
}
