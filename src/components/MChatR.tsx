import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle2,
  Save,
  Loader2,
  FileText,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  HelpCircle,
} from 'lucide-react'
import { mchatQuestions, getMChatRiskLevel } from '@/lib/scales-data'
import { mchatHelpTexts } from '@/lib/scale-help-texts'
import { saveScaleResponses, logAuditAction } from '@/services/scales'
import { completeAnamnesisSession } from '@/services/anamnesis'
import {
  getMChatFlowchartResult,
  formatCitation,
  type ClinicalCitation,
} from '@/lib/clinical-references'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface MChatRProps {
  sessionId: string | null
}

export function MChatR({ sessionId }: MChatRProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const { toast } = useToast()

  const answeredCount = Object.keys(answers).length
  const progress = (answeredCount / mchatQuestions.length) * 100
  const score = mchatQuestions.filter((q) => answers[q.key] === q.riskAnswer).length
  const riskLevel = getMChatRiskLevel(score)
  const flowchart = getMChatFlowchartResult(score).flowchart
  const currentQ = mchatQuestions[currentIndex]

  const handleAnswer = (answer: string) => {
    setAnswers((prev) => ({ ...prev, [currentQ.key]: answer }))
    setShowHelp(false)
    if (currentIndex < mchatQuestions.length - 1) {
      setTimeout(() => setCurrentIndex((i) => i + 1), 300)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setShowHelp(false)
      setCurrentIndex((i) => i - 1)
    }
  }

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
      logAuditAction('mchat_completed', 'anamnesis_sessions', sessionId, {
        score,
        riskLevel,
        flowchartStep: flowchart.label,
        clinicalReferences: flowchart.citations,
      })
      setIsComplete(true)
      toast({
        title: 'M-CHAT-R concluído!',
        description: `Pontuação: ${score}/20 — ${flowchart.label}`,
      })
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar.' })
    }
    setIsSaving(false)
  }

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
            {flowchart.label} — Pontuação {score}/20
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
            <FileText className="h-4 w-4 text-slate-600" />
            <AlertTitle className="text-sm font-semibold text-slate-800">
              Fluxograma M-CHAT-R/F — Passo Recomendado
            </AlertTitle>
            <AlertDescription className="text-sm text-slate-700 mt-1">
              {flowchart.action}
            </AlertDescription>
            {flowchart.nextStep && (
              <div className="mt-2 flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600">{flowchart.nextStep}</p>
              </div>
            )}
          </Alert>
          <div className="w-full max-w-lg space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-slate-600" />
              <p className="text-xs font-semibold text-slate-700">Referências Clínicas</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {flowchart.citations.map((cite: ClinicalCitation, i: number) => (
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
          <p className="text-sm text-slate-500 max-w-md">
            {riskLevel === 'high' &&
              'Encaminhamento imediato para avaliação diagnóstica (neuropediatra/psiquiatra infantil).'}
            {riskLevel === 'medium' && 'Aplicar M-CHAT-R/F (Follow-up Interview) para confirmação.'}
            {riskLevel === 'low' &&
              'Nenhum indicador de risco significativo. Continuar monitoramento de rotina.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  const isLastQuestion = currentIndex === mchatQuestions.length - 1

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-slate-900">M-CHAT-R</h3>
          <p className="text-sm text-slate-500">
            {currentIndex + 1} de {mchatQuestions.length}
          </p>
        </div>
        {isLastQuestion && answeredCount === mchatQuestions.length && (
          <Button onClick={handleSave} disabled={isSaving || !sessionId} className="rounded-full">
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar & Continuar
          </Button>
        )}
      </div>
      <Progress value={progress} className="h-2" />

      <div key={currentIndex} className="animate-fade-in-up">
        <Card
          className={cn(
            'border-slate-100 transition-all',
            answers[currentQ.key] && 'shadow-subtle',
          )}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-slate-400">Q{currentQ.id}</span>
              {currentQ.isCritical && (
                <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-600">
                  Crítica
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(!showHelp)}
                className="ml-auto text-xs text-slate-500"
              >
                <HelpCircle className="h-3.5 w-3.5 mr-1" /> Dúvida
              </Button>
            </div>
            <p className="text-base text-slate-800 mb-4 leading-relaxed">{currentQ.question}</p>

            {showHelp && (
              <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-100 animate-fade-in-up">
                <p className="text-xs text-blue-700 leading-relaxed">
                  {mchatHelpTexts[currentQ.key]}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {['Sim', 'Não'].map((opt) => (
                <Button
                  key={opt}
                  variant="outline"
                  onClick={() => handleAnswer(opt)}
                  className={cn(
                    'rounded-xl flex-1 h-12 text-sm font-medium transition-all',
                    answers[currentQ.key] === opt &&
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
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="rounded-full"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>
        {answers[currentQ.key] && !isLastQuestion && (
          <span className="text-xs text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Respondida
          </span>
        )}
      </div>
    </div>
  )
}
