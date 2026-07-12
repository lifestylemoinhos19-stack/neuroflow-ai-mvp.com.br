import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { PublicPageShell } from '@/components/PublicPageShell'
import { validateDocument, ValidationResult } from '@/services/validation'
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Award,
  ShieldCheck,
  Loader2,
  FileText,
} from 'lucide-react'

export default function ValidateDocument() {
  const { id } = useParams<{ id: string }>()
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    validateDocument(id).then((data) => {
      setResult(data)
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <PublicPageShell>
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-[#00FFFF] mb-4" />
          <p className="text-white/50 text-sm">Verificando autenticidade do documento...</p>
        </div>
      </PublicPageShell>
    )
  }

  if (!result) {
    return (
      <PublicPageShell>
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center animate-fade-in-up">
            <XCircle className="mx-auto h-16 w-16 text-red-400 mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">❌ Documento não localizado</h1>
            <p className="text-white/60 mb-6">
              O protocolo informado não foi encontrado em nossa base de dados. Verifique se o código
              ou QR Code foi lido corretamente.
            </p>
            <div className="rounded-xl bg-white/5 p-5 text-left">
              <p className="text-sm font-semibold text-white/80 mb-3">
                Para verificar a autenticidade deste documento, entre em contato com a clínica:
              </p>
              <div className="space-y-1.5">
                <p className="text-sm text-white/60">📞 WhatsApp: 51 3282-6929</p>
                <p className="text-sm text-white/60">
                  📍 Ramiro Barcelos, 839, Moinhos de Vento, Porto Alegre/RS
                </p>
                <p className="text-sm text-white/60">🏥 Casa Branca Saúde</p>
              </div>
            </div>
          </div>
        </div>
      </PublicPageShell>
    )
  }

  const completedDate = result.completed_at || result.started_at
  const dateStr = new Date(completedDate).toLocaleDateString('pt-BR')
  const timeStr = new Date(completedDate).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const protocolShort = result.session_id.substring(0, 8).toUpperCase()

  return (
    <PublicPageShell>
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-8 text-center animate-fade-in-up">
          <ShieldCheck className="mx-auto h-16 w-16 text-green-400 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">✅ Documento Autêntico</h1>
          <p className="text-white/60">
            Este documento foi emitido pelo NeuroFlow AI e sua autenticidade foi confirmada em nossa
            base de dados.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-[#00FFFF]/10 bg-white/5 p-6 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-[#00FFFF]" />
              <h2 className="text-lg font-semibold text-white">Profissional Responsável</h2>
            </div>
            <p className="text-white/90 font-medium">{result.clinician_name}</p>
            <p className="text-white/50 text-sm mt-0.5">
              {result.clinician_crm} · {result.clinician_rqe}
            </p>
          </div>

          <div className="rounded-xl border border-[#00FFFF]/10 bg-white/5 p-6 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-[#00FFFF]" />
              <h2 className="text-lg font-semibold text-white">Detalhes da Emissão</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-white/40">Data de assinatura</span>
                <p className="text-white/80">{dateStr}</p>
              </div>
              <div>
                <span className="text-white/40">Horário</span>
                <p className="text-white/80">{timeStr}</p>
              </div>
              <div>
                <span className="text-white/40">Protocolo</span>
                <p className="text-white/80 font-mono">#{protocolShort}</p>
              </div>
              <div>
                <span className="text-white/40">Status</span>
                <p className="text-white/80">
                  {result.status === 'completed' ? 'Concluído' : 'Em Progresso'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#00FFFF]/10 bg-white/5 p-6 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-[#00FFFF]" />
              <h2 className="text-lg font-semibold text-white">Identificação do Paciente</h2>
            </div>
            <p className="text-white/80">
              Paciente: <span className="font-medium">{result.patient_initials || '—'}</span>
            </p>
            <p className="text-white/30 text-xs mt-2">
              🔒 Informações protegidas conforme LGPD (Lei nº 13.709/2018). A identificação completa
              do paciente é restrita e preservada por questões de privacidade.
            </p>
          </div>

          <div className="rounded-xl border border-[#00FFFF]/10 bg-white/5 p-6 flex items-start gap-3 animate-fade-in-up">
            <FileText className="h-5 w-5 text-[#00FFFF] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-white/80 font-medium">
                Documento gerado pelo NeuroFlow AI
              </p>
              <p className="text-xs text-white/40 mt-1">
                Sistema de suporte à decisão clínica. A validação médica é obrigatória para
                confirmação diagnóstica.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicPageShell>
  )
}
