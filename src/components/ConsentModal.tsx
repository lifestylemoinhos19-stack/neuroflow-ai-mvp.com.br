import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'

interface ConsentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConsented: () => void
}

export function ConsentModal({ open, onOpenChange, onConsented }: ConsentModalProps) {
  const [checked, setChecked] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleAccept = async () => {
    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({
          privacy_consent: true,
          privacy_consent_accepted_at: new Date().toISOString(),
        })
        .eq('id', user.id)
    }
    setSaving(false)
    onConsented()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-lg">
              Termo de Consentimento Livre e Esclarecido (TCLE)
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm pt-3 leading-relaxed">
            O NeuroFlow AI é uma ferramenta de suporte à decisão clínica e NÃO substitui a avaliação
            médica presencial. Todos os dados são protegidos conforme a LGPD (Lei nº 13.709/2018).
            Os resultados gerados devem ser validados por um profissional de saúde qualificado.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 py-2">
          <Checkbox
            id="tcle-consent"
            checked={checked}
            onCheckedChange={(v) => setChecked(v === true)}
          />
          <label htmlFor="tcle-consent" className="text-sm cursor-pointer leading-relaxed">
            Li e concordo com os termos do Termo de Consentimento Livre e Esclarecido (TCLE).{' '}
            <Link to="/terms" className="text-primary underline" target="_blank">
              Ler termos completos
            </Link>
          </label>
        </div>

        <DialogFooter>
          <Button onClick={handleAccept} disabled={!checked || saving} className="w-full">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Iniciar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
