import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'https://neuroflow-ai-mvp-61ac1.goskip.app'

interface InvitationRequest {
  recipientEmail: string
  recipientName?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recipientEmail, recipientName }: InvitationRequest = await req.json()

    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: 'recipientEmail is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const subject = 'Convite Exclusivo: Ajude seu filho a explorar o foco com o NeuroFlow AI 🚀'
    const betaUrl = `${FRONTEND_URL}/beta`

    const htmlBody = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite NeuroFlow AI Beta</title>
  <style>
    body { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #e0e0e0; margin: 0; padding: 0; background-color: #0A192F; }
    .container { max-width: 600px; margin: 0 auto; background-color: #0A192F; padding: 40px; border-radius: 12px; }
    .header { text-align: center; margin-bottom: 30px; }
    .title { color: #00FFFF; font-size: 26px; font-weight: 500; margin: 0 0 10px 0; }
    .subtitle { color: #b0b0b0; font-size: 16px; font-weight: 500; margin: 0 0 30px 0; }
    .content { color: #d0d0d0; font-size: 15px; font-weight: 500; line-height: 1.8; margin-bottom: 30px; }
    .highlight { color: #00FFFF; font-weight: 500; }
    .btn { display: inline-block; background-color: #00FFFF; color: #0A192F !important; text-decoration: none; padding: 16px 32px; border-radius: 50px; font-weight: 500; font-size: 16px; margin-top: 20px; text-align: center; }
    .footer { margin-top: 40px; text-align: center; font-size: 13px; color: #707070; font-weight: 500; border-top: 1px solid #1a3045; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">Convite Exclusivo: NeuroFlow AI Beta</h1>
      <p class="subtitle">Ajude seu filho a explorar o foco com o Explorador da Calma</p>
    </div>
    <div class="content">
      <p>Olá, <span class="highlight">${recipientName || 'Responsável'}</span>!</p>
      <p>Temos o prazer de convidar você e seu filho para participar da versão Beta do <span class="highlight">NeuroFlow AI</span> — uma experiência interativa que combina biofeedback de sensor de batimentos cardíacos com um jogo lúdico chamado <span class="highlight">Explorador da Calma</span>.</p>
      <p>Nesta jornada, seu filho irá:</p>
      <p>🎯 Desenvolver habilidades de auto-regulação e foco<br>
          💎 Coletar cristais a cada minuto de calma mantida<br>
          🎈 Acompanhar um mascote voador que reflete seu estado emocional em tempo real<br>
          📊 Receber um relatório com a Variabilidade da Resposta Cardíaca (VRC)</p>
      <p>Sua participação é fundamental para refinarmos a experiência antes do lançamento oficial.</p>
      <div style="text-align: center;">
        <a href="${betaUrl}" class="btn">Acessar Versão Beta</a>
      </div>
    </div>
    <div class="footer">
      <p>NeuroFlow AI — Transformando o desenvolvimento do foco em uma aventura</p>
      <p>Se você não esperava este e-mail, por favor desconsidere.</p>
    </div>
  </div>
</body>
</html>
`

    const textBody = `Olá, ${recipientName || 'Responsável'}!\n\nTemos o prazer de convidar você e seu filho para participar da versão Beta do NeuroFlow AI — uma experiência interativa que combina biofeedback de sensor de batimentos cardíacos com um jogo lúdico chamado Explorador da Calma.\n\nAcesse: ${betaUrl}\n\nNeuroFlow AI`

    let emailSent = false
    let errorMessage: string | null = null

    if (RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'NeuroFlow AI <onboarding@resend.dev>',
          to: recipientEmail,
          subject,
          html: htmlBody,
          text: textBody,
        }),
      })

      if (res.ok) {
        emailSent = true
      } else {
        errorMessage = await res.text()
        console.error('Resend API error:', errorMessage)
      }
    } else {
      console.warn('RESEND_API_KEY not set. Simulating email send.')
      emailSent = true
    }

    await supabase.from('email_logs').insert({
      recipient_email: recipientEmail,
      subject,
      status: emailSent ? 'sent' : 'failed',
      error_message: errorMessage,
    })

    return new Response(
      JSON.stringify({
        success: true,
        sent: emailSent,
        message: emailSent
          ? 'Invitation email sent successfully'
          : 'Email failed to send but logged',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
