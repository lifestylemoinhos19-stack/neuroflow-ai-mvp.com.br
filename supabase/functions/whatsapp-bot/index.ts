import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { phone, message } = await req.json()

    // Simulate analyzing CRM preferences and intent
    console.log(`[WhatsApp AI] Mensagem recebida de ${phone}: "${message}"`)

    let reply = `Olá! Sou o assistente virtual da Hospedaria Provençal 🌿. Notei no seu histórico que você tem preferência por nossos travesseiros antialérgicos e adora a vista para o jardim. Quer que eu reserve a mesma suíte para sua próxima estadia?`

    const msgLower = message.toLowerCase()
    if (msgLower.includes('spa') || msgLower.includes('massagem') || msgLower.includes('relaxar')) {
      reply = `Percebi que você mencionou interesse em relaxar! 🧖‍♀️ Temos pacotes exclusivos no nosso Spa Provençal. Que tal agendar uma Massagem Relaxante de 60 min por apenas R$ 150 durante a sua estadia? Posso adicionar isso à sua reserva agora mesmo e deixar tudo preparado.`
    } else if (
      msgLower.includes('sim') ||
      msgLower.includes('quero') ||
      msgLower.includes('agendar') ||
      msgLower.includes('pagar')
    ) {
      // Automating Payment Link (Stripe/Pix) via WhatsApp Up-sell
      reply = `Ótimo! 🎉 O serviço foi adicionado à sua reserva. Para confirmar e liberar seu voucher do Spa, realize o pagamento seguro via Stripe ou Pix acessando este link: https://buy.stripe.com/test_provencal_spa_150 \n\nAssim que o pagamento for aprovado, enviaremos a confirmação instantânea por aqui! 🌿`
    }

    console.log(`[WhatsApp AI] Resposta do Bot gerada: "${reply}"`)

    return new Response(
      JSON.stringify({
        success: true,
        reply,
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
