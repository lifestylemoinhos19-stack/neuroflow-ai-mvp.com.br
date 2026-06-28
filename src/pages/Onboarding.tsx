import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Shield, FileText, Lock, Database, UserCheck, AlertTriangle, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'

const tclePillars = [
  {
    icon: FileText,
    title: 'Finalidade',
    content:
      'Ferramenta de triagem e suporte, não substitui diagnóstico médico. O NeuroFlow AI serve como apoio à decisão clínica, sendo a avaliação e o diagnóstico finais de responsabilidade exclusiva do profissional de saúde qualificado.',
  },
  {
    icon: Lock,
    title: 'Privacidade (LGPD)',
    content:
      'Dados sensíveis criptografados e armazenados com segurança. Em conformidade com a Lei nº 13.709/2018 (LGPD), seus dados de saúde são classificados como dados sensíveis e protegidos com criptografia AES-256 em repouso.',
  },
  {
    icon: Database,
    title: 'Uso de Dados',
    content:
      'Anonimização para aprimoramento do modelo de IA. Os dados coletados são anonimizados para refinamento do modelo e treinamento clínico, garantindo que não possam ser rastreados de volta a indivíduos específicos.',
  },
  {
    icon: UserCheck,
    title: 'Direitos',
    content:
      'Direito à interrupção e exclusão de dados a qualquer momento. Como titular dos dados, você tem direito de acesso, retificação e exclusão, podendo revogar este consentimento sempre que desejar.',
  },
  {
    icon: AlertTriangle,
    title: 'Segurança',
    content:
      'Não prescreve medicamentos. Emergências devem buscar atendimento presencial. A plataforma não realiza prescrições farmacêuticas nem substitui atendimento de urgência ou emergência médica.',
  },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { completeOnboarding, logout } = useAuth()
  const { toast } = useToast()
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!agreed) return
    setLoading(true)
    await completeOnboarding()
    setLoading(false)
    toast({
      title: 'Consentimento registrado!',
      description: 'Bem-vindo ao NeuroFlow AI. Você já pode iniciar a triagem.',
    })
    navigate('/')
  }

  const handleCancel = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-subtle border-slate-200">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-display font-bold text-slate-900">
            Termo de Consentimento Livre e Esclarecido
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Antes de iniciar a triagem neurológica, leia atentamente o termo abaixo.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-[320px] rounded-lg border border-slate-200 p-4 bg-slate-50">
            <div className="space-y-4 pr-3">
              {tclePillars.map((pillar, idx) => {
                const Icon = pillar.icon
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-900 text-sm">{pillar.title}</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">{pillar.content}</p>
                    </div>
                  </div>
                )
              })}
              <div className="pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ao marcar a caixa de concordância e clicar em "Confirmar e Iniciar Triagem", você
                  declara ter lido, compreendido e concordado com todos os termos descritos acima.
                  Este consentimento será registrado eletronicamente com data e hora, em
                  conformidade com a LGPD (Lei nº 13.709/2018).
                </p>
              </div>
            </div>
          </ScrollArea>

          <div className="flex items-start gap-2.5 pt-1">
            <Checkbox
              id="tcle-agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
              className="mt-0.5"
            />
            <label
              htmlFor="tcle-agree"
              className="text-sm text-slate-700 cursor-pointer select-none leading-relaxed"
            >
              Li e concordo com os termos do TCLE para utilização da plataforma NeuroFlow AI.
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={!agreed || loading} className="min-w-[200px]">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar e Iniciar Triagem
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
