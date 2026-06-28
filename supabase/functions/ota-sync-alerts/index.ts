import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { otaName, errorMessage, phone } = await req.json()

    // Mock sending alert via external API (e.g., Twilio WhatsApp API or SendGrid for Emails)
    console.log(
      `[Alerta Channel Manager] Enviando aviso crítico para equipe gerencial ${phone ? `(Tel: ${phone})` : ''}`,
    )
    console.log(`[Alerta Channel Manager] Canal afetado: ${otaName}`)
    console.log(`[Alerta Channel Manager] Detalhe do Erro: ${errorMessage}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Alerta de falha na sincronização OTA disparado com sucesso.',
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
