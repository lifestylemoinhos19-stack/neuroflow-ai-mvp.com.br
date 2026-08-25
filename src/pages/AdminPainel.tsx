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
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
  FileDown,
  Headphones,
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  CreditCard,
  User,
  ClipboardList,
  CheckCircle2,
} from 'lucide-react'
import { generateLaudoPDF } from '@/lib/laudo-pdf'
import { normalizeAssistedScaleType } from '@/lib/assisted-scales-data'
import { Link } from 'react-router-dom'
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
  getPatientTests,
  getSessionResponsesDecrypted,
  deleteTestData,
  translateStatus,
  type AdminTest,
  type DecryptedSessionResponse,
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
  paciente: 'Paciente',
}
const ROLE_OPTIONS: ProfileRole[] = ['admin', 'doctor', 'staff', 'paciente']

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

  // Drill-down states
  const [selectedPatient, setSelectedPatient] = useState<AdminPatient | null>(null)
  const [patientTestsList, setPatientTestsList] = useState<AdminTest[]>([])
  const [loadingPatientTests, setLoadingPatientTests] = useState(false)

  const [selectedTest, setSelectedTest] = useState<{
    test: AdminTest
    patientName: string
  } | null>(null)
  const [testResponses, setTestResponses] = useState<DecryptedSessionResponse[]>([])
  const [loadingResponses, setLoadingResponses] = useState(false)
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

  // PDF laudo generation
  const [laudoGenerating, setLaudoGenerating] = useState<string | null>(null)

  const handleGenerateLaudo = async (t: AdminTest) => {
    setLaudoGenerating(t.id)
    try {
      await generateLaudoPDF({
        testId: t.id,
        type: t.type,
        patientName: t.patient_name,
        startedAt: t.started_at,
        status: t.status,
        score: t.score,
        guestId: t.guest_id,
      })
      toast.success('Laudo PDF gerado com sucesso.')
    } catch (e: any) {
      const msg = e?.message || 'Erro ao gerar laudo PDF.'
      toast.error(msg)
      console.error('Erro ao gerar laudo PDF:', e)
    } finally {
      setLaudoGenerating(null)
    }
  }

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

  // Carrega avaliações quando um paciente é selecionado
  const handleSelectPatient = async (patient: AdminPatient) => {
    setSelectedPatient(patient)
    setSelectedTest(null)
    setLoadingPatientTests(true)
    try {
      const pTests = await getPatientTests(patient.id)
      console.log(
        `[handleSelectPatient] Patient ${patient.first_name} ${patient.last_name} (${patient.id}) - pTests count: ${pTests.length}, scale_types:`,
        pTests.map((t) => t.type),
      )
      setPatientTestsList(pTests)
    } catch (err) {
      console.error('Erro ao buscar avaliações do paciente:', err)
      toast.error('Erro ao buscar avaliações do paciente.')
    } finally {
      setLoadingPatientTests(false)
    }
  }

  // Carrega respostas descriptografadas quando um teste é selecionado
  const handleSelectTest = async (test: AdminTest, patientName: string) => {
    setSelectedTest({ test, patientName })
    setLoadingResponses(true)
    setTestResponses([])
    try {
      if (test.session_id) {
        const { data, error } = await getSessionResponsesDecrypted(test.session_id)
        if (error) {
          toast.error(`Erro ao carregar respostas: ${error}`)
        } else {
          setTestResponses(data)
        }
      }
    } catch (err) {
      console.error('Erro ao buscar respostas descriptografadas:', err)
      toast.error('Erro ao buscar respostas da sessão.')
    } finally {
      setLoadingResponses(false)
    }
  }

  const renderProgressIndicator = (t: AdminTest) => {
    if (!t.session_id) {
      return (
        <Badge
          variant="outline"
          className="border-slate-700 text-slate-400 text-xs bg-slate-900/50"
        >
          Sem respostas
        </Badge>
      )
    }

    const typeUpper = (t.type || '').toUpperCase()
    if (typeUpper.includes('MINI 5.0.0') || typeUpper === 'MINI' || typeUpper.includes('MINI 5')) {
      return (
        <Badge
          variant="secondary"
          className="bg-amber-950/70 text-amber-300 border border-amber-800/40 text-xs"
        >
          Entrevista estruturada
        </Badge>
      )
    }

    const expected = t.expected_questions
    const answered = t.response_count ?? 0

    if (expected === null || expected === undefined) {
      return (
        <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
          N/A
        </Badge>
      )
    }

    const percentage = Math.min(100, Math.round((answered / expected) * 100))
    const isComplete = answered >= expected

    return (
      <div className="flex flex-col gap-1 min-w-[110px] max-w-[140px]">
        <div className="flex items-center justify-between text-xs">
          <Badge
            variant="secondary"
            className={
              isComplete
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50 font-medium px-1.5 py-0 text-[11px]'
                : 'bg-amber-950 text-amber-300 border border-amber-800/50 font-medium px-1.5 py-0 text-[11px]'
            }
          >
            {answered}/{expected}
          </Badge>
          <span className="text-[10px] text-white/60 font-mono">{percentage}%</span>
        </div>
        <Progress
          value={percentage}
          className="h-1.5 bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-amber-600 [&>div]:to-emerald-500"
        />
      </div>
    )
  }

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
          {/* NÍVEL 3: VISÃO DE RESPOSTAS DA AVALIAÇÃO SELECIONADA */}
          {selectedTest && selectedPatient ? (
            <Card className="border-slate-800">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTest(null)
                      // Recarrega as avaliações do paciente ao voltar
                      handleSelectPatient(selectedPatient)
                    }}
                    className="border-slate-700 text-slate-200 hover:bg-slate-800"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar para Avaliações
                  </Button>

                  {/* Botão Gerar Laudo PDF com validação e tooltip */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            variant="default"
                            size="sm"
                            disabled={
                              !selectedTest.test.session_id ||
                              loadingResponses ||
                              testResponses.length === 0 ||
                              laudoGenerating === selectedTest.test.id
                            }
                            onClick={() => handleGenerateLaudo(selectedTest.test)}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {laudoGenerating === selectedTest.test.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Gerando PDF...
                              </>
                            ) : (
                              <>
                                <FileDown className="h-4 w-4 mr-1.5" /> Gerar Laudo PDF
                              </>
                            )}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!selectedTest.test.session_id ? (
                        <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200">
                          Sem sessão de respostas vinculada
                        </TooltipContent>
                      ) : !loadingResponses && testResponses.length === 0 ? (
                        <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200">
                          Nenhuma resposta registrada
                        </TooltipContent>
                      ) : null}
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-xs text-white/60 block">Paciente</span>
                    <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                      <User className="h-3.5 w-3.5 text-primary" /> {selectedTest.patientName}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-white/60 block">Escala / Instrumento</span>
                    <span className="text-sm font-bold text-amber-300 flex items-center gap-1.5 mt-0.5">
                      <ClipboardList className="h-3.5 w-3.5 text-amber-400" />{' '}
                      {selectedTest.test.type}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-white/60 block">Data de Aplicação</span>
                    <span className="text-sm text-white/90 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="h-3.5 w-3.5 text-white/60" />{' '}
                      {new Date(selectedTest.test.started_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-white/60 block">Pontuação Total Calculada</span>
                    <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />{' '}
                      {selectedTest.test.score !== null
                        ? `${selectedTest.test.score} pontos`
                        : 'Não calculada'}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">
                    Respostas Registradas ({testResponses.length})
                  </h3>
                  {selectedTest.test.session_id ? (
                    <span className="text-xs text-white/50 font-mono">
                      Sessão: {selectedTest.test.session_id.slice(0, 8)}…
                    </span>
                  ) : null}
                </div>

                {loadingResponses ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-white/70">
                      Carregando e descriptografando respostas...
                    </p>
                  </div>
                ) : !selectedTest.test.session_id ? (
                  <div className="py-10 text-center border border-dashed border-slate-800 rounded-lg p-6">
                    <p className="text-slate-400">Sem respostas vinculadas a esta avaliação.</p>
                  </div>
                ) : testResponses.length === 0 ? (
                  <div className="py-10 text-center border border-dashed border-slate-800 rounded-lg p-6">
                    <p className="text-slate-400">Nenhuma resposta registrada para esta sessão.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-md border border-slate-800">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-800 bg-slate-900/50">
                          <TableHead className="text-white font-semibold w-12 text-center">
                            #
                          </TableHead>
                          <TableHead className="text-white font-semibold">
                            Pergunta / Campo
                          </TableHead>
                          <TableHead className="text-white font-semibold w-1/3">Resposta</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {testResponses.map((r, idx) => (
                          <TableRow
                            key={r.id || idx}
                            className="border-slate-800/60 hover:bg-slate-900/40"
                          >
                            <TableCell className="text-xs font-mono text-white/50 text-center">
                              {idx + 1}
                            </TableCell>
                            <TableCell className="text-sm font-medium text-slate-200">
                              {r.question_label || r.question_key}
                              {r.question_label && (
                                <span className="block text-[11px] font-mono text-white/40 mt-0.5">
                                  {r.question_key}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-amber-300/90 font-medium">
                              {r.response_value !== null && r.response_value !== undefined
                                ? String(r.response_value)
                                : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : selectedPatient ? (
            /* NÍVEL 2: VISÃO DE DETALHE DO PACIENTE COM LISTA DE AVALIAÇÕES */
            <Card className="border-slate-800">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPatient(null)
                      setSelectedTest(null)
                      loadData()
                    }}
                    className="border-slate-700 text-slate-200 hover:bg-slate-800"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar para Lista de Pacientes
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPatientDialog({ open: true, patient: selectedPatient })}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Editar Paciente
                  </Button>
                </div>

                {/* Dados do Paciente */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
                    <User className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold text-white">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-xs text-white/60 flex items-center gap-1">
                        <Mail className="h-3 w-3" /> E-mail
                      </span>
                      <p className="font-medium text-slate-200">{selectedPatient.email || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-white/60 flex items-center gap-1">
                        <Phone className="h-3 w-3" /> Telefone
                      </span>
                      <p className="font-medium text-slate-200">{selectedPatient.phone || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-white/60 flex items-center gap-1">
                        <CreditCard className="h-3 w-3" /> CPF / Documento
                      </span>
                      <p className="font-mono font-medium text-slate-200">
                        {selectedPatient.document || '—'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-white/60 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Data de Nascimento
                      </span>
                      <p className="font-medium text-slate-200">
                        {selectedPatient.birth_date
                          ? new Date(selectedPatient.birth_date).toLocaleDateString('pt-BR')
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" /> Avaliações e Testagens
                  </CardTitle>
                  <Button size="sm" onClick={() => setSessionDialog({ open: true, session: null })}>
                    <Plus className="h-4 w-4 mr-1" /> Nova Testagem
                  </Button>
                </div>

                {loadingPatientTests ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-white/70">Carregando avaliações do paciente...</p>
                  </div>
                ) : patientTestsList.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-slate-800 rounded-lg">
                    <p className="text-white/70">
                      Nenhuma avaliação encontrada para este paciente.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-md border border-slate-800">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-800 bg-slate-900/50">
                          <TableHead className="text-white font-semibold">Tipo da Escala</TableHead>
                          <TableHead className="text-white font-semibold">Data</TableHead>
                          <TableHead className="text-white font-semibold">Status</TableHead>
                          <TableHead className="text-white font-semibold">Progresso</TableHead>
                          <TableHead className="text-white font-semibold text-center">
                            Pontuação
                          </TableHead>
                          <TableHead className="text-white font-semibold text-right">
                            Ações
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patientTestsList.map((t) => (
                          <TableRow
                            key={t.id}
                            className="border-slate-800/60 hover:bg-slate-800/50 cursor-pointer transition-colors"
                            onClick={() =>
                              handleSelectTest(
                                t,
                                `${selectedPatient.first_name} ${selectedPatient.last_name}`,
                              )
                            }
                          >
                            <TableCell className="text-sm font-bold text-white">
                              <div className="flex items-center gap-2">
                                <span className="text-primary hover:underline">{t.type}</span>
                                <Badge
                                  variant="secondary"
                                  className={
                                    t.origin === 'Mocado'
                                      ? 'bg-amber-950 text-amber-300 text-[10px]'
                                      : 'bg-emerald-950 text-emerald-300 text-[10px]'
                                  }
                                >
                                  {t.origin}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-white/80">
                              {new Date(t.started_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </TableCell>
                            <TableCell className="text-sm text-slate-200">
                              <Badge
                                variant="outline"
                                className="border-slate-700 bg-slate-900/60 text-slate-200"
                              >
                                {translateStatus(t.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm" onClick={(e) => e.stopPropagation()}>
                              {renderProgressIndicator(t)}
                            </TableCell>
                            <TableCell className="text-sm text-center font-semibold text-amber-300">
                              {t.score !== null ? t.score : '—'}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-1">
                                {normalizeAssistedScaleType(t.type) && (
                                  <Button
                                    asChild
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-amber-400 hover:text-amber-300 hover:bg-amber-950"
                                    title="Aplicação Assistida (voz)"
                                  >
                                    <Link
                                      to={`/aplicacao-assistida/${encodeURIComponent(t.type)}/${t.id}`}
                                    >
                                      <Headphones className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                )}

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950 disabled:opacity-40"
                                          onClick={() => handleGenerateLaudo(t)}
                                          disabled={
                                            !t.session_id ||
                                            (t.response_count !== undefined &&
                                              t.response_count === 0) ||
                                            laudoGenerating === t.id
                                          }
                                        >
                                          {laudoGenerating === t.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <FileDown className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    {!t.session_id ? (
                                      <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 text-xs">
                                        Sem sessão de respostas vinculada
                                      </TooltipContent>
                                    ) : t.response_count !== undefined && t.response_count === 0 ? (
                                      <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 text-xs">
                                        Nenhuma resposta registrada
                                      </TooltipContent>
                                    ) : (
                                      <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 text-xs">
                                        Gerar Laudo PDF
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                </TooltipProvider>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800"
                                  onClick={() => setSessionDialog({ open: true, session: t })}
                                  title="Editar"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950"
                                  onClick={() =>
                                    setDeleteTarget({ type: 'session', id: t.id, name: t.type })
                                  }
                                  title="Excluir"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            /* NÍVEL 1: LISTA PRINCIPAL DE PACIENTES */
            <Card className="border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base font-bold text-white">
                    Pacientes Cadastrados
                  </CardTitle>
                  <CardDescription className="text-xs text-white/60">
                    Clique em um paciente para ver seus detalhes e histórico de avaliações.
                  </CardDescription>
                </div>
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
                          <TableHead className="text-white font-semibold">CPF</TableHead>
                          <TableHead className="text-white font-semibold">Nascimento</TableHead>
                          <TableHead className="text-white font-semibold text-center">
                            Testes
                          </TableHead>
                          <TableHead className="text-white font-semibold text-right">
                            Ações
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patients.map((p) => (
                          <TableRow
                            key={p.id}
                            className="cursor-pointer hover:bg-slate-800/60 transition-colors group"
                            onClick={() => handleSelectPatient(p)}
                          >
                            <TableCell className="text-sm font-bold text-white group-hover:text-amber-300">
                              <span className="underline decoration-slate-700 group-hover:decoration-amber-400">
                                {p.first_name} {p.last_name}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-white/80">
                              {p.email || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-white/80">
                              {p.phone || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-white/80 font-mono">
                              {p.document || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-white/80">
                              {p.birth_date
                                ? new Date(p.birth_date).toLocaleDateString('pt-BR')
                                : '-'}
                            </TableCell>
                            <TableCell className="text-sm text-center">
                              <Badge variant="secondary" className="bg-slate-800 text-slate-200">
                                {p.evaluation_count}
                              </Badge>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
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
          )}
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
                              extra={
                                <>
                                  {normalizeAssistedScaleType(t.type) && (
                                    <Button
                                      asChild
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-amber-400 hover:text-amber-300 hover:bg-amber-950"
                                      title="Aplicação Assistida (voz)"
                                    >
                                      <Link
                                        to={`/aplicacao-assistida/${encodeURIComponent(t.type)}/${t.id}`}
                                      >
                                        <Headphones className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                  )}
                                  {t.status === 'completed' ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950 disabled:opacity-40"
                                              onClick={() => handleGenerateLaudo(t)}
                                              disabled={!t.session_id || laudoGenerating === t.id}
                                            >
                                              {laudoGenerating === t.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                              ) : (
                                                <FileDown className="h-4 w-4" />
                                              )}
                                            </Button>
                                          </span>
                                        </TooltipTrigger>
                                        {!t.session_id ? (
                                          <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 text-xs">
                                            Sem sessão de respostas vinculada
                                          </TooltipContent>
                                        ) : (
                                          <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 text-xs">
                                            Gerar Laudo PDF
                                          </TooltipContent>
                                        )}
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : undefined}
                                </>
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
                        <TableHead className="text-white font-semibold">E-mail</TableHead>
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
                          <TableCell className="text-sm text-slate-300">{u.email || '—'}</TableCell>
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
