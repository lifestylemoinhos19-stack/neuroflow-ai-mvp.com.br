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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const checkInDate = tomorrow.toISOString().split('T')[0]

    const { data: reservations, error } = await supabaseClient
      .from('reservations')
      .select('*, guest:guests(*), suite:suites(*)')
      .eq('check_in_date', checkInDate)
      .eq('status', 'confirmed')

    if (error) throw error

    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER')

    const notifications = []

    for (const res of reservations || []) {
      const phone = res.guest?.phone
      const guestName = res.guest?.first_name || 'Hóspede'
      const suiteName = res.suite?.name || 'sua suíte'
      const message = `Olá ${guestName}, estamos muito felizes em receber você amanhã na Hospedaria Provençal! Sua estadia na ${suiteName} está confirmada. O check-in é a partir das 14h. Faça o seu pré-check-in para agilizar: https://provencal.com/checkin/${res.id}`

      let sentSms = false

      if (phone && twilioSid && twilioToken && twilioPhone) {
        try {
          const twilioRes = await fetch(
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
          if (twilioRes.ok) sentSms = true
        } catch (e) {
          console.error('Failed to send SMS via Twilio:', e)
        }
      } else {
        console.log(`[WhatsApp Mock] Lembrete de check-in para ${phone}: ${message}`)
      }

      notifications.push({
        reservation_id: res.id,
        to: phone,
        message,
        sentSms,
      })
    }

    return new Response(
      JSON.stringify({ success: true, notified: notifications.length, notifications }),
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
