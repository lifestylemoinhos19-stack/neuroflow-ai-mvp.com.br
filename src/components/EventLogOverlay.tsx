import { cn } from '@/lib/utils'
import type { GameEvent } from '@/lib/game-controller'

const eventColors: Record<string, string> = {
  info: 'text-[#00FFFF]',
  warning: 'text-[#FFB347]',
  ok: 'text-[#7FFFD4]',
  error: 'text-red-400',
}

const eventBg: Record<string, string> = {
  info: 'bg-[#00FFFF]/5',
  warning: 'bg-[#FFB347]/5',
  ok: 'bg-[#7FFFD4]/5',
  error: 'bg-red-400/5',
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

export function EventLogOverlay({ events }: { events: GameEvent[] }) {
  return (
    <div className="absolute bottom-4 left-4 z-40 w-64 max-w-[60vw] bg-[#0A192F]/80 backdrop-blur-md rounded-xl border border-[#00FFFF]/10 p-3 max-h-48 overflow-y-auto">
      <div className="text-[10px] font-medium text-[#00FFFF]/60 mb-2 uppercase tracking-wide">
        Log de Eventos
      </div>
      <div className="space-y-1">
        {events.length === 0 ? (
          <div className="text-[10px] text-white/30">Aguardando eventos...</div>
        ) : (
          events.map((e) => (
            <div
              key={e.id}
              className={cn(
                'flex items-start gap-2 rounded px-1.5 py-0.5 animate-fade-in',
                eventBg[e.type],
              )}
            >
              <span className="text-[9px] text-white/30 tabular-nums shrink-0 mt-0.5">
                {formatTime(e.timestamp)}
              </span>
              <span className={cn('text-[10px] leading-tight', eventColors[e.type])}>
                {e.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
