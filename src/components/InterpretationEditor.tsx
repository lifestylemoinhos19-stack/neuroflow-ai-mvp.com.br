import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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

const findingColors: Record<string, string> = {
  TEA: 'border-purple-300 bg-purple-50',
  TDAH: 'border-blue-300 bg-blue-50',
  'Declínio Cognitivo': 'border-orange-300 bg-orange-50',
  Depressão: 'border-amber-300 bg-amber-50',
  Ansiedade: 'border-rose-300 bg-rose-50',
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
        setEditedText(saved?.adminEditedText || result?.suggestion || '')
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
      interpretation.assqScore,
      interpretation.snapIvScore,
      interpretation.asrs18Score,
      interpretation.mocaScore,
      interpretation.meemScore,
      interpretation.hamdScore,
      interpretation.hamaScore,
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

  const allScales: { label: string; score: number | null; badge?: string; badgeClass?: string }[] =
    [
      {
        label: 'PHQ-9',
        score: interpretation.phq9Score,
        badge: phq9SeverityLabels[interpretation.phq9Severity],
        badgeClass: severityColors[interpretation.phq9Severity],
      },
      {
        label: 'GAD-7',
        score: interpretation.gad7Score,
        badge: gad7SeverityLabels[interpretation.gad7Severity],
        badgeClass: severityColors[interpretation.gad7Severity],
      },
      { label: 'ASSQ', score: interpretation.assqScore },
      { label: 'SNAP-IV', score: interpretation.snapIvScore },
      { label: 'ASRS-18', score: interpretation.asrs18Score },
      { label: 'MoCA', score: interpretation.mocaScore },
      { label: 'MEEM', score: interpretation.meemScore },
      { label: 'HAM-D', score: interpretation.hamdScore },
      { label: 'HAM-A', score: interpretation.hamaScore },
    ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {allScales
          .filter((s) => s.score !== null)
          .map((s) => (
            <Card key={s.label} className="border-slate-200">
              <CardContent className="p-3">
                <p className="text-xs font-medium text-slate-600 mb-1">{s.label}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-slate-900">{s.score}</span>
                  {s.badge && (
                    <Badge className={cn('border text-xs', s.badgeClass)}>{s.badge}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {interpretation.cognitiveVrc !== null && (
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <p className="text-xs font-medium text-slate-600 mb-1">VRC</p>
            <span className="text-xl font-bold text-slate-900">
              {interpretation.cognitiveVrc.toFixed(2)}
            </span>
          </CardContent>
        </Card>
      )}

      {interpretation.findings.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Triagem Inicial — Sinais Detectados:</p>
          {interpretation.findings.map((f, i) => (
            <Alert
              key={i}
              className={cn('border', findingColors[f.category] || 'border-slate-200 bg-slate-50')}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>{f.suggestion}</strong>{' '}
                <span className="text-slate-500">
                  ({f.scale}: {f.score}, corte {f.threshold})
                </span>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {interpretation.comorbidities.length > 0 && (
        <Alert className="border-red-300 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Comorbidades detectadas:</strong> {interpretation.comorbidities.join('; ')}
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
          rows={6}
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
