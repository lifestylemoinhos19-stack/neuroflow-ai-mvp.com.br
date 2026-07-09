import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Calendar, Brain } from 'lucide-react'
import { type PatientEvaluation, getGlobalSeverityConfig } from '@/services/patient-history'
import { cn } from '@/lib/utils'

const scoreFields = [
  { key: 'phq9_score', label: 'PHQ-9', color: 'text-indigo-600', lowerIsBetter: true },
  { key: 'gad7_score', label: 'GAD-7', color: 'text-cyan-600', lowerIsBetter: true },
  {
    key: 'snap_iv_inattention',
    label: 'SNAP-IV Desat.',
    color: 'text-purple-600',
    lowerIsBetter: true,
  },
  {
    key: 'snap_iv_hyperactivity',
    label: 'SNAP-IV Hiper.',
    color: 'text-fuchsia-600',
    lowerIsBetter: true,
  },
  { key: 'moca_score', label: 'MoCA', color: 'text-amber-600', lowerIsBetter: false },
  { key: 'assq_score', label: 'ASSQ', color: 'text-blue-600', lowerIsBetter: true },
  { key: 'hamd_score', label: 'HAM-D', color: 'text-rose-600', lowerIsBetter: true },
  { key: 'hama_score', label: 'HAM-A', color: 'text-orange-600', lowerIsBetter: true },
] as const

function DeltaIndicator({
  current,
  previous,
  lowerIsBetter,
}: {
  current: number | null
  previous: number | null
  lowerIsBetter: boolean
}) {
  if (current === null || previous === null) return null
  const delta = +(current - previous).toFixed(2)
  if (delta === 0) return <Minus className="h-3 w-3 text-slate-400" />
  const isImprovement = lowerIsBetter ? delta < 0 : delta > 0
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs font-medium',
        isImprovement ? 'text-emerald-500' : 'text-red-500',
      )}
    >
      {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(delta)}
    </span>
  )
}

export function PatientHistoryTimeline({ evaluations }: { evaluations: PatientEvaluation[] }) {
  if (evaluations.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">Nenhuma avaliação encontrada.</p>
  }

  return (
    <div className="relative space-y-4 before:absolute before:left-4 before:top-0 before:bottom-0 before:w-px before:bg-slate-200">
      {evaluations.map((ev, idx) => {
        const severity = getGlobalSeverityConfig(ev.global_severity)
        const previous = idx > 0 ? evaluations[idx - 1] : null
        return (
          <div key={ev.feedback_id} className="relative pl-10">
            <div className="absolute left-2.5 top-4 w-3 h-3 rounded-full bg-primary border-2 border-white shadow" />
            <Card className="border-slate-200 shadow-subtle">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-900">
                      {new Date(ev.started_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <Badge className={cn('border-0 text-xs', severity.className)}>
                    Severidade: {severity.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {scoreFields.map((field) => {
                    const value = (ev as any)[field.key] as number | null
                    const prevValue = previous
                      ? ((previous as any)[field.key] as number | null)
                      : null
                    return (
                      <div key={field.key} className="bg-slate-50 rounded-lg p-2 text-center">
                        <p className="text-[10px] text-slate-500 font-medium">{field.label}</p>
                        <p className={cn('text-lg font-bold', field.color)}>
                          {value !== null ? value : '—'}
                        </p>
                        {idx > 0 && (
                          <DeltaIndicator
                            current={value}
                            previous={prevValue}
                            lowerIsBetter={field.lowerIsBetter}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>

                {ev.system_suggestion && (
                  <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                    <p className="text-xs font-medium text-indigo-700 flex items-center gap-1 mb-1">
                      <Brain className="h-3 w-3" /> Classificação da IA
                    </p>
                    <p className="text-xs text-indigo-900 line-clamp-3">{ev.system_suggestion}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
