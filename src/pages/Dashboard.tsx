import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Download,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Scale,
} from 'lucide-react'
import { TELEMEDICINE_DISCLAIMER } from '@/lib/clinical-references'
import { getUserSessions, SessionWithRisk } from '@/services/sessions'
import { exportReport } from '@/lib/pdf-export'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const [sessions, setSessions] = useState<SessionWithRisk[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    getUserSessions().then((data) => {
      setSessions(data)
      setLoading(false)
    })
  }, [])

  const completedCount = sessions.filter((s) => s.status === 'completed').length
  const highRiskCount = sessions.filter((s) => s.riskLevel === 'high').length
  const inProgressCount = sessions.filter((s) => s.status === 'in_progress').length

  const handleExport = () => {
    setExporting(true)
    setTimeout(() => {
      exportReport(sessions)
      setExporting(false)
    }, 500)
  }

  const statusBadge = (status: string) => {
    if (status === 'completed')
      return (
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Concluída
        </Badge>
      )
    return (
      <Badge variant="secondary" className="bg-amber-100 text-amber-700">
        <Clock className="h-3 w-3 mr-1" />
        Em Progresso
      </Badge>
    )
  }

  const riskBadge = (level: string | null) => {
    if (!level) return <span className="text-slate-400 text-sm">—</span>
    const config = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-amber-100 text-amber-700',
      low: 'bg-emerald-100 text-emerald-700',
    }
    const labels = { high: 'Risco Alto', medium: 'Risco Médio', low: 'Risco Baixo' }
    return (
      <span className={cn('text-xs font-bold px-2 py-1 rounded-full', config[level])}>
        {labels[level]}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
            Dashboard Clínico
          </h1>
          <p className="text-slate-500">
            Resumo de sessões e indicadores de risco (DSM-5-TR / CID-11).
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={exporting || sessions.length === 0}
          className="rounded-full"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exportar Relatório
        </Button>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-3 flex items-start gap-2">
          <Scale className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">{TELEMEDICINE_DISCLAIMER.text}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {' '}
        <Card className="shadow-subtle border-slate-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{completedCount}</p>
              <p className="text-sm text-slate-500">Sessões Concluídas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-subtle border-slate-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{inProgressCount}</p>
              <p className="text-sm text-slate-500">Em Progresso</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-subtle border-slate-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{highRiskCount}</p>
              <p className="text-sm text-slate-500">Risco Alto</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-subtle border-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Histórico de Sessões
          </CardTitle>
          <CardDescription>Todas as avaliações e seus indicadores de risco.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-center text-slate-400 py-8">
              Nenhuma sessão encontrada. Inicie uma anamnese ou escala clínica.
            </p>
          ) : (
            <div className="rounded-md border border-slate-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>M-CHAT-R</TableHead>
                    <TableHead>SNAP-IV (Desat./Hiper.)</TableHead>
                    <TableHead>Risco</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm text-slate-700">
                        {new Date(s.started_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{statusBadge(s.status)}</TableCell>
                      <TableCell className="text-sm">
                        {s.mchatScore !== null ? `${s.mchatScore}/20` : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {s.snapivInattention !== null
                          ? `${s.snapivInattention.toFixed(1)} / ${s.snapivHyperactivity?.toFixed(1)}`
                          : '—'}
                      </TableCell>
                      <TableCell>{riskBadge(s.riskLevel)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
