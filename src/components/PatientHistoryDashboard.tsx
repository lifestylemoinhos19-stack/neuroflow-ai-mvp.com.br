import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { TrendingUp, Users, Activity } from 'lucide-react'
import {
  getPatientsWithEvaluations,
  getPatientEvaluations,
  computeTrends,
  type PatientInfo,
  type PatientEvaluation,
  type ScoreTrend,
} from '@/services/patient-history'
import { PatientHistoryTimeline } from '@/components/PatientHistoryTimeline'
import { cn } from '@/lib/utils'

const chartConfig: ChartConfig = {
  phq9_score: { label: 'PHQ-9', color: 'hsl(var(--primary))' },
  gad7_score: { label: 'GAD-7', color: '#06b6d4' },
  snap_iv_score: { label: 'SNAP-IV', color: '#8b5cf6' },
  moca_score: { label: 'MoCA', color: '#f59e0b' },
}

export function PatientHistoryDashboard() {
  const [patients, setPatients] = useState<PatientInfo[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [evaluations, setEvaluations] = useState<PatientEvaluation[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [loadingEvals, setLoadingEvals] = useState(false)

  useEffect(() => {
    getPatientsWithEvaluations().then((data) => {
      setPatients(data)
      setLoadingPatients(false)
      if (data.length > 0) setSelectedUserId(data[0].user_id)
    })
  }, [])

  useEffect(() => {
    if (!selectedUserId) return
    setLoadingEvals(true)
    getPatientEvaluations(selectedUserId).then((data) => {
      setEvaluations(data)
      setLoadingEvals(false)
    })
  }, [selectedUserId])

  const trends = computeTrends(evaluations)
  const chartData = evaluations.map((e) => ({
    date: new Date(e.started_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    phq9_score: e.phq9_score,
    gad7_score: e.gad7_score,
    snap_iv_score: e.snap_iv_score,
    moca_score: e.moca_score,
  }))

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
          <Users className="h-4 w-4" /> Selecionar Paciente
        </label>
        {loadingPatients ? (
          <Skeleton className="h-10 w-full" />
        ) : patients.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum paciente com avaliações encontrado.</p>
        ) : (
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um paciente" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((p) => (
                <SelectItem key={p.user_id} value={p.user_id}>
                  {p.full_name} ({p.evaluation_count} avaliações)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {loadingEvals ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : evaluations.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">
          Nenhuma avaliação clínica encontrada.
        </p>
      ) : (
        <>
          {trends.length > 0 && (
            <Card className="border-slate-200 shadow-subtle">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Análise Comparativa
                </CardTitle>
                <CardDescription className="text-xs">
                  Diferença percentual entre a última e a avaliação anterior.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {trends
                    .filter((t) => t.delta !== null)
                    .map((t) => (
                      <TrendCard key={t.instrument} trend={t} />
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {evaluations.length >= 2 && (
            <Card className="border-slate-200 shadow-subtle">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Evolução dos Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[220px] w-full">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="phq9_score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="PHQ-9"
                    />
                    <Line
                      type="monotone"
                      dataKey="gad7_score"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="GAD-7"
                    />
                    <Line
                      type="monotone"
                      dataKey="snap_iv_score"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="SNAP-IV"
                    />
                    <Line
                      type="monotone"
                      dataKey="moca_score"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="MoCA"
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          <PatientHistoryTimeline evaluations={evaluations} />
        </>
      )}
    </div>
  )
}

function TrendCard({ trend }: { trend: ScoreTrend }) {
  const isImprovement = trend.isImprovement
  const colorClass =
    isImprovement === null ? 'text-slate-400' : isImprovement ? 'text-emerald-600' : 'text-red-500'
  return (
    <div className="bg-slate-50 rounded-lg p-2.5 text-center">
      <p className="text-[10px] text-slate-500 font-medium truncate">{trend.label}</p>
      <p className={cn('text-base font-bold', colorClass)}>
        {trend.percentageChange !== null ? `${Math.abs(trend.percentageChange)}%` : '—'}
      </p>
      <p className={cn('text-[10px]', colorClass)}>
        {isImprovement === null ? '—' : isImprovement ? 'Melhora' : 'Piora'}
      </p>
    </div>
  )
}
