import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Brain, AlertCircle, History as HistoryIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getAllSessions, type AdminSession } from '@/services/admin'
import { InterpretationEditor } from '@/components/InterpretationEditor'
import { PatientHistoryDashboard } from '@/components/PatientHistoryDashboard'

export function AdminInterpretationWorkspace() {
  const [searchParams] = useSearchParams()
  const [sessions, setSessions] = useState<AdminSession[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllSessions(30).then((data) => {
      setSessions(data)
      setLoading(false)
      const paramSession = searchParams.get('session')
      if (paramSession && data.some((s) => s.id === paramSession)) {
        setSelectedId(paramSession)
      } else if (data.length > 0) {
        setSelectedId(data[0].id)
      }
    })
  }, [searchParams])

  return (
    <Card className="border-slate-200 shadow-subtle">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-white">
          <Brain className="h-5 w-5 text-primary" />
          Interpretação Contextual Clínica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 text-xs">
            Sistema de triagem clínica baseado em múltiplas escalas (ASSQ, SNAP-IV, ASRS-18, MoCA,
            MEEM, PHQ-9, GAD-7, HAM-D, HAM-A) com integração cognitiva. As sugestões são geradas por
            lógica contextual, não modelos genéricos.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="interpretation" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="interpretation">
              <Brain className="h-3.5 w-3.5 mr-1.5" />
              Interpretação
            </TabsTrigger>
            <TabsTrigger value="history">
              <HistoryIcon className="h-3.5 w-3.5 mr-1.5" />
              Histórico do Paciente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="interpretation" className="space-y-4 mt-4">
            {loading ? (
              <p className="text-sm text-slate-200">Carregando sessões...</p>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-slate-200">Nenhuma sessão encontrada.</p>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Selecionar Sessão</label>
                  <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha uma sessão" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {new Date(s.started_at).toLocaleDateString('pt-BR')} — {s.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedId && <InterpretationEditor sessionId={selectedId} />}
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <PatientHistoryDashboard />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
