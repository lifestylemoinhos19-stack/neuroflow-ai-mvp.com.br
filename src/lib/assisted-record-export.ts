/**
 * NeuroFlow — Registro de Aplicação Assistida (PDF + Markdown + JSON)
 *
 * Segue o playbook "Aplicação Assistida de Escalas ao Paciente" — formato:
 *  1. IDENTIFICAÇÃO (iniciais, idade, escolaridade)
 *  2. INSTRUMENTO (nome, versão, modo de aplicação)
 *  3. ITENS E RESPOSTAS (estímulo | resposta | observação)
 *  4. PONTUAÇÃO (bruta, itens não aplicados)
 *  5. INTERPRETAÇÃO ASSISTIDA
 *  6. OBSERVAÇÕES DO PROFISSIONAL
 *  7. ITENS A CONFIRMAR / LACUNAS
 *  8. LIMITAÇÕES (disclaimer)
 *
 * Regras não negociáveis refletidas na saída:
 *  - Nunca usar "diagnóstico".
 *  - Nunca inventar pontuação de itens não respondidos → "[ITEM NÃO APLICADO]".
 *  - Itens com requiresManualScoring → "[REQUER CORREÇÃO DO PROFISSIONAL]".
 *  - Sempre separar RESPOSTA vs PONTUAÇÃO vs INTERPRETAÇÃO.
 *  - Disclaimer obrigatório no início e final.
 *
 * A paleta de cores segue `CLINIC_BRANDING.colors` (tons de marrom/dourado/bege
 * da Casa Branca Saúde), e o logo da clínica aparece no cabeçalho do PDF.
 */
import { jsPDF } from 'jspdf'
import {
  ASSISTED_DISCLAIMER,
  type AssistedItem,
  type AssistedScale,
} from '@/lib/assisted-scales-data'
import { CLINIC_BRANDING, CLINICIAN_CREDENTIALS } from '@/lib/clinic-branding'

/** Resposta registrada de um item (literal, sem inferência). */
export interface AssistedResponseRecord {
  key: string
  stimulus: string
  domain: string
  /** Resposta LITERAL do paciente (texto livre ou rótulo da opção). */
  response: string
  /** Valor numérico (pontos/likert) quando houver; null quando não aplicado. */
  numericValue: number | null
  /** Observação (repetição, material, ambiguidade, risco). */
  observation: string
  /** Marcadores de sinalização aplicados ao item. */
  flags: string[]
  /** Item exige correção manual do profissional. */
  requiresManualScoring: boolean
  /** Item exigia material físico. */
  requiresMaterial: boolean
}

/** Contexto de identificação do paciente para o registro. */
export interface AssistedRecordContext {
  scale: AssistedScale
  /** Iniciais (ex.: "J.S."). */
  iniciais: string
  /** Idade (anos) ou null. */
  idade: number | null
  /** Escolaridade (texto livre) ou "—". */
  escolaridade: string
  /** Data/hora da aplicação (ISO). */
  appliedAt: string
  /** Profissional que aplicou (nome + registro). */
  professionalName: string
  /** Observações livres do profissional (seção 6). */
  professionalNotes: string
  /** Respostas registradas, na ordem da escala. */
  responses: AssistedResponseRecord[]
  /** Pontuação bruta total (soma dos numericValue). */
  totalScore: number | null
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

/** Carrega o logo da clínica como data URL PNG pronto para addImage. */
async function fetchLogoDataUrl(): Promise<string | null> {
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const dataUrl: string | null = await new Promise((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || img.width || 200
        canvas.height = img.naturalHeight || img.height || 200
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(null)
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => resolve(null)
      img.src = CLINIC_BRANDING.logoUrl
    })
    return dataUrl
  } catch {
    return null
  }
}

/**
 * Detecta risco iminente (ideação suicida) a partir das respostas — sempre
 * de forma conservadora: só sinaliza quando o item phq9_q9 tem valor >= 1.
 * Nunca infere risco a partir de texto ambíguo.
 */
