import { supabase } from '@/lib/supabase/client'
import type { Json } from '@/lib/supabase/types'

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
  scaleType?: string | null,
): Promise<AnamnesisSession | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) return createAnamnesisSession()
  if (!guestId) return null
  return createGuestAnamnesisSession(guestId, scaleType)
}

/**
 * Create an anamnesis session for an anonymous guest (public patient flow).
 * No auth required — the session is linked to the guest via a guest_token
 * stored in the `guest_token` column. Responses are saved against this session.
 */
export async function createGuestAnamnesisSession(
  guestId: string,
  scaleType?: string | null,
): Promise<AnamnesisSession | null> {
  const guestToken =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${guestId}-${Date.now()}-${Math.random().toString(36).slice(2)}`

  const metadata: Record<string, Json | undefined> = {
    guest_id: guestId,
    source: 'public_anamnesis',
  }
  if (scaleType) {
    metadata.scaleType = scaleType
  }

  const { data, error } = await supabase
    .from('anamnesis_sessions')
    .insert({
      status: 'in_progress',
      started_at: new Date().toISOString(),
      guest_token: guestToken,
      metadata,
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
