import { Shield, Stethoscope, FileText, CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ClinicalOnboarding({ onContinue }: { onContinue: () => void }) {
  const cards = [
    {
      icon: FileText,
      title: 'Objetivo das Avaliações',
      text: 'As escalas clínicas auxiliam na triagem e monitoramento de condições do neurodesenvolvimento, fornecendo informações valiosas para profissionais de saúde.',
    },
    {
      icon: Stethoscope,
      title: 'Importância Clínica',
      text: 'Seus dados ajudam a construir um histórico clínico completo, permitindo acompanhar a evolução e orientar condutas terapêuticas personalizadas.',
    },
    {
      icon: Shield,
      title: 'Privacidade (LGPD)',
      text: 'Todos os dados são protegidos pela Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Suas informações são criptografadas e acessíveis apenas por você e profissionais autorizados.',
    },
  ]

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[#0A192F] rounded-2xl p-4 sm:p-6 space-y-6 animate-fade-in-up">
      <div className="text-center space-y-2 pt-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Bem-vindo aos Módulos Clínicos
        </h1>
        <p className="text-white/60 text-sm max-w-2xl mx-auto">
          Este espaço reúne todas as avaliações clínicas disponíveis. Aqui você encontrará
          orientações claras para cada instrumento de avaliação.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 max-w-4xl mx-auto">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-5 space-y-3"
          >
            <div className="w-10 h-10 rounded-full bg-cyan-400/10 flex items-center justify-center">
              <card.icon className="h-5 w-5 text-cyan-400" />
            </div>
            <h3 className="text-white font-semibold text-sm">{card.title}</h3>
            <p className="text-white/50 text-xs leading-relaxed">{card.text}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-start gap-3 max-w-4xl mx-auto">
        <CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
        <p className="text-white/60 text-xs leading-relaxed">
          As avaliações são ferramentas de triagem e não substituem uma consulta presencial com um
          profissional qualificado. Os resultados serão compartilhados com sua equipe de saúde.
        </p>
      </div>

      <div className="flex justify-center pt-2">
        <Button
          onClick={onContinue}
          className="bg-cyan-400 text-[#0A192F] hover:bg-cyan-400/90 font-semibold rounded-full px-8"
        >
          Continuar
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
