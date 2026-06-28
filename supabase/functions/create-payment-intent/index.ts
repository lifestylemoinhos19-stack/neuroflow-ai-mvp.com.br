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
    const payload = await req.json()
    const mpToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')

    if (!mpToken) throw new Error('Mercado Pago token não configurado')

    const origin = req.headers.get('origin') || 'https://prm-provencal-73366.goskip.app'

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const paymentMethod = payload.payment_method || 'mercadopago'

    // 1. Criar Sessão de Checkout (Simulação Temporária)
    // Impede a criação de "Reservas Fantasmas" ao utilizar uma tabela de carrinho estritamente temporária.
    const { data: session, error: sessErr } = await supabase
      .from('checkout_sessions')
      .insert({
        suite_id: payload.suite_id,
        check_in_date: payload.check_in_date,
        check_out_date: payload.check_out_date,
        guest_data: payload.guest_data,
        spa_services: payload.spa_services || [],
        total_amount: payload.total_amount,
        channel: payload.channel || 'Direto',
        status: 'pending',
      })
      .select()
      .single()

    if (sessErr) throw new Error('Erro ao criar sessão de checkout temporária: ' + sessErr.message)

    // Suporte ao PayPal / Fallback mock
    if (paymentMethod === 'paypal') {
      await supabase.from('pagamentos').insert({
        checkout_session_id: session.id,
        preference_id: `PAYPAL_MOCK_${session.id}`,
        status: 'pendente',
        valor_total: payload.total_amount,
        metodo_pagamento: 'paypal',
        resposta_api: { message: 'PayPal checkout initiated' },
      })

      // Retorna URL de sucesso direto para simular PayPal funcionando
      return new Response(
        JSON.stringify({
          init_point: `${origin}/book/payment-status?status=success&reserva_id=${session.id}&method=paypal`,
          preference_id: `PAYPAL_MOCK_${session.id}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const title =
      payload.descricao_items && payload.descricao_items.length > 0
        ? payload.descricao_items.join(', ')
        : 'Reserva Provençal'

    // Suporte PIX Direto via Mercado Pago
    if (paymentMethod === 'pix') {
      const document = payload.guest_data?.document?.replace(/\D/g, '') || '00000000000'
      const paymentData = {
        transaction_amount: Number(payload.total_amount),
        description: title.substring(0, 250),
        payment_method_id: 'pix',
        payer: {
          email: payload.email_hospede,
          first_name: payload.guest_data?.firstName || payload.nome_hospede,
          last_name: payload.guest_data?.lastName || '',
          identification: {
            type: 'CPF',
            number: document.length > 11 ? document.substring(0, 11) : document,
          },
        },
        external_reference: session.id,
        notification_url: `${supabaseUrl}/functions/v1/process-webhook?source=mercadopago`,
      }

      const res = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mpToken}`,
          'X-Idempotency-Key': crypto.randomUUID(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      })

      const mpData = await res.json()
      if (!res.ok) throw new Error(mpData.message || 'Erro ao gerar PIX no Mercado Pago')

      await supabase.from('pagamentos').insert({
        checkout_session_id: session.id,
        mercado_pago_id: mpData.id,
        status: 'pendente',
        valor_total: payload.total_amount,
        metodo_pagamento: 'pix',
        resposta_api: mpData,
      })

      return new Response(
        JSON.stringify({
          init_point: `${origin}/book/payment-status?status=pending&reserva_id=${session.id}&method=pix`,
          preference_id: mpData.id,
          qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
          qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const preferenceData = {
      items: [
        {
          title: title.substring(0, 250),
          quantity: 1,
          currency_id: 'BRL',
          unit_price: Number(payload.total_amount),
        },
      ],
      payer: {
        name: payload.nome_hospede,
        email: payload.email_hospede,
      },
      back_urls: {
        // Utilizamos o ID da sessão de checkout temporária como referência externa inicial
        success: `${origin}/book/payment-status?status=success&reserva_id=${session.id}`,
        failure: `${origin}/book/payment-status?status=failure&reserva_id=${session.id}`,
        pending: `${origin}/book/payment-status?status=pending&reserva_id=${session.id}`,
      },
      auto_return: 'approved',
      external_reference: session.id,
    }

    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceData),
    })

    const mpData = await res.json()
    if (!res.ok) throw new Error(mpData.message || 'Erro ao criar preferência no Mercado Pago')

    // Registra a intenção de pagamento atrelada apenas ao carrinho, não a uma reserva confirmada
    await supabase.from('pagamentos').insert({
      checkout_session_id: session.id,
      preference_id: mpData.id,
      status: 'pendente',
      valor_total: payload.total_amount,
      resposta_api: mpData,
    })

    return new Response(
      JSON.stringify({
        init_point: mpData.init_point,
        preference_id: mpData.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
