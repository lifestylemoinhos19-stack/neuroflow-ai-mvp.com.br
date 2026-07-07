import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Stethoscope, Brain, ArrowRight, ClipboardList } from 'lucide-react'
import { LocalSnapIV } from '@/components/LocalSnapIV'
import { LocalAssq } from '@/components/LocalAssq'

export function PublicAssessment() {
  const [started, setStarted] = useState(false)

  if (!started) {
    return (
      <div className="text-center space-y-6 py-8 animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00FFFF]/10 border border-[#00FFFF]/20">
          <ClipboardList className="h-8 w-8 text-[#00FFFF]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Avaliação de Neurobem-estar</h2>
          <p className="text-white/60 text-sm max-w-md mx-auto">
            Escalas clínicas de triagem para TDAH (SNAP-IV) e Autismo (ASSQ). Autoaplicável, sem
            necessidade de cadastro ou sensores.
          </p>
        </div>
        <div className="rounded-xl border border-[#00FFFF]/20 bg-[#00FFFF]/5 p-3 flex items-start gap-2 max-w-md mx-auto">
          <Brain className="h-4 w-4 text-[#00FFFF] shrink-0 mt-0.5" />
          <p className="text-xs text-white/70 text-left">
            Esta ferramenta é de triagem e <strong className="text-[#00FFFF]">não substitui</strong>{' '}
            uma avaliação médica. Seus dados ficam apenas no seu navegador.
          </p>
        </div>
        <Button
          onClick={() => setStarted(true)}
          className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-semibold px-8 py-2.5"
        >
          Iniciar Avaliação
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    )
  }

  return (
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
        <LocalSnapIV />
      </TabsContent>
      <TabsContent value="assq" className="mt-4">
        <LocalAssq />
      </TabsContent>
    </Tabs>
  )
}
