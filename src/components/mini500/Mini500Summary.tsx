import { useState } from 'react'
import {
  FileText,
  RotateCcw,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Clock,
  Download,
  FileType,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Mini500PatientInfo } from '@/services/mini500-service'
import { Mini500ModuleResult } from '@/lib/mini500-scoring'
import { ClinicalInterpretation } from '@/lib/mini500-interpretation'
import { exportMini500Pdf, exportMini500Txt, Mini500ExportData } from '@/lib/mini500-export'

interface Mini500SummaryProps {
  patientInfo: Mini500PatientInfo
  results: Mini500ModuleResult[]
  interpretations: ClinicalInterpretation[]
  alerts: string[]
  summary: string
  onRestart: () => void
}

function calcDuration(start: string, end: string): string {
  if (!start || !end) return '—'
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let min = eh * 60 + em - (sh * 60 + sm)
  if (min < 0) min += 24 * 60
  const h = Math.floor(min / 60),
    m = min % 60
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

export function Mini500Summary({
  patientInfo,
  results,
  interpretations,
  alerts,
  summary,
  onRestart,
}: Mini500SummaryProps) {
  const [exporting, setExporting] = useState<'pdf' | 'txt' | null>(null)
  const positiveModules = results.filter((r) => r.isPositive)

  const buildExportData = (): Mini500ExportData => ({
    patientInfo,
    results,
    interpretations,
    alerts,
    summary,
  })

  const handlePdf = () => {
    setExporting('pdf')
    try {
      exportMini500Pdf(buildExportData())
      toast.success('PDF gerado!')
    } catch {
      toast.error('Erro ao gerar PDF.')
    } finally {
      setExporting(null)
    }
  }
  const handleTxt = () => {
    setExporting('txt')
    try {
      exportMini500Txt(buildExportData())
      toast.success('TXT gerado!')
    } catch {
      toast.error('Erro ao gerar TXT.')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Relatório MINI 5.0.0</h1>
        <p className="text-sm text-[#E6F1FF] mt-1">Entrevista concluída com sucesso.</p>
      </div>

      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((a, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-3 rounded-lg"
              style={{
                backgroundColor: 'rgba(255,107,107,0.1)',
                border: '1px solid rgba(255,107,107,0.3)',
              }}
            >
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{a}</p>
            </div>
          ))}
        </div>
      )}

      <div
        className="p-6 rounded-xl mb-6"
        style={{ backgroundColor: '#112240', border: '1px solid #233554' }}
      >
        <h2 className="text-lg font-bold text-white mb-4">Dados do(a) Entrevistado(a)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-[#E6F1FF]">Nome: </span>
            <span className="text-white font-medium">{patientInfo.name}</span>
          </div>
          <div>
            <span className="text-[#E6F1FF]">Protocolo: </span>
            <span className="text-white font-medium">{patientInfo.protocol || '—'}</span>
          </div>
          <div>
            <span className="text-[#E6F1FF]">Entrevistador: </span>
            <span className="text-white font-medium">{patientInfo.interviewerName || '—'}</span>
          </div>
          <div>
            <span className="text-[#E6F1FF]">Data: </span>
            <span className="text-white font-medium">{patientInfo.interviewDate || '—'}</span>
          </div>
          <div>
            <span className="text-[#E6F1FF] flex items-center gap-1">
              <Clock className="h-3 w-3" /> Início:{' '}
            </span>
            <span className="text-white font-medium">{patientInfo.startTime || '—'}</span>
          </div>
          <div>
            <span className="text-[#E6F1FF]">Duração: </span>
            <span className="text-[#00FFFF] font-medium">
              {calcDuration(patientInfo.startTime, patientInfo.endTime)}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-bold text-[#00FFFF] mb-3">Módulos Positivos</h2>
        {positiveModules.length > 0 ? (
          <div className="space-y-2">
            {positiveModules.map((r) => (
              <div
                key={r.moduleId}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{
                  backgroundColor: 'rgba(0,255,255,0.08)',
                  border: '1px solid rgba(0,255,255,0.2)',
                }}
              >
                <span className="text-sm text-[#E6F1FF]">
                  <span className="text-[#00FFFF] font-bold mr-2">{r.letter}</span>
                  {r.title}
                </span>
                <span className="text-sm font-bold text-[#00FFFF]">{r.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="flex items-center gap-2 p-4 rounded-lg"
            style={{ backgroundColor: '#112240', border: '1px solid #233554' }}
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <p className="text-sm text-[#E6F1FF]">Nenhum módulo positivo identificado.</p>
          </div>
        )}
      </div>

      {interpretations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white mb-3">Interpretação Clínica</h2>
          <div className="space-y-3">
            {interpretations.map((i) => (
              <div
                key={i.moduleId}
                className="p-4 rounded-lg"
                style={{ backgroundColor: '#112240', border: '1px solid #233554' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#00FFFF] font-bold">{i.moduleLetter}</span>
                  <span className="text-sm font-medium text-white">{i.title}</span>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      i.severity === 'critical'
                        ? 'bg-red-500/20 text-red-300'
                        : i.severity === 'high'
                          ? 'bg-orange-500/20 text-orange-300'
                          : i.severity === 'moderate'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-blue-500/20 text-blue-300',
                    )}
                  >
                    {i.status}
                  </span>
                </div>
                <p className="text-sm text-[#E6F1FF] mb-2">{i.interpretation}</p>
                <p className="text-xs text-[#E6F1FF]">
                  <strong className="text-[#00FFFF]">Conduta:</strong> {i.referral}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-bold text-white mb-3">Resultados Detalhados</h2>
        <div className="space-y-2">
          {results.map((r) => (
            <div
              key={r.moduleId}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ backgroundColor: '#112240', border: '1px solid #233554' }}
            >
              <div className="flex items-center gap-2 flex-1">
                {r.isPositive ? (
                  <AlertTriangle className="h-4 w-4 text-[#00FFFF] shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-[#E6F1FF] shrink-0" />
                )}
                <span className="text-sm text-[#E6F1FF]">
                  <span className="font-bold mr-1">{r.letter}</span> — {r.title}
                </span>
              </div>
              <div className="text-right">
                <span
                  className={cn(
                    'text-sm font-medium',
                    r.isPositive ? 'text-[#00FFFF]' : 'text-[#E6F1FF]',
                  )}
                >
                  {r.label}
                </span>
                {r.details && <p className="text-xs text-[#E6F1FF] mt-0.5">{r.details}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-yellow-400 italic mb-6">
        AVISO: Este instrumento é uma ferramenta de triagem e não substitui a avaliação clínica
        profissional.
      </p>

      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={handlePdf}
          disabled={exporting !== null}
          className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-medium"
        >
          {exporting === 'pdf' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}{' '}
          Gerar PDF
        </Button>
        <Button
          onClick={handleTxt}
          disabled={exporting !== null}
          className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-medium"
        >
          {exporting === 'txt' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileType className="h-4 w-4 mr-2" />
          )}{' '}
          Exportar TXT
        </Button>
        <Button
          onClick={onRestart}
          variant="outline"
          className="border-[#233554] text-[#E6F1FF] hover:bg-[#233554]"
        >
          <RotateCcw className="h-4 w-4 mr-2" /> Nova Entrevista
        </Button>
      </div>
    </div>
  )
}
