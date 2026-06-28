import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Brain,
  Shield,
  MessageSquare,
  ClipboardCheck,
  Check,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const steps = [
  {
    icon: Brain,
    title: 'Bem-vindo ao NeuroFlow AI',
    desc: 'Sua plataforma de avaliação neurológica adaptativa com IA.',
  },
  {
    icon: MessageSquare,
    title: 'Entrevista Adaptativa',
    desc: 'Responda perguntas em formato de conversa. A IA adapta o fluxo conforme suas respostas.',
  },
  {
    icon: ClipboardCheck,
    title: 'Escalas Clínicas',
    desc: 'Avaliações especializadas M-CHAT-R (autismo) e SNAP-IV (TDAH) com scoring automatizado.',
  },
  {
    icon: Shield,
    title: 'Privacidade & LGPD',
    desc: 'Seus dados são criptografados (AES-256) e tratados conforme a Lei Geral de Proteção de Dados.',
  },
]

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [isAccepting, setIsAccepting] = useState(false)
  const { completeOnboarding } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const isLastStep = step === steps.length - 1
  const progress = ((step + 1) / steps.length) * 100

  const handleAccept = async () => {
    setIsAccepting(true)
    await completeOnboarding()
    setIsAccepting(false)
    toast({ title: 'Bem-vindo!', description: 'Termos aceitos. Sua conta está pronta.' })
    navigate('/')
  }

  const StepIcon = steps[step].icon

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Brain className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-slate-600">
              Passo {step + 1} de {steps.length}
            </span>
            <span className="font-bold text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="shadow-subtle border-slate-100 animate-fade-in-up" key={step}>
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <StepIcon className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-display font-bold text-slate-900 mb-2">
                {steps[step].title}
              </h2>
              <p className="text-slate-500 leading-relaxed">{steps[step].desc}</p>

              {isLastStep && (
                <div className="mt-6 w-full text-left bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-slate-700">
                      Termos da LGPD (Lei nº 13.709/2018):
                    </p>
                    <Link to="/terms" className="text-xs font-medium text-primary hover:underline">
                      Ver Termos de Uso completos →
                    </Link>
                  </div>
                  <ul className="text-xs text-slate-500 space-y-1">
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" /> Dados de saúde
                      criptografados com AES-256
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" /> Acesso restrito
                      ao titular e profissionais autorizados
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" /> Direito de
                      revogação e exclusão a qualquer momento
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" /> Auditoria
                      completa de acessos e alterações
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" /> Dados coletados
                      serão anonimizados para refinamento do modelo e treinamento clínico, seguindo
                      as melhores práticas da LGPD
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
          {isLastStep ? (
            <Button onClick={handleAccept} disabled={isAccepting} className="rounded-full">
              {isAccepting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Aceitar Termos
            </Button>
          ) : (
            <Button onClick={() => setStep(step + 1)} className="rounded-full">
              Continuar <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
