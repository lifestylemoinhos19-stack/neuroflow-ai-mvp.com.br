import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { pagamento_id, motivo_reembolso } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: pagamento, error } = await supabase
      .from('pagamentos')
      .select('*, reserva:reservations(*)')
      .eq('id', pagamento_id)
      .single()

    if (error || !pagamento) throw new Error('Pagamento não encontrado')
    if (pagamento.status !== 'aprovado')
      throw new Error('Apenas pagamentos aprovados podem ser reembolsados')
    if (!pagamento.mercado_pago_id)
      throw new Error('ID do Mercado Pago não encontrado no pagamento')

    const mpToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
    if (!mpToken) throw new Error('Token do Mercado Pago não configurado')

    const res = await fetch(
      `https://api.mercadopago.com/v1/payments/${pagamento.mercado_pago_id}/refunds`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mpToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

    const mpData = await res.json()
    if (!res.ok) throw new Error(mpData.message || 'Erro ao processar reembolso no Mercado Pago')

    await supabase
      .from('pagamentos')
      .update({
        status: 'reembolsado',
        data_atualizacao: new Date().toISOString(),
      })
      .eq('id', pagamento_id)

    await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', pagamento.reserva_id)

    await supabase.from('audit_logs').insert({
      action: 'refund_processed',
      entity_type: 'pagamentos',
      entity_id: pagamento_id,
      details: { motivo: motivo_reembolso, mpData },
    })

    return new Response(
      JSON.stringify({ success: true, message: 'Reembolso processado com sucesso' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
