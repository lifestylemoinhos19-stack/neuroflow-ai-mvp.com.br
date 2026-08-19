import { jsPDF } from 'jspdf'
import type { MiniReportData } from '@/services/mini-report'
import { CLINIC_BRANDING, CLINICIAN_CREDENTIALS, getValidationUrl } from '@/lib/clinic-branding'

/**
 * Carrega uma imagem (URL remota ou asset importado) e devolve um data URL PNG
 * pronto para `doc.addImage`. Retorna `null` em caso de falha (logo/QR opcional).
 *
 * Diferente da versão anterior (que usava `window.open` + `document.write` em
 * `about:blank`), aqui carregamos a imagem no documento atual, onde URLs
 * relativas/locais funcionam normalmente.
 */
async function fetchImageAsPngData(
  url: string,
): Promise<{ dataUrl: string; format: 'PNG' | 'JPEG' } | null> {
  try {
    return await new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || img.width || 300
        canvas.height = img.naturalHeight || img.height || 300
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(null)
        ctx.drawImage(img, 0, 0)
        resolve({ dataUrl: canvas.toDataURL('image/png'), format: 'PNG' })
      }
      img.onerror = () => resolve(null)
      img.src = url
    })
  } catch {
    return null
  }
}

/**
 * Gera um QR Code apontando para a URL de validação da sessão e devolve um
 * data URL PNG (usando a mesma API pública já adotada em clinic-branding). Em
 * caso de falha de rede retorna `null` e o laudo segue sem o QR.
 */
