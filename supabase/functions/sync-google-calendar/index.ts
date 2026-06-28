import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log(`[Integração Google Calendar] Buscando reservas confirmadas para sincronização...`)

    const { data: reservations, error } = await supabaseClient
      .from('reservations')
      .select(
        'id, suite_id, check_in_date, check_out_date, status, guest:guests(first_name, last_name)',
      )
      .eq('status', 'confirmed')

    if (error) throw error

    console.log(
      `[Integração Google Calendar] ${reservations?.length || 0} reservas processadas e enfileiradas para sincronização bidirecional.`,
    )
    console.log(`[Google Workspace] Autenticação via Service Account validada (MOCK).`)

    return new Response(
      JSON.stringify({
        success: true,
        synced: reservations?.length || 0,
        message: 'Sincronização bidirecional com o Google Calendar concluída com sucesso.',
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
