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
  feedback: {
    system_suggestion: string | null
    admin_edited_interpretation: string | null
    global_severity: string | null
    is_accurate: boolean | null
    comments: string | null
  } | null
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
                `<tr><td style="padding:4px 8px;color:#475569;font-size:12px;">${esc(r.label)}</td><td style="padding:4px 8px;font-weight:600;font-size:12px;">${esc(r.response)}</td></tr>`,
            )
            .join('')
        : '<tr><td colspan="2" style="padding:4px 8px;color:#94a3b8;font-size:12px;">Sem respostas registradas</td></tr>'

    return `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;"><strong>${m.letter}</strong></td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${esc(m.title)}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;">
          <table style="width:100%;border-collapse:collapse;">${responsesHtml}</table>
        </td>
      </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Relatório MINI 5.0.0</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;padding:0;margin:0;background:#f1f5f9;color:#1e293b}
  .container{max-width:700px;margin:0 auto;background:#fff;padding:32px}
  h1{color:#0f172a;margin:0;font-size:22px}
  .sub{color:#64748b;margin:4px 0 24px;font-size:13px}
  .sec{margin-bottom:24px}
  .sec-t{font-size:15px;font-weight:700;color:#0f172a;border-bottom:2px solid #3b82f6;padding-bottom:4px;margin-bottom:12px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;font-size:13px}
  .grid .l{color:#64748b}
  .grid .v{font-weight:600}
  table.mt{width:100%;border-collapse:collapse;font-size:12px}
  table.mt th{background:#f1f5f9;padding:8px;text-align:left;border-bottom:2px solid #cbd5e1}
  table.mt td{padding:8px;border-bottom:1px solid #e2e8f0;vertical-align:top}
  .fb{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px;font-size:13px;margin-bottom:10px}
  .warn{background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:12px;font-size:11px;color:#1e40af;margin-top:16px}
  .ft{margin-top:24px;padding-top:16px;border-top:1px solid #cbd5e1;font-size:10px;color:#94a3b8;text-align:center}
</style>
</head>
<body>
<div class="container">
  <h1>Relatório MINI 5.0.0</h1>
  <p class="sub">Mini International Neuropsychiatric Interview &middot; NeuroFlow AI</p>
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
  <div class="ft">Documento gerado pelo NeuroFlow AI<br/>Dados protegidos conforme LGPD (Lei nº 13.709/2018). Suporte à decisão clínica — Validação médica obrigatória.</div>
</div>
</body>
</html>`
}
