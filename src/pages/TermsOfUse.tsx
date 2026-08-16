import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, Check } from 'lucide-react'
import {
  getTermsOfUse,
  getEthicsCode,
  type TermsOfUse as ITermsOfUse,
  type EthicsCode as IEthicsCode,
} from '@/services/ethics'

const principleIcons = {
  1: '⚖️',
  2: '🛡️',
  3: '🔍',
  4: '🔒',
  5: '📊',
  6: '📋',
}

export default function TermsOfUse() {
  const [terms, setTerms] = useState<ITermsOfUse | null>(null)
  const [ethics, setEthics] = useState<IEthicsCode | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getTermsOfUse(), getEthicsCode()]).then(([t, e]) => {
      setTerms(t)
      setEthics(e)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto p-4">
        <Skeleton className="h-10 w-64" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/onboarding">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          {terms && (
            <Badge variant="outline" className="text-slate-500">
              Versão {terms.version} • Atualizado em{' '}
              {new Date(terms.last_updated).toLocaleDateString('pt-BR')}
            </Badge>
          )}
        </div>

        <Card className="shadow-subtle border-slate-100 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-display font-bold">
              <FileText className="h-6 w-6 text-primary" />
              Termos de Uso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {(terms?.sections ?? []).map((section, idx) => (
                <AccordionItem key={idx} value={String(idx)}>
                  <AccordionTrigger className="hover:no-underline font-display font-bold text-slate-900">
                    {section.title}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 leading-relaxed">
                    {section.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card className="shadow-subtle border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Código de Ética — Detalhamento dos Princípios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(ethics?.principles ?? []).map((p) => (
              <div
                key={p.number}
                className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 border border-slate-100"
              >
                <span className="text-2xl shrink-0">
                  {principleIcons[p.number as keyof typeof principleIcons] || '📋'}
                </span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      {p.number}. {p.title}
                    </h4>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{p.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-center mt-6">
          <Button asChild>
            <Link to="/onboarding">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para o Onboarding
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
