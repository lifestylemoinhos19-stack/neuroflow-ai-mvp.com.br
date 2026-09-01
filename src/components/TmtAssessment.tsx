import { useState, useEffect, useRef } from 'react'
import {
  Loader2,
  RotateCcw,
  Play,
  Timer,
  FileText,
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
import { saveDementiaAssessment } from '@/services/dementia-assessments'
import { calculateTmtResult, TMT_DISCLAIMER, TMT_KEYS, type TmtResult } from '@/lib/tmt-data'

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

  // Cronômetro ativo
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        if (phase === 'partA_running') {
          setTimeA((t) => t + 1)
        } else if (phase === 'partB_running') {
          setTimeB((t) => t + 1)
        }
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
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
        <div className="p-6 rounded-xl border border-white/10 text-center" style={CARD_BG}>
          <Badge className="bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/40 mb-2">
            Etapa 1 de 2: TMT Parte A
          </Badge>
          <h2 className="text-white font-bold text-xl mb-1">
            Parte A (1 &rarr; 2 &rarr; 3 ... 25)
          </h2>
          <p className="text-xs text-white/70 mb-4">
            Cronometrando velocidade de processamento visual e atenção sustentada.
          </p>

          <div className="my-6">
            <span className="text-7xl font-mono font-bold text-[#00FFFF] tracking-tight">
              {timeA}s
            </span>
            <p className="text-xs text-white/50 mt-1">Tempo decorrido</p>
          </div>

          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-xs text-white/70">Erros cometidos:</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-7 w-7 border-white/20 text-white"
                onClick={() => setErrorsA((e) => Math.max(0, e - 1))}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-lg font-bold text-amber-400 w-6 text-center">{errorsA}</span>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-7 w-7 border-white/20 text-white"
                onClick={() => setErrorsA((e) => e + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {phase === 'partA_ready' ? (
            <Button
              onClick={handleStartPartA}
              size="lg"
              className="w-full bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-bold"
            >
              <Play className="h-4 w-4 mr-2" /> Iniciar Cronômetro Parte A
            </Button>
          ) : (
            <Button
              onClick={handleStopPartA}
              size="lg"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" /> Concluir Parte A ({timeA}s)
            </Button>
          )}
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
  if (phase === 'partB_running') {
    return (
      <div ref={topRef} className="space-y-4 animate-fade-in-up">
        <div className="p-6 rounded-xl border border-white/10 text-center" style={CARD_BG}>
          <Badge className="bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/40 mb-2">
            Etapa 2 de 2: TMT Parte B
          </Badge>
          <h2 className="text-white font-bold text-xl mb-1">Parte B (1-A-2-B-3-C...)</h2>
          <p className="text-xs text-white/70 mb-4">
            Cronometrando flexibilidade cognitiva e alternância executiva.
          </p>

          <div className="my-6">
            <span className="text-7xl font-mono font-bold text-[#00FFFF] tracking-tight">
              {timeB}s
            </span>
            <p className="text-xs text-white/50 mt-1">Tempo decorrido Parte B</p>
          </div>

          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-xs text-white/70">Erros cometidos:</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-7 w-7 border-white/20 text-white"
                onClick={() => setErrorsB((e) => Math.max(0, e - 1))}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-lg font-bold text-amber-400 w-6 text-center">{errorsB}</span>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-7 w-7 border-white/20 text-white"
                onClick={() => setErrorsB((e) => e + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <Button
            onClick={handleStopPartB}
            size="lg"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
          >
            <CheckCircle2 className="h-5 w-5 mr-2" /> Finalizar Teste TMT ({timeB}s)
          </Button>
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