export function detectImminentRisk(responses: AssistedResponseRecord[]): string | null {
  const phq9q9 = responses.find((r) => r.key === 'phq9_q9')
  if (phq9q9 && phq9q9.numericValue !== null && phq9q9.numericValue >= 1) {
    return (
      '⚠️ Item de risco (PHQ-9 #9) com resposta ≥ 1. INTERROMPER e orientar ' +
      'encaminhamento urgente para avaliação de risco suicida. Não deixar o ' +
      'paciente sozinho. Acionar serviço de emergência/CVV 188 quando indicado.'
    )
  }
  return null
}

/**
 * Constrói a interpretação assistida (seção 5) — SEMPRE com linguagem
 * "compatível com" / "sugestivo de" / "área de atenção", nunca "diagnóstico".
 * Quando a pontuação não pode ser calculada (itens manuais/não aplicados),
 * declara a lacuna explicitamente.
 */
function buildInterpretation(ctx: AssistedRecordContext): string[] {
  const lines: string[] = []
  const scale = ctx.scale
  const total = ctx.totalScore
  const notApplied = ctx.responses.filter((r) => r.numericValue === null)
  const manual = ctx.responses.filter((r) => r.requiresManualScoring)

  lines.push(`Instrumento: ${scale.name} (${scale.version}). Modo: ${scale.applicationMode}.`)

  if (manual.length > 0) {
    lines.push(
      `${manual.length} item(ns) exigem correção manual do profissional ` +
        `(${manual.map((m) => m.key).join(', ')}). A pontuação final ` +
        `destes itens permanece sinalizada como "[REQUER CORREÇÃO DO PROFISSIONAL]".`,
    )
  }

  if (notApplied.length > 0) {
    lines.push(
      `${notApplied.length} item(ns) não aplicados ou não respondidos ` +
        `→ "[ITEM NÃO APLICADO]". O sistema NÃO inferiu pontuação para estes itens.`,
    )
  }

  if (total === null) {
    lines.push(
      'Pontuação total: NÃO CALCULADA — critério do instrumento não ' +
        'totalmente preenchido (itens manuais/não aplicados).',
    )
  } else {
    // Interpretação de corte apenas quando definida para a escala.
    const cutoff = CUTOFFS[scale.key]
    if (cutoff !== undefined) {
      if (total >= cutoff) {
        lines.push(
          `Pontuação total: ${total} (máx. ${scale.maxTotal}). Desempenho ` +
            `compatível com a faixa de atenção deste instrumento (corte ` +
            `${cutoff}). Área de atenção — sugerida para aprofundamento clínico.`,
        )
      } else {
        lines.push(
          `Pontuação total: ${total} (máx. ${scale.maxTotal}). Desempenho ` +
            `abaixo do corte de atenção (${cutoff}). Não compatível, neste ` +
            `momento, com a faixa de atenção do instrumento.`,
        )
      }
    } else {
      lines.push(
        `Pontuação total: ${total}. A interpretação por corte não está ` +
          `definida para este instrumento no sistema — requer análise ` +
          `qualitativa do profissional.`,
      )
    }
  }

  lines.push(
    'Este registro NÃO constitui diagnóstico. As conclusões acima são ' +
      'indicadores de apoio à decisão clínica e devem ser validadas pelo ' +
      'profissional habilitado.',
  )

  return lines
}

/** Pontuações de corte (área de atenção) por escala, quando definidas. */
const CUTOFFS: Record<string, number> = {
  phq9: 10, // ≥10 moderado
  gad7: 10, // ≥10 moderado
  meem: 24, // <24 área de atenção
  moca: 26, // <26 área de atenção
  mchat: 3, // ≥3 área de atenção (risco positivo)
  snapiv: 0, // interpretado por subescala; sinaliza genérico
  clock: 7, // <7 área de atenção (Sunderland)
}

