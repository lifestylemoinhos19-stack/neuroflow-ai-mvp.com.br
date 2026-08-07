import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardCheck, Loader2, Plus, Scale, AlertCircle, RefreshCw } from 'lucide-react'
import { TELEMEDICINE_DISCLAIMER } from '@/lib/clinical-references'
import { MChatR } from '@/components/MChatR'
import { SNAPIV } from '@/components/SNAPIV'
import { CameraStatusPanel } from '@/components/CameraStatusPanel'
import { createAnamnesisSession } from '@/services/anamnesis'
import { fetchScaleQuestions, ScaleQuestions } from '@/services/scales'
import { useOpticalCapture } from '@/hooks/use-optical-capture'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function Scales() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<ScaleQuestions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { cameraStatus, cameraError, requestCamera, retryCamera } = useOpticalCapture('rppg')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const session = await createAnamnesisSession()
      if (session) setSessionId(session.id)
      else toast({ variant: 'destructive', title: 'Aviso', description: 'Sessão não criada.' })
      const data = await fetchScaleQuestions()
      if (!data.mchat.length && !data.snapiv.length) {
        setError('Nenhuma questão encontrada.')
      } else {
        setQuestions(data)
      }
    } catch {
      setError('Não foi possível carregar as questões.')
    }
    setLoading(false)
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleNewSession = async () => {
    setLoading(true)
    const session = await createAnamnesisSession()
    if (session) {
      setSessionId(session.id)
      const data = await fetchScaleQuestions()
      setQuestions(data)
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível iniciar sessão.',
      })
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-[#0A192F] rounded-2xl p-6 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 text-[#00FFFF] animate-spin" />
        <p className="text-white/80 text-sm">Carregando questões...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-[#0A192F] rounded-2xl p-6 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-white text-sm text-center max-w-sm">{error}</p>
        <Button
          onClick={loadData}
          className="bg-[#00FFFF]/10 text-[#00FFFF] border border-[#00FFFF]/30 hover:bg-[#00FFFF]/20"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Tentar Novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[#0A192F] rounded-2xl p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Escalas Clínicas</h1>
          <p className="text-white/80 text-sm">
            Avaliações especializadas para triagem neurológica.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleNewSession}
          className="border-white/20 text-white hover:bg-white/10 rounded-full"
        >
          <Plus className="h-4 w-4 mr-2" /> Nova Sessão
        </Button>
      </div>

      <CameraStatusPanel
        status={cameraStatus}
        error={cameraError}
        onInitialize={() => requestCamera('rppg')}
        onRetry={retryCamera}
      />

      <div className="rounded-xl border border-[#00FFFF]/20 bg-[#00FFFF]/5 p-3 flex items-start gap-2">
        <ClipboardCheck className="h-4 w-4 text-[#00FFFF] shrink-0 mt-0.5" />
        <p className="text-xs text-white/80">
          Cada escala cria uma sessão independente. Responda todas as perguntas e clique em{' '}
          <strong className="text-[#00FFFF]">Salvar & Continuar</strong>.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-start gap-2">
        <Scale className="h-4 w-4 text-[#00FFFF] shrink-0 mt-0.5" />
        <p className="text-xs text-white/80">{TELEMEDICINE_DISCLAIMER.text}</p>
      </div>

      <Tabs defaultValue="mchat" className="w-full">
        <TabsList
          className={cn('grid w-full grid-cols-2 max-w-md bg-white/5 border border-white/10')}
        >
          <TabsTrigger
            value="mchat"
            className="text-white data-[state=active]:bg-[#00FFFF] data-[state=active]:text-[#0A192F]"
          >
            M-CHAT-R
          </TabsTrigger>
          <TabsTrigger
            value="snapiv"
            className="text-white data-[state=active]:bg-[#00FFFF] data-[state=active]:text-[#0A192F]"
          >
            SNAP-IV
          </TabsTrigger>
        </TabsList>
        <TabsContent value="mchat" className="mt-4">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">M-CHAT-R — Triagem para Autismo</CardTitle>
              <CardDescription className="text-white/80">
                Modified Checklist for Autism in Toddlers. 20 questões.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MChatR sessionId={sessionId} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="snapiv" className="mt-4">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">SNAP-IV — Avaliação de TDAH</CardTitle>
              <CardDescription className="text-white/80">
                Swanson, Nolan, and Pelham Rating Scale. 18 questões.
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
