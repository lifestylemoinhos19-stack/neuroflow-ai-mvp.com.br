import { FasAssessment } from '@/components/FasAssessment'

export default function FasPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Teste de Fluência Verbal FAS</h1>
        <p className="text-sm text-white/50 mt-1">
          Avaliação de função executiva frontal e fluência verbal
        </p>
      </div>
      <FasAssessment />
    </div>
  )
}
