import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Brain,
  ArrowRight,
  Stethoscope,
  Activity,
  FileText,
  Sparkles,
  TrendingUp,
  BarChart3,
  ClipboardList,
  Microscope,
  Baby,
  Zap,
} from 'lucide-react'

const professionals = [
  {
    icon: Brain,
    title: 'Psicólogos',
    desc: 'Apoio à avaliação psicológica com escalas validadas e interpretação assistida por IA.',
  },
  {
    icon: Stethoscope,
    title: 'Psiquiatras',
    desc: 'Ferramentas estruturadas para diagnóstico psiquiátrico e acompanhamento clínico.',
  },
  {
    icon: Activity,
    title: 'Neurologistas',
    desc: 'Avaliação neurológica com instrumentos padronizados e relatórios detalhados.',
  },
  {
    icon: Microscope,
    title: 'Neuropsicólogos',
    desc: 'Testes neuropsicológicos com análise cognitiva e correlação clínica.',
  },
]

const scales = [
  { code: 'PHQ-9', name: 'Patient Health Questionnaire-9', area: 'Depressão' },
  { code: 'GAD-7', name: 'Generalized Anxiety Disorder-7', area: 'Ansiedade Generalizada' },
  { code: 'HAM-D', name: 'Hamilton Depression Rating Scale', area: 'Depressão' },
  { code: 'HAM-A', name: 'Hamilton Anxiety Rating Scale', area: 'Ansiedade' },
  { code: 'SNAP-IV', name: 'Swanson, Nolan and Pelham-IV', area: 'TDAH' },
  { code: 'ASSQ', name: 'Autism Spectrum Screening Questionnaire', area: 'TEA' },
  { code: 'Y-BOCS', name: 'Yale-Brown Obsessive Compulsive Scale', area: 'TOC' },
  { code: 'SDS', name: 'Sheehan Disability Scale', area: 'Funcionalidade' },
  {
    code: 'MINI 5.0.0',
    name: 'Mini International Neuropsychiatric Interview',
    area: 'Entrevista Estruturada',
  },
]

const groups = [
  {
    icon: Brain,
    title: 'Autismo (TEA)',
    desc: 'Triagem e monitoramento do Transtorno do Espectro Autista com escalas como ASSQ e M-Chat-R.',
  },
  {
    icon: Baby,
    title: 'Transtornos do Desenvolvimento',
    desc: 'Avaliação de marcos desenvolvimentais e atrasos cognitivos em crianças e adolescentes.',
  },
  {
    icon: Zap,
    title: 'TDAH',
    desc: 'Diagnóstico e acompanhamento do Transtorno de Déficit de Atenção e Hiperatividade com SNAP-IV.',
  },
  {
    icon: ClipboardList,
    title: 'Outras Patologias',
    desc: 'Depressão, ansiedade, TOC e avaliação funcional através de instrumentos validados.',
  },
]

const workflow = [
  {
    num: '01',
    title: 'Cadastro',
    desc: 'Criação da conta e perfil do profissional de saúde com autenticação MFA.',
  },
  {
    num: '02',
    title: 'Avaliação',
    desc: 'Aplicação de escalas clínicas validadas e coleta de dados do paciente.',
  },
  {
    num: '03',
    title: 'IA',
    desc: 'Interpretação assistida por inteligência artificial com referências clínicas.',
  },
  {
    num: '04',
    title: 'Laudo',
    desc: 'Geração de relatórios personalizados com sugestões de interpretação clínica.',
  },
  {
    num: '05',
    title: 'Monitoramento',
    desc: 'Acompanhamento longitudinal da evolução do paciente ao longo do tempo.',
  },
]

const differentials = [
  {
    icon: Sparkles,
    title: 'Interpretação por IA',
    desc: 'Análise inteligente dos resultados com sugestões baseadas em evidências clínicas.',
  },
  {
    icon: FileText,
    title: 'Relatórios Personalizados',
    desc: 'Laudos customizados com dados visuais e narrativa clínica estruturada.',
  },
  {
    icon: TrendingUp,
    title: 'Evolução Longitudinal',
    desc: 'Tracking contínuo do progresso do paciente com gráficos comparativos.',
  },
  {
    icon: BarChart3,
    title: 'Estatísticas Clínicas',
    desc: 'Dashboards com indicadores de prevalência e incidência para gestão clínica.',
  },
]

