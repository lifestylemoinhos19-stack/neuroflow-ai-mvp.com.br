import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ClinicalReportData } from '@/lib/clinical-report-generator'

interface Props {
  report: ClinicalReportData
}

export function ProfessionalClinicalReport({ report }: Props) {
  return (
    <div className="bg-white text-slate-800 rounded-2xl p-6 sm:p-8 shadow-lg print:shadow-none print:rounded-none animate-fade-in-up">
      <div className="border-b-2 border-slate-300 pb-4 mb-6 no-print:flex no-print:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Laudo Médico Neuropsicológico
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {report.reportDate} · NeuroFlow AI — Sistema de Apoio à Decisão Clínica
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="no-print hidden sm:flex"
        >
          <Printer className="h-4 w-4 mr-2" /> Imprimir
        </Button>
      </div>

      <section className="mb-5">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">
          1. Identificação do Paciente e do Profissional
        </h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p>
            <span className="font-semibold">Paciente:</span> {report.patientName}
          </p>
          <p>
            <span className="font-semibold">ID/RG:</span> {report.patientId}
          </p>
          <p>
            <span className="font-semibold">Profissional:</span> {report.professionalName}
          </p>
          <p>
            <span className="font-semibold">CRM:</span> {report.professionalCRM}
          </p>
        </div>
      </section>

      <section className="mb-5">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">
          2. Histórico de Acompanhamento Longitudinal
        </h2>
        <p className="text-sm leading-relaxed text-slate-700">{report.followUpHistory}</p>
      </section>

      <section className="mb-5">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">
          3. Diagnósticos Clínicos (CID-10)
        </h2>
        <ul className="space-y-1">
          {report.diagnoses.map((d, i) => (
            <li key={i} className="text-sm text-slate-700">
              <span className="font-mono font-bold text-slate-900">{d.code}</span> — {d.description}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-5">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">
          4. Descrição Detalhada do Quadro Clínico Atual
        </h2>
        <p className="text-sm leading-relaxed text-slate-700">{report.clinicalDescription}</p>
      </section>

      <section className="mb-5">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">
          5. Achados de Exames Complementares
        </h2>
        {report.examFindings.map((exam, i) => (
          <div key={i} className="mb-3 border-l-2 border-slate-300 pl-3">
            <p className="text-sm font-semibold text-slate-900">{exam.exam}</p>
            <p className="text-sm text-slate-700">
              <span className="font-medium">Resultado:</span> {exam.result}
            </p>
            <p className="text-sm text-slate-500 italic">{exam.interpretation}</p>
          </div>
        ))}
      </section>

      <section className="mb-5">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">
          6. Plano Terapêutico e Farmacoterapia
        </h2>
        <table className="w-full text-sm mb-3">
          <thead>
            <tr className="border-b border-slate-300">
              <th className="text-left py-1 font-semibold">Medicação</th>
              <th className="text-left py-1 font-semibold">Dose</th>
              <th className="text-left py-1 font-semibold">Frequência</th>
            </tr>
          </thead>
          <tbody>
            {report.medications.map((m, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-1">{m.name}</td>
                <td className="py-1">{m.dosage}</td>
                <td className="py-1">{m.frequency}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div>
          <p className="text-sm font-semibold text-slate-900 mb-1">Procedimentos Especializados:</p>
          <ul className="list-disc list-inside text-sm text-slate-700">
            {report.procedures.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mb-5">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">
          7. Justificativa para Prorrogação e Conclusão
        </h2>
        <p className="text-sm leading-relaxed text-slate-700 mb-2">{report.justification}</p>
        <p className="text-sm leading-relaxed text-slate-700">
          <span className="font-semibold">Período recomendado:</span> {report.recommendedPeriod}
        </p>
        <p className="text-sm leading-relaxed text-slate-700 mt-2">{report.conclusion}</p>
      </section>

      <div className="border-t-2 border-slate-300 pt-4 mt-8 text-center">
        <p className="text-sm font-semibold text-slate-900">{report.professionalName}</p>
        <p className="text-xs text-slate-500">{report.professionalCRM}</p>
        <p className="text-xs text-slate-400 mt-1">{report.reportDate}</p>
        <p className="text-xs text-slate-400 italic mt-4">
          Documento gerado pelo NeuroFlow AI. Suporte à decisão clínica — Validação médica
          obrigatória.
        </p>
      </div>
    </div>
  )
}
