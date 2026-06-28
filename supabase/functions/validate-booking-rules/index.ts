import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { suite_id, check_in_date, check_out_date } = await req.json()
    if (!suite_id || !check_in_date || !check_out_date) {
      return new Response(JSON.stringify({ success: false, error: 'Parâmetros incompletos.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // 1. Verificando Regras
    const { data: rules } = await supabase
      .from('regras_reserva')
      .select('*')
      .eq('suite_id', suite_id)
      .eq('ativo', true)

    const checkIn = new Date(check_in_date)
    const checkOut = new Date(check_out_date)
    const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    const checkInDay = checkIn.getUTCDay() // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat

    if (rules && rules.length > 0) {
      for (const rule of rules) {
        if (rule.tipo_regra === 'duracao_minima' && rule.valor && nights < rule.valor) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Mínimo de ${rule.valor} noites exigido para este período.`,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }
        if (rule.tipo_regra === 'duracao_maxima' && rule.valor && nights > rule.valor) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Máximo de ${rule.valor} noites permitido para este período.`,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }
        if (rule.tipo_regra === 'apenas_fim_semana' && checkInDay !== 5 && checkInDay !== 6) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Check-in permitido apenas às sextas e sábados.`,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }
        if (rule.tipo_regra === 'apenas_dias_semana' && (checkInDay === 5 || checkInDay === 6)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Check-in permitido apenas de domingo a quinta.`,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }
      }
    }

    // 2. Verificando Reservas Concorrentes
    const { data: conflicts } = await supabase
      .from('reservations')
      .select('id')
      .eq('suite_id', suite_id)
      .neq('status', 'cancelled')
      .lt('check_in_date', check_out_date)
      .gt('check_out_date', check_in_date)

    if (conflicts && conflicts.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'As datas selecionadas não estão mais disponíveis (conflito de reserva).',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 3. Verificando Bloqueios na tabela disponibilidade
    const { data: blocks } = await supabase
      .from('disponibilidade')
      .select('data, bloqueado, tarifa_ajustada')
      .eq('suite_id', suite_id)
      .gte('data', check_in_date)
      .lt('data', check_out_date)

    if (blocks && blocks.some((b: any) => b.bloqueado === true)) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'As datas selecionadas contêm períodos bloqueados para manutenção ou eventos privados.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 4. Calcular o Preço Consolidado
    const { data: suite } = await supabase
      .from('suites')
      .select('price_per_night')
      .eq('id', suite_id)
      .single()
    const { data: activeTarifas } = await supabase
      .from('tarifas')
      .select('*')
      .lte('data_inicio', check_out_date)
      .gte('data_fim', check_in_date)

    let total_amount = 0
    let currentDay = new Date(check_in_date + 'T12:00:00Z')
    for (let i = 0; i < nights; i++) {
      const dateStr = currentDay.toISOString().split('T')[0]
      let dayPrice = Number(suite?.price_per_night || 0)

      const aplicableTarifa = activeTarifas?.find(
        (t: any) =>
          (t.suite_id === null || t.suite_id === suite_id) &&
          dateStr >= t.data_inicio &&
          dateStr <= t.data_fim,
      )
      if (aplicableTarifa) {
        dayPrice = dayPrice * Number(aplicableTarifa.percentual_ajuste)
      }

      total_amount += dayPrice
      currentDay.setDate(currentDay.getDate() + 1)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Validação concluída com sucesso.',
        total_amount,
        nights,
        price_per_night: total_amount / nights,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
