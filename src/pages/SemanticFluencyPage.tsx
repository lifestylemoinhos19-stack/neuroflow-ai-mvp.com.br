import { SemanticFluencyAssessment } from '@/components/SemanticFluencyAssessment'

export default function SemanticFluencyPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Fluência Verbal por Categorias Semânticas</h1>
        <p className="text-sm text-white/75 mt-1">
          Avaliação de recuperação léxica e memória semântica (Animais e Frutas — 60s cada)
        </p>
      </div>
      <SemanticFluencyAssessment />
    </div>
  )
}
