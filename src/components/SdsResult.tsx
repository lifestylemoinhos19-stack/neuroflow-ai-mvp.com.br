import { RotateCcw, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { sdsQuestions, getSdsImpairmentLevel, SDS_DISCLAIMER } from '@/lib/sds-data'

interface SdsResultProps {
  answers: Record<string, number>
  totalSds: number
  totalSherra: number
  daysLost: number
  onReset: () => void
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="text-center py-4 rounded-xl border border-white/10"
      style={{ backgroundColor: 'rgba(17, 34, 64, 0.85)' }}
    >
      <p className="text-4xl font-bold text-[#00FFFF]">{value}</p>
      <p className="text-sm text-white/75 mt-1">{label}</p>
    </div>
  )
}

export function SdsResult({ answers, totalSds, totalSherra, daysLost, onReset }: SdsResultProps) {
  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ScoreCard label="Total SDS (0-30)" value={totalSds} />
        <ScoreCard label="Total Sherra Trabalho (0-30)" value={totalSherra} />
        <ScoreCard label="Dias Perdidos (0-7)" value={daysLost} />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#00FFFF]" /> Detalhamento por questão
        </h3>
        {sdsQuestions.map((q) => {
          const score = answers[q.key] ?? 0
          const level = getSdsImpairmentLevel(score)
          return (
            <div
              key={q.key}
              className="flex items-start justify-between gap-3 p-2.5 rounded-lg border border-white/10"
              style={{ backgroundColor: 'rgba(17, 34, 64, 0.85)' }}
            >
              <div className="flex-1 min-w-0">
                <span className="text-xs text-[#00FFFF] font-medium">{q.label}</span>
                <span className="block text-xs text-white/85 mt-0.5">{q.text}</span>
                <span className="block text-xs mt-0.5" style={{ color: level.color }}>
                  {level.label}
                </span>
              </div>
              <span className="text-lg font-bold text-[#00FFFF] whitespace-nowrap">{score}</span>
            </div>
          )
        })}
      </div>

      <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <p className="text-xs text-yellow-400/80 italic">{SDS_DISCLAIMER}</p>
      </div>

      <Button
        onClick={onReset}
        variant="outline"
        className="w-full border-white/20 text-white hover:bg-white/10"
      >
        <RotateCcw className="h-4 w-4 mr-2" /> Nova avaliação
      </Button>
    </div>
  )
}
