import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Diamond, Trophy, TrendingUp, Clock, BarChart3 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'

function computeWeeklyAverages(sessions: any[]) {
  const weekMap = new Map<string, { totalMin: number; count: number }>()
  sessions.forEach((s) => {
    if (!s.completed_at) return
    const date = new Date(s.completed_at)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const key = weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    const existing = weekMap.get(key) || { totalMin: 0, count: 0 }
    const dur = Math.round(
      (new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / 60000,
    )
    existing.totalMin += dur
    existing.count += 1
    weekMap.set(key, existing)
  })
  return Array.from(weekMap.entries())
    .map(([week, val]) => ({
      week,
      avgMin: val.count > 0 ? Math.round(val.totalMin / val.count) : 0,
    }))
    .slice(-6)
}

function computeLast7Days(sessions: any[]) {
  const days: { [key: string]: { durations: number[]; vrcs: number[] } } = {}
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const key = d.toLocaleDateString('pt-BR', { weekday: 'short' })
    days[key] = { durations: [], vrcs: [] }
  }
  sessions.forEach((s) => {
    if (!s.completed_at) return
    const sessionDate = new Date(s.completed_at)
    const diffDays = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays >= 0 && diffDays <= 6) {
      const key = sessionDate.toLocaleDateString('pt-BR', { weekday: 'short' })
      if (days[key]) {
        const dur = Math.round(
          (new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / 60000,
        )
        days[key].durations.push(dur)
        if (s.vrc != null && Number(s.vrc) > 0) days[key].vrcs.push(Number(s.vrc))
      }
    }
  })
  return Object.entries(days).map(([day, val]) => ({
    day,
    avgDuration:
      val.durations.length > 0
        ? Math.round(val.durations.reduce((a, b) => a + b, 0) / val.durations.length)
        : 0,
    avgVrc:
      val.vrcs.length > 0
        ? Math.round((val.vrcs.reduce((a, b) => a + b, 0) / val.vrcs.length) * 100) / 100
        : 0,
  }))
}

export function FocusAnalytics() {
  const [loading, setLoading] = useState(true)
  const [vrcTrends, setVrcTrends] = useState<any[]>([])
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [last7Days, setLast7Days] = useState<any[]>([])
  const [totalCrystals, setTotalCrystals] = useState(0)
  const [totalMasterCrystals, setTotalMasterCrystals] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('focus_sessions')
        .select('id, started_at, completed_at, status, crystals_earned, master_crystals, vrc')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('started_at', { ascending: true })
        .limit(30)
      if (data) {
        setTotalCrystals(data.reduce((s, r) => s + (r.crystals_earned || 0), 0))
        setTotalMasterCrystals(data.reduce((s, r) => s + (r.master_crystals || 0), 0))
        setVrcTrends(
          data
            .filter((r) => r.vrc != null && r.vrc > 0)
            .map((r) => ({
              date: new Date(r.started_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
              }),
              vrc: Number(r.vrc),
            })),
        )
        setWeeklyData(computeWeeklyAverages(data))
        setLast7Days(computeLast7Days(data))
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return <Skeleton className="h-48 w-full" />

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow-subtle border-slate-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-cyan-50 flex items-center justify-center">
              <Diamond className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalCrystals}</p>
              <p className="text-sm text-slate-500">Cristais de Foco</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-subtle border-slate-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalMasterCrystals}</p>
              <p className="text-sm text-slate-500">Cristais Mestres</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-subtle border-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Evolução do VRC (Variabilidade)
          </CardTitle>
          <CardDescription>
            Variabilidade da Frequência Cardíaca ao longo das sessões.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vrcTrends.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              Sem dados de VRC disponíveis ainda.
            </p>
          ) : (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vrcTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    dataKey="vrc"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="VRC (ms)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-subtle border-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-500" /> Média Semanal de Foco (min)
          </CardTitle>
          <CardDescription>Tempo médio de foco por semana.</CardDescription>
        </CardHeader>
        <CardContent>
          {weeklyData.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">Sem dados semanais ainda.</p>
          ) : (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--slate-200))"
                  />
                  <XAxis
                    dataKey="week"
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
                  <Bar dataKey="avgMin" fill="#6366f1" radius={[4, 4, 0, 0]} name="Minutos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-subtle border-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-600" /> Tendências Semanais (Últimos 7 Dias)
          </CardTitle>
          <CardDescription>Duração média de foco (min) e VRC médio (ms) por dia.</CardDescription>
        </CardHeader>
        <CardContent>
          {last7Days.every((d) => d.avgDuration === 0 && d.avgVrc === 0) ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              Sem dados suficientes nos últimos 7 dias.
            </p>
          ) : (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={last7Days}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--slate-200))"
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--slate-500))', fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--slate-500))', fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
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
                  <Bar
                    yAxisId="left"
                    dataKey="avgDuration"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    name="Duração Média (min)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgVrc"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="VRC Médio (ms)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
