import { jsPDF } from 'jspdf'
import { supabase } from '@/lib/supabase/client'
import { getGuestFull, type GuestFull } from '@/services/guest-patient'
import { translateStatus } from '@/services/admin-sessions'
import {
  getSessionInterpretation,
  saveInterpretation,
  type InterpretationResult,
} from '@/services/clinical-interpretation'
import { CLINIC_BRANDING, CLINICIAN_CREDENTIALS, getValidationUrl } from '@/lib/clinic-branding'
import {
  generateNeuropsychReport,
  type NeuropsychContext,
  NEUROPSYCH_DISCLAIMER,
} from '@/lib/neuropsych-evaluation'

interface LaudoInput {
  // AdminTest
  testId: string
  type: string
  patientName: string
  startedAt: string
  status: string
  score: number | null
  guestId: string | null
}

interface LaudoContext {
  guest: GuestFull | null
  interpretation: string
  aiInterpretation: InterpretationResult | null
}

/**
 * Resolve the real `anamnesis_sessions.id` for a testagem.
 *
 * `testId` arriving from the admin test list can be either:
 *  - an `anamnesis_sessions.id` (orphan sessions / anamneses), or
 *  - a `scale_assignments.id` (PHQ-9, GAD-7, MINI, etc.).
 *
 * `clinical_feedback.session_id` and `anamnesis_responses.session_id` both
 * reference `anamnesis_sessions.id`, so for a scale_assignment we MUST fetch
 * its `session_id` column instead of using the assignment id directly.
 */
async function resolveRealSessionId(testId: string): Promise<{
  sessionId: string | null
  isAssignment: boolean
}> {
  const { data: session } = await supabase
    .from('anamnesis_sessions')
    .select('id')
    .eq('id', testId)
    .maybeSingle()
  if (session) return { sessionId: session.id, isAssignment: false }

  const { data: assignment } = await supabase
    .from('scale_assignments')
    .select('id, session_id, guest_id, scale_type')
    .eq('id', testId)
    .maybeSingle()
  if (assignment) {
    if (assignment.session_id) {
      return { sessionId: assignment.session_id, isAssignment: true }
    }

    if (assignment.guest_id && assignment.scale_type) {
      const normalizedScaleType = assignment.scale_type.toLowerCase().replace(/[-\s.]/g, '')

      const { data: orphanSession } = await supabase
        .from('anamnesis_sessions')
        .select('id')
        .eq('metadata->>guest_id', assignment.guest_id)
        .eq('metadata->>scaleType', normalizedScaleType)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (orphanSession) {
        return { sessionId: orphanSession.id, isAssignment: true }
      }
    }

    return { sessionId: null, isAssignment: true }
  }
  return { sessionId: null, isAssignment: false }
}

/**
 * Load extra context for the laudo: decrypted guest data + clinical feedback
 * interpretation + the rich AI interpretation (generated on the fly when no
 * feedback is saved). See original comment in laudo-pdf.ts for history.
 */
async function loadLaudoContext(guestId: string | null, testId: string): Promise<LaudoContext> {
  let guest: GuestFull | null = null
  if (guestId) {
    const { data } = await getGuestFull(guestId)
    guest = data
  }

  const { sessionId } = await resolveRealSessionId(testId)

  let interpretation = ''
  let aiInterpretation: InterpretationResult | null = null

  if (sessionId) {
    try {
      const { data: feedback } = await supabase
        .from('clinical_feedback')
        .select('admin_edited_interpretation, system_suggestion, comments')
        .eq('session_id', sessionId)
        .maybeSingle()
      if (feedback) {
        interpretation =
          feedback.admin_edited_interpretation ||
          feedback.system_suggestion ||
          feedback.comments ||
          ''
      }
    } catch {
      /* ignore */
    }
  }

  if (!interpretation && sessionId) {
    try {
      aiInterpretation = await getSessionInterpretation(sessionId)
    } catch {
      /* ignore */
    }

    if (aiInterpretation && aiInterpretation.hasScaleData) {
      try {
        await saveInterpretation(
          sessionId,
          aiInterpretation.suggestion,
          aiInterpretation.suggestion,
          aiInterpretation.phq9Score,
          aiInterpretation.gad7Score,
          aiInterpretation.cognitiveVrc,
          aiInterpretation.assqScore,
          aiInterpretation.snapIvScore,
          aiInterpretation.asrs18Score,
          aiInterpretation.mocaScore,
          aiInterpretation.meemScore,
          aiInterpretation.hamdScore,
          aiInterpretation.hamaScore,
          aiInterpretation.snapIvInattention,
          aiInterpretation.snapIvHyperactivity,
          aiInterpretation.globalSeverity,
        )
      } catch {
        /* ignore — non-fatal */
      }
    }
  }

  return { guest, interpretation, aiInterpretation }
}

