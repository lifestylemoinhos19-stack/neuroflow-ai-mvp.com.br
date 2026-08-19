import { jsPDF } from 'jspdf'
import type { MiniReportData } from '@/services/mini-report'
import { CLINIC_BRANDING, CLINICIAN_CREDENTIALS, getValidationUrl } from '@/lib/clinic-branding'
import {
  generateNeuropsychReport,
  type MiniModuleSummary,
  type NeuropsychContext,
  NEUROPSYCH_DISCLAIMER,
} from '@/lib/neuropsych-evaluation'

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

/** QR Code apontando para a URL de validação da sessão. */
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

export async function exportMiniPdf(report: MiniReportData): Promise<void> {
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
  const writeLabel = (label: string, value: string) => {
    ensureSpace(6)
    doc.setFont('helvetica', 'bold')
    doc.text(label, marginX, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, marginX + 42, y)
    y += 6
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

  // --- Mapeia resultados MINI para o formato da engine ---
  const miniResults: MiniModuleSummary[] = report.moduleResults
    .filter((r) => r.isPositive)
    .map((r) => ({
      letter: r.letter,
      title: r.title,
      status: r.label,
      details: r.details,
    }))

  // Módulos do MINI não geram interpretação rica de escalas, mas o resumo
  // clínico do MINI e a interpretação salva entram como história/queixa.
  const queixa =
    report.clinicalSummary ||
    `Avaliação MINI 5.0.0 aplicada. ${
      miniResults.length > 0
        ? `${miniResults.length} módulo(s) com resultado positivo.`
        : 'Nenhum módulo positivo identificado.'
    }`

  const historia = [
    `Protocolo: ${report.protocol || '—'}`,
    `Entrevistador: ${report.interviewerName || '—'}`,
    `Início: ${fmtTime(report.session.started_at)} | Fim: ${fmtTime(report.session.completed_at)} | Duração: ${fmtDuration(report.session.started_at, report.session.completed_at)}`,
    report.clinicalFeedback?.admin_edited_interpretation
      ? `Interpretação do profissional: ${report.clinicalFeedback.admin_edited_interpretation}`
      : null,
    report.clinicalFeedback?.system_suggestion
      ? `Sugestão do sistema: ${report.clinicalFeedback.system_suggestion}`
      : null,
  ]
    .filter(Boolean)
    .join('\n')

  const ctx: NeuropsychContext = {
    patient: {
      iniciais: computeInitials(report.patient?.fullName),
      fullName: report.patient?.fullName,
      birthDate: report.patient?.birthDate ?? null,
      sexo: '—',
      escolaridade: '—',
    },
    professional: {
      nome: CLINICIAN_CREDENTIALS.name,
      registro: `${CLINICIAN_CREDENTIALS.crm} · ${CLINICIAN_CREDENTIALS.rqe}`,
      especialidade: 'Psiquiatria',
    },
    assessmentDate: report.session.started_at,
    scaleType: 'MINI 5.0.0',
    queixaPrincipal: queixa,
    historiaEvolucao: historia,
    miniResults,
    savedInterpretation: report.clinicalFeedback?.admin_edited_interpretation || null,
  }

  const neuropsych = generateNeuropsychReport(ctx)

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

  // --- DADOS FORNECIDOS ---
  writeVisualSeparator('DADOS FORNECIDOS PELO PROFISSIONAL')

  // Seção 1: IDENTIFICAÇÃO — substitui nome completo por iniciais.
  const sec1 = neuropsych.sections[0]
  writeSectionHeader(sec1.index, sec1.title)
  writeLabel('Paciente (iniciais):', computeInitials(report.patient?.fullName))
  writeLabel('Data de nascimento:', fmtDate(report.patient?.birthDate ?? null))
  writeLabel('Protocolo:', report.protocol || '—')
  writeLabel('Entrevistador:', report.interviewerName || '—')
  writeLabel('Data da avaliação:', fmtDate(report.session.started_at))
  writeLabel(
    'Profissional responsável:',
    `${CLINICIAN_CREDENTIALS.name} — ${CLINICIAN_CREDENTIALS.crm} · ${CLINICIAN_CREDENTIALS.rqe}`,
  )
  y += 2

  // Seções 2-5
  for (let i = 1; i < 5; i++) {
    const section = neuropsych.sections[i]
    writeSectionHeader(section.index, section.title)
    for (const line of section.lines) writeParagraph(line)
    y += 2
  }

  // --- Tabela de módulos (resultado detalhado do MINI) ---
  writeSectionHeader(5, 'INSTRUMENTOS APLICADOS (MÓDULOS MINI)')
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
  const [qrPng, sigImg] = await Promise.all([
    fetchQrCodePng(report.session.id),
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
  doc.text(`${CLINICIAN_CREDENTIALS.crm} · ${CLINICIAN_CREDENTIALS.rqe}`, sigBlockX, y + 28)
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

  const safeName = computeInitials(report.patient?.fullName).replace(/[^a-zA-Z0-9]/g, '_')
  doc.save(`laudo-mini-${safeName}.pdf`)
}

/**
 * Exporta a versão JSON do laudo MINI padronizado (para integração).
 */
export async function exportMiniJson(report: MiniReportData) {
  const miniResults: MiniModuleSummary[] = report.moduleResults
    .filter((r) => r.isPositive)
    .map((r) => ({
      letter: r.letter,
      title: r.title,
      status: r.label,
      details: r.details,
    }))

  const queixa =
    report.clinicalSummary ||
    `Avaliação MINI 5.0.0 aplicada. ${
      miniResults.length > 0
        ? `${miniResults.length} módulo(s) com resultado positivo.`
        : 'Nenhum módulo positivo identificado.'
    }`

  const historia = [
    `Protocolo: ${report.protocol || '—'}`,
    `Entrevistador: ${report.interviewerName || '—'}`,
    `Início: ${fmtTime(report.session.started_at)} | Fim: ${fmtTime(report.session.completed_at)}`,
    report.clinicalFeedback?.admin_edited_interpretation
      ? `Interpretação do profissional: ${report.clinicalFeedback.admin_edited_interpretation}`
      : null,
  ]
    .filter(Boolean)
    .join('\n')

  const ctx: NeuropsychContext = {
    patient: {
      iniciais: computeInitials(report.patient?.fullName),
      fullName: report.patient?.fullName,
      birthDate: report.patient?.birthDate ?? null,
      sexo: '—',
      escolaridade: '—',
    },
    professional: {
      nome: CLINICIAN_CREDENTIALS.name,
      registro: `${CLINICIAN_CREDENTIALS.crm} · ${CLINICIAN_CREDENTIALS.rqe}`,
      especialidade: 'Psiquiatria',
    },
    assessmentDate: report.session.started_at,
    scaleType: 'MINI 5.0.0',
    queixaPrincipal: queixa,
    historiaEvolucao: historia,
    miniResults,
    savedInterpretation: report.clinicalFeedback?.admin_edited_interpretation || null,
  }

  return generateNeuropsychReport(ctx).json
}
