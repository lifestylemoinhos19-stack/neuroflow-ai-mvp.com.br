import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ClipboardPlus, Loader2, Users, ArrowRight, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import { SCALE_TYPES, translateStatus } from '@/services/admin-sessions'
import { getAdminPatients, type AdminPatient } from '@/services/admin-painel'

interface ScaleAssignment {
  id: string
  patient_id: string
  scale_type: string
  status: string
  assigned_at: string
  patient_name?: string
}

const SCALE_OPTIONS = SCALE_TYPES

export default function AssignScales() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [patients, setPatients] = useState<AdminPatient[]>([])
  const [assignments, setAssignments] = useState<ScaleAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; patient: AdminPatient | null }>(
    { open: false, patient: null },
  )
  const [selectedScales, setSelectedScales] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [p, a] = await Promise.all([getAdminPatients(), fetchAssignments()])
    setPatients(p)
    setAssignments(a)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const fetchAssignments = async (): Promise<ScaleAssignment[]> => {
    const { data, error } = await supabase
      .from('scale_assignments')
      .select('id, patient_id, scale_type, status, assigned_at')
      .order('assigned_at', { ascending: false })
      .limit(100)
    if (error || !data) return []

    const patientIds = new Set(data.map((a) => a.patient_id))
    const patientMap: Record<string, string> = {}
    if (patientIds.size) {
      // Buscar nomes via profiles (patient_id é o profile id do paciente)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', [...patientIds])
      ;(profiles || []).forEach((p) => {
        patientMap[p.id] = p.full_name || 'Paciente'
      })
    }
    return data.map((a) => ({
      ...a,
      patient_name: patientMap[a.patient_id] || 'Paciente',
    }))
  }

  const openAssignDialog = (patient: AdminPatient) => {
    setAssignDialog({ open: true, patient })
    setSelectedScales([])
  }

  const toggleScale = (scale: string) => {
    setSelectedScales((prev) =>
      prev.includes(scale) ? prev.filter((s) => s !== scale) : [...prev, scale],
    )
  }

  const handleAssign = async () => {
    if (!assignDialog.patient || selectedScales.length === 0) return
    setSaving(true)
    const patient = assignDialog.patient

    // Buscar o profile.id do paciente vinculado ao guest_id.
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('guest_id', patient.id)
      .maybeSingle()

    if (!profile?.id) {
      toast({
        variant: 'destructive',
        title: 'Paciente sem perfil',
        description:
          'O paciente selecionado ainda não possui um perfil vinculado (user_id). Ele precisa fazer login ao menos uma vez antes de receber escalas.',
      })
      setSaving(false)
      return
    }

    const rows = selectedScales.map((scale_type) => ({
      patient_id: profile.id,
      scale_type,
      status: 'pending',
      assigned_by: user?.id ?? null,
    }))

    const { error } = await supabase.from('scale_assignments').insert(rows)
    setSaving(false)
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message })
      return
    }
    toast({
      title: 'Escalas atribuídas',
      description: `${selectedScales.length} escala(s) atribuída(s) a ${patient.first_name}.`,
    })
    setAssignDialog({ open: false, patient: null })
    loadData()
  }

  if (loading)
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    )

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white flex items-center gap-2">
          <ClipboardPlus className="h-7 w-7 text-[#00FFFF]" /> Atribuir Escalas
        </h1>
        <p className="text-white/80">
          Selecione um paciente e atribua as escalas que ele deve responder no tablet.
        </p>
      </div>

      <Card className="border-slate-800">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <Users className="h-4 w-4" /> Pacientes
          </CardTitle>
          <CardDescription className="text-white/80">
            Clique em "Atribuir Escalas" ao lado de um paciente para selecionar as escalas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {patients.length === 0 ? (
            <p className="text-center text-white/80 py-8">Nenhum paciente encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white font-semibold">Nome</TableHead>
                    <TableHead className="text-white font-semibold">E-mail</TableHead>
                    <TableHead className="text-white font-semibold">Nascimento</TableHead>
                    <TableHead className="text-white font-semibold text-center">
                      Escalas Pendentes
                    </TableHead>
                    <TableHead className="text-white font-semibold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((p) => {
                    const pending = assignments.filter(
                      (a) => a.patient_name?.includes(p.first_name) && a.status === 'pending',
                    ).length
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm font-bold text-white">
                          {p.first_name} {p.last_name}
                        </TableCell>
                        <TableCell className="text-sm text-white/80">{p.email || '-'}</TableCell>
                        <TableCell className="text-sm text-white/80">
                          {p.birth_date ? new Date(p.birth_date).toLocaleDateString('pt-BR') : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-center">
                          <Badge variant="secondary">{pending}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => openAssignDialog(p)}
                            className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80"
                          >
                            <ClipboardPlus className="h-4 w-4 mr-1" /> Atribuir Escalas
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-800">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white">
            Escalas Atribuídas Recentemente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-center text-white/80 py-8">Nenhuma escala atribuída ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white font-semibold">Paciente</TableHead>
                    <TableHead className="text-white font-semibold">Escala</TableHead>
                    <TableHead className="text-white font-semibold">Data</TableHead>
                    <TableHead className="text-white font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm font-bold text-white">
                        {a.patient_name}
                      </TableCell>
                      <TableCell className="text-sm text-white/80">{a.scale_type}</TableCell>
                      <TableCell className="text-sm text-white/80">
                        {new Date(a.assigned_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-sm text-slate-200">
                        {translateStatus(a.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={assignDialog.open}
        onOpenChange={(o) => setAssignDialog({ open: o, patient: null })}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white font-bold flex items-center gap-2">
              <ClipboardPlus className="h-5 w-5 text-[#00FFFF]" />
              Atribuir Escalas — {assignDialog.patient?.first_name}{' '}
              {assignDialog.patient?.last_name}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Selecione as escalas que o paciente deve responder.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2 max-h-80 overflow-y-auto">
            {SCALE_OPTIONS.map((scale) => (
              <label
                key={scale}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <Checkbox
                  checked={selectedScales.includes(scale)}
                  onCheckedChange={() => toggleScale(scale)}
                />
                <span className="text-sm text-white">{scale}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignDialog({ open: false, patient: null })}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAssign}
              disabled={saving || selectedScales.length === 0}
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Atribuir {selectedScales.length > 0 ? `(${selectedScales.length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
