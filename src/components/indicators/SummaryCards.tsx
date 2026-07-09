import { Users, ClipboardList } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DashboardSummary } from '@/services/indicators-dashboard'

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  const cards = [
    {
      label: 'Pacientes ativos',
      value: summary.activePatients,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Avaliações no mês',
      value: summary.monthlyEvaluations,
      icon: ClipboardList,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="border-slate-200">
          <CardContent className="flex items-center gap-4 p-6">
            <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', card.bg)}>
              <card.icon className={cn('h-6 w-6', card.color)} />
            </div>
            <div>
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="text-3xl font-bold text-slate-900">{card.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
