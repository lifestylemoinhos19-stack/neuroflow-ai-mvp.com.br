import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  // In a real environment, you'd use the Stripe SDK to construct and verify the event using STRIPE_WEBHOOK_SECRET
  // For this context, we will simulate receiving a successful payment intent from Stripe.

  try {
    const payload = await req.json()
    const eventType = payload.type || payload.event_type

    // We expect the payment intent metadata to contain the reservation_id
    if (eventType === 'payment_intent.succeeded' || eventType === 'checkout.session.completed') {
      const dataObject = payload.data?.object || payload
      const reservationId = dataObject.metadata?.reservation_id || dataObject.client_reference_id
      const appointmentId = dataObject.metadata?.appointment_id
      const amountReceived = (dataObject.amount_received || dataObject.amount_total || 0) / 100 // Convert cents to BRL

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      )

      if (reservationId) {
        // 1. Fetch current reservation to update paid_amount
        const { data: res } = await supabaseClient
          .from('reservations')
          .select('*, guest:guests(*), suite:suites(*)')
          .eq('id', reservationId)
          .single()

        if (res) {
          const newPaidAmount = Number(res.paid_amount || 0) + amountReceived

          await supabaseClient
            .from('reservations')
            .update({
              paid_amount: newPaidAmount,
              status: newPaidAmount >= res.total_amount ? 'confirmed' : res.status,
            })
            .eq('id', reservationId)

          // 2. Audit transaction
          await supabaseClient.from('transactions').insert({
            reservation_id: reservationId,
            amount: amountReceived,
            currency: 'BRL',
            payment_method: dataObject.payment_method_types?.[0] || 'stripe',
            gateway_transaction_id: dataObject.id,
            status: 'completed',
          })

          console.log(
            `[Stripe Webhook] Payment of R$${amountReceived} applied to reservation ${reservationId}`,
          )

          // 3. Trigger confirmation email if it reached the total amount or just to confirm the payment
          if (res.guest && res.guest.email) {
            console.log(
              `[Stripe Webhook] Triggering send-confirmation-email for reservation ${reservationId}`,
            )

            const { data: spaApps } = await supabaseClient
              .from('spa_appointments')
              .select('*, service:spa_services(*)')
              .eq('guest_id', res.guest_id)
              .gte('appointment_date', res.check_in_date)
              .lte('appointment_date', res.check_out_date)

            const servicesList = spaApps?.map((app) => app.service?.name) || []

            await supabaseClient.functions.invoke('send-confirmation-email', {
              body: {
                email: res.guest.email,
                guestName: res.guest.first_name,
                reserva: {
                  ...res,
                  suite_name: res.suite?.name,
                  services: servicesList,
                },
                locale: 'pt',
              },
            })
          }
        }
      }

      if (appointmentId) {
        await supabaseClient
          .from('spa_appointments')
          .update({ status: 'scheduled' })
          .eq('id', appointmentId)

        console.log(
          `[Stripe Webhook] Payment of R$${amountReceived} applied to spa appointment ${appointmentId}`,
        )
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error(`[Stripe Webhook] Error:`, error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
