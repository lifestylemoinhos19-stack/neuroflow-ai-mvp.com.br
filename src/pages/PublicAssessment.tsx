import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PublicPageShell } from '@/components/PublicPageShell'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Stethoscope, Brain, ArrowRight, Lock, ShieldCheck } from 'lucide-react'
import { PublicSnapIV } from '@/components/PublicSnapIV'
import { PublicAssq } from '@/components/PublicAssq'
import { PublicCbcl } from '@/components/PublicCbcl'
import { InformedConsent } from '@/components/InformedConsent'
import { AssessmentDevolutiva } from '@/components/AssessmentDevolutiva'
import { cn } from '@/lib/utils'
import { interpretSnapIV, interpretASSQ } from '@/lib/assessment-data'
import { interpretCBCL } from '@/lib/cbcl-data'

type ScaleType = 'snap-iv' | 'assq' | 'cbcl'

export default function PublicAssessment() {
  const [consented, setConsented] = useState(false)
  const [started, setStarted] = useState(false)
  const [devolutiva, setDevolutiva] = useState<{
    scale: ScaleType
    result: Record<string, unknown>
  } | null>(null)
  const { scale } = useParams<{ scale?: string }>()
  const navigate = useNavigate()
  const defaultTab: ScaleType = scale === 'assq' ? 'assq' : scale === 'cbcl' ? 'cbcl' : 'snap-iv'

  useEffect(() => {
    if (scale === 'snapiv' || scale === 'assq' || scale === 'cbcl') {
      setStarted(true)
    }
  }, [scale])

  const handleDevolutiva = (scaleType: ScaleType) => {
    try {
      const draft = localStorage.getItem('neuroflow_avaliacao_resultados')
      const parsed = draft ? JSON.parse(draft) : {}
      let result: Record<string, unknown> = {}
      if (scaleType === 'snap-iv' && parsed.snap?.answers) {
        result = interpretSnapIV(parsed.snap.answers) as unknown as Record<string, unknown>
      } else if (scaleType === 'assq' && parsed.assq?.answers) {
        result = interpretASSQ(
          parsed.assq.answers,
          parsed.assq.gender || 'boy',
        ) as unknown as Record<string, unknown>
      } else if (scaleType === 'cbcl' && parsed.cbcl?.answers) {
        result = interpretCBCL(parsed.cbcl.answers) as unknown as Record<string, unknown>
      }
      setDevolutiva({ scale: scaleType, result })
    } catch {
      /* ignore */
    }
  }

  if (devolutiva) {
    return (
      <AssessmentDevolutiva
        scaleType={devolutiva.scale}
        result={devolutiva.result}
        onBack={() => setDevolutiva(null)}
      />
    )
  }

  if (!consented) {
    return (
      <InformedConsent
        onAccept={() => {
          setConsented(true)
          setStarted(true)
        }}
      />
    )
  }

  if (!started) {
    return (
      <PublicPageShell>
        <div className="max-w-2xl mx-auto text-center space-y-6 py-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00FFFF]/10 border border-[#00FFFF]/20 mb-2">
            <Stethoscope className="h-8 w-8 text-[#00FFFF]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">NeuroFlow AI</h1>
          <p className="text-[#00FFFF]/80 text-sm sm:text-base font-medium max-w-md mx-auto">
            Avaliação carinhosa para entender melhor o seu filho
          </p>
          <p className="text-white/60 text-xs sm:text-sm max-w-md mx-auto mt-1">
            Escalas clínicas de triagem para neurodesenvolvimento. Responda no conforto da sua casa,
            sem necessidade de cadastro ou sensores.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center text-xs text-white/50">
            <div className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-[#00FFFF]" />
              <span>Sem login necessário</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#00FFFF]" />
              <span>Dados protegidos (LGPD)</span>
            </div>
          </div>
          <Button
            onClick={() => setStarted(true)}
            size="lg"
            className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-semibold"
          >
            Iniciar Avaliação <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <div className="rounded-xl border border-[#00FFFF]/20 bg-[#00FFFF]/5 p-4 text-left max-w-md mx-auto">
            <div className="flex items-start gap-2">
              <Brain className="h-4 w-4 text-[#00FFFF] shrink-0 mt-0.5" />
              <p className="text-xs text-white/70">
                Esta ferramenta é de <strong className="text-[#00FFFF]">triagem</strong> e não
                substitui uma avaliação médica.
              </p>
            </div>
          </div>
        </div>
      </PublicPageShell>
    )
  }

  return (
    <PublicPageShell>
      <div
        className="min-h-[calc(100vh-8rem)] rounded-2xl p-4 sm:p-6 space-y-5 max-w-[820px] mx-auto"
        style={{ background: 'radial-gradient(ellipse at top, #112240 0%, #0A192F 70%)' }}
      >
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <Stethoscope className="h-6 w-6 text-[#00FFFF]" />
            <h1 className="text-xl sm:text-2xl font-bold text-white">NeuroFlow AI</h1>
          </div>
          <p className="text-[#00FFFF]/80 text-sm font-medium">
            Avaliação carinhosa para entender melhor o seu filho
          </p>
        </div>
        <div className="rounded-xl border border-[#00FFFF]/20 bg-[#00FFFF]/5 p-3 flex items-start gap-2">
          <Brain className="h-4 w-4 text-[#00FFFF] shrink-0 mt-0.5" />
          <p className="text-xs text-white/70">
            Esta ferramenta é de triagem e <strong className="text-[#00FFFF]">não substitui</strong>{' '}
            uma avaliação médica.
          </p>
        </div>
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList
            className={cn('grid w-full grid-cols-3 max-w-lg bg-white/5 border border-white/10')}
          >
            <TabsTrigger
              value="snapiv"
              className="text-white data-[state=active]:bg-[#00FFFF] data-[state=active]:text-[#0A192F] transition-all text-xs sm:text-sm"
            >
              SNAP-IV
            </TabsTrigger>
            <TabsTrigger
              value="assq"
              className="text-white data-[state=active]:bg-[#00FFFF] data-[state=active]:text-[#0A192F] transition-all text-xs sm:text-sm"
            >
              ASSQ
            </TabsTrigger>
            <TabsTrigger
              value="cbcl"
              className="text-white data-[state=active]:bg-[#00FFFF] data-[state=active]:text-[#0A192F] transition-all text-xs sm:text-sm"
            >
              CBCL
            </TabsTrigger>
          </TabsList>
          <TabsContent value="snapiv" className="mt-4">
            <PublicSnapIV onDevolutiva={() => handleDevolutiva('snap-iv')} />
          </TabsContent>
          <TabsContent value="assq" className="mt-4">
            <PublicAssq onDevolutiva={() => handleDevolutiva('assq')} />
          </TabsContent>
          <TabsContent value="cbcl" className="mt-4">
            <PublicCbcl onDevolutiva={() => handleDevolutiva('cbcl')} />
          </TabsContent>
        </Tabs>
        <div className="mt-4 pt-4 border-t border-[#00FFFF]/10 text-center">
          <p className="text-xs text-white/40 italic mb-4">
            Esta avaliação é um apoio educativo e não substitui uma consulta profissional.
          </p>
          <Button
            onClick={() => navigate('/focus-session')}
            className="w-full bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-semibold"
          >
            Ir para Sessão de Foco <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </PublicPageShell>
  )
}
