import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Shield,
  Trash2,
  Loader2,
  LayoutDashboard,
  ClipboardList,
  Clock,
  Brain,
  FileText,
  Eye,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { getRecentSessions, resetSession, deleteSession, type AdminSession } from '@/services/admin'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function AdminToolbar() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [sessions, setSessions] = useState<AdminSession[]>([])
  const [loading, setLoading] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

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
    setActionId(sessionId)
    const { error } = await resetSession(sessionId)
    setActionId(null)
    if (error) {
      toast.error('Erro ao resetar sessão: ' + error)
      return
    }
    toast.success('Sessão resetada com sucesso!')
    fetchSessions()
  }

  const handleDelete = async (sessionId: string) => {
    setActionId(sessionId)
    const { error } = await deleteSession(sessionId)
    setActionId(null)
    if (error) {
      toast.error('Erro ao deletar sessão: ' + error)
      return
    }
    toast.success('Sessão deletada permanentemente!')
    fetchSessions()
  }

  if (!isAdmin) return null

  const navButtons = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: ClipboardList, label: 'Escalas', path: '/scales' },
    { icon: Brain, label: 'Anamnese', path: '/anamnesis' },
    { icon: FileText, label: 'Documentos', path: '/documentos' },
  ]

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
              {navButtons.map((btn) => (
                <Button
                  key={btn.path}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigate(btn.path)
                    setOpen(false)
                  }}
                  className="border-[#00FFFF]/30 text-[#00FFFF] hover:bg-[#00FFFF]/10"
                >
                  <btn.icon className="h-3 w-3 mr-1" /> {btn.label}
                </Button>
              ))}
            </div>

            <div>
              <h3 className="text-sm font-bold text-white/80 mb-2 flex items-center gap-2">
                <Clock className="h-3 w-3" /> Gerenciamento de Sessões
              </h3>
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
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            className={cn(
                              s.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : s.status === 'reset'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-amber-500/20 text-amber-400',
                            )}
                          >
                            {s.status}
                          </Badge>
                          {s.guest_token && (
                            <Badge className="bg-purple-500/20 text-purple-400 text-[10px]">
                              Guest
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigate('/documentos')
                            setOpen(false)
                          }}
                          className="border-[#00FFFF]/30 text-[#00FFFF] hover:bg-[#00FFFF]/10 h-7 w-7 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReset(s.id)}
                          disabled={actionId === s.id}
                          className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 h-7 px-2 text-xs"
                        >
                          {actionId === s.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Reset'
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(s.id)}
                          disabled={actionId === s.id}
                          className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 h-7 w-7 p-0"
                        >
                          {actionId === s.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
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
