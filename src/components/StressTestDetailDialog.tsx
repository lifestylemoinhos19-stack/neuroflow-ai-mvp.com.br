import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BookOpen, Brain, ShieldAlert, CheckCircle2, XCircle, Clock } from 'lucide-react'
import type { ScenarioResult } from '@/services/stress-test'
import { formatCitation } from '@/lib/clinical-references'
import { cn } from '@/lib/utils'

export function StressTestDetailDialog({
  result,
  open,
  onOpenChange,
}: {
  result: ScenarioResult | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!result) return null

  const { scenario, passed, actualOutput, failures, durationMs } = result

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {passed ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <DialogTitle className="text-base">{scenario.title}</DialogTitle>
          </div>
          <DialogDescription className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span className={durationMs > 5000 ? 'text-red-600 font-bold' : ''}>
              {durationMs}ms
            </span>
            {durationMs > 5000 && <span className="text-red-500 text-xs">⚠ Alta latência</span>}·{' '}
            {scenario.id}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-700">O que o usuário disse</h4>
              <p className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                "{scenario.inputPrompt}"
              </p>
            </div>

            {actualOutput && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700">O que a IA encontrou</h4>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    Categoria: {actualOutput.category}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Risco: {actualOutput.riskLevel ?? 'N/A'}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Escala: {actualOutput.scaleSuggestion}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs',
                      actualOutput.safetyFlag !== 'none' &&
                        actualOutput.safetyFlag !== 'adaptive_anamnesis' &&
                        'bg-red-50 text-red-600',
                    )}
                  >
                    Safety: {actualOutput.safetyFlag}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500">Racional Clínico</p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {actualOutput.clinicalRationale}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500">Ação Sugerida</p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {actualOutput.suggestedAction}
                  </p>
                </div>
              </div>
            )}

            {actualOutput?.clinicalCitations && actualOutput.clinicalCitations.length > 0 && (
              <div className="space-y-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-slate-600" />
                  <h4 className="text-sm font-semibold text-slate-700">
                    Referências Utilizadas (RAG)
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {actualOutput.clinicalCitations.map((cite, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="text-xs bg-white border border-slate-200"
                    >
                      <BookOpen className="h-3 w-3 mr-1 text-slate-400" />
                      {formatCitation(cite)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {actualOutput?.safetyMessage && actualOutput.safetyFlag !== 'none' && (
              <div
                className={cn(
                  'p-3 rounded-lg border text-sm',
                  actualOutput.safetyFlag === 'absolute_contraindication'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : actualOutput.safetyFlag === 'relative_contraindication'
                      ? 'bg-orange-50 border-orange-200 text-orange-700'
                      : 'bg-amber-50 border-amber-200 text-amber-700',
                )}
              >
                <ShieldAlert className="h-4 w-4 inline mr-1" />
                {actualOutput.safetyMessage}
              </div>
            )}

            {failures.length > 0 && (
              <div className="space-y-1 p-3 rounded-lg bg-red-50 border border-red-100">
                <p className="text-xs font-bold text-red-700">Falhas Detectadas</p>
                <ul className="space-y-0.5">
                  {failures.map((f, i) => (
                    <li key={i} className="text-xs text-red-600 flex items-start gap-1">
                      <XCircle className="h-2.5 w-2.5 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
