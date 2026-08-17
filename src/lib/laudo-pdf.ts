import { jsPDF } from 'jspdf'
import { supabase } from '@/lib/supabase/client'
import { getGuestFull, type GuestFull } from '@/services/guest-patient'
import { translateStatus } from '@/services/admin-sessions'

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
}

/**
 * Build an interpretation string from the scale type + score, using the
 * project's existing thresholds (see lib/phq9-gad7-data, lib/scales-data, etc).
 */
function buildInterpretation(scaleType: string, score: number | null): string {
  if (score === null) return 'Pontuação não disponível.'
  const normalized = scaleType.toUpperCase().trim()
  switch (normalized) {
    case 'PHQ-9': {
      if (score >= 20)
        return `Pontuação ${score}/27 — Depressão Severa. Recomenda-se avaliação clínica imediata.`
      if (score >= 15) return `Pontuação ${score}/27 — Depressão Moderadamente Severa.`
      if (score >= 10) return `Pontuação ${score}/27 — Depressão Moderada.`
      if (score >= 5) return `Pontuação ${score}/27 — Depressão Leve.`
      return `Pontuação ${score}/27 — Depressão Mínima.`
    }
    case 'GAD-7': {
      if (score >= 15) return `Pontuação ${score}/21 — Ansiedade Severa.`
      if (score >= 10) return `Pontuação ${score}/21 — Ansiedade Moderada.`
      if (score >= 5) return `Pontuação ${score}/21 — Ansiedade Leve.`
      return `Pontuação ${score}/21 — Ansiedade Mínima.`
    }
    case 'SNAP-IV': {
      // Average per item stored as the total score; cutoffs 1.5 / 2.0
      if (score > 2) return `Média ${score.toFixed(2)}/3.00 — Risco Elevado para TDAH.`
      if (score >= 1.5) return `Média ${score.toFixed(2)}/3.00 — Risco Médio para TDAH.`
      return `Média ${score.toFixed(2)}/3.00 — Risco Baixo para TDAH.`
    }
    case 'ASSQ': {
      if (score > 21)
        return `Pontuação ${score} — Risco Elevado para Transtorno do Espectro Autista.`
      if (score >= 14) return `Pontuação ${score} — Risco Moderado.`
      return `Pontuação ${score} — Risco Baixo.`
    }
    case 'MOCA': {
      if (score >= 26) return `Pontuação ${score}/30 — Cognição Normal.`
      if (score >= 18) return `Pontuação ${score}/30 — Comprometimento Cognitivo Leve.`
      if (score >= 10) return `Pontuação ${score}/30 — Comprometimento Cognitivo Moderado.`
      return `Pontuação ${score}/30 — Comprometimento Cognitivo Grave.`
    }
    case 'SDS': {
      if (score >= 8) return `Pontuação ${score}/30 — Incapacidade Severa.`
      if (score >= 5) return `Pontuação ${score}/30 — Incapacidade Moderada.`
      return `Pontuação ${score}/30 — Incapacidade Normal/Leve.`
    }
    case 'FTDRS': {
      if (score >= 30) return `Pontuação ${score}/45 — Gravidade Grave.`
      if (score >= 20) return `Pontuação ${score}/45 — Gravidade Moderada.`
      if (score >= 10) return `Pontuação ${score}/45 — Gravidade Leve.`
      return `Pontuação ${score}/45 — Gravidade Minimal.`
    }
    case 'FAS': {
      if (score < 15)
        return `Pontuação ${score} palavras — Possível comprometimento (abaixo de 15).`
      return `Pontuação ${score} palavras — Dentro do esperado.`
    }
    case 'Y-BOCS': {
      if (score >= 24) return `Pontuação ${score}/40 — TOC Grave.`
      if (score >= 16) return `Pontuação ${score}/40 — TOC Moderado.`
      if (score >= 8) return `Pontuação ${score}/40 — TOC Leve.`
      return `Pontuação ${score}/40 — Sintomas subclínicos.`
    }
    default:
      return `Pontuação total: ${score}.`
  }
}

/**
 * Load extra context for the laudo: decrypted guest data + clinical feedback
 * interpretation (admin_edited_interpretation) for the session.
 */
async function loadLaudoContext(guestId: string | null, sessionId: string): Promise<LaudoContext> {
  let guest: GuestFull | null = null
  if (guestId) {
    const { data } = await getGuestFull(guestId)
    guest = data
  }

  let interpretation = ''
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

  return { guest, interpretation }
}

/**
 * Generate and download a PDF laudo for a completed testagem.
 */
