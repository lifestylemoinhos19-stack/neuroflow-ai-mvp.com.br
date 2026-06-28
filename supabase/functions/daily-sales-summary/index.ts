import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const today = new Date().toISOString().split('T')[0]

    // Fetch today's reservations to generate the summary
    const { data: reservations, error } = await supabaseClient
      .from('reservations')
      .select('id, total_amount, check_in_date, status')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lte('created_at', `${today}T23:59:59.999Z`)

    if (error) throw error

    const totalSales =
      reservations?.reduce((acc, res) => acc + Number(res.total_amount || 0), 0) || 0
    const totalBookings = reservations?.length || 0

    // Mock sending email via external API (e.g. SendGrid, Resend)
    console.log(`[Automação Email] Enviando Resumo Diário de Vendas (${today}) para o gerente.`)
    console.log(
      `[Automação Email] Total de Vendas: R$${totalSales.toFixed(2)}, Novas Reservas: ${totalBookings}`,
    )

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Resumo diário de vendas enviado com sucesso por e-mail.',
        data: {
          totalSales,
          totalBookings,
          date: today,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