export default function NeuroFlowLanding() {
  return (
    <div className="min-h-screen bg-[#0A192F] text-[#E6F1FF]">
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A192F] via-[#0A192F] to-[#112240]" />
        <div className="relative z-10 max-w-3xl text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-[#00FFFF]/10 px-4 py-2 rounded-full border border-[#00FFFF]/20 mb-8">
            <Sparkles className="h-4 w-4 text-[#00FFFF]" />
            <span className="text-[#00FFFF] text-sm font-medium tracking-wide">
              NeuroFlow IA · Skip Platform
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#E6F1FF] tracking-tight mb-6">
            Plataforma de Apoio à Decisão Clínica com IA
          </h1>
          <p className="text-lg sm:text-xl text-[#8892B0] mb-10 max-w-2xl mx-auto leading-relaxed">
            NeuroFlow IA é uma plataforma de saúde que utiliza inteligência artificial para apoiar
            profissionais na realização de avaliações neuro-psicológicas, interpretação de escalas
            clínicas e monitoramento longitudinal de pacientes.
          </p>
          <Button
            asChild
            className="bg-[#00FFFF] hover:bg-[#00FFFF]/90 text-[#0A192F] font-semibold rounded-full px-8 h-12 text-base shadow-lg"
          >
            <Link to="/login">
              Acessar Plataforma
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="py-20 px-4 bg-[#0A192F]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#CCD6F6] mb-6 text-center">
            O que é
          </h2>
          <p className="text-lg text-[#8892B0] leading-relaxed text-center">
            NeuroFlow IA é um sistema de apoio à decisão clínica que integra inteligência artificial
            para auxiliar profissionais de saúde na aplicação, interpretação e monitoramento de
            escalas neuro-psicológicas validadas. A plataforma combina evidências clínicas, análise
            estatística e automação para fornecer interpretações assistidas, relatórios
            personalizados e acompanhamento longitudinal — sempre preservando a soberania médica e
            em conformidade com protocolos de telemedicina e a LGPD.
          </p>
        </div>
      </section>

      <section className="py-20 px-4 bg-[#112240]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#CCD6F6] mb-12 text-center">
            Para quem é
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">
            {professionals.map((p) => (
              <div
                key={p.title}
                className="bg-[#0A192F]/50 rounded-2xl border border-[#00FFFF]/10 p-6 text-center hover:border-[#00FFFF]/30 transition-colors duration-300"
              >
                <div className="h-14 w-14 rounded-xl bg-[#00FFFF]/10 flex items-center justify-center mx-auto mb-4">
                  <p.icon className="h-7 w-7 text-[#00FFFF]" />
                </div>
                <h3 className="text-[#E6F1FF] font-semibold text-lg mb-2">{p.title}</h3>
                <p className="text-[#8892B0] text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-[#0A192F]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#CCD6F6] mb-4 text-center">
            Escalas Clínicas Suportadas
          </h2>
          <p className="text-[#8892B0] mb-12 text-center max-w-2xl mx-auto">
            Instrumentos validados e reconhecidos internacionalmente para avaliação
            neuro-psicológica.
          </p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {scales.map((s) => (
              <div
                key={s.code}
                className="bg-[#112240] rounded-xl border border-[#00FFFF]/10 p-5 hover:border-[#00FFFF]/30 transition-colors duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#00FFFF] font-bold text-lg">{s.code}</span>
                  <span className="text-xs text-[#8892B0] bg-[#00FFFF]/5 px-2 py-1 rounded-full">
                    {s.area}
                  </span>
                </div>
                <p className="text-[#CCD6F6] text-sm">{s.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-[#112240]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#CCD6F6] mb-12 text-center">
            Grupos Clínicos
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
            {groups.map((g) => (
              <div
                key={g.title}
                className="bg-[#0A192F]/50 rounded-2xl border border-[#00FFFF]/10 p-6 hover:border-[#00FFFF]/30 transition-colors duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-[#00FFFF]/10 flex items-center justify-center shrink-0">
                    <g.icon className="h-6 w-6 text-[#00FFFF]" />
                  </div>
                  <div>
                    <h3 className="text-[#E6F1FF] font-semibold text-lg mb-1">{g.title}</h3>
                    <p className="text-[#8892B0] text-sm">{g.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-[#0A192F]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#CCD6F6] mb-12 text-center">
            Como Funciona
          </h2>
          <div className="relative">
            <div className="absolute left-8 top-8 bottom-8 w-px bg-[#00FFFF]/20 hidden sm:block" />
            <div className="space-y-6">
              {workflow.map((step) => (
                <div key={step.num} className="relative flex items-center gap-4 sm:gap-6">
                  <div className="shrink-0 relative z-10">
                    <div className="h-16 w-16 rounded-2xl bg-[#112240] border border-[#00FFFF]/30 flex items-center justify-center">
                      <span className="text-[#00FFFF] font-bold text-lg sm:text-xl">
                        {step.num}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 bg-[#112240]/50 rounded-xl border border-[#00FFFF]/10 p-4 sm:p-5">
                    <h3 className="text-[#E6F1FF] font-semibold text-base sm:text-lg mb-1">
                      {step.title}
                    </h3>
                    <p className="text-[#8892B0] text-sm">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-[#112240]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#CCD6F6] mb-12 text-center">
            Diferenciais
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">
            {differentials.map((d) => (
              <div
                key={d.title}
                className="bg-[#0A192F]/50 rounded-2xl border border-[#00FFFF]/10 p-6 hover:border-[#00FFFF]/30 transition-colors duration-300"
              >
                <div className="h-12 w-12 rounded-xl bg-[#00FFFF]/10 flex items-center justify-center mb-4">
                  <d.icon className="h-6 w-6 text-[#00FFFF]" />
                </div>
                <h3 className="text-[#E6F1FF] font-semibold text-base mb-2">{d.title}</h3>
                <p className="text-[#8892B0] text-sm">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-[#0A192F]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#CCD6F6] mb-4">
            Comece a usar o NeuroFlow IA
          </h2>
          <p className="text-[#8892B0] mb-8">
            Acesse a plataforma e inicie suas avaliações neuro-psicológicas com suporte de
            inteligência artificial.
          </p>
          <Button
            asChild
            className="bg-[#00FFFF] hover:bg-[#00FFFF]/90 text-[#0A192F] font-semibold rounded-full px-8 h-12 text-base shadow-lg"
          >
            <Link to="/login">
              Acessar Plataforma
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="bg-[#112240] py-8 px-4 border-t border-[#00FFFF]/10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#8892B0] text-sm">
            NeuroFlow IA © 2026 — Sistema de apoio à decisão clínica. Não substitui diagnóstico
            médico.
          </p>
        </div>
      </footer>
    </div>
  )
}
