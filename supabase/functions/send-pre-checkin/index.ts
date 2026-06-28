import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, guestName, reservationId } = await req.json()

    // Mock sending WhatsApp notification via external API (e.g., Twilio)
    console.log(
      `[Automação WhatsApp] Enviando link de pré-checkin para ${guestName} (${phone}) referente à reserva ${reservationId}`,
    )
    console.log(`[Automação WhatsApp] Link gerado: https://provencal.com/checkin/${reservationId}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Link de pré-check-in enviado com sucesso via WhatsApp.',
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
