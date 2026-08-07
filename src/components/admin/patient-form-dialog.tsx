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
import { Loader2 } from 'lucide-react'
import {
  type PatientFormData,
  createPatient,
  updatePatient,
  type AdminPatient,
} from '@/services/admin-painel'

interface PatientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient?: AdminPatient | null
  onSaved: () => void
}

export function PatientFormDialog({
  open,
  onOpenChange,
  patient,
  onSaved,
}: PatientFormDialogProps) {
  const [form, setForm] = useState<PatientFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birth_date: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setError(null)
      setForm(
        patient
          ? {
              first_name: patient.first_name,
              last_name: patient.last_name,
              email: patient.email || '',
              phone: patient.phone || '',
              birth_date: patient.birth_date || '',
            }
          : { first_name: '', last_name: '', email: '', phone: '', birth_date: '' },
      )
    }
  }, [open, patient])

  const handleSubmit = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('Nome e sobrenome são obrigatórios.')
      return
    }
    setSaving(true)
    const { error } = patient ? await updatePatient(patient.id, form) : await createPatient(form)
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
          <DialogTitle className="text-white font-bold">
            {' '}
            {patient ? 'Editar Paciente' : 'Novo Paciente'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm text-slate-100">Nome *</Label>
              <Input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-slate-100">Sobrenome *</Label>
              <Input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-sm text-slate-100">E-mail</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm text-slate-100">Telefone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-slate-100">Nascimento</Label>
              <Input
                type="date"
                value={form.birth_date}
                onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {patient ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
