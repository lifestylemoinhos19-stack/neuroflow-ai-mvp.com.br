import { useState, useEffect, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { validateDocument, type ValidationResult } from '@/services/validation'
import { CLINIC_BRANDING, CLINICIAN_CREDENTIALS } from '@/lib/clinic-branding'
import { Loader2, ShieldCheck, ShieldX, Stethoscope, Building2, FileCheck2 } from 'lucide-react'

const c = CLINIC_BRANDING.colors

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function ValidationPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }
    validateDocument(sessionId).then((data) => {
      setResult(data)
      setLoading(false)
    })
  }, [sessionId])

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: c.accent }}
      >
        <Loader2 className="h-10 w-10 animate-spin mb-4" style={{ color: c.primary }} />
        <p className="text-sm" style={{ color: c.medium }}>
          Verificando autenticidade do laudo...
        </p>
      </div>
    )
  }

  const valid = !!result

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ backgroundColor: c.accent }}
    >
      <div className="w-full max-w-lg">
        {/* Header: logo + clinic name */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={CLINIC_BRANDING.logoUrl}
            alt={CLINIC_BRANDING.name}
            className="h-20 w-auto object-contain mb-3"
          />
          <h1 className="text-2xl font-bold" style={{ color: c.primary }}>
            {CLINIC_BRANDING.name}
          </h1>
          <p className="text-sm" style={{ color: c.medium }}>
            {CLINIC_BRANDING.tagline}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl bg-white shadow-xl overflow-hidden border"
          style={{ borderColor: c.secondary }}
        >
          {/* Title bar */}
          <div className="px-6 py-5 text-center" style={{ backgroundColor: c.primary }}>
            <h2 className="text-xl font-bold text-white">Validação de Laudo</h2>
          </div>

          <div className="p-6">
            {/* Validity seal */}
            <div className="flex justify-center mb-6">
              {valid ? (
                <div
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full"
                  style={{ backgroundColor: '#dcfce7', color: '#15803d' }}
                >
                  <ShieldCheck className="h-5 w-5" />
                  <span className="font-bold">✅ VÁLIDO</span>
                </div>
              ) : (
                <div
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full"
                  style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}
                >
                  <ShieldX className="h-5 w-5" />
                  <span className="font-bold">❌ INVÁLIDO</span>
                </div>
              )}
            </div>

            {valid && result ? (
              <div className="space-y-5">
                {/* Laudo data */}
                <Section icon={<FileCheck2 className="h-5 w-5" />} title="Dados do Laudo">
                  <Row
                    label="Tipo de avaliação"
                    value={result.assessment_type || 'Avaliação Neuropsiquiátrica'}
                  />
                  <Row
                    label="Data da avaliação"
                    value={fmtDate(result.completed_at || result.started_at)}
                  />
                  <Row label="Paciente (iniciais)" value={result.patient_initials || '—'} />
                  <Row
                    label="Status"
                    value={result.status === 'completed' ? 'Concluído' : 'Em andamento'}
                  />
                </Section>

                {/* Professional */}
                <Section
                  icon={<Stethoscope className="h-5 w-5" />}
                  title="Profissional Responsável"
                >
                  <Row label="Nome" value={result.clinician_name || CLINICIAN_CREDENTIALS.name} />
                  <Row label="CRM" value={result.clinician_crm || CLINICIAN_CREDENTIALS.crm} />
                  <Row label="RQE" value={result.clinician_rqe || CLINICIAN_CREDENTIALS.rqe} />
                </Section>

                {/* Clinic */}
                <Section icon={<Building2 className="h-5 w-5" />} title="Clínica">
                  <Row label="Nome" value={result.clinic_name || CLINIC_BRANDING.name} />
                  <Row label="Endereço" value={CLINIC_BRANDING.address} />
                  <Row label="WhatsApp" value={CLINIC_BRANDING.whatsapp} />
                </Section>

                {/* Footer text */}
                <div
                  className="rounded-lg p-4 text-center text-sm"
                  style={{ backgroundColor: c.accent, color: c.dark }}
                >
                  Este laudo foi gerado pelo NeuroFlow AI e assinado digitalmente. Documento válido
                  para fins clínicos.
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="font-semibold mb-2" style={{ color: c.dark }}>
                  Laudo não encontrado ou expirado
                </p>
                <p className="text-sm" style={{ color: c.medium }}>
                  O código informado não corresponde a um laudo válido em nossa base. Entre em
                  contato com {CLINIC_BRANDING.name} pelo WhatsApp {CLINIC_BRANDING.whatsapp}.
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: c.medium }}>
          {CLINIC_BRANDING.name} · {CLINIC_BRANDING.address} · WhatsApp: {CLINIC_BRANDING.whatsapp}
        </p>
      </div>
    </div>
  )
}

function Section({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{ borderColor: c.secondary, backgroundColor: c.accent }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: c.primary }}>{icon}</span>
        <h3 className="font-semibold" style={{ color: c.dark }}>
          {title}
        </h3>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span style={{ color: c.medium }}>{label}:</span>
      <span className="font-medium text-right" style={{ color: c.dark }}>
        {value}
      </span>
    </div>
  )
}
