import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, ArrowRight, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { PublicPageShell } from '@/components/PublicPageShell'

interface InformedConsentProps {
  onAccept: () => void
  /** Quando true, omite o shell público (header/footer) — usado no fluxo
   * embutido de /minhas-escalas, onde a página já fornece seu próprio layout. */
  embedded?: boolean
}

export function InformedConsent({ onAccept, embedded = false }: InformedConsentProps) {
  const [checked, setChecked] = useState(false)

  const content = (
    <div className="max-w-2xl mx-auto space-y-6 py-8 animate-fade-in-up">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00FFFF]/10 border border-[#00FFFF]/20 mb-4">
          <ShieldCheck className="h-8 w-8 text-[#00FFFF]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Termo de Consentimento Livre e Esclarecido
        </h1>
        <p className="text-[#00FFFF]/80 text-sm font-medium">
          TCLE — Avaliação de Neurodesenvolvimento
        </p>
      </div>

      <div className="rounded-xl border border-[#00FFFF]/20 bg-[#00FFFF]/5 p-5 space-y-4">
        <p className="text-sm text-white/80 leading-relaxed">
          O NeuroFlow AI é uma ferramenta de <strong className="text-[#00FFFF]">triagem</strong> e
          apoio à decisão clínica. <strong className="text-white">NÃO substitui</strong> uma
          avaliação médica presencial ou diagnóstico formal.
        </p>
        <ul className="text-sm text-white/70 space-y-2">
          <li className="flex items-start gap-2">
            <Lock className="h-4 w-4 text-[#00FFFF] shrink-0 mt-0.5" />
            <span>Seus dados são protegidos conforme a LGPD (Lei nº 13.709/2018).</span>
          </li>
          <li className="flex items-start gap-2">
            <Lock className="h-4 w-4 text-[#00FFFF] shrink-0 mt-0.5" />
            <span>
              Os resultados são educativos e devem ser validados por um profissional de saúde.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Lock className="h-4 w-4 text-[#00FFFF] shrink-0 mt-0.5" />
            <span>
              Você pode realizar a avaliação sem login. Seus dados ficarão vinculados a um token
              anônimo.
            </span>
          </li>
        </ul>
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-white/5 p-4 border border-white/10">
        <Checkbox
          id="tcle-public"
          checked={checked}
          onCheckedChange={(v) => setChecked(v === true)}
          className="mt-0.5 border-white/30"
        />
        <label
          htmlFor="tcle-public"
          className="text-sm text-white/80 cursor-pointer leading-relaxed"
        >
          Li e compreendo que esta avaliação é de caráter educativo e de triagem, não substituindo
          consulta médica. Aceito participar.{' '}
          <Link to="/terms" className="text-[#00FFFF] hover:underline" target="_blank">
            Ler termos completos
          </Link>
        </label>
      </div>

      <Button
        onClick={onAccept}
        disabled={!checked}
        size="lg"
        className="w-full bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Li e aceito <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  )

  if (embedded) {
    return content
  }

  return <PublicPageShell>{content}</PublicPageShell>
}
