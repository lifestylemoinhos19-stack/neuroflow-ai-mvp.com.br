interface ModuleResponse {
  label: string
  response: string
}

interface ReportData {
  patientName: string
  patientBirthDate: string
  interviewerName: string
  protocol: string
  startedAt: string
  completedAt: string
  moduleMap: Record<string, ModuleResponse[]>
  logoUrl: string
  signatureUrl: string | null
  clinicianName: string
  clinicianCrm: string
  clinicianRqe: string
  validationUrl: string
  feedback: {
    system_suggestion: string | null
    admin_edited_interpretation: string | null
    global_severity: string | null
    is_accurate: boolean | null
    comments: string | null
  } | null
}

const CLINIC_NAME = 'Casa Branca Saúde'
const CLINIC_TAGLINE = 'Saúde Mental & Bem-estar'
const CLINIC_ADDRESS = 'Ramiro Barcelos, 839, Moinhos de Vento, POA/RS'
const CLINIC_WHATSAPP = '51 3282-6929'
const C = {
  primary: '#7B5B3A',
  secondary: '#C4A35A',
  accent: '#FAF5EB',
  dark: '#3E2723',
  medium: '#6D5D4B',
}

const MINI_MODULES: { letter: string; title: string }[] = [
  { letter: 'A', title: 'Episódio Depressivo Maior' },
  { letter: 'B', title: 'Mania (Episódio Maníaco)' },
  { letter: 'C', title: 'Hipomania (Episódio Hipomaníaco)' },
  { letter: 'D', title: 'Ataque de Pânico' },
  { letter: 'E', title: 'Agorafobia' },
  { letter: 'F', title: 'Fobia Social (Ansiedade Social)' },
  { letter: 'G', title: 'Fobia Específica' },
  { letter: 'H', title: 'Transtorno de Ansiedade Generalizada (TAG)' },
  { letter: 'I', title: 'Transtorno de Estresse Pós-Traumático (TEPT)' },
  { letter: 'J', title: 'Transtorno de Estresse Agudo' },
  { letter: 'K', title: 'Transtorno Obsessivo-Compulsivo (TOC)' },
  { letter: 'L', title: 'Reação a Luto' },
  { letter: 'M', title: 'Somatização' },
  { letter: 'N', title: 'Hipondríase' },
  { letter: 'O', title: 'Trastornos Alimentares' },
  { letter: 'P', title: 'Risco de Suicídio' },
]

