import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface BookingData {
  guestName: string
  email: string
  bookingNumber: string
  checkIn: string
  checkOut: string
  suite: string
  services?: string[]
  totalAmount: number
  cancelLink: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is not set. Simulating email send for development.')
    }

    const booking: BookingData = await req.json()

    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })

    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmação de Reserva</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9f9f9; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-top: 40px; }
          .header { text-align: center; margin-bottom: 30px; display: flex; justify-content: center; align-items: center; gap: 20px; }
          .logo { max-height: 80px; max-width: 200px; object-fit: contain; }
          .title { color: #5a7b5e; font-size: 24px; font-weight: bold; margin: 0 0 10px 0; text-align: center; }
          .subtitle { color: #666; font-size: 16px; margin: 0 0 30px 0; text-align: center; }
          .details-box { background-color: #f4f7f4; padding: 20px; border-radius: 6px; margin-bottom: 30px; border-left: 4px solid #5a7b5e; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px; }
          .detail-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
          .detail-label { font-weight: bold; color: #555; }
          .detail-value { color: #222; text-align: right; }
          .services-list { margin-top: 10px; padding-left: 20px; color: #222; }
          .footer { margin-top: 40px; text-align: center; font-size: 14px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
          .btn { display: inline-block; background-color: #5a7b5e; color: #ffffff !important; text-decoration: none; padding: 14px 24px; border-radius: 6px; font-weight: bold; margin-top: 20px; text-align: center; width: 100%; box-sizing: border-box; }
          .btn:hover { background-color: #46634a; }
          .brand-text { font-size: 12px; color: #999; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <!-- Branding logo should be injected here, but as a fallback: -->
            <img src="https://img.usecurling.com/i?q=provencal%20logo" alt="Spa Life Style" class="logo" />
          </div>
          
          <h1 class="title">Sua reserva está confirmada!</h1>
          <p class="subtitle">Olá, <strong>${booking.guestName}</strong>. Sua estadia foi confirmada com sucesso. Estamos preparando tudo para lhe proporcionar momentos inesquecíveis.</p>
          
          <div class="details-box">
            <div class="detail-row">
              <span class="detail-label">Nº da Reserva:</span>
              <span class="detail-value">#${booking.bookingNumber}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Check-in:</span>
              <span class="detail-value">${booking.checkIn}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Check-out:</span>
              <span class="detail-value">${booking.checkOut}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Acomodação:</span>
              <span class="detail-value">${booking.suite}</span>
            </div>
            ${
              booking.services && booking.services.length > 0
                ? `
            <div class="detail-row" style="flex-direction: column; text-align: left;">
              <span class="detail-label">Serviços de Spa Inclusos:</span>
              <ul class="services-list">
                ${booking.services.map((s) => `<li>${s}</li>`).join('')}
              </ul>
            </div>
            `
                : ''
            }
            <div class="detail-row" style="margin-top: 15px; border-top: 2px solid #dcdcdc; padding-top: 15px; border-bottom: none;">
              <span class="detail-label" style="font-size: 18px; color: #5a7b5e;">Valor Total:</span>
              <span class="detail-value" style="font-size: 18px; font-weight: bold; color: #5a7b5e;">${formatter.format(booking.totalAmount)}</span>
            </div>
          </div>
          
          <p style="text-align: center; color: #555;">Para visualizar todos os detalhes da sua estadia, alterar ou cancelar a reserva, acesse o painel pelo botão abaixo:</p>
          
          <a href="${booking.cancelLink || 'https://prm-provencal-73366.goskip.app/bookings'}" class="btn">Gerenciar Minha Reserva</a>
          
          <div class="footer">
            <p>Se tiver alguma dúvida, não hesite em nos contatar através do nosso WhatsApp ou e-mail de atendimento.</p>
            <p class="brand-text">Provençal Spa & Hospedaria • Spa Life Style Centro de Bem Estar</p>
          </div>
        </div>
      </body>
      </html>
    `

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({
          success: true,
          simulated: true,
          message: 'Email structure generated successfully',
          preview: 'Email template with logos ready.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Reservas - Provençal Spa <onboarding@resend.dev>', // Using default resend dev domain. Replace with verified domain.
        to: booking.email,
        subject: `Confirmação de Reserva #${booking.bookingNumber} - Provençal Spa`,
        html: htmlTemplate,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`Resend API error: ${error}`)
    }

    const data = await res.json()

    return new Response(JSON.stringify({ success: true, data }), {
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
