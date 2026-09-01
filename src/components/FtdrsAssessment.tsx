import { useState, useEffect, useRef } from 'react'
import {
  Loader2,
  RotateCcw,
  Eye,
  FileText,
  ArrowLeft,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AssessmentProgress } from '@/components/AssessmentProgress'
import { saveDementiaAssessment } from '@/services/dementia-assessments'
import { useSpeech } from '@/hooks/use-speech'
import {
  ftdrsItems,
  ftdrsDomains,
  ftdrsOptions,
  getFtdrsTotal,
  getFtdrsSeverity,
  getFtdrsOptionLabel,
  FTDRS_DRAFT_KEY,
  FTDRS_DISCLAIMER,
} from '@/lib/ftdrs-data'
import { useGuestScale } from '@/contexts/guest-scale-context'
import { returnToMinhasEscalas } from '@/lib/assessment-redirect'

const CARD_BG = { backgroundColor: 'rgba(17, 34, 64, 0.85)' }

export function FtdrsAssessment() {
  const guestId = useGuestScale()
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [showResult, setShowResult] = useState(false)
  const [saving, setSaving] = useState(false)
  const [speakingItem, setSpeakingItem] = useState<string | null>(null)
  const topRef = useRef<HTMLDivElement>(null)

  const { speak, cancelSpeak, speaking, ttsSupported } = useSpeech({
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

  useEffect(() => {
    try {
      const draft = localStorage.getItem(FTDRS_DRAFT_KEY)
      if (draft) setAnswers(JSON.parse(draft).answers || {})
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(FTDRS_DRAFT_KEY, JSON.stringify({ answers }))
    } catch {
      /* ignore */
    }
  }, [answers])

  const answeredCount = Object.keys(answers).length
  const totalScore = getFtdrsTotal(answers)
  const severity = getFtdrsSeverity(totalScore)

  const handleAnswer = (key: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    if (showResult) setShowResult(false)
  }

  const handleSubmit = async () => {
    setSaving(true)
    const responses = ftdrsItems.map((item) => ({
      question_key: item.key,
      question_label: item.text,
      response_value: answers[item.key] ?? 0,
    }))
    const ok = await saveDementiaAssessment('ftdrs', responses, totalScore, guestId)
    setSaving(false)
    if (ok) {
      localStorage.removeItem(FTDRS_DRAFT_KEY)
      setShowResult(true)
      setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
      toast.success('Avaliação FTDRS salva com sucesso!', {
        style: { background: '#00FFFF', color: '#0A192F', fontWeight: 600 },
      })
    } else {
      toast.error('Erro ao salvar avaliação.')
    }
  }

  const handleReset = () => {
    setAnswers({})
    setShowResult(false)
    localStorage.removeItem(FTDRS_DRAFT_KEY)
  }

  if (showResult) {
    return (
      <div ref={topRef} className="space-y-4 animate-fade-in-up">
        <div className="text-center py-4 rounded-xl border border-white/10" style={CARD_BG}>
          <p className="text-4xl font-bold" style={{ color: severity.color }}>
            {totalScore}
          </p>
          <p className="text-sm text-white/75 mt-1">Pontuação total (0-45)</p>
          <p className="text-lg font-semibold mt-2" style={{ color: severity.color }}>
            {severity.label}
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#00FFFF]" /> Detalhamento por questão
          </h3>
          {ftdrsItems.map((item, i) => (
            <div
              key={item.key}
              className="flex items-start justify-between gap-3 p-2.5 rounded-lg border border-white/10"
              style={CARD_BG}
            >
              <span className="text-xs text-white/85 flex-1">
                <span className="text-[#00FFFF] font-medium">{i + 1}.</span> {item.text}
              </span>
              <span className="text-xs font-medium text-[#00FFFF] whitespace-nowrap">
                {getFtdrsOptionLabel(answers[item.key] ?? -1)}
              </span>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-xs text-yellow-400/80 italic">{FTDRS_DISCLAIMER}</p>
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
      <div className="p-4 rounded-xl border border-[#00FFFF]/20 bg-[#00FFFF]/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#00FFFF] shrink-0" />
          <p className="text-xs text-white/90">
            <strong>FTDRS com Narração Integrada:</strong> você pode ouvir as perguntas lidas em voz
            alta ou responder diretamente pelas opções abaixo.
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
                  'Escala FTDRS para Demência Frontotemporal. Responda o nível de gravidade ou frequência de cada comportamento listado.',
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

      <AssessmentProgress answered={answeredCount} total={ftdrsItems.length} />
      {ftdrsDomains.map((domain) => {
        const domainItems = ftdrsItems.filter((i) => i.domain === domain.id)
        return (
          <div key={domain.id} className="space-y-2">
            <div className="pt-2">
              <h2 className="text-sm font-bold text-[#00FFFF]">{domain.title}</h2>
              <p className="text-xs text-white/75">{domain.description}</p>
            </div>
            {domainItems.map((item) => (
              <div
                key={item.key}
                className="p-4 sm:p-5 rounded-xl border border-white/10 transition-colors hover:border-[#00FFFF]/20 space-y-3"
                style={CARD_BG}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-white text-sm font-medium leading-relaxed">
                    <span className="text-[#00FFFF] font-bold mr-1">{item.label}.</span> {item.text}
                  </p>
                  {ttsSupported && (
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleSpeakItem(
                          item.key,
                          `${item.label}. ${item.text}. ${item.visualHint || ''}`,
                        )
                      }
                      className={cn(
                        'shrink-0 p-1.5 rounded-lg border transition-all text-xs flex items-center gap-1 cursor-pointer',
                        speaking && speakingItem === item.key
                          ? 'border-[#00FFFF] bg-[#00FFFF]/20 text-[#00FFFF]'
                          : 'border-white/10 text-white/60 hover:text-[#00FFFF] hover:border-[#00FFFF]/30',
                      )}
                      title="Ouvir pergunta"
                    >
                      {speaking && speakingItem === item.key ? (
                        <VolumeX className="h-3.5 w-3.5 text-[#00FFFF]" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Dica / Estímulo visual explicativo */}
                {item.visualHint && (
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/75 flex items-start gap-2">
                    <span className="text-[#00FFFF] font-semibold shrink-0 text-[11px] uppercase tracking-wide">
                      Exemplo clínico:
                    </span>
                    <span>{item.visualHint}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {ftdrsOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(item.key, opt.value)}
                      className={cn(
                        'px-3 py-2.5 rounded-lg text-xs font-medium transition-all border text-left',
                        answers[item.key] === opt.value
                          ? 'bg-[rgba(0,255,255,0.18)] border-[#00FFFF] text-[#00FFFF] shadow-[0_0_8px_rgba(0,255,255,0.25)]'
                          : 'border-white/10 text-white/85 hover:border-[#00FFFF]/30 hover:bg-white/5',
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
        disabled={answeredCount < ftdrsItems.length || saving}
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