/**
 * Load an image (URL remota ou asset importado) e devolve um data URL PNG
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

/**
 * Generate and download a PDF laudo for a completed testagem, using the
 * standardized 10-section playbook format (neuropsych-evaluation engine).
 */
export async function generateLaudoPDF(input: LaudoInput): Promise<void> {
  const { guest, interpretation, aiInterpretation } = await loadLaudoContext(
    input.guestId,
    input.testId,
  )

  const fullName = guest?.first_name
    ? `${guest.first_name} ${guest.last_name || ''}`.trim()
    : input.patientName

  // Patient data — only initials exposed in the report body.
  const iniciais = guest?.first_name
    ? `${guest.first_name.charAt(0).toUpperCase()}.${
        guest.last_name ? guest.last_name.charAt(0).toUpperCase() + '.' : ''
      }`
    : input.patientName
      ? `${input.patientName.trim().charAt(0).toUpperCase()}.`
      : '—'

  const idade = guest?.birth_date
    ? (() => {
        const b = new Date(guest.birth_date)
        if (isNaN(b.getTime())) return null
        const today = new Date()
        let age = today.getFullYear() - b.getFullYear()
        const m = today.getMonth() - b.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--
        return age >= 0 ? age : null
      })()
    : null

  // Queixa principal / história — se não houver nada melhor, usa a escala
  // aplicada como contexto mínimo (sem inventar).
  const scaleName = input.type || 'Avaliação'
  const queixa = interpretation.trim() ? interpretation.trim() : `Avaliação aplicada: ${scaleName}.`

  const reportCtx: NeuropsychContext = {
    patient: {
      iniciais,
      fullName,
      idade,
      birthDate: guest?.birth_date ?? null,
      sexo: '—',
      escolaridade: '—',
    },
    professional: {
      nome: CLINICIAN_CREDENTIALS.name,
      registro: `${CLINICIAN_CREDENTIALS.crm} · ${CLINICIAN_CREDENTIALS.rqe}`,
      especialidade: 'Psiquiatria',
    },
    assessmentDate: input.startedAt,
    scaleType: input.type,
    score: input.score,
    queixaPrincipal: queixa,
    historiaEvolucao: interpretation.trim() || null,
    aiInterpretation,
    savedInterpretation: interpretation.trim() || null,
    cognitiveVrc: aiInterpretation?.cognitiveVrc ?? null,
  }

  const report = generateNeuropsychReport(reportCtx)

  // ---------------- PDF rendering ----------------
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 18
  let y = 18
  const c = CLINIC_BRANDING.colors
  const [primary] = [hexToRgb(c.primary)]
  const secondary = hexToRgb(c.secondary)
  const medium = hexToRgb(c.medium)
  const dark = hexToRgb(c.dark)
  const accent = hexToRgb(c.accent)

  // --- Header: logo + título ---
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
  doc.text('Laudo de Avaliação Neuropsiquiátrica e Neurodesenvolvimento', marginX + 28, y + 12)

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

  // --- Separador visual: DADOS FORNECIDOS ---
  writeVisualSeparator('DADOS FORNECIDOS PELO PROFISSIONAL')

  // Seções 1 a 5 (dados fornecidos)
  for (let i = 0; i < 5; i++) {
    const section = report.sections[i]
    writeSectionHeader(section.index, section.title)
    for (const line of section.lines) {
      // In section 1, items are "Paciente: X | Idade..." — render as bullets.
      if (section.index === 1) {
        writeBullet(line)
      } else {
        writeParagraph(line)
      }
    }
    y += 2
  }

  // --- Separador visual: INTERPRETAÇÃO ASSISTIDA ---
  writeVisualSeparator('INTERPRETAÇÃO ASSISTIDA (NÃO CONSTITUI DIAGNÓSTICO)')

  // Seções 6 e 7 (interpretação assistida + áreas de atenção)
  for (let i = 5; i < 7; i++) {
    const section = report.sections[i]
    writeSectionHeader(section.index, section.title)
    if (section.index === 7) {
      for (const line of section.lines) writeBullet(line)
    } else {
      for (const line of section.lines) writeParagraph(line)
    }
    y += 2
  }

  // --- Separador visual: LACUNAS E ENCAMINHAMENTOS ---
  writeVisualSeparator('LACUNAS, ITENS A CONFIRMAR E ENCAMINHAMENTOS')

  // Seções 8 e 9
  for (let i = 7; i < 9; i++) {
    const section = report.sections[i]
    writeSectionHeader(section.index, section.title)
    for (const line of section.lines) writeBullet(line)
    y += 2
  }

  // --- Alerta de risco iminente (se houver) ---
  if (report.riscoIminente) {
    ensureSpace(16)
    doc.setFillColor(0xfd, 0xe6, 0xe6)
    doc.setDrawColor(0xdc, 0x26, 0x26)
    doc.roundedRect(marginX, y, pageWidth - marginX * 2, 14, 2, 2, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(0xb9, 0x1c, 0x1c)
    const alertLines = doc.splitTextToSize(report.riscoIminente, pageWidth - marginX * 2 - 6)
    doc.text(alertLines, marginX + 3, y + 5)
    y += 18
  }

  // --- Seção 10: LIMITAÇÕES (disclaimer final) ---
  const sec10 = report.sections[9]
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
    fetchQrCodePng(input.testId),
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

  const safeName = iniciais.replace(/[^a-zA-Z0-9]/g, '_')
  doc.save(`laudo-${safeName}.pdf`)

  function writeVisualSeparator(label: string) {
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
}

/**
 * Exporta a versão JSON do laudo padronizado (para integração futura).
 */
export async function generateLaudoJSON(
  input: LaudoInput,
): Promise<ReturnType<typeof generateNeuropsychReport>['json'] | null> {
  const { guest, interpretation, aiInterpretation } = await loadLaudoContext(
    input.guestId,
    input.testId,
  )

  const iniciais = guest?.first_name
    ? `${guest.first_name.charAt(0).toUpperCase()}.${
        guest.last_name ? guest.last_name.charAt(0).toUpperCase() + '.' : ''
      }`
    : input.patientName
      ? `${input.patientName.trim().charAt(0).toUpperCase()}.`
      : '—'

  const idade = guest?.birth_date
    ? (() => {
        const b = new Date(guest.birth_date)
        if (isNaN(b.getTime())) return null
        const today = new Date()
        let age = today.getFullYear() - b.getFullYear()
        const m = today.getMonth() - b.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--
        return age >= 0 ? age : null
      })()
    : null

  const reportCtx: NeuropsychContext = {
    patient: {
      iniciais,
      idade,
      birthDate: guest?.birth_date ?? null,
      sexo: '—',
      escolaridade: '—',
    },
    professional: {
      nome: CLINICIAN_CREDENTIALS.name,
      registro: `${CLINICIAN_CREDENTIALS.crm} · ${CLINICIAN_CREDENTIALS.rqe}`,
      especialidade: 'Psiquiatria',
    },
    assessmentDate: input.startedAt,
    scaleType: input.type,
    score: input.score,
    queixaPrincipal: interpretation.trim() || `Avaliação aplicada: ${input.type || 'Avaliação'}.`,
    historiaEvolucao: interpretation.trim() || null,
    aiInterpretation,
    savedInterpretation: interpretation.trim() || null,
    cognitiveVrc: aiInterpretation?.cognitiveVrc ?? null,
  }

  return generateNeuropsychReport(reportCtx).json
}
