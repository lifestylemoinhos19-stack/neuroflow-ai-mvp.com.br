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
    const { reserva_id } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // A busca agora considera tanto o ID da reserva final quanto o ID da sessão de checkout originária do front-end
    const { data: pagamento } = await supabase
      .from('pagamentos')
      .select('*')
      .or(`reserva_id.eq.${reserva_id},checkout_session_id.eq.${reserva_id}`)
      .order('data_criacao', { ascending: false })
      .limit(1)
      .single()

    if (!pagamento) {
      return new Response(JSON.stringify({ status: 'not_found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (pagamento.mercado_pago_id) {
      const mpToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
      if (mpToken) {
        const mpRes = await fetch(
          `https://api.mercadopago.com/v1/payments/${pagamento.mercado_pago_id}`,
          {
            headers: { Authorization: `Bearer ${mpToken}` },
          },
        )
        const mpData = await mpRes.json()

        if (mpRes.ok) {
          const status = mpData.status
          let localStatus = 'pendente'
          if (status === 'approved') localStatus = 'aprovado'
          else if (status === 'rejected') localStatus = 'recusado'
          else if (status === 'cancelled') localStatus = 'cancelado'
          else if (status === 'refunded') localStatus = 'reembolsado'

          if (localStatus !== pagamento.status) {
            await supabase
              .from('pagamentos')
              .update({
                status: localStatus,
                data_atualizacao: new Date().toISOString(),
                resposta_api: mpData,
              })
              .eq('id', pagamento.id)
            pagamento.status = localStatus
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        status: pagamento.status,
        valor: pagamento.valor_total,
        data_criacao: pagamento.data_criacao,
        data_atualizacao: pagamento.data_atualizacao,
        metodo_pagamento: pagamento.metodo_pagamento,
        qr_code: pagamento.resposta_api?.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64:
          pagamento.resposta_api?.point_of_interaction?.transaction_data?.qr_code_base64,
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
