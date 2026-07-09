import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { MiniSessionResult } from '@/services/mini-evolution'

const chartConfig = {
  positiveCount: {
    label: 'Módulos Positivos',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

export function MiniEvolutionChart({ sessions }: { sessions: MiniSessionResult[] }) {
  const data = sessions.map((s, i) => ({
    name: `S${i + 1}`,
    date: s.dateLabel,
    positiveCount: s.positiveModules.length,
    positiveKeys: s.positiveModules.map((m) => m.moduleKey).join(', '),
  }))

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <LineChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
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
              labelKey="positiveCount"
              formatter={(value, _name, item) => (
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-cyan-300">{item.payload.date}</span>
                  <span>Módulos positivos: {value}</span>
                  {item.payload.positiveKeys && (
                    <span className="text-xs text-slate-400">
                      Positivos: {item.payload.positiveKeys}
                    </span>
                  )}
                </div>
              )}
            />
          }
        />
        <Line
          type="monotone"
          dataKey="positiveCount"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--primary))', r: 5 }}
          activeDot={{ r: 7 }}
        />
      </LineChart>
    </ChartContainer>
  )
}
