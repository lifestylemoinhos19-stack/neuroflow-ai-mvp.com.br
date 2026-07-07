import { useBranding } from '@/hooks/use-branding'
import { useLocation } from 'react-router-dom'

export function SkipBrandingBadge() {
  const { showSkipLogo, loading } = useBranding()
  const location = useLocation()

  const isPublicRoute =
    location.pathname === '/avaliacao' ||
    location.pathname === '/terms' ||
    location.pathname === '/security' ||
    location.pathname === '/ethics' ||
    location.pathname === '/about'

  if (loading || !showSkipLogo || isPublicRoute) {
    return null
  }

  return (
    <div className="fixed bottom-2 right-2 z-[9999] pointer-events-none">
      <a
        href="https://goskip.app"
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto inline-flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white/70 backdrop-blur-sm transition-opacity hover:opacity-80"
      >
        <img src="/skip.png" alt="Skip" className="h-3 w-auto" />
        <span>Skip</span>
      </a>
    </div>
  )
}
