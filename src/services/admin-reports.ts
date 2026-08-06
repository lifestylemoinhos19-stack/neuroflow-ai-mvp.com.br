import { supabase } from '@/lib/supabase/client'

export interface AdminReport {
  id: string
  session_id: string
  admin_edited_interpretation: string | null
  system_suggestion: string | null
  comments: string | null
  is_accurate: boolean | null
  created_at: string
  session_date: string | null
  session_type: string
}

function metaOf(m: unknown): Record<string, unknown> | null {
  return m && typeof m === 'object' ? (m as Record<string, unknown>) : null
}

export async function getAdminReports(): Promise<AdminReport[]> {
  const { data: feedback, error } = await supabase
    .from('clinical_feedback')
    .select(
      'id, session_id, admin_edited_interpretation, system_suggestion, comments, is_accurate, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (error || !feedback) return []

  const sessionIds = [...new Set(feedback.map((f) => f.session_id).filter(Boolean))] as string[]
  const sessionMap: Record<string, { started_at: string; type: string }> = {}

  if (sessionIds.length) {
    const { data: sessions } = await supabase
      .from('anamnesis_sessions')
      .select('id, started_at, metadata')
      .in('id', sessionIds)
    ;(sessions || []).forEach((s) => {
      const meta = metaOf(s.metadata)
      sessionMap[s.id] = {
        started_at: s.started_at,
        type: (meta?.type as string) || (meta?.scale_type as string) || 'Anamnese',
      }
    })
  }

  return feedback.map((f) => ({
    id: f.id,
    session_id: f.session_id ?? '',
    admin_edited_interpretation: f.admin_edited_interpretation,
    system_suggestion: f.system_suggestion,
    comments: f.comments,
    is_accurate: f.is_accurate,
    created_at: f.created_at,
    session_date: f.session_id ? (sessionMap[f.session_id]?.started_at ?? null) : null,
    session_type: f.session_id ? (sessionMap[f.session_id]?.type ?? 'Anamnese') : 'Anamnese',
  }))
}

export async function createReport(
  sessionId: string,
  interpretation: string,
): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('clinical_feedback').upsert(
    {
      session_id: sessionId,
      doctor_id: user.id,
      admin_edited_interpretation: interpretation,
      comments: interpretation,
      is_accurate: true,
    },
    { onConflict: 'session_id' },
  )
  return { error: error?.message ?? null }
}

export async function updateReport(
  reportId: string,
  interpretation: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('clinical_feedback')
    .update({ admin_edited_interpretation: interpretation, comments: interpretation })
    .eq('id', reportId)
  return { error: error?.message ?? null }
}

export async function deleteReport(reportId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('clinical_feedback').delete().eq('id', reportId)
  return { error: error?.message ?? null }
}