/** Constrói a seção 7 (itens a confirmar / lacunas). */
function buildGaps(ctx: AssistedRecordContext): string[] {
  const lines: string[] = []
  const manual = ctx.responses.filter((r) => r.requiresManualScoring)
  const ambiguous = ctx.responses.filter((r) =>
    r.flags.includes('[RESPOSTA AMBÍGUA — REQUER MEDIAÇÃO DO PROFISSIONAL]'),
  )
  const notApplied = ctx.responses.filter((r) => r.numericValue === null)
  const needsMediation = ctx.responses.filter((r) =>
    r.flags.includes('[REQUER MEDIAÇÃO DO PROFISSIONAL]'),
  )

  if (
    manual.length === 0 &&
    ambiguous.length === 0 &&
    notApplied.length === 0 &&
    needsMediation.length === 0
  ) {
    lines.push('Nenhuma lacuna registrada nesta aplicação.')
    return lines
  }
  if (manual.length > 0)
    lines.push(`Itens com correção manual pendente: ${manual.map((m) => m.key).join(', ')}.`)
  if (ambiguous.length > 0)
    lines.push(`Respostas ambíguas a confirmar: ${ambiguous.map((m) => m.key).join(', ')}.`)
  if (notApplied.length > 0)
    lines.push(`Itens não aplicados: ${notApplied.map((m) => m.key).join(', ')}.`)
  if (needsMediation.length > 0)
    lines.push(
      `Itens que requereram mediação ativa: ${needsMediation.map((m) => m.key).join(', ')}.`,
    )
  return lines
}

/** Texto exibido para a resposta (literal ou sinalização). */
function responseDisplay(r: AssistedResponseRecord): string {
  if (!r.response || r.response.trim() === '') {
    if (r.numericValue === null) return '[ITEM NÃO APLICADO]'
    return '[SEM RESPOSTA LITERAL REGISTRADA]'
  }
  return r.response
}

/** Texto da pontuação do item. */
function scoreDisplay(r: AssistedResponseRecord): string {
  if (r.requiresManualScoring) return '[REQUER CORREÇÃO DO PROFISSIONAL]'
  if (r.numericValue === null) return '[ITEM NÃO APLICADO]'
  return String(r.numericValue)
}

/** Gera a versão Markdown do registro (para revisão/JSON de texto). */
export function generateAssistedRecordMarkdown(ctx: AssistedRecordContext): string {
  const risk = detectImminentRisk(ctx.responses)
  const lines: string[] = []
  lines.push(`# Registro de Aplicação Assistida — ${ctx.scale.name}`)
  lines.push('')
  lines.push(`> ${ASSISTED_DISCLAIMER}`)
  lines.push('')
  lines.push('## 1. IDENTIFICAÇÃO')
  lines.push(`- Iniciais: ${ctx.iniciais}`)
  lines.push(`- Idade: ${ctx.idade ?? '—'}`)
  lines.push(`- Escolaridade: ${ctx.escolaridade}`)
  lines.push('')
  lines.push('## 2. INSTRUMENTO')
  lines.push(`- Nome: ${ctx.scale.name}`)
  lines.push(`- Versão: ${ctx.scale.version}`)
  lines.push(`- Modo de aplicação: ${ctx.scale.applicationMode}`)
  lines.push(`- Alvo: ${ctx.scale.target === 'responsavel' ? 'Responsável' : 'Paciente'}`)
  lines.push(`- Data da aplicação: ${new Date(ctx.appliedAt).toLocaleString('pt-BR')}`)
  lines.push(`- Profissional: ${ctx.professionalName}`)
  lines.push('')
  lines.push('## 3. ITENS E RESPOSTAS')
  lines.push('| # | Estímulo | Resposta | Pontuação | Observação |')
  lines.push('|---|----------|----------|-----------|-------------|')
  ctx.responses.forEach((r, i) => {
    const est = r.stimulus.replace(/\|/g, '\\|').slice(0, 120)
    const resp = responseDisplay(r).replace(/\|/g, '\\|')
    const sc = scoreDisplay(r).replace(/\|/g, '\\|')
    const obs = (r.observation + ' ' + r.flags.join(' ')).trim().replace(/\|/g, '\\|')
    lines.push(`| ${i + 1} | ${est} | ${resp} | ${sc} | ${obs} |`)
  })
  lines.push('')
  lines.push('## 4. PONTUAÇÃO')
  if (ctx.totalScore === null) {
    lines.push('- Pontuação bruta: NÃO CALCULADA (itens manuais/não aplicados).')
  } else {
    lines.push(`- Pontuação bruta: ${ctx.totalScore} (máx. ${ctx.scale.maxTotal}).`)
  }
  const notApplied = ctx.responses.filter((r) => r.numericValue === null)
  if (notApplied.length > 0)
    lines.push(`- Itens não aplicados: ${notApplied.map((m) => m.key).join(', ')}.`)
  lines.push('')
  lines.push('## 5. INTERPRETAÇÃO ASSISTIDA')
  buildInterpretation(ctx).forEach((l) => lines.push(`- ${l}`))
  if (risk) lines.push('', `**${risk}**`)
  lines.push('')
  lines.push('## 6. OBSERVAÇÕES DO PROFISSIONAL')
  lines.push(ctx.professionalNotes.trim() || 'Sem observações registradas.')
  lines.push('')
  lines.push('## 7. ITENS A CONFIRMAR / LACUNAS')
  buildGaps(ctx).forEach((l) => lines.push(`- ${l}`))
  lines.push('')
  lines.push('## 8. LIMITAÇÕES')
  lines.push(`> ${ASSISTED_DISCLAIMER}`)
  lines.push('')
  lines.push('---')
  lines.push(
    `${CLINIC_BRANDING.name} — ${CLINIC_BRANDING.address} | WhatsApp: ${CLINIC_BRANDING.whatsapp}`,
  )
  return lines.join('\n')
}

