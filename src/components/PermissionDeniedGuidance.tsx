import { ShieldAlert, Globe } from 'lucide-react'
import { getBrowserPermissionGuidance } from '@/lib/permission-guidance'

export function PermissionDeniedGuidance() {
  const guidance = getBrowserPermissionGuidance()

  return (
    <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-3 animate-fade-in">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />
        <p className="text-sm font-medium text-red-300">Acesso à câmera negado</p>
      </div>
      <p className="text-xs text-white/85 leading-relaxed">
        Para usar a detecção de batimentos cardíacos, você precisa permitir o acesso à câmera. Siga
        os passos abaixo para {guidance.name}:
      </p>
      <ol className="space-y-1.5">
        {guidance.steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-white/75">
            <span className="shrink-0 w-4 h-4 rounded-full bg-[#00FFFF]/10 text-[#00FFFF] flex items-center justify-center text-[10px] font-medium mt-0.5">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <div className="flex items-center gap-1.5 text-[10px] text-white/70 pt-1">
        {' '}
        <Globe className="h-3 w-3" />
        <span>{guidance.name} detectado</span>
      </div>
    </div>
  )
}
