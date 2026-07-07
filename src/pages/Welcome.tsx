import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Brain, ArrowRight, Shield, Heart, Zap } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

const features = [
  { icon: Zap, text: 'Biofeedback em tempo real' },
  { icon: Shield, text: '100% privado e seguro' },
  { icon: Heart, text: 'Sem cadastro necessário' },
]

export default function Welcome() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-[#0A192F] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#00FFFF]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-[#00FFFF]/5 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-8 animate-fade-in-down">
          <div className="absolute inset-0 bg-[#00FFFF]/20 rounded-full blur-2xl" />
          <div className="relative h-32 w-32 rounded-full bg-gradient-to-br from-[#00FFFF]/20 to-[#00FFFF]/5 border border-[#00FFFF]/30 flex items-center justify-center animate-float">
            <Brain className="h-16 w-16 text-[#00FFFF]" />
          </div>
        </div>

        <div className="text-center animate-fade-in-up">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Neuro<span className="text-[#00FFFF]">Flow</span> AI
          </h1>
          <p className="text-white/60 mt-3 text-sm sm:text-base max-w-md mx-auto">
            Treine seu foco. Transforme sua mente. Experimente o poder do biofeedback neural em
            tempo real.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10 max-w-xl w-full animate-fade-in-up">
          {features.map((f, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#00FFFF]/10 bg-white/5 p-4 text-center"
            >
              <f.icon className="h-5 w-5 text-[#00FFFF] mx-auto mb-2" />
              <p className="text-xs text-white/70">{f.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 animate-fade-in-up">
          <Button
            onClick={() => navigate('/capture-choice')}
            size="lg"
            className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-semibold rounded-full px-8 shadow-lg shadow-[#00FFFF]/20"
          >
            Começar Agora <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className="text-sm text-white/50 hover:text-[#00FFFF] transition-colors"
            >
              Ir para o painel →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
