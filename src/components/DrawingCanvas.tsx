import { useRef, useState, useEffect, useCallback } from 'react'
import { RotateCcw, PenTool, Eraser, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DrawingCanvasProps {
  /** Rótulo ou título do desenho (ex: "Desenhe um relógio marcando 11:10") */
  title?: string
  /** Descrição ou instrução adicional */
  instruction?: string
  /** Modelo de referência visual SVG/Imagem opcional (ex: polígonos sobrepostos ou cubo) */
  referenceTemplate?: 'polygons' | 'cube' | 'trail' | 'clock' | null
  /** Valor inicial em DataURL se houver */
  initialValue?: string | null
  /** Callback quando o desenho é alterado/salvo */
  onChange?: (dataUrl: string) => void
  /** Altura do canvas em pixels (default: 260) */
  height?: number
  /** Se o componente deve ser somente leitura */
  readOnly?: boolean
}

export function DrawingCanvas({
  title = 'Área de Desenho Livre',
  instruction = 'Use o dedo ou o mouse para desenhar diretamente no quadro abaixo:',
  referenceTemplate,
  initialValue,
  onChange,
  height = 260,
  readOnly = false,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [mode, setMode] = useState<'pen' | 'eraser'>('pen')
  const [hasDrawn, setHasDrawn] = useState(false)
  const [lineWidth, setLineWidth] = useState(3)

  // Inicializa o canvas com fundo branco/escuro limpo
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Ajusta resolução para telas retina
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    // Preenche com fundo branco para contraste limpo de desenho
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, rect.width, height)

    // Se houver imagem inicial salva, desenha
    if (initialValue) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, height)
        setHasDrawn(true)
      }
      img.src = initialValue
    }
  }, [height, initialValue])

  useEffect(() => {
    initCanvas()
    const handleResize = () => {
      // re-renderiza se redimensionar
      initCanvas()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [initCanvas])

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    } else if ('clientX' in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }
    return { x: 0, y: 0 }
  }

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (readOnly) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    setHasDrawn(true)
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = mode === 'eraser' ? 16 : lineWidth
    ctx.strokeStyle = mode === 'eraser' ? '#FFFFFF' : '#0A192F'
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Previne scroll na tela touch enquanto desenha
    if ('touches' in e) {
      e.preventDefault()
    }

    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing || readOnly) return
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.closePath()

    if (onChange) {
      try {
        const dataUrl = canvas.toDataURL('image/png')
        onChange(dataUrl)
      } catch {
        /* noop */
      }
    }
  }

  const clearCanvas = () => {
    if (readOnly) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, rect.width, height)
    setHasDrawn(false)
    if (onChange) {
      onChange('')
    }
  }

  return (
    <div className="space-y-2 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <PenTool className="h-4 w-4 text-[#00FFFF]" />
            {title}
          </h4>
          <p className="text-xs text-white/70">{instruction}</p>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <Button
              type="button"
              size="sm"
              variant={mode === 'pen' ? 'default' : 'outline'}
              onClick={() => setMode('pen')}
              className={cn(
                'h-7 px-2 text-xs',
                mode === 'pen'
                  ? 'bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-semibold'
                  : 'border-white/20 text-white hover:bg-white/10',
              )}
            >
              <PenTool className="h-3 w-3 mr-1" /> Caneta
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === 'eraser' ? 'default' : 'outline'}
              onClick={() => setMode('eraser')}
              className={cn(
                'h-7 px-2 text-xs',
                mode === 'eraser'
                  ? 'bg-amber-400 text-[#0A192F] hover:bg-amber-300 font-semibold'
                  : 'border-white/20 text-white hover:bg-white/10',
              )}
            >
              <Eraser className="h-3 w-3 mr-1" /> Borracha
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={clearCanvas}
              className="h-7 px-2 text-xs border-red-500/40 text-red-300 hover:bg-red-500/10"
              title="Limpar desenho"
            >
              <RotateCcw className="h-3 w-3 mr-1" /> Limpar
            </Button>
          </div>
        )}
      </div>

      {/* Modelo de referência opcional para cópia */}
      {referenceTemplate && (
        <div className="p-3 rounded-lg border border-[#00FFFF]/20 bg-[#00FFFF]/5 flex flex-col sm:flex-row items-center gap-3">
          <span className="text-xs font-semibold text-[#00FFFF] uppercase tracking-wider shrink-0">
            Modelo para cópia:
          </span>
          <div className="flex items-center justify-center p-2 rounded bg-white/10 border border-white/10">
            {referenceTemplate === 'polygons' && (
              <svg
                width="120"
                height="70"
                viewBox="0 0 120 70"
                className="stroke-white fill-none stroke-2"
              >
                {/* Dois pentágonos entrelaçados (MEEM) */}
                <polygon points="30,5 55,25 45,55 15,55 5,25" />
                <polygon points="65,20 90,40 80,70 50,70 40,40" />
              </svg>
            )}
            {referenceTemplate === 'cube' && (
              <svg
                width="100"
                height="70"
                viewBox="0 0 100 70"
                className="stroke-white fill-none stroke-2"
              >
                {/* Cubo em perspectiva isométrica (MoCA) */}
                <rect x="15" y="25" width="40" height="40" />
                <rect x="35" y="10" width="40" height="40" />
                <line x1="15" y1="25" x2="35" y2="10" />
                <line x1="55" y1="25" x2="75" y2="10" />
                <line x1="15" y1="65" x2="35" y2="50" />
                <line x1="55" y1="65" x2="75" y2="50" />
              </svg>
            )}
            {referenceTemplate === 'clock' && (
              <div className="text-xs text-white/90 text-center px-2">
                <span className="text-emerald-400 font-bold block text-sm">11:10</span>
                <span>
                  (Coloque os números 1 a 12 e ponteiros marcando onze horas e dez minutos)
                </span>
              </div>
            )}
            {referenceTemplate === 'trail' && (
              <div className="text-xs text-white/90 text-center px-2 font-mono">
                <span className="text-[#00FFFF] font-bold">
                  1 &rarr; A &rarr; 2 &rarr; B &rarr; 3 &rarr; C ...
                </span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-white/70 italic">
            Copie ou execute o desenho no quadro branco logo abaixo.
          </p>
        </div>
      )}

      {/* Área do Canvas */}
      <div className="relative rounded-xl overflow-hidden border-2 border-white/20 shadow-inner bg-white">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ height: `${height}px`, width: '100%', touchAction: 'none' }}
          className="cursor-crosshair block w-full"
        />
        {!hasDrawn && !readOnly && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <span className="text-slate-400 text-xs sm:text-sm font-medium select-none bg-white/80 px-3 py-1 rounded-full border border-slate-200">
              Desenhe aqui com o dedo ou mouse
            </span>
          </div>
        )}
      </div>

      {hasDrawn && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
          <Check className="h-3.5 w-3.5" /> Desenho capturado na tela e pronto para a pontuação
        </div>
      )}
    </div>
  )
}
