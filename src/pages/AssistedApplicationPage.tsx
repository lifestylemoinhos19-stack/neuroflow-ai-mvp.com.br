/**
 * NeuroFlow — Página de Aplicação Assistida
 *
 * Rota: /aplicacao-assistida/:scaleType/:assignmentId
 *
 * Protegida por AuthGuard clínico (admin/doctor/staff). Resolve a escala
 * assistida a partir de :scaleType, carrega o scale_assignment (e o guest
 * vinculado), e renderiza o componente <AssistedApplication /> com os dados
 * de identificação do paciente (iniciais, idade, escolaridade).
 *
 * O `assignmentId` aqui é o `scale_assignments.id`. Caso ele seja inválido
 * ou a escala não suporte o modo assistido, a página cai em um estado de
 * erro acolhedor com volta ao Painel Admin.
 */
import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AssistedApplication } from '@/components/AssistedApplication'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { ASSISTED_SCALES, normalizeAssistedScaleType } from '@/lib/assisted-scales-data'
import { CLINIC_BRANDING, CLINICIAN_CREDENTIALS } from '@/lib/clinic-branding'
import { calculateAge, getGuestFull, type GuestFull } from '@/services/guest-patient'

interface AssignmentRow {
  id: string
  scale_type: string
  guest_id: string | null
  patient_id: string | null
  status: string
  assigned_at: string
}

export default function AssistedApplicationPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const scaleType = params.scaleType ?? ''
  const assignmentId = params.assignmentId ?? ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignment, setAssignment] = useState<AssignmentRow | null>(null)
  const [guest, setGuest] = useState<GuestFull | null>(null)

  const scaleKey = useMemo(() => normalizeAssistedScaleType(scaleType), [scaleType])
  const scale = scaleKey ? ASSISTED_SCALES[scaleKey] : null

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        if (!scaleKey || !scale) {
          setError('Esta escala não suporta o modo de aplicação assistida.')
          setLoading(false)
          return
        }
        // Carrega o scale_assignment.
        const { data: a, error: ea } = await supabase
          .from('scale_assignments')
          .select('id, scale_type, guest_id, patient_id, status, assigned_at')
          .eq('id', assignmentId)
          .maybeSingle()
        if (cancelled) return
        if (ea || !a) {
          setError('Testagem/atribuição não encontrada.')
          setLoading(false)
          return
        }
        const row = a as AssignmentRow
        setAssignment(row)

        // Resolve o guest (decifrado via RPC) para iniciais/idade.
        const guestId = row.guest_id
        if (guestId) {
          const { data: g } = await getGuestFull(guestId)
          if (!cancelled) setGuest(g)
        } else if (row.patient_id) {
          // patient_id → profiles.id → profiles.guest_id
          const { data: prof } = await supabase
            .from('profiles')
            .select('guest_id')
            .eq('id', row.patient_id)
            .maybeSingle()
          const gid = prof?.guest_id as string | null | undefined
          if (gid) {
            const { data: g } = await getGuestFull(gid)
            if (!cancelled) setGuest(g)
          }
        }
      } catch (e) {
        console.error(e)
        if (!cancelled) setError('Erro ao carregar a aplicação.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [assignmentId, scaleKey, scale])

  // --- Deriva iniciais/idade/escolaridade ---
  const iniciais = useMemo(() => {
    if (guest?.first_name) {
      const f = guest.first_name.charAt(0).toUpperCase()
      const l = guest.last_name ? guest.last_name.charAt(0).toUpperCase() : ''
      return `${f}.${l ? l + '.' : ''}`
    }
    return '—'
  }, [guest])

  const idade = useMemo(() => {
    if (guest?.birth_date) return calculateAge(guest.birth_date)
    return null
  }, [guest])

  const escolaridade = '—' // não há campo na tabela guests; o profissional confirma no registro

  const professionalName = user?.name
    ? `${user.name} · ${CLINICIAN_CREDENTIALS.crm}`
    : `${CLINICIAN_CREDENTIALS.name} · ${CLINICIAN_CREDENTIALS.crm}`

  // --- Estados de renderização ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF5EB]">
        <Loader2
          className="h-8 w-8 animate-spin"
          style={{ color: CLINIC_BRANDING.colors.primary }}
        />
        <p className="mt-3 text-sm" style={{ color: CLINIC_BRANDING.colors.medium }}>
          Carregando aplicação assistida...
        </p>
      </div>
    )
  }

  if (error || !scale || !assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF5EB] px-4">
        <Card
          className="max-w-md w-full border-2"
          style={{ borderColor: CLINIC_BRANDING.colors.secondary }}
        >
          <CardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="h-10 w-10 mx-auto" style={{ color: '#b91c1c' }} />
            <h2 className="text-lg font-bold" style={{ color: CLINIC_BRANDING.colors.dark }}>
              {error || 'Não foi possível iniciar a aplicação.'}
            </h2>
            <p className="text-sm" style={{ color: CLINIC_BRANDING.colors.medium }}>
              Verifique se a testagem selecionada suporta o modo assistido e se você tem permissão.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button asChild variant="outline" className="border-[#C4A35A] text-[#7B5B3A]">
                <Link to="/minhas-escalas">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para Minhas Escalas
                </Link>
              </Button>
              {user && (
                <Button asChild variant="ghost" className="text-[#7B5B3A]">
                  <Link to="/admin/painel">Painel Admin</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <AssistedApplication
      scale={scale}
      iniciais={iniciais}
      idade={idade}
      escolaridade={escolaridade}
      guestId={assignment.guest_id}
      patientId={assignment.patient_id}
      professionalId={user?.id ?? null}
      professionalName={professionalName}
      assignmentId={assignment.id}
      onSaved={() => {
        /* permanece na tela de resumo após salvar */
      }}
    />
  )
}
