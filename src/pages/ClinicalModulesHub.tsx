import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Brain,
  Baby,
  Zap,
  HeartPulse,
  Clock,
  Users,
  ArrowRight,
  ArrowLeft,
  Play,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { clinicalModules, type ScaleInfo } from '@/lib/clinical-modules'
import { startClinicalSession } from '@/services/clinical-modules'
import { ClinicalOnboarding } from '@/components/ClinicalOnboarding'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const moduleIcons: Record<string, typeof Brain> = {
  'autismo-tea': Brain,
  desenvolvimento: Baby,
  tdah: Zap,
  'outras-patologias': HeartPulse,
}

export default function ClinicalModulesHub() {
  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem('neuroflow_clinical_onboarding') !== 'true',
  )
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [starting, setStarting] = useState<string | null>(null)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleContinue = () => {
    localStorage.setItem('neuroflow_clinical_onboarding', 'true')
    setShowOnboarding(false)
  }

  const handleStartScale = async (scale: ScaleInfo, moduleTitle: string) => {
    if (!scale.available) {
      toast({ title: 'Em breve', description: 'Esta avaliação estará disponível em breve.' })
      return
    }
    // Escalas públicas (/avaliacao/*) não dependem de sessão clínica do
    // profissional — abrem direto na rota pública de avaliação.
    const isPublicScale =
      scale.route?.startsWith('/avaliacao/') ||
      scale.key === 'milestones' ||
      scale.key === 'cognitive-evaluation'
    if (isPublicScale && scale.route) {
      navigate(scale.route)
      return
    }
    if (scale.key === 'mini-5' && scale.route) {
      navigate(scale.route)
      return
    }
    setStarting(scale.key)
    const sessionId = await startClinicalSession(scale.key, scale.name, moduleTitle)
    setStarting(null)
    if (sessionId && scale.route) {
      navigate(scale.route, { state: { sessionId } })
    } else if (!sessionId) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível iniciar a avaliação.',
      })
    }
  }

  if (showOnboarding) {
    return <ClinicalOnboarding onContinue={handleContinue} />
  }

  const module = selectedModule ? clinicalModules.find((m) => m.id === selectedModule) : null

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[#0A192F] rounded-2xl p-4 sm:p-6 space-y-5 animate-fade-in-up">
      <div className="flex items-center gap-3">
        {selectedModule && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedModule(null)}
            className="text-white/85 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {module ? module.title : 'Módulos Clínicos'}
          </h1>
          <p className="text-white/75 text-sm">
            {module
              ? module.description
              : 'Selecione uma categoria para visualizar as escalas disponíveis.'}
          </p>
        </div>
      </div>

      {!module ? (
        <div className="grid gap-4 sm:grid-cols-2 max-w-4xl mx-auto">
          {clinicalModules.map((m) => {
            const Icon = moduleIcons[m.id] || Brain
            return (
              <Card
                key={m.id}
                className="border-white/10 bg-white/5 hover:bg-white/[0.07] hover:border-cyan-400/30 transition-all cursor-pointer group"
                onClick={() => setSelectedModule(m.id)}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-400/10 flex items-center justify-center group-hover:bg-cyan-400/20 transition-colors">
                      <Icon className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{m.title}</h3>
                      <p className="text-white/70 text-xs mt-0.5">
                        {m.scales.length} escalas disponíveis
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-white/70 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <p className="text-white/75 text-sm leading-relaxed">{m.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl mx-auto">
          {module.scales.map((scale) => (
            <Card key={scale.key} className="border-white/10 bg-white/5">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold text-base">{scale.name}</h3>
                      {!scale.available && (
                        <Badge
                          variant="outline"
                          className="border-white/20 text-white/70 text-[10px]"
                        >
                          Em breve
                        </Badge>
                      )}
                    </div>
                    <p className="text-white/75 text-sm leading-relaxed">{scale.purpose}</p>
                    <div className="flex flex-wrap gap-4 pt-1">
                      <span className="flex items-center gap-1.5 text-xs text-white/70">
                        <Users className="h-3.5 w-3.5" />
                        {scale.targetAudience}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-white/70">
                        <Clock className="h-3.5 w-3.5" />
                        {scale.estimatedTime}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleStartScale(scale, module.title)}
                    disabled={starting === scale.key}
                    className={cn(
                      'shrink-0 rounded-full',
                      scale.available
                        ? 'bg-cyan-400 text-[#0A192F] hover:bg-cyan-400/90'
                        : 'bg-white/5 text-white/70 border border-white/10',
                    )}
                  >
                    {starting === scale.key ? (
                      'Iniciando...'
                    ) : scale.available ? (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Iniciar
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-1" />
                        Indisponível
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
