import { Link } from 'react-router-dom'
import { useBranding } from '@/hooks/use-branding'

export function SkipLogo() {
  const { showSkipLogo } = useBranding()

  if (!showSkipLogo) return null

  return (
    <Link
      to="/"
      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
    >
      <img src="/skip.png" alt="Skip" className="h-4 w-auto opacity-60" />
      <span>Powered by Skip</span>
    </Link>
  )
}
