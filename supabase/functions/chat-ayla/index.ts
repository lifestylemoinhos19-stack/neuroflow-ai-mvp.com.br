import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  addDays,
  nextFriday,
  nextSaturday,
  format,
  startOfDay,
  parseISO,
} from 'npm:date-fns@4.1.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface BookingState {
  checkIn?: string // 'yyyy-MM-dd'
  checkOut?: string // 'yyyy-MM-dd'
  guests?: number
  hasExplicitGuests?: boolean
  category?: string
  suiteId?: string
  suiteName?: string
  step?: 'ask_dates' | 'ask_guests' | 'show_options' | 'closing' | 'completed'
}

const MONTHS: Record<string, number> = {
  janeiro: 0,
  jan: 0,
  fevereiro: 1,
  fev: 1,
  marco: 2,
  mar: 2,
  abril: 3,
  abr: 3,
  maio: 4,
  mai: 4,
  junho: 5,
  jun: 5,
  julho: 6,
  jul: 6,
  agosto: 7,
  ago: 7,
  setembro: 8,
  set: 8,
  outubro: 9,
  out: 9,
  novembro: 10,
  nov: 10,
  dezembro: 11,
  dez: 11,
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Robust date parser supporting natural language in Portuguese and standard numerical formats
 */
export function extractDates(message: string): { start: Date; end: Date } | null {
  const norm = normalizeText(message)
  const today = startOfDay(new Date())
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()

  // 1. Numerical format: DD/MM/YYYY a DD/MM/YYYY or DD/MM a DD/MM (or '-' / 'ate' / 'e')
  const slashRangeRegex =
    /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s*(?:a|ate|e|-|\/)\s*(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i
  const matchSlash = norm.match(slashRangeRegex)
  if (matchSlash) {
    const sDay = parseInt(matchSlash[1], 10)
    const sMonth = parseInt(matchSlash[2], 10) - 1
    let sYear = matchSlash[3] ? parseInt(matchSlash[3], 10) : currentYear
    if (sYear < 100) sYear += 2000

    const eDay = parseInt(matchSlash[4], 10)
    const eMonth = parseInt(matchSlash[5], 10) - 1
    let eYear = matchSlash[6] ? parseInt(matchSlash[6], 10) : sYear
    if (eYear < 100) eYear += 2000

    if (!matchSlash[3] && sMonth < currentMonth) sYear++
    if (!matchSlash[6] && (eMonth < sMonth || (eMonth === sMonth && eDay < sDay))) eYear = sYear + 1

    const start = new Date(sYear, sMonth, sDay)
    const end = new Date(eYear, eMonth, eDay)
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      return { start, end: end.getTime() <= start.getTime() ? addDays(start, 1) : end }
    }
  }

  // 2. Full range with two months: "dia 12 de setembro a dia 15 de outubro" / "12 set a 15 out"
  const fullMonthRangeRegex =
    /(?:dia\s*)?(\d{1,2})\s*(?:de\s*)?(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\s*(?:a|ate|e|-)\s*(?:dia\s*)?(\d{1,2})\s*(?:de\s*)?(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)(?:\s*(?:de\s*)?(\d{4}))?/i
  const matchFullMonth = norm.match(fullMonthRangeRegex)
  if (matchFullMonth) {
    const sDay = parseInt(matchFullMonth[1], 10)
    const sMonth = MONTHS[matchFullMonth[2]]
    const eDay = parseInt(matchFullMonth[3], 10)
    const eMonth = MONTHS[matchFullMonth[4]]
    const explicitYear = matchFullMonth[5] ? parseInt(matchFullMonth[5], 10) : currentYear

    let sYear = explicitYear
    let eYear = explicitYear
    if (!matchFullMonth[5] && sMonth < currentMonth) {
      sYear++
      eYear++
    }
    if (eMonth < sMonth) {
      eYear = sYear + 1
    }

    const start = new Date(sYear, sMonth, sDay)
    const end = new Date(eYear, eMonth, eDay)
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      return { start, end: end.getTime() <= start.getTime() ? addDays(start, 1) : end }
    }
  }

  // 3. Same month range: "12 a 14 de setembro", "dia 12 ate 14 de set", "12 a 14 set", "10 e 12 de novembro"
  const sameMonthRangeRegex =
    /(?:dia\s*)?(\d{1,2})\s*(?:a|ate|e|-)\s*(?:dia\s*)?(\d{1,2})\s*(?:de\s*)?(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)(?:\s*(?:de\s*)?(\d{4}))?/i
  const matchSameMonth = norm.match(sameMonthRangeRegex)
  if (matchSameMonth) {
    const sDay = parseInt(matchSameMonth[1], 10)
    const eDay = parseInt(matchSameMonth[2], 10)
    const month = MONTHS[matchSameMonth[3]]
    let year = matchSameMonth[4] ? parseInt(matchSameMonth[4], 10) : currentYear
    if (!matchSameMonth[4] && month < currentMonth) year++

    const start = new Date(year, month, sDay)
    const end = new Date(year, month, eDay)
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      return { start, end: end.getTime() <= start.getTime() ? addDays(start, 1) : end }
    }
  }

  // 4. Next month range: "12 a 15 do mes que vem" / "12 a 15 do proximo mes" / "mes que vem"
  const nextMonthRangeRegex =
    /(?:dia\s*)?(\d{1,2})\s*(?:a|ate|e|-)\s*(?:dia\s*)?(\d{1,2})\s*(?:do\s*(?:mes\s*que\s*vem|proximo\s*mes))/i
  const matchNextMonthRange = norm.match(nextMonthRangeRegex)
  if (matchNextMonthRange) {
    const sDay = parseInt(matchNextMonthRange[1], 10)
    const eDay = parseInt(matchNextMonthRange[2], 10)
    const nextMonth = new Date(currentYear, currentMonth + 1, 1)
    const start = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), sDay)
    const end = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), eDay)
    return { start, end: end.getTime() <= start.getTime() ? addDays(start, 1) : end }
  }

  // 5. "dia X a Y deste mes" / "dia X a Y desse mes"
  const rangeThisMonthRegex =
    /(?:dia\s*)?(\d{1,2})\s*(?:a|ate|e|-)\s*(?:dia\s*)?(\d{1,2})\s*(?:deste|desse|do)\s*mes/i
  const matchRangeThisMonth = norm.match(rangeThisMonthRegex)
  if (matchRangeThisMonth) {
    const sDay = parseInt(matchRangeThisMonth[1], 10)
    const eDay = parseInt(matchRangeThisMonth[2], 10)
    const start = new Date(currentYear, currentMonth, sDay)
    const end = new Date(currentYear, currentMonth, eDay)
    return { start, end: end.getTime() <= start.getTime() ? addDays(start, 1) : end }
  }

  // 6. Bare numerical range: "12 a 14", "12 ate 14", "de 12 a 15" (implies current month or next if passed)
  const bareRangeRegex = /(?:de\s*|dia\s*)?(\d{1,2})\s*(?:a|ate|-)\s*(?:dia\s*)?(\d{1,2})(?!\s*(?:hospedes|pessoas|adultos|casais|noites|dias))/i
  const matchBareRange = norm.match(bareRangeRegex)
  if (
    matchBareRange &&
    !norm.includes('pessoas') &&
    !norm.includes('hospedes') &&
    !norm.includes('adultos')
  ) {
    const sDay = parseInt(matchBareRange[1], 10)
    const eDay = parseInt(matchBareRange[2], 10)
    if (sDay >= 1 && sDay <= 31 && eDay >= 1 && eDay <= 31 && sDay !== eDay) {
      let targetMonth = currentMonth
      let targetYear = currentYear
      // If sDay is already in the past this month, assume next month
      if (sDay < today.getDate()) {
        targetMonth++
        if (targetMonth > 11) {
          targetMonth = 0
          targetYear++
        }
      }
      const start = new Date(targetYear, targetMonth, sDay)
      const end = new Date(targetYear, targetMonth, eDay)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        return { start, end: end.getTime() <= start.getTime() ? addDays(start, 1) : end }
      }
    }
  }

  // 7. Single day with month: "15 de setembro", "15/09", "15 set"
  const singleDayMonthRegex =
    /(?:dia\s*)?(\d{1,2})\s*(?:de\s*)?(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)(?:\s*(?:de\s*)?(\d{4}))?/i
  const matchSingleDay = norm.match(singleDayMonthRegex)
  if (matchSingleDay) {
    const sDay = parseInt(matchSingleDay[1], 10)
    const month = MONTHS[matchSingleDay[2]]
    let year = matchSingleDay[3] ? parseInt(matchSingleDay[3], 10) : currentYear
    if (!matchSingleDay[3] && month < currentMonth) year++

    const start = new Date(year, month, sDay)
    return { start, end: addDays(start, 1) }
  }

  // 8. Numerical single date: DD/MM/YYYY or DD/MM
  const singleSlashRegex = /(?:dia\s*)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i
  const matchSingleSlash = norm.match(singleSlashRegex)
  if (matchSingleSlash) {
    const sDay = parseInt(matchSingleSlash[1], 10)
    const sMonth = parseInt(matchSingleSlash[2], 10) - 1
    let sYear = matchSingleSlash[3] ? parseInt(matchSingleSlash[3], 10) : currentYear
    if (sYear < 100) sYear += 2000
    if (!matchSingleSlash[3] && sMonth < currentMonth) sYear++

    const start = new Date(sYear, sMonth, sDay)
    if (!isNaN(start.getTime())) {
      return { start, end: addDays(start, 1) }
    }
  }

  // 9. "dia X deste mes" / "dia X desse mes" / "dia X"
  const singleDayThisMonthRegex = /(?:dia\s*)(\d{1,2})(?:\s*(?:deste|desse|do)\s*mes)?/i
  const matchSingleThisMonth = norm.match(singleDayThisMonthRegex)
  if (
    matchSingleThisMonth &&
    !norm.includes('pessoas') &&
    !norm.includes('hospedes') &&
    !norm.includes('adultos')
  ) {
    const sDay = parseInt(matchSingleThisMonth[1], 10)
    if (sDay >= 1 && sDay <= 31) {
      let targetMonth = currentMonth
      let targetYear = currentYear
      if (sDay < today.getDate()) {
        targetMonth++
        if (targetMonth > 11) {
          targetMonth = 0
          targetYear++
        }
      }
      const start = new Date(targetYear, targetMonth, sDay)
      return { start, end: addDays(start, 1) }
    }
  }

  // 10. "próximo fim de semana" / "fim de semana que vem" / "final de semana que vem" / "fds que vem"
  if (
    norm.includes('proximo fim de semana') ||
    norm.includes('proximo final de semana') ||
    norm.includes('fim de semana que vem') ||
    norm.includes('final de semana que vem') ||
    norm.includes('proximo fds') ||
    norm.includes('fds que vem') ||
    norm.includes('semana que vem')
  ) {
    const friday = nextFriday(today)
    return { start: friday, end: addDays(friday, 2) }
  }

  // 11. "este fim de semana" / "esse fim de semana" / "fim de semana" / "fds"
  if (
    norm.includes('este fim de semana') ||
    norm.includes('esse fim de semana') ||
    norm.includes('este final de semana') ||
    norm.includes('esse final de semana') ||
    norm.includes('fim de semana') ||
    norm.includes('final de semana') ||
    norm.includes('fds') ||
    norm.includes('weekend')
  ) {
    const currentDay = today.getDay()
    const friday =
      currentDay === 5 ? today : currentDay === 6 ? addDays(today, -1) : nextFriday(today)
    return { start: friday, end: addDays(friday, 2) }
  }

  // 12. "amanhã" / "hoje"
  if (norm.includes('amanha')) {
    const tomorrow = addDays(today, 1)
    return { start: tomorrow, end: addDays(tomorrow, 1) }
  }
  if (norm.includes('hoje')) {
    return { start: today, end: addDays(today, 1) }
  }

  // 13. "mês que vem" / "proximo mes"
  if (norm.includes('mes que vem') || norm.includes('proximo mes')) {
    const nextMonth = new Date(currentYear, currentMonth + 1, 1)
    const nextMonthEnd = new Date(currentYear, currentMonth + 2, 0)
    // Default to the first weekend of next month
    const firstFri = nextFriday(nextMonth)
    return { start: firstFri, end: addDays(firstFri, 2) }
  }

  // 14. Full month mention alone: "em setembro", "no mês de outubro", "para novembro"
  const monthRegex =
    /(?:em|no\s*mes\s*de|para|mes\s*de)?\s*(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i
  const matchMonth = norm.match(monthRegex)
  if (matchMonth && matchMonth[1]) {
    const month = MONTHS[matchMonth[1]]
    let year = currentYear
    if (month < currentMonth) year++
    const firstFri = nextFriday(new Date(year, month, 1))
    return { start: firstFri, end: addDays(firstFri, 2) }
  }

  return null
}

