import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import {
  SCALE_TYPES,
  createMockSession,
  updateSession,
  type AdminTest,
} from '@/services/admin-sessions'
import { type AdminPatient } from '@/services/admin-painel'

interface SessionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session?: AdminTest | null
  patients: AdminPatient[]
  onSaved: () => void
}

export function SessionFormDialog({
  open,
  onOpenChange,
  session,
  patients,
  onSaved,
}: SessionFormDialogProps) {
  const [scaleType, setScaleType] = useState('PHQ-9')
  const [guestId, setGuestId] = useState('')
  const [score, setScore] = useState('0')
  const [status, setStatus] = useState('completed')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setError(null)
      if (session) {
        setScaleType(session.type)
        setGuestId(session.guest_id || '')
        setStatus(session.status)
        setScore('0')
      } else {
        setScaleType('PHQ-9')
        setGuestId(patients[0]?.id || '')
        setStatus('completed')
        setScore('0')
      }
    }
  }, [open, session, patients])

  const handleSubmit = async () => {
    if (!session && !guestId) {
      setError('Selecione um paciente.')
      return
    }
    setSaving(true)
    const scoreNum = parseInt(score) || 0
    const { error } = session
      ? await updateSession(session.id, { score: scoreNum, status })
      : await createMockSession({
          scale_type: scaleType,
          guest_id: guestId,
          score: scoreNum,
          status,
        })
    setSaving(false)
    if (error) {
      setError(error)
      return
    }
    onSaved()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{session ? 'Editar Testagem' : 'Nova Testagem (Mock)'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {!session && (
            <>
              <div className="space-y-1">
                <Label className="text-sm">Paciente *</Label>
                <Select value={guestId} onValueChange={setGuestId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Escala *</Label>
                <Select value={scaleType} onValueChange={setScaleType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCALE_TYPES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">Pontuação</Label>
              <Input type="number" value={score} onChange={(e) => setScore(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="reset">Resetado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {session ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
