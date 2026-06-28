import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { guestEmail, guestName, reservationId } = await req.json()

    // Mock do envio de e-mail de NPS/Avaliação via API externa (ex: SendGrid, Resend)
    console.log(
      `[Integração de Avaliações] Disparando e-mail de NPS para ${guestName} (${guestEmail}) referente à reserva ${reservationId}`,
    )

    return new Response(
      JSON.stringify({
        success: true,
        deliveredTo: guestEmail,
        message: 'Pesquisa de satisfação (NPS) enviada com sucesso ao hóspede após o checkout.',
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
