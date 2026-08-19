import { jsPDF } from 'jspdf'
import { Mini500ModuleResult } from '@/lib/mini500-scoring'
import { ClinicalInterpretation } from '@/lib/mini500-interpretation'
import { Mini500PatientInfo } from '@/services/mini500-service'
import { CLINIC_BRANDING, CLINICIAN_CREDENTIALS, getValidationUrl } from '@/lib/clinic-branding'

export interface Mini500ExportData {
  patientInfo: Mini500PatientInfo
  results: Mini500ModuleResult[]
  interpretations: ClinicalInterpretation[]
  alerts: string[]
  summary: string
}

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
 * Gera um QR Code apontando para a URL de validação do protocolo e devolve um
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

export async function exportMini500Pdf(data: Mini500ExportData): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 18
  let y = 18
  const c = CLINIC_BRANDING.colors

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

  // --- Identificação ---
  writeHeading('Identificação')
  const idRows: [string, string][] = [
    ['Nome:', data.patientInfo.name || '—'],
    ['Protocolo:', data.patientInfo.protocol || '—'],
    ['Entrevistador:', data.patientInfo.interviewerName || '—'],
    ['Data da entrevista:', data.patientInfo.interviewDate || '—'],
    ['Início:', data.patientInfo.startTime || '—'],
    ['Fim:', data.patientInfo.endTime || '—'],
  ]
  idRows.forEach(([label, value]) => {
    ensureSpace(6)
    doc.setFont('helvetica', 'bold')
    doc.text(label, marginX, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, marginX + 38, y)
    y += 6
  })
  y += 3

  // --- Alertas críticos ---
  if (data.alerts.length > 0) {
    writeHeading(`Alertas Críticos (${data.alerts.length})`)
    for (const a of data.alerts) writeBullet(a)
    y += 2
  }

  // --- Diagnósticos positivos ---
  const positive = data.results.filter((r) => r.isPositive)
  if (positive.length > 0) {
    writeHeading(`Diagnósticos Positivos (${positive.length})`)
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
  for (const r of data.results) {
    drawTableRow([r.letter, r.title, r.label, r.details])
  }
  y += 4

  // --- Interpretação clínica ---
  if (data.interpretations.length > 0) {
    writeHeading('Interpretação Clínica')
    for (const i of data.interpretations) {
      writeParagraph(`${i.moduleLetter} — ${i.title} (${i.status})`)
      writeParagraph(i.interpretation, 2)
      writeParagraph(`Conduta: ${i.referral}`, 4)
      y += 1
    }
  }

  // --- Resumo clínico ---
  if (data.summary) {
    writeHeading('Resumo Clínico')
    writeParagraph(data.summary)
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
  const protocol = data.patientInfo.protocol || ''
  const qrPng = protocol ? await fetchQrCodePng(protocol) : null
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

  const safeName = (data.patientInfo.name || 'entrevistado').replace(/[^a-zA-Z0-9]/g, '_')
  doc.save(`laudo-mini-${safeName}.pdf`)
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
