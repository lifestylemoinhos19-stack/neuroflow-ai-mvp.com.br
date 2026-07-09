import { YbocsAssessment } from '@/components/YbocsAssessment'

export default function YbocsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Yale-Brown Obsessive-Compulsive Scale (Y-BOCS)
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Avaliação da gravidade de sintomas obsessivo-compulsivos
        </p>
      </div>
      <YbocsAssessment />
    </div>
  )
}
