import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const url = new URL(req.url)
    const type = url.searchParams.get('type') || url.searchParams.get('topic')
    const dataId = url.searchParams.get('data.id') || url.searchParams.get('id')

    let payload = {}
    try {
      payload = await req.json()
    } catch (e) {}

    const paymentId = dataId || (payload as any)?.data?.id

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    if (paymentId) {
      await supabase.from('webhook_logs').insert({
        mercado_pago_id: Number(paymentId),
        tipo_evento: type || (payload as any)?.type || 'unknown',
        payload,
      })

      const mpToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
      if (mpToken) {
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${mpToken}` },
        })
        const mpData = await mpRes.json()

        if (mpRes.ok && mpData.external_reference) {
          const external_reference = mpData.external_reference
          const status = mpData.status

          let localStatus = 'pendente'
          if (status === 'approved') localStatus = 'aprovado'
          else if (status === 'rejected') localStatus = 'recusado'
          else if (status === 'cancelled') localStatus = 'cancelado'
          else if (status === 'refunded') localStatus = 'reembolsado'

          // Regra B: Tenta encontrar a Simulação (Carrinho Abandonado/Temporário) atrelado a este pagamento
          const { data: session } = await supabase
            .from('checkout_sessions')
            .select('*')
            .eq('id', external_reference)
            .maybeSingle()

          if (session && session.status !== 'processed') {
            // A reserva real é CRITICAMENTE criada a partir da confirmação do webhook
            let guest_id
            const { data: existingGuest } = await supabase
              .from('guests')
              .select('id')
              .eq('email', session.guest_data.email)
              .maybeSingle()
            if (existingGuest) {
              guest_id = existingGuest.id
            } else {
              const { data: newGuest } = await supabase
                .from('guests')
                .insert({
                  first_name: session.guest_data.firstName,
                  last_name: session.guest_data.lastName,
                  email: session.guest_data.email,
                  phone: session.guest_data.phone,
                  document: session.guest_data.document,
                  marketing_consent: session.guest_data.marketingConsent || false,
                })
                .select()
                .single()
              guest_id = newGuest.id
            }

            let resStatus = 'pending'
            if (status === 'approved') resStatus = 'confirmed'
            else if (status === 'rejected' || status === 'cancelled') resStatus = 'cancelled'

            const { data: reservation } = await supabase
              .from('reservations')
              .insert({
                guest_id,
                suite_id: session.suite_id,
                check_in_date: session.check_in_date,
                check_out_date: session.check_out_date,
                status: resStatus,
                total_amount: session.total_amount,
                paid_amount: status === 'approved' ? mpData.transaction_amount : 0,
                channel: session.channel || 'Direto',
                external_reservation_id: session.id,
              })
              .select()
              .single()

            if (session.spa_services && session.spa_services.length > 0) {
              const apps = session.spa_services.map((s: any) => ({
                guest_id,
                service_id: s.id,
                appointment_date: session.check_in_date,
                start_time: '14:00:00',
                end_time: '15:00:00',
                status: 'scheduled',
              }))
              await supabase.from('spa_appointments').insert(apps)
            }

            await supabase
              .from('pagamentos')
              .update({
                reserva_id: reservation.id,
                status: localStatus,
                mercado_pago_id: Number(paymentId),
                metodo_pagamento: mpData.payment_method_id,
                data_atualizacao: new Date().toISOString(),
                resposta_api: mpData,
              })
              .eq('checkout_session_id', session.id)

            // Finaliza o cache/sessão temporária
            await supabase
              .from('checkout_sessions')
              .update({ status: 'processed' })
              .eq('id', session.id)
          } else {
            // Fluxo Legacy: Pagamento aponta para uma reserva que já existia diretamente (external_reference = reserva.id)
            await supabase
              .from('pagamentos')
              .update({
                status: localStatus,
                mercado_pago_id: Number(paymentId),
                metodo_pagamento: mpData.payment_method_id,
                data_atualizacao: new Date().toISOString(),
                resposta_api: mpData,
              })
              .eq('reserva_id', external_reference)

            if (localStatus === 'aprovado') {
              await supabase
                .from('reservations')
                .update({ status: 'confirmed', paid_amount: mpData.transaction_amount })
                .eq('id', external_reference)
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
