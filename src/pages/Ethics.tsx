import { useEffect, useState } from 'react'
import { PublicPageShell } from '@/components/PublicPageShell'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import {
  Brain,
  Target,
  Cpu,
  Stethoscope,
  Shield,
  Search,
  Lock,
  Scale,
  ClipboardCheck,
  ScrollText,
} from 'lucide-react'
import { getCodeOfEthics, EthicsCode } from '@/services/ethics'
import { TELEMEDICINE_DISCLAIMER } from '@/lib/clinical-references'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  stethoscope: Stethoscope,
  shield: Shield,
  search: Search,
  lock: Lock,
  scale: Scale,
  'clipboard-check': ClipboardCheck,
}

export default function Ethics() {
  const [ethics, setEthics] = useState<EthicsCode | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCodeOfEthics().then((data) => {
      setEthics(data)
      setLoading(false)
    })
  }, [])

  return (
    <PublicPageShell>
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Institucional &amp; Código de Ética
        </h1>
        <p className="text-base text-white/70 leading-relaxed max-w-2xl">
          {ethics?.subtitle || 'Princípios éticos fundamentais para o uso de IA em saúde'}
        </p>
      </div>

      <Card className="mb-6 bg-white/5 border-[#00FFFF]/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-white">
            <Brain className="h-5 w-5 text-[#00FFFF]" /> Sobre o NeuroFlow AI
          </CardTitle>
        </CardHeader>
        <CardContent className="text-base text-white/70 leading-relaxed space-y-3">
          <p>
            O NeuroFlow AI é uma plataforma de saúde digital que combina inteligência artificial,
            biofeedback e protocolos clínicos validados para apoiar profissionais na triagem e
            monitoramento de transtornos do neurodesenvolvimento.
          </p>
          <p>
            Desenvolvido em conformidade com a LGPD e a Resolução CFM nº 2.314/2022 sobre
            telemedicina, o sistema opera como ferramenta de apoio à decisão clínica, mantendo a
            soberania médica em todas as etapas.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6 bg-white/5 border-[#00FFFF]/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-white">
            <Target className="h-5 w-5 text-[#00FFFF]" /> Nossa Missão
          </CardTitle>
        </CardHeader>
        <CardContent className="text-base text-white/70 leading-relaxed space-y-3">
          <p>
            Democratizar o acesso à triagem neurológica precoce, garantindo que crianças de todas as
            regiões tenham acesso a ferramentas clínicas validadas e baseadas em evidências
            científicas.
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Reduzir o tempo entre os primeiros sinais e o encaminhamento especializado</li>
            <li>Fornecer ferramentas de biofeedback acessíveis e não invasivas</li>
            <li>Manter transparência total sobre limitações e critérios éticos</li>
            <li>Capacitar profissionais de saúde com dados clínicos estruturados</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-6 bg-white/5 border-[#00FFFF]/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-white">
            <Cpu className="h-5 w-5 text-[#00FFFF]" /> Estratégia de Independência de Hardware
          </CardTitle>
        </CardHeader>
        <CardContent className="text-base text-white/70 leading-relaxed space-y-3">
          <p>
            O NeuroFlow AI é projetado para funcionar com múltiplos métodos de captura de
            biofeedback, garantindo acessibilidade independente do hardware disponível.
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong className="text-white">rPPG (Câmera):</strong> Captura óptica via webcam, sem
              sensores externos
            </li>
            <li>
              <strong className="text-white">Sensor Bluetooth:</strong> Integração com sensores de
              batimento cardíaco dedicados
            </li>
            <li>
              <strong className="text-white">Arquitetura Aberta:</strong> API extensível para novos
              dispositivos e métodos
            </li>
            <li>
              <strong className="text-white">Processamento Local:</strong> Dados sensíveis
              processados no cliente quando possível
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-6 bg-[#00FFFF]/5 border-[#00FFFF]/20">
        <CardContent className="p-4 flex items-start gap-3">
          <ScrollText className="h-5 w-5 text-[#00FFFF] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white">
              {ethics?.title || 'Código de Ética do NeuroFlow AI'}
            </p>
            <p className="text-xs text-white/60 mt-1 leading-relaxed">
              {TELEMEDICINE_DISCLAIMER.text}
            </p>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-20 w-full bg-white/10" />
          ))}
        </div>
      ) : (
        <Card className="bg-white/5 border-[#00FFFF]/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-white">
              <Brain className="h-5 w-5 text-[#00FFFF]" /> Princípios Éticos Fundamentais
            </CardTitle>
            <CardDescription className="text-white/50">
              Estes princípios regem toda a operação do NeuroFlow AI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible defaultValue="1">
              {(ethics?.principles ?? []).map((principle) => {
                const Icon = iconMap[principle.icon] || Stethoscope
                return (
                  <AccordionItem
                    key={principle.number}
                    value={String(principle.number)}
                    className="border-[#00FFFF]/10"
                  >
                    <AccordionTrigger className="hover:no-underline text-white">
                      <div className="flex items-center gap-3 text-left">
                        <div className="h-10 w-10 rounded-xl bg-[#00FFFF]/10 flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5 text-[#00FFFF]" />
                        </div>
                        <span className="font-bold text-white">
                          {principle.number}. {principle.title}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pl-14 pr-4 text-white/70 leading-relaxed">
                      {principle.description}
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <Card className="bg-white/5 border-[#00FFFF]/10">
          <CardContent className="p-5 flex items-center gap-3">
            <Badge variant="outline" className="text-[#3DFFB0] border-[#3DFFB0]/30 bg-[#3DFFB0]/10">
              LGPD
            </Badge>
            <p className="text-sm text-white/60">Conformidade com a Lei nº 13.709/2018</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-[#00FFFF]/10">
          <CardContent className="p-5 flex items-center gap-3">
            <Badge variant="outline" className="text-[#00FFFF] border-[#00FFFF]/30 bg-[#00FFFF]/10">
              CFM 2.314/2022
            </Badge>
            <p className="text-sm text-white/60">Telemedicina conforme resolução do CFM</p>
          </CardContent>
        </Card>
      </div>
    </PublicPageShell>
  )
}
