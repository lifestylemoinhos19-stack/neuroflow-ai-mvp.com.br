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
import { Brain, AlertCircle } from 'lucide-react'
import { getAllSessions, type AdminSession } from '@/services/admin'
import { InterpretationEditor } from '@/components/InterpretationEditor'

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
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-primary" />
          Interpretação Contextual Clínica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 text-xs">
            Sistema de interpretação baseado em escalas PHQ-9 e GAD-7 com integração cognitiva. As
            sugestões são geradas por lógica contextual, não modelos genéricos.
          </AlertDescription>
        </Alert>

        {loading ? (
          <p className="text-sm text-slate-400">Carregando sessões...</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma sessão encontrada.</p>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Selecionar Sessão</label>
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
      </CardContent>
    </Card>
  )
}
