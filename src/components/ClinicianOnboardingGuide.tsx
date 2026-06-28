import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Brain,
  ClipboardList,
  LayoutDashboard,
  Stethoscope,
  ArrowRight,
  MessageSquareCheck,
  AlertTriangle,
} from 'lucide-react'

interface ClinicianOnboardingGuideProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const workflowSteps = [
  {
    icon: ClipboardList,
    title: 'Triagem',
    desc: 'O paciente responde ao chat antes da consulta.',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    desc: 'Você revisa o relatório estruturado com scores e pontos de atenção.',
  },
  {
    icon: Stethoscope,
    title: 'Consulta',
    desc: 'Foco na investigação clínica profunda, economizando tempo de coleta de dados básicos.',
  },
]

const riskLevels = [
  { color: 'bg-green-500', text: 'text-green-600', label: 'Verde: Baixo Risco' },
  {
    color: 'bg-yellow-500',
    text: 'text-yellow-600',
    label: 'Amarelo: Risco Moderado (exige observação detalhada)',
  },
  {
    color: 'bg-red-500',
    text: 'text-red-600',
    label: 'Vermelho: Alto Risco (forte correlação com DSM-5)',
  },
]

export function ClinicianOnboardingGuide({ open, onOpenChange }: ClinicianOnboardingGuideProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl font-display font-bold">
              Guia de Onboarding: NeuroFlow AI (Versão Beta)
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Guia de onboarding para profissionais de saúde
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">O que é o NeuroFlow AI?</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Uma ferramenta de suporte à decisão clínica que realiza triagem automatizada de TEA e
              TDAH via anamnese conversacional e escalas validadas (M-CHAT/SNAP-IV).
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Fluxo de Trabalho</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              {workflowSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className="flex-1 rounded-xl border border-slate-200 p-3 bg-slate-50">
                    <step.icon className="h-5 w-5 text-primary mb-2" />
                    <p className="text-xs font-bold text-slate-900">{step.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{step.desc}</p>
                  </div>
                  {i < workflowSteps.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-slate-300 shrink-0 hidden sm:block" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Interpretação de Resultados</h3>
            <div className="space-y-2">
              {riskLevels.map((risk, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`h-4 w-4 rounded-full ${risk.color}`} />
                  <span className={`text-sm font-medium ${risk.text}`}>{risk.label}</span>
                </div>
              ))}
              <div className="flex items-start gap-3 mt-2 p-3 bg-red-50 rounded-lg border border-red-100">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700">
                  <strong className="font-bold">
                    Alertas: Contraindicações de EMT serão destacadas em negrito.
                  </strong>
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <MessageSquareCheck className="h-4 w-4 text-primary" />
              Feedback Clínico
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sua missão é validar a precisão da IA através do botão 'Feedback Clínico' após cada
              atendimento.
            </p>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={() => onOpenChange(false)} className="rounded-full">
            Entendi, fechar guia
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
