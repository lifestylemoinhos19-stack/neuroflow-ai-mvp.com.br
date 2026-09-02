import { useState, useRef, useEffect, useCallback } from 'react'
import { CheckCircle2, RotateCcw, AlertTriangle, Play, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface InteractiveTrailProps {
  /**
   * Tipo da trilha:
   * - 'moca': 1 -> A -> 2 -> B -> 3 -> C -> 4 -> D -> 5 -> E
   * - 'tmt_a': 1 -> 2 -> 3 -> ... -> 25
   * - 'tmt_b': 1 -> A -> 2 -> B -> 3 -> C -> ... -> 13 -> L (ou 12-L)
   */
  variant?: 'moca' | 'tmt_a' | 'tmt_b'
  onComplete?: (stats: { timeSeconds: number; errors: number; totalNodes: number }) => void
  onProgress?: (completedCount: number, errorsCount: number) => void
  disabled?: boolean
  autoStart?: boolean
}

interface TrailNode {
  id: string
  label: string
  order: number // 0, 1, 2...
  x: number // percent 0 - 100
  y: number // percent 0 - 100
}

// MoCA: 1 -> A -> 2 -> B -> 3 -> C -> 4 -> D -> 5 -> E (10 nós)
const MOCA_NODES: TrailNode[] = [
  { id: '1', label: '1', order: 0, x: 20, y: 30 },
  { id: 'A', label: 'A', order: 1, x: 45, y: 18 },
  { id: '2', label: '2', order: 2, x: 75, y: 25 },
  { id: 'B', label: 'B', order: 3, x: 80, y: 55 },
  { id: '3', label: '3', order: 4, x: 55, y: 48 },
  { id: 'C', label: 'C', order: 5, x: 30, y: 65 },
  { id: '4', label: '4', order: 6, x: 18, y: 85 },
  { id: 'D', label: 'D', order: 7, x: 50, y: 82 },
  { id: '5', label: '5', order: 8, x: 70, y: 88 },
  { id: 'E', label: 'E', order: 9, x: 88, y: 80 },
]

// TMT Parte A: 1 a 25 distribuídos de forma padronizada
const TMT_A_NODES: TrailNode[] = [
  { id: '1', label: '1', order: 0, x: 48, y: 52 },
  { id: '2', label: '2', order: 1, x: 62, y: 38 },
  { id: '3', label: '3', order: 2, x: 42, y: 28 },
  { id: '4', label: '4', order: 3, x: 26, y: 40 },
  { id: '5', label: '5', order: 4, x: 18, y: 22 },
  { id: '6', label: '6', order: 5, x: 32, y: 14 },
  { id: '7', label: '7', order: 6, x: 56, y: 12 },
  { id: '8', label: '8', order: 7, x: 78, y: 18 },
  { id: '9', label: '9', order: 8, x: 86, y: 35 },
  { id: '10', label: '10', order: 9, x: 74, y: 52 },
  { id: '11', label: '11', order: 10, x: 88, y: 65 },
  { id: '12', label: '12', order: 11, x: 78, y: 82 },
  { id: '13', label: '13', order: 12, x: 60, y: 70 },
  { id: '14', label: '14', order: 13, x: 62, y: 90 },
  { id: '15', label: '15', order: 14, x: 42, y: 86 },
  { id: '16', label: '16', order: 15, x: 32, y: 68 },
  { id: '17', label: '17', order: 16, x: 14, y: 78 },
  { id: '18', label: '18', order: 17, x: 10, y: 56 },
  { id: '19', label: '19', order: 18, x: 24, y: 92 },
  { id: '20', label: '20', order: 19, x: 88, y: 90 },
  { id: '21', label: '21', order: 20, x: 92, y: 15 },
  { id: '22', label: '22', order: 21, x: 8, y: 36 },
  { id: '23', label: '23', order: 22, x: 12, y: 10 },
  { id: '24', label: '24', order: 23, x: 70, y: 28 },
  { id: '25', label: '25', order: 24, x: 48, y: 40 },
]

// TMT Parte B: 1-A-2-B-3-C-4-D-5-E-6-F-7-G-8-H-9-I-10-J-11-K-12-L-13 (25 nós)
const TMT_B_NODES: TrailNode[] = [
  { id: '1', label: '1', order: 0, x: 46, y: 50 },
  { id: 'A', label: 'A', order: 1, x: 64, y: 36 },
  { id: '2', label: '2', order: 2, x: 40, y: 26 },
  { id: 'B', label: 'B', order: 3, x: 24, y: 38 },
  { id: '3', label: '3', order: 4, x: 16, y: 20 },
  { id: 'C', label: 'C', order: 5, x: 34, y: 14 },
  { id: '4', label: '4', order: 6, x: 58, y: 12 },
  { id: 'D', label: 'D', order: 7, x: 80, y: 18 },
  { id: '5', label: '5', order: 8, x: 88, y: 36 },
  { id: 'E', label: 'E', order: 9, x: 72, y: 54 },
  { id: '6', label: '6', order: 10, x: 86, y: 66 },
  { id: 'F', label: 'F', order: 11, x: 76, y: 84 },
  { id: '7', label: '7', order: 12, x: 58, y: 68 },
  { id: 'G', label: 'G', order: 13, x: 60, y: 90 },
  { id: '8', label: '8', order: 14, x: 40, y: 84 },
  { id: 'H', label: 'H', order: 15, x: 30, y: 66 },
  { id: '9', label: '9', order: 16, x: 12, y: 76 },
  { id: 'I', label: 'I', order: 17, x: 10, y: 54 },
  { id: '10', label: '10', order: 18, x: 22, y: 90 },
  { id: 'J', label: 'J', order: 19, x: 86, y: 90 },
  { id: '11', label: '11', order: 20, x: 92, y: 14 },
  { id: 'K', label: 'K', order: 21, x: 8, y: 34 },
  { id: '12', label: '12', order: 22, x: 12, y: 10 },
  { id: 'L', label: 'L', order: 23, x: 68, y: 26 },
  { id: '13', label: '13', order: 24, x: 48, y: 38 },
]

export function InteractiveTrail({
  variant = 'moca',
  onComplete,
  onProgress,
  disabled = false,
  autoStart = false,
}: InteractiveTrailProps) {
  const nodes = variant === 'moca' ? MOCA_NODES : variant === 'tmt_a' ? TMT_A_NODES : TMT_B_NODES

  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [visitedIds, setVisitedIds] = useState<string[]>([])
  const [errors, setErrors] = useState<number>(0)
  const [lastErrorNode, setLastErrorNode] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [isCompleted, setIsCompleted] = useState<boolean>(false)
  const [isRunning, setIsRunning] = useState<boolean>(autoStart)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const startTimeRef = useRef<number | null>(null)

  // Iniciar cronômetro
  const startTrail = useCallback(() => {
    const now = Date.now()
    startTimeRef.current = now
    setCurrentIndex(0)
    setVisitedIds([])
    setErrors(0)
    setLastErrorNode(null)
    setElapsedSeconds(0)
    setIsCompleted(false)
    setIsRunning(true)
    setStartTime(now)
  }, [])

  // Timer ticker absoluto (à prova de drift e touch no mobile)
  useEffect(() => {
    if (isRunning && !isCompleted) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now()
      }
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const secs = Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000))
          setElapsedSeconds(secs)
        }
      }, 250)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRunning, isCompleted])

  // Inicia automaticamente se autoStart = true
  useEffect(() => {
    if (autoStart && !isRunning && !isCompleted && !startTime) {
      startTrail()
    }
  }, [autoStart, isRunning, isCompleted, startTime, startTrail])

  const handleNodeClick = (node: TrailNode) => {
    if (disabled || isCompleted) return

    // Se ainda não começou, inicia com o primeiro clique
    if (!isRunning) {
      const now = Date.now()
      startTimeRef.current = now
      setIsRunning(true)
      setStartTime(now)
    }

    const expectedNode = nodes[currentIndex]

    if (node.order === currentIndex) {
      // Acertou!
      const nextIndex = currentIndex + 1
      const newVisited = [...visitedIds, node.id]
      setVisitedIds(newVisited)
      setCurrentIndex(nextIndex)
      setLastErrorNode(null)

      if (onProgress) {
        onProgress(nextIndex, errors)
      }

      // Concluiu toda a trilha
      if (nextIndex >= nodes.length) {
        setIsCompleted(true)
        setIsRunning(false)
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        const now = Date.now()
        const totalTime = startTimeRef.current
          ? Math.max(1, Math.round((now - startTimeRef.current) / 1000))
          : Math.max(1, elapsedSeconds)
        setElapsedSeconds(totalTime)
        if (onComplete) {
          onComplete({
            timeSeconds: totalTime,
            errors,
            totalNodes: nodes.length,
          })
        }
      }
    } else if (!visitedIds.includes(node.id)) {
      // Clicou no nó errado!
      const newErrors = errors + 1
      setErrors(newErrors)
      setLastErrorNode(node.id)

      if (onProgress) {
        onProgress(currentIndex, newErrors)
      }

      // Efeito de feedback rápido de erro
      setTimeout(() => {
        setLastErrorNode(null)
      }, 900)
    }
  }

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    startTimeRef.current = null
    setCurrentIndex(0)
    setVisitedIds([])
    setErrors(0)
    setLastErrorNode(null)
    setElapsedSeconds(0)
    setIsCompleted(false)
    setIsRunning(false)
    setStartTime(null)
  }

  // Gera linhas SVG conectando os nós já visitados
  const renderConnections = () => {
    if (visitedIds.length < 2) return null

    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {visitedIds.map((id, idx) => {
          if (idx === 0) return null
          const prevId = visitedIds[idx - 1]
          const prevNode = nodes.find((n) => n.id === prevId)
          const currNode = nodes.find((n) => n.id === id)
          if (!prevNode || !currNode) return null

          return (
            <line
              key={`${prevId}-${id}`}
              x1={`${prevNode.x}%`}
              y1={`${prevNode.y}%`}
              x2={`${currNode.x}%`}
              y2={`${currNode.y}%`}
              stroke="#00FFFF"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={variant === 'moca' ? 'none' : 'none'}
              className="transition-all duration-300"
            />
          )
        })}
      </svg>
    )
  }

  const nextTarget = nodes[currentIndex]

  return (
    <div className="w-full space-y-3 select-none">
      {/* Barra de Status e Controles */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900/80 border border-white/10 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 font-mono text-[#00FFFF]">
            <span className="text-white/60">Tempo:</span>
            <span className="text-sm font-bold">{elapsedSeconds}s</span>
          </div>

          <div className="flex items-center gap-1 font-mono">
            <span className="text-white/60">Progresso:</span>
            <span className="text-emerald-400 font-bold">
              {visitedIds.length} / {nodes.length}
            </span>
          </div>

          <div className="flex items-center gap-1 font-mono">
            <span className="text-white/60">Erros:</span>
            <span className={cn('font-bold', errors > 0 ? 'text-rose-400' : 'text-slate-300')}>
              {errors}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isRunning && !isCompleted && (
            <Button
              type="button"
              size="sm"
              onClick={startTrail}
              className="h-7 px-2.5 text-xs bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-semibold"
            >
              <Play className="h-3 w-3 mr-1" /> Começar
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="h-7 px-2 text-xs border-white/20 text-white hover:bg-white/10"
          >
            <RotateCcw className="h-3 w-3 mr-1" /> Reiniciar
          </Button>
        </div>
      </div>

      {/* Instrução dinâmica de próximo alvo */}
      {!isCompleted ? (
        <div className="flex items-center justify-between text-xs px-1 text-white/80">
          <span>
            {variant === 'moca' && (
              <>
                Conecte alternadamente:{' '}
                <strong className="text-[#00FFFF]">1 &rarr; A &rarr; 2 &rarr; B ...</strong>
              </>
            )}
            {variant === 'tmt_a' && (
              <>
                Toque nos números em ordem crescente:{' '}
                <strong className="text-[#00FFFF]">1 &rarr; 2 &rarr; 3 ... 25</strong>
              </>
            )}
            {variant === 'tmt_b' && (
              <>
                Alterne número e letra:{' '}
                <strong className="text-[#00FFFF]">1 &rarr; A &rarr; 2 &rarr; B ... 13</strong>
              </>
            )}
          </span>
          {nextTarget && isRunning && (
            <span className="text-emerald-400 font-semibold animate-pulse">
              Próximo alvo:{' '}
              <strong className="text-white font-mono text-sm underline">{nextTarget.label}</strong>
            </span>
          )}
        </div>
      ) : (
        <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Trilha concluída com sucesso em {elapsedSeconds}{' '}
            segundos!
          </span>
          <span>Erros: {errors}</span>
        </div>
      )}

      {/* Tabuleiro Interativo da Trilha */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[460px] bg-slate-950/90 rounded-2xl border-2 border-[#00FFFF]/30 shadow-2xl overflow-hidden touch-none cursor-pointer"
        style={{
          backgroundImage:
            'radial-gradient(rgba(0,255,255,0.06) 1px, transparent 1px), radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px',
        }}
      >
        {/* Conexões SVG */}
        {renderConnections()}

        {/* Círculos / Nós da trilha */}
        {nodes.map((node) => {
          const isVisited = visitedIds.includes(node.id)
          const isNext = nextTarget && nextTarget.id === node.id && isRunning
          const isError = lastErrorNode === node.id

          // Diferenciação visual para letras e números
          const isLetter = /^[A-Z]$/i.test(node.label)

          return (
            <button
              key={node.id}
              type="button"
              onClick={() => handleNodeClick(node)}
              disabled={disabled || isCompleted}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={cn(
                'absolute z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all duration-200 border-2 select-none shadow-md active:scale-95 cursor-pointer',
                // Visitado
                isVisited &&
                  'bg-[#00FFFF] border-[#00FFFF] text-[#0A192F] shadow-[0_0_14px_rgba(0,255,255,0.7)] ring-2 ring-emerald-400/40',
                // Próximo alvo sugerido ou ativo
                isNext &&
                  !isVisited &&
                  'bg-white text-[#0A192F] border-[#00FFFF] ring-4 ring-[#00FFFF]/50 scale-105 animate-pulse',
                // Erro recente
                isError &&
                  'bg-rose-500 border-rose-300 text-white ring-4 ring-rose-500/60 animate-bounce',
                // Não visitado padrão
                !isVisited &&
                  !isNext &&
                  !isError &&
                  (isLetter
                    ? 'bg-slate-900/90 border-amber-400/60 text-amber-300 hover:border-amber-300 hover:scale-105 hover:bg-slate-800'
                    : 'bg-slate-900/90 border-cyan-400/60 text-cyan-200 hover:border-cyan-300 hover:scale-105 hover:bg-slate-800'),
              )}
            >
              {node.label}
              {isVisited && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border border-slate-900 flex items-center justify-center text-[8px] text-white">
                  ✓
                </span>
              )}
            </button>
          )
        })}

        {/* Overlay quando parado */}
        {!isRunning && !isCompleted && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-4 text-center">
            <Sparkles className="h-10 w-10 text-[#00FFFF] mb-2 animate-bounce" />
            <h4 className="text-white font-bold text-base mb-1">
              Trilha Interativa{' '}
              {variant === 'moca'
                ? 'MoCA'
                : variant === 'tmt_a'
                  ? 'TMT - Parte A'
                  : 'TMT - Parte B'}
            </h4>
            <p className="text-xs text-white/75 max-w-sm mb-4">
              Toque ou clique nos círculos na sequência indicada o mais rápido que puder,
              diretamente na tela.
            </p>
            <Button
              type="button"
              onClick={startTrail}
              className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-bold px-6 text-sm"
            >
              <Play className="h-4 w-4 mr-2" /> Começar Agora
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
