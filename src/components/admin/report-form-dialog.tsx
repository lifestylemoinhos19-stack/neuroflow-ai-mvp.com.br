import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { createReport, updateReport, type AdminReport } from '@/services/admin-reports'
import { type AdminTest } from '@/services/admin-sessions'

interface ReportFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  report?: AdminReport | null
  sessions: AdminTest[]
  onSaved: () => void
}

export function ReportFormDialog({
  open,
  onOpenChange,
  report,
  sessions,
  onSaved,
}: ReportFormDialogProps) {
  const [sessionId, setSessionId] = useState('')
  const [interpretation, setInterpretation] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setError(null)
      if (report) {
        setSessionId(report.session_id)
        setInterpretation(report.admin_edited_interpretation || report.comments || '')
      } else {
        setSessionId(sessions[0]?.id || '')
        setInterpretation('')
      }
    }
  }, [open, report, sessions])

  const handleSubmit = async () => {
    if (!interpretation.trim()) {
      setError('A interpretação é obrigatória.')
      return
    }
    if (!sessionId) {
      setError('Selecione uma sessão.')
      return
    }
    setSaving(true)
    const { error } = report
      ? await updateReport(report.id, interpretation)
      : await createReport(sessionId, interpretation)
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white font-bold">
            {report ? 'Editar Laudo' : 'Novo Laudo'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {report ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded p-3 text-xs space-y-1">
              <div>
                <span className="text-slate-400">Paciente:</span>{' '}
                <span className="font-semibold text-white">
                  {report.patient_name || 'Paciente não identificado'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Instrumento:</span>{' '}
                <span className="text-slate-200">{report.session_type}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="text-sm text-slate-100">Sessão *</Label>
              <Select value={sessionId} onValueChange={setSessionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma sessão" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.patient_name} — {s.type} (
                      {new Date(s.started_at).toLocaleDateString('pt-BR')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-sm text-slate-100">Interpretação Clínica *</Label>
            <Textarea
              value={interpretation}
              onChange={(e) => setInterpretation(e.target.value)}
              rows={6}
              placeholder="Digite a interpretação clínica..."
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {report ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
