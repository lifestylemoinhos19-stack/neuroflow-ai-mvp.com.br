import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Save, Loader2 } from 'lucide-react'
import { mchatQuestions, getMChatRiskLevel } from '@/lib/scales-data'
import { saveScaleResponses, logAuditAction } from '@/services/scales'
import { completeAnamnesisSession } from '@/services/anamnesis'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface MChatRProps {
  sessionId: string | null
}

export function MChatR({ sessionId }: MChatRProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const { toast } = useToast()

  const answeredCount = Object.keys(answers).length
  const progress = (answeredCount / mchatQuestions.length) * 100
  const score = mchatQuestions.filter((q) => answers[q.key] === q.riskAnswer).length
  const riskLevel = getMChatRiskLevel(score)

  const handleSave = async () => {
    if (!sessionId || answeredCount < mchatQuestions.length) return
    setIsSaving(true)
    const responses = mchatQuestions.map((q) => ({
      question_key: q.key,
      question_label: `M-CHAT-R Q${q.id}`,
      response_value: answers[q.key],
    }))
    const success = await saveScaleResponses(sessionId, responses)
    if (success) {
      await completeAnamnesisSession(sessionId)
      logAuditAction('mchat_completed', 'anamnesis_sessions', sessionId, { score, riskLevel })
      setIsComplete(true)
      toast({
        title: 'M-CHAT-R concluído!',
        description: `Pontuação: ${score}/20 — Risco: ${riskLabel(riskLevel)}`,
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
          <h3 className="text-xl font-display font-bold text-slate-900 mb-2">M-CHAT-R Concluído</h3>
          <div
            className={cn('px-4 py-2 rounded-full text-sm font-bold mb-4', riskColor(riskLevel))}
          >
            Risco {riskLabel(riskLevel)} — Pontuação {score}/20
          </div>
          <p className="text-sm text-slate-500 max-w-md">
            {riskLevel === 'high' && 'Recomenda-se avaliação profissional detalhada.'}
            {riskLevel === 'medium' && 'Recomenda-se entrevista de acompanhamento (M-CHAT-R/F).'}
            {riskLevel === 'low' && 'Nenhum indicador de risco significativo identificado.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-slate-900">M-CHAT-R</h3>
          <p className="text-sm text-slate-500">
            {answeredCount}/{mchatQuestions.length} respondidas
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={answeredCount < mchatQuestions.length || isSaving || !sessionId}
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
        {mchatQuestions.map((q) => (
          <Card
            key={q.id}
            className={cn('border-slate-100 transition-all', answers[q.key] && 'shadow-subtle')}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-400">Q{q.id}</span>
                    {q.isCritical && (
                      <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-600">
                        Crítica
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-700">{q.question}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {['Sim', 'Não'].map((opt) => (
                  <Button
                    key={opt}
                    variant="outline"
                    size="sm"
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.key]: opt }))}
                    className={cn(
                      'rounded-full flex-1',
                      answers[q.key] === opt &&
                        (opt === 'Sim'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-slate-700 text-white border-slate-700'),
                    )}
                  >
                    {opt}
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