async function fetchQrCodePng(sessionId: string): Promise<string | null> {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=2&data=${encodeURIComponent(
    getValidationUrl(sessionId),
  )}`
  const data = await fetchImageAsPngData(url)
  return data?.dataUrl ?? null
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

export async function exportMiniPdf(report: MiniReportData): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 18
  let y = 18
  const c = CLINIC_BRANDING.colors
  const positive = report.moduleResults.filter((r) => r.isPositive)
  const fb = report.clinicalFeedback
  const hasInterpretation = fb?.system_suggestion || fb?.admin_edited_interpretation

  // --- Header: logo + nome da clínica ---
  try {
    const logoData = await fetchImageAsPngData(CLINIC_BRANDING.logoUrl)
    if (logoData) {
      doc.addImage(logoData.dataUrl, logoData.format, marginX, y, 24, 16)
    }
  } catch {
    /* logo fallback */
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(0x7b, 0x5b, 0x3a)
  doc.text(CLINIC_BRANDING.name, marginX + 28, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(0x6d, 0x5d, 0x4b)
  doc.text(
    'Relatório MINI 5.0.0 — Mini International Neuropsychiatric Interview',
    marginX + 28,
    y + 12,
  )

  doc.setDrawColor(0xc4, 0xa3, 0x5a)
  doc.setLineWidth(0.5)
  doc.line(marginX, y + 18, pageWidth - marginX, y + 18)
  y += 24

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 24) {
      doc.addPage()
      y = 18
    }
  }
  const writeHeading = (text: string) => {
    ensureSpace(10)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(0x7b, 0x5b, 0x3a)
    doc.text(text, marginX, y)
    doc.setDrawColor(0xc4, 0xa3, 0x5a)
    doc.setLineWidth(0.3)
    doc.line(marginX, y + 2, pageWidth - marginX, y + 2)
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(0x3e, 0x27, 0x23)
  }
  const writeParagraph = (text: string, gap = 4) => {
    const lines = doc.splitTextToSize(text, pageWidth - marginX * 2)
    ensureSpace(lines.length * 5 + 2)
    doc.text(lines, marginX, y)
    y += lines.length * 5 + gap
  }
  const writeBullet = (text: string) => {
    const indent = marginX + 4
    const lines = doc.splitTextToSize(text, pageWidth - marginX * 2 - 6)
    ensureSpace(lines.length * 5 + 1)
    doc.text('•', marginX, y)
    doc.text(lines, indent, y)
    y += lines.length * 5 + 1
  }

  // --- Identificação do Entrevistado ---
  writeHeading('Identificação do Entrevistado')
  const idRows: [string, string][] = [
    ['Nome:', report.patient?.fullName || '—'],
    ['Protocolo:', report.protocol || '—'],
    ['Data de Nascimento:', report.patient?.birthDate ? fmtDate(report.patient.birthDate) : '—'],
    ['Entrevistador:', report.interviewerName || '—'],
    ['Data da Entrevista:', fmtDate(report.session.started_at)],
    ['Início:', fmtTime(report.session.started_at)],
    ['Fim:', fmtTime(report.session.completed_at)],
    ['Duração:', fmtDuration(report.session.started_at, report.session.completed_at)],
  ]
  idRows.forEach(([label, value]) => {
    ensureSpace(6)
    doc.setFont('helvetica', 'bold')
    doc.text(label, marginX, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, marginX + 42, y)
    y += 6
  })
  y += 3

  // --- Achados positivos ---
  if (positive.length > 0) {
    writeHeading(`Achados Positivos (${positive.length})`)
    for (const r of positive) {
      writeBullet(`${r.letter} — ${r.title}: ${r.label} (${r.details}).`)
    }
    y += 2
  }

  // --- Resultados detalhados (tabela) ---
  writeHeading('Resultados Detalhados (Módulos A–P)')
  const colX = [marginX, marginX + 12, marginX + 28, marginX + 90, pageWidth - marginX]
  const rowH = 6
  const drawTableRow = (cells: string[], bold = false) => {
    ensureSpace(rowH)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(9)
    cells.forEach((cell, i) => {
      const maxW = colX[i + 1] - colX[i] - 2
      const lines = doc.splitTextToSize(cell, maxW)
      doc.text(lines.slice(0, 2), colX[i] + 1, y + 4)
    })
    doc.setDrawColor(0xe2, 0xe8, 0xf0)
    doc.setLineWidth(0.1)
    doc.line(marginX, y + rowH, pageWidth - marginX, y + rowH)
    y += rowH
  }
  drawTableRow(['Mód', 'Descrição', 'Resultado', 'Detalhes'], true)
  for (const r of report.moduleResults) {
    drawTableRow([r.letter, r.title, r.label, r.details])
  }
  y += 4

  // --- Resumo clínico ---
  if (report.clinicalSummary) {
    writeHeading('Resumo Clínico')
    writeParagraph(report.clinicalSummary)
  }

  // --- Interpretação clínica ---
  if (hasInterpretation) {
    writeHeading('Interpretação Clínica')
    if (fb?.system_suggestion) writeParagraph(`Sugestão do Sistema: ${fb.system_suggestion}`)
    if (fb?.admin_edited_interpretation)
      writeParagraph(`Interpretação do Profissional: ${fb.admin_edited_interpretation}`)
  }

  // --- Aviso ---
  ensureSpace(12)
  y += 2
  doc.setFillColor(0xfa, 0xf5, 0xeb)
  doc.setDrawColor(0xc4, 0xa3, 0x5a)
  doc.roundedRect(marginX, y, pageWidth - marginX * 2, 12, 2, 2, 'S')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(0x7b, 0x5b, 0x3a)
  const warnLines = doc.splitTextToSize(
    'AVISO: Este instrumento é uma ferramenta de triagem e não substitui a avaliação clínica profissional. O diagnóstico definitivo requer avaliação presencial especializada.',
    pageWidth - marginX * 2 - 6,
  )
  doc.text(warnLines, marginX + 3, y + 5)
  y += 16

  // --- Assinatura + QR Code ---
  ensureSpace(40)
  y += 6
  const qrPng = await fetchQrCodePng(report.session.id)
  const sigBlockX = marginX + 40
  if (qrPng) {
    try {
      doc.addImage(qrPng, 'PNG', marginX, y, 28, 28)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(0x6d, 0x5d, 0x4b)
      doc.text(doc.splitTextToSize('Escaneie para verificar autenticidade', 28), marginX, y + 31)
    } catch {
      /* qr fallback */
    }
  }
  doc.setDrawColor(0x6d, 0x5d, 0x4b)
  doc.setLineWidth(0.3)
  doc.line(sigBlockX, y + 18, sigBlockX + 90, y + 18)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(0x3e, 0x27, 0x23)
  doc.text(CLINICIAN_CREDENTIALS.name, sigBlockX, y + 23)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(0x6d, 0x5d, 0x4b)
  doc.text(`${CLINICIAN_CREDENTIALS.crm} · ${CLINICIAN_CREDENTIALS.rqe}`, sigBlockX, y + 28)
  doc.text(`Assinado digitalmente em ${new Date().toLocaleString('pt-BR')}`, sigBlockX, y + 33)

  // --- Rodapé (LGPD) ---
  const footerY = pageHeight - 12
  doc.setDrawColor(0x7b, 0x5b, 0x3a)
  doc.setLineWidth(0.4)
  doc.line(marginX, footerY, pageWidth - marginX, footerY)
  doc.setFontSize(7)
  doc.setTextColor(0x6d, 0x5d, 0x4b)
  doc.text(
    `${CLINIC_BRANDING.name} — ${CLINIC_BRANDING.address} | WhatsApp: ${CLINIC_BRANDING.whatsapp}`,
    marginX,
    footerY + 4,
  )
  doc.text(
    `Emitido em ${new Date().toLocaleString('pt-BR')} · Documento em conformidade com a LGPD (Lei nº 13.709/2018).`,
    marginX,
    footerY + 8,
  )

  const safeName = (report.patient?.fullName || 'entrevistado').replace(/[^a-zA-Z0-9]/g, '_')
  doc.save(`laudo-mini-${safeName}.pdf`)
}
