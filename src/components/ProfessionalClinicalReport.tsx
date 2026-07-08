import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  FileText,
  Stethoscope,
  Pill,
  FlaskConical,
  ClipboardList,
  CalendarClock,
  User,
  Activity,
} from 'lucide-react'
import type {
  ClinicalReportData,
  CID10Diagnosis,
  ExamFinding,
  Medication,
} from '@/lib/clinical-report-generator'

interface ProfessionalClinicalReportProps {
  report: ClinicalReportData
}

function DiagnosisItem({ dx }: { dx: CID10Diagnosis }) {
  return (
    <div className="flex items-start gap-2 py-1">
      <Badge variant="secondary" className="font-mono text-xs shrink-0">
        {dx.code}
      </Badge>
      <span className="text-sm text-slate-700">{dx.description}</span>
    </div>
  )
}

function MedicationItem({ med }: { med: Medication }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1 text-sm">
      <span className="font-medium text-slate-800">{med.name}</span>
      <span className="text-slate-500">
        {med.dosage} · {med.frequency}
      </span>
    </div>
  )
}

function ExamItem({ exam }: { exam: ExamFinding }) {
  return (
    <div className="py-1.5 space-y-0.5">
      <p className="text-sm font-medium text-slate-800">{exam.exam}</p>
      <p className="text-xs text-slate-500">
        Resultado: <span className="text-slate-700">{exam.result}</span>
      </p>
      <p className="text-xs text-slate-500">
        Interpretação: <span className="text-slate-700">{exam.interpretation}</span>
      </p>
    </div>
  )
}

export function ProfessionalClinicalReport({ report }: ProfessionalClinicalReportProps) {
  return (
    <div className="space-y-4 print:space-y-3">
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" />
            Dados do Paciente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Nome:</span>
            <span className="font-medium text-slate-800">{report.patientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Identificação:</span>
            <span className="font-medium text-slate-800">{report.patientId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Data do laudo:</span>
            <span className="font-medium text-slate-800">
              {new Date(report.reportDate).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Stethoscope className="h-4 w-4 text-primary" />
            Profissional Responsável
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Nome:</span>
            <span className="font-medium text-slate-800">{report.professionalName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">CRM:</span>
            <span className="font-medium text-slate-800">{report.professionalCRM}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            Diagnósticos (CID-10)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0.5">
          {report.diagnoses.map((dx, i) => (
            <DiagnosisItem key={i} dx={dx} />
          ))}
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4 text-primary" />
            Descrição Clínica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700 leading-relaxed">{report.clinicalDescription}</p>
        </CardContent>
      </Card>

      {report.examFindings.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="h-4 w-4 text-primary" />
              Exames Complementares
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100">
            {report.examFindings.map((exam, i) => (
              <ExamItem key={i} exam={exam} />
            ))}
          </CardContent>
        </Card>
      )}

      {report.medications.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Pill className="h-4 w-4 text-primary" />
              Medicamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100">
            {report.medications.map((med, i) => (
              <MedicationItem key={i} med={med} />
            ))}
          </CardContent>
        </Card>
      )}

      {report.procedures.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" />
              Procedimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
              {report.procedures.map((proc, i) => (
                <li key={i}>{proc}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            Justificativa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700 leading-relaxed">{report.justification}</p>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            Conclusão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700 leading-relaxed">{report.conclusion}</p>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4 text-primary" />
            Período Recomendado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700">{report.recommendedPeriod}</p>
        </CardContent>
      </Card>

      <Separator className="my-2" />
      <p className="text-xs text-slate-400 italic">
        Histórico de acompanhamento: {report.followUpHistory}
      </p>
    </div>
  )
}