function esc(s: string | null | undefined): string {
  if (!s) return '—'
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function fmtDate(iso: string): string {
  if (!iso || iso === '—') return '—'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

function fmtTime(iso: string): string {
  if (!iso || iso === '—') return '—'
  const d = new Date(iso)
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function buildSignatureHtml(data: ReportData): string {
  const sigImg = data.signatureUrl
    ? `<img src="${data.signatureUrl}" alt="Assinatura - ${esc(data.clinicianName)}" style="max-width:200px;max-height:70px;object-fit:contain;margin:0 auto 4px;display:block;" />`
    : ''
  const tsDate = fmtDate(data.completedAt || data.startedAt)
  const tsTime = fmtTime(data.completedAt || data.startedAt)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=2&data=${encodeURIComponent(data.validationUrl)}`
  return `<div style="margin-top:40px;display:flex;align-items:center;justify-content:center;gap:32px;">
<div style="text-align:center;flex-shrink:0;">
<img src="${qrUrl}" alt="QR Code de Validação" style="width:120px;height:120px;display:block;margin:0 auto 4px;" />
<div style="font-size:10px;color:${C.medium};max-width:120px;line-height:1.3;">Escaneie para verificar autenticidade</div>
</div>
<div style="text-align:center;">
${sigImg}
<div style="border-top:1px solid ${C.medium};width:280px;margin:0 auto 8px;"></div>
<div style="font-size:14px;font-weight:700;color:${C.dark};">${esc(data.clinicianName)}</div>
<div style="font-size:12px;color:${C.medium};margin-top:2px;">${esc(data.clinicianCrm)} / ${esc(data.clinicianRqe)}</div>
<div style="font-size:11px;color:${C.medium};margin-top:4px;font-style:italic;">Assinado digitalmente em ${tsDate} às ${tsTime}</div>
</div>
</div>`
}

export function generateReportHtml(data: ReportData): string {
  const fb = data.feedback
  const hasInterpretation = fb?.system_suggestion || fb?.admin_edited_interpretation

  const moduleRows = MINI_MODULES.map((m) => {
    const responses = data.moduleMap[m.letter] || []
    const responsesHtml =
      responses.length > 0
        ? responses
            .map(
              (r) =>
                `<tr><td style="padding:4px 8px;color:${C.medium};font-size:12px;">${esc(r.label)}</td><td style="padding:4px 8px;font-weight:600;font-size:12px;">${esc(r.response)}</td></tr>`,
            )
            .join('')
        : '<tr><td colspan="2" style="padding:4px 8px;color:#94a3b8;font-size:12px;">Sem respostas registradas</td></tr>'
    return `<tr>
<td style="padding:8px;border-bottom:1px solid #e2e8f0;"><strong>${m.letter}</strong></td>
<td style="padding:8px;border-bottom:1px solid #e2e8f0;">${esc(m.title)}</td>
<td style="padding:8px;border-bottom:1px solid #e2e8f0;"><table style="width:100%;border-collapse:collapse;">${responsesHtml}</table></td>
</tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Relatório MINI 5.0.0 - ${CLINIC_NAME}</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;padding:0;margin:0;background:#f1f5f9;color:${C.dark}}
  .container{max-width:700px;margin:0 auto;background:#fff;padding:32px}
  .brand-header{display:flex;align-items:center;gap:16px;padding:12px 0;border-bottom:3px solid ${C.primary};margin-bottom:24px}
  .brand-header .logo-wrap{width:56px;height:56px;flex-shrink:0;display:flex;align-items:center;justify-content:center}
  .brand-header .logo-wrap img{max-width:100%;max-height:100%;object-fit:contain}
  .brand-header .clinic-name{font-size:20px;font-weight:700;color:${C.primary}}
  .brand-header .clinic-tagline{font-size:12px;color:${C.medium}}
  h1{color:${C.primary};margin:0;font-size:22px}
  .sub{color:${C.medium};margin:4px 0 24px;font-size:13px}
  .sec{margin-bottom:24px}
  .sec-t{font-size:15px;font-weight:700;color:${C.primary};border-bottom:2px solid ${C.secondary};padding-bottom:4px;margin-bottom:12px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;font-size:13px}
  .grid .l{color:${C.medium}}
  .grid .v{font-weight:600}
  table.mt{width:100%;border-collapse:collapse;font-size:12px}
  table.mt th{background:${C.accent};padding:8px;text-align:left;border-bottom:2px solid ${C.primary}}
  table.mt td{padding:8px;border-bottom:1px solid #e2e8f0;vertical-align:top}
  .fb{background:${C.accent};border:1px solid #bfdbfe;border-radius:6px;padding:14px;font-size:13px;margin-bottom:10px}
  .warn{background:${C.accent};border:1px solid #bfdbfe;border-radius:6px;padding:12px;font-size:11px;color:${C.primary};margin-top:16px}
  .brand-footer{margin-top:24px;padding:12px 0;border-top:2px solid ${C.primary};text-align:center}
  .brand-footer p{margin:2px 0;font-size:12px;color:${C.medium}}
  .brand-footer .fn{font-weight:700;color:${C.dark}}
</style>
</head>
<body>
<div class="container">
  <div class="brand-header">
    <div class="logo-wrap"><img src="${data.logoUrl}" alt="${CLINIC_NAME}" /></div>
    <div><span class="clinic-name">${CLINIC_NAME}</span><br/><span class="clinic-tagline">${CLINIC_TAGLINE}</span></div>
  </div>
  <h1>Relatório MINI 5.0.0</h1>
  <p class="sub">Mini International Neuropsychiatric Interview &middot; ${CLINIC_NAME}</p>
  <div class="sec">
    <div class="sec-t">Identificação do Entrevistado</div>
    <div class="grid">
      <div><span class="l">Nome: </span><span class="v">${esc(data.patientName)}</span></div>
      <div><span class="l">Protocolo: </span><span class="v">${esc(data.protocol)}</span></div>
      <div><span class="l">Data de Nascimento: </span><span class="v">${fmtDate(data.patientBirthDate)}</span></div>
      <div><span class="l">Entrevistador: </span><span class="v">${esc(data.interviewerName)}</span></div>
      <div><span class="l">Data da Entrevista: </span><span class="v">${fmtDate(data.startedAt)}</span></div>
      <div><span class="l">Início: </span><span class="v">${fmtTime(data.startedAt)}</span></div>
      <div><span class="l">Fim: </span><span class="v">${fmtTime(data.completedAt)}</span></div>
    </div>
  </div>
  <div class="sec">
    <div class="sec-t">Resultados Detalhados (Módulos A–P)</div>
    <table class="mt">
      <thead><tr><th style="width:40px;">Mód</th><th style="width:200px;">Descrição</th><th>Respostas</th></tr></thead>
      <tbody>${moduleRows}</tbody>
    </table>
  </div>
  ${
    hasInterpretation
      ? `
  <div class="sec">
    <div class="sec-t">Interpretação Clínica</div>
    ${fb?.system_suggestion ? `<div class="fb"><strong>Sugestão do Sistema:</strong><br/>${esc(fb.system_suggestion).replace(/\n/g, '<br/>')}</div>` : ''}
    ${fb?.admin_edited_interpretation ? `<div class="fb"><strong>Interpretação do Profissional:</strong><br/>${esc(fb.admin_edited_interpretation).replace(/\n/g, '<br/>')}</div>` : ''}
  </div>`
      : ''
  }
  <div class="warn">⚠ Este instrumento é uma ferramenta de triagem e não substitui a avaliação clínica profissional. O diagnóstico definitivo requer avaliação presencial especializada.</div>
  <div style="text-align:center;margin:20px 0;">
    <a href="${esc(data.validationUrl)}" style="display:inline-block;padding:12px 28px;background:${C.primary};color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">🔍 Verificar Autenticidade do Documento</a>
  </div>
  ${buildSignatureHtml(data)}
  <div class="brand-footer">
    <p class="fn">${CLINIC_NAME}</p>
    <p>${CLINIC_ADDRESS} | WhatsApp: ${CLINIC_WHATSAPP}</p>
  </div>
</div>
</body>
</html>`
}
