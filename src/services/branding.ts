import { supabase } from '@/lib/supabase/client'

export interface BrandingConfig {
  showSkipLogo: boolean
}

const DEFAULT_BRANDING: BrandingConfig = {
  showSkipLogo: false,
}

const CACHE_KEY = 'neuroflow_branding_config'

export function getCachedBranding(): BrandingConfig {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      return { ...DEFAULT_BRANDING, ...parsed }
    }
  } catch {
    // ignore parse errors
  }
  return DEFAULT_BRANDING
}

function cacheBranding(config: BrandingConfig): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(config))
  } catch {
    // ignore storage errors
  }
}

export async function fetchBrandingConfig(): Promise<BrandingConfig> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'branding')
    .maybeSingle()

  if (error || !data) {
    return getCachedBranding()
  }

  const value = data.value as Record<string, unknown>
  const config: BrandingConfig = {
    showSkipLogo:
      typeof value?.showSkipLogo === 'boolean' ? value.showSkipLogo : DEFAULT_BRANDING.showSkipLogo,
  }

  cacheBranding(config)
  return config
}
