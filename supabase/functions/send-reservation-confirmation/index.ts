import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reservation_id } = await req.json()

    if (!reservation_id) {
      throw new Error('reservation_id is required')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: existingLogs } = await supabase
      .from('email_logs')
      .select('id')
      .eq('reservation_id', reservation_id)
      .eq('status', 'success')
      .eq('subject', 'Confirmação de Reserva - Provençal Spa')

    if (existingLogs && existingLogs.length > 0) {
      return new Response(JSON.stringify({ success: true, message: 'Email already sent' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select(`
        *,
        guest:guests(first_name, last_name, email),
        suite:suites(name)
      `)
      .eq('id', reservation_id)
      .single()

    if (resError || !reservation) {
      throw new Error(`Reservation not found: ${resError?.message || 'Unknown error'}`)
    }

    const guest = Array.isArray(reservation.guest) ? reservation.guest[0] : reservation.guest
    const suite = Array.isArray(reservation.suite) ? reservation.suite[0] : reservation.suite

    if (!guest || !guest.email) {
      throw new Error('Guest has no email address')
    }

    const guestName = `${guest.first_name} ${guest.last_name}`
    const suiteName = suite?.name || 'Suíte'
    const email = guest.email
    const totalAmount = reservation.total_amount

    const checkInDate = new Date(reservation.check_in_date)
    const checkOutDate = new Date(reservation.check_out_date)

    const checkIn = isNaN(checkInDate.getTime())
      ? reservation.check_in_date
      : checkInDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    const checkOut = isNaN(checkOutDate.getTime())
      ? reservation.check_out_date
      : checkOutDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' })

    const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    const formattedAmount = formatter.format(totalAmount)

    const subject = `Confirmação de Reserva - Provençal Spa`

    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Confirmação de Reserva</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { max-height: 80px; }
          .title { color: #5a7b5e; font-size: 24px; margin: 0 0 10px 0; }
          .subtitle { color: #666; font-size: 16px; margin: 0 0 30px 0; }
          .details-box { background-color: #f4f7f4; padding: 20px; border-radius: 6px; margin-bottom: 30px; border-left: 4px solid #5a7b5e; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px; }
          .detail-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
          .detail-label { font-weight: bold; color: #555; }
          .detail-value { color: #222; text-align: right; }
          .footer { margin-top: 40px; text-align: center; font-size: 14px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://img.usecurling.com/i?q=provencal%20logo" alt="Provençal Spa" class="logo" />
            <h1 class="title">Sua reserva está confirmada!</h1>
            <p class="subtitle">Olá, <strong>${guestName}</strong>. Sua estadia foi confirmada com sucesso.</p>
          </div>
          
          <div class="details-box">
            <div class="detail-row">
              <span class="detail-label">Acomodação:</span>
              <span class="detail-value">${suiteName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Check-in:</span>
              <span class="detail-value">${checkIn}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Check-out:</span>
              <span class="detail-value">${checkOut}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Valor Total:</span>
              <span class="detail-value" style="font-weight: bold; color: #5a7b5e;">${formattedAmount}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>Se tiver alguma dúvida, não hesite em nos contatar.</p>
            <p>Provençal Spa & Hospedaria</p>
          </div>
        </div>
      </body>
      </html>
    `

    let emailSent = false
    let resendError = null
    let responseData = null

    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set. Simulating email.')
      emailSent = true
      responseData = { id: 'simulated_id' }
    } else {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Reservas - Provençal Spa <onboarding@resend.dev>',
          to: email,
          subject: subject,
          html: htmlTemplate,
        }),
      })

      if (!res.ok) {
        resendError = await res.text()
      } else {
        responseData = await res.json()
        emailSent = true
      }
    }

    await supabase.from('email_logs').insert({
      recipient_email: email,
      subject: subject,
      status: emailSent ? 'success' : 'error',
      error_message: resendError ? String(resendError) : null,
      reservation_id: reservation_id,
    })

    if (!emailSent) {
      throw new Error(`Failed to send email: ${resendError}`)
    }

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
