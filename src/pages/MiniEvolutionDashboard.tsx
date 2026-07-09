import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, FileText, Brain, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/auth-context'
import { MiniEvolutionChart } from '@/components/MiniEvolutionChart'
import { MiniModuleTimeline } from '@/components/MiniModuleTimeline'
import { MiniTrendSummary } from '@/components/MiniTrendSummary'
import {
  getMiniSessions,
  calculateClinicalTrend,
  generateAIReport,
  generateMockSessions,
  MiniSessionResult,
} from '@/services/mini-evolution'

export default function MiniEvolutionDashboard() {
  const { patientId } = useParams()
  const { user } = useAuth()

  const [sessions, setSessions] = useState<MiniSessionResult[]>([])
  const [loading, setLoading] = useState(true)
  const [aiReport, setAiReport] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const effectiveId = patientId || user?.id || ''
  const trend = useMemo(() => calculateClinicalTrend(sessions), [sessions])

  useEffect(() => {
    if (!effectiveId) {
      setLoading(false)
      return
    }
    setLoading(true)
    getMiniSessions(effectiveId)
      .then((data) => setSessions(data.length > 0 ? data : generateMockSessions()))
      .catch(() => setSessions(generateMockSessions()))
      .finally(() => setLoading(false))
  }, [effectiveId])

  const handleGenerate = async () => {
    setGenerating(true)
    setDialogOpen(true)
    const { data } = await generateAIReport(effectiveId, sessions)
    setAiReport(data?.reply || 'Erro ao gerar relatório.')
    setGenerating(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 animate-fade-in-up">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            Evolução Clínica MINI 5.0.0
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Paciente: {effectiveId ? `${effectiveId.slice(0, 8)}...` : 'Não identificado'}
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating || sessions.length === 0}
          className="bg-cyan-600 hover:bg-cyan-500 text-white"
        >
          <Brain className="w-4 h-4 mr-2" />
          Gerar Resumo Clínico IA
        </Button>
      </div>

      <MiniTrendSummary trend={trend} />

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-cyan-300">Evolução de Módulos Positivos</CardTitle>
        </CardHeader>
        <CardContent>
          <MiniEvolutionChart sessions={sessions} />
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-cyan-300">Linha do Tempo por Módulo</CardTitle>
        </CardHeader>
        <CardContent>
          <MiniModuleTimeline sessions={sessions} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-cyan-300 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Resumo Clínico IA — MINI 5.0.0
            </DialogTitle>
          </DialogHeader>
          {generating ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-sm text-slate-300 max-h-[60vh] overflow-y-auto">
              {aiReport}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
