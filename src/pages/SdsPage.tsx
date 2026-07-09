import { SdsAssessment } from '@/components/SdsAssessment'

export default function SdsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Sheehan Disability Scale (SDS)</h1>
        <p className="text-sm text-white/50 mt-1">
          Avaliação de incapacidade funcional com módulo Sherra para o trabalho
        </p>
      </div>
      <SdsAssessment />
    </div>
  )
}
