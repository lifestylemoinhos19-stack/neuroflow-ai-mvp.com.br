import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { generateReportHtml } from './template.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const SUBJECT = 'Relatório MINI 5.0.0 - NeuroFlow AI'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { session_id, recipient_email } = await req.json()
    if (!session_id || !recipient_email) {
      throw new Error('session_id and recipient_email are required')
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header is required')
    }

    const userToken = authHeader.replace('Bearer ', '')
    const userClient = createClient(SUPABASE_URL, userToken)

    const { data: sessionCheck, error: sessionCheckError } = await userClient
      .from('anamnesis_sessions')
      .select('id')
      .eq('id', session_id)
      .single()

    if (sessionCheckError || !sessionCheck) {
      throw new Error('Unauthorized or session not found')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: session } = await supabase
      .from('anamnesis_sessions')
      .select('id, started_at, completed_at, status, metadata, profile_id, user_id')
      .eq('id', session_id)
      .single()

    if (!session) throw new Error('Session not found')

    const { data: responses } = await supabase
      .from('anamnesis_responses')
      .select('question_key, question_label, response_value')
      .eq('session_id', session_id)

    const { data: feedback } = await supabase
      .from('clinical_feedback')
      .select(
        'system_suggestion, admin_edited_interpretation, global_severity, is_accurate, comments',
      )
      .eq('session_id', session_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const metadata = (session.metadata as Record<string, unknown>) || {}
    let patientName = (metadata.name as string) || '—'
    let patientBirthDate = (metadata.birthDate as string) || ''
    const interviewerName = (metadata.interviewerName as string) || ''

    const profileId = session.profile_id || session.user_id
    if (profileId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('guest_id, full_name')
        .eq('id', profileId)
        .maybeSingle()

      if (profile?.guest_id) {
        const { data: guest } = await supabase
          .from('guests')
          .select('first_name, last_name, birth_date')
          .eq('id', profile.guest_id)
          .maybeSingle()

        if (guest) {
          patientName =
            `${guest.first_name || ''} ${guest.last_name || ''}`.trim() ||
            profile.full_name ||
            patientName
          patientBirthDate = guest.birth_date || patientBirthDate
        }
      } else if (profile?.full_name && patientName === '—') {
        patientName = profile.full_name
      }
    }

    const moduleMap: Record<string, { label: string; response: string }[]> = {}
    responses?.forEach((r) => {
      const match = r.question_key.match(/^mini_([a-z])\d+/i)
      if (match) {
        const letter = match[1].toUpperCase()
        if (!moduleMap[letter]) moduleMap[letter] = []
        let val = r.response_value
        if (typeof val === 'object' && val !== null) val = JSON.stringify(val)
        moduleMap[letter].push({
          label: r.question_label || r.question_key,
          response: String(val ?? ''),
        })
      }
    })

    const html = generateReportHtml({
      patientName,
      patientBirthDate,
      interviewerName,
      protocol: (metadata.protocol as string) || session.id,
      startedAt: session.started_at,
      completedAt: session.completed_at || '',
      moduleMap,
      logoUrl: `${SUPABASE_URL}/storage/v1/object/public/clinic-assets/casa-branca-logo.png`,
      feedback: feedback as Record<string, unknown> as any,
    })

    let emailSent = false
    let resendError: string | null = null
    let responseData: unknown = null

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
          from: 'NeuroFlow AI <onboarding@resend.dev>',
          to: recipient_email,
          subject: SUBJECT,
          html,
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
      recipient_email,
      subject: SUBJECT,
      status: emailSent ? 'success' : 'error',
      error_message: resendError ? String(resendError) : null,
      session_id,
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
