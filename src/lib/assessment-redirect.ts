/**
 * Redireciona o paciente de volta para /minhas-escalas após concluir uma
 * escala no fluxo público (guest). Preserva o guest_id no localStorage para
 * que a página de origem reidentifique o paciente automaticamente.
 *
 * Usado pelos componentes de escala (Phq9Assessment, Gad7Assessment, etc.)
 * quando renderizados dentro de /avaliacao/* (modo guest, sem login).
 */
export function returnToMinhasEscalas(guestId?: string | null) {
  if (guestId) {
    try {
      localStorage.setItem('guest_id', guestId)
    } catch {
      /* ignore */
    }
  }
  const id = guestId || localStorage.getItem('guest_id') || ''
  const params = id ? `?guest_id=${encodeURIComponent(id)}` : ''
  // window.location.href garante um remount completo do /minhas-escalas,
  // evitando estado residual do componente de escala.
  window.location.href = `/minhas-escalas${params}`
}
