import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer, Save, Loader2, FileText, Brain, Stethoscope } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PublicPageShell } from '@/components/PublicPageShell'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type ScaleType = 'snap-iv' | 'assq' | 'cbcl'

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
  if (scaleType === 'snap-iv') {
    return `Avaliação SNAP-IV: ${result.inattentionHigh} itens altos em desatenção, ${result.hyperactivityHigh} itens altos em hiperatividade. Sugestivo: ${result.isSuggestive}`
  }
  if (scaleType === 'assq') {
    return `Avaliação ASSQ: pontuação total ${result.total}, limiar ${result.threshold}. Sugestivo: ${result.isSuggestive}`
  }
  return `Avaliação CBCL: internalizante ${result.internalizing}, externalizante ${result.externalizing}, total ${result.total}. Internalizante elevado: ${result.isInternalizingElevated}, Externalizante elevado: ${result.isExternalizingElevated}`
}

export function AssessmentDevolutiva({ scaleType, result, onBack }: DevolutivaProps) {
  const [aiText, setAiText] = useState<string>('')
  const [aiAction, setAiAction] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const { isAuthenticated } = useAuth()
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

  const handlePrint = () => window.print()

  const handleSave = () => {
    if (!isAuthenticated) {
      toast.info('Faça login para salvar seu histórico de avaliações.')
      navigate('/login')
    } else {
      toast.success('Seus resultados já estão salvos em sua conta!')
    }
  }

  return (
    <PublicPageShell>
      <style>{`@media print { .no-print { display: none !important; } body { background: white !important; color: black !important; } }`}</style>
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

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00FFFF]/10 border border-[#00FFFF]/20 mb-3">
            <FileText className="h-8 w-8 text-[#00FFFF]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Devolutiva da Avaliação</h1>
          <p className="text-[#00FFFF]/80 text-sm font-medium mt-1">{scaleTitles[scaleType]}</p>
        </div>

        <div className="rounded-2xl border border-[#00FFFF]/20 bg-[#112240] p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-[#00FFFF]" /> Resultados
          </h2>
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
                <p className="text-3xl font-bold text-[#00FFFF]">{String(result.internalizing)}</p>
                <p className="text-xs text-white/50">Internalizante</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-[#0A192F] border border-white/10">
                <p className="text-3xl font-bold text-[#00FFFF]">{String(result.externalizing)}</p>
                <p className="text-xs text-white/50">Externalizante</p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#00FFFF]/20 bg-[#00FFFF]/5 p-6 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Brain className="h-5 w-5 text-[#00FFFF]" /> Interpretação da IA
          </h2>
          {loading ? (
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Gerando interpretação personalizada...
            </div>
          ) : (
            <>
              {aiText && <p className="text-sm text-white/80 leading-relaxed">{aiText}</p>}
              {aiAction && (
                <div
                  className={cn('mt-3 p-3 rounded-lg bg-[#00FFFF]/10 border border-[#00FFFF]/20')}
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
            className="flex-1 bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-semibold"
          >
            <Save className="h-4 w-4 mr-2" /> Salvar na Minha Conta
          </Button>
        </div>
      </div>
    </PublicPageShell>
  )
}
