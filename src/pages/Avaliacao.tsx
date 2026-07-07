import { Stethoscope } from 'lucide-react'
import { PublicPageShell } from '@/components/PublicPageShell'
import { PublicAssessment } from '@/components/PublicAssessment'

export default function Avaliacao() {
  return (
    <PublicPageShell>
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
        <PublicAssessment />
      </div>
    </PublicPageShell>
  )
}
