import { createContext, useContext, type ReactNode } from 'react'

/**
 * Context that exposes the guest_id (paciente público) para os componentes
 * de escala renderizados dentro de /avaliacao/* (modo guest, sem login).
 *
 * Os componentes consomem `useGuestScale()` para decidir se devem salvar via
 * o fluxo autenticado (saveAssessmentToSupabase) ou via o fluxo público
 * (saveAssessmentToSupabaseForGuest / saveDementiaAssessment com guestId).
 */
interface GuestScaleContextValue {
  guestId: string | null
}

const GuestScaleContext = createContext<GuestScaleContextValue>({ guestId: null })

export function GuestScaleProvider({
  guestId,
  children,
}: {
  guestId: string | null
  children: ReactNode
}) {
  return <GuestScaleContext.Provider value={{ guestId }}>{children}</GuestScaleContext.Provider>
}

export function useGuestScale(): string | null {
  return useContext(GuestScaleContext).guestId
}
