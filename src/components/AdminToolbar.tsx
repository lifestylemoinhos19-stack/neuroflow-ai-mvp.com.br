import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Trash2, Loader2, LayoutDashboard, ClipboardList, Clock, Brain } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { getRecentSessions, resetSession, type AdminSession } from '@/services/admin'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function AdminToolbar() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [sessions, setSessions] = useState<AdminSession[]>([])
  const [loading, setLoading] = useState(false)
  const [resettingId, setResettingId] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    const data = await getRecentSessions()
    setSessions(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (open) fetchSessions()
  }, [open, fetchSessions])

  const handleReset = async (sessionId: string) => {
    setResettingId(sessionId)
    const { error } = await resetSession(sessionId)
    setResettingId(null)
    if (error) {
      toast.error('Erro ao resetar sessão: ' + error)
      return
    }
    toast.success('Sessão resetada com sucesso!')
    fetchSessions()
  }

  if (!isAdmin) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[60] bg-[#0A192F] border border-[#00FFFF]/40 rounded-full p-3 shadow-lg hover:scale-105 transition-transform"
        style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)' }}
      >
        <Shield className="h-5 w-5 text-[#00FFFF]" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="bg-[#0A192F] border-[#00FFFF]/20 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-[#00FFFF] flex items-center gap-2">
              <Shield className="h-5 w-5" /> Painel Administrativo
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigate('/dashboard')
                  setOpen(false)
                }}
                className="border-[#00FFFF]/30 text-[#00FFFF] hover:bg-[#00FFFF]/10"
              >
                <LayoutDashboard className="h-3 w-3 mr-1" /> Dashboard
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigate('/scales')
                  setOpen(false)
                }}
                className="border-[#00FFFF]/30 text-[#00FFFF] hover:bg-[#00FFFF]/10"
              >
                <ClipboardList className="h-3 w-3 mr-1" /> Escalas
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigate('/anamnesis')
                  setOpen(false)
                }}
                className="border-[#00FFFF]/30 text-[#00FFFF] hover:bg-[#00FFFF]/10"
              >
                <Brain className="h-3 w-3 mr-1" /> Anamnese
              </Button>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white/80 mb-2">Sessões Recentes</h3>
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 text-[#00FFFF] animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-white/40 text-center py-4">Nenhuma sessão encontrada.</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/60 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(s.started_at).toLocaleDateString('pt-BR')}
                        </p>
                        <Badge
                          className={cn(
                            'mt-1',
                            s.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : s.status === 'reset'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-amber-500/20 text-amber-400',
                          )}
                        >
                          {s.status}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReset(s.id)}
                        disabled={resettingId === s.id}
                        className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                      >
                        {resettingId === s.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-3 w-3 mr-1" /> Reset
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
