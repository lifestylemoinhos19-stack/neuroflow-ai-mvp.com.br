import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { api } from '@/lib/api'
import { Brain, HeartPulse, Zap, Moon, Activity, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  PolarAngleAxis,
  RadialBarChart,
  RadialBar,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'

export default function Index() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    api.data.getDashboardMetrics().then(setData)
  }, [])

  if (!data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  const icons = [HeartPulse, Zap, Moon, Activity]
  const gaugeData = [{ name: 'Score', value: data.flowScore, fill: 'var(--color-score)' }]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
            Visão Geral
          </h1>
          <p className="text-slate-500">Resumo do seu estado neurológico hoje.</p>
        </div>
        <Button className="rounded-full shadow-floating hidden sm:flex">
          <Plus className="h-4 w-4 mr-2" /> Novo Registro
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Score Gauge */}
        <Card className="lg:col-span-1 shadow-subtle border-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Brain className="h-24 w-24" />
          </div>
          <h3 className="text-sm font-medium text-slate-500 mb-2">NeuroFlow Score</h3>
          <div className="h-48 w-48 relative">
            <ChartContainer
              config={{ score: { color: 'hsl(var(--primary))' } }}
              className="h-full w-full"
            >
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                data={gaugeData}
                startAngle={180}
                endAngle={0}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar
                  dataKey="value"
                  cornerRadius={10}
                  background={{ fill: 'hsl(var(--slate-100))' }}
                />
              </RadialBarChart>
            </ChartContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col mt-4">
              <span className="text-4xl font-display font-bold text-slate-900">
                {data.flowScore}
              </span>
              <span className="text-xs text-primary font-medium mt-1">Estado Ideal</span>
            </div>
          </div>
        </Card>

        {/* AI Recommendations */}
        <Card className="lg:col-span-2 shadow-subtle border-slate-100 bg-gradient-to-br from-indigo-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center text-indigo-700">
              <Sparkles className="h-5 w-5 mr-2" /> Insights do NeuroFlow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 text-lg leading-relaxed">
              Sua concentração está <strong className="text-indigo-600">15% maior</strong> hoje. A
              variabilidade da frequência cardíaca indica ótima recuperação. Este é o momento ideal
              para tarefas complexas que exigem alto nível cognitivo.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="secondary"
                className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
              >
                Iniciar Sessão de Foco
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.metrics.map((metric: any, idx: number) => {
          const Icon = icons[idx]
          const isPositive = metric.trend.startsWith('+')
          const chartData = metric.data.map((val: number, i: number) => ({ time: i, value: val }))

          return (
            <Card
              key={idx}
              className="shadow-subtle border-slate-100 hover:shadow-md transition-shadow"
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-slate-600" />
                  </div>
                  <span
                    className={cn(
                      'text-xs font-bold px-2 py-1 rounded-full',
                      isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
                    )}
                  >
                    {metric.trend}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">{metric.title}</p>
                  <p className="text-2xl font-display font-bold">{metric.value}</p>
                </div>
                <div className="h-10 mt-4 opacity-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={isPositive ? '#10b981' : '#f43f5e'}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Activity Timeline */}
      <Card className="shadow-subtle border-slate-100">
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Seus últimos registros e sessões processadas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data.recentActivity.map((activity: any, i: number) => (
              <div key={activity.id} className="flex relative">
                {i !== data.recentActivity.length - 1 && (
                  <div className="absolute top-8 left-4 bottom-[-24px] w-px bg-slate-200" />
                )}
                <div className="relative z-10 h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border-4 border-white">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between sm:items-center flex-col sm:flex-row">
                    <h4 className="text-sm font-medium text-slate-900">{activity.type}</h4>
                    <span className="text-xs text-slate-500">{activity.time}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Duração: {activity.duration} • Impacto:{' '}
                    <span className="font-medium text-slate-700">{activity.impact}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mobile FAB */}
      <Button className="md:hidden fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-floating z-40 p-0">
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}
