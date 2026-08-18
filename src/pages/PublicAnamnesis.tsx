import { useSearchParams } from 'react-router-dom'
import { PublicPageShell } from '@/components/PublicPageShell'
import { AlertCircle } from 'lucide-react'
import Anamnesis from '@/pages/Anamnesis'

/**
 * Public (no-auth) wrapper around the Anamnesis component.
 *
 * The patient reaches this route from /minhas-escalas with a `guest_id` query
 * parameter. The guest_id identifies the patient (already created via the
 * identify_guest_public RPC) and links the anamnesis session/responses to
 * them through a guest_token — no authentication or profile_id required.
 */
export default function PublicAnamnesis() {
  const [searchParams] = useSearchParams()
  // guest_id may arrive via query param (preferred) or be stored in localStorage
  // by the /minhas-escalas identification flow.
  const guestId = searchParams.get('guest_id') || localStorage.getItem('guest_id')

  if (!guestId) {
    return (
      <PublicPageShell>
        <div className="max-w-2xl mx-auto py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Identificação ausente</h1>
          <p className="text-white/80">
            Não foi possível identificar o paciente. Acesse suas avaliações através do link enviado
            pelo seu profissional de saúde.
          </p>
        </div>
      </PublicPageShell>
    )
  }

  return (
    <PublicPageShell>
      <div className="max-w-2xl mx-auto">
        <Anamnesis guestId={guestId} />
      </div>
    </PublicPageShell>
  )
}
