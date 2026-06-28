import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import {
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Brain,
  Activity,
  FileBarChart,
  Clock,
  Eye,
} from 'lucide-react'
import { STRESS_TEST_SCENARIOS } from '@/lib/stress-test-scenarios'
import {
  runAllScenarios,
  getCategoryStats,
  type ScenarioResult,
  type BatchResult,
  type CategoryStats,
} from '@/services/stress-test'
import { StressTestDetailDialog } from '@/components/StressTestDetailDialog'
import { cn } from '@/lib/utils'

const categoryLabels: Record<string, string> = {
  MCHAT_ACCURACY: 'M-CHAT-R (TEA)',
  SNAPIV_ACCURACY: 'SNAP-IV (TDAH)',
  EMT_SAFETY: 'Segurança EMT/TMS',
  OUT_OF_SCOPE: 'Fora de Escopo',
  NORMAL_DEVELOPMENT: 'Desenvolvimento Normal',
}

const categoryColors: Record<string, string> = {
  MCHAT_ACCURACY: 'bg-blue-100 text-blue-700 border-blue-200',
  SNAPIV_ACCURACY: 'bg-purple-100 text-purple-700 border-purple-200',
  EMT_SAFETY: 'bg-red-100 text-red-700 border-red-200',
  OUT_OF_SCOPE: 'bg-amber-100 text-amber-700 border-amber-200',
  NORMAL_DEVELOPMENT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

export function StressTestRunner() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<ScenarioResult[]>([])
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null)
  const [progress, setProgress] = useState(0)
  const [selectedResult, setSelectedResult] = useState<ScenarioResult | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const cancelRef = useRef(false)

  const handleRun = useCallback(async () => {
    setIsRunning(true)
    setResults([])
    setBatchResult(null)
    setProgress(0)
    cancelRef.current = false

    const batch = await runAllScenarios(STRESS_TEST_SCENARIOS, (completed, total, result) => {
      if (cancelRef.current) return
      setProgress((completed / total) * 100)
      setResults((prev) => [...prev, result])
    })

    setBatchResult(batch)
    setProgress(100)
    setIsRunning(false)
  }, [])

  const handleViewDetail = (result: ScenarioResult) => {
    setSelectedResult(result)
    setDialogOpen(true)
  }

  const categoryStats: CategoryStats[] = batchResult ? getCategoryStats(batchResult.results) : []

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display">
                  Bateria 01 — Testes de Estresse NeuroFlow AI
                </CardTitle>
                <CardDescription>
                  10 cenários clínicos validando escalas M-CHAT-R, SNAP-IV, blocos de segurança EMT
                  e detecção de escopo
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleRun} disabled={isRunning} className="rounded-full" size="lg">
              {isRunning ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isRunning ? 'Executando...' : 'Executar Bateria 01'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(isRunning || progress > 0) && (
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">
                  Progresso: {results.length}/{STRESS_TEST_SCENARIOS.length} cenários
                </span>
                <span className="text-slate-500">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {batchResult && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-slate-800">{STRESS_TEST_SCENARIOS.length}</p>
                <p className="text-xs text-slate-500">Total de Cenários</p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-700">{batchResult.totalPassed}</p>
                <p className="text-xs text-emerald-600">Aprovados</p>
              </div>
              <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-center">
                <p className="text-2xl font-bold text-red-700">{batchResult.totalFailed}</p>
                <p className="text-xs text-red-600">Reprovados</p>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-center">
                <p className="text-2xl font-bold text-blue-700">
                  {(batchResult.totalDurationMs / 1000).toFixed(1)}s
                </p>
                <p className="text-xs text-blue-600">Tempo Total</p>
              </div>
            </div>
          )}

          {categoryStats.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <FileBarChart className="h-4 w-4 text-slate-500" />
                <h4 className="text-sm font-semibold text-slate-700">Resultados por Categoria</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categoryStats.map((stat) => (
                  <div
                    key={stat.category}
                    className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-white"
                  >
                    <Badge
                      variant="outline"
                      className={cn('text-[10px]', categoryColors[stat.category])}
                    >
                      {categoryLabels[stat.category] || stat.category}
                    </Badge>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {stat.passed}
                      </span>
                      {stat.failed > 0 && (
                        <span className="text-red-600 font-semibold flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          {stat.failed}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-slate-500" />
              <CardTitle className="text-base">Resultados Detalhados dos Cenários</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {results.map((result, idx) => (
                  <ScenarioResultCard
                    key={result.scenario.id}
                    result={result}
                    index={idx}
                    onViewDetail={() => handleViewDetail(result)}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {batchResult && batchResult.totalFailed > 0 && (
        <Alert className="border-amber-300 bg-amber-50">
          <ShieldAlert className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-800 font-bold">
            {batchResult.totalFailed} cenário(s) reprovado(s)
          </AlertTitle>
          <AlertDescription className="text-amber-700">
            Revise os cenários reprovados acima. Verifique se o motor de RAG está retornando as
            classificações, níveis de risco e alertas de segurança esperados conforme os protocolos
            clínicos DSM-5-TR, CID-11 e M-CHAT-R/F.
          </AlertDescription>
        </Alert>
      )}

      {batchResult && batchResult.totalFailed === 0 && (
        <Alert className="border-emerald-300 bg-emerald-50">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <AlertTitle className="text-emerald-800 font-bold">
            Todos os 10 cenários aprovados!
          </AlertTitle>
          <AlertDescription className="text-emerald-700">
            O motor NeuroFlow AI passou em todos os testes de estresse. As escalas M-CHAT-R e
            SNAP-IV estão scoring corretamente, os blocos de segurança EMT estão ativos e a detecção
            de escopo está funcionando conforme esperado.
          </AlertDescription>
        </Alert>
      )}

      <StressTestDetailDialog
        result={selectedResult}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}

function ScenarioResultCard({
  result,
  index,
  onViewDetail,
}: {
  result: ScenarioResult
  index: number
  onViewDetail: () => void
}) {
  const { scenario, passed, actualOutput, failures, durationMs } = result
  const isSafety = scenario.category === 'EMT_SAFETY'

  return (
    <div
      className={cn(
        'p-4 rounded-lg border-2 space-y-3 transition-all',
        passed ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30',
      )}
    >
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
          {passed ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <h4 className="text-sm font-semibold text-slate-800">{scenario.title}</h4>
          <Badge variant="outline" className={cn('text-[10px]', categoryColors[scenario.category])}>
            {categoryLabels[scenario.category] || scenario.category}
          </Badge>
          {isSafety && <ShieldAlert className="h-3.5 w-3.5 text-red-500" />}
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <Clock className="h-3 w-3" />
            {durationMs}ms
          </span>
          <Button variant="ghost" size="sm" onClick={onViewDetail} className="h-6 px-2 text-[10px]">
            <Eye className="h-3 w-3 mr-1" />
            Detalhes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <p className="font-semibold text-slate-500">Input do Cenário:</p>
          <p className="text-slate-700 italic bg-white/50 p-2 rounded border border-slate-100">
            "{scenario.inputPrompt}"
          </p>
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-slate-500">Resultado Esperado:</p>
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-[10px]">
              Cat: {scenario.expected.category}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              Risco: {scenario.expected.riskLevel ?? 'N/A'}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              Escala: {scenario.expected.scaleSuggestion}
            </Badge>
            <Badge
              variant="secondary"
              className={cn(
                'text-[10px]',
                scenario.expected.safetyFlag !== 'none' && 'bg-red-50 text-red-600',
              )}
            >
              Safety: {scenario.expected.safetyFlag}
            </Badge>
          </div>
        </div>
      </div>

      {actualOutput && (
        <div className="space-y-1">
          <p className="font-semibold text-slate-500 text-xs">Resultado Obtido:</p>
          <div className="flex flex-wrap gap-1">
            <Badge
              variant="outline"
              className={cn(
                'text-[10px]',
                actualOutput.category === scenario.expected.category
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-red-50 text-red-600 border-red-200',
              )}
            >
              Cat: {actualOutput.category}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px]',
                actualOutput.riskLevel === scenario.expected.riskLevel
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-red-50 text-red-600 border-red-200',
              )}
            >
              Risco: {actualOutput.riskLevel ?? 'N/A'}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px]',
                actualOutput.scaleSuggestion === scenario.expected.scaleSuggestion
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-red-50 text-red-600 border-red-200',
              )}
            >
              Escala: {actualOutput.scaleSuggestion}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px]',
                actualOutput.safetyFlag === scenario.expected.safetyFlag
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-red-50 text-red-600 border-red-200',
              )}
            >
              Safety: {actualOutput.safetyFlag}
            </Badge>
          </div>
        </div>
      )}

      {failures.length > 0 && (
        <div className="space-y-1 p-2 rounded-lg bg-red-50 border border-red-100">
          <p className="text-[10px] font-bold text-red-700">Falhas Detectadas:</p>
          <ul className="space-y-0.5">
            {failures.map((fail, i) => (
              <li key={i} className="text-[10px] text-red-600 flex items-start gap-1">
                <XCircle className="h-2.5 w-2.5 mt-0.5 shrink-0" />
                {fail}
              </li>
            ))}
          </ul>
        </div>
      )}

      {actualOutput?.safetyMessage && actualOutput.safetyFlag !== 'none' && (
        <div
          className={cn(
            'p-2 rounded-lg border text-[10px]',
            actualOutput.safetyFlag === 'absolute_contraindication'
              ? 'bg-red-50 border-red-200 text-red-700'
              : actualOutput.safetyFlag === 'relative_contraindication'
                ? 'bg-orange-50 border-orange-200 text-orange-700'
                : 'bg-amber-50 border-amber-200 text-amber-700',
          )}
        >
          <ShieldAlert className="h-3 w-3 inline mr-1" />
          {actualOutput.safetyMessage}
        </div>
      )}
    </div>
  )
}
