import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { History as HistoryIcon, ArrowRight, TrendingUp } from 'lucide-react'
import { getUserSessions, SessionWithRisk } from '@/services/sessions'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/utils'

export default function History() {
  const [sessions, setSessions] = useState<SessionWithRisk[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUserSessions().then((data) => {
      setSessions(data)
      setLoading(false)
    })
  }, [])

  const riskBadge = (level: string | null) => {
    if (!level) return <span className="text-slate-400 text-xs">—</span>
    const config = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-amber-100 text-amber-700',
      low: 'bg-emerald-100 text-emerald-700',
    }
    const labels = { high: 'Alto', medium: 'Médio', low: 'Baixo' }
    return (
      <span className={cn('text-xs font-bold px-2 py-1 rounded-full', config[level])}>
        {labels[level]}
      </span>
    )
  }

  const snapivSessions = sessions.filter((s) => s.snapivInattention !== null)
  const hasComparison = snapivSessions.length >= 2

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 flex items-center gap-2">
          <HistoryIcon className="h-7 w-7 text-primary" /> Histórico de Avaliações
        </h1>
        <p className="text-slate-500">Acompanhe a evolução das avaliações ao longo do tempo.</p>
      </div>

      {hasComparison && (
        <Card className="shadow-subtle border-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Evolução SNAP-IV
            </CardTitle>
            <CardDescription>
              Comparação de médias de desatenção ao longo das sessões.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={snapivSessions.map((s) => ({
                    date: new Date(s.started_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                    }),
                    inattention: s.snapivInattention,
                    hyperactivity: s.snapivHyperactivity,
                  }))}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
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
                  />
                  <Line
                    type="monotone"
                    dataKey="inattention"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Desatenção"
                  />
                  <Line
                    type="monotone"
                    dataKey="hyperactivity"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Hiperatividade"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-subtle border-slate-100">
        <CardHeader>
          <CardTitle>Todas as Avaliações</CardTitle>
          <CardDescription>Histórico completo de sessões de triagem.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-4">Nenhuma avaliação realizada ainda.</p>
              <Button asChild>
                <Link to="/avaliacao">
                  Fazer primeira avaliação <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(s.started_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <div className="flex gap-3 mt-1 text-xs text-slate-500">
                      {s.mchatScore !== null && <span>M-CHAT: {s.mchatScore}/20</span>}
                      {s.snapivInattention !== null && (
                        <span>SNAP-IV: {s.snapivInattention.toFixed(1)}</span>
                      )}
                      <span>{s.responseCount} respostas</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={
                        s.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }
                    >
                      {s.status === 'completed' ? 'Concluída' : 'Em Progresso'}
                    </Badge>
                    {riskBadge(s.riskLevel)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
