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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Find appointments scheduled for today
    const today = new Date().toISOString().split('T')[0]
    const { data: appointments, error } = await supabaseClient
      .from('spa_appointments')
      .select('*, guest:guests(*), service:spa_services(*)')
      .eq('appointment_date', today)
      .eq('status', 'scheduled')

    if (error) throw error

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')

    const notifications = []

    for (const app of appointments || []) {
      const email = app.guest?.email
      const phone = app.guest?.phone
      const message = `Olá ${app.guest?.first_name || 'Hóspede'}, lembrete: Seu serviço de ${app.service?.name} está agendado para hoje às ${app.start_time.substring(0, 5)}.`

      let sentEmail = false
      let sentSms = false

      if (email && resendApiKey) {
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Spa Provençal <spa@provencal.com>',
              to: email,
              subject: 'Lembrete do seu agendamento no Spa',
              html: `<p>${message}</p>`,
            }),
          })
          if (res.ok) sentEmail = true
        } catch (e) {
          console.error('Failed to send email:', e)
        }
      }

      if (phone && twilioSid) {
        const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')
        const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER')
        if (twilioToken && twilioPhone) {
          try {
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
            if (res.ok) sentSms = true
          } catch (e) {
            console.error('Failed to send WhatsApp via Twilio:', e)
          }
        }
      }

      // Fallback logging se as chaves não estiverem configuradas
      if (!resendApiKey && !twilioSid) {
        console.log(`[Integração Mensageria Mock] Disparando para ${email || phone}: ${message}`)
        if (phone) {
          console.log(`[WhatsApp Mock] Lembrete enviado para ${phone}`)
        }
      }

      notifications.push({
        appointment_id: app.id,
        to: email || phone,
        message,
        sentEmail,
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
