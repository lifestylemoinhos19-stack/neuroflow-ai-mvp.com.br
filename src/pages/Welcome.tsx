import { User, Stethoscope, Brain, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const cards = [
  {
    icon: User,
    title: 'Sou paciente ou responsável',
    description: 'Responder às avaliações que meu médico selecionou',
    link: '/minhas-escalas',
  },
  {
    icon: Stethoscope,
    title: 'Sou profissional de saúde',
    description: 'Acessar painel clínico e resultados',
    link: '/login',
  },
  {
    icon: Brain,
    title: 'Quero apenas relaxar',
    description: 'Sessão de foco guiada — sem cadastro',
    link: '/focus-session',
  },
]

export default function Welcome() {
  return (
    <div className="min-h-screen bg-[#0A192F] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#00FFFF]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-[#00FFFF]/5 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl">
        <div className="text-center mb-10 animate-fade-in-up">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Bem-vindo ao Neuro<span className="text-[#00FFFF]">Flow</span> AI
          </h1>
          <p className="text-white/85 mt-3 text-base sm:text-lg">Como podemos ajudar você hoje?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full animate-fade-in-up">
          {cards.map((card) => (
            <Link
              key={card.title}
              to={card.link}
              className="group rounded-2xl border border-[#00FFFF]/20 bg-white/5 p-6 hover:border-[#00FFFF]/40 transition-all duration-200 flex flex-col items-center text-center"
            >
              <div className="h-14 w-14 rounded-xl bg-[#00FFFF]/10 border border-[#00FFFF]/20 flex items-center justify-center mb-4 group-hover:bg-[#00FFFF]/20 transition-colors">
                <card.icon className="h-7 w-7 text-[#00FFFF]" />
              </div>
              <h2 className="text-base font-semibold text-white mb-2">{card.title}</h2>
              <p className="text-sm text-white/70 leading-relaxed mb-4">{card.description}</p>
              <div className="flex items-center gap-1 text-xs text-[#00FFFF] font-medium mt-auto">
                Acessar <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
