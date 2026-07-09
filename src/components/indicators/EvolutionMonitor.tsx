import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import type { ClinicalEvolution } from '@/services/indicators-dashboard'

export function EvolutionMonitor({ evolution }: { evolution: ClinicalEvolution }) {
  const { improvement, stable, worsening, total, worseningPercentage } = evolution
  const hasAlert = worsening > 0

  const segments = [
    {
      label: 'Melhora',
      count: improvement,
      color: 'bg-emerald-500',
      icon: TrendingUp,
      textColor: 'text-emerald-600',
    },
    {
      label: 'Estável',
      count: stable,
      color: 'bg-blue-500',
      icon: Minus,
      textColor: 'text-blue-600',
    },
    {
      label: 'Piora',
      count: worsening,
      color: 'bg-red-500',
      icon: TrendingDown,
      textColor: 'text-red-600',
    },
  ]

  return (
    <div className="space-y-4">
      {hasAlert && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800">→ ALERTA!</AlertTitle>
          <AlertDescription className="text-red-700">
            {worsening} paciente{worsening > 1 ? 's' : ''} com piora clínica (
            {worseningPercentage.toFixed(1)}% da base avaliada).
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Evolução Clínica</CardTitle>
          <CardDescription>Classificação longitudinal da base de pacientes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {segments.map((seg) => {
            const pct = total > 0 ? (seg.count / total) * 100 : 0
            return (
              <div key={seg.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className={cn('flex items-center gap-2 font-medium', seg.textColor)}>
                    <seg.icon className="h-4 w-4" />
                    {seg.label}
                  </div>
                  <span className="text-slate-700 font-medium">
                    {seg.count} {seg.label === 'Piora' && hasAlert ? '· → ALERTA!' : ''}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', seg.color)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
          <p className="pt-2 text-xs text-slate-400">Total de pacientes com evolução: {total}</p>
        </CardContent>
      </Card>
    </div>
  )
}
