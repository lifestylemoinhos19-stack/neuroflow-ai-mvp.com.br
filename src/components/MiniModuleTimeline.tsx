import { cn } from '@/lib/utils'
import { MiniSessionResult } from '@/services/mini-evolution'

export function MiniModuleTimeline({ sessions }: { sessions: MiniSessionResult[] }) {
  if (sessions.length === 0) {
    return <p className="text-sm text-slate-500">Nenhuma sessão disponível</p>
  }

  const allModules = sessions[0].moduleResults.map((r) => ({
    key: r.moduleKey,
    label: r.moduleLabel,
  }))

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="text-left p-2 font-medium text-slate-400 whitespace-nowrap min-w-[200px]">
              Módulo
            </th>
            {sessions.map((s, i) => (
              <th key={i} className="p-2 text-center text-xs text-slate-400 whitespace-nowrap">
                <div className="font-medium">Sessão {i + 1}</div>
                <div className="text-slate-500">{s.dateLabel}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allModules.map((module) => (
            <tr
              key={module.key}
              className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
            >
              <td className="p-2 whitespace-nowrap">
                <span className="font-medium text-cyan-300">{module.key}</span>
                <span className="text-slate-400 ml-2 text-xs">{module.label}</span>
              </td>
              {sessions.map((s, i) => {
                const result = s.moduleResults.find((r) => r.moduleKey === module.key)
                const isPositive = result?.result === 'Positive'
                return (
                  <td key={i} className="p-2 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-transform hover:scale-110',
                        isPositive
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-800/50 text-slate-600 border border-slate-700/50',
                      )}
                    >
                      {isPositive ? '+' : '−'}
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
