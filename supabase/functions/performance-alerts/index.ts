import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, occupancyRate, revPar, message } = await req.json()

    // Mock sending WhatsApp notification via external API (e.g., Twilio)
    console.log(`Sending WhatsApp alert to ${phone}: ${message}`)
    console.log(`Metrics -> Occupancy: ${occupancyRate}%, RevPAR: ${revPar}`)

    return new Response(
      JSON.stringify({
        success: true,
        deliveredTo: phone,
        message: 'Alerta proativo disparado com sucesso via WhatsApp/Push.',
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
