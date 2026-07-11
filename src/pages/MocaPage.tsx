import { MocaAssessment } from '@/components/MocaAssessment'

export default function MocaPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Montreal Cognitive Assessment (MoCA)</h1>
        <p className="text-sm text-white/50 mt-1">Triagem cognitiva geral — 30 pontos</p>
      </div>
      <MocaAssessment />
    </div>
  )
}
