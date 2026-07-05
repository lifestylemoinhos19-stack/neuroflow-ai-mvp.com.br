import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Play, Loader2, FlaskConical, CheckCircle2, X } from 'lucide-react'
import { TEAM_DEVICES } from '@/lib/team-devices'
import {
  runFieldTestAutomation,
  type LogEntry,
  type BatchTestSummary,
} from '@/lib/field-test-automation'

interface Props {
  userId?: string
}

export function FieldTestBatchPanel({ userId }: Props) {
  const [running, setRunning] = useState(false)
  const [stopOnError, setStopOnError] = useState(false)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [summary, setSummary] = useState<BatchTestSummary | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const handleRun = useCallback(async () => {
    setRunning(true)
    setLogs([])
    setProgress(0)
    setSummary(null)

    const result = await runFieldTestAutomation(TEAM_DEVICES, {
      stopOnError,
      userId,
      onLog: (entry) => setLogs((prev) => [...prev, entry]),
      onProgress: (idx, total) => setProgress((idx / total) * 100),
    })

    setSummary(result)
    setRunning(false)
  }, [stopOnError, userId])

  const levelColor: Record<string, string> = {
    info: 'text-[#E6F1FF]/70',
    success: 'text-[#00FFFF]',
    error: 'text-red-400',
    warning: 'text-yellow-400',
  }

  return (
    <Card className="bg-[#0A192F] border-[#00FFFF]/20">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-[#E6F1FF] flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-[#00FFFF]" /> Field Test Batch Automation
            </CardTitle>
            <CardDescription className="text-[#E6F1FF]/60">
              {TEAM_DEVICES.length} dispositivos team
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-[#E6F1FF]/70">
              stopOnError
              <Switch checked={stopOnError} onCheckedChange={setStopOnError} />
            </label>
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
              {running ? 'Executando...' : 'Executar Batch'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {(running || progress > 0) && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-[#E6F1FF]/60">
              <span>Progresso: {Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/10" />
          </div>
        )}
        {summary && (
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total', value: summary.totalDevices, color: 'text-[#00FFFF]' },
              { label: 'Sucesso', value: summary.successCount, color: 'text-[#00FFFF]' },
              { label: 'Falhas', value: summary.failedCount, color: 'text-red-400' },
              { label: 'Resultados', value: summary.results.length, color: 'text-[#00FFFF]' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-[#00FFFF]/20 bg-[#00FFFF]/5 p-3 text-center"
              >
                <p className={'text-2xl font-bold ' + s.color}>{s.value}</p>
                <p className="text-xs text-[#E6F1FF]/60">{s.label}</p>
              </div>
            ))}
          </div>
        )}
        {logs.length > 0 && (
          <div className="bg-black/40 rounded-lg border border-[#00FFFF]/10 p-3 max-h-48 overflow-y-auto space-y-1 font-mono text-xs">
            {logs.map((log, i) => (
              <div key={i} className={levelColor[log.level]}>
                <span className="text-[#E6F1FF]/40">[{log.timestamp}]</span> {log.message}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        )}
        {summary && (
          <div className="space-y-2">
            {summary.results.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs border border-[#00FFFF]/10 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  {r.success ? (
                    <CheckCircle2 className="h-3 w-3 text-[#00FFFF]" />
                  ) : (
                    <X className="h-3 w-3 text-red-400" />
                  )}
                  <span className="text-[#E6F1FF]">{r.device.label}</span>
                  <Badge className="text-[10px] bg-[#00FFFF]/10 text-[#00FFFF] border-[#00FFFF]/20">
                    {r.device.id}
                  </Badge>
                </div>
                <div className="text-[#E6F1FF]/60">
                  {r.success ? 'MAE: ' + r.avgMae?.toFixed(2) : r.error}
                  <span className="ml-2 text-[#E6F1FF]/30">
                    {new Date(r.completedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
