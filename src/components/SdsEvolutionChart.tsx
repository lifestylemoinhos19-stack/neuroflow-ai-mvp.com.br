import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { SdsEvolutionPoint } from '@/services/sds-evolution'

const chartConfig = {
  sdsTotal: {
    label: 'SDS Total',
    color: 'hsl(var(--primary))',
  },
  workTotal: {
    label: 'Sherra Work',
    color: '#FF6B6B',
  },
} satisfies ChartConfig

export function SdsEvolutionChart({ data }: { data: SdsEvolutionPoint[] }) {
  const chartData = data.map((d, i) => ({
    name: `S${i + 1}`,
    date: d.dateLabel,
    sdsTotal: d.sdsTotal,
    workTotal: d.workTotal,
    daysLost: d.daysLost,
  }))

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
        <XAxis
          dataKey="date"
          stroke="rgba(255,255,255,0.4)"
          tick={{ fontSize: 10 }}
          angle={-20}
          textAnchor="end"
          height={60}
        />
        <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} allowDecimals={false} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(_value, name, item) => (
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-cyan-300">{item.payload.date}</span>
                  <span>SDS Total: {item.payload.sdsTotal}/30</span>
                  <span>Sherra Work: {item.payload.workTotal}/30</span>
                  <span className="text-xs text-slate-400">
                    Dias Perdidos: {item.payload.daysLost}/7
                  </span>
                </div>
              )}
            />
          }
        />
        <Line
          type="monotone"
          dataKey="sdsTotal"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--primary))', r: 5 }}
          activeDot={{ r: 7 }}
        />
        <Line
          type="monotone"
          dataKey="workTotal"
          stroke="#FF6B6B"
          strokeWidth={2}
          dot={{ fill: '#FF6B6B', r: 5 }}
          activeDot={{ r: 7 }}
        />
      </LineChart>
    </ChartContainer>
  )
}