/**
 * Extracts number of guests from message
 */
export function extractGuests(message: string): number | null {
  const norm = normalizeText(message)

  // Explicit number with words
  const guestsRegex =
    /(\d+)\s*(?:hospedes?|pessoas?|adultos?|lugares?|casais?|hospede|pessoa|adulto)/i
  const match = norm.match(guestsRegex)
  if (match) {
    const count = parseInt(match[1], 10)
    if (count > 0 && count <= 20) return count
  }

  // Word-based numbers
  if (
    norm.includes('casal') ||
    norm.includes('eu e meu marido') ||
    norm.includes('eu e minha esposa') ||
    norm.includes('eu e minha namorada') ||
    norm.includes('eu e meu namorado') ||
    norm.includes('duas pessoas') ||
    norm.includes('2 pessoas') ||
    norm.includes('dois adultos') ||
    norm.includes('2 adultos') ||
    norm.includes('eu e mais um') ||
    norm.includes('eu e mais uma') ||
    norm.includes('duas') ||
    norm.includes('dois')
  ) {
    return 2
  }
  if (
    norm.includes('sozinho') ||
    norm.includes('sozinha') ||
    norm.includes('uma pessoa') ||
    norm.includes('1 pessoa') ||
    norm.includes('apenas eu') ||
    norm.includes('somente eu') ||
    norm.includes('1 adulto') ||
    norm.includes('individual') ||
    norm.includes('uma') ||
    norm.includes('um')
  ) {
    return 1
  }
  if (
    norm.includes('tres pessoas') ||
    norm.includes('3 pessoas') ||
    norm.includes('tres adultos') ||
    norm.includes('tres')
  ) {
    return 3
  }
  if (
    norm.includes('quatro pessoas') ||
    norm.includes('4 pessoas') ||
    norm.includes('quatro adultos') ||
    norm.includes('quatro')
  ) {
    return 4
  }

  // Bare number when replying (e.g. "2", "3", "4")
  const bareNumMatch = norm.match(/^\s*(\d+)\s*$/)
  if (bareNumMatch) {
    const n = parseInt(bareNumMatch[1], 10)
    if (n >= 1 && n <= 10) return n
  }

  return null
}

