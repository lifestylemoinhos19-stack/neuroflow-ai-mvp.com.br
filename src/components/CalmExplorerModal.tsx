import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Gamepad2, Sparkles, Brain } from 'lucide-react'

export function CalmExplorerModal() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const flag = localStorage.getItem('neuroflow_show_calm_explorer')
    if (flag === 'true') {
      setOpen(true)
      localStorage.removeItem('neuroflow_show_calm_explorer')
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md bg-[#0A192F] border-[#00FFFF]/20">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-[#00FFFF]/10 flex items-center justify-center">
              <Gamepad2 className="h-6 w-6 text-[#00FFFF]" />
            </div>
            <DialogTitle className="text-white text-lg">
              Quer testar o Explorador da Calma?
            </DialogTitle>
          </div>
          <DialogDescription className="text-white/60 pt-3 leading-relaxed">
            Jogo de biofeedback que ajuda seu filho a treinar foco e relaxamento de forma divertida.
            Ganhe cristais e explore um mundo calmo!
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-[#00FFFF]/20 bg-[#00FFFF]/5 p-3 flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-[#00FFFF] shrink-0 mt-0.5" />
          <p className="text-xs text-white/70">
            Use a câmera do dispositivo para detectar sinais vitais e guiar a respiração do seu
            filho em tempo real.
          </p>
        </div>
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Talvez depois
          </Button>
          <Button
            onClick={() => {
              setOpen(false)
              navigate('/focus-session')
            }}
            className="bg-[#00FFFF] text-[#0A192F] hover:bg-[#00FFFF]/80 font-semibold"
          >
            <Brain className="h-4 w-4 mr-2" /> Jogar agora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
