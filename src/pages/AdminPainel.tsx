import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Trash2, Users, FlaskConical, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import {
  getAdminPatients,
  getAdminTests,
  deletePatientData,
  deleteTestData,
  type AdminPatient,
  type AdminTest,
} from '@/services/admin-painel'

export default function AdminPainel() {
  const { isAdmin } = useAuth()
  const [patients, setPatients] = useState<AdminPatient[]>([])
  const [tests, setTests] = useState<AdminTest[]>([])
  const [loading, setLoading] = useState(true)
  const [patientToDelete, setPatientToDelete] = useState<AdminPatient | null>(null)
  const [testToDelete, setTestToDelete] = useState<AdminTest | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [p, t] = await Promise.all([getAdminPatients(), getAdminTests()])
    setPatients(p)
    setTests(t)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isAdmin) {
      loadData()
    } else {
      setLoading(false)
    }
  }, [isAdmin, loadData])

  const handleDeletePatient = async () => {
    if (!patientToDelete) return
    setDeleting(true)
    const { error } = await deletePatientData(patientToDelete.user_id)
    setDeleting(false)
    if (error) {
      toast.error(`Erro ao excluir paciente: ${error}`)
    } else {
      toast.success('Paciente e dados associados excluídos com sucesso.')
      setPatientToDelete(null)
      loadData()
    }
  }

  const handleDeleteTest = async () => {
    if (!testToDelete) return
    setDeleting(true)
    const { error } = await deleteTestData(testToDelete.id)
    setDeleting(false)
    if (error) {
      toast.error(`Erro ao excluir teste: ${error}`)
    } else {
      toast.success('Teste excluído com sucesso.')
      setTestToDelete(null)
      loadData()
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShieldAlert className="h-12 w-12 text-red-500" />
        <p className="text-lg font-semibold text-slate-700">Acesso Negado</p>
        <p className="text-sm text-slate-500">Você não tem permissão para acessar esta página.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="h-7 w-7 text-primary" />
          Painel Admin
        </h1>
        <p className="text-slate-500">Gerencie pacientes e testes diretamente do banco de dados.</p>
      </div>

      <Tabs defaultValue="patients">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="patients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Pacientes ({patients.length})
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Testes ({tests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patients">
          <Card className="border-slate-100">
            <CardHeader>
              <CardTitle className="text-base">Pacientes Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              {patients.length === 0 ? (
                <p className="text-center text-slate-400 py-8">Nenhum paciente encontrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead className="text-center">Nº de Testes</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patients.map((patient) => (
                        <TableRow key={patient.user_id}>
                          <TableCell className="font-medium text-slate-700">
                            {patient.full_name}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{patient.evaluation_count}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setPatientToDelete(patient)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
          <Card className="border-slate-100">
            <CardHeader>
              <CardTitle className="text-base">Sessões de Teste</CardTitle>
            </CardHeader>
            <CardContent>
              {tests.length === 0 ? (
                <p className="text-center text-slate-400 py-8">Nenhum teste encontrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tests.map((test) => (
                        <TableRow key={test.id}>
                          <TableCell className="font-medium text-slate-700">{test.type}</TableCell>
                          <TableCell className="text-slate-600">{test.patient_name}</TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                test.origin === 'Mocado'
                                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                              }
                            >
                              {test.origin}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setTestToDelete(test)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

      <AlertDialog
        open={!!patientToDelete}
        onOpenChange={(open) => !open && !deleting && setPatientToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Paciente</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir este paciente removerá também todos os seus testes e laudos. Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button
              onClick={handleDeletePatient}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!testToDelete}
        onOpenChange={(open) => !open && !deleting && setTestToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Teste</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir este teste removerá o resultado e o laudo associado. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button
              onClick={handleDeleteTest}
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
