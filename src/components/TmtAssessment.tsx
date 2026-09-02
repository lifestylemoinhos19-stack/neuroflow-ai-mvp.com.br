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
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSpeech } from '@/hooks/use-speech'
import { useGuestScale } from '@/contexts/guest-scale-context'
import { returnToMinhasEscalas } from '@/lib/assessment-redirect'
import { saveDementiaAssessment } from '@/services/dementia-assessments'
import { calculateTmtResult, TMT_DISCLAIMER, TMT_KEYS, type TmtResult } from '@/lib/tmt-data'
import { InteractiveTrail } from '@/components/InteractiveTrail'

const CARD_BG = { backgroundColor: 'rgba(17, 34, 64, 0.85)' }

type Phase =
  | 'intro'
  | 'partA_ready'
  | 'partA_running'
  | 'partA_done'
  | 'partB_ready'
  | 'partB_running'
  | 'result'

export function TmtAssessment() {
  const guestId = useGuestScale()
  const [phase, setPhase] = useState<Phase>('intro')

  // Cronômetros
  const [timeA, setTimeA] = useState<number>(0)
  const [timeB, setTimeB] = useState<number>(0)
  const [errorsA, setErrorsA] = useState<number>(0)
  const [errorsB, setErrorsB] = useState<number>(0)

  // Modo manual de entrada caso o profissional/paciente já tenha os tempos
  const [manualMode, setManualMode] = useState(false)
  const [manualTimeA, setManualTimeA] = useState('')
  const [manualTimeB, setManualTimeB] = useState('')
  const [manualErrorsA, setManualErrorsA] = useState('0')
  const [manualErrorsB, setManualErrorsB] = useState('0')

  const [saving, setSaving] = useState(false)
  const [timerRunning, setTimerRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const topRef = useRef<HTMLDivElement>(null)

  const { speak, cancelSpeak, speaking, ttsSupported } = useSpeech({ lang: 'pt-BR' })

  const timerStartTimestampRef = useRef<number>(0)

  // Cronômetro ativo com timestamp absoluto
  useEffect(() => {
    if (timerRunning) {
      timerStartTimestampRef.current = Date.now()
      timerRef.current = setInterval(() => {
        const elapsed = Math.max(
          0,
          Math.floor((Date.now() - timerStartTimestampRef.current) / 1000),
        )
        if (phase === 'partA_running') {
          setTimeA(elapsed)
        } else if (phase === 'partB_running') {
          setTimeB(elapsed)
        }
      }, 250)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [timerRunning, phase])

  const computedResult: TmtResult | null =
    phase === 'result'
      ? calculateTmtResult(
          manualMode ? Math.max(1, parseInt(manualTimeA, 10) || 0) : timeA,
          manualMode ? Math.max(1, parseInt(manualTimeB, 10) || 0) : timeB,
          manualMode ? parseInt(manualErrorsA, 10) || 0 : errorsA,
          manualMode ? parseInt(manualErrorsB, 10) || 0 : errorsB,
        )
      : null

  const handleStartPartA = () => {
    setPhase('partA_running')
    setTimeA(0)
    setTimerRunning(true)
    speak('Iniciando Parte A. Conecte os números em ordem de 1 a 25 o mais rápido possível.')
  }

  const handleStopPartA = () => {
    setTimerRunning(false)
    setPhase('partA_done')
    speak(`Parte A concluída em ${timeA} segundos. Prepare-se para a Parte B.`)
  }

  const handleStartPartB = () => {
    setPhase('partB_running')
    setTimeB(0)
    setTimerRunning(true)
    speak(
      'Iniciando Parte B. Alterne números e letras: 1-A-2-B-3-C até o final o mais rápido possível.',
    )
  }

  const handleStopPartB = () => {
    setTimerRunning(false)
    setPhase('result')
    speak(`Parte B concluída em ${timeB} segundos. Veja o resultado consolidado.`)
  }

  const handleCalculateManual = () => {
    const tA = parseInt(manualTimeA, 10)
    const tB = parseInt(manualTimeB, 10)
    if (isNaN(tA) || tA <= 0 || isNaN(tB) || tB <= 0) {
      toast.error('Informe tempos válidos em segundos para a Parte A e Parte B.')
      return
    }
    setPhase('result')
  }

  const handleSubmit = async () => {
    if (!computedResult) return
    setSaving(true)

    const responses = [
      {
        question_key: TMT_KEYS.TIME_A,
        question_label: 'TMT Parte A - Tempo (segundos)',
        response_value: computedResult.timeA,
      },
      {
        question_key: TMT_KEYS.TIME_B,
        question_label: 'TMT Parte B - Tempo (segundos)',
        response_value: computedResult.timeB,
      },
      {
        question_key: TMT_KEYS.DIFF_BA,
        question_label: 'TMT Diferencial (Tempo B - Tempo A em segundos)',
        response_value: computedResult.diffBA,
      },
      {
        question_key: TMT_KEYS.ERRORS_A,
        question_label: 'TMT Parte A - Erros',
        response_value: computedResult.errorsA,
      },
      {
        question_key: TMT_KEYS.ERRORS_B,
        question_label: 'TMT Parte B - Erros',
        response_value: computedResult.errorsB,
      },
      {
        question_key: 'tmt_classification',
        question_label: 'TMT Classificação Geral',
        response_value: computedResult.globalClassification,
      },
    ]

    // Salva pontuação consolidada (tempo total em segundos ou diff)
    const ok = await saveDementiaAssessment('tmt' as any, responses, computedResult.timeB, guestId)
    setSaving(false)

    if (ok) {
      toast.success('Teste TMT A/B salvo com sucesso!', {
        style: { background: '#00FFFF', color: '#0A192F', fontWeight: 600 },
      })
    } else {
      toast.error('Erro ao salvar avaliação do TMT.')
    }
  }

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimerRunning(false)
    setPhase('intro')
    setTimeA(0)
    setTimeB(0)
    setErrorsA(0)
    setErrorsB(0)
    setManualTimeA('')
    setManualTimeB('')
    setManualErrorsA('0')
    setManualErrorsB('0')
  }

  /* ---- TELA DE INTRODUÇÃO ---- */
  if (phase === 'intro') {
    return (
      <div ref={topRef} className="space-y-4 animate-fade-in-up">
        <div className="p-6 rounded-xl border border-white/10 text-center" style={CARD_BG}>
          <Timer className="h-10 w-10 text-[#00FFFF] mx-auto mb-3" />
          <h2 className="text-white font-bold text-lg mb-2">
            Trail Making Test (TMT Partes A e B)
          </h2>
          <p className="text-sm text-white/85 leading-relaxed max-w-xl mx-auto">
            O TMT é um teste neuropsicológico cronometrado em{' '}
            <strong className="text-[#00FFFF]">segundos</strong>:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-left">
            <div className="p-3 rounded-lg border border-white/10 bg-white/5">
              <span className="font-bold text-[#00FFFF] block mb-1">
                Parte A (Atenção e Velocidade)
              </span>
              <p className="text-xs text-white/70">
                Conecte os números em sequência: 1 &rarr; 2 &rarr; 3 ... até 25.
                <br />
                <span className="text-emerald-400">≤29s preservado</span> |{' '}
                <span className="text-amber-400">30–78s limítrofe</span> |{' '}
                <span className="text-red-400">&gt;78s lentificação</span>
              </p>
            </div>
            <div className="p-3 rounded-lg border border-white/10 bg-white/5">
              <span className="font-bold text-[#00FFFF] block mb-1">
                Parte B (Flexibilidade e Alternância)
              </span>
              <p className="text-xs text-white/70">
                Alterne entre números e letras: 1 &rarr; A &rarr; 2 &rarr; B ... até 13.
                <br />
                <span className="text-emerald-400">≤75s preservado</span> |{' '}
                <span className="text-amber-400">76–272s lentificação leve/mod</span> |{' '}
                <span className="text-red-400">&gt;272s déficit executivo</span>
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
                    'Trail Making Test. Na Parte A, conecte os círculos de 1 a 25 em ordem crescente o mais rápido possível. Na Parte B, alterne números e letras: 1-A-2-B-3-C até o final. O teste é cronometrado em segundos.',
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

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => {
              setManualMode(false)
              setPhase('partA_ready')
            }}
            size="lg"
            className="flex-1 bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-semibold"
          >
            <Play className="h-4 w-4 mr-2" /> Iniciar com Cronômetro Integrado
          </Button>
          <Button
            onClick={() => {
              setManualMode(true)
              setPhase('intro')
            }}
            variant="outline"
            className="border-[#00FFFF]/40 text-[#00FFFF] hover:bg-[#00FFFF]/10"
          >
            Digitar Tempos Já Medidos
          </Button>
        </div>

        {manualMode && (
          <Card className="border-[#00FFFF]/30 bg-[rgba(17,34,64,0.9)] mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white">
                Entrada Direta de Tempos (Segundos)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-white text-xs">Tempo Parte A (segundos)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 25"
                    value={manualTimeA}
                    onChange={(e) => setManualTimeA(e.target.value)}
                    className="bg-slate-900 border-white/20 text-white"
                  />
                  <p className="text-[11px] text-white/50">
                    Corte: ≤29s (preservado) | 30-78s (limítrofe)
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white text-xs">Erros Parte A</Label>
                  <Input
                    type="number"
                    value={manualErrorsA}
                    onChange={(e) => setManualErrorsA(e.target.value)}
                    className="bg-slate-900 border-white/20 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white text-xs">Tempo Parte B (segundos)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 65"
                    value={manualTimeB}
                    onChange={(e) => setManualTimeB(e.target.value)}
                    className="bg-slate-900 border-white/20 text-white"
                  />
                  <p className="text-[11px] text-white/50">
                    Corte: ≤75s (preservado) | 76-272s (lentificação)
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white text-xs">Erros Parte B</Label>
                  <Input
                    type="number"
                    value={manualErrorsB}
                    onChange={(e) => setManualErrorsB(e.target.value)}
                    className="bg-slate-900 border-white/20 text-white"
                  />
                </div>
              </div>

              <Button
                onClick={handleCalculateManual}
                className="w-full bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-bold"
              >
                Calcular e Classificar Desempenho
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  /* ---- PARTE A: PRONTO OU RODANDO ---- */
  if (phase === 'partA_ready' || phase === 'partA_running') {
    return (
      <div ref={topRef} className="space-y-4 animate-fade-in-up">
        <div className="p-4 sm:p-6 rounded-xl border border-white/10" style={CARD_BG}>
          <div className="flex items-center justify-between mb-3">
            <Badge className="bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/40">
              Etapa 1 de 2: TMT Parte A
            </Badge>
            <span className="text-xs text-white/70">
              Corte esperado: <strong className="text-emerald-400">≤ 29s</strong>
            </span>
          </div>

          <h2 className="text-white font-bold text-lg sm:text-xl mb-1">
            Parte A: Toque nos números de 1 a 25 na sequência
          </h2>
          <p className="text-xs text-white/75 mb-4">
            Conecte os círculos numerados na ordem correta o mais rapidamente possível. O cronômetro
            e a contagem de erros são automáticos na tela.
          </p>

          {/* Trilha Interativa 1 a 25 na Tela */}
          <div className="my-2">
            <InteractiveTrail
              variant="tmt_a"
              onProgress={(completed, errs) => {
                setErrorsA(errs)
              }}
              onComplete={({ timeSeconds, errors: errs }) => {
                setTimeA(timeSeconds)
                setErrorsA(errs)
                setPhase('partA_done')
                speak(
                  `Parte A concluída em ${timeSeconds} segundos com ${errs} erro(s). Prepare-se para a Parte B.`,
                )
                toast.success(`Parte A concluída com sucesso em ${timeSeconds}s!`)
              }}
            />
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-white/70">Ajuste manual de erros se necessário:</span>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-6 w-6 border-white/20 text-white"
                onClick={() => setErrorsA((e) => Math.max(0, e - 1))}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="font-mono text-amber-400 font-bold">{errorsA}</span>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-6 w-6 border-white/20 text-white"
                onClick={() => setErrorsA((e) => e + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (timeA === 0) setTimeA(30)
                setPhase('partA_done')
              }}
              className="text-slate-400 hover:text-white text-xs"
            >
              Avançar para Parte B diretamente &rarr;
            </Button>
          </div>
        </div>
      </div>
    )
  }

  /* ---- PARTE A CONCLUÍDA / TRANSIÇÃO PARA PARTE B ---- */
  if (phase === 'partA_done') {
    return (
      <div ref={topRef} className="space-y-4 animate-fade-in-up">
        <div className="p-6 rounded-xl border border-white/10 text-center" style={CARD_BG}>
          <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
          <h2 className="text-white font-bold text-lg mb-1">Parte A Finalizada com Sucesso!</h2>
          <p className="text-sm text-[#00FFFF] font-mono font-bold mb-4">
            {timeA} segundos ({errorsA} erros)
          </p>

          <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-left mb-6">
            <h3 className="text-sm font-bold text-white mb-1">
              Agora: Parte B (Alternância 1-A-2-B...)
            </h3>
            <p className="text-xs text-white/70">
              Na Parte B, o paciente deve alternar números e letras em ordem crescente (1 &rarr; A
              &rarr; 2 &rarr; B &rarr; 3 &rarr; C ...). Clique no botão abaixo assim que estiver
              pronto para iniciar o cronômetro da Parte B.
            </p>
          </div>

          <Button
            onClick={handleStartPartB}
            size="lg"
            className="w-full bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-bold"
          >
            <Play className="h-4 w-4 mr-2" /> Iniciar Cronômetro da Parte B
          </Button>
        </div>
      </div>
    )
  }

  /* ---- PARTE B RODANDO ---- */
  if (phase === 'partB_running' || phase === 'partB_ready') {
    return (
      <div ref={topRef} className="space-y-4 animate-fade-in-up">
        <div className="p-4 sm:p-6 rounded-xl border border-white/10" style={CARD_BG}>
          <div className="flex items-center justify-between mb-3">
            <Badge className="bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/40">
              Etapa 2 de 2: TMT Parte B
            </Badge>
            <span className="text-xs text-white/70">
              Corte esperado: <strong className="text-emerald-400">≤ 75s</strong>
            </span>
          </div>

          <h2 className="text-white font-bold text-lg sm:text-xl mb-1">
            Parte B: Alterne Números e Letras (1 &rarr; A &rarr; 2 &rarr; B ... 13)
          </h2>
          <p className="text-xs text-white/75 mb-4">
            Toque alternando número e letra em ordem alfanumérica crescente. O cronômetro e a
            contagem de erros funcionam em tempo real.
          </p>

          {/* Trilha Interativa Parte B na Tela */}
          <div className="my-2">
            <InteractiveTrail
              variant="tmt_b"
              onProgress={(completed, errs) => {
                setErrorsB(errs)
              }}
              onComplete={({ timeSeconds, errors: errs }) => {
                setTimeB(timeSeconds)
                setErrorsB(errs)
                setPhase('result')
                speak(
                  `Parte B concluída em ${timeSeconds} segundos com ${errs} erro(s). Veja seu relatório consolidado.`,
                )
                toast.success(`Parte B concluída com sucesso em ${timeSeconds}s!`)
              }}
            />
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-white/70">Ajuste manual de erros se necessário:</span>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-6 w-6 border-white/20 text-white"
                onClick={() => setErrorsB((e) => Math.max(0, e - 1))}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="font-mono text-amber-400 font-bold">{errorsB}</span>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-6 w-6 border-white/20 text-white"
                onClick={() => setErrorsB((e) => e + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (timeB === 0) setTimeB(70)
                setPhase('result')
              }}
              className="text-slate-400 hover:text-white text-xs"
            >
              Concluir e gerar resultado &rarr;
            </Button>
          </div>
        </div>
      </div>
    )
  }

  /* ---- TELA DE RESULTADOS ---- */
  if (phase === 'result' && computedResult) {
    return (
      <div ref={topRef} className="space-y-4 animate-fade-in-up">
        <div className="p-5 rounded-xl border border-white/10 text-center" style={CARD_BG}>
          <h2 className="text-white font-bold text-lg mb-1">
            Resultado do Trail Making Test (TMT)
          </h2>
          <p className="text-xs text-white/70">Atenção visual e flexibilidade executiva</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div className="p-3 rounded-lg border border-white/10 bg-white/5 text-center">
              <span className="text-xs text-white/60 block">Parte A</span>
              <span className="text-2xl font-mono font-bold text-[#00FFFF]">
                {computedResult.timeA}s
              </span>
              <p
                className="text-[11px] mt-1 font-semibold"
                style={{ color: computedResult.classA.color }}
              >
                {computedResult.classA.label}
              </p>
              {computedResult.errorsA > 0 && (
                <span className="text-[10px] text-amber-300 block mt-0.5">
                  ({computedResult.errorsA} erros)
                </span>
              )}
            </div>

            <div className="p-3 rounded-lg border border-white/10 bg-white/5 text-center">
              <span className="text-xs text-white/60 block">Parte B</span>
              <span className="text-2xl font-mono font-bold text-[#00FFFF]">
                {computedResult.timeB}s
              </span>
              <p
                className="text-[11px] mt-1 font-semibold"
                style={{ color: computedResult.classB.color }}
              >
                {computedResult.classB.label}
              </p>
              {computedResult.errorsB > 0 && (
                <span className="text-[10px] text-amber-300 block mt-0.5">
                  ({computedResult.errorsB} erros)
                </span>
              )}
            </div>

            <div className="p-3 rounded-lg border border-white/10 bg-white/5 text-center">
              <span className="text-xs text-white/60 block">Diferencial (B &minus; A)</span>
              <span className="text-2xl font-mono font-bold text-amber-400">
                {computedResult.diffBA}s
              </span>
              <p className="text-[11px] text-white/60 mt-1">Custo de alternância executiva</p>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg border border-[#00FFFF]/20 bg-[#00FFFF]/5 text-left">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#00FFFF]">
              Classificação Integrada:
            </span>
            <p className="text-sm font-medium text-white mt-1">
              {computedResult.globalClassification}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-400/90 italic">{TMT_DISCLAIMER}</p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-bold"
        >
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Salvar Resultados do TMT
        </Button>

        <Button
          onClick={() => returnToMinhasEscalas(guestId)}
          className="w-full bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Minhas Escalas
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
