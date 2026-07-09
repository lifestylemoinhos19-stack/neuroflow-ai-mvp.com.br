import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity } from 'lucide-react'
import {
  getIndicatorsDashboardData,
  type IndicatorsDashboardData,
} from '@/services/indicators-dashboard'
import { SummaryCards } from '@/components/indicators/SummaryCards'
import { PrevalenceChart } from '@/components/indicators/PrevalenceChart'
import { IncidenceTracker } from '@/components/indicators/IncidenceTracker'
import { EvolutionMonitor } from '@/components/indicators/EvolutionMonitor'

export default function IndicatorsDashboard() {
  const [data, setData] = useState<IndicatorsDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getIndicatorsDashboardData().then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [])

  if (loading || !data) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-80" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 flex items-center gap-2">
          <Activity className="h-7 w-7 text-primary" />
          Painel de Indicadores
        </h1>
        <p className="text-slate-500">Monitoramento clínico da base de pacientes</p>
      </div>

      <SummaryCards summary={data.summary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PrevalenceChart data={data.prevalence} />
        <IncidenceTracker data={data.incidence} />
      </div>

      <EvolutionMonitor evolution={data.evolution} />
    </div>
  )
}
