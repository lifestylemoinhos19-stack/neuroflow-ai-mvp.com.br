import { useState } from 'react'
import { PublicPageShell } from '@/components/PublicPageShell'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Stethoscope, Brain, ArrowRight, Lock, ShieldCheck } from 'lucide-react'
import { PublicSnapIV } from '@/components/PublicSnapIV'
import { PublicAssq } from '@/components/PublicAssq'
import { cn } from '@/lib/utils'

export default function PublicAssessment() {
  const [started, setStarted] = useState(false)

  if (!started) {
    return (
      <PublicPageShell>
        <div className="max-w-2xl mx-auto text-center space-y-6 py-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00FFFF]/10 border border-[#00FFFF]/20 mb-2">
            <Stethoscope className="h-8 w-8 text-[#00FFFF]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Hub de Autoavaliação</h1>
          <p className="text-white/60 text-sm sm:text-base max-w-md mx-auto">
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
              <span>Dados ficam no seu dispositivo</span>
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
                substitui uma avaliação médica. Os resultados são salvos apenas localmente no seu
                navegador.
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
            <h1 className="text-xl sm:text-2xl font-bold text-white">Hub de Autoavaliação</h1>
          </div>
          <p className="text-white/50 text-sm">
            Escalas clínicas especializadas para triagem de neurodesenvolvimento.
          </p>
        </div>
        <div className="rounded-xl border border-[#00FFFF]/20 bg-[#00FFFF]/5 p-3 flex items-start gap-2">
          <Brain className="h-4 w-4 text-[#00FFFF] shrink-0 mt-0.5" />
          <p className="text-xs text-white/70">
            Esta ferramenta é de triagem e <strong className="text-[#00FFFF]">não substitui</strong>{' '}
            uma avaliação médica. Resultados são salvos apenas no seu navegador.
          </p>
        </div>
        <Tabs defaultValue="snapiv" className="w-full">
          <TabsList
            className={cn('grid w-full grid-cols-2 max-w-md bg-white/5 border border-white/10')}
          >
            <TabsTrigger
              value="snapiv"
              className="text-white data-[state=active]:bg-[#00FFFF] data-[state=active]:text-[#0A192F] transition-all"
            >
              SNAP-IV (TDAH)
            </TabsTrigger>
            <TabsTrigger
              value="assq"
              className="text-white data-[state=active]:bg-[#00FFFF] data-[state=active]:text-[#0A192F] transition-all"
            >
              ASSQ (Autismo)
            </TabsTrigger>
          </TabsList>
          <TabsContent value="snapiv" className="mt-4">
            <PublicSnapIV />
          </TabsContent>
          <TabsContent value="assq" className="mt-4">
            <PublicAssq />
          </TabsContent>
        </Tabs>
      </div>
    </PublicPageShell>
  )
}
