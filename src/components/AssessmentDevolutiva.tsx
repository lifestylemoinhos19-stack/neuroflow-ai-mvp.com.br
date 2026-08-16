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
  Sparkles,
  ArrowRight,
  Edit,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PublicPageShell } from '@/components/PublicPageShell'
import { AssessmentScoreChart } from '@/components/AssessmentScoreChart'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { generateEducationalInterpretation } from '@/lib/educational-interpretation'
import { createReportSession, saveInterpretationToSession } from '@/services/clinical-report'
import { saveAdminInterpretation } from '@/services/admin'

type ScaleType = 'snap-iv' | 'assq' | 'cbcl'

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

export function AssessmentDevolutiva({
  scaleType,
  result,
  onBack,
}: {
  scaleType: ScaleType
  result: Record<string, unknown>
  onBack: () => void
}) {
  const [aiText, setAiText] = useState('')
  const [aiAction, setAiAction] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCalmExplorer, setShowCalmExplorer] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const { isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()

  const interpretation = generateEducationalInterpretation(scaleType, result)

  useEffect(() => {
    if (isAuthenticated) {
      createReportSession(null).then((id) => id && setSessionId(id))
    }
  }, [isAuthenticated])

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

  const handleAdminSave = async () => {
    if (!sessionId) {
      toast.error('Sessão não disponível para salvar.')
      return
    }
    setSavingEdit(true)
    const { error } = await saveAdminInterpretation(sessionId, editedText)
    setSavingEdit(false)
    if (error) {
      toast.error('Erro ao salvar interpretação.')
      return
    }
    setAiText(editedText)
    setIsEditing(false)
    toast.success('Interpretação atualizada com sucesso!')
  }

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
    const sid = sessionId || (await createReportSession(null))
    if (sid) await saveInterpretationToSession(sid, interpretation)
    toast.success('Seus resultados foram salvos em sua conta!')
    setShowCalmExplorer(true)
    setSaving(false)
  }, [isAuthenticated, navigate, interpretation, sessionId])

  return (
    <PublicPageShell>
      <style>{`@media print { .no-print { display: none !important; } body { background: white !important; } }`}</style>
      <div className="max-w-2xl mx-auto space-y-6 py-8 animate-fade-in-up">
        <div className="no-print flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white/85 hover:text-[#00FFFF]"
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

        <div className="rounded-2xl border border-[#00FFFF]/20 bg-[#112240] p-6 space-y-4 no-print">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-[#00FFFF]" /> Resultados
          </h2>
          {result.severity && (
            <div className="flex justify-center">
              <span
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-bold border',
                  severityColors[result.severity as string] || severityColors.baixo,
                )}
              >
                {severityLabels[result.severity as string] || 'Baixo'}
              </span>
            </div>
          )}
          {scaleType === 'snap-iv' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-xl bg-[#0A192F] border border-white/10">
                <p className="text-3xl font-bold text-[#00FFFF]">
                  {String(result.inattentionHigh)}
                </p>
                <p className="text-xs text-white/75">Itens altos — Desatenção</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-[#0A192F] border border-white/10">
                <p className="text-3xl font-bold text-[#00FFFF]">
                  {String(result.hyperactivityHigh)}
                </p>
                <p className="text-xs text-white/75">Itens altos — Hiperatividade</p>
              </div>
            </div>
          )}
          {scaleType === 'assq' && (
            <div className="text-center py-2">
              <p className="text-4xl font-bold text-[#00FFFF]">{String(result.total)}</p>
              <p className="text-sm text-white/75 mt-1">Pontuação total (máx. 54)</p>
            </div>
          )}
          {scaleType === 'cbcl' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-xl bg-[#0A192F] border border-white/10">
                <p className="text-3xl font-bold text-[#00FFFF]">{String(result.internalizing)}</p>
                <p className="text-xs text-white/75">Internalizante</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-[#0A192F] border border-white/10">
                <p className="text-3xl font-bold text-[#00FFFF]">{String(result.externalizing)}</p>
                <p className="text-xs text-white/75">Externalizante</p>
              </div>
            </div>
          )}
          <AssessmentScoreChart scaleType={scaleType} result={result} />
        </div>

        <div className="rounded-2xl border border-[#00FFFF]/20 bg-[#00FFFF]/5 p-6 space-y-3 no-print">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Brain className="h-5 w-5 text-[#00FFFF]" /> Interpretação Educacional
            </h2>
            {isAdmin && !isEditing && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditedText(aiText || interpretation.summary)
                  setIsEditing(true)
                }}
                className="text-[#00FFFF] hover:bg-[#00FFFF]/10"
              >
                <Edit className="h-3 w-3 mr-1" /> Editar
              </Button>
            )}
          </div>
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={6}
                className="bg-[#0A192F] border-[#00FFFF]/20 text-white"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="border-white/20 text-white"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleAdminSave}
                  disabled={savingEdit}
                  className="bg-[#00FFFF] text-[#0A192F]"
                >
                  {savingEdit ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3 mr-1" />
                  )}
                  Salvar Interpretação
                </Button>
              </div>
            </div>
          ) : (
            <>
              {loading ? (
                <div className="flex items-center gap-2 text-white/85 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> Gerando interpretação
                  personalizada...
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      Rascunho
                    </span>
                    <span className="text-xs text-white/70">
                      Conteúdo gerado pela IA — sujeito a revisão do administrador
                    </span>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed">
                    {aiText || interpretation.summary}
                  </p>
                  <div className="space-y-1 mt-2">
                    {interpretation.guidance.map((g, i) => (
                      <p key={i} className="text-xs text-white/75 flex items-start gap-1">
                        <span className="text-[#00FFFF] mt-0.5">•</span> {g}
                      </p>
                    ))}
                  </div>
                  {aiAction && (
                    <div className="mt-3 p-3 rounded-lg bg-[#00FFFF]/10 border border-[#00FFFF]/20">
                      <p className="text-xs font-bold text-[#00FFFF] mb-1">Próximos Passos:</p>
                      <p className="text-sm text-white/70">{aiAction}</p>
                    </div>
                  )}
                  <p className="text-xs text-white/70 italic mt-2">
                    {interpretation.recommendations}
                  </p>
                  {interpretation.draftNote && (
                    <div className="mt-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-xs text-yellow-400/70">
                        <strong>Rascunho:</strong> {interpretation.draftNote}
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {showCalmExplorer && (
          <div className="no-print rounded-2xl border border-[#00FFFF]/30 bg-[#00FFFF]/10 p-6 text-center animate-fade-in-up">
            <Sparkles className="h-8 w-8 text-[#00FFFF] mx-auto mb-2" />
            <h3 className="text-lg font-bold text-white mb-1">
              Quer testar o Explorador da Calma?
            </h3>
            <p className="text-sm text-white/85 mb-4">
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
            onClick={() => window.print()}
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
