import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Save, Loader2 } from 'lucide-react'
import { snapivQuestions, snapivScaleLabels, getSnapivRiskLevel } from '@/lib/scales-data'
import { saveScaleResponses, logAuditAction } from '@/services/scales'
import { completeAnamnesisSession } from '@/services/anamnesis'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface SNAPIVProps {
  sessionId: string | null
}

export function SNAPIV({ sessionId }: SNAPIVProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const { toast } = useToast()

  const answeredCount = Object.keys(answers).length
  const progress = (answeredCount / snapivQuestions.length) * 100
  const inattQs = snapivQuestions.filter((q) => q.subscale === 'inattention')
  const hyperQs = snapivQuestions.filter((q) => q.subscale === 'hyperactivity')
  const inattAvg = inattQs.reduce((acc, q) => acc + (answers[q.key] ?? 0), 0) / inattQs.length
  const hyperAvg = hyperQs.reduce((acc, q) => acc + (answers[q.key] ?? 0), 0) / hyperQs.length
  const riskLevel = getSnapivRiskLevel(Math.max(inattAvg, hyperAvg))

  const handleSave = async () => {
    if (!sessionId || answeredCount < snapivQuestions.length) return
    setIsSaving(true)
    const responses = snapivQuestions.map((q) => ({
      question_key: q.key,
      question_label: `SNAP-IV Q${q.id} (${q.subscale})`,
      response_value: answers[q.key],
    }))
    const success = await saveScaleResponses(sessionId, responses)
    if (success) {
      await completeAnamnesisSession(sessionId)
      logAuditAction('snapiv_completed', 'anamnesis_sessions', sessionId, {
        inattAvg,
        hyperAvg,
        riskLevel,
      })
      setIsComplete(true)
      toast({
        title: 'SNAP-IV concluído!',
        description: `Desatenção: ${inattAvg.toFixed(2)} | Hiperatividade: ${hyperAvg.toFixed(2)}`,
      })
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar.' })
    }
    setIsSaving(false)
  }

  const riskLabel = (l: string) => (l === 'high' ? 'Alto' : l === 'medium' ? 'Médio' : 'Baixo')
  const riskColor = (l: string) =>
    l === 'high'
      ? 'bg-red-100 text-red-700'
      : l === 'medium'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-emerald-100 text-emerald-700'

  if (isComplete) {
    return (
      <Card className="shadow-subtle border-slate-100">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-600 mb-4" />
          <h3 className="text-xl font-display font-bold text-slate-900 mb-4">SNAP-IV Concluído</h3>
          <div className="grid grid-cols-2 gap-4 mb-4 w-full max-w-sm">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Desatenção</p>
              <p className="text-2xl font-bold text-slate-900">{inattAvg.toFixed(2)}</p>
              <p className="text-xs text-slate-400">/ 3.00</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Hiperatividade</p>
              <p className="text-2xl font-bold text-slate-900">{hyperAvg.toFixed(2)}</p>
              <p className="text-xs text-slate-400">/ 3.00</p>
            </div>
          </div>
          <div className={cn('px-4 py-2 rounded-full text-sm font-bold', riskColor(riskLevel))}>
            Risco {riskLabel(riskLevel)}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-slate-900">SNAP-IV</h3>
          <p className="text-sm text-slate-500">
            {answeredCount}/{snapivQuestions.length} respondidas
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={answeredCount < snapivQuestions.length || isSaving || !sessionId}
          className="rounded-full"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar & Continuar
        </Button>
      </div>
      <Progress value={progress} className="h-2" />

      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
        {snapivQuestions.map((q) => (
          <Card
            key={q.id}
            className={cn('border-slate-100', answers[q.key] !== undefined && 'shadow-subtle')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-slate-400">Q{q.id}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {q.subscale === 'inattention' ? 'Desatenção' : 'Hiperatividade'}
                </Badge>
              </div>
              <p className="text-sm text-slate-700 mb-3">{q.question}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {snapivScaleLabels.map((scale) => (
                  <Button
                    key={scale.value}
                    variant="outline"
                    size="sm"
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.key]: scale.value }))}
                    className={cn(
                      'rounded-lg text-xs h-auto py-2',
                      answers[q.key] === scale.value &&
                        'bg-primary text-primary-foreground border-primary',
                    )}
                  >
                    {scale.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
