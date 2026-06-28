import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { api } from '@/lib/api'
import { Brain } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'

export default function Insights() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    api.data.getInsights().then(setData)
  }, [])

  const chartConfig = {
    focus: { label: 'Foco', color: 'hsl(var(--chart-1))' },
    sleep: { label: 'Sono', color: 'hsl(var(--chart-2))' },
    stress: { label: 'Estresse', color: 'hsl(var(--chart-4))' },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">IA Insights</h1>
        <p className="text-slate-500">Análise profunda dos seus padrões neurológicos.</p>
      </div>

      <Card className="shadow-subtle border-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-primary" /> Tendências Semanais
          </CardTitle>
          <CardDescription>
            Como seus níveis de foco, sono e estresse interagem ao longo do tempo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!data ? (
            <Skeleton className="h-[350px] w-full" />
          ) : (
            <div className="h-[350px] w-full mt-4">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillFocus" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-focus)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-focus)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="fillSleep" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-sleep)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-sleep)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="fillStress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-stress)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-stress)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--slate-200))"
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--slate-500))' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--slate-500))' }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Area
                      type="monotone"
                      dataKey="sleep"
                      stroke="var(--color-sleep)"
                      fillOpacity={1}
                      fill="url(#fillSleep)"
                    />
                    <Area
                      type="monotone"
                      dataKey="focus"
                      stroke="var(--color-focus)"
                      fillOpacity={1}
                      fill="url(#fillFocus)"
                    />
                    <Area
                      type="monotone"
                      dataKey="stress"
                      stroke="var(--color-stress)"
                      fillOpacity={1}
                      fill="url(#fillStress)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-subtle border-slate-100 bg-slate-900 text-white">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-2">Correlação Detectada</h3>
            <p className="text-slate-300 text-sm">
              A IA identificou que noites com sono superior a 7.5h (Qualidade Alta) resultam em
              picos de foco sustentado na manhã seguinte. Recomendamos manter o horário de dormir
              até às 23h.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-subtle border-slate-100">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-2 text-slate-900">Alerta de Fadiga</h3>
            <p className="text-slate-500 text-sm">
              Seus níveis de estresse aumentaram gradualmente de Quarta para Quinta-feira. Sugerimos
              agendar blocos de descanso ativo amanhã.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
