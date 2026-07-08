import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, Brain, AlertCircle, RotateCcw } from 'lucide-react'
import {
  getSessionInterpretation,
  saveInterpretation,
  getSavedInterpretation,
  type InterpretationResult,
} from '@/services/clinical-interpretation'
import { phq9SeverityLabels, gad7SeverityLabels } from '@/lib/phq9-gad7-data'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const severityColors: Record<string, string> = {
  severe: 'bg-red-500/20 text-red-400 border-red-500/30',
  moderately_severe: 'bg-red-500/20 text-red-400 border-red-500/30',
  moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  mild: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  minimal: 'bg-green-500/20 text-green-400 border-green-500/30',
}

export function InterpretationEditor({ sessionId }: { sessionId: string }) {
  const [interpretation, setInterpretation] = useState<InterpretationResult | null>(null)
  const [editedText, setEditedText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true
    setLoading(true)
    Promise.all([getSessionInterpretation(sessionId), getSavedInterpretation(sessionId)]).then(
      ([result, saved]) => {
        if (!mounted) return
        setInterpretation(result)
        if (saved?.adminEditedText) {
          setEditedText(saved.adminEditedText)
        } else if (result?.suggestion) {
          setEditedText(result.suggestion)
        }
        setLoading(false)
      },
    )
    return () => {
      mounted = false
    }
  }, [sessionId])

  const handleSave = async () => {
    if (!interpretation) return
    setSaving(true)
    const { error } = await saveInterpretation(
      sessionId,
      interpretation.suggestion,
      editedText,
      interpretation.phq9Score,
      interpretation.gad7Score,
      interpretation.cognitiveVrc,
    )
    setSaving(false)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
      return
    }
    toast({ title: 'Interpretação salva', description: 'A interpretação foi salva com sucesso.' })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    )
  }

  if (!interpretation) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Não foi possível carregar os dados desta sessão.</AlertDescription>
      </Alert>
    )
  }

  if (!interpretation.hasScaleData) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">{interpretation.suggestion}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">PHQ-9 (Depressão)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-slate-900">{interpretation.phq9Score}</span>
              <Badge
                className={cn(
                  'border',
                  severityColors[interpretation.phq9Severity] || severityColors.minimal,
                )}
              >
                {phq9SeverityLabels[interpretation.phq9Severity]}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">GAD-7 (Ansiedade)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-slate-900">{interpretation.gad7Score}</span>
              <Badge
                className={cn(
                  'border',
                  severityColors[interpretation.gad7Severity] || severityColors.minimal,
                )}
              >
                {gad7SeverityLabels[interpretation.gad7Severity]}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {interpretation.cognitiveVrc !== null && (
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Performance Cognitiva (VRC)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-slate-900">
              {interpretation.cognitiveVrc.toFixed(2)}
            </span>
          </CardContent>
        </Card>
      )}

      {interpretation.hasComorbidity && (
        <Alert className="border-amber-300 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Comorbidade detectada:</strong> PHQ-9 ≥ 15 e GAD-7 ≥ 10.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
            <Brain className="h-4 w-4 text-primary" />
            Sugestão do Sistema (editável)
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditedText(interpretation.suggestion)}
            className="text-xs text-primary"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Restaurar original
          </Button>
        </div>
        <Textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          rows={5}
          className="resize-none"
          placeholder="A sugestão gerada pelo sistema aparecerá aqui. Você pode editá-la antes de finalizar."
        />
        <Button onClick={handleSave} disabled={saving || !editedText.trim()} size="sm">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" /> Salvar Interpretação
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
