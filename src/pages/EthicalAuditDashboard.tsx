import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ShieldAlert, FileSearch, XCircle, Clock } from 'lucide-react'
import {
  getFailedStressTests,
  getEdgeCaseAuditLogs,
  type FailedStressTest,
  type EdgeCaseAuditLog,
} from '@/services/ethical-audit'
import { cn } from '@/lib/utils'

export default function EthicalAuditDashboard() {
  const [failedTests, setFailedTests] = useState<FailedStressTest[]>([])
  const [edgeCases, setEdgeCases] = useState<EdgeCaseAuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getFailedStressTests(), getEdgeCaseAuditLogs()]).then(([tests, logs]) => {
      setFailedTests(tests)
      setEdgeCases(logs)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-72" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 flex items-center gap-2">
          <FileSearch className="h-7 w-7 text-primary" />
          Auditoria Ética & Casos Limite
        </h1>
        <p className="text-slate-500">
          Análise de falhas da IA e casos limite para post-mortem clínico.
        </p>
      </div>

      <Tabs defaultValue="failed">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="failed">Testes Reprovados ({failedTests.length})</TabsTrigger>
          <TabsTrigger value="edge">Casos Limite ({edgeCases.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="failed">
          <Card className="border-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <XCircle className="h-5 w-5 text-red-500" />
                Cenários Reprovados (is_success = false)
              </CardTitle>
              <CardDescription>
                Falhas detectadas na Bateria 01 de testes de estresse.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {failedTests.length === 0 ? (
                <p className="text-center text-slate-400 py-8">
                  Nenhum teste reprovado encontrado.
                </p>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {failedTests.map((test) => (
                      <div
                        key={test.id}
                        className="p-4 rounded-lg border border-red-100 bg-red-50/30 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className="text-xs bg-red-50 text-red-700 border-red-200"
                          >
                            {test.scenario_name || 'Sem nome'}
                          </Badge>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {test.latency_ms}ms ·{' '}
                            {new Date(test.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500">Input:</p>
                          <p className="text-sm text-slate-700 italic bg-white/50 p-2 rounded border border-slate-100">
                            "{test.input_text}"
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="font-semibold text-slate-500">Esperado:</p>
                            <p className="text-slate-700">{test.expected_suggestion || '—'}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-500">Obtido:</p>
                            <p className="text-slate-700">
                              {test.actual_output?.category || '—'} /{' '}
                              {test.actual_output?.safetyFlag || '—'}
                            </p>
                          </div>
                        </div>
                        {test.actual_output && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500">Racional:</p>
                            <p className="text-xs text-slate-600">
                              {test.actual_output.clinicalRationale}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edge">
          <Card className="border-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                Casos Limite (Audit Logs)
              </CardTitle>
              <CardDescription>
                Validações com alertas de segurança ou fora de escopo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {edgeCases.length === 0 ? (
                <p className="text-center text-slate-400 py-8">Nenhum caso limite encontrado.</p>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {edgeCases.map((log) => {
                      const d = log.details as any
                      return (
                        <div
                          key={log.id}
                          className="p-4 rounded-lg border border-amber-100 bg-amber-50/30 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                d.safetyFlag === 'absolute_contraindication'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200',
                              )}
                            >
                              {d.classification || 'N/A'}
                            </Badge>
                            <span className="text-xs text-slate-400">
                              {new Date(log.created_at).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500">Input:</p>
                            <p className="text-sm text-slate-700 italic bg-white/50 p-2 rounded border border-slate-100">
                              "{d.input}"
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="font-semibold text-slate-500">Safety Flag:</p>
                              <p className="text-slate-700">{d.safetyFlag}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-500">Escala:</p>
                              <p className="text-slate-700">{d.suggestedScale || '—'}</p>
                            </div>
                          </div>
                          {d.safetyMessage && (
                            <div className="p-2 rounded bg-red-50 border border-red-100">
                              <p className="text-xs text-red-700">{d.safetyMessage}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
