import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Calendar, ChevronDown, ChevronUp, Brain, AlertCircle } from 'lucide-react'
import { getInterpretations, type InterpretationWithMeta } from '@/services/clinical-report'
import { useAuth } from '@/contexts/auth-context'
import { AdminInterpretationWorkspace } from '@/components/AdminInterpretationWorkspace'
import { cn } from '@/lib/utils'

const severityColors: Record<string, string> = {
  elevado: 'bg-red-500/20 text-red-400 border-red-500/30',
  moderado: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  baixo: 'bg-green-500/20 text-green-400 border-green-500/30',
}
const severityLabels: Record<string, string> = {
  elevado: 'Elevado',
  moderado: 'Moderado',
  baixo: 'Baixo',
}

export default function Documents() {
  const { user, isAdmin } = useAuth()
  const [reports, setReports] = useState<InterpretationWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    getInterpretations().then((data) => {
      setReports(data)
      setLoading(false)
    })
  }, [user])

  return (
    <div className="space-y-6">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div className="no-print">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
          Documentos Educacionais
        </h1>
        <p className="text-slate-500">Interpretações educacionais de triagem e devolutivas.</p>
      </div>

      <Card className="border-blue-200 bg-blue-50 no-print">
        <CardContent className="p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Documentos educacionais de triagem. Não substituem avaliação médica profissional.
          </p>
        </CardContent>
      </Card>

      {isAdmin && <AdminInterpretationWorkspace />}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card className="shadow-subtle border-slate-100">
          <CardContent className="p-8 text-center">
            <Brain className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              Nenhuma interpretação salva ainda. Complete uma avaliação para gerar documentos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((item) => {
            const { interpretation, id, created_at } = item
            const isExpanded = expandedId === id
            return (
              <Card key={id} className="shadow-subtle border-slate-100 overflow-hidden">
                <CardHeader className="pb-3 no-print">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5 text-primary" />
                        {interpretation.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <Badge
                          className={cn(
                            'border',
                            severityColors[interpretation.severity] || severityColors.baixo,
                          )}
                        >
                          {severityLabels[interpretation.severity] || 'Baixo'}
                        </Badge>
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {isExpanded && (
                    <div className="mt-4 animate-fade-in-up space-y-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-1">Resumo</h4>
                        <p className="text-sm text-slate-600">{interpretation.summary}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-1">Orientações</h4>
                        <ul className="space-y-1">
                          {interpretation.guidance.map((g, i) => (
                            <li key={i} className="text-xs text-slate-500 flex items-start gap-1">
                              <span className="text-primary mt-0.5">•</span> {g}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <h4 className="text-sm font-bold text-slate-700 mb-1">Recomendações</h4>
                        <p className="text-sm text-slate-600">{interpretation.recommendations}</p>
                      </div>
                      {interpretation.draftNote && (
                        <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                          <p className="text-xs text-yellow-700">
                            <strong>Rascunho:</strong> {interpretation.draftNote}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
