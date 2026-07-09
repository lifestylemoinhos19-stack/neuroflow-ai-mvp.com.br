import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { IncidenceItem } from '@/services/indicators-dashboard'

export function IncidenceTracker({ data }: { data: IncidenceItem[] }) {
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-base">Incidência Mensal</CardTitle>
        <CardDescription>Comparação de novos achados vs. mês anterior</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((item) => {
          const isUp = item.variation !== null && item.variation > 0
          const isDown = item.variation !== null && item.variation < 0
          const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus
          const colorClass = isUp
            ? 'text-red-600 bg-red-50'
            : isDown
              ? 'text-emerald-600 bg-emerald-50'
              : 'text-slate-500 bg-slate-100'

          return (
            <div
              key={item.condition}
              className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-700">{item.label}</p>
                <p className="text-xs text-slate-400">
                  {item.currentMonth} este mês · {item.previousMonth} mês anterior
                </p>
              </div>
              <div
                className={cn(
                  'flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold',
                  colorClass,
                )}
              >
                <Icon className="h-4 w-4" />
                {item.variation !== null
                  ? `${item.variation > 0 ? '+' : ''}${item.variation}%`
                  : '—'}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
