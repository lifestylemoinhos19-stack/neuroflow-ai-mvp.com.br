import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { fetchBrandingConfig, getCachedBranding, type BrandingConfig } from '@/services/branding'

interface BrandingContextType {
  branding: BrandingConfig
  loading: boolean
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined)

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingConfig>(() => getCachedBranding())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetchBrandingConfig()
      .then((config) => {
        if (mounted) {
          setBranding(config)
          setLoading(false)
        }
      })
      .catch(() => {
        if (mounted) {
          setBranding(getCachedBranding())
          setLoading(false)
        }
      })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <BrandingContext.Provider value={{ branding, loading }}>{children}</BrandingContext.Provider>
  )
}

export function useBranding(): BrandingConfig {
  const ctx = useContext(BrandingContext)
  if (!ctx) return getCachedBranding()
  return ctx.branding
}
