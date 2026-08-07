import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { AdminReport } from '@/services/admin-reports'

interface ReportViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  report: AdminReport | null
}

export function ReportViewDialog({ open, onOpenChange, report }: ReportViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-lg text-white">
            {report?.session_type ?? 'Laudo'}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[55vh] pr-4">
          <div className="space-y-4">
            {report?.session_date && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Data</p>
                <p className="text-sm text-slate-200">
                  {new Date(report.session_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Interpretação
              </p>
              <p className="text-sm text-slate-200 whitespace-pre-wrap break-words">
                {report?.admin_edited_interpretation || report?.comments || 'Sem interpretação.'}
              </p>
            </div>
            {report?.system_suggestion && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Sugestão do Sistema
                </p>
                <p className="text-sm text-slate-200 whitespace-pre-wrap break-words">
                  {report.system_suggestion}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Precisão
              </p>
              <p className="text-sm text-slate-200">
                {report?.is_accurate === true
                  ? 'Preciso'
                  : report?.is_accurate === false
                    ? 'Impreciso'
                    : 'Não avaliado'}
              </p>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
