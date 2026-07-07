import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Camera, SkipForward, Loader2, Check, ArrowLeft } from 'lucide-react'

export default function CaptureChoice() {
  const navigate = useNavigate()
  const [selecting, setSelecting] = useState<string | null>(null)
  const [cameraGranted, setCameraGranted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCamera = async () => {
    setSelecting('camera')
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach((t) => t.stop())
      setCameraGranted(true)
      localStorage.setItem('neuroflow_capture_method', 'camera_rppg')
      setTimeout(() => navigate('/avaliacao'), 800)
    } catch {
      setError('Não foi possível acessar a câmera. Você pode continuar no modo simulação.')
      localStorage.setItem('neuroflow_capture_method', 'simulation')
      setTimeout(() => navigate('/avaliacao'), 1500)
    }
  }

  const handleSkip = () => {
    setSelecting('skip')
    localStorage.setItem('neuroflow_capture_method', 'simulation')
    setTimeout(() => navigate('/avaliacao'), 500)
  }

  return (
    <div className="min-h-screen bg-[#0A192F] text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#00FFFF]/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-md w-full">
        <Link
          to="/welcome"
          className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-[#00FFFF] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <h1 className="text-2xl font-bold mb-2">Escolha seu método</h1>
        <p className="text-white/60 text-sm mb-8">
          Como você gostaria de monitorar seus batimentos durante a sessão?
        </p>

        <div className="space-y-4">
          <button
            onClick={handleCamera}
            disabled={!!selecting}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border transition-all duration-200 text-left bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#00FFFF]/30 disabled:opacity-50"
          >
            <div className="h-14 w-14 rounded-xl bg-[#00FFFF]/10 flex items-center justify-center shrink-0">
              {selecting === 'camera' && !cameraGranted ? (
                <Loader2 className="h-7 w-7 text-[#00FFFF] animate-spin" />
              ) : cameraGranted ? (
                <Check className="h-7 w-7 text-[#00FFFF]" />
              ) : (
                <Camera className="h-7 w-7 text-[#00FFFF]" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Usar Câmera</h3>
              <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
                Detecta batimentos via análise facial. Recomendado para melhor experiência.
              </p>
            </div>
          </button>

          <button
            onClick={handleSkip}
            disabled={!!selecting}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border transition-all duration-200 text-left bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#00FFFF]/30 disabled:opacity-50"
          >
            <div className="h-14 w-14 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              {selecting === 'skip' ? (
                <Loader2 className="h-7 w-7 text-white/60 animate-spin" />
              ) : (
                <SkipForward className="h-7 w-7 text-white/60" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Pular por enquanto</h3>
              <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
                Continue no modo simulação. Você pode habilitar a câmera depois.
              </p>
            </div>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
