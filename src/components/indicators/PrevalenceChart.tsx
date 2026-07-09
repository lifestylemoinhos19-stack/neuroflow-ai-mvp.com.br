import { Pie, PieChart, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { PrevalenceItem } from '@/services/indicators-dashboard'

const chartConfig: ChartConfig = {
  tdah: { label: 'TDAH', color: 'hsl(var(--chart-1))' },
  tea: { label: 'TEA', color: 'hsl(var(--chart-2))' },
  depression: { label: 'Depressão', color: 'hsl(var(--chart-3))' },
  anxiety: { label: 'Ansiedade', color: 'hsl(var(--chart-4))' },
}

export function PrevalenceChart({ data }: { data: PrevalenceItem[] }) {
  const chartData = data.map((item) => ({ name: item.label, value: item.count, fill: item.color }))
  const hasData = data.some((d) => d.count > 0)

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-base">Prevalência Clínica</CardTitle>
        <CardDescription>Distribuição das hipóteses diagnósticas na base</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <>
            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[260px]">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
            <div className="mt-4 space-y-2">
              {data.map((item) => (
                <div key={item.condition} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-700">{item.label}</span>
                  </div>
                  <span className="font-medium text-slate-900">
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-slate-400 py-12">Nenhum dado de prevalência disponível.</p>
        )}
      </CardContent>
    </Card>
  )
}
