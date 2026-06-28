import { useEffect, useState } from 'react'
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
  Stethoscope,
  Shield,
  Search,
  Lock,
  Scale,
  ClipboardCheck,
  Brain,
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

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-6 w-full max-w-md" />
        <div className="space-y-4 mt-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
          Institucional & Código de Ética
        </h1>
        <p className="text-slate-500">
          {ethics?.subtitle || 'Princípios éticos fundamentais para o uso de IA em saúde'}
        </p>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4 flex items-start gap-3">
          <ScrollText className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              {ethics?.title || 'Código de Ética do NeuroFlow AI'}
            </p>
            <p className="text-xs text-blue-700 mt-1">{TELEMEDICINE_DISCLAIMER.text}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-subtle border-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Seis Princípios Éticos Fundamentais
          </CardTitle>
          <CardDescription>
            Estes princípios regem toda a operação do NeuroFlow AI e devem ser seguidos por todos os
            profissionais que utilizam a plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible defaultValue="1">
            {(ethics?.principles ?? []).map((principle) => {
              const Icon = iconMap[principle.icon] || Stethoscope
              return (
                <AccordionItem key={principle.number} value={String(principle.number)}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <span className="font-display font-bold text-slate-900">
                          {principle.number}. {principle.title}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-14 pr-4 text-slate-600 leading-relaxed">
                    {principle.description}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow-subtle border-slate-100">
          <CardContent className="p-5 flex items-center gap-3">
            <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">
              LGPD
            </Badge>
            <p className="text-sm text-slate-600">Conformidade com a Lei nº 13.709/2018</p>
          </CardContent>
        </Card>
        <Card className="shadow-subtle border-slate-100">
          <CardContent className="p-5 flex items-center gap-3">
            <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">
              CFM 2.314/2022
            </Badge>
            <p className="text-sm text-slate-600">Telemedicina conforme resolução do CFM</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
