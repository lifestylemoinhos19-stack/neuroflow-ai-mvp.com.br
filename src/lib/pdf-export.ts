import { SessionWithRisk } from '@/services/sessions'
import {
  CLINIC_BRANDING,
  CLINICIAN_CREDENTIALS,
  getBrandHeaderHtml,
  getBrandFooterHtml,
  getBrandCss,
  getSignatureHtml,
} from '@/lib/clinic-branding'

function riskLabel(level: string | null): string {
  switch (level) {
    case 'high':
      return 'Risco Alto'
    case 'medium':
      return 'Risco Médio'
    case 'low':
      return 'Risco Baixo'
    default:
      return 'N/A'
  }
}

function riskColor(level: string | null): string {
  switch (level) {
    case 'high':
      return '#dc2626'
    case 'medium':
      return '#d97706'
    case 'low':
      return '#16a34a'
    default:
      return '#64748b'
  }
}

export function exportReport(sessions: SessionWithRisk[]): void {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório NeuroFlow AI</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
  h1 { color: ${CLINIC_BRANDING.colors.primary}; margin-bottom: 4px; }
  .subtitle { color: #64748b; margin-bottom: 24px; }
  .session { margin-bottom: 20px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; }
  .session h2 { margin: 0 0 8px; font-size: 18px; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; color: white; }
  .stat { display: inline-block; margin-right: 16px; }
  .stat strong { font-size: 20px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
  th { background: #f8fafc; }
  .clinical-footer { text-align: center; font-weight: bold; font-size: 12px; padding: 16px 0; margin-top: 32px; border-top: 2px solid ${CLINIC_BRANDING.colors.primary}; color: ${CLINIC_BRANDING.colors.primary}; }
  ${getBrandCss()}
  @media print {
    body { padding-bottom: 80px; }
  }
</style>
</head>
<body>
  ${getBrandHeaderHtml()}
  <h1>Relatório NeuroFlow AI</h1>
  <p class="subtitle">Relatório de Anamnese e Avaliação Neurológica &middot; ${new Date().toLocaleString('pt-BR')}</p>
  ${
    sessions.length === 0
      ? '<p>Nenhuma sessão encontrada.</p>'
      : sessions
          .map(
            (s) => `
  <div class="session">
    <h2>Sessão ${s.status === 'completed' ? 'Concluída' : 'Em Progresso'}</h2>
    <p>Início: ${new Date(s.started_at).toLocaleString('pt-BR')}${s.completed_at ? ' | Conclusão: ' + new Date(s.completed_at).toLocaleString('pt-BR') : ''}</p>
    ${s.riskLevel ? `<span class="badge" style="background:${riskColor(s.riskLevel)}">${riskLabel(s.riskLevel)}</span>` : ''}
    <table>
      ${s.mchatScore !== null ? `<tr><th>M-CHAT-R (Autismo)</th><td>Pontuação: ${s.mchatScore}/20 &mdash; ${riskLabel(s.riskLevel)}</td></tr>` : ''}
      ${s.snapivInattention !== null ? `<tr><th>SNAP-IV Desatenção</th><td>Média: ${s.snapivInattention.toFixed(2)} / 3.00</td></tr>` : ''}
      ${s.snapivHyperactivity !== null ? `<tr><th>SNAP-IV Hiperatividade</th><td>Média: ${s.snapivHyperactivity.toFixed(2)} / 3.00</td></tr>` : ''}
      <tr><th>Total de Respostas</th><td>${s.responseCount}</td></tr>
    </table>
  </div>`,
          )
          .join('')
  }
  <p style="margin-top:32px;color:#94a3b8;font-size:12px;">Documento gerado pelo NeuroFlow AI. Dados protegidos conforme LGPD (Lei nº 13.709/2018).</p>
  ${getSignatureHtml(undefined, sessions[0]?.id)}
  <div class="clinical-footer">Suporte à decisão clínica — Validação médica obrigatória</div>
  ${getBrandFooterHtml()}
</body>
</html>`

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 300)
  }
}
