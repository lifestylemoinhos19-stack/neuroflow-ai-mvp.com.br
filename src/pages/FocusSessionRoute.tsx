import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { MainDeployment } from '@/components/MainDeployment'
import { FocusSessionErrorBoundary } from '@/components/FocusSessionErrorBoundary'
import { PublicFocusExplorador } from '@/components/PublicFocusExplorador'

const GUEST_FOCUS_KEY = 'neuroflow_guest_focus_sessions'

export interface GuestFocusEntry {
  id: string
  started_at: string
  completed_at: string | null
  crystals: number
  master_crystals: number
  duration_sec: number
  avg_bpm: number | null
}

export function readGuestFocusSessions(): GuestFocusEntry[] {
  try {
    const raw = localStorage.getItem(GUEST_FOCUS_KEY)
    return raw ? (JSON.parse(raw) as GuestFocusEntry[]) : []
  } catch {
    return []
  }
}

export function saveGuestFocusSession(entry: GuestFocusEntry) {
  const list = readGuestFocusSessions()
  list.unshift(entry)
  localStorage.setItem(GUEST_FOCUS_KEY, JSON.stringify(list.slice(0, 50)))
}

/**
 * /focus-session — público (sem login).
 * - Logado: progresso salvo no Supabase (focus_sessions).
 * - Visitante (sem login): progresso salvo em localStorage (modo convidado).
 */
export default function FocusSessionRoute() {
  const { isAuthenticated, loading } = useAuth()
  const [guestId] = useState<string>(() => {
    const existing = localStorage.getItem('neuroflow_guest_focus_id')
    if (existing) return existing
    const id = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem('neuroflow_guest_focus_id', id)
    return id
  })

  // Ao autenticar, sincroniza sessões de convidado pendentes para o Supabase.
  useEffect(() => {
    if (!isAuthenticated) return
    const pending = readGuestFocusSessions()
    if (pending.length === 0) return
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      // Best-effort sync; falhas silenciosas (o visitante não vê).
      for (const entry of pending) {
        await supabase.from('focus_sessions').insert({
          id: undefined,
          user_id: user.id,
          status: 'completed',
          started_at: entry.started_at,
          completed_at: entry.completed_at,
          crystals_earned: entry.crystals,
          master_crystals: entry.master_crystals,
          capture_method: 'guest_local',
        })
      }
      localStorage.removeItem(GUEST_FOCUS_KEY)
    })()
  }, [isAuthenticated])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A192F] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-[#00FFFF]/30 border-t-[#00FFFF] rounded-full animate-spin" />
      </div>
    )
  }

  // Logado: usa MainDeployment (salva no Supabase via useFocusSession).
  if (isAuthenticated) {
    return (
      <FocusSessionErrorBoundary>
        <MainDeployment />
      </FocusSessionErrorBoundary>
    )
  }

  // Visitante (sem login): sessão pública em localStorage.
  return (
    <FocusSessionErrorBoundary>
      <PublicFocusExplorador guestId={guestId} onSave={(entry) => saveGuestFocusSession(entry)} />
    </FocusSessionErrorBoundary>
  )
}
