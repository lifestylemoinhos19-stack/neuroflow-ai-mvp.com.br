import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Brain,
  ShieldAlert,
  Send,
  Loader2,
  AlertTriangle,
  Stethoscope,
  History,
  CheckCircle2,
} from 'lucide-react'
import {
  runNeuroValidation,
  getValidationHistory,
  type ValidationResult,
  type AuditLogEntry,
} from '@/services/neuro-validation'
import { cn } from '@/lib/utils'

const EXAMPLE_SCENARIOS = [
  { label: 'TEA - Risco Alto', text: 'Criança de 2 anos sem contato visual e sem apontar' },
  { label: 'TDAH - Indicadores', text: 'Inquietude severa e falta de foco escolar' },
  { label: 'Segurança - EMT', text: 'Posso fazer EMT com implante coclear?' },
  { label: 'Fora de Escopo', text: 'Como tratar gripe?' },
]

function riskBadgeVariant(risk: string | null): string {
  if (risk === 'high') return 'bg-red-100 text-red-700 border-red-200'
  if (risk === 'medium') return 'bg-amber-100 text-amber-700 border-amber-200'
  if (risk === 'low') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  return 'bg-slate-100 text-slate-600 border-slate-200'
}

function riskLabel(risk: string | null): string {
  if (risk === 'high') return 'Alto Risco'
  if (risk === 'medium') return 'Risco Médio'
  if (risk === 'low') return 'Baixo Risco'
  return 'N/A'
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    TEA: 'Transtorno do Espectro Autista',
    TDAH: 'Transtorno de Déficit de Atenção/Hiperatividade',
    SAFETY_ALERT: 'Alerta de Segurança',
    OUT_OF_SCOPE: 'Fora de Escopo',
    GENERAL: 'Geral',
  }
  return map[cat] || cat
}

export function NeuroValidationPanel() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState<AuditLogEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const loadHistory = useCallback(async () => {
    const h = await getValidationHistory()
    setHistory(h)
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleValidate = async () => {
    if (!input.trim() || isLoading) return
    setIsLoading(true)
    const response = await runNeuroValidation(input.trim())
    if (response) {
      setResult(response.result)
      await loadHistory()
    }
    setIsLoading(false)
  }

  const handleExample = (text: string) => {
    setInput(text)
    setResult(null)
  }

  const isSafety = result?.safetyFlag === 'absolute_contraindication'
  const isOutOfScope = result?.safetyFlag === 'out_of_scope'

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display">NeuroFlow AI — Validação Clínica</CardTitle>
              <CardDescription>
                Motor de RAG clínico para triagem de TEA e TDAH com guardrails de segurança
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {EXAMPLE_SCENARIOS.map((ex) => (
                <Button
                  key={ex.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleExample(ex.text)}
                  className="rounded-full text-xs"
                >
                  {ex.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite o input clínico para análise (ex: 'Criança de 2 anos sem contato visual e sem apontar')..."
              className="min-h-[100px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleValidate()
                }
              }}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-slate-400">Ctrl+Enter para enviar</p>
              <Button
                onClick={handleValidate}
                disabled={!input.trim() || isLoading}
                className="rounded-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Validar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card
          className={cn(
            'border-2 shadow-md animate-fade-in-up',
            isSafety && 'border-red-300',
            isOutOfScope && 'border-amber-300',
            !isSafety && !isOutOfScope && 'border-slate-200',
          )}
        >
          <CardContent className="pt-6 space-y-4">
            {isSafety && (
              <Alert variant="destructive" className="border-red-300 bg-red-50">
                <ShieldAlert className="h-5 w-5 text-red-600" />
                <AlertTitle className="text-red-800 font-bold">
                  🚫 CONTRAINDICAÇÃO ABSOLUTA
                </AlertTitle>
                <AlertDescription className="text-red-700">{result.safetyMessage}</AlertDescription>
              </Alert>
            )}

            {isOutOfScope && (
              <Alert className="border-amber-300 bg-amber-50">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <AlertTitle className="text-amber-800 font-bold">
                  ⚠️ Solicitação Fora de Escopo
                </AlertTitle>
                <AlertDescription className="text-amber-700">
                  {result.safetyMessage}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn('text-xs font-semibold', riskBadgeVariant(result.riskLevel))}
              >
                {categoryLabel(result.category)}
              </Badge>
              {result.riskLevel && (
                <Badge
                  variant="outline"
                  className={cn('text-xs font-semibold', riskBadgeVariant(result.riskLevel))}
                >
                  {riskLabel(result.riskLevel)}
                </Badge>
              )}
              {result.scaleSuggestion !== 'NONE' && (
                <Badge className="text-xs bg-primary/10 text-primary border border-primary/20">
                  <Stethoscope className="h-3 w-3 mr-1" />
                  Escala Sugerida: {result.scaleSuggestion}
                </Badge>
              )}
              {result.safetyFlag !== 'none' && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs font-semibold',
                    isSafety
                      ? 'bg-red-100 text-red-700 border-red-200'
                      : 'bg-amber-100 text-amber-700 border-amber-200',
                  )}
                >
                  {isSafety ? 'Flag: Contraindicação' : 'Flag: Fora de Escopo'}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-700">Racional Clínico</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{result.clinicalRationale}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-700">Ação Sugerida</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{result.suggestedAction}</p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <p className="text-xs text-slate-400">
                Resultado persistido em audit_logs (action: RAG_VALIDATION) para auditoria e
                conformidade LGPD.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-slate-500" />
              <CardTitle className="text-base">Histórico de Validações</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs"
            >
              {showHistory ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
        </CardHeader>
        {showHistory && (
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              {history.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  Nenhuma validação registrada ainda.
                </p>
              ) : (
                <div className="space-y-3">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px]',
                            riskBadgeVariant(entry.details.riskLevel || null),
                          )}
                        >
                          {categoryLabel(entry.details.classification)}
                        </Badge>
                        <span className="text-[10px] text-slate-400">
                          {new Date(entry.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 italic">"{entry.details.input}"</p>
                      <div className="flex flex-wrap gap-1">
                        {entry.details.suggestedScale !== 'NONE' && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-primary/5 text-primary"
                          >
                            {entry.details.suggestedScale}
                          </Badge>
                        )}
                        {entry.details.safetyFlag !== 'none' && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-[10px]',
                              entry.details.safetyFlag === 'absolute_contraindication'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-amber-50 text-amber-600',
                            )}
                          >
                            {entry.details.safetyFlag === 'absolute_contraindication'
                              ? 'Contraindicação'
                              : 'Fora de Escopo'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
