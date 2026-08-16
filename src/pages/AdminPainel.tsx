import { useEffect, useState, useCallback, type ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import {
  Trash2,
  Users,
  FlaskConical,
  FileText,
  ShieldAlert,
  Plus,
  Pencil,
  Eye,
  UserCog,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import { getAdminPatients, deletePatientData, type AdminPatient } from '@/services/admin-painel'
import {
  getAdminTests,
  deleteTestData,
  translateStatus,
  type AdminTest,
} from '@/services/admin-sessions'
import { getAdminReports, deleteReport, type AdminReport } from '@/services/admin-reports'
import {
  getAdminUsers,
  updateUserRole,
  type AdminUserProfile,
  type ProfileRole,
} from '@/services/admin-users'
import { PatientFormDialog } from '@/components/admin/patient-form-dialog'
import { SessionFormDialog } from '@/components/admin/session-form-dialog'
import { ReportFormDialog } from '@/components/admin/report-form-dialog'
import { ReportViewDialog } from '@/components/admin/report-view-dialog'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  doctor: 'Profissional',
  staff: 'Equipe Técnica',
  hospede: 'Paciente',
}
const ROLE_OPTIONS: ProfileRole[] = ['admin', 'doctor', 'staff', 'hospede']

type DeleteTarget = { type: 'patient' | 'session' | 'report'; id: string; name: string } | null

function ActionButtons({
  onEdit,
  onDelete,
  extra,
}: {
  onEdit: () => void
  onDelete: () => void
  extra?: ReactNode
}) {
  return (
    <div className="flex justify-end gap-1">
      {extra}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800"
        onClick={onEdit}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default function AdminPainel() {
  const { isAdmin } = useAuth()
  const [patients, setPatients] = useState<AdminPatient[]>([])
  const [tests, setTests] = useState<AdminTest[]>([])
  const [reports, setReports] = useState<AdminReport[]>([])
  const [users, setUsers] = useState<AdminUserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('patients')
  const [patientDialog, setPatientDialog] = useState<{
    open: boolean
    patient: AdminPatient | null
  }>({ open: false, patient: null })
  const [sessionDialog, setSessionDialog] = useState<{ open: boolean; session: AdminTest | null }>({
    open: false,
    session: null,
  })
  const [reportDialog, setReportDialog] = useState<{ open: boolean; report: AdminReport | null }>({
    open: false,
    report: null,
  })
  const [reportView, setReportView] = useState<AdminReport | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [p, t, r, u] = await Promise.all([
      getAdminPatients(),
      getAdminTests(),
      getAdminReports(),
      getAdminUsers(),
    ])
    setPatients(p)
    setTests(t)
    setReports(r)
    setUsers(u)
    setLoading(false)
  }, [])

  const handleRoleChange = async (profileId: string, newRole: ProfileRole) => {
    setRoleUpdating(profileId)
    const { error } = await updateUserRole(profileId, newRole)
    setRoleUpdating(null)
    if (error) toast.error(`Erro: ${error}`)
    else {
      toast.success(`Perfil alterado para ${ROLE_LABELS[newRole]}.`)
      setUsers((prev) => prev.map((u) => (u.id === profileId ? { ...u, role: newRole } : u)))
    }
  }

  useEffect(() => {
    if (isAdmin) loadData()
    else setLoading(false)
  }, [isAdmin, loadData])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    let error: string | null = null
    if (deleteTarget.type === 'patient') error = (await deletePatientData(deleteTarget.id)).error
    else if (deleteTarget.type === 'session') error = (await deleteTestData(deleteTarget.id)).error
    else error = (await deleteReport(deleteTarget.id)).error
    setDeleting(false)
    if (error) toast.error(`Erro: ${error}`)
    else {
      toast.success('Excluído com sucesso.')
      setDeleteTarget(null)
      loadData()
    }
  }

  if (!isAdmin)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShieldAlert className="h-12 w-12 text-red-400" />
        <p className="text-lg font-bold text-white">Acesso Restrito</p>
        <p className="text-sm text-white/80">Você não tem permissão para acessar esta página.</p>
      </div>
    )

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
          <ShieldAlert className="h-7 w-7 text-primary" /> Painel Admin
        </h1>
        <p className="text-white/80">
          Gerencie pacientes, testagens e laudos diretamente do banco de dados.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="patients" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Pacientes ({patients.length})
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" /> Testagens ({tests.length})
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Laudos ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" /> Usuários ({users.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patients">
          <Card className="border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-bold text-white">
                Pacientes Cadastrados
              </CardTitle>
              <Button size="sm" onClick={() => setPatientDialog({ open: true, patient: null })}>
                <Plus className="h-4 w-4 mr-1" /> Novo
              </Button>
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
                        <TableHead className="text-white font-semibold">Telefone</TableHead>
                        <TableHead className="text-white font-semibold">Nascimento</TableHead>
                        <TableHead className="text-white font-semibold text-center">
                          Testes
                        </TableHead>
                        <TableHead className="text-white font-semibold text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patients.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-sm font-bold text-white">
                            {p.first_name} {p.last_name}
                          </TableCell>
                          <TableCell className="text-sm text-white/80">{p.email || '-'}</TableCell>
                          <TableCell className="text-sm text-white/80">{p.phone || '-'}</TableCell>
                          <TableCell className="text-sm text-white/80">
                            {p.birth_date
                              ? new Date(p.birth_date).toLocaleDateString('pt-BR')
                              : '-'}
                          </TableCell>
                          <TableCell className="text-sm text-center">
                            <Badge variant="secondary">{p.evaluation_count}</Badge>
                          </TableCell>
                          <TableCell>
                            <ActionButtons
                              onEdit={() => setPatientDialog({ open: true, patient: p })}
                              onDelete={() =>
                                setDeleteTarget({
                                  type: 'patient',
                                  id: p.id,
                                  name: `${p.first_name} ${p.last_name}`,
                                })
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests">
          <Card className="border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-bold text-white">Sessões de Teste</CardTitle>
              <Button size="sm" onClick={() => setSessionDialog({ open: true, session: null })}>
                <Plus className="h-4 w-4 mr-1" /> Nova
              </Button>
            </CardHeader>
            <CardContent>
              {tests.length === 0 ? (
                <p className="text-center text-white/80 py-8">Nenhuma testagem encontrada.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-white font-semibold">Tipo</TableHead>
                        <TableHead className="text-white font-semibold">Paciente</TableHead>
                        <TableHead className="text-white font-semibold">Data</TableHead>
                        <TableHead className="text-white font-semibold text-center">
                          Pontuação
                        </TableHead>
                        <TableHead className="text-white font-semibold">Origem</TableHead>
                        <TableHead className="text-white font-semibold">Status</TableHead>
                        <TableHead className="text-white font-semibold text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tests.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="text-sm font-bold text-white">{t.type}</TableCell>
                          <TableCell className="text-sm text-white/80">{t.patient_name}</TableCell>
                          <TableCell className="text-sm text-white/80">
                            {new Date(t.started_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-sm text-center text-white/80">
                            {t.score !== null ? t.score : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                t.origin === 'Mocado'
                                  ? 'bg-amber-950 text-amber-300 hover:bg-amber-950'
                                  : 'bg-emerald-950 text-emerald-300 hover:bg-emerald-950'
                              }
                            >
                              {t.origin}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-200">
                            {translateStatus(t.status)}
                          </TableCell>
                          <TableCell>
                            <ActionButtons
                              onEdit={() => setSessionDialog({ open: true, session: t })}
                              onDelete={() =>
                                setDeleteTarget({ type: 'session', id: t.id, name: t.type })
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-bold text-white">Laudos e Relatórios</CardTitle>
              <Button size="sm" onClick={() => setReportDialog({ open: true, report: null })}>
                <Plus className="h-4 w-4 mr-1" /> Novo
              </Button>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <p className="text-center text-white/80 py-8">Nenhum laudo encontrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-white font-semibold">Tipo</TableHead>
                        <TableHead className="text-white font-semibold">Data</TableHead>
                        <TableHead className="text-white font-semibold min-w-[300px]">
                          Interpretação
                        </TableHead>
                        <TableHead className="text-white font-semibold text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-sm font-bold text-white">
                            {r.session_type}
                          </TableCell>
                          <TableCell className="text-sm text-white/80">
                            {r.session_date
                              ? new Date(r.session_date).toLocaleDateString('pt-BR')
                              : '-'}
                          </TableCell>
                          <TableCell className="text-sm text-white/80 max-w-xl whitespace-normal break-words">
                            {r.admin_edited_interpretation || r.comments || '-'}
                          </TableCell>
                          <TableCell>
                            <ActionButtons
                              onEdit={() => setReportDialog({ open: true, report: r })}
                              onDelete={() =>
                                setDeleteTarget({
                                  type: 'report',
                                  id: r.id,
                                  name: r.session_type,
                                })
                              }
                              extra={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-950"
                                  onClick={() => setReportView(r)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="border-slate-800">
            <CardHeader>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <UserCog className="h-4 w-4" /> Usuários e Permissões
              </CardTitle>
              <CardDescription className="text-white/80">
                Altere o perfil de acesso (role) de cada usuário. O role é sempre lido do Supabase,
                nunca do localStorage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-center text-white/80 py-8">Nenhum usuário encontrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-white font-semibold">Nome</TableHead>
                        <TableHead className="text-white font-semibold">ID</TableHead>
                        <TableHead className="text-white font-semibold">Criado em</TableHead>
                        <TableHead className="text-white font-semibold">Perfil (Role)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="text-sm font-bold text-white">
                            {u.full_name || '—'}
                          </TableCell>
                          <TableCell className="text-xs text-white/60 font-mono">
                            {u.id.slice(0, 8)}…
                          </TableCell>
                          <TableCell className="text-sm text-white/80">
                            {new Date(u.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={u.role}
                              onValueChange={(v) => handleRoleChange(u.id, v as ProfileRole)}
                              disabled={roleUpdating === u.id}
                            >
                              <SelectTrigger className="w-44 bg-slate-900 border-slate-700 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLE_OPTIONS.map((r) => (
                                  <SelectItem key={r} value={r}>
                                    {ROLE_LABELS[r]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PatientFormDialog
        open={patientDialog.open}
        onOpenChange={(o) => setPatientDialog({ open: o, patient: null })}
        patient={patientDialog.patient}
        onSaved={loadData}
      />
      <SessionFormDialog
        open={sessionDialog.open}
        onOpenChange={(o) => setSessionDialog({ open: o, session: null })}
        session={sessionDialog.session}
        patients={patients}
        onSaved={loadData}
      />
      <ReportFormDialog
        open={reportDialog.open}
        onOpenChange={(o) => setReportDialog({ open: o, report: null })}
        report={reportDialog.report}
        sessions={tests}
        onSaved={loadData}
      />
      <ReportViewDialog
        open={!!reportView}
        onOpenChange={(o) => !o && setReportView(null)}
        report={reportView}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && !deleting && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteTarget?.name}"? Esta ação não pode ser desfeita
              e removerá dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
