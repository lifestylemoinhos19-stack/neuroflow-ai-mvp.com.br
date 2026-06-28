import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, Save, Loader2, BookOpen, ArrowRight } from 'lucide-react'
import { snapivQuestions, snapivScaleLabels, getSnapivRiskLevel } from '@/lib/scales-data'
import { saveScaleResponses, logAuditAction } from '@/services/scales'
import { completeAnamnesisSession } from '@/services/anamnesis'
import {
  getSnapivInterpretation,
  formatCitation,
  type ClinicalCitation,
} from '@/lib/clinical-references'
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
  const maxAvg = Math.max(inattAvg, hyperAvg)
  const riskLevel = getSnapivRiskLevel(maxAvg)
  const inattInterp = getSnapivInterpretation(inattAvg).interpretation
  const hyperInterp = getSnapivInterpretation(hyperAvg).interpretation
  const combinedType = inattAvg >= 1.5 && hyperAvg >= 1.5

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
        combinedType,
        clinicalReferences: [...inattInterp.citations, ...hyperInterp.citations],
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

  const riskLabel = (l: string) =>
    l === 'high' ? 'Alto Risco' : l === 'medium' ? 'Risco Moderado' : 'Baixo Risco'
  const riskColor = (l: string) =>
    l === 'high'
      ? 'bg-red-100 text-red-700'
      : l === 'medium'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-emerald-100 text-emerald-700'

  if (isComplete) {
    const allCitations = [
      ...(inattInterp.citations as ClinicalCitation[]),
      ...(hyperInterp.citations as ClinicalCitation[]),
    ]
    const uniqueCitations = allCitations.filter(
      (cite, idx, self) =>
        idx === self.findIndex((c) => c.code === cite.code && c.source === cite.source),
    )

    return (
      <Card className="shadow-subtle border-slate-100">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-600 mb-4" />
          <h3 className="text-xl font-display font-bold text-slate-900 mb-4">SNAP-IV Concluído</h3>
          <div className="grid grid-cols-2 gap-4 mb-4 w-full max-w-sm">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Desatenção (9 itens)</p>
              <p className="text-2xl font-bold text-slate-900">{inattAvg.toFixed(2)}</p>
              <p className="text-xs text-slate-400">/ 3.00 — Corte: 1.5</p>
              <div
                className={cn(
                  'mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold inline-block',
                  riskColor(getSnapivRiskLevel(inattAvg)),
                )}
              >
                {inattInterp.label}
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Hiperatividade (9 itens)</p>
              <p className="text-2xl font-bold text-slate-900">{hyperAvg.toFixed(2)}</p>
              <p className="text-xs text-slate-400">/ 3.00 — Corte: 1.5</p>
              <div
                className={cn(
                  'mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold inline-block',
                  riskColor(getSnapivRiskLevel(hyperAvg)),
                )}
              >
                {hyperInterp.label}
              </div>
            </div>
          </div>

          {combinedType && (
            <Badge className="mb-4 bg-purple-100 text-purple-700 border border-purple-200">
              Subtipo Sugerido: TDAH Tipo Combinado
            </Badge>
          )}

          <div
            className={cn('px-4 py-2 rounded-full text-sm font-bold mb-4', riskColor(riskLevel))}
          >
            Risco Geral: {riskLabel(riskLevel)}
          </div>

          <Alert
            className={cn(
              'text-left mb-4 w-full max-w-lg',
              riskLevel === 'high'
                ? 'border-red-200 bg-red-50'
                : riskLevel === 'medium'
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-emerald-200 bg-emerald-50',
            )}
          >
            <ArrowRight className="h-4 w-4 text-slate-600" />
            <AlertTitle className="text-sm font-semibold text-slate-800">
              Interpretação conforme protocolo SNAP-IV oficial
            </AlertTitle>
            <AlertDescription className="text-sm text-slate-700 mt-1">
              {riskLevel === 'high'
                ? inattInterp.action
                : riskLevel === 'medium'
                  ? inattInterp.action
                  : inattInterp.action}
            </AlertDescription>
          </Alert>

          <div className="w-full max-w-lg space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-slate-600" />
              <p className="text-xs font-semibold text-slate-700">Referências Clínicas</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {uniqueCitations.map((cite, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-[10px] bg-slate-100 text-slate-600"
                >
                  {formatCitation(cite)}
                </Badge>
              ))}
            </div>
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
                  {q.subscale === 'inattention' ? 'Desatenção' : 'Hiperatividade/Impulsividade'}
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
