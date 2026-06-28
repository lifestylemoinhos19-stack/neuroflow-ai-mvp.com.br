import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'

interface TmsSafetyAlertProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: string
  level?: 'critical' | 'warning'
}

export function TmsSafetyAlert({
  open,
  onOpenChange,
  message,
  level = 'critical',
}: TmsSafetyAlertProps) {
  const isCritical = level === 'critical'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          isCritical
            ? 'border-2 border-red-500 bg-red-50'
            : 'border-2 border-orange-400 bg-orange-50'
        }
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`h-12 w-12 rounded-full flex items-center justify-center ${
                isCritical ? 'bg-red-100' : 'bg-orange-100'
              }`}
            >
              <ShieldAlert
                className={`h-7 w-7 ${isCritical ? 'text-red-600' : 'text-orange-600'}`}
              />
            </div>
            <DialogTitle
              className={isCritical ? 'text-red-800 text-lg' : 'text-orange-800 text-lg'}
            >
              {isCritical ? '🚫 RISCO CRÍTICO IDENTIFICADO' : '⚠️ Alerta de Segurança'}
            </DialogTitle>
          </div>
          <DialogDescription
            className={`text-sm pt-3 leading-relaxed ${
              isCritical ? 'text-red-700' : 'text-orange-700'
            }`}
          >
            {message}
          </DialogDescription>
        </DialogHeader>
        <div
          className={`mt-4 p-3 rounded-lg border ${
            isCritical ? 'bg-red-100 border-red-200' : 'bg-orange-100 border-orange-200'
          }`}
        >
          <p className={`text-xs font-semibold ${isCritical ? 'text-red-800' : 'text-orange-800'}`}>
            {isCritical
              ? 'NÃO prosseguir com EMT/TMS. Encaminhar para avaliação presencial imediata com especialista.'
              : 'Suspender protocolo até avaliação médica especializada. Encaminhar para neurologista.'}
          </p>
        </div>
        <div className="flex justify-end mt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className={
              isCritical
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }
          >
            Compreendi o risco
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
