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
  FileDown,
  MessageSquarePlus,
} from 'lucide-react'
import { TELEMEDICINE_DISCLAIMER } from '@/lib/clinical-references'
import { ClinicalFeedbackDialog } from '@/components/ClinicalFeedbackDialog'
import { getUserSessions, SessionWithRisk } from '@/services/sessions'
import { exportReport } from '@/lib/pdf-export'
import { FocusAnalytics } from '@/components/FocusAnalytics'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export default function Dashboard() {
  const [sessions, setSessions] = useState<SessionWithRisk[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [feedbackSessionId, setFeedbackSessionId] = useState<string | null>(null)
  const [focusTrends, setFocusTrends] = useState<any[]>([])

  useEffect(() => {
    getUserSessions().then((data) => {
      setSessions(data)
      setLoading(false)
    })

    const fetchFocus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('focus_sessions')
        .select(`
          id, started_at, status,
          logs:focus_biofeedback_logs(bpm)
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('started_at', { ascending: true })
        .limit(10)

      if (data) {
        const mapped = data.map((session: any) => {
          const bpms = session.logs.map((l: any) => l.bpm).filter(Boolean)
          const avgBpm = bpms.length
            ? bpms.reduce((a: number, b: number) => a + b, 0) / bpms.length
            : 0
          return {
            date: new Date(session.started_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
            }),
            bpm: Math.round(avgBpm),
            duracao: 25,
          }
        })
        setFocusTrends(mapped)
      }
    }
    fetchFocus()
  }, [])

  const completedCount = sessions.filter((s) => s.status === 'completed').length
  const highRiskCount = sessions.filter((s) => s.riskLevel === 'high').length
  const mediumRiskCount = sessions.filter((s) => s.riskLevel === 'medium').length
  const lowRiskCount = sessions.filter((s) => s.riskLevel === 'low').length
  const inProgressCount = sessions.filter((s) => s.status === 'in_progress').length
  const overallRisk =
    highRiskCount > 0 ? 'high' : mediumRiskCount > 0 ? 'medium' : lowRiskCount > 0 ? 'low' : null

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
          className="rounded-full h-11 px-6 text-base font-semibold shadow-floating"
        >
          {exporting ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <FileDown className="h-5 w-5 mr-2" />
          )}
          Exportar Relatório PDF
        </Button>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-3 flex items-start gap-2">
          <Scale className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">{TELEMEDICINE_DISCLAIMER.text}</p>
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm font-bold text-red-800">
            A soberania médica é absoluta. Todos os escores e insights gerados por IA devem ser
            clinicamente validados por um profissional qualificado.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-subtle border-slate-100 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex items-center gap-4">
              {(['high', 'medium', 'low'] as const).map((risk) => (
                <div key={risk} className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      'h-14 w-14 rounded-full transition-all duration-300',
                      overallRisk === risk
                        ? cn(
                            risk === 'high'
                              ? 'bg-red-500 shadow-lg shadow-red-500/50 scale-110'
                              : risk === 'medium'
                                ? 'bg-amber-500 shadow-lg shadow-amber-500/50 scale-110'
                                : 'bg-emerald-500 shadow-lg shadow-emerald-500/50 scale-110',
                          )
                        : 'bg-slate-100',
                    )}
                  />
                  <span
                    className={cn(
                      'text-[10px] font-bold',
                      overallRisk === risk ? 'text-slate-800' : 'text-slate-300',
                    )}
                  >
                    {risk === 'high' ? 'Alto' : risk === 'medium' ? 'Médio' : 'Baixo'}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm text-slate-500">Risco Geral do Paciente</p>
              <p className="text-xl font-display font-bold text-slate-900">
                {overallRisk === 'high'
                  ? '⚠️ Atenção — Risco Alto'
                  : overallRisk === 'medium'
                    ? '🔔 Alerta — Risco Médio'
                    : overallRisk === 'low'
                      ? '✅ Risco Baixo'
                      : 'Sem dados suficientes'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {highRiskCount > 0 && `${highRiskCount} sessão(ões) com risco alto. `}
                {mediumRiskCount > 0 && `${mediumRiskCount} com risco médio. `}
                {lowRiskCount > 0 && `${lowRiskCount} com risco baixo.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    <TableHead>Ações</TableHead>
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
                      <TableCell>
                        {riskBadge(s.riskLevel)}
                        {s.riskLevel === 'high' && (
                          <p className="text-xs font-bold text-red-700 mt-1">
                            ⚠️ Alerta EMT: Avaliar contraindicações
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setFeedbackSessionId(s.id)}
                        >
                          <MessageSquarePlus className="h-3 w-3 mr-1" />
                          Feedback Clínico
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-subtle border-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-500" /> Tendências de Foco (Biofeedback)
          </CardTitle>
          <CardDescription>
            Média de Batimentos Cardíacos (BPM) por Sessão de Foco concluída.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {focusTrends.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              Nenhuma sessão de foco concluída ainda.
            </p>
          ) : (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={focusTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--slate-200))"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--slate-500))', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--slate-500))', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    cursor={{ fill: 'hsl(var(--slate-50))' }}
                  />
                  <Bar dataKey="bpm" fill="#6366f1" radius={[4, 4, 0, 0]} name="BPM Médio" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
        <div className="border-t border-slate-100 p-4 bg-slate-50 text-center rounded-b-lg">
          <p className="text-xs font-medium text-slate-500">
            Suporte à decisão clínica — Validação médica obrigatória
          </p>
        </div>
      </Card>

      <FocusAnalytics />

      <ClinicalFeedbackDialog
        sessionId={feedbackSessionId}
        open={!!feedbackSessionId}
        onOpenChange={(open) => !open && setFeedbackSessionId(null)}
      />
    </div>
  )
}