/**
 * Extracts suite category preference if mentioned
 */
export function extractCategory(message: string): string | null {
  const norm = normalizeText(message)
  if (norm.includes('presidencial') || norm.includes('loubath')) return 'Presidencial'
  if (norm.includes('luxo') || norm.includes('patiet') || norm.includes('terrus')) return 'Luxo'
  if (norm.includes('especial') || norm.includes('bonnard') || norm.includes('cezanne')) return 'Especial'
  if (norm.includes('superior') || norm.includes('forain')) return 'Superior'
  if (
    norm.includes('standard') ||
    norm.includes('padrao') ||
    norm.includes('degas') ||
    norm.includes('gaugin') ||
    norm.includes('monet') ||
    norm.includes('pissarro') ||
    norm.includes('renoir') ||
    norm.includes('sisley') ||
    norm.includes('tolouse') ||
    norm.includes('utrillo')
  )
    return 'Standard'
  return null
}

/**
 * Checks if the user is confirming/accepting to proceed with booking or wants to book
 */
export function isBookingIntent(message: string): boolean {
  const norm = normalizeText(message)
  return (
    norm.includes('quero reservar') ||
    norm.includes('gostaria de reservar') ||
    norm.includes('como reservar') ||
    norm.includes('reservar') ||
    norm.includes('reserva') ||
    norm.includes('fechar') ||
    norm.includes('garantir') ||
    norm.includes('quero essa') ||
    norm.includes('quero esse') ||
    norm.includes('vamos fechar') ||
    norm.includes('pode reservar') ||
    norm.includes('quero a ') ||
    norm.includes('quero o ') ||
    norm.includes('escolho') ||
    norm.includes('gostei da') ||
    norm.includes('gostei do') ||
    norm.includes('pode ser a') ||
    norm.includes('pode ser o') ||
    norm.includes('prefiro a') ||
    norm.includes('prefiro o') ||
    norm.includes('vou querer')
  )
}

