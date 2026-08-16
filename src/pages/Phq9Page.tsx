import { Phq9Assessment } from '@/components/Phq9Assessment'

export default function Phq9Page() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Avaliação PHQ-9</h1>
        <p className="text-sm text-white/75 mt-1">
          Patient Health Questionnaire-9 — Triagem de Depressão
        </p>
      </div>
      <Phq9Assessment />
    </div>
  )
}
