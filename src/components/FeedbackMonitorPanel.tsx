import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Loader2, RefreshCw } from 'lucide-react'
import {
  generateFeedbackReport,
  formatReport,
  type FeedbackMonitorReport,
  type SuggestionType,
} from '@/lib/feedback-monitor'

export function FeedbackMonitorPanel() {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<FeedbackMonitorReport | null>(null)
  const [limit, setLimit] = useState(1000)
  const [since, setSince] = useState('')

  const handleFetch = useCallback(async () => {
    setLoading(true)
    const sinceISO = since ? new Date(since + 'T00:00:00').toISOString() : undefined
    const r = await generateFeedbackReport(limit, sinceISO)
    setReport(r)
    setLoading(false)
  }, [limit, since])

  const suggestionColor: Record<SuggestionType, string> = {
    KEEP: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    WIDEN_TOLERANCE: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    EXPAND: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  return (
    <Card className="bg-[#0A192F] border-[#00FFFF]/20">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-[#E6F1FF] flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#00FFFF]" /> NeuroFlow Feedback Monitor
            </CardTitle>
            <CardDescription className="text-[#E6F1FF]/85">
              Analise de calibration_logs e sugestoes de ajuste
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value) || 1000)}
              className="w-24 bg-black/40 border-[#00FFFF]/20 text-[#E6F1FF]"
              placeholder="limit"
            />
            <Input
              type="date"
              value={since}
              onChange={(e) => setSince(e.target.value)}
              className="w-36 bg-black/40 border-[#00FFFF]/20 text-[#E6F1FF]"
            />
            <Button
              onClick={handleFetch}
              disabled={loading}
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/90 rounded-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Analisar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {report && (
          <>
            <p className="text-xs text-[#E6F1FF]/70">
              {report.totalLogs} logs analisados em {new Date(report.fetchedAt).toLocaleString()}
            </p>
            <div className="space-y-3">
              {report.suggestions.map((s) => (
                <div key={s.model} className="border border-[#00FFFF]/10 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#00FFFF]">{s.model}</span>
                    <Badge className={suggestionColor[s.type]}>{s.type}</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[#E6F1FF]/70">Avg MAE: </span>
                      <span className="text-[#E6F1FF] font-medium">
                        {s.metrics.avgMae.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#E6F1FF]/70">Min MAE: </span>
                      <span className="text-[#E6F1FF] font-medium">
                        {s.metrics.minMae.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#E6F1FF]/70">Max MAE: </span>
                      <span className="text-[#E6F1FF] font-medium">
                        {s.metrics.maxMae.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#E6F1FF]/70">Samples: </span>
                      <span className="text-[#E6F1FF] font-medium">{s.metrics.sampleCount}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-black/30 rounded p-2">
                      <p className="text-[#E6F1FF]/70 mb-1">Current Range</p>
                      <p className="text-[#E6F1FF]">
                        min={s.currentRange.min}, max={s.currentRange.max}, tol=
                        {s.currentRange.tolerance}
                      </p>
                    </div>
                    <div className="bg-[#00FFFF]/5 rounded p-2 border border-[#00FFFF]/10">
                      <p className="text-[#00FFFF]/80 mb-1">Suggested Range</p>
                      <p className="text-[#00FFFF]">
                        min={s.suggestedRange.min}, max={s.suggestedRange.max}, tol=
                        {s.suggestedRange.tolerance}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-[#E6F1FF]/75">{s.reason}</p>
                </div>
              ))}
            </div>
            <pre className="bg-black/40 border border-[#00FFFF]/10 rounded-lg p-3 text-xs text-[#E6F1FF]/85 overflow-auto max-h-48">
              {formatReport(report)}
            </pre>
          </>
        )}
        {!report && !loading && (
          <p className="text-center text-[#E6F1FF]/70 py-8 text-sm">
            Clique em "Analisar" para buscar calibration_logs e gerar sugestoes.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
