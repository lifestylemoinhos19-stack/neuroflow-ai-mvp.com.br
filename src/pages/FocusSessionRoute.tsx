import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { FocusSessionErrorBoundary } from '@/components/FocusSessionErrorBoundary'
import { FocusExperience } from '@/components/FocusExperience'
import type { FocusPersistence } from '@/hooks/use-focus-session-v2'
import { readGuestFocusSessions } from '@/hooks/use-focus-session-v2'

/**
 * /focus-session — público (sem login).
 *
 * Sessão de Foco UNIFICADA: logado e visitante usam exatamente o mesmo
 * componente (FocusExperience) com a mesma duração, fases e cristais.
 * A única diferença é o armazenamento:
 *  - Logado → Supabase (focus_sessions)
 *  - Visitante → localStorage (modo convidado)
 *
 * Ao autenticar, sincroniza sessões de convidado pendentes para o Supabase.
 */
export default function FocusSessionRoute() {
  const { isAuthenticated, loading, user } = useAuth()
  const navigate = useNavigate()
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
    void (async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (!authUser) return
      // Best-effort sync; falhas silenciosas (o visitante não vê).
      for (const entry of pending) {
        await supabase.from('focus_sessions').insert({
          user_id: authUser.id,
          status: 'completed',
          started_at: entry.started_at,
          completed_at: entry.completed_at,
          crystals_earned: entry.crystals,
          master_crystals: entry.master_crystals,
          capture_method: 'guest_local',
          settings: { duration: entry.duration_sec, mode: 'guest_sync', avg_bpm: entry.avg_bpm },
        })
      }
      localStorage.removeItem('neuroflow_guest_focus_sessions')
    })()
  }, [isAuthenticated])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A192F] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-[#00FFFF]/30 border-t-[#00FFFF] rounded-full animate-spin" />
      </div>
    )
  }

  const persistence: FocusPersistence = isAuthenticated
    ? { mode: 'supabase', userId: user?.id ?? null }
    : { mode: 'local', guestId }

  const handleExit = () => navigate('/dashboard')

  return (
    <FocusSessionErrorBoundary>
      <FocusExperience persistence={persistence} isGuest={!isAuthenticated} onExit={handleExit} />
    </FocusSessionErrorBoundary>
  )
}
