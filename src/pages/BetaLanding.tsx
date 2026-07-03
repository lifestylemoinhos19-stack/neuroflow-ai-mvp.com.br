import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { CrystalParticles } from '@/components/CrystalParticles'
import { Diamond, Heart, Activity, Sparkles, ArrowRight, Brain, Shield } from 'lucide-react'
import { useState } from 'react'

export default function BetaLanding() {
  const [showParticles, setShowParticles] = useState(true)

  return (
    <div className="min-h-screen bg-[#0A192F] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-medium">
      <CrystalParticles show={showParticles} />

      <div className="absolute inset-0 pointer-events-none opacity-10">
        <Diamond
          className="absolute top-20 left-10 text-[#00FFFF] h-8 w-8 animate-float"
          fill="currentColor"
        />
        <Diamond
          className="absolute bottom-32 right-16 text-[#00FFFF] h-6 w-6 animate-float"
          fill="currentColor"
          style={{ animationDuration: '5s' }}
        />
        <Diamond
          className="absolute top-1/2 left-1/4 text-[#00FFFF]/60 h-5 w-5 animate-float"
          fill="currentColor"
          style={{ animationDuration: '7s' }}
        />
      </div>

      <div className="z-10 max-w-2xl w-full text-center animate-fade-in-up">
        <div className="inline-flex items-center gap-2 bg-[#00FFFF]/10 px-4 py-1.5 rounded-full border border-[#00FFFF]/20 mb-6">
          <Sparkles className="h-4 w-4 text-[#00FFFF]" />
          <span className="text-[#00FFFF] text-sm font-medium tracking-wide uppercase">
            Versão Beta Exclusiva
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-medium text-white tracking-tight mb-4">
          Explorador da Calma
        </h1>
        <p className="text-[#00FFFF]/70 text-lg font-medium mb-8">
          Uma jornada de auto-regulação e foco para o seu filho
        </p>

        <div className="bg-white/5 rounded-3xl border border-[#00FFFF]/20 p-8 mb-8 backdrop-blur-sm text-left">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-[#00FFFF]/10 flex items-center justify-center shrink-0">
                <Heart className="h-5 w-5 text-[#00FFFF]" />
              </div>
              <div>
                <h3 className="text-white font-medium text-base mb-1">Biofeedback em Tempo Real</h3>
                <p className="text-white/60 text-sm font-medium">
                  Sensores de batimento cardíaco monitoram o estado do seu filho a cada instante,
                  transformando dados biológicos em uma experiência visual envolvente.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-[#00FFFF]/10 flex items-center justify-center shrink-0">
                <Diamond className="h-5 w-5 text-[#00FFFF]" fill="currentColor" />
              </div>
              <div>
                <h3 className="text-white font-medium text-base mb-1">Jogo do Explorador</h3>
                <p className="text-white/60 text-sm font-medium">
                  Um mascote em formato de balão flutua e reflete o nível de calma. Quanto mais
                  focado o seu filho permanece, mais cristais ele coleta a cada 2 minutos.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-[#00FFFF]/10 flex items-center justify-center shrink-0">
                <Activity className="h-5 w-5 text-[#00FFFF]" />
              </div>
              <div>
                <h3 className="text-white font-medium text-base mb-1">
                  Variabilidade da Resposta Cardíaca (VRC)
                </h3>
                <p className="text-white/60 text-sm font-medium">
                  Ao final da sessão, um relatório detalhado mostra a VRC, indicando o nível de
                  auto-regulação alcançado durante a jornada.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-[#00FFFF]/10 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-[#00FFFF]" />
              </div>
              <div>
                <h3 className="text-white font-medium text-base mb-1">Seguro e Ético</h3>
                <p className="text-white/60 text-sm font-medium">
                  Desenvolvido com orientação clínica, em conformidade com protocolos de
                  telemedicina e com soberania médica absoluta.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            asChild
            className="bg-[#00FFFF] hover:bg-[#00FFFF]/90 text-[#0A192F] font-medium rounded-full px-8 h-12 text-base shadow-lg"
          >
            <Link to="/focus-session">
              Acessar Versão Beta
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/5 font-medium rounded-full"
          >
            <Link to="/">
              <Brain className="h-4 w-4 mr-2" />
              Voltar ao Painel
            </Link>
          </Button>
        </div>

        <p className="text-white/40 text-xs font-medium mt-8">
          Ao participar da versão Beta, você concorda em fornecer feedback sobre a experiência.
        </p>
      </div>
    </div>
  )
}
