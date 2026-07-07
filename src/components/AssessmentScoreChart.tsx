import { Bar, BarChart, XAxis, YAxis, ReferenceLine, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

type ScaleType = 'snap-iv' | 'assq' | 'cbcl'

interface Props {
  scaleType: ScaleType
  result: Record<string, unknown>
}

const chartConfig: ChartConfig = {
  score: { label: 'Pontuação', color: '#00FFFF' },
  threshold: { label: 'Limiar Clínico', color: '#FF6B6B' },
}

export function AssessmentScoreChart({ scaleType, result }: Props) {
  let data: { name: string; score: number; threshold: number }[] = []
  let yMax = 10

  if (scaleType === 'snap-iv') {
    data = [
      { name: 'Desatenção', score: Number(result.inattentionHigh) || 0, threshold: 6 },
      { name: 'Hiperatividade', score: Number(result.hyperactivityHigh) || 0, threshold: 6 },
    ]
    yMax = 9
  } else if (scaleType === 'assq') {
    data = [
      {
        name: 'Pontuação Total',
        score: Number(result.total) || 0,
        threshold: Number(result.threshold) || 19,
      },
    ]
    yMax = 60
  } else {
    data = [
      { name: 'Internalizante', score: Number(result.internalizing) || 0, threshold: 8 },
      { name: 'Externalizante', score: Number(result.externalizing) || 0, threshold: 7 },
    ]
    yMax = 30
  }

  return (
    <div className="mt-4">
      <p className="text-xs text-white/50 mb-2 text-center">
        Gráfico de Pontuação vs Limiar Clínico
      </p>
      <ChartContainer config={chartConfig} className="h-[200px] w-full">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: '#ffffff80', fontSize: 11 }}
            axisLine={{ stroke: '#ffffff20' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, yMax]}
            tick={{ fill: '#ffffff80', fontSize: 11 }}
            axisLine={{ stroke: '#ffffff20' }}
            tickLine={false}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          {data.map((d, i) => (
            <ReferenceLine key={i} y={d.threshold} stroke="#FF6B6B" strokeDasharray="5 5" />
          ))}
          <Bar dataKey="score" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.score >= entry.threshold ? '#FF6B6B' : '#00FFFF'} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}
