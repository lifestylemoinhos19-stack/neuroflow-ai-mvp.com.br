import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Printer,
  Save,
  Loader2,
  FileText,
  Brain,
  Stethoscope,
  BarChart3,
  ClipboardList,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PublicPageShell } from '@/components/PublicPageShell'
import { AssessmentScoreChart } from '@/components/AssessmentScoreChart'
import { ProfessionalClinicalReport } from '@/components/ProfessionalClinicalReport'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { generateClinicalReport, type ClinicalReportData } from '@/lib/clinical-report-generator'
import { createReportSession, saveClinicalReportToSession } from '@/services/clinical-report'

type ScaleType = 'snap-iv' | 'assq' | 'cbcl'
type ViewMode = 'chart' | 'report'

interface DevolutivaProps {
  scaleType: ScaleType
  result: Record<string, unknown>
  onBack: () => void
}

const scaleTitles: Record<ScaleType, string> = {
  'snap-iv': 'SNAP-IV — Triagem TDAH',
  assq: 'ASSQ — Triagem Autismo',
  cbcl: 'CBCL — Checklist Comportamental',
}

function formatMessage(scaleType: ScaleType, result: Record<string, unknown>): string {
  if (scaleType === 'snap-iv')
    return `SNAP-IV: média ${result.average}, ${result.inattentionHigh} desatenção, ${result.hyperactivityHigh} hiperatividade. Severidade: ${result.severity}`
  if (scaleType === 'assq')
    return `ASSQ: total ${result.total}, limiar ${result.threshold}. Severidade: ${result.severity}`
  return `CBCL: internalizante ${result.internalizing}, externalizante ${result.externalizing}, total ${result.total}. Severidade: ${result.severity}`
}

