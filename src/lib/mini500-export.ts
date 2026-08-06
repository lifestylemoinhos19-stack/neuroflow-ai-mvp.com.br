import { Mini500ModuleResult } from '@/lib/mini500-scoring'
import { ClinicalInterpretation } from '@/lib/mini500-interpretation'
import { Mini500PatientInfo } from '@/services/mini500-service'

export interface Mini500ExportData {
  patientInfo: Mini500PatientInfo
  results: Mini500ModuleResult[]
  interpretations: ClinicalInterpretation[]
  alerts: string[]
  summary: string
}

function esc(s: string | null | undefined): string {
  if (!s) return '—'
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function exportMini500Pdf(data: Mini500ExportData): void {
  const now = new Date().toLocaleString('pt-BR')
  const positive = data.results.filter((r) => r.isPositive)
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Relatório MINI 5.0.0</title><style>
body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;color:#1e293b;max-width:800px;margin:0 auto}
h1{color:#0ea5e9;margin:0;font-size:24px}.sub{color:#64748b;margin:4px 0 24px;font-size:14px}
.sec{margin-bottom:24px}.sec-t{font-size:16px;font-weight:700;color:#0ea5e9;border-bottom:2px solid #38bdf8;padding-bottom:4px;margin-bottom:12px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;font-size:14px}.grid .l{color:#64748b}
table{width:100%;border-collapse:collapse;font-size:13px}
th{background:#f0f9ff;padding:8px;text-align:left;border-bottom:2px solid #0ea5e9}
td{padding:8px;border-bottom:1px solid #e2e8f0}
.pos{background:#fef3c7;font-weight:600}
.alert-box{background:#fee2e2;border-left:4px solid #dc2626;padding:12px;margin-bottom:8px;font-size:14px;border-radius:4px}
.interp-box{background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;font-size:14px;margin-bottom:12px}
.warn{background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px;font-size:12px;color:#0ea5e9;margin-top:16px}
</style></head><body>
<h1>Relatório MINI 5.0.0</h1>
<p class="sub">Mini International Neuropsychiatric Interview &middot; ${now}</p>
<div class="sec"><div class="sec-t">Identificação</div><div class="grid">
<div><span class="l">Nome: </span>${esc(data.patientInfo.name)}</div>
<div><span class="l">Protocolo: </span>${esc(data.patientInfo.protocol)}</div>
<div><span class="l">Entrevistador: </span>${esc(data.patientInfo.interviewerName)}</div>
<div><span class="l">Data: </span>${esc(data.patientInfo.interviewDate)}</div>
<div><span class="l">Início: </span>${esc(data.patientInfo.startTime)}</div>
<div><span class="l">Fim: </span>${esc(data.patientInfo.endTime)}</div>
</div></div>
${data.alerts.length > 0 ? `<div class="sec"><div class="sec-t">⚠ Alertas Críticos (${data.alerts.length})</div>${data.alerts.map((a) => `<div class="alert-box">${esc(a)}</div>`).join('')}</div>` : ''}
${positive.length > 0 ? `<div class="sec"><div class="sec-t">Diagnósticos Positivos (${positive.length})</div>${positive.map((r) => `<div class="alert-box"><strong>${r.letter}</strong> — ${esc(r.title)}: <strong>${esc(r.label)}</strong> (${esc(r.details)})</div>`).join('')}</div>` : ''}
<div class="sec"><div class="sec-t">Resultados Detalhados (A–P)</div><table><thead><tr><th>Mod</th><th>Descrição</th><th>Resultado</th><th>Detalhes</th></tr></thead><tbody>
${data.results.map((r) => `<tr class="${r.isPositive ? 'pos' : ''}"><td><strong>${r.letter}</strong></td><td>${esc(r.title)}</td><td>${esc(r.label)}</td><td>${esc(r.details)}</td></tr>`).join('')}
</tbody></table></div>
${data.interpretations.length > 0 ? `<div class="sec"><div class="sec-t">Interpretação Clínica</div>${data.interpretations.map((i) => `<div class="interp-box"><strong>${i.moduleLetter} — ${esc(i.title)}</strong> (${esc(i.status)})<br/>${esc(i.interpretation)}<br/><br/><strong>Conduta:</strong> ${esc(i.referral)}</div>`).join('')}</div>` : ''}
<div class="warn">⚠ Este instrumento é uma ferramenta de triagem e não substitui a avaliação clínica profissional.</div>
</body></html>`
  const w = window.open('', '_blank')
  if (w) {
    w.document.write(html)
    w.document.close()
    setTimeout(() => w.print(), 300)
  }
}

export function exportMini500Txt(data: Mini500ExportData): void {
  const lines: string[] = []
  lines.push('RELATÓRIO MINI 5.0.0', '='.repeat(50), '')
  lines.push(`Data: ${new Date().toLocaleString('pt-BR')}`, '')
  lines.push('IDENTIFICAÇÃO', '-'.repeat(30))
  lines.push(`Nome: ${data.patientInfo.name}`)
  lines.push(`Protocolo: ${data.patientInfo.protocol || '—'}`)
  lines.push(`Entrevistador: ${data.patientInfo.interviewerName || '—'}`)
  lines.push(`Data da Entrevista: ${data.patientInfo.interviewDate || '—'}`)
  lines.push(
    `Início: ${data.patientInfo.startTime || '—'} | Fim: ${data.patientInfo.endTime || '—'}`,
    '',
  )
  if (data.alerts.length > 0) {
    lines.push('ALERTAS CRÍTICOS', '-'.repeat(30))
    data.alerts.forEach((a) => lines.push(`⚠ ${a}`))
    lines.push('')
  }
  const positive = data.results.filter((r) => r.isPositive)
  if (positive.length > 0) {
    lines.push('DIAGNÓSTICOS POSITIVOS', '-'.repeat(30))
    positive.forEach((r) => lines.push(`  ${r.letter} — ${r.title}: ${r.label} (${r.details})`))
    lines.push('')
  }
  lines.push('RESULTADOS DETALHADOS', '-'.repeat(30))
  data.results.forEach((r) => lines.push(`  ${r.letter} — ${r.title}: ${r.label} | ${r.details}`))
  lines.push('')
  if (data.interpretations.length > 0) {
    lines.push('INTERPRETAÇÃO CLÍNICA', '-'.repeat(30))
    data.interpretations.forEach((i) => {
      lines.push(`  [${i.moduleLetter}] ${i.title} (${i.status})`)
      lines.push(`    ${i.interpretation}`)
      lines.push(`    Conduta: ${i.referral}`, '')
    })
  }
  lines.push(
    '',
    'AVISO: Este instrumento é uma ferramenta de triagem e não substitui a avaliação clínica profissional.',
  )
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `MINI500_${data.patientInfo.name.replace(/\s/g, '_')}_${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
