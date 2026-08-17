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
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
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
  AlertOctagon,
  QrCode,
} from 'lucide-react'
import CalmExplorerQRCard from '@/components/CalmExplorerQRCard'
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
import { deleteAllSessions, deleteMockSessions, deleteAllData } from '@/services/admin'
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

type BulkAction = 'all-sessions' | 'mock-sessions' | 'all-data' | null

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

  // Zona de Perigo — exclusão em massa
  const [bulkAction, setBulkAction] = useState<BulkAction>(null)
  const [bulkConfirmText, setBulkConfirmText] = useState('')
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const BULK_CONFIRM_WORD = 'DELETAR'
  const bulkCanConfirm = bulkConfirmText === BULK_CONFIRM_WORD

  const handleBulkDelete = async () => {
    if (!bulkAction || !bulkCanConfirm) return
    setBulkDeleting(true)
    try {
      if (bulkAction === 'all-sessions') {
        const { error, count } = await deleteAllSessions()
        if (error) toast.error(`Erro: ${error}`)
        else toast.success(`${count} testagem(ns) excluída(s) com sucesso.`)
      } else if (bulkAction === 'mock-sessions') {
        const { error, count } = await deleteMockSessions()
        if (error) toast.error(`Erro: ${error}`)
        else toast.success(`${count} testagem(ns) mocada(s) excluída(s) com sucesso.`)
      } else {
        const { error, sessions, patients } = await deleteAllData()
        if (error) toast.error(`Erro: ${error}`)
        else
          toast.success(
            `Limpeza concluída: ${sessions} testagem(ns) e ${patients} paciente(s) removidos.`,
          )
      }
      setBulkAction(null)
      setBulkConfirmText('')
      loadData()
    } finally {
      setBulkDeleting(false)
    }
  }

  const closeBulkDialog = (open: boolean) => {
    if (!open && !bulkDeleting) {
      setBulkAction(null)
      setBulkConfirmText('')
    }
  }

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
        <TabsList className="grid w-full grid-cols-5 mb-4">
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
          <TabsTrigger value="qr" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" /> QR Code
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
                          <TableCell className="text-xs text-white/85 font-mono">
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

        <TabsContent value="qr">
          <div className="flex justify-center">
            <CalmExplorerQRCard
              size={300}
              title="QR Code do Explorador da Calma"
              description="Gere, imprima ou copie o link do Explorador da Calma para entregar no consultório. Aponta para a rota /focus-session."
            />
          </div>
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

      {/* Zona de Perigo — exclusão em massa */}
      <Card className="border-red-800/50 bg-red-950/30">
        <CardHeader>
          <CardTitle className="text-base font-bold text-red-300 flex items-center gap-2">
            <AlertOctagon className="h-5 w-5" /> Zona de Perigo
          </CardTitle>
          <CardDescription className="text-red-200/80">
            Ações irreversíveis. Ao confirmar, os registros serão permanentemente removidos do banco
            de dados e não poderão ser recuperados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-red-900/40 bg-red-950/40 p-4">
            <div>
              <p className="font-semibold text-white">Excluir TODAS as testagens</p>
              <p className="text-sm text-red-200/80">
                Remove todas as sessões de anamnese, respostas, laudos/feedback e e-mails
                associados.
              </p>
            </div>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white shrink-0"
              onClick={() => setBulkAction('all-sessions')}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Excluir Todas
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-red-900/40 bg-red-950/40 p-4">
            <div>
              <p className="font-semibold text-white">Excluir apenas testagens mocadas</p>
              <p className="text-sm text-red-200/80">
                Remove somente as sessões marcadas como origem "mock" (testes do aplicativo),
                preservando testagens reais.
              </p>
            </div>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white shrink-0"
              onClick={() => setBulkAction('mock-sessions')}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Excluir Mocadas
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-red-900/40 bg-red-950/40 p-4">
            <div>
              <p className="font-semibold text-white">Limpar TODOS os dados</p>
              <p className="text-sm text-red-200/80">
                Remove pacientes, sessões, respostas, feedback, laudos e e-mails. Limpeza completa
                do banco de dados clínico.
              </p>
            </div>
            <Button
              variant="destructive"
              className="bg-red-700 hover:bg-red-800 text-white shrink-0"
              onClick={() => setBulkAction('all-data')}
            >
              <AlertOctagon className="h-4 w-4 mr-1" /> Limpar Tudo
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!bulkAction} onOpenChange={closeBulkDialog}>
        <AlertDialogContent className="border-red-800/60">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-300 flex items-center gap-2">
              <AlertOctagon className="h-5 w-5" /> Confirmação de Exclusão em Massa
            </AlertDialogTitle>
            <AlertDialogDescription className="text-red-200/90">
              Esta ação é irreversível. Todos os registros serão permanentemente removidos.
              {bulkAction === 'all-sessions' &&
                ' Todas as testagens, respostas, laudos e e-mails serão apagados.'}
              {bulkAction === 'mock-sessions' &&
                ' Apenas as testagens mocadas (origem mock) serão apagadas.'}
              {bulkAction === 'all-data' &&
                ' TODOS os pacientes, testagens, laudos e e-mails serão apagados.'}
              <br />
              Para confirmar, digite <strong className="text-white">DELETAR</strong> no campo
              abaixo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-1">
            <Input
              autoFocus
              autoComplete="off"
              value={bulkConfirmText}
              onChange={(e) => setBulkConfirmText(e.target.value)}
              placeholder="Digite DELETAR"
              className="bg-slate-900 border-red-800/60 text-white placeholder:text-slate-500"
              disabled={bulkDeleting}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting} className="border-slate-700 text-slate-200">
              Cancelar
            </AlertDialogCancel>
            <Button
              onClick={handleBulkDelete}
              disabled={!bulkCanConfirm || bulkDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {bulkDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Excluindo...
                </>
              ) : (
                'Confirmar Exclusão'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
