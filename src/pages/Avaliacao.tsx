import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Stethoscope, Brain } from 'lucide-react'
import { SnapIVAssessment } from '@/components/SnapIVAssessment'
import { AssqAssessment } from '@/components/AssqAssessment'
import { cn } from '@/lib/utils'

export default function Avaliacao() {
  return (
    <div
      className="min-h-[calc(100vh-8rem)] rounded-2xl p-4 sm:p-6 space-y-5 max-w-[820px] mx-auto"
      style={{
        background: 'radial-gradient(ellipse at top, #112240 0%, #0A192F 70%)',
      }}
    >
      <div className="text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
          <Stethoscope className="h-6 w-6 text-[#00FFFF]" />
          <h1 className="text-xl sm:text-2xl font-bold text-white">Hub de Avaliação</h1>
        </div>
        <p className="text-white/50 text-sm">
          Escalas clínicas especializadas para triagem de neurodesenvolvimento.
        </p>
      </div>

      <div className="rounded-xl border border-[#00FFFF]/20 bg-[#00FFFF]/5 p-3 flex items-start gap-2">
        <Brain className="h-4 w-4 text-[#00FFFF] shrink-0 mt-0.5" />
        <p className="text-xs text-white/70">
          Esta ferramenta é de triagem e <strong className="text-[#00FFFF]">não substitui</strong>{' '}
          uma avaliação médica. Resultados são salvos permanentemente no prontuário.
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
          <SnapIVAssessment />
        </TabsContent>
        <TabsContent value="assq" className="mt-4">
          <AssqAssessment />
        </TabsContent>
      </Tabs>
    </div>
  )
}
