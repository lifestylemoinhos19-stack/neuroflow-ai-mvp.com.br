import { TmtAssessment } from '@/components/TmtAssessment'

export default function TmtPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Trail Making Test (TMT A/B)</h1>
        <p className="text-sm text-white/75 mt-1">
          Avaliação de atenção visual sustentada, velocidade psicomotora e alternância executiva
        </p>
      </div>
      <TmtAssessment />
    </div>
  )
}