export function AssessmentDevolutiva({ scaleType, result, onBack }: DevolutivaProps) {
  const [aiText, setAiText] = useState('')
  const [aiAction, setAiAction] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('chart')
  const [report, setReport] = useState<ClinicalReportData | null>(null)
  const [saving, setSaving] = useState(false)
  const [showCalmExplorer, setShowCalmExplorer] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const message = formatMessage(scaleType, result)
    supabase.functions
      .invoke('neuro-validation', { body: { message, persist: false } })
      .then(({ data }) => {
        if (data?.result) {
          setAiText(data.result.clinicalRationale || '')
          setAiAction(data.result.suggestedAction || '')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [scaleType, result])

  useEffect(() => {
    setReport(generateClinicalReport(scaleType, result, user?.name, aiText))
  }, [scaleType, result, aiText, user])

  const handlePrint = () => window.print()

  const handleSave = useCallback(async () => {
    setSaving(true)
    localStorage.setItem('neuroflow_show_calm_explorer', 'true')
    const guestToken = localStorage.getItem('neuroflow_guest_token')

    if (!isAuthenticated) {
      toast.info('Faça login para salvar seu histórico de avaliações.')
      navigate('/login', { state: { guestToken, fromAssessment: true } })
      setSaving(false)
      return
    }

    const sessionId = await createReportSession(null)
    if (sessionId && report) {
      await saveClinicalReportToSession(sessionId, report)
    }
    toast.success('Seus resultados foram salvos em sua conta!')
    setShowCalmExplorer(true)
    setSaving(false)
  }, [isAuthenticated, navigate, report])

  return (
    <PublicPageShell>
      <style>{`@media print { .no-print { display: none !important; } body { background: white !important; } }`}</style>
      <div className="max-w-2xl mx-auto space-y-6 py-8 animate-fade-in-up">
        <div className="no-print flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white/60 hover:text-[#00FFFF]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </div>

        <div className="text-center no-print">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00FFFF]/10 border border-[#00FFFF]/20 mb-3">
            <FileText className="h-8 w-8 text-[#00FFFF]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Devolutiva da Avaliação</h1>
          <p className="text-[#00FFFF]/80 text-sm font-medium mt-1">{scaleTitles[scaleType]}</p>
        </div>

        <div className="no-print flex gap-2 justify-center">
          <Button
            variant={viewMode === 'chart' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('chart')}
            className={cn(viewMode === 'chart' && 'bg-[#00FFFF] text-[#0A192F]')}
          >
            <BarChart3 className="h-4 w-4 mr-2" /> Gráfico de pontuação
          </Button>
          <Button
            variant={viewMode === 'report' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('report')}
            className={cn(viewMode === 'report' && 'bg-[#00FFFF] text-[#0A192F]')}
          >
            <ClipboardList className="h-4 w-4 mr-2" /> Visualização de Laudo Profissional
          </Button>
        </div>

        {viewMode === 'chart' ? (
          <>
            <div className="rounded-2xl border border-[#00FFFF]/20 bg-[#112240] p-6 space-y-4 no-print">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-[#00FFFF]" /> Resultados
              </h2>
              {result.severity && (
                <div className="flex justify-center">
                  <span
                    className={cn(
                      'px-4 py-1.5 rounded-full text-sm font-bold border',
                      result.severity === 'elevado'
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : result.severity === 'moderado'
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          : 'bg-green-500/20 text-green-400 border-green-500/30',
                    )}
                  >
                    {result.severity === 'elevado'
                      ? 'Elevado'
                      : result.severity === 'moderado'
                        ? 'Moderado'
                        : 'Baixo'}
                  </span>
                </div>
              )}
              {scaleType === 'snap-iv' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-xl bg-[#0A192F] border border-white/10">
                    <p className="text-3xl font-bold text-[#00FFFF]">
                      {String(result.inattentionHigh)}
                    </p>
                    <p className="text-xs text-white/50">Itens altos — Desatenção</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-[#0A192F] border border-white/10">
                    <p className="text-3xl font-bold text-[#00FFFF]">
                      {String(result.hyperactivityHigh)}
                    </p>
                    <p className="text-xs text-white/50">Itens altos — Hiperatividade</p>
                  </div>
                </div>
              )}
              {scaleType === 'assq' && (
                <div className="text-center py-2">
                  <p className="text-4xl font-bold text-[#00FFFF]">{String(result.total)}</p>
                  <p className="text-sm text-white/50 mt-1">Pontuação total (máx. 54)</p>
                  <p className="text-xs text-white/40">Limiar: {String(result.threshold)}</p>
                </div>
              )}
              {scaleType === 'cbcl' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-xl bg-[#0A192F] border border-white/10">
                    <p className="text-3xl font-bold text-[#00FFFF]">
                      {String(result.internalizing)}
                    </p>
                    <p className="text-xs text-white/50">Internalizante</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-[#0A192F] border border-white/10">
                    <p className="text-3xl font-bold text-[#00FFFF]">
                      {String(result.externalizing)}
                    </p>
                    <p className="text-xs text-white/50">Externalizante</p>
                  </div>
                </div>
              )}
              <AssessmentScoreChart scaleType={scaleType} result={result} />
            </div>

            <div className="rounded-2xl border border-[#00FFFF]/20 bg-[#00FFFF]/5 p-6 space-y-3 no-print">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Brain className="h-5 w-5 text-[#00FFFF]" /> Interpretação da IA
              </h2>
              {loading ? (
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> Gerando interpretação
                  personalizada...
                </div>
              ) : (
                <>
                  {aiText && <p className="text-sm text-white/80 leading-relaxed">{aiText}</p>}
                  {aiAction && (
                    <div
                      className={cn(
                        'mt-3 p-3 rounded-lg bg-[#00FFFF]/10 border border-[#00FFFF]/20',
                      )}
                    >
                      <p className="text-xs font-bold text-[#00FFFF] mb-1">Próximos Passos:</p>
                      <p className="text-sm text-white/70">{aiAction}</p>
                    </div>
                  )}
                </>
              )}
              <p className="text-xs text-white/40 italic mt-2">
                Esta devolutiva é de caráter educativo e não substitui uma consulta profissional.
              </p>
            </div>
          </>
        ) : (
          report && <ProfessionalClinicalReport report={report} />
        )}

        {showCalmExplorer && (
          <div className="no-print rounded-2xl border border-[#00FFFF]/30 bg-[#00FFFF]/10 p-6 text-center animate-fade-in-up">
            <Sparkles className="h-8 w-8 text-[#00FFFF] mx-auto mb-2" />
            <h3 className="text-lg font-bold text-white mb-1">
              Quer testar o Explorador da Calma?
            </h3>
            <p className="text-sm text-white/60 mb-4">
              Uma experiência interativa de biofeedback para ajudar seu filho a desenvolver foco e
              regulação emocional.
            </p>
            <Button
              onClick={() => navigate('/focus-session')}
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-semibold"
            >
              Explorar agora <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        <div className="no-print flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex-1 border-[#00FFFF]/30 text-[#00FFFF] hover:bg-[#00FFFF]/10"
          >
            <Printer className="h-4 w-4 mr-2" /> Imprimir / PDF
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-semibold"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar meu histórico
          </Button>
        </div>
      </div>
    </PublicPageShell>
  )
}
