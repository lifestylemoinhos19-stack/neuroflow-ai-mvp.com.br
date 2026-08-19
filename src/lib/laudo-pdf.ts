import { jsPDF } from 'jspdf'
import { supabase } from '@/lib/supabase/client'
import { getGuestFull, type GuestFull } from '@/services/guest-patient'
import { translateStatus } from '@/services/admin-sessions'
import {
  getSessionInterpretation,
  saveInterpretation,
  type InterpretationResult,
} from '@/services/clinical-interpretation'
import { phq9SeverityLabels, gad7SeverityLabels } from '@/lib/phq9-gad7-data'

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
  /** Saved admin/system interpretation text (may be empty). */
  interpretation: string
  /** Rich AI interpretation, generated on the fly when nothing is saved. */
  aiInterpretation: InterpretationResult | null
}

const SEVERITY_LABELS: Record<string, string> = {
  low: 'Baixa',
  moderate: 'Moderada',
  high: 'Alta',
}

/**
 * Build an interpretation string from the scale type + score, using the
 * project's existing thresholds (see lib/phq9-gad7-data, lib/scales-data, etc).
 *
 * This is now a last-resort fallback used only when neither saved
 * clinical_feedback nor the AI engine (`getSessionInterpretation`) return
 * anything usable (e.g. orphan mock sessions with no responses).
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
 * Resolve the real `anamnesis_sessions.id` for a testagem.
 *
 * `testId` arriving from the admin test list can be either:
 *  - an `anamnesis_sessions.id` (orphan sessions / anamneses), or
 *  - a `scale_assignments.id` (PHQ-9, GAD-7, MINI, etc.).
 *
 * `clinical_feedback.session_id` and `anamnesis_responses.session_id` both
 * reference `anamnesis_sessions.id`, so for a scale_assignment we MUST fetch
 * its `session_id` column instead of using the assignment id directly — that
 * was the original bug (it never matched any feedback row).
 */
async function resolveRealSessionId(testId: string): Promise<{
  sessionId: string | null
  isAssignment: boolean
}> {
  // Fast path: testId is itself an anamnesis_session id.
  const { data: session } = await supabase
    .from('anamnesis_sessions')
    .select('id')
    .eq('id', testId)
    .maybeSingle()
  if (session) return { sessionId: session.id, isAssignment: false }

  // Otherwise look it up as a scale_assignment.
  const { data: assignment } = await supabase
    .from('scale_assignments')
    .select('id, session_id')
    .eq('id', testId)
    .maybeSingle()
  if (assignment) {
    return { sessionId: assignment.session_id ?? null, isAssignment: true }
  }
  return { sessionId: null, isAssignment: false }
}

/**
 * Load extra context for the laudo: decrypted guest data + clinical feedback
 * interpretation (admin_edited_interpretation) for the session.
 *
 * When no `clinical_feedback` row exists (the common case, since the AI
 * interpretation is not auto-saved on scale completion), we fall back to
 * `getSessionInterpretation()` to generate the rich analysis (findings,
 * comorbidities, global severity) on the fly, and best-effort persist it so
 * subsequent generations don't need to recompute.
 */
