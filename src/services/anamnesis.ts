import { supabase } from '@/lib/supabase/client'

export interface AnamnesisSession {
  id: string
  user_id?: string | null
  profile_id?: string | null
  status: string
  started_at: string
  completed_at: string | null
}

export interface AnamnesisResponseInput {
  question_key: string
  question_label?: string
  response_value: string | number
}

export async function createAnamnesisSession(): Promise<AnamnesisSession | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('anamnesis_sessions')
    .insert({
      user_id: user.id,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating anamnesis session:', error)
    return null
  }

  return data as AnamnesisSession
}

/**
 * Cria uma sessão de anamnese para o fluxo público, priorizando o usuário
 * autenticado quando existir e, caso contrário, criando uma sessão anon
 * vinculada ao guest via guest_token. Isto permite que os componentes de
 * escala (Phq9Assessment, MocaAssessment, etc.) funcionem tanto no fluxo
 * autenticado (/evaluations/*) quanto no fluxo público de paciente
 * (/avaliacao/* com guest_id via query param).
 */
export async function createAnamnesisSessionForGuest(
  guestId?: string | null,
): Promise<AnamnesisSession | null> {
  // Se há usuário autenticado, reutiliza o fluxo padrão.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) return createAnamnesisSession()

  // Sem auth: exige guest_id para criar a sessão anon.
  if (!guestId) return null
  return createGuestAnamnesisSession(guestId)
}

/**
 * Create an anamnesis session for an anonymous guest (public patient flow).
 * No auth required — the session is linked to the guest via a guest_token
 * stored in the `guest_token` column. Responses are saved against this session.
 */
export async function createGuestAnamnesisSession(
  guestId: string,
): Promise<AnamnesisSession | null> {
  // guest_token acts as the public handle that lets anon read its own
  // session/responses via RLS (anamnesis_sessions_select_anon).
  const guestToken =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${guestId}-${Date.now()}-${Math.random().toString(36).slice(2)}`

  const { data, error } = await supabase
    .from('anamnesis_sessions')
    .insert({
      status: 'in_progress',
      started_at: new Date().toISOString(),
      guest_token: guestToken,
      metadata: { guest_id: guestId, source: 'public_anamnesis' },
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating guest anamnesis session:', error)
    return null
  }

  return data as AnamnesisSession
}

export async function saveAnamnesisResponses(
  sessionId: string,
  responses: AnamnesisResponseInput[],
): Promise<boolean> {
  const rows = responses.map((r) => ({
    session_id: sessionId,
    question_key: r.question_key,
    question_label: r.question_label || null,
    response_value: r.response_value,
  }))

  const { error } = await supabase.from('anamnesis_responses').insert(rows)

  if (error) {
    console.error('Error saving anamnesis responses:', error)
    return false
  }

  return true
}

export async function completeAnamnesisSession(sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('anamnesis_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (error) {
    console.error('Error completing anamnesis session:', error)
    return false
  }

  return true
}
