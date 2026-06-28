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

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  let logId: string | null = null

  try {
    const payload = await req.json()
    const otaName = payload.ota_name || 'Unknown'
    const eventType = payload.event_type
    const externalId = payload.external_id
    const suiteId = payload.suite_id
    const checkIn = payload.check_in_date
    const checkOut = payload.check_out_date
    const totalAmount = payload.total_amount || 0

    // Log the incoming request
    const { data: logData, error: logError } = await supabase
      .from('ota_sync_logs')
      .insert({
        ota_name: otaName,
        event_type: eventType,
        payload: payload,
        status: 'processing',
      })
      .select('id')
      .single()

    if (logError) throw logError
    logId = logData?.id

    if (eventType === 'reservation_created') {
      if (!suiteId || !checkIn || !checkOut) {
        throw new Error('Missing required fields: suite_id, check_in_date, or check_out_date')
      }

      // Check for conflicts (Double booking prevention)
      const { data: conflicts } = await supabase
        .from('reservations')
        .select('id')
        .eq('suite_id', suiteId)
        .neq('status', 'cancelled')
        .lt('check_in_date', checkOut)
        .gt('check_out_date', checkIn)

      if (conflicts && conflicts.length > 0) {
        throw new Error('Overbooking detected. Suite is already booked for these dates.')
      }

      // Calculate Commission
      let commissionRate = 0
      const ch = otaName.toLowerCase()
      if (ch.includes('booking')) commissionRate = 0.15
      else if (ch.includes('airbnb')) commissionRate = 0.14
      else if (ch.includes('expedia')) commissionRate = 0.18
      else if (ch.includes('vrbo')) commissionRate = 0.1

      const commissionAmount = totalAmount * commissionRate

      const { error: insertErr } = await supabase.from('reservations').insert({
        suite_id: suiteId,
        check_in_date: checkIn,
        check_out_date: checkOut,
        status: 'confirmed',
        total_amount: totalAmount,
        paid_amount: 0,
        channel: otaName,
        commission_amount: commissionAmount,
        external_reservation_id: externalId,
      })

      if (insertErr) throw insertErr
    } else if (eventType === 'reservation_cancelled') {
      if (!externalId) {
        throw new Error('Missing external_id for cancellation')
      }

      const { error: updateErr } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('external_reservation_id', externalId)

      if (updateErr) throw updateErr
    } else {
      throw new Error(`Unknown event_type: ${eventType}`)
    }

    if (logId) {
      await supabase.from('ota_sync_logs').update({ status: 'success' }).eq('id', logId)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('OTA Webhook Error:', error)

    if (logId) {
      await supabase
        .from('ota_sync_logs')
        .update({
          status: 'error',
          error_message: error.message,
        })
        .eq('id', logId)

      // Trigger sync failure alert
      try {
        await supabase.functions.invoke('ota-sync-alerts', {
          body: {
            otaName: otaName,
            errorMessage: error.message,
          },
        })
      } catch (alertError) {
        console.error('Failed to trigger OTA sync alert:', alertError)
      }
    }

    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