/** Gera a versão JSON do registro (para integração com o motor de laudos). */
export function generateAssistedRecordJSON(ctx: AssistedRecordContext) {
  return {
    schema: 'neuroflow.assisted-record.v1',
    generatedAt: new Date().toISOString(),
    scale: {
      key: ctx.scale.key,
      name: ctx.scale.name,
      version: ctx.scale.version,
      applicationMode: ctx.scale.applicationMode,
      target: ctx.scale.target,
      totalKey: ctx.scale.totalKey,
      maxTotal: ctx.scale.maxTotal,
    },
    identification: {
      iniciais: ctx.iniciais,
      idade: ctx.idade,
      escolaridade: ctx.escolaridade,
    },
    appliedAt: ctx.appliedAt,
    professional: ctx.professionalName,
    items: ctx.responses.map((r) => ({
      key: r.key,
      domain: r.domain,
      stimulus: r.stimulus,
      response: responseDisplay(r),
      score: scoreDisplay(r),
      numericValue: r.numericValue,
      observation: r.observation,
      flags: r.flags,
      requiresManualScoring: r.requiresManualScoring,
      requiresMaterial: r.requiresMaterial,
    })),
    totalScore: ctx.totalScore,
    interpretation: buildInterpretation(ctx),
    gaps: buildGaps(ctx),
    imminentRisk: detectImminentRisk(ctx.responses),
    professionalNotes: ctx.professionalNotes,
    disclaimer: ASSISTED_DISCLAIMER,
    clinic: {
      name: CLINIC_BRANDING.name,
      address: CLINIC_BRANDING.address,
      whatsapp: CLINIC_BRANDING.whatsapp,
    },
  }
}

