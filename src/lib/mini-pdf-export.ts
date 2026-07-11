import type { MiniReportData } from '@/services/mini-report'

function esc(s: string | null | undefined): string {
  if (!s) return '—'
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function fmtTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function fmtDuration(start: string, end: string | null): string {
  if (!end) return '—'
  const min = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

export function exportMiniPdf(report: MiniReportData): void {
  const positive = report.moduleResults.filter((r) => r.isPositive)
  const now = new Date().toLocaleString('pt-BR')
  const fb = report.clinicalFeedback
  const hasInterpretation = fb?.system_suggestion || fb?.admin_edited_interpretation

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório MINI 5.0.0</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;color:#1e293b;max-width:800px;margin:0 auto}
  h1{color:#0f172a;margin:0;font-size:24px}
  .sub{color:#64748b;margin:4px 0 24px;font-size:14px}
  .sec{margin-bottom:24px}
  .sec-t{font-size:16px;font-weight:700;color:#0f172a;border-bottom:2px solid #3b82f6;padding-bottom:4px;margin-bottom:12px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;font-size:14px}
  .grid .l{color:#64748b}
  .grid .v{font-weight:600}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:#f1f5f9;padding:8px;text-align:left;border-bottom:2px solid #cbd5e1}
  td{padding:8px;border-bottom:1px solid #e2e8f0}
  .pos{background:#fef3c7;font-weight:600}
  .neg{color:#64748b}
  .alert{background:#fef3c7;border-left:4px solid #f59e0b;padding:12px;margin-bottom:8px;font-size:14px}
  .fb{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;font-size:14px;margin-bottom:12px}
  .sig{margin-top:48px;text-align:center}
  .sig-l{border-top:1px solid #475569;width:300px;margin:0 auto;padding-top:8px;font-size:13px;color:#475569}
  .ft{margin-top:32px;padding-top:16px;border-top:1px solid #cbd5e1;font-size:11px;color:#94a3b8;text-align:center}
  .warn{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;font-size:12px;color:#1e40af;margin-top:16px}
  @media print{body{padding:20px}}
</style>
</head>
<body>
  <h1>Relatório MINI 5.0.0</h1>
  <p class="sub">Mini International Neuropsychiatric Interview &middot; NeuroFlow AI &middot; ${now}</p>
  <div class="sec">
    <div class="sec-t">Identificação do Entrevistado</div>
    <div class="grid">
      <div><span class="l">Nome: </span><span class="v">${esc(report.patient?.fullName)}</span></div>
      <div><span class="l">Protocolo: </span><span class="v">${esc(report.protocol)}</span></div>
      <div><span class="l">Data de Nascimento: </span><span class="v">${report.patient?.birthDate ? fmtDate(report.patient.birthDate) : '—'}</span></div>
      <div><span class="l">Entrevistador: </span><span class="v">${esc(report.interviewerName)}</span></div>
      <div><span class="l">Data da Entrevista: </span><span class="v">${fmtDate(report.session.started_at)}</span></div>
      <div><span class="l">Início: </span><span class="v">${fmtTime(report.session.started_at)}</span></div>
      <div><span class="l">Fim: </span><span class="v">${fmtTime(report.session.completed_at)}</span></div>
      <div><span class="l">Duração: </span><span class="v">${fmtDuration(report.session.started_at, report.session.completed_at)}</span></div>
    </div>
  </div>
  ${
    positive.length > 0
      ? `
  <div class="sec">
    <div class="sec-t">Achados Positivos (${positive.length})</div>
    ${positive.map((r) => `<div class="alert"><strong>${r.letter}</strong> — ${esc(r.title)}: <strong>${esc(r.label)}</strong> (${esc(r.details)})</div>`).join('')}
  </div>`
      : ''
  }
  <div class="sec">
    <div class="sec-t">Resultados Detalhados (Módulos A–P)</div>
    <table>
      <thead><tr><th>Mód</th><th>Descrição</th><th>Resultado</th><th>Detalhes</th></tr></thead>
      <tbody>
        ${report.moduleResults.map((r) => `<tr class="${r.isPositive ? 'pos' : 'neg'}"><td><strong>${r.letter}</strong></td><td>${esc(r.title)}</td><td>${esc(r.label)}</td><td>${esc(r.details)}</td></tr>`).join('')}
      </tbody>
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
  <div class="sig"><div class="sig-l">Assinatura do Profissional Responsável</div></div>
  <div class="ft">Documento gerado pelo NeuroFlow AI em ${now}<br/>Dados protegidos conforme LGPD (Lei nº 13.709/2018). Suporte à decisão clínica — Validação médica obrigatória.</div>
</body>
</html>`

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 300)
  }
}
