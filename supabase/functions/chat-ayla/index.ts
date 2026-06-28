import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { addDays, nextFriday, nextSunday, format } from 'npm:date-fns@4.1.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

function extractDates(message: string): { start: Date; end: Date } | null {
  const lower = message.toLowerCase()
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()

  const months = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ]

  // Dia X a Y de Mês
  const dayMonthRegex =
    /(\d{1,2})\s*(?:a|ate|até|e)\s*(\d{1,2})\s*(?:de\s*)?(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i
  const matchDayMonth = lower.match(dayMonthRegex)
  if (matchDayMonth) {
    const startDay = parseInt(matchDayMonth[1])
    const endDay = parseInt(matchDayMonth[2])
    const monthStr = matchDayMonth[3]
    const month = months.indexOf(monthStr)
    let year = currentYear
    if (month < currentMonth) year++
    return { start: new Date(year, month, startDay), end: new Date(year, month, endDay) }
  }

  // Dia X de Mês a Dia Y de Mês
  const fullRangeRegex =
    /dia\s*(\d{1,2})\s*(?:de\s*)?(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s*(?:a|ate|até|e)\s*(?:dia\s*)?(\d{1,2})\s*(?:de\s*)?(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i
  const matchFullRange = lower.match(fullRangeRegex)
  if (matchFullRange) {
    const startDay = parseInt(matchFullRange[1])
    const startMonthStr = matchFullRange[2]
    const endDay = parseInt(matchFullRange[3])
    const endMonthStr = matchFullRange[4]

    const startMonth = months.indexOf(startMonthStr)
    const endMonth = months.indexOf(endMonthStr)
    let startYear = currentYear
    let endYear = currentYear
    if (startMonth < currentMonth) startYear++
    if (endMonth < currentMonth || (endMonth < startMonth && endYear === startYear)) endYear++

    return {
      start: new Date(startYear, startMonth, startDay),
      end: new Date(endYear, endMonth, endDay),
    }
  }

  // Dia X de Mês
  const singleDayMonthRegex =
    /(?:dia\s*)?(\d{1,2})\s*(?:de\s*)?(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i
  const matchSingleDayMonth = lower.match(singleDayMonthRegex)
  if (matchSingleDayMonth) {
    const startDay = parseInt(matchSingleDayMonth[1])
    const monthStr = matchSingleDayMonth[2]
    const month = months.indexOf(monthStr)
    let year = currentYear
    if (month < currentMonth) year++
    return { start: new Date(year, month, startDay), end: new Date(year, month, startDay + 1) }
  }

  // Dia X deste mês
  const singleDayThisMonthRegex = /(?:dia\s*)?(\d{1,2})\s*(?:deste|desse|do)\s*m[êe]s/i
  const matchSingleDayThisMonth = lower.match(singleDayThisMonthRegex)
  if (matchSingleDayThisMonth) {
    const startDay = parseInt(matchSingleDayThisMonth[1])
    return {
      start: new Date(currentYear, currentMonth, startDay),
      end: new Date(currentYear, currentMonth, startDay + 1),
    }
  }

  // Próximo final de semana
  if (
    lower.includes('próximo fim de semana') ||
    lower.includes('proximo fim de semana') ||
    lower.includes('proximo final de semana') ||
    lower.includes('próximo final de semana')
  ) {
    let friday = nextFriday(today)
    if (today.getDay() === 5) {
      friday = nextFriday(addDays(today, 1))
    }
    return { start: friday, end: addDays(friday, 2) }
  }

  // Próximo sábado
  if (lower.includes('próximo sábado') || lower.includes('proximo sabado')) {
    let day = today.getDay()
    let daysToSaturday = 6 - day
    if (daysToSaturday <= 0) daysToSaturday += 7
    const saturday = addDays(today, daysToSaturday)
    return { start: saturday, end: addDays(saturday, 1) }
  }

  const monthRegex =
    /em\s*(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i
  const matchMonth = lower.match(monthRegex)
  if (matchMonth) {
    const monthStr = matchMonth[1]
    const month = months.indexOf(monthStr)
    let year = currentYear
    if (month < currentMonth) year++
    return { start: new Date(year, month, 1), end: new Date(year, month + 1, 0) }
  }

  const nextMonthRegex =
    /(\d{1,2})\s*(?:a|ate|até|e)\s*(\d{1,2})\s*(?:do\s*mês\s*que\s*vem|do\s*proximo\s*mes|do\s*próximo\s*mês)/i
  const matchNextMonth = lower.match(nextMonthRegex)
  if (matchNextMonth) {
    const startDay = parseInt(matchNextMonth[1])
    const endDay = parseInt(matchNextMonth[2])
    const nextMonth = new Date(currentYear, currentMonth + 1, 1)
    return {
      start: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), startDay),
      end: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), endDay),
    }
  }

  if (lower.includes('primeira semana de julho')) {
    return { start: new Date(currentYear, 6, 1), end: new Date(currentYear, 6, 7) }
  }
  if (lower.includes('esta semana') || lower.includes('this week')) {
    return { start: today, end: addDays(today, 7) }
  }

  if (
    lower.includes('este fim de semana') ||
    lower.includes('fim de semana') ||
    lower.includes('final de semana') ||
    lower.includes('next weekend')
  ) {
    const friday = today.getDay() === 5 ? today : nextFriday(today)
    return { start: friday, end: addDays(friday, 2) }
  }
  if (lower.includes('amanhã') || lower.includes('amanha')) {
    const tomorrow = addDays(today, 1)
    return { start: tomorrow, end: addDays(tomorrow, 1) }
  }
  if (lower.includes('hoje') || lower.includes('today')) {
    return { start: today, end: addDays(today, 1) }
  }

  if (lower.includes('feriado de novembro')) {
    return { start: new Date(currentYear, 10, 15), end: new Date(currentYear, 10, 17) } // Example
  }
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message } = await req.json()
    const lower = message.toLowerCase()

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

    let reply =
      'Desculpe, não entendi perfeitamente. Posso ajudar com reservas, verificar disponibilidade de datas, horários, localização, políticas da pousada ou detalhes das suítes e spa.'

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
      reply = `Sobre o tratamento **${matchedSpaService.name}**:\n\n_${matchedSpaService.description || 'Um de nossos maravilhosos tratamentos para seu relaxamento.'}_\n\nEle tem duração de ${matchedSpaService.duration_minutes} minutos e o valor é R$ ${matchedSpaService.price.toFixed(2)}.\n\nÉ uma excelente escolha para o seu bem-estar! Gostaria de agendar este serviço?`
      return new Response(JSON.stringify({ reply }), {
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

        categoriesMap.forEach((services, category) => {
          reply += `\n🌿 **${category}**\n`
          services.forEach((service) => {
            reply += `\n✨ **${service.name}**\n`
            if (service.description) {
              reply += `_${service.description}_\n`
            }
            reply += `⏱️ ${service.duration_minutes} min | 💰 R$ ${service.price.toFixed(2)}\n`
          })
        })
        reply += '\nQual destes tratamentos mais chamou sua atenção?'
      }
      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

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

      if (checkins && checkins.length > 0) {
        reply = `Olá, ${userName}. Hoje temos ${checkins.length} check-in(s):\n${checkins.map((c: any) => `- ${c.guests?.first_name} ${c.guests?.last_name || ''} na ${c.suites?.name}`).join('\n')}`
      } else {
        reply = `Olá, ${userName}. Não temos nenhum check-in agendado para hoje.`
      }
      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (
      isAdmin &&
      (lower.includes('vazi') || lower.includes('livre') || lower.includes('empty')) &&
      (lower.includes('quarto') || lower.includes('suíte') || lower.includes('suite'))
    ) {
      const dates = extractDates(message) || { start: new Date(), end: addDays(new Date(), 1) }
      const startStr = format(dates.start, 'yyyy-MM-dd')
      const endStr = format(dates.end, 'yyyy-MM-dd')

      const { data: reserved, error: resError } = await supabaseService
        .from('reservations')
        .select('suite_id')
        .eq('status', 'confirmed')
        .lt('check_in_date', endStr)
        .gt('check_out_date', startStr)

      if (resError) throw resError

      const reservedIds = reserved?.map((r: any) => r.suite_id) || []
      const { data: allSuites } = await supabaseService
        .from('suites')
        .select('id, name')
        .eq('ativo', true)
      const emptySuites = allSuites?.filter((s: any) => !reservedIds.includes(s.id)) || []

      if (emptySuites.length > 0) {
        reply = `Olá, ${userName}. Temos ${emptySuites.length} suíte(s) livre(s) para o período de ${format(dates.start, 'dd/MM')} a ${format(dates.end, 'dd/MM')}:\n${emptySuites.map((s: any) => `- ${s.name}`).join('\n')}`
      } else {
        reply = `Olá, ${userName}. Todas as nossas suítes estão ocupadas no período solicitado!`
      }
      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (
      (lower.includes('como') &&
        (lower.includes('reservo') || lower.includes('reservar') || lower.includes('reserva'))) ||
      lower.includes('passo a passo') ||
      lower.includes('processo de reserva') ||
      lower.includes('fazer uma reserva') ||
      (lower.includes('quero') && lower.includes('reservar')) ||
      (lower.includes('gostaria de') && lower.includes('reservar')) ||
      (lower.includes('fazer') && lower.includes('reserva'))
    ) {
      const dates = extractDates(message)
      if (!dates) {
        reply =
          `O nosso processo de reserva é super simples e rápido! Funciona em 3 passos:\n\n` +
          `1️⃣ **Verificação de Disponibilidade:** Você me informa as datas desejadas e o número de pessoas para eu checar as opções.\n` +
          `2️⃣ **Escolha da Suíte:** Apresento as suítes disponíveis e você escolhe a que mais combina com você.\n` +
          `3️⃣ **Garantia da Reserva:** Solicitamos um pagamento de 50% do valor total via PIX ou Cartão de Crédito (Visa, Mastercard, Elo e Amex, em até 3x sem juros) para garantir a data. O saldo restante de 50% é pago apenas no momento do check-in na pousada.\n\n` +
          `Para começarmos, quais seriam as datas da sua estadia e para quantas pessoas?`
        return new Response(JSON.stringify({ reply }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

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
      reply =
        `Para garantir a sua reserva e planejar suas despesas, confira nossas políticas de pagamento:\n\n` +
        `• **Garantia / Sinal:** É necessário o pagamento de 50% do valor total via PIX ou Cartão de Crédito no momento da reserva para garanti-la.\n` +
        `• **Saldo Restante:** Os 50% restantes devem ser pagos no momento do check-in na pousada.\n` +
        `• **Cartões Aceitos:** Aceitamos as principais bandeiras (Visa, Mastercard, Elo e Amex).\n` +
        `• **Parcelamento:** O valor pode ser parcelado em até 3x sem juros no cartão de crédito.\n\n` +
        `Posso te ajudar a verificar a disponibilidade de datas para a sua reserva?`
      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (
      lower.includes('disponibilidade') ||
      lower.includes('disponível') ||
      lower.includes('disponivel') ||
      lower.includes('vaga') ||
      lower.includes('preço') ||
      lower.includes('preco') ||
      lower.includes('valor') ||
      lower.includes('custa') ||
      lower.includes('reservar para') ||
      lower.includes('fazer uma reserva') ||
      lower.includes('quero reservar') ||
      lower.includes('gostaria de reservar') ||
      lower.includes('fazer reserva')
    ) {
      const dates = extractDates(message)
      if (!dates) {
        reply =
          'Claro! Para eu te passar os valores certinhos, poderia me dizer para quais datas você está planejando sua estadia?'
        return new Response(JSON.stringify({ reply }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      try {
        const startStr = format(dates.start, 'yyyy-MM-dd')
        const endStr = format(dates.end, 'yyyy-MM-dd')

        const { data: suites, error: suitesError } = await supabaseService
          .from('suites')
          .select('*')
          .eq('ativo', true)
        if (suitesError) throw suitesError

        const { data: reservations, error: resError } = await supabaseService
          .from('reservations')
          .select('suite_id')
          .eq('status', 'confirmed')
          .lt('check_in_date', endStr)
          .gt('check_out_date', startStr)
        if (resError) throw resError
        const reservedIds = reservations?.map((r: any) => r.suite_id) || []

        const { data: blocks, error: blocksError } = await supabaseService
          .from('disponibilidade')
          .select('suite_id')
          .gte('data', startStr)
          .lt('data', endStr)
          .or('disponivel.eq.false,bloqueado.eq.true')
        if (blocksError) throw blocksError
        const blockedIds = blocks?.map((b: any) => b.suite_id) || []

        const unavailableIds = new Set([...reservedIds, ...blockedIds])
        const availableSuites = suites?.filter((s: any) => !unavailableIds.has(s.id)) || []

        if (availableSuites.length === 0) {
          const altStart = addDays(dates.start, 7)
          const altEnd = addDays(dates.end, 7)
          reply = `Infelizmente não temos suítes disponíveis para o período de ${format(dates.start, 'dd/MM')} a ${format(dates.end, 'dd/MM')}. Que tal tentarmos na semana seguinte, de ${format(altStart, 'dd/MM')} a ${format(altEnd, 'dd/MM')}?`
        } else {
          // GROUP BY CATEGORY
          const categoriesMap = new Map<string, any>()
          for (const suite of availableSuites) {
            if (!categoriesMap.has(suite.category)) {
              categoriesMap.set(suite.category, suite)
            }
          }
          const suggestedSuites = Array.from(categoriesMap.values())

          const { data: disponibilidades } = await supabaseService
            .from('disponibilidade')
            .select('suite_id, data, tarifa_ajustada')
            .gte('data', startStr)
            .lt('data', endStr)
            .in(
              'suite_id',
              suggestedSuites.map((s: any) => s.id),
            )

          const { data: regras } = await supabaseService
            .from('regras_reserva')
            .select('*')
            .eq('ativo', true)

          reply = `Temos opções disponíveis para o período de ${format(dates.start, 'dd/MM')} a ${format(dates.end, 'dd/MM')}:\n\n`

          let days = Math.round(
            (dates.end.getTime() - dates.start.getTime()) / (1000 * 60 * 60 * 24),
          )
          if (days <= 0) days = 1

          suggestedSuites.forEach((suite: any) => {
            let total = 0
            for (let i = 0; i < days; i++) {
              const currentDayObj = addDays(dates.start, i)
              const currentDate = format(currentDayObj, 'yyyy-MM-dd')
              const dayOfWeek = currentDayObj.getDay()

              const disp = disponibilidades?.find(
                (d: any) => d.suite_id === suite.id && d.data === currentDate,
              )
              let dailyPrice =
                disp && disp.tarifa_ajustada > 0 ? disp.tarifa_ajustada : suite.price_per_night

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
            reply += `✨ **Categoria ${suite.category}** - Sugestão: ${suite.name}\n`
            if (suite.description) {
              reply += `   _${suite.description}_\n`
            }
            reply += `   **R$ ${total.toFixed(2)} total** por ${days} diária(s).\n\n`
          })

          reply += `Gostaria de prosseguir com a reserva de alguma delas? Você pode fazer isso diretamente no nosso site!`
        }
        return new Response(JSON.stringify({ reply }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (err) {
        console.error('Availability lookup error:', err)
        reply =
          'No momento estou enfrentando uma instabilidade para acessar nosso sistema de reservas. Por favor, tente novamente em alguns instantes ou entre em contato pelo nosso WhatsApp!'
        return new Response(JSON.stringify({ reply }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    if (
      lower.includes('suíte') ||
      lower.includes('suite') ||
      lower.includes('quarto') ||
      lower.includes('banheira') ||
      lower.includes('diferença')
    ) {
      reply =
        'Nossas Suítes Standard não possuem banheira de imersão. As Suítes Superiores possuem banheira, e as Suítes Luxo possuem banheiras maiores. Todas contam com chaleira elétrica, cafeteira, frigobar, bule, ar-condicionado e secador de cabelo. Se quiser verificar disponibilidade, me informe a data (ex: "este fim de semana").'
    } else if (lower.includes('cancelamento') || lower.includes('cancelar')) {
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
      reply =
        'Olá! Eu sou a Ayla, assistente virtual do Spa e Pousada Provençal. Posso verificar disponibilidade, preços, ou tirar dúvidas sobre sua estadia. Como posso ajudar?'
    } else if (lower.includes('café') || lower.includes('cafe')) {
      reply =
        'O café da manhã está incluso na diária e é servido no térreo das 8h às 10h (é necessário agendar o horário).'
    } else if (lower.includes('estacionamento') || lower.includes('carro')) {
      reply = 'O estacionamento é gratuito para hóspedes, mas exige reserva prévia.'
    } else if (lower.includes('bicicleta') || lower.includes('bike')) {
      reply = 'Temos bicicletas disponíveis gratuitamente para o uso dos nossos hóspedes!'
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
