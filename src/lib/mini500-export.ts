import { jsPDF } from 'jspdf'
import { Mini500ModuleResult } from '@/lib/mini500-scoring'
import { ClinicalInterpretation } from '@/lib/mini500-interpretation'
import { Mini500PatientInfo } from '@/services/mini500-service'
import { CLINIC_BRANDING, CLINICIAN_CREDENTIALS, getValidationUrl } from '@/lib/clinic-branding'
import {
  generateNeuropsychReport,
  type MiniModuleSummary,
  type NeuropsychContext,
  NEUROPSYCH_DISCLAIMER,
} from '@/lib/neuropsych-evaluation'

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

/** QR Code apontando para a URL de validação do protocolo. */
async function fetchQrCodePng(sessionId: string): Promise<string | null> {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=2&data=${encodeURIComponent(
    getValidationUrl(sessionId),
  )}`
  const data = await fetchImageAsPngData(url)
  return data?.dataUrl ?? null
}

/** Converte hex (#7B5B3A) para [r, g, b]. */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const n = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h,
    16,
  )
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Calcula iniciais a partir do nome completo do paciente. */
function computeInitials(name?: string | null): string {
  if (!name) return '—'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '—'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase() + '.'
  return `${parts[0].charAt(0).toUpperCase()}.${parts[parts.length - 1].charAt(0).toUpperCase()}.`
}

/** Monta o contexto para a engine de avaliação neuropsiquiátrica. */
function buildNeuropsychContext(data: Mini500ExportData): NeuropsychContext {
  const miniResults: MiniModuleSummary[] = data.results
    .filter((r) => r.isPositive)
    .map((r) => ({
      letter: r.letter,
      title: r.title,
      status: r.label,
      details: r.details,
    }))

  const queixa = data.summary || 'Não relatada.'

  const historia = 'Sem histórico prévio adicional informado.'

  return {
    patient: {
      iniciais: computeInitials(data.patientInfo.name),
      fullName: data.patientInfo.name,
      sexo: '—',
      escolaridade: '—',
    },
    professional: {
      nome: CLINICIAN_CREDENTIALS.name,
      registro: `${CLINICIAN_CREDENTIALS.crm} / ${CLINICIAN_CREDENTIALS.rqe}`,
      especialidade: 'Psiquiatria',
    },
    protocol: data.patientInfo.protocol || null,
    interviewerName: data.patientInfo.interviewerName || null,
    startTime: data.patientInfo.startTime || null,
    endTime: data.patientInfo.endTime || null,
    assessmentDate: data.patientInfo.interviewDate || null,
    scaleType: 'MINI 5.0.0',
    alerts: data.alerts,
    queixaPrincipal: queixa,
    historiaEvolucao: historia,
    miniResults,
    savedInterpretation: data.summary || null,
  }
}

export async function exportMini500Pdf(data: Mini500ExportData): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 18
  let y = 18
  const c = CLINIC_BRANDING.colors
  const primary = hexToRgb(c.primary)
  const secondary = hexToRgb(c.secondary)
  const medium = hexToRgb(c.medium)
  const dark = hexToRgb(c.dark)
  const accent = hexToRgb(c.accent)

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
  doc.setTextColor(primary[0], primary[1], primary[2])
  doc.text(CLINIC_BRANDING.name, marginX + 28, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(medium[0], medium[1], medium[2])
  doc.text('Laudo de Avaliação Neuropsiquiátrica — MINI 5.0.0', marginX + 28, y + 12)

  doc.setDrawColor(secondary[0], secondary[1], secondary[2])
  doc.setLineWidth(0.5)
  doc.line(marginX, y + 18, pageWidth - marginX, y + 18)
  y += 24

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 24) {
      doc.addPage()
      y = 18
    }
  }
  const writeSectionHeader = (index: number, text: string) => {
    ensureSpace(10)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(primary[0], primary[1], primary[2])
    doc.text(`${index}. ${text}`, marginX, y)
    doc.setDrawColor(secondary[0], secondary[1], secondary[2])
    doc.setLineWidth(0.3)
    doc.line(marginX, y + 2, pageWidth - marginX, y + 2)
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(dark[0], dark[1], dark[2])
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
  const writeLabel = (label: string, value: string, valueIndent = 42) => {
    ensureSpace(6)
    doc.setFont('helvetica', 'bold')
    doc.text(label, marginX, y)
    doc.setFont('helvetica', 'normal')
    const maxValW = pageWidth - marginX * 2 - valueIndent
    const valLines = doc.splitTextToSize(value, maxValW)
    doc.text(valLines, marginX + valueIndent, y)
    y += Math.max(6, valLines.length * 4.5 + 1.5)
  }
  const writeVisualSeparator = (label: string) => {
    ensureSpace(10)
    doc.setFillColor(accent[0], accent[1], accent[2])
    doc.setDrawColor(secondary[0], secondary[1], secondary[2])
    doc.roundedRect(marginX, y, pageWidth - marginX * 2, 8, 1, 1, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(primary[0], primary[1], primary[2])
    doc.text(label, marginX + 3, y + 5.5)
    y += 12
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(dark[0], dark[1], dark[2])
  }

  const neuropsych = generateNeuropsychReport(buildNeuropsychContext(data))

  // --- Disclaimer no INÍCIO ---
  ensureSpace(16)
  doc.setFillColor(accent[0], accent[1], accent[2])
  doc.setDrawColor(secondary[0], secondary[1], secondary[2])
  doc.roundedRect(marginX, y, pageWidth - marginX * 2, 14, 2, 2, 'S')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(primary[0], primary[1], primary[2])
  const introLines = doc.splitTextToSize(NEUROPSYCH_DISCLAIMER, pageWidth - marginX * 2 - 6)
  doc.text(introLines, marginX + 3, y + 5)
  y += 18

  // --- Alertas críticos do MINI (renderizados antes das seções) ---
  if (data.alerts.length > 0) {
    writeVisualSeparator('ALERTAS CRÍTICOS IDENTIFICADOS')
    for (const a of data.alerts) writeBullet(a)
    y += 2
  }

  // --- DADOS FORNECIDOS ---
  writeVisualSeparator('DADOS FORNECIDOS PELO PROFISSIONAL')

  // Seção 1: IDENTIFICAÇÃO
  const sec1 = neuropsych.sections[0]
  writeSectionHeader(sec1.index, sec1.title)
  writeLabel('Paciente (iniciais):', computeInitials(data.patientInfo.name), 46)
  writeLabel('Protocolo:', data.patientInfo.protocol || '—', 46)
  writeLabel('Entrevistador:', data.patientInfo.interviewerName || '—', 46)
  writeLabel('Data da avaliação:', data.patientInfo.interviewDate || '—', 46)
  if (data.patientInfo.startTime || data.patientInfo.endTime) {
    writeLabel(
      'Horário:',
      `Início: ${data.patientInfo.startTime || '—'} | Fim: ${data.patientInfo.endTime || '—'}`,
      46,
    )
  }
  writeLabel(
    'Profissional responsável:',
    `${CLINICIAN_CREDENTIALS.name} — ${CLINICIAN_CREDENTIALS.crm} / ${CLINICIAN_CREDENTIALS.rqe}`,
    46,
  )
  y += 2

  // Seções 2-4
  for (let i = 1; i < 4; i++) {
    const section = neuropsych.sections[i]
    writeSectionHeader(section.index, section.title)
    for (const line of section.lines) writeParagraph(line)
    y += 2
  }

  // Seção 5: tabela de módulos do MINI (instrumentos aplicados)
  writeSectionHeader(5, 'INSTRUMENTOS APLICADOS (MÓDULOS MINI 5.0.0)')
  const colX = [marginX, marginX + 14, marginX + 65, marginX + 105, pageWidth - marginX]
  const rowH = 6.5
  const drawTableRow = (cells: string[], isHeader = false) => {
    ensureSpace(rowH + 1)
    if (isHeader) {
      doc.setFillColor(accent[0], accent[1], accent[2])
      doc.rect(marginX, y, pageWidth - marginX * 2, rowH, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(primary[0], primary[1], primary[2])
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(dark[0], dark[1], dark[2])
    }
    cells.forEach((cell, i) => {
      const maxW = colX[i + 1] - colX[i] - 2
      const lines = doc.splitTextToSize(cell, maxW)
      doc.text(lines.slice(0, 2), colX[i] + 1.5, y + 4.2)
    })
    doc.setDrawColor(secondary[0], secondary[1], secondary[2])
    doc.setLineWidth(isHeader ? 0.3 : 0.1)
    doc.line(marginX, y + rowH, pageWidth - marginX, y + rowH)
    y += rowH
  }
  drawTableRow(['Mód', 'Descrição', 'Resultado', 'Detalhes / Critérios'], true)
  for (const r of data.results) {
    drawTableRow([r.letter, r.title, r.label, r.details || '—'])
  }
  y += 4

  // --- INTERPRETAÇÃO ASSISTIDA ---
  writeVisualSeparator('INTERPRETAÇÃO ASSISTIDA (NÃO CONSTITUI DIAGNÓSTICO)')

  // Seções 6 e 7
  for (let i = 5; i < 7; i++) {
    const section = neuropsych.sections[i]
    writeSectionHeader(section.index, section.title)
    if (section.index === 7) {
      for (const line of section.lines) writeBullet(line)
    } else {
      for (const line of section.lines) writeParagraph(line)
    }
    y += 2
  }

  // --- LACUNAS E ENCAMINHAMENTOS ---
  writeVisualSeparator('LACUNAS, ITENS A CONFIRMAR E ENCAMINHAMENTOS')

  // Seções 8 e 9
  for (let i = 7; i < 9; i++) {
    const section = neuropsych.sections[i]
    writeSectionHeader(section.index, section.title)
    for (const line of section.lines) writeBullet(line)
    y += 2
  }

  // --- Alerta de risco iminente (se houver) ---
  if (neuropsych.riscoIminente) {
    ensureSpace(16)
    doc.setFillColor(0xfd, 0xe6, 0xe6)
    doc.setDrawColor(0xdc, 0x26, 0x26)
    doc.roundedRect(marginX, y, pageWidth - marginX * 2, 14, 2, 2, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(0xb9, 0x1c, 0x1c)
    const alertLines = doc.splitTextToSize(neuropsych.riscoIminente, pageWidth - marginX * 2 - 6)
    doc.text(alertLines, marginX + 3, y + 5)
    y += 18
  }

  // --- Seção 10: LIMITAÇÕES ---
  const sec10 = neuropsych.sections[9]
  writeSectionHeader(sec10.index, sec10.title)
  ensureSpace(16)
  doc.setFillColor(accent[0], accent[1], accent[2])
  doc.setDrawColor(secondary[0], secondary[1], secondary[2])
  doc.roundedRect(marginX, y, pageWidth - marginX * 2, 14, 2, 2, 'S')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(primary[0], primary[1], primary[2])
  const finalDisclaimerLines = doc.splitTextToSize(
    NEUROPSYCH_DISCLAIMER,
    pageWidth - marginX * 2 - 6,
  )
  doc.text(finalDisclaimerLines, marginX + 3, y + 5)
  y += 18

  // --- Assinatura + QR Code ---
  ensureSpace(40)
  y += 6
  const protocol = data.patientInfo.protocol || ''
  const [qrPng, sigImg] = await Promise.all([
    protocol ? fetchQrCodePng(protocol) : Promise.resolve(null),
    fetchImageAsPngData(CLINICIAN_CREDENTIALS.signatureUrl),
  ])
  const sigBlockX = marginX + 40
  if (qrPng) {
    try {
      doc.addImage(qrPng, 'PNG', marginX, y, 28, 28)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(medium[0], medium[1], medium[2])
      doc.text(doc.splitTextToSize('Escaneie para verificar autenticidade', 28), marginX, y + 31)
    } catch {
      /* qr fallback */
    }
  }
  // Linha horizontal (assinatura digital)
  doc.setDrawColor(medium[0], medium[1], medium[2])
  doc.setLineWidth(0.3)
  doc.line(sigBlockX, y + 18, sigBlockX + 90, y + 18)
  // Imagem da assinatura sobre a linha horizontal, centralizada
  if (sigImg) {
    try {
      const sigW = 50
      const sigH = 14
      const sigX = sigBlockX + (90 - sigW) / 2
      doc.addImage(sigImg.dataUrl, sigImg.format, sigX, y + 18 - sigH, sigW, sigH)
    } catch {
      /* signature image fallback */
    }
  }
  // Abaixo da linha: NOME (Rose Mary Alves) em negrito
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(dark[0], dark[1], dark[2])
  doc.text(CLINICIAN_CREDENTIALS.name, sigBlockX, y + 23)
  // Abaixo: CRM + RQE
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(medium[0], medium[1], medium[2])
  doc.text(`${CLINICIAN_CREDENTIALS.crm} / ${CLINICIAN_CREDENTIALS.rqe}`, sigBlockX, y + 28)
  // Abaixo: "Assinado digitalmente em [data] às [hora]"
  const sigNow = new Date()
  const sigDate = sigNow.toLocaleDateString('pt-BR')
  const sigTime = sigNow.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  doc.text(`Assinado digitalmente em ${sigDate} às ${sigTime}`, sigBlockX, y + 33)

  // --- Rodapé (LGPD) ---
  const footerY = pageHeight - 12
  doc.setDrawColor(primary[0], primary[1], primary[2])
  doc.setLineWidth(0.4)
  doc.line(marginX, footerY, pageWidth - marginX, footerY)
  doc.setFontSize(7)
  doc.setTextColor(medium[0], medium[1], medium[2])
  doc.text(
    `${CLINIC_BRANDING.name} — ${CLINIC_BRANDING.address} | WhatsApp: ${CLINIC_BRANDING.whatsapp}`,
    marginX,
    footerY + 4,
  )
  doc.text(
    `Emitido em ${new Date().toLocaleString('pt-BR')} · Documento em conformidade com a LGPD (Lei nº 13.709/2018). Paciente identificado apenas por iniciais.`,
    marginX,
    footerY + 8,
  )

  const safeName = computeInitials(data.patientInfo.name).replace(/[^a-zA-Z0-9]/g, '_')
  doc.save(`laudo-mini-${safeName}.pdf`)
}

/**
 * Exporta o TXT do laudo MINI no formato de 10 seções padronizado.
 * Usa a engine neuropsych-evaluation para consistência com o PDF.
 */
export function exportMini500Txt(data: Mini500ExportData): void {
  const neuropsych = generateNeuropsychReport(buildNeuropsychContext(data))

  const lines: string[] = []
  lines.push('LAUDO DE AVALIAÇÃO NEUROPSIQUIÁTRICA — MINI 5.0.0', '='.repeat(60), '')
  lines.push(`Clínica: ${CLINIC_BRANDING.name}`, '')
  lines.push(NEUROPSYCH_DISCLAIMER, '', '='.repeat(60), '')

  // Alertas críticos
  if (data.alerts.length > 0) {
    lines.push('ALERTAS CRÍTICOS IDENTIFICADOS', '-'.repeat(40))
    data.alerts.forEach((a) => lines.push(`⚠ ${a}`))
    lines.push('')
  }

  // Risco iminente
  if (neuropsych.riscoIminente) {
    lines.push('⚠ RISCO IMINENTE', '-'.repeat(40))
    lines.push(neuropsych.riscoIminente)
    lines.push('')
  }

  // 10 seções
  for (const section of neuropsych.sections) {
    lines.push(`${section.index}. ${section.title}`, '-'.repeat(40))
    section.lines.forEach((l) => lines.push(`  ${l}`))
    lines.push('')
  }

  lines.push('PROFISSIONAL RESPONSÁVEL', '-'.repeat(40))
  lines.push(
    `${CLINICIAN_CREDENTIALS.name} — ${CLINICIAN_CREDENTIALS.crm} / ${CLINICIAN_CREDENTIALS.rqe}`,
  )

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeName = computeInitials(data.patientInfo.name).replace(/[^a-zA-Z0-9]/g, '_')
  a.download = `laudo-mini-${safeName}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Exporta a versão JSON do laudo MINI 5.0.0 padronizado (para integração).
 */
export function exportMini500Json(data: Mini500ExportData) {
  return generateNeuropsychReport(buildNeuropsychContext(data)).json
}