export async function generateLaudoPDF(input: LaudoInput): Promise<void> {
  const { guest, interpretation } = await loadLaudoContext(input.guestId, input.testId)

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 20
  let y = 20

  // --- Header: logo + title ---
  try {
    const logoUrl = `${window.location.origin}/logo.svg`
    const logoData = await fetchSvgAsPngData(logoUrl, 40, 40)
    if (logoData) {
      doc.addImage(logoData, 'PNG', marginX, y, 14, 14)
    }
  } catch {
    /* logo optional */
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(10, 25, 47)
  doc.text('Casa Branca Saúde', marginX + 18, y + 7)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text('Laudo de Avaliação Neuropsicológica', marginX + 18, y + 13)

  doc.setDrawColor(0, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(marginX, y + 18, pageWidth - marginX, y + 18)
  y += 26

  // --- Patient data ---
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(10, 25, 47)
  doc.text('Dados do Paciente', marginX, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(51, 65, 85)

  const fullName =
    guest && guest.first_name
      ? `${guest.first_name} ${guest.last_name || ''}`.trim()
      : input.patientName
  const cpf = guest?.document || '—'
  const birthDate = guest?.birth_date ? new Date(guest.birth_date).toLocaleDateString('pt-BR') : '—'
  const profession = guest?.profession || '—'
  const address = guest?.address || '—'
  const responsible = guest?.responsible_name

  const patientRows: [string, string][] = [
    ['Nome:', fullName],
    ['CPF:', cpf],
    ['Data de nascimento:', birthDate],
    ['Profissão:', profession],
    ['Endereço:', address],
  ]
  if (responsible) patientRows.push(['Responsável:', responsible])

  patientRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, marginX, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, marginX + 40, y)
    y += 6
  })
  y += 4

  // --- Assessment data ---
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(10, 25, 47)
  doc.text('Dados da Avaliação', marginX, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(51, 65, 85)

  const appliedDate = input.startedAt ? new Date(input.startedAt).toLocaleString('pt-BR') : '—'
  const scaleName = input.type || 'Avaliação'

  const assessmentRows: [string, string][] = [
    ['Escala aplicada:', scaleName],
    ['Data e horário:', appliedDate],
    ['Status:', translateStatus(input.status)],
  ]
  assessmentRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, marginX, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, marginX + 40, y)
    y += 6
  })
  y += 2

  // --- Score ---
  doc.setFont('helvetica', 'bold')
  doc.text('Pontuação total:', marginX, y)
  doc.setFont('helvetica', 'normal')
  doc.text(input.score !== null ? String(input.score) : '—', marginX + 40, y)
  y += 8

  // --- Interpretation ---
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(10, 25, 47)
  doc.text('Interpretação do Resultado', marginX, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(51, 65, 85)
  const finalInterpretation = interpretation.trim() || buildInterpretation(input.type, input.score)
  const interpLines = doc.splitTextToSize(finalInterpretation, pageWidth - marginX * 2)
  doc.text(interpLines, marginX, y)
  y += interpLines.length * 5 + 6

  // --- Signature ---
  y += 14
  doc.setDrawColor(100, 116, 139)
  doc.setLineWidth(0.3)
  doc.line(marginX + 40, y, marginX + 120, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(51, 65, 85)
  doc.text('Dra. Rose Mary Alves — CRM RS 19625', marginX + 40, y + 5)

  // --- Footer ---
  const footerY = pageHeight - 20
  doc.setDrawColor(0, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(marginX, footerY, pageWidth - marginX, footerY)
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  const footerLines = doc.splitTextToSize(
    'Documento gerado pelo Casa Branca Saúde — Em conformidade com a LGPD',
    pageWidth - marginX * 2,
  )
  doc.text(footerLines, marginX, footerY + 5)
  doc.text(`Data de emissão: ${new Date().toLocaleString('pt-BR')}`, marginX, footerY + 10)

  const safeName = (input.patientName || 'paciente').replace(/[^a-zA-Z0-9]/g, '_')
  doc.save(`laudo_${safeName}_${input.type}.pdf`)
}

/**
 * Fetch an SVG logo and convert it to PNG data usable by jsPDF.addImage.
 * Returns a base64 data URL (PNG) or null on failure.
 */
async function fetchSvgAsPngData(
  url: string,
  width: number,
  height: number,
): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const svgText = await res.text()
    const blob = new Blob([svgText], { type: 'image/svg+xml' })
    const dataUrl = await new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
    if (!dataUrl) return null

    return await new Promise<string | null>((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = width * 2
        canvas.height = height * 2
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(null)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => resolve(null)
      img.src = dataUrl
    })
  } catch {
    return null
  }
}
