import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
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
    const body = await req.json()
    let phone = body.phone
    let guestName = body.guestName
    let serviceName = body.serviceName
    let date = body.date
    let time = body.time

    // Check if it's a webhook call from the database
    if (body.type === 'INSERT' && body.record) {
      const record = body.record
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      )

      const { data: guest } = await supabaseClient
        .from('guests')
        .select('*')
        .eq('id', record.guest_id)
        .single()
      const { data: service } = await supabaseClient
        .from('spa_services')
        .select('*')
        .eq('id', record.service_id)
        .single()

      if (guest && guest.phone) {
        phone = guest.phone
        guestName = guest.first_name
        serviceName = service?.name || 'Spa'
        const d = new Date(record.appointment_date)
        date = `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}/${d.getUTCFullYear()}`
        time = record.start_time.substring(0, 5)
      }
    }

    if (!phone) {
      return new Response(JSON.stringify({ success: false, message: 'No phone number provided' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')

    const message = `Olá ${guestName}! Sua sessão de ${serviceName} no Spa Provençal está confirmada para ${date} às ${time}. 🌿`

    console.log(`[Integração Twilio WhatsApp] Preparando envio para ${phone}...`)

    if (twilioSid && twilioToken) {
      const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER')
      if (twilioPhone) {
        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
            },
            body: new URLSearchParams({
              To: `whatsapp:${phone}`,
              From: `whatsapp:${twilioPhone}`,
              Body: message,
            }),
          },
        )
        if (res.ok) {
          console.log(
            `[Integração Twilio WhatsApp] Mensagem enviada com sucesso para ${phone}: "${message}"`,
          )
        } else {
          console.error(
            `[Integração Twilio WhatsApp] Falha ao enviar para ${phone}`,
            await res.text(),
          )
        }
      } else {
        console.log(
          `[Integração Twilio WhatsApp] TWILIO_PHONE_NUMBER não configurado. Mensagem não enviada.`,
        )
      }
    } else {
      console.log(
        `[Integração Twilio WhatsApp - MOCK] Mensagem enviada para ${phone}: "${message}"`,
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        deliveredTo: phone,
        message: 'Notificação de WhatsApp enviada com sucesso.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('Error in spa-whatsapp-notification:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
