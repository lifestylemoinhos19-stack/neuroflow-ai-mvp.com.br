import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Play, Loader2, CheckCircle2, XCircle, Users, Clock, Database } from 'lucide-react'
import { GENDER_BIAS_SCENARIOS } from '@/lib/gender-bias-scenarios'
import { runGenderBiasBatch, type GenderBiasPairResult } from '@/services/gender-bias-test'
import { cn } from '@/lib/utils'

export function GenderBiasTestRunner() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<GenderBiasPairResult[]>([])
  const [progress, setProgress] = useState(0)
  const [completed, setCompleted] = useState(false)

  const handleRun = useCallback(async () => {
    setIsRunning(true)
    setResults([])
    setProgress(0)
    setCompleted(false)

    const batchResults = await runGenderBiasBatch(GENDER_BIAS_SCENARIOS, (done, total, result) => {
      setProgress((done / total) * 100)
      setResults((prev) => [...prev, result])
    })

    setResults(batchResults)
    setProgress(100)
    setCompleted(true)
    setIsRunning(false)
  }, [])

  const totalPassed = results.filter((r) => r.passed).length
  const totalFailed = results.length - totalPassed
  const allLogsSaved = results.length > 0 && results.every((r) => r.logSaved)

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display">Teste de Consistência de Gênero</CardTitle>
                <CardDescription>
                  {GENDER_BIAS_SCENARIOS.length} pares de cenários clínicos validando ausência de
                  viés de gênero na classificação
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleRun} disabled={isRunning} className="rounded-full" size="lg">
              {isRunning ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isRunning ? 'Executando...' : 'Executar Teste de Gênero'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(isRunning || progress > 0) && (
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">
                  Progresso: {results.length}/{GENDER_BIAS_SCENARIOS.length} pares
                </span>
                <span className="text-slate-500">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {completed && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-slate-800">{results.length}</p>
                <p className="text-xs text-slate-500">Total de Pares</p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-700">{totalPassed}</p>
                <p className="text-xs text-emerald-600">Consistentes</p>
              </div>
              <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-center">
                <p className="text-2xl font-bold text-red-700">{totalFailed}</p>
                <p className="text-xs text-red-600">Inconsistentes</p>
              </div>
            </div>
          )}

          {completed && (
            <div className="flex items-center gap-2 text-sm mb-4">
              {allLogsSaved ? (
                <span className="flex items-center gap-1 text-emerald-600">
                  <Database className="h-4 w-4" />
                  Log saved successfully in Supabase.
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-500">
                  <XCircle className="h-4 w-4" />
                  Alguns logs não foram salvos no Supabase.
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Resultados por Par de Gênero</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.map((result, idx) => (
              <GenderBiasPairCard key={idx} result={result} index={idx} />
            ))}
          </CardContent>
        </Card>
      )}

      {completed && totalFailed > 0 && (
        <Alert className="border-amber-300 bg-amber-50">
          <XCircle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-800 font-bold">
            {totalFailed} par(es) com inconsistência detectada
          </AlertTitle>
          <AlertDescription className="text-amber-700">
            O modelo retornou classificações diferentes para inputs idênticos com gêneros
            diferentes. Revise os critérios de classificação.
          </AlertDescription>
        </Alert>
      )}

      {completed && totalFailed === 0 && (
        <Alert className="border-emerald-300 bg-emerald-50">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <AlertTitle className="text-emerald-800 font-bold">
            Todos os {results.length} pares aprovados!
          </AlertTitle>
          <AlertDescription className="text-emerald-700">
            O modelo NeuroFlow AI demonstrou consistência total entre gêneros. Nenhum viés detectado
            nas classificações de risco e escalas sugeridas.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

function GenderBiasPairCard({ result, index }: { result: GenderBiasPairResult; index: number }) {
  const {
    scenario,
    maleResult,
    femaleResult,
    passed,
    failures,
    maleDurationMs,
    femaleDurationMs,
    logSaved,
  } = result

  return (
    <div
      className={cn(
        'p-4 rounded-lg border-2 space-y-3',
        passed ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30',
      )}
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
          {passed ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <h4 className="text-sm font-semibold text-slate-800">{scenario.title}</h4>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={cn(
              'flex items-center gap-1 text-[10px]',
              maleDurationMs > 5000 ? 'text-red-600 font-bold' : 'text-slate-400',
            )}
          >
            <Clock className="h-3 w-3" /> M: {maleDurationMs}ms
            {maleDurationMs > 5000 && <span className="text-red-500">⚠</span>}
          </span>
          <span
            className={cn(
              'flex items-center gap-1 text-[10px]',
              femaleDurationMs > 5000 ? 'text-red-600 font-bold' : 'text-slate-400',
            )}
          >
            <Clock className="h-3 w-3" /> F: {femaleDurationMs}ms
            {femaleDurationMs > 5000 && <span className="text-red-500">⚠</span>}
          </span>
          {logSaved ? (
            <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200">
              <Database className="h-2.5 w-2.5 mr-0.5" /> Log salvo
            </Badge>
          ) : (
            <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200">
              <XCircle className="h-2.5 w-2.5 mr-0.5" /> Log falhou
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <p className="font-semibold text-blue-600">♂ Input Masculino</p>
          <p className="text-slate-600 italic bg-white/50 p-2 rounded border border-slate-100">
            "{scenario.maleInput}"
          </p>
          {maleResult && (
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge variant="secondary" className="text-[10px]">
                Risco: {maleResult.riskLevel ?? 'N/A'}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                Escala: {maleResult.scaleSuggestion}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                Cat: {maleResult.category}
              </Badge>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-pink-600">♀ Input Feminino</p>
          <p className="text-slate-600 italic bg-white/50 p-2 rounded border border-slate-100">
            "{scenario.femaleInput}"
          </p>
          {femaleResult && (
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge variant="secondary" className="text-[10px]">
                Risco: {femaleResult.riskLevel ?? 'N/A'}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                Escala: {femaleResult.scaleSuggestion}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                Cat: {femaleResult.category}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {failures.length > 0 && (
        <div className="space-y-1 p-2 rounded-lg bg-red-50 border border-red-100">
          <p className="text-[10px] font-bold text-red-700">Inconsistências Detectadas:</p>
          <ul className="space-y-0.5">
            {failures.map((f, i) => (
              <li key={i} className="text-[10px] text-red-600 flex items-start gap-1">
                <XCircle className="h-2.5 w-2.5 mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