/**
 * Scans conversation history to rebuild the current booking state
 */
export function buildStateFromHistory(
  history: ChatMessage[],
  currentMessage: string,
): {
  state: BookingState
  lastAssistantQuestion: 'dates' | 'guests' | 'category' | 'closing' | 'none'
} {
  const state: BookingState = { guests: 2, hasExplicitGuests: false }
  let lastAssistantQuestion: 'dates' | 'guests' | 'category' | 'closing' | 'none' = 'none'

  // Analyze all messages in order
  const allMessages = [...history]
  if (currentMessage) {
    allMessages.push({ role: 'user', content: currentMessage })
  }

  for (let i = 0; i < allMessages.length; i++) {
    const msg = allMessages[i]
    const norm = normalizeText(msg.content)

    if (msg.role === 'user') {
      const dates = extractDates(msg.content)
      if (dates) {
        state.checkIn = format(dates.start, 'yyyy-MM-dd')
        state.checkOut = format(dates.end, 'yyyy-MM-dd')
      }

      const guests = extractGuests(msg.content)
      if (guests !== null) {
        state.guests = guests
        state.hasExplicitGuests = true
      }

      const cat = extractCategory(msg.content)
      if (cat) {
        state.category = cat
      }
    } else if (msg.role === 'assistant') {
      // Analyze what the assistant asked
      if (
        norm.includes('quais seriam as datas') ||
        norm.includes('quais datas') ||
        norm.includes('para quais datas') ||
        norm.includes('me informe a data') ||
        norm.includes('qual o periodo') ||
        norm.includes('qual periodo')
      ) {
        lastAssistantQuestion = 'dates'
      } else if (
        norm.includes('quantas pessoas') ||
        norm.includes('quantos hospedes') ||
        norm.includes('numero de hospedes') ||
        norm.includes('numero de pessoas') ||
        norm.includes('quantos adultos')
      ) {
        lastAssistantQuestion = 'guests'
      } else if (
        norm.includes('qual dessas categorias') ||
        norm.includes('qual categoria') ||
        norm.includes('temos excelentes opcoes') ||
        norm.includes('opcoes disponiveis')
      ) {
        lastAssistantQuestion = 'category'
      } else if (
        norm.includes('condicoes de pagamento') ||
        norm.includes('resumo da reserva') ||
        norm.includes('perfeita escolha')
      ) {
        lastAssistantQuestion = 'closing'
      }
    }
  }

  return { state, lastAssistantQuestion }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { message = '', messages = [], action, miniData, state: clientState } = body

    // Legacy action handler
    if (action === 'clinical_summary' && miniData) {
      const { positiveModules = [], sessionDate, totalModules = 16 } = miniData
      let summary = '## Resumo Clínico – MINI 5.0.0\n\n'
      summary += `**Data da Avaliação:** ${new Date(sessionDate).toLocaleDateString('pt-BR')}\n\n`
      if (positiveModules.length > 0) {
        summary += '### Módulos Positivos Identificados:\n\n'
        for (const mod of positiveModules) {
          summary += `- **${mod.module}**: ${mod.result}\n`
        }
        summary += `\n**Total de módulos positivos:** ${positiveModules.length} de ${totalModules}\n`
      } else {
        summary += '### Nenhum módulo identificado como positivo na avaliação atual.\n\n'
      }
      return new Response(JSON.stringify({ reply: summary }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authHeader = req.headers.get('Authorization')
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
    })
    const supabaseService = createClient(supabaseUrl, supabaseServiceRole)

    let isAdmin = false
    let userName = 'Hóspede'
    if (authHeader) {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser()
      if (user) {
        const { data: profile } = await supabaseService
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (profile) {
          if (
            profile.role === 'admin' ||
            profile.role === 'gerente' ||
            profile.role === 'recepcionista'
          ) {
            isAdmin = true
          }
          userName = profile.full_name || profile.role
        }
      }
    }

    // 1. Rebuild and maintain state across conversation turns
    const historyList: ChatMessage[] = Array.isArray(messages) ? messages : []
    const { state: historyState, lastAssistantQuestion } = buildStateFromHistory(historyList, message)

    const currentState: BookingState = {
      guests: 2,
      hasExplicitGuests: false,
      ...historyState,
      ...(clientState || {}),
    }

    // Parse current message entities
    const currentMsgDates = extractDates(message)
    const currentMsgGuests = extractGuests(message)
    const currentMsgCategory = extractCategory(message)

    if (currentMsgDates) {
      currentState.checkIn = format(currentMsgDates.start, 'yyyy-MM-dd')
      currentState.checkOut = format(currentMsgDates.end, 'yyyy-MM-dd')
    }

    if (currentMsgGuests !== null) {
      currentState.guests = currentMsgGuests
      currentState.hasExplicitGuests = true
    }

    if (currentMsgCategory) {
      currentState.category = currentMsgCategory
    }

    const lower = message.toLowerCase()
    const norm = normalizeText(message)

    // Helper: Query suites availability & dynamic prices
    async function getAvailability(
      checkInStr: string,
      checkOutStr: string,
      guestCount: number = 2,
    ) {
      const { data: suites, error: suitesError } = await supabaseService
        .from('suites')
        .select('*')
        .eq('ativo', true)
        .gte('capacity', guestCount)
      if (suitesError) throw suitesError

      const { data: reservations, error: resError } = await supabaseService
        .from('reservations')
        .select('suite_id')
        .neq('status', 'cancelled')
        .lt('check_in_date', checkOutStr)
        .gt('check_out_date', checkInStr)
      if (resError) throw resError
      const reservedIds = reservations?.map((r: any) => r.suite_id) || []

      const { data: blocks, error: blocksError } = await supabaseService
        .from('disponibilidade')
        .select('suite_id')
        .gte('data', checkInStr)
        .lt('data', checkOutStr)
        .or('disponivel.eq.false,bloqueado.eq.true')
      if (blocksError) throw blocksError
      const blockedIds = blocks?.map((b: any) => b.suite_id) || []

      const unavailableIds = new Set([...reservedIds, ...blockedIds])
      const availableSuites = suites?.filter((s: any) => !unavailableIds.has(s.id)) || []

      if (availableSuites.length === 0) {
        return { availableSuites: [], suggestedSuites: [], totalDays: 0, pricesBySuite: {} }
      }

      // Group by category (pick 1 best suite per category)
      const categoriesMap = new Map<string, any>()
      for (const s of availableSuites) {
        if (!categoriesMap.has(s.category)) {
          categoriesMap.set(s.category, s)
        }
      }
      const suggestedSuites = Array.from(categoriesMap.values())

      const { data: disponibilidades } = await supabaseService
        .from('disponibilidade')
        .select('suite_id, data, tarifa_ajustada')
        .gte('data', checkInStr)
        .lt('data', checkOutStr)
        .in(
          'suite_id',
          suggestedSuites.map((s: any) => s.id),
        )

      const { data: activeTarifas } = await supabaseService
        .from('tarifas')
        .select('*')
        .lte('data_inicio', checkOutStr)
        .gte('data_fim', checkInStr)

      const { data: regras } = await supabaseService
        .from('regras_reserva')
        .select('*')
        .eq('ativo', true)

      const start = parseISO(checkInStr)
      const end = parseISO(checkOutStr)
      let days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      if (days <= 0) days = 1

      const pricesBySuite: Record<string, { total: number; dailyAvg: number }> = {}

      suggestedSuites.forEach((suite: any) => {
        let total = 0
        for (let i = 0; i < days; i++) {
          const currentDayObj = addDays(start, i)
          const currentDate = format(currentDayObj, 'yyyy-MM-dd')
          const dayOfWeek = currentDayObj.getDay()

          const disp = disponibilidades?.find(
            (d: any) => d.suite_id === suite.id && d.data === currentDate,
          )
          let dailyPrice =
            disp && disp.tarifa_ajustada > 0 ? disp.tarifa_ajustada : suite.price_per_night

          const aplicableTarifa = activeTarifas?.find(
            (t: any) =>
              (t.suite_id === null || t.suite_id === suite.id) &&
              currentDate >= t.data_inicio &&
              currentDate <= t.data_fim,
          )
          if (aplicableTarifa) {
            dailyPrice *= Number(aplicableTarifa.percentual_ajuste || 1)
          }

          const suiteRegras =
            regras?.filter(
              (r: any) =>
                (r.suite_id === suite.id || !r.suite_id) &&
                (!r.dias_semana || r.dias_semana.includes(dayOfWeek)),
            ) || []
          for (const regra of suiteRegras) {
            if (
              regra.tipo_regra === 'multiplicador' ||
              regra.tipo_regra === 'multiplicador_tarifa'
            ) {
              dailyPrice *= (regra.valor || 100) / 100
            } else if (regra.tipo_regra === 'acrescimo' || regra.tipo_regra === 'taxa_fixa') {
              dailyPrice += regra.valor || 0
            }
          }

          total += dailyPrice
        }
        pricesBySuite[suite.id] = { total, dailyAvg: total / days }
      })

      return { availableSuites, suggestedSuites, totalDays: days, pricesBySuite }
    }

    // Helper: Build reply with available suites and direct booking link
    function buildAvailabilityReply(
      checkInStr: string,
      checkOutStr: string,
      suggestedSuites: any[],
      pricesBySuite: Record<string, { total: number; dailyAvg: number }>,
      days: number,
      guestCount: number,
    ) {
      const sDate = parseISO(checkInStr)
      const eDate = parseISO(checkOutStr)
      const bookingUrl = `/book?check_in=${checkInStr}&check_out=${checkOutStr}&guests=${guestCount}`

      let text = `Temos excelentes opções disponíveis de **${format(sDate, 'dd/MM')}** a **${format(eDate, 'dd/MM')}** (para ${guestCount} ${guestCount === 1 ? 'hóspede' : 'hóspedes'}, ${days} diária${days > 1 ? 's' : ''}):\n\n`

      suggestedSuites.forEach((suite: any) => {
        const pricing = pricesBySuite[suite.id]
        const total = pricing ? pricing.total : suite.price_per_night * days
        text += `✨ **Categoria ${suite.category}** – ${suite.name}\n`
        if (suite.description) {
          text += `   _${suite.description}_\n`
        }
        text += `   💰 **R$ ${total.toFixed(2)} total** (${days} diária${days > 1 ? 's' : ''})\n\n`
      })

      text += `Qual dessas categorias você prefere? Posso conduzir a reserva da sua escolhida agora ou você pode [clicar aqui para reservar diretamente pelo nosso site](${bookingUrl}).`
      return text
    }

    // Helper: Build closing message when guest picks a category/suite
    function buildClosingReply(
      checkInStr: string,
      checkOutStr: string,
      category: string,
      suite: any | null,
      priceTotal: number,
      guestCount: number,
    ) {
      const sDate = parseISO(checkInStr)
      const eDate = parseISO(checkOutStr)
      const deposit = priceTotal * 0.5
      const balance = priceTotal * 0.5
      const bookingUrl = `/book?check_in=${checkInStr}&check_out=${checkOutStr}&guests=${guestCount}`

      const suiteName = suite ? suite.name : `Suíte Categoria ${category}`

      let text = `Perfeita escolha! 🎉 Vamos aos detalhes para garantir sua reserva:\n\n`
      text += `📋 **Resumo da Reserva:**\n`
      text += `• **Acomodação:** ${suiteName} (Categoria ${category})\n`
      text += `• **Período:** ${format(sDate, 'dd/MM/yyyy')} até ${format(eDate, 'dd/MM/yyyy')}\n`
      text += `• **Hóspedes:** ${guestCount} ${guestCount === 1 ? 'pessoa' : 'pessoas'}\n`
      text += `• **Valor Total:** R$ ${priceTotal.toFixed(2)}\n\n`

      text += `💳 **Condições de Pagamento:**\n`
      text += `• **Sinal / Garantia:** R$ ${deposit.toFixed(2)} (50%) via PIX ou Cartão de Crédito (em até 3x sem juros: Visa, Mastercard, Elo, Amex).\n`
      text += `• **Saldo Restante:** R$ ${balance.toFixed(2)} (50%) a ser pago no momento do check-in na pousada.\n\n`

      text += `Para concluir e emitir sua confirmação instantânea com total segurança, [clique aqui para finalizar sua reserva](${bookingUrl})!\n\n`
      text += `Se preferir, posso também tirar qualquer dúvida sobre tratamentos de Spa para adicionar à sua experiência.`
      return text
    }

    // 2. Check Spa Services inquiries
    const { data: spaServices } = await supabaseService.from('spa_services').select('*')
    let matchedSpaService = null
    if (spaServices && spaServices.length > 0) {
      const sortedServices = [...spaServices].sort((a, b) => b.name.length - a.name.length)
      for (const service of sortedServices) {
        if (lower.includes(service.name.toLowerCase())) {
          matchedSpaService = service
          break
        }
      }
    }

    if (matchedSpaService) {
      const reply = `Sobre o tratamento **${matchedSpaService.name}**:\n\n_${matchedSpaService.description || 'Um de nossos maravilhosos tratamentos para seu relaxamento.'}_\n\nEle tem duração de ${matchedSpaService.duration_minutes} minutos e o valor é R$ ${matchedSpaService.price.toFixed(2)}.\n\nÉ uma excelente escolha para o seu bem-estar! Gostaria de agendar este serviço junto com sua estadia?`
      return new Response(JSON.stringify({ reply, state: currentState }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (
      lower.includes('spa') ||
      lower.includes('massagem') ||
      lower.includes('tratamento') ||
      lower.includes('serviços do spa') ||
      lower.includes('servicos do spa')
    ) {
      let reply = ''
      if (!spaServices || spaServices.length === 0) {
        reply =
          'Temos diversos serviços de Spa para seu bem-estar, que requerem agendamento prévio. Você pode adicionar ao reservar sua suíte ou falar com nossa equipe!'
      } else {
        reply =
          'Temos serviços incríveis de Spa para o seu relaxamento e bem-estar! Aqui estão nossas opções:\n'

        const categoriesMap = new Map<string, any[]>()
        for (const s of spaServices) {
          if (!categoriesMap.has(s.category)) categoriesMap.set(s.category, [])
          categoriesMap.get(s.category)!.push(s)
        }

        categoriesMap.forEach((services, cat) => {
          reply += `\n🌿 **${cat}**\n`
          services.forEach((service) => {
            reply += `\n✨ **${service.name}**\n`
            if (service.description) {
              reply += `_${service.description}_\n`
            }
            reply += `⏱️ ${service.duration_minutes} min | 💰 R$ ${service.price.toFixed(2)}\n`
          })
        })
        reply +=
          '\nQual destes tratamentos mais chamou sua atenção? Posso incluí-lo na sua reserva!'
      }
      return new Response(JSON.stringify({ reply, state: currentState }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Admin queries
    if (
      isAdmin &&
      (lower.includes('check-in') || lower.includes('check in') || lower.includes('chegam')) &&
      (lower.includes('hoje') || lower.includes('today'))
    ) {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const { data: checkins, error } = await supabaseService
        .from('reservations')
        .select('id, guest_id, guests(first_name, last_name), suites(name)')
        .eq('check_in_date', todayStr)
        .eq('status', 'confirmed')

      if (error) throw error

      let reply = ''
      if (checkins && checkins.length > 0) {
        reply = `Olá, ${userName}. Hoje temos ${checkins.length} check-in(s):\n${checkins.map((c: any) => `- ${c.guests?.first_name} ${c.guests?.last_name || ''} na ${c.suites?.name}`).join('\n')}`
      } else {
        reply = `Olá, ${userName}. Não temos nenhum check-in agendado para hoje.`
      }
      return new Response(JSON.stringify({ reply, state: currentState }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (
      isAdmin &&
      (lower.includes('vazi') || lower.includes('livre') || lower.includes('empty')) &&
      (lower.includes('quarto') || lower.includes('suíte') || lower.includes('suite'))
    ) {
      const dates =
        currentMsgDates ||
        (currentState.checkIn && currentState.checkOut
          ? { start: parseISO(currentState.checkIn), end: parseISO(currentState.checkOut) }
          : { start: new Date(), end: addDays(new Date(), 1) })
      const startStr = format(dates.start, 'yyyy-MM-dd')
      const endStr = format(dates.end, 'yyyy-MM-dd')

      const { data: reserved, error: resError } = await supabaseService
        .from('reservations')
        .select('suite_id')
        .neq('status', 'cancelled')
        .lt('check_in_date', endStr)
        .gt('check_out_date', startStr)

      if (resError) throw resError

      const reservedIds = reserved?.map((r: any) => r.suite_id) || []
      const { data: allSuites } = await supabaseService
        .from('suites')
        .select('id, name')
        .eq('ativo', true)
      const emptySuites = allSuites?.filter((s: any) => !reservedIds.includes(s.id)) || []

      let reply = ''
      if (emptySuites.length > 0) {
        reply = `Olá, ${userName}. Temos ${emptySuites.length} suíte(s) livre(s) para o período de ${format(dates.start, 'dd/MM')} a ${format(dates.end, 'dd/MM')}:\n${emptySuites.map((s: any) => `- ${s.name}`).join('\n')}`
      } else {
        reply = `Olá, ${userName}. Todas as nossas suítes estão ocupadas no período solicitado!`
      }
      return new Response(JSON.stringify({ reply, state: currentState }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Payment questions
    if (
      lower.includes('pagamento') ||
      lower.includes('pagar') ||
      lower.includes('pix') ||
      lower.includes('cartão') ||
      lower.includes('cartao') ||
      lower.includes('parcelamento') ||
      lower.includes('parcelar') ||
      lower.includes('sinal') ||
      lower.includes('garantia')
    ) {
      const reply =
        `Para garantir a sua reserva e planejar suas despesas, confira nossas condições de pagamento:\n\n` +
        `• **Garantia / Sinal:** É necessário o pagamento de 50% do valor total via PIX ou Cartão de Crédito no momento da reserva para garanti-la.\n` +
        `• **Saldo Restante:** Os 50% restantes são pagos apenas no momento do check-in na pousada.\n` +
        `• **Cartões Aceitos:** Aceitamos as principais bandeiras (Visa, Mastercard, Elo e Amex).\n` +
        `• **Parcelamento:** O valor pode ser parcelado em até 3x sem juros no cartão de crédito.\n\n` +
        (currentState.checkIn && currentState.checkOut
          ? `Gostaria de concluir a reserva para as datas de **${format(parseISO(currentState.checkIn), 'dd/MM')}** a **${format(parseISO(currentState.checkOut), 'dd/MM')}**?`
          : `Posso verificar a disponibilidade para você? Quais datas você tem em mente?`)
      return new Response(JSON.stringify({ reply, state: currentState }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 5. Suite differences / types inquiry (when NOT in active booking flow)
    if (
      (lower.includes('suíte') ||
        lower.includes('suite') ||
        lower.includes('quarto') ||
        lower.includes('banheira') ||
        lower.includes('diferença')) &&
      !currentMsgDates &&
      !currentState.checkIn &&
      !isBookingIntent(message) &&
      !currentMsgCategory
    ) {
      const reply =
        'Nossas **Suítes Standard** não possuem banheira de imersão. As **Suítes Superiores** e **Especiais** possuem banheira de hidromassagem, e as **Suítes Luxo** e **Presidencial** contam com banheiras maiores e amplo espaço. Todas contam com cama king ou queen, ar-condicionado, cafeteira, frigobar, chaleira elétrica e secador de cabelo.\n\nSe quiser verificar disponibilidade e valores, me informe as datas desejadas!'
      return new Response(JSON.stringify({ reply, state: currentState }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 6. Check if user is asking "Como reservar" or explanation of booking process
    if (
      (lower.includes('como') &&
        (lower.includes('reservo') || lower.includes('reservar') || lower.includes('reserva'))) ||
      lower.includes('passo a passo') ||
      lower.includes('processo de reserva')
    ) {
      if (!currentState.checkIn || !currentState.checkOut) {
        currentState.step = 'ask_dates'
        const reply =
          `O nosso processo de reserva é super simples e rápido! Funciona em 3 passos:\n\n` +
          `1️⃣ **Verificação de Disponibilidade:** Você me informa as datas desejadas e o número de pessoas para eu checar as opções.\n` +
          `2️⃣ **Escolha da Suíte:** Apresento as suítes disponíveis com valores e você escolhe a que mais combina com você.\n` +
          `3️⃣ **Garantia da Reserva:** Solicitamos um sinal de 50% via PIX ou Cartão de Crédito (em até 3x sem juros) para garantir a data. O saldo restante de 50% é pago apenas no check-in.\n\n` +
          `Para começarmos, quais seriam as datas da sua estadia e para quantas pessoas?`
        return new Response(JSON.stringify({ reply, state: currentState }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // =========================================================================
    // 7. STEP-BY-STEP CONVERSATION FLOW ENGINE (Memory & Guidance)
    // Step 1: Dates -> Step 2: Guests (if needed) -> Step 3: Options -> Step 4: Closing
    // =========================================================================

    const hasDates = !!currentState.checkIn && !!currentState.checkOut
    const hasCategory = !!currentState.category || !!currentMsgCategory

    // If user selected a category (or confirmed closing) AND dates are available:
    if (
      hasDates &&
      (hasCategory ||
        (currentState.step === 'show_options' &&
          (isBookingIntent(message) || norm.includes('sim') || norm.includes('quero'))))
    ) {
      const checkInStr = currentState.checkIn!
      const checkOutStr = currentState.checkOut!
      const guestCount = currentState.guests || 2
      const chosenCat = currentMsgCategory || currentState.category || 'Standard'

      try {
        const { availableSuites, suggestedSuites, totalDays, pricesBySuite } =
          await getAvailability(checkInStr, checkOutStr, guestCount)

        const matchedSuite =
          availableSuites.find((s: any) => s.category.toLowerCase() === chosenCat.toLowerCase()) ||
          suggestedSuites[0] ||
          null

        if (matchedSuite) {
          const pricing = pricesBySuite[matchedSuite.id] || {
            total: matchedSuite.price_per_night * totalDays,
            dailyAvg: matchedSuite.price_per_night,
          }
          currentState.suiteId = matchedSuite.id
          currentState.suiteName = matchedSuite.name
          currentState.category = matchedSuite.category
          currentState.step = 'closing'

          const reply = buildClosingReply(
            checkInStr,
            checkOutStr,
            matchedSuite.category,
            matchedSuite,
            pricing.total,
            guestCount,
          )
          return new Response(JSON.stringify({ reply, state: currentState }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      } catch (err) {
        console.error('Error during booking closure lookup:', err)
      }
    }

    // If we have dates (from current message or previously remembered in state):
    if (hasDates) {
      const checkInStr = currentState.checkIn!
      const checkOutStr = currentState.checkOut!

      // If guest count was just provided or explicitly known, show options immediately!
      // If guests count hasn't been explicitly stated yet AND the assistant didn't just ask about it:
      // Note: By default guest is 2. If the user provided dates (e.g. "12 a 14 de setembro"), we can check availability directly for 2 people, or if they only provided dates, we present options for 2 and ask if they prefer another number of guests.
      const guestCount = currentState.guests || 2

      try {
        const { availableSuites, suggestedSuites, totalDays, pricesBySuite } =
          await getAvailability(checkInStr, checkOutStr, guestCount)

        if (availableSuites.length === 0) {
          const sDate = parseISO(checkInStr)
          const eDate = parseISO(checkOutStr)
          const altStart = addDays(sDate, 7)
          const altEnd = addDays(eDate, 7)
          const reply = `Infelizmente não temos suítes disponíveis para o período de **${format(sDate, 'dd/MM')}** a **${format(eDate, 'dd/MM')}** (para ${guestCount} ${guestCount === 1 ? 'pessoa' : 'pessoas'}).\n\nQue tal tentarmos na semana seguinte, de **${format(altStart, 'dd/MM')}** a **${format(altEnd, 'dd/MM')}**? Posso consultar para você agora mesmo!`
          return new Response(JSON.stringify({ reply, state: currentState }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        currentState.step = 'show_options'
        const reply = buildAvailabilityReply(
          checkInStr,
          checkOutStr,
          suggestedSuites,
          pricesBySuite,
          totalDays,
          guestCount,
        )
        return new Response(JSON.stringify({ reply, state: currentState }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (err) {
        console.error('Availability lookup error:', err)
        const reply =
          'No momento estou enfrentando uma instabilidade para acessar nosso sistema de reservas. Por favor, tente novamente em alguns instantes ou entre em contato pelo nosso WhatsApp!'
        return new Response(JSON.stringify({ reply, state: currentState }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // If no dates provided yet, handle other general queries or prompt for dates
    if (lower.includes('cancelamento') || lower.includes('cancelar')) {
      reply =
        'Nossa política de cancelamento: Cancelamento grátis até 7 dias antes do check-in. Entre 3 e 7 dias antes, o reembolso é de 50%. Menos de 3 dias, não há reembolso.'
    } else if (
      lower.includes('horário') ||
      lower.includes('horario') ||
      lower.includes('check-out') ||
      lower.includes('checkout')
    ) {
      reply = 'O nosso check-in inicia às 14h e o check-out é até as 12h.'
    } else if (
      lower.includes('localização') ||
      lower.includes('localizacao') ||
      lower.includes('onde') ||
      lower.includes('endereço') ||
      lower.includes('endereco')
    ) {
      reply = 'Estamos localizados na Rua Theobaldo Fleck, 461, Vila Suzana, em Canela/RS.'
    } else if (
      lower.includes('olá') ||
      lower.includes('ola') ||
      lower.includes('oi') ||
      lower.includes('bom dia') ||
      lower.includes('boa tarde') ||
      lower.includes('boa noite')
    ) {
      currentState.step = 'ask_dates'
      reply =
        'Olá! Eu sou a Ayla, assistente virtual da Pousada Provençal. Posso verificar disponibilidade, preços, conduzir sua reserva ou tirar dúvidas sobre sua estadia. Para quais datas você gostaria de se hospedar?'
    } else if (lower.includes('café') || lower.includes('cafe')) {
      reply =
        'O café da manhã artesanal está incluso em todas as diárias e é servido no térreo das 8h às 10h.'
    } else if (lower.includes('estacionamento') || lower.includes('carro')) {
      reply = 'O estacionamento é gratuito para hóspedes, com vaga garantida no local.'
    } else if (lower.includes('bicicleta') || lower.includes('bike')) {
      reply = 'Temos bicicletas disponíveis gratuitamente para o uso dos nossos hóspedes!'
    } else if (
      lower.includes('reserva') ||
      lower.includes('reservar') ||
      lower.includes('quarto') ||
      lower.includes('hospedar') ||
      lower.includes('estadia')
    ) {
      currentState.step = 'ask_dates'
      reply =
        'Com certeza! Para eu consultar as melhores opções e valores para você, quais seriam as datas da sua estadia e para quantas pessoas?'
    } else {
      currentState.step = 'ask_dates'
      reply =
        'Posso te ajudar a verificar disponibilidade e fazer sua reserva na Pousada Provençal, além de informações sobre nossas suítes, tratamentos de Spa e localização. Quais seriam as datas da sua estadia?'
    }

    return new Response(JSON.stringify({ reply, state: currentState }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Edge function fatal error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})