async function loadLaudoContext(guestId: string | null, testId: string): Promise<LaudoContext> {
  let guest: GuestFull | null = null
  if (guestId) {
    const { data } = await getGuestFull(guestId)
    guest = data
  }

  // Map the admin test id back to the real anamnesis_session id.
  const { sessionId } = await resolveRealSessionId(testId)

  let interpretation = ''
  let aiInterpretation: InterpretationResult | null = null

  // 1) Try saved clinical_feedback (keyed by the real session_id).
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

  // 2) No saved interpretation → generate the rich AI analysis on the fly.
  if (!interpretation && sessionId) {
    try {
      aiInterpretation = await getSessionInterpretation(sessionId)
    } catch {
      /* ignore */
    }

    // 3) Best-effort: persist the generated interpretation so the next laudo
    //    generation doesn't need to recompute it. Requires an authenticated
    //    admin/doctor; failures are silently ignored (the PDF still renders).
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
 * Generate and download a PDF laudo for a completed testagem.
 */
export async function generateLaudoPDF(input: LaudoInput): Promise<void> {
  const { guest, interpretation, aiInterpretation } = await loadLaudoContext(
    input.guestId,
    input.testId,
  )

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 20
  let y = 20

  // --- Header: logo + title ---
  try {
    // Import logo asset from local project src/assets/logo-3-e1088.png
    const logoModule = await import('@/assets/logo-3-e1088.png')
    const logoUrl = logoModule.default
    const logoData = await fetchImageAsPngData(logoUrl)
    if (logoData) {
      // Draw 28mm x 28mm logo at header
      doc.addImage(logoData.dataUrl, logoData.format, marginX, y, 28, 28)
    }
  } catch {
    /* logo fallback */
  }

  const titleX = marginX + 32
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(10, 25, 47)
  doc.text('Casa Branca Saúde', titleX, y + 8)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text('Laudo de Avaliação Neuropsicológica', titleX, y + 15)

  doc.setDrawColor(0, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(marginX, y + 30, pageWidth - marginX, y + 30)
  y += 38

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

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 30) {
      doc.addPage()
      y = 20
    }
  }

  const writeParagraph = (text: string, gap = 4) => {
    const lines = doc.splitTextToSize(text, pageWidth - marginX * 2)
    ensureSpace(lines.length * 5 + 2)
    doc.text(lines, marginX, y)
    y += lines.length * 5 + gap
  }

  const writeSubheading = (text: string) => {
    ensureSpace(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(10, 25, 47)
    doc.text(text, marginX, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(51, 65, 85)
  }

  const writeBullet = (text: string) => {
    const bullet = '•'
    const indent = marginX + 4
    const lines = doc.splitTextToSize(text, pageWidth - marginX * 2 - 6)
    ensureSpace(lines.length * 5 + 1)
    doc.text(bullet, marginX, y)
    doc.text(lines, indent, y)
    y += lines.length * 5 + 1
  }

  if (aiInterpretation && aiInterpretation.hasScaleData) {
    // Rich AI interpretation: severity → findings → comorbidities → scores →
    // cognitive → recommendation.
    const severityLabel = SEVERITY_LABELS[aiInterpretation.globalSeverity] || '—'
    writeParagraph(`Severidade global estimada: ${severityLabel}.`)

    if (aiInterpretation.findings.length > 0) {
      writeSubheading('Achados clínicos:')
      for (const f of aiInterpretation.findings) {
        writeBullet(`${f.suggestion} (${f.scale}: ${f.score}, corte ${f.threshold}).`)
      }
      y += 2
    }

    if (aiInterpretation.comorbidities.length > 0) {
      writeSubheading('Comorbidades detectadas:')
      for (const c of aiInterpretation.comorbidities) {
        writeBullet(c)
      }
      y += 2
    }

    // Per-scale scores with severity badges where available.
    const scaleRows: string[] = []
    if (aiInterpretation.phq9Score)
      scaleRows.push(
        `PHQ-9: ${aiInterpretation.phq9Score}/27 (${phq9SeverityLabels[aiInterpretation.phq9Severity]})`,
      )
    if (aiInterpretation.gad7Score)
      scaleRows.push(
        `GAD-7: ${aiInterpretation.gad7Score}/21 (${gad7SeverityLabels[aiInterpretation.gad7Severity]})`,
      )
    if (aiInterpretation.assqScore !== null) scaleRows.push(`ASSQ: ${aiInterpretation.assqScore}`)
    if (aiInterpretation.snapIvScore !== null)
      scaleRows.push(`SNAP-IV: ${aiInterpretation.snapIvScore.toFixed(2)}`)
    if (aiInterpretation.asrs18Score !== null)
      scaleRows.push(`ASRS-18: ${aiInterpretation.asrs18Score}`)
    if (aiInterpretation.mocaScore !== null)
      scaleRows.push(`MoCA: ${aiInterpretation.mocaScore}/30`)
    if (aiInterpretation.meemScore !== null)
      scaleRows.push(`MEEM: ${aiInterpretation.meemScore}/30`)
    if (aiInterpretation.hamdScore !== null) scaleRows.push(`HAM-D: ${aiInterpretation.hamdScore}`)
    if (aiInterpretation.hamaScore !== null) scaleRows.push(`HAM-A: ${aiInterpretation.hamaScore}`)
    if (scaleRows.length > 0) {
      writeSubheading('Pontuações por escala:')
      writeParagraph(scaleRows.join(' | '))
    }

    if (aiInterpretation.cognitiveVrc !== null) {
      writeParagraph(
        `Performance cognitiva (VRC): ${aiInterpretation.cognitiveVrc.toFixed(2)}${
          aiInterpretation.cognitiveVrc < 0.5
            ? ' — abaixo do esperado, recomenda-se investigação complementar.'
            : '.'
        }`,
      )
    }

    // Recommendation / system suggestion (already excludes the findings list
    // duplication since suggestion is built from findings; we surface it as
    // the final clinical recommendation).
    writeSubheading('Recomendações:')
    writeParagraph(aiInterpretation.suggestion)
  } else {
    // Either a saved interpretation exists, or no AI data is available —
    // render the text we have and fall back to the score-based summary.
    const finalInterpretation =
      interpretation.trim() || buildInterpretation(input.type, input.score)
    writeParagraph(finalInterpretation)
  }
  y += 4

  // --- Signature ---
  ensureSpace(20)
  y += 10
  doc.setDrawColor(100, 116, 139)
  doc.setLineWidth(0.3)
  doc.line(marginX + 30, y, marginX + 130, y)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(51, 65, 85)
  doc.text('Dra. Rose Mary Alves — CRM RS 19625', marginX + 30, y + 5)

  // --- Footer (LGPD Compliance) ---
  const footerY = pageHeight - 20
  doc.setDrawColor(0, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(marginX, footerY, pageWidth - marginX, footerY)
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  const footerLines = doc.splitTextToSize(
    'Documento gerado pelo Casa Branca Saúde — Em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). Dados protegidos e confidenciais.',
    pageWidth - marginX * 2,
  )
  doc.text(footerLines, marginX, footerY + 5)
  doc.text(`Data de emissão: ${new Date().toLocaleString('pt-BR')}`, marginX, footerY + 11)

  const safeName = (input.patientName || 'paciente').replace(/[^a-zA-Z0-9]/g, '_')
  // Direct download via a temporary <a> element — avoids popup blockers
  // (window.open is blocked on most modern browsers / mobile).
  doc.save(`laudo-${safeName}.pdf`)
}

/**
 * Helper function to load an image URL (PNG/JPEG/SVG) and convert it into canvas data for jsPDF.
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
        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          format: 'PNG',
        })
      }
      img.onerror = () => resolve(null)
      img.src = url
    })
  } catch {
    return null
  }
}
