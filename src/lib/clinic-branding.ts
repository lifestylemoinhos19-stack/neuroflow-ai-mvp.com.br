const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

export const CLINIC_BRANDING = {
  name: 'Casa Branca Saúde',
  tagline: 'Saúde Mental & Bem-estar',
  address: 'Ramiro Barcelos, 839, Moinhos de Vento, POA/RS',
  whatsapp: '51 3282-6929',
  logoUrl: `${SUPABASE_URL}/storage/v1/object/public/clinic-assets/casa-branca-logo.png`,
  colors: {
    primary: '#0f4c81',
    secondary: '#1a73e8',
    accent: '#e8f4fd',
    dark: '#0a2540',
    medium: '#475569',
  },
} as const

export function getBrandHeaderHtml(): string {
  const b = CLINIC_BRANDING
  return `<div class="brand-header">
<div class="logo-wrap"><img src="${b.logoUrl}" alt="${b.name}" /></div>
<div class="clinic-meta"><span class="clinic-name">${b.name}</span><span class="clinic-tagline">${b.tagline}</span></div>
</div>`
}

export function getBrandFooterHtml(): string {
  const b = CLINIC_BRANDING
  return `<div class="brand-footer">
<p class="clinic-footer-name">${b.name}</p>
<p>${b.address} | WhatsApp: ${b.whatsapp}</p>
</div>`
}

export function getBrandCss(): string {
  const c = CLINIC_BRANDING.colors
  return `.brand-header{display:flex;align-items:center;gap:16px;padding:12px 0;border-bottom:3px solid ${c.primary};margin-bottom:24px}
.brand-header .logo-wrap{width:56px;height:56px;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.brand-header .logo-wrap img{max-width:100%;max-height:100%;object-fit:contain}
.brand-header .clinic-meta{display:flex;flex-direction:column}
.brand-header .clinic-name{font-size:20px;font-weight:700;color:${c.primary}}
.brand-header .clinic-tagline{font-size:12px;color:${c.medium}}
.brand-footer{margin-top:32px;padding:12px 0;border-top:2px solid ${c.primary};text-align:center}
.brand-footer p{margin:2px 0;font-size:12px;color:${c.medium}}
.brand-footer .clinic-footer-name{font-weight:700;color:${c.dark}}
@media print{.brand-header{position:fixed;top:0;left:0;right:0;background:#fff;z-index:100;padding:8px 40px}.brand-footer{position:fixed;bottom:0;left:0;right:0;background:#fff;z-index:100;padding:8px 40px}body{padding-top:90px;padding-bottom:70px}}`
}
