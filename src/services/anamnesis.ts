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

export async function createAnamnesisSession(
  scaleType?: string | null,
  guestId?: string | null,
  extraMetadata?: Record<string, unknown>,
): Promise<AnamnesisSession | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const resolvedGuestId =
    guestId ||
    (typeof window !== 'undefined' ? localStorage.getItem('guest_id') : null) ||
    undefined

  const metadata: Record<string, Json | undefined> = {
    ...(extraMetadata as Record<string, Json | undefined>),
  }
  if (scaleType) {
    metadata.scaleType = scaleType
  }
  if (resolvedGuestId) {
    metadata.guest_id = resolvedGuestId
  }

  const { data, error } = await supabase
    .from('anamnesis_sessions')
    .insert({
      user_id: user.id,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      metadata,
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
 * Cria uma sessão de anamnese para o fluxo público ou autenticado,
 * SEMPRE persistindo scaleType e guest_id no metadata para garantir
 * que o trigger de vinculação de scale_assignments funcione de forma determinística.
 */
export async function createAnamnesisSessionForGuest(
  guestId?: string | null,
  scaleType?: string | null,
  extraMetadata?: Record<string, unknown>,
): Promise<AnamnesisSession | null> {
  const resolvedGuestId =
    guestId || (typeof window !== 'undefined' ? localStorage.getItem('guest_id') : null) || null

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    return createAnamnesisSession(scaleType, resolvedGuestId, extraMetadata)
  }

  if (!resolvedGuestId) return null
  return createGuestAnamnesisSession(resolvedGuestId, scaleType, extraMetadata)
}

/**
 * Create an anamnesis session for an anonymous guest (public patient flow).
 * No auth required — the session is linked to the guest via a guest_token
 * stored in the `guest_token` column. Responses are saved against this session.
 */
export async function createGuestAnamnesisSession(
  guestId: string,
  scaleType?: string | null,
  extraMetadata?: Record<string, unknown>,
): Promise<AnamnesisSession | null> {
  const guestToken =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${guestId}-${Date.now()}-${Math.random().toString(36).slice(2)}`

  const metadata: Record<string, Json | undefined> = {
    ...(extraMetadata as Record<string, Json | undefined>),
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

export async function completeAnamnesisSession(
  sessionId: string,
  metadataToMerge?: Record<string, unknown>,
): Promise<boolean> {
  let finalMetadata: Record<string, Json | undefined> | undefined = undefined

  if (metadataToMerge && Object.keys(metadataToMerge).length > 0) {
    const { data: session } = await supabase
      .from('anamnesis_sessions')
      .select('metadata')
      .eq('id', sessionId)
      .maybeSingle()
    const existing = (session?.metadata as Record<string, Json | undefined>) || {}
    finalMetadata = { ...existing, ...(metadataToMerge as Record<string, Json | undefined>) }
  }

  const updatePayload: Record<string, unknown> = {
    status: 'completed',
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  if (finalMetadata !== undefined) {
    updatePayload.metadata = finalMetadata
  }

  const { error } = await supabase
    .from('anamnesis_sessions')
    .update(updatePayload as any)
    .eq('id', sessionId)

  if (error) {
    console.error('Error completing anamnesis session:', error)
    return false
  }

  return true
}
