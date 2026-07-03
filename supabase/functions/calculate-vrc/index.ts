import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sessionId } = await req.json()
    if (!sessionId) throw new Error('sessionId required')

    const authHeader = req.headers.get('Authorization')
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
    })

    const { data: logs, error } = await supabase
      .from('focus_biofeedback_logs')
      .select('bpm')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true })

    if (error) throw error

    // Simple VRC mock calculation (RMSSD approximation)
    let vrc = 0
    if (logs && logs.length > 1) {
      let sumSq = 0
      for (let i = 1; i < logs.length; i++) {
        const rr1 = 60000 / (logs[i - 1].bpm || 60)
        const rr2 = 60000 / (logs[i].bpm || 60)
        sumSq += Math.pow(rr2 - rr1, 2)
      }
      vrc = Math.sqrt(sumSq / (logs.length - 1))
    }

    return new Response(JSON.stringify({ vrc, logsCount: logs?.length || 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
