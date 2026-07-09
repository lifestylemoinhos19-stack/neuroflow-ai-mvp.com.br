import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ClinicalTrend } from '@/services/mini-evolution'

export function MiniTrendSummary({ trend }: { trend: ClinicalTrend }) {
  const trendConfig = {
    improving: {
      icon: TrendingUp,
      label: 'Melhorando',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
    },
    deteriorating: {
      icon: TrendingDown,
      label: 'Piorando',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
    },
    stable: {
      icon: Minus,
      label: 'Estável',
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
    },
  }
  const config = trendConfig[trend.trend]
  const Icon = config.icon

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className={cn('border', config.bg, config.border)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Icon className={cn('w-5 h-5', config.color)} />
            <CardTitle className={cn('text-lg', config.color)}>{config.label}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">
            {trend.totalSessions} sessão(ões) • {trend.currentPositiveCount} módulo(s) positivo(s)
          </p>
          {trend.previousPositiveCount > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              Anterior: {trend.previousPositiveCount} positivo(s) • Atual:{' '}
              {trend.currentPositiveCount}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-emerald-500/5 border-emerald-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-emerald-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Módulos Melhorados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trend.improved.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {trend.improved.map((m) => (
                <Badge
                  key={m.moduleKey}
                  className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                >
                  {m.moduleKey} - {m.moduleLabel}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Nenhum módulo melhorou</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-red-500/5 border-red-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-red-400 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" /> Módulos Piorados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trend.worsened.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {trend.worsened.map((m) => (
                <Badge key={m.moduleKey} className="bg-red-500/20 text-red-300 border-red-500/30">
                  {m.moduleKey} - {m.moduleLabel}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Nenhum módulo piorou</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
