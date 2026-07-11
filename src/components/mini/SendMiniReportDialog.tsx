import { useState, useEffect } from 'react'
import { Mail, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fetchGuestEmailForSession, sendMiniReport } from '@/services/send-mini-report'

interface SendMiniReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string | null | undefined
}

export function SendMiniReportDialog({ open, onOpenChange, sessionId }: SendMiniReportDialogProps) {
  const [email, setEmail] = useState('')
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (open && sessionId) {
      setLoadingEmail(true)
      setEmail('')
      fetchGuestEmailForSession(sessionId)
        .then((fetchedEmail) => {
          if (fetchedEmail) setEmail(fetchedEmail)
        })
        .finally(() => setLoadingEmail(false))
    }
  }, [open, sessionId])

  const handleSend = async () => {
    if (!sessionId) {
      toast.error('ID da sessão não disponível.')
      return
    }
    if (!email.trim()) {
      toast.error('Por favor, informe o e-mail do destinatário.')
      return
    }

    setSending(true)
    try {
      const result = await sendMiniReport(sessionId, email.trim())
      if (result.success) {
        toast.success('Relatório enviado por e-mail com sucesso!')
        onOpenChange(false)
      } else {
        toast.error(`Erro ao enviar e-mail: ${result.error}`)
      }
    } catch {
      toast.error('Erro inesperado ao enviar e-mail.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#E6F1FF]">
            <Mail className="h-5 w-5 text-[#00FFFF]" />
            Enviar Relatório por E-mail
          </DialogTitle>
          <DialogDescription className="text-[#E6F1FF]/60">
            O relatório MINI 5.0.0 será enviado para o endereço de e-mail informado abaixo.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="recipient-email" className="text-[#E6F1FF] mb-2 block">
            E-mail do Destinatário
          </Label>
          <Input
            id="recipient-email"
            type="email"
            placeholder="exemplo@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loadingEmail || sending}
            className="bg-[#112240] border-[#233554] text-[#E6F1FF]"
          />
          {loadingEmail && (
            <p className="text-xs text-[#E6F1FF]/40 mt-1 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Buscando e-mail do paciente...
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
            className="border-[#233554] text-[#E6F1FF] hover:bg-[#233554]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || loadingEmail}
            className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-medium"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
