import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { saveClinicalFeedback } from '@/services/clinical-feedback'
import { useToast } from '@/hooks/use-toast'

interface ClinicalFeedbackDialogProps {
  sessionId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClinicalFeedbackDialog({
  sessionId,
  open,
  onOpenChange,
}: ClinicalFeedbackDialogProps) {
  const [isAccurate, setIsAccurate] = useState<string>('')
  const [comments, setComments] = useState('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setIsAccurate('')
      setComments('')
    }
  }, [open])

  const handleSubmit = async () => {
    if (!sessionId || !isAccurate) return
    setSaving(true)
    const { error } = await saveClinicalFeedback(sessionId, isAccurate === 'yes', comments)
    setSaving(false)
    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o feedback.',
        variant: 'destructive',
      })
      return
    }
    toast({
      title: 'Feedback registrado!',
      description: 'Obrigado pela sua validação clínica.',
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Feedback Clínico
          </DialogTitle>
          <DialogDescription>
            Registre sua validação sobre a precisão da avaliação da IA para esta sessão.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">A avaliação da IA está correta?</Label>
            <RadioGroup value={isAccurate} onValueChange={setIsAccurate}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="feedback-yes" />
                <Label htmlFor="feedback-yes" className="text-sm cursor-pointer">
                  Sim, está correta
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="feedback-no" />
                <Label htmlFor="feedback-no" className="text-sm cursor-pointer">
                  Não, há divergências
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments" className="text-sm font-medium">
              Comentários (opcional)
            </Label>
            <Textarea
              id="comments"
              placeholder="Descreva observações, correções ou sugestões..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !isAccurate}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
