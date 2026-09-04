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

/**
 * Remove emojis, caracteres fora da faixa Latin-1 estendida (WinAnsi) e
 * normaliza quebras de linha para evitar corrupção de fonte no jsPDF.
 */
export function sanitizePdfText(str?: string | null): string {
  if (!str) return ''
  return (
    str
      // Remove variação de seletores e marcas de junção (ZWJ, variation selectors)
      .replace(/[\uFE00-\uFE0F\u200D\u200B-\u200F]/g, '')
      // Remove emojis e símbolos suplementares (SMP U+10000 - U+10FFFF)
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
      // Remove símbolos específicos que o WinAnsi/Latin-1 padrão não suporta
      .replace(/[⚠️⚠❌✅ℹ️💡🔍🩺📌⭐]/g, '')
      // Converte aspas curvas e traços especiais para padrão ASCII/Latin-1
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u2026/g, '...')
      // Remove qualquer caractere com código > 255 (não-Latin1) mantendo legibilidade
      .replace(/[^\u0020-\u007E\u00A0-\u00FF\n\t]/g, '') // Normaliza quebras de linha Windows/Mac para Unix simples
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
  )
}

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
  // Nível 1: testId é um ID direto de anamnesis_sessions
  const { data: session, error: sessionErr } = await supabase
    .from('anamnesis_sessions')
    .select('id')
    .eq('id', testId)
    .maybeSingle()

  if (session) return { sessionId: session.id, isAssignment: false }
  if (sessionErr) {
    console.warn(
      '[resolveRealSessionId] Nível 1 (busca direta por id em anamnesis_sessions) falhou:',
      sessionErr.message,
    )
  }

  // Nível 2: testId é um ID de scale_assignments
  const { data: assignment, error: assignErr } = await supabase
    .from('scale_assignments')
    .select('id, session_id, guest_id, scale_type')
    .eq('id', testId)
    .maybeSingle()

  if (assignErr) {
    console.warn('[resolveRealSessionId] Falha ao consultar scale_assignments:', assignErr.message)
  }

  if (assignment) {
    // 2.1: session_id já vinculado na atribuição
    if (assignment.session_id) {
      return { sessionId: assignment.session_id, isAssignment: true }
    }
    console.warn(
      '[resolveRealSessionId] scale_assignment encontrado sem session_id preenchido:',
      assignment.id,
    )

    if (assignment.scale_type) {
      const normalizedScaleType = assignment.scale_type.toLowerCase().replace(/[-\s.]/g, '')

      // Nível 2.2: busca por metadata->>scaleType via RPC SECURITY DEFINER
      const { data: orphanRows, error: orphanErr } = await (supabase.rpc as any)(
        'find_session_by_scale_type',
        {
          p_scale_type: normalizedScaleType,
          p_guest_id: assignment.guest_id || null,
        },
      )
      const orphanSession = orphanRows?.[0] || null

      if (orphanSession?.session_id) {
        return { sessionId: orphanSession.session_id, isAssignment: true }
      }
      if (orphanErr) {
        console.warn(
          '[resolveRealSessionId] Nível 2.2 (metadata->>scaleType) falhou com erro:',
          orphanErr.message,
        )
      } else {
        console.warn(
          '[resolveRealSessionId] Nível 2.2 (metadata->>scaleType) não encontrou sessão compatível.',
        )
      }

      // Nível 2.3: busca por metadata->>scale_name, metadata->>scale_key ou scale_type via RPC SECURITY DEFINER
      const scaleKeyAlt = assignment.scale_type.toLowerCase().replace(/[-\s.]/g, '')
      const { data: altRows, error: altErr } = await (supabase.rpc as any)(
        'find_session_by_scale_metadata',
        {
          p_scale_name: assignment.scale_type,
          p_scale_key: scaleKeyAlt,
          p_guest_id: assignment.guest_id || null,
        },
      )
      const altSession = altRows?.[0] || null

      if (altSession?.session_id) {
        return { sessionId: altSession.session_id, isAssignment: true }
      }
      if (altErr) {
        console.warn(
          '[resolveRealSessionId] Nível 2.3 (metadata->>scale_name / scale_key) falhou:',
          altErr.message,
        )
      } else {
        console.warn(
          '[resolveRealSessionId] Nível 2.3 (metadata->>scale_name / scale_key) não encontrou sessão.',
        )
      }

      // Nível 3 (Último recurso): busca por question_key compatível via RPC SECURITY DEFINER
      const scalePrefix = assignment.scale_type.toLowerCase().replace(/[-\s.]/g, '')
      const { data: matchResp, error: matchErr } = await (supabase.rpc as any)(
        'find_session_by_question_prefix',
        { p_prefix: scalePrefix },
      )

      const matchRows = matchResp as { session_id: string }[] | null
      if (matchRows && matchRows.length > 0 && matchRows[0]?.session_id) {
        return { sessionId: matchRows[0].session_id, isAssignment: true }
      }
      if (matchErr) {
        console.warn(
          '[resolveRealSessionId] Nível 3 (RPC find_session_by_question_prefix) falhou:',
          matchErr.message,
        )
      } else {
        console.warn(
          '[resolveRealSessionId] Nível 3 (RPC find_session_by_question_prefix) não encontrou respostas com prefixo:',
          scalePrefix,
        )
      }
    }

    return { sessionId: null, isAssignment: true }
  }

  console.warn('[resolveRealSessionId] Nenhum registro encontrado para testId:', testId)
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

  if (!sessionId) {
    throw new Error(
      'Não foi possível gerar o laudo: Sessão clínica não encontrada para este registro.',
    )
  }

  let interpretation = ''
  let aiInterpretation: InterpretationResult | null = null

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

  try {
    aiInterpretation = await getSessionInterpretation(sessionId)
  } catch (err: any) {
    throw new Error(
      `Não foi possível gerar o laudo: Falha ao interpretar sessão (${err?.message || 'erro desconhecido'}).`,
    )
  }

  if (!aiInterpretation) {
    throw new Error(
      'Não foi possível gerar o laudo: Falha ao carregar as respostas criptografadas da sessão.',
    )
  }

  const hasRawResponses = (aiInterpretation.rawCount ?? 0) > 0
  if (!aiInterpretation.hasScaleData && !interpretation.trim()) {
    if (!hasRawResponses) {
      throw new Error(
        `Não foi possível gerar o laudo: ${aiInterpretation.suggestion || 'Nenhum dado de escala encontrado nesta sessão.'}`,
      )
    }
    // Quando existem respostas brutas mas o escore não pôde ser calculado automaticamente,
    // degrada graciosamente permitindo a emissão com nota de revisão clínica pendente.
    interpretation =
      aiInterpretation.suggestion ||
      'Instrumento aplicado com respostas registradas; escore não calculável automaticamente / pendente de revisão clínica.'
  }

  if (aiInterpretation.hasScaleData) {
    try {
      await saveInterpretation(
        sessionId,
        aiInterpretation.suggestion,
        interpretation || aiInterpretation.suggestion,
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
        aiInterpretation.sdsScore,
        aiInterpretation.bdiScore,
        aiInterpretation.baiScore,
      )
    } catch {
      /* ignore — non-fatal */
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

  // Queixa principal / história — se houver anamnesisData estruturado, prioriza
  const anamnesis = aiInterpretation?.anamnesisData
  const scaleName = aiInterpretation?.scaleName || input.type || 'Avaliação'
  const queixa =
    anamnesis?.chiefComplaint?.trim() ||
    `Aplicação do instrumento ${scaleName} para rastreio clínico e monitoramento neuropsicológico.`
  const historia =
    anamnesis?.developmentalHistory?.trim() ||
    'Sem histórico prévio adicional informado no momento da aplicação do instrumento.'

  // Escores reais das escalas (FTDRS, WURS-25, FAS etc.) propagados para o PDF.
  // Vazio/null → não propagate (o campo simplesmente não aparece no laudo).
  // Nota: zero (0) é um escore válido e não deve ser descartado.
  const toFiniteScore = (v: unknown): number | null =>
    typeof v === 'number' && isFinite(v) && v >= 0 ? v : null

  const realScaleType = aiInterpretation?.scaleType || null
  const realScore =
    toFiniteScore(aiInterpretation?.ftdrs) ??
    toFiniteScore((aiInterpretation as any)?.wurs25Score) ??
    toFiniteScore(aiInterpretation?.fas) ??
    toFiniteScore(aiInterpretation?.fasTotal) ??
    toFiniteScore(input.score) ??
    null

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
    scaleType: realScaleType ?? input.type,
    score: realScore,
    queixaPrincipal: queixa,
    historiaEvolucao: historia,
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
  doc.text(
    sanitizePdfText('Laudo de Avaliação Neuropsiquiátrica e Neurodesenvolvimento'),
    marginX + 28,
    y + 12,
  )

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
    doc.text(`${index}. ${sanitizePdfText(text)}`, marginX, y)
    doc.setDrawColor(secondary[0], secondary[1], secondary[2])
    doc.setLineWidth(0.3)
    doc.line(marginX, y + 2, pageWidth - marginX, y + 2)
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(dark[0], dark[1], dark[2])
  }

  const writeParagraph = (text: string, gap = 4) => {
    const clean = sanitizePdfText(text)
    const lines = doc.splitTextToSize(clean, pageWidth - marginX * 2)
    ensureSpace(lines.length * 5 + 2)
    doc.text(lines, marginX, y)
    y += lines.length * 5 + gap
  }

  const writeBullet = (text: string) => {
    const clean = sanitizePdfText(text)
    const indent = marginX + 4
    const lines = doc.splitTextToSize(clean, pageWidth - marginX * 2 - 6)
    ensureSpace(lines.length * 5 + 1)
    doc.text('•', marginX, y)
    doc.text(lines, indent, y)
    y += lines.length * 5 + 1
  }

  const writeLabel = (label: string, value: string, valueIndent = 42) => {
    ensureSpace(6)
    doc.setFont('helvetica', 'bold')
    doc.text(sanitizePdfText(label), marginX, y)
    doc.setFont('helvetica', 'normal')
    const maxValW = pageWidth - marginX * 2 - valueIndent
    const valLines = doc.splitTextToSize(sanitizePdfText(value), maxValW)
    doc.text(valLines, marginX + valueIndent, y)
    y += Math.max(6, valLines.length * 4.5 + 1.5)
  }

  // --- Disclaimer no INÍCIO ---
  ensureSpace(16)
  doc.setFillColor(accent[0], accent[1], accent[2])
  doc.setDrawColor(secondary[0], secondary[1], secondary[2])
  doc.roundedRect(marginX, y, pageWidth - marginX * 2, 14, 2, 2, 'S')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(primary[0], primary[1], primary[2])
  const introLines = doc.splitTextToSize(
    sanitizePdfText(NEUROPSYCH_DISCLAIMER),
    pageWidth - marginX * 2 - 6,
  )
  doc.text(introLines, marginX + 3, y + 5)
  y += 18

  // --- Separador visual: DADOS FORNECIDOS ---
  writeVisualSeparator('DADOS FORNECIDOS PELO PROFISSIONAL')

  // Seção 1: IDENTIFICAÇÃO
  const sec1 = report.sections[0]
  writeSectionHeader(sec1.index, sec1.title)
  writeLabel('Paciente (iniciais):', sanitizePdfText(iniciais), 46)
  if (idade !== null) writeLabel('Idade:', `${idade} anos`, 46)
  writeLabel('Protocolo / Registro:', sanitizePdfText(input.testId), 46)
  writeLabel('Data da avaliação:', new Date(input.startedAt).toLocaleDateString('pt-BR'), 46)
  writeLabel(
    'Profissional responsável:',
    sanitizePdfText(
      `${CLINICIAN_CREDENTIALS.name} — ${CLINICIAN_CREDENTIALS.crm} / ${CLINICIAN_CREDENTIALS.rqe}`,
    ),
    46,
  )
  y += 2

  // Seções 2 a 4 (Queixa, História, Sinais e Sintomas)
  for (let i = 1; i < 4; i++) {
    const section = report.sections[i]
    writeSectionHeader(section.index, section.title)
    for (const line of section.lines) {
      writeParagraph(line)
    }
    y += 2
  }

  // Seção 5: INSTRUMENTOS APLICADOS (Tabela detalhada com cabeçalho estilizado)
  const sec5 = report.sections[4]
  writeSectionHeader(sec5.index, sec5.title)
  if (report.json.instrumentos && report.json.instrumentos.length > 0) {
    const colX = [marginX, marginX + 45, marginX + 75, marginX + 115, pageWidth - marginX]
    const rowH = 7
    const drawTableRow = (cells: string[], isHeader = false) => {
      ensureSpace(rowH + 2)
      if (isHeader) {
        doc.setFillColor(accent[0], accent[1], accent[2])
        doc.rect(marginX, y, pageWidth - marginX * 2, rowH, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.5)
        doc.setTextColor(primary[0], primary[1], primary[2])
      } else {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(dark[0], dark[1], dark[2])
      }
      cells.forEach((cell, idx) => {
        const maxW = colX[idx + 1] - colX[idx] - 2
        const lines = doc.splitTextToSize(sanitizePdfText(cell), maxW)
        doc.text(lines.slice(0, 2), colX[idx] + 2, y + 4.5)
      })
      doc.setDrawColor(secondary[0], secondary[1], secondary[2])
      doc.setLineWidth(isHeader ? 0.3 : 0.1)
      doc.line(marginX, y + rowH, pageWidth - marginX, y + rowH)
      y += rowH
    }

    drawTableRow(['Instrumento', 'Data', 'Pontuação', 'Classificação'], true)
    for (const inst of report.json.instrumentos) {
      drawTableRow([inst.nome, inst.data, inst.pontuacao, inst.classificacao])
    }
    y += 3
  } else {
    for (const line of sec5.lines) {
      writeParagraph(line)
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
    const alertLines = doc.splitTextToSize(
      sanitizePdfText(report.riscoIminente),
      pageWidth - marginX * 2 - 6,
    )
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
    sanitizePdfText(NEUROPSYCH_DISCLAIMER),
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
    sanitizePdfText(
      `${CLINIC_BRANDING.name} — ${CLINIC_BRANDING.address} | WhatsApp: ${CLINIC_BRANDING.whatsapp}`,
    ),
    marginX,
    footerY + 4,
  )
  doc.text(
    sanitizePdfText(
      `Emitido em ${new Date().toLocaleString('pt-BR')} · Documento em conformidade com a LGPD (Lei nº 13.709/2018). Paciente identificado apenas por iniciais.`,
    ),
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
    doc.text(sanitizePdfText(label), marginX + 3, y + 5.5)
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

  const anamnesis = aiInterpretation?.anamnesisData
  const scaleName = aiInterpretation?.scaleName || input.type || 'Avaliação'
  const queixa =
    anamnesis?.chiefComplaint?.trim() ||
    `Aplicação do instrumento ${scaleName} para rastreio clínico e monitoramento neuropsicológico.`
  const historia =
    anamnesis?.developmentalHistory?.trim() ||
    'Sem histórico prévio adicional informado no momento da aplicação do instrumento.'

  // Mesmo padrão do generateLaudoPDF: propaga os escores reais das escalas.
  // Nota: zero (0) é um escore válido e não deve ser descartado.
  const toFiniteScore = (v: unknown): number | null =>
    typeof v === 'number' && isFinite(v) && v >= 0 ? v : null

  const realScaleType = aiInterpretation?.scaleType || null
  const realScore =
    toFiniteScore(aiInterpretation?.ftdrs) ??
    toFiniteScore((aiInterpretation as any)?.wurs25Score) ??
    toFiniteScore(aiInterpretation?.fas) ??
    toFiniteScore(aiInterpretation?.fasTotal) ??
    toFiniteScore(input.score) ??
    null

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
    scaleType: realScaleType ?? input.type,
    score: realScore,
    queixaPrincipal: queixa,
    historiaEvolucao: historia,
    aiInterpretation,
    savedInterpretation: interpretation.trim() || null,
    cognitiveVrc: aiInterpretation?.cognitiveVrc ?? null,
  }

  return generateNeuropsychReport(reportCtx).json
}
