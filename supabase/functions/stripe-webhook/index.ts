import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

// Stripe webhook signature verification
async function verifyStripeSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  // In production, use Stripe's webhook signature verification
  // For now, basic validation
  return signature && signature.length > 0
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request body and signature
    const body = await req.text()
    const signature = req.headers.get('stripe-signature') || ''

    // Verify webhook signature
    if (stripeWebhookSecret) {
      const isValid = await verifyStripeSignature(body, signature, stripeWebhookSecret)
      if (!isValid) {
        console.error('Invalid webhook signature')
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const event = JSON.parse(body)
    
    console.log('Stripe webhook event:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        
        // Extract metadata (property_boost_id, payment_id)
        const { payment_id, property_boost_id } = paymentIntent.metadata || {}
        
        if (payment_id) {
          // Update payment status
          const { error: paymentError } = await supabase
            .from('payments')
            .update({
              status: 'completed',
              payment_reference: paymentIntent.id,
              metadata: {
                stripe_payment_intent: paymentIntent.id,
                amount_received: paymentIntent.amount_received,
                currency: paymentIntent.currency
              }
            })
            .eq('id', payment_id)

          if (paymentError) {
            console.error('Error updating payment:', paymentError)
            throw paymentError
          }

          // Activate property boost if applicable
          if (property_boost_id) {
            const { error: boostError } = await supabase
              .from('property_boosts')
              .update({
                status: 'active',
                payment_id: payment_id
              })
              .eq('id', property_boost_id)

            if (boostError) {
              console.error('Error activating boost:', boostError)
              throw boostError
            }

            // Update property featured status
            const { data: boost } = await supabase
              .from('property_boosts')
              .select('property_id, starts_at, ends_at')
              .eq('id', property_boost_id)
              .single()

            if (boost) {
              await supabase
                .from('properties')
                .update({ featured: true })
                .eq('id', boost.property_id)

              // Get property owner to send notification
              const { data: property } = await supabase
                .from('properties')
                .select('owner_id, title_fr, title_ar')
                .eq('id', boost.property_id)
                .single()

              if (property) {
                // Create notification
                await supabase
                  .from('notifications')
                  .insert({
                    user_id: property.owner_id,
                    type: 'boost',
                    title: 'Boost Activated',
                    body: `Your property "${property.title_fr || property.title_ar}" is now boosted and will receive priority visibility.`,
                    data: {
                      property_id: boost.property_id,
                      boost_id: property_boost_id,
                      starts_at: boost.starts_at,
                      ends_at: boost.ends_at
                    }
                  })
              }
            }
          }

          console.log('Payment processed successfully:', payment_id)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        const { payment_id } = paymentIntent.metadata || {}
        
        if (payment_id) {
          // Update payment status
          await supabase
            .from('payments')
            .update({
              status: 'failed',
              metadata: {
                stripe_payment_intent: paymentIntent.id,
                error_message: paymentIntent.last_payment_error?.message
              }
            })
            .eq('id', payment_id)

          // Get payment details to notify user
          const { data: payment } = await supabase
            .from('payments')
            .select('user_id, amount')
            .eq('id', payment_id)
            .single()

          if (payment) {
            // Create notification
            await supabase
              .from('notifications')
              .insert({
                user_id: payment.user_id,
                type: 'payment',
                title: 'Payment Failed',
                body: `Your payment of ${payment.amount} MAD failed. Please try again or contact support.`,
                data: {
                  payment_id: payment_id,
                  error: paymentIntent.last_payment_error?.message
                }
              })
          }

          console.log('Payment failed:', payment_id)
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object
        const paymentIntentId = charge.payment_intent
        
        // Find payment by Stripe payment intent ID
        const { data: payment } = await supabase
          .from('payments')
          .select('id, user_id')
          .eq('payment_reference', paymentIntentId)
          .single()

        if (payment) {
          // Update payment status
          await supabase
            .from('payments')
            .update({
              status: 'refunded',
              metadata: {
                refund_id: charge.refunds?.data[0]?.id,
                refund_amount: charge.amount_refunded
              }
            })
            .eq('id', payment.id)

          // Deactivate associated boost if exists
          const { data: boost } = await supabase
            .from('property_boosts')
            .select('id, property_id')
            .eq('payment_id', payment.id)
            .single()

          if (boost) {
            await supabase
              .from('property_boosts')
              .update({ status: 'cancelled' })
              .eq('id', boost.id)

            // Check if property has other active boosts
            const { count } = await supabase
              .from('property_boosts')
              .select('*', { count: 'exact', head: true })
              .eq('property_id', boost.property_id)
              .eq('status', 'active')

            // If no other active boosts, remove featured status
            if (count === 0) {
              await supabase
                .from('properties')
                .update({ featured: false })
                .eq('id', boost.property_id)
            }
          }

          // Notify user
          await supabase
            .from('notifications')
            .insert({
              user_id: payment.user_id,
              type: 'payment',
              title: 'Payment Refunded',
              body: 'Your payment has been refunded. The boost has been cancelled.',
              data: {
                payment_id: payment.id,
                refund_amount: charge.amount_refunded
              }
            })

          console.log('Charge refunded:', payment.id)
        }
        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
