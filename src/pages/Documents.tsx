import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FileText,
  Pill,
  Calendar,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  AlertCircle,
} from 'lucide-react'
import { getClinicalReports, type ClinicalReportWithMeta } from '@/services/clinical-report'
import { ProfessionalClinicalReport } from '@/components/ProfessionalClinicalReport'
import { useAuth } from '@/contexts/auth-context'
import { generateClinicalReport } from '@/lib/clinical-report-generator'

export default function Documents() {
  const { user } = useAuth()
  const [reports, setReports] = useState<ClinicalReportWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getClinicalReports(user.id).then((data) => {
      if (data.length === 0) {
        const sample = generateClinicalReport(
          'snap-iv',
          { inattentionHigh: 7, hyperactivityHigh: 5, isSuggestive: true },
          user.name,
        )
        setReports([{ id: 'sample', report: sample, created_at: new Date().toISOString() }])
      } else {
        setReports(data)
      }
      setLoading(false)
    })
  }, [user])

  return (
    <div className="space-y-6">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div className="no-print">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
          Meus Documentos Clínicos
        </h1>
        <p className="text-slate-500">Laudos, atestados e relatórios médicos estruturados.</p>
      </div>

      <Card className="border-blue-200 bg-blue-50 no-print">
        <CardContent className="p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Documentos gerados como apoio à decisão clínica. Validação médica obrigatória conforme
            Resolução CFM nº 2.314/2022.
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((item) => {
            const { report, id, created_at } = item
            const isExpanded = expandedId === id
            return (
              <Card key={id} className="shadow-subtle border-slate-100 overflow-hidden">
                <CardHeader className="pb-3 no-print">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5 text-primary" />
                        Laudo Neuropsicológico
                      </CardTitle>
                      <CardDescription className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Stethoscope className="h-3 w-3" />
                          {report.professionalName} · {report.professionalCRM}
                        </span>
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
                  <div className="no-print">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {report.diagnoses.map((dx, i) => (
                        <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-700">
                          <span className="font-mono font-bold mr-1">{dx.code}</span>
                          {dx.description}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Pill className="h-3 w-3" />
                        {report.medications.length} medicamentos
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {report.examFindings.length} exames complementares
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {report.procedures.length} procedimentos
                      </span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-4 animate-fade-in-up">
                      <ProfessionalClinicalReport report={report} />
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
