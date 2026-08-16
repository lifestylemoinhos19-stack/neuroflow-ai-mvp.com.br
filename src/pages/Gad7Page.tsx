import { Gad7Assessment } from '@/components/Gad7Assessment'

export default function Gad7Page() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Avaliação GAD-7</h1>
        <p className="text-sm text-white/75 mt-1">
          Generalized Anxiety Disorder 7-item Scale — Triagem de Ansiedade
        </p>
      </div>
      <Gad7Assessment />
    </div>
  )
}
