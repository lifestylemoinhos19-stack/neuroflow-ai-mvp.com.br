import { FtdrsAssessment } from '@/components/FtdrsAssessment'

export default function FtdrsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Frontotemporal Dementia Rating Scale (FTDRS)
        </h1>
        <p className="text-sm text-white/75 mt-1">
          Avaliação específica para Demência Frontotemporal
        </p>
      </div>
      <FtdrsAssessment />
    </div>
  )
}
