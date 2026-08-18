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
import { translateStatus } from '@/services/admin-sessions'
import { getAdminPatients, type AdminPatient } from '@/services/admin-painel'
import CalmExplorerQRCard from '@/components/CalmExplorerQRCard'
import { SCALE_GROUPS, findScaleOption } from '@/lib/scale-groups'

interface ScaleAssignment {
  id: string
  patient_id: string | null
  guest_id?: string | null
  scale_type: string
  status: string
  assigned_at: string
  patient_name?: string
}

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
      .select('id, patient_id, guest_id, scale_type, status, assigned_at')
      .order('assigned_at', { ascending: false })
      .limit(100)
    if (error || !data) return []

    const patientIds = new Set(
      (data as { patient_id?: string | null }[])
        .map((a) => a.patient_id)
        .filter((v): v is string => !!v),
    )
    const guestIds = new Set(
      (data as { guest_id?: string | null }[])
        .map((a) => a.guest_id)
        .filter((v): v is string => !!v),
    )
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
    if (guestIds.size) {
      // Buscar nomes via guests (guest_id) — patients assigned without an auth profile
      const { data: guests } = await supabase
        .from('guests')
        .select('id, first_name, last_name')
        .in('id', [...guestIds])
      ;(guests || []).forEach((g) => {
        patientMap[g.id] = `${g.first_name} ${g.last_name}`.trim() || 'Paciente'
      })
    }
    return data.map((a) => ({
      id: a.id,
      patient_id: a.patient_id,
      guest_id: a.guest_id ?? null,
      scale_type: a.scale_type,
      status: a.status,
      assigned_at: a.assigned_at,
      patient_name: patientMap[a.patient_id || ''] || patientMap[a.guest_id || ''] || 'Paciente',
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

    // Prefer linking to the auth profile when it exists; otherwise fall back to
    // the guest_id so the public patient flow (/minhas-escalas) can still see
    // the assigned scales without the patient ever logging in.
    const rows = selectedScales.map((scale_type) => ({
      patient_id: profile?.id ?? null,
      guest_id: patient.id,
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
                      (a) => (a.patient_id || a.guest_id) === p.id && a.status === 'pending',
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

      <CalmExplorerQRCard size={200} compact title="Explorador da Calma — QR Code" />

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
                      <TableCell className="text-sm text-white/80">
                        {findScaleOption(a.scale_type)?.label ?? a.scale_type}
                      </TableCell>
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
          <div className="space-y-4 py-2 max-h-96 overflow-y-auto pr-1">
            {Object.entries(SCALE_GROUPS).map(([pathology, scales]) => (
              <div key={pathology} className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#00FFFF]/80 px-1">
                  {pathology}
                </p>
                {scales.map((scale) => (
                  <label
                    key={scale.label}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer border border-transparent hover:border-[#00FFFF]/20 transition-colors"
                  >
                    <Checkbox
                      checked={selectedScales.includes(scale.label)}
                      onCheckedChange={() => toggleScale(scale.label)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white">{scale.label}</span>
                        <span className="text-[10px] text-white/50 bg-white/5 px-1.5 py-0.5 rounded">
                          {scale.time}
                        </span>
                      </div>
                      <p className="text-xs text-white/70 mt-0.5">{scale.name}</p>
                    </div>
                  </label>
                ))}
              </div>
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
