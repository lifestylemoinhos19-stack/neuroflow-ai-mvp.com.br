import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Play, Loader2, CheckCircle2, X, FlaskConical, Sun, Palette } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { runAllFieldTests, aggregateResults, type FieldTestResult } from '@/lib/field-test-engine'
import { captureFieldTestMetrics } from '@/lib/sensitivity-tuning'

interface Props {
  onClose: () => void
}

export function FieldTestRunner({ onClose }: Props) {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<FieldTestResult[]>([])
  const [completed, setCompleted] = useState(false)
  const { user } = useAuth()

  const handleRun = useCallback(async () => {
    setRunning(true)
    setResults([])
    setProgress(0)
    setCompleted(false)
    const startTime = Date.now()

    const all = await runAllFieldTests((prog, partial) => {
      setResults(partial)
      setProgress(prog)
    })

    const { avgMae, avgRmse, totalSamples } = aggregateResults(all)
    const durationMs = Date.now() - startTime

    if (user) {
      await captureFieldTestMetrics(
        user.id,
        { mae: avgMae, rmse: avgRmse, samples: totalSamples, durationMs },
        null,
        { scenarios: all.length, type: 'field_test' },
      )
    }

    console.table(
      all.map((r) => ({
        Scenario: r.scenario.name,
        Lighting: r.scenario.lighting,
        SkinTone: r.scenario.skinTone,
        MAE: r.mae.toFixed(2),
        RMSE: r.rmse.toFixed(2),
        Accuracy: r.accuracy.toFixed(1) + '%',
        Samples: r.sampleCount,
      })),
    )

    setCompleted(true)
    setRunning(false)
  }, [user])

  return (
    <div className="min-h-screen bg-[#0A192F] text-[#E6F1FF] p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-6 w-6 text-[#00FFFF]" />
            <h1 className="text-lg font-bold text-[#E6F1FF]">Field Test Runner</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-[#E6F1FF]/85 hover:text-[#E6F1FF]"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Card className="bg-[#0A192F] border-[#00FFFF]/20 mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[#E6F1FF]">Biofeedback Accuracy Test</CardTitle>
                <CardDescription className="text-[#E6F1FF]/85">
                  5 cenários · 30 amostras cada
                </CardDescription>
              </div>
              <Button
                onClick={handleRun}
                disabled={running}
                className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full"
              >
                {running ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {running ? 'Executando...' : 'Executar'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {(running || progress > 0) && (
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-[#E6F1FF]/85">
                  <span>Progresso: {Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-white/10" />
              </div>
            )}
            {completed && (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-[#00FFFF]/20 bg-[#00FFFF]/5 p-3 text-center">
                  <p className="text-2xl font-bold text-[#00FFFF]">{results.length}</p>
                  <p className="text-xs text-[#E6F1FF]/85">Cenários</p>
                </div>
                <div className="rounded-lg border border-[#00FFFF]/20 bg-[#00FFFF]/5 p-3 text-center">
                  <p className="text-2xl font-bold text-[#00FFFF]">
                    {(results.reduce((a, r) => a + r.mae, 0) / results.length).toFixed(1)}
                  </p>
                  <p className="text-xs text-[#E6F1FF]/85">MAE Médio</p>
                </div>
                <div className="rounded-lg border border-[#00FFFF]/20 bg-[#00FFFF]/5 p-3 text-center">
                  <p className="text-2xl font-bold text-[#00FFFF]">
                    {(results.reduce((a, r) => a + r.rmse, 0) / results.length).toFixed(1)}
                  </p>
                  <p className="text-xs text-[#E6F1FF]/85">RMSE Médio</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((r, i) => (
              <Card key={i} className="bg-[#0A192F] border-[#00FFFF]/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {r.accuracy > 85 ? (
                        <CheckCircle2 className="h-4 w-4 text-[#00FFFF]" />
                      ) : (
                        <X className="h-4 w-4 text-yellow-400" />
                      )}
                      <span className="text-sm font-medium text-[#E6F1FF]">{r.scenario.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="text-[10px] bg-[#00FFFF]/10 text-[#00FFFF] border-[#00FFFF]/20">
                        <Sun className="h-2.5 w-2.5 mr-0.5" /> {r.scenario.lighting}
                      </Badge>
                      <Badge className="text-[10px] bg-[#00FFFF]/10 text-[#00FFFF] border-[#00FFFF]/20">
                        <Palette className="h-2.5 w-2.5 mr-0.5" /> {r.scenario.skinTone}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[#E6F1FF]/75">MAE: </span>
                      <span className="text-[#E6F1FF] font-medium">{r.mae.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[#E6F1FF]/75">RMSE: </span>
                      <span className="text-[#E6F1FF] font-medium">{r.rmse.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[#E6F1FF]/75">Accuracy: </span>
                      <span className="text-[#00FFFF] font-medium">{r.accuracy.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {completed && (
          <p className="text-xs text-[#E6F1FF]/70 text-center mt-4">
            Resultados salvos em calibration_logs e logged no console.
          </p>
        )}
      </div>
    </div>
  )
}

FieldTestRunner.runAll = runAllFieldTests