/** Gera e baixa o PDF do registro de aplicação assistida. */
export async function generateAssistedRecordPDF(ctx: AssistedRecordContext): Promise<void> {
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

  // --- Cabeçalho: logo + título ---
  const logoData = await fetchLogoDataUrl()
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', marginX, y, 24, 16)
    } catch {
      /* logo fallback */
    }
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(primary[0], primary[1], primary[2])
  doc.text(CLINIC_BRANDING.name, marginX + 28, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(medium[0], medium[1], medium[2])
  doc.text('Registro de Aplicação Assistida de Escala', marginX + 28, y + 12)
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
  const writeSectionHeader = (index: number | string, text: string) => {
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
    const l = doc.splitTextToSize(text, pageWidth - marginX * 2)
    ensureSpace(l.length * 5 + 2)
    doc.text(l, marginX, y)
    y += l.length * 5 + gap
  }
  const writeBullet = (text: string) => {
    const indent = marginX + 4
    const l = doc.splitTextToSize(text, pageWidth - marginX * 2 - 6)
    ensureSpace(l.length * 5 + 1)
    doc.text('•', marginX, y)
    doc.text(l, indent, y)
    y += l.length * 5 + 1
  }
  const writeLabel = (label: string, value: string, valueIndent = 46) => {
    ensureSpace(6)
    doc.setFont('helvetica', 'bold')
    doc.text(label, marginX, y)
    doc.setFont('helvetica', 'normal')
    const maxValW = pageWidth - marginX * 2 - valueIndent
    const valLines = doc.splitTextToSize(value, maxValW)
    doc.text(valLines, marginX + valueIndent, y)
    y += Math.max(6, valLines.length * 4.5 + 1.5)
  }

  // --- Disclaimer no INÍCIO ---
  ensureSpace(16)
  doc.setFillColor(accent[0], accent[1], accent[2])
  doc.setDrawColor(secondary[0], secondary[1], secondary[2])
  doc.roundedRect(marginX, y, pageWidth - marginX * 2, 16, 2, 2, 'S')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(primary[0], primary[1], primary[2])
  const introLines = doc.splitTextToSize(ASSISTED_DISCLAIMER, pageWidth - marginX * 2 - 6)
  doc.text(introLines, marginX + 3, y + 5)
  y += 20

  // --- 1. IDENTIFICAÇÃO ---
  writeSectionHeader(1, 'IDENTIFICAÇÃO')
  writeLabel('Iniciais:', ctx.iniciais, 46)
  writeLabel('Idade:', ctx.idade !== null ? `${ctx.idade} anos` : '—', 46)
  writeLabel('Escolaridade:', ctx.escolaridade, 46)
  y += 2

  // --- 2. INSTRUMENTO ---
  writeSectionHeader(2, 'INSTRUMENTO')
  writeLabel('Nome:', ctx.scale.name, 46)
  writeLabel('Versão:', ctx.scale.version, 46)
  writeLabel('Modo de aplicação:', ctx.scale.applicationMode, 46)
  writeLabel('Alvo:', ctx.scale.target === 'responsavel' ? 'Responsável' : 'Paciente', 46)
  writeLabel('Data:', new Date(ctx.appliedAt).toLocaleString('pt-BR'), 46)
  writeLabel('Profissional:', ctx.professionalName, 46)
  y += 2

  // --- 3. ITENS E RESPOSTAS ---
  writeSectionHeader(3, 'ITENS E RESPOSTAS')
  ctx.responses.forEach((r, i) => {
    ensureSpace(14)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(primary[0], primary[1], primary[2])
    doc.text(`${i + 1}. [${r.domain}]`, marginX, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(dark[0], dark[1], dark[2])
    writeParagraph(`Estímulo: ${r.stimulus}`)
    writeParagraph(`Resposta: ${responseDisplay(r)}`)
    writeParagraph(`Pontuação: ${scoreDisplay(r)}`)
    const obs = (r.observation + ' ' + r.flags.join(' ')).trim()
    if (obs) writeParagraph(`Observação: ${obs}`)
    y += 1
  })

  // --- 4. PONTUAÇÃO ---
  writeSectionHeader(4, 'PONTUAÇÃO')
  if (ctx.totalScore === null) {
    writeBullet('Pontuação bruta: NÃO CALCULADA (itens manuais/não aplicados).')
  } else {
    writeBullet(`Pontuação bruta: ${ctx.totalScore} (máx. ${ctx.scale.maxTotal}).`)
  }
  const notApplied = ctx.responses.filter((r) => r.numericValue === null)
  if (notApplied.length > 0)
    writeBullet(`Itens não aplicados: ${notApplied.map((m) => m.key).join(', ')}.`)
  y += 2

  // --- 5. INTERPRETAÇÃO ASSISTIDA ---
  writeSectionHeader(5, 'INTERPRETAÇÃO ASSISTIDA (NÃO CONSTITUI DIAGNÓSTICO)')
  buildInterpretation(ctx).forEach((l) => writeBullet(l))
  const risk = detectImminentRisk(ctx.responses)
  if (risk) {
    ensureSpace(16)
    doc.setFillColor(0xfd, 0xe6, 0xe6)
    doc.setDrawColor(0xdc, 0x26, 0x26)
    doc.roundedRect(marginX, y, pageWidth - marginX * 2, 14, 2, 2, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(0xb9, 0x1c, 0x1c)
    const riskLines = doc.splitTextToSize(risk, pageWidth - marginX * 2 - 6)
    doc.text(riskLines, marginX + 3, y + 5)
    y += 18
  }
  y += 2

  // --- 6. OBSERVAÇÕES DO PROFISSIONAL ---
  writeSectionHeader(6, 'OBSERVAÇÕES DO PROFISSIONAL')
  writeParagraph(ctx.professionalNotes.trim() || 'Sem observações registradas.')
  y += 2

  // --- 7. ITENS A CONFIRMAR / LACUNAS ---
  writeSectionHeader(7, 'ITENS A CONFIRMAR / LACUNAS')
  buildGaps(ctx).forEach((l) => writeBullet(l))
  y += 2

  // --- 8. LIMITAÇÕES (disclaimer final) ---
  writeSectionHeader(8, 'LIMITAÇÕES')
  ensureSpace(16)
  doc.setFillColor(accent[0], accent[1], accent[2])
  doc.setDrawColor(secondary[0], secondary[1], secondary[2])
  doc.roundedRect(marginX, y, pageWidth - marginX * 2, 16, 2, 2, 'S')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(primary[0], primary[1], primary[2])
  const finalLines = doc.splitTextToSize(ASSISTED_DISCLAIMER, pageWidth - marginX * 2 - 6)
  doc.text(finalLines, marginX + 3, y + 5)
  y += 20

  // --- Assinatura ---
  ensureSpace(20)
  y += 6
  doc.setDrawColor(medium[0], medium[1], medium[2])
  doc.setLineWidth(0.3)
  doc.line(marginX + 40, y + 14, marginX + 130, y + 14)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(dark[0], dark[1], dark[2])
  doc.text(ctx.professionalName, marginX + 40, y + 19)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(medium[0], medium[1], medium[2])
  doc.text(`${CLINICIAN_CREDENTIALS.crm} / ${CLINICIAN_CREDENTIALS.rqe}`, marginX + 40, y + 24)
  const sigNow = new Date()
  doc.text(
    `Assinado digitalmente em ${sigNow.toLocaleDateString('pt-BR')} às ${sigNow.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    marginX + 40,
    y + 29,
  )

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
    `Emitido em ${sigNow.toLocaleString('pt-BR')} · Documento em conformidade com a LGPD (Lei nº 13.709/2018). Paciente identificado apenas por iniciais.`,
    marginX,
    footerY + 8,
  )

  const safeName = ctx.iniciais.replace(/[^a-zA-Z0-9]/g, '_')
  doc.save(`registro-assistido-${ctx.scale.key}-${safeName}.pdf`)
}

/** Baixa um blob de texto (markdown/json) com o nome de arquivo dado. */
export function downloadTextFile(content: string, filename: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Helper: constrói o contexto do registro a partir das respostas + escala. */
export function buildRecordResponses(
  scale: AssistedScale,
  answers: Record<
    string,
    {
      response: string
      numeric: number | null
      observation: string
      flags: string[]
      repetitions: number
    }
  >,
): AssistedResponseRecord[] {
  return scale.items.map((item: AssistedItem) => {
    const a = answers[item.key]
    return {
      key: item.key,
      stimulus: item.stimulus,
      domain: item.domain,
      response: a?.response ?? '',
      numericValue: a?.numeric ?? null,
      observation:
        a?.observation ?? (a?.repetitions ? `Repetição do estímulo: ${a.repetitions}x.` : ''),
      flags: a?.flags ?? [],
      requiresManualScoring: !!item.requiresManualScoring,
      requiresMaterial: !!item.requiresMaterial,
    }
  })
}
