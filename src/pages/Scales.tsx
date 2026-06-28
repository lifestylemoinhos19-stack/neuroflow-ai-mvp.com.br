import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardCheck, Loader2, Plus, Scale } from 'lucide-react'
import { TELEMEDICINE_DISCLAIMER } from '@/lib/clinical-references'
import { MChatR } from '@/components/MChatR'
import { SNAPIV } from '@/components/SNAPIV'
import { createAnamnesisSession } from '@/services/anamnesis'
import { useToast } from '@/hooks/use-toast'

export default function Scales() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    handleNewSession()
  }, [])

  const handleNewSession = async () => {
    setLoading(true)
    const session = await createAnamnesisSession()
    if (session) {
      setSessionId(session.id)
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível iniciar sessão.',
      })
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
            Escalas Clínicas
          </h1>
          <p className="text-slate-500">Avaliações especializadas para triagem neurológica.</p>
        </div>
        <Button
          variant="outline"
          onClick={handleNewSession}
          disabled={loading}
          className="rounded-full"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Nova Sessão
        </Button>
      </div>

      <Card className="shadow-subtle border-slate-100 bg-blue-50">
        <CardContent className="p-4 flex items-start gap-3">
          <ClipboardCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600">
            Cada escala cria uma sessão independente. Responda todas as perguntas e clique em{' '}
            <strong>Salvar & Continuar</strong> para registrar os resultados. As escalas seguem os
            protocolos oficiais M-CHAT-R/F e SNAP-IV.
          </p>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-3 flex items-start gap-2">
          <Scale className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">{TELEMEDICINE_DISCLAIMER.text}</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="mchat" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="mchat">M-CHAT-R (Autismo)</TabsTrigger>
          <TabsTrigger value="snapiv">SNAP-IV (TDAH)</TabsTrigger>
        </TabsList>
        <TabsContent value="mchat" className="mt-4">
          <Card className="shadow-subtle border-slate-100">
            <CardHeader>
              <CardTitle>M-CHAT-R — Triagem para Autismo</CardTitle>
              <CardDescription>
                Modified Checklist for Autism in Toddlers. 20 questões com respostas Sim/Não.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MChatR sessionId={sessionId} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="snapiv" className="mt-4">
          <Card className="shadow-subtle border-slate-100">
            <CardHeader>
              <CardTitle>SNAP-IV — Avaliação de TDAH</CardTitle>
              <CardDescription>
                Swanson, Nolan, and Pelham Rating Scale. 18 questões com escala de 4 pontos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SNAPIV sessionId={sessionId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
