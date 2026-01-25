// Supabase Edge Function: Send Facebook Webhook to Make
// Triggered when a listing is approved to send data to Make for Facebook posting

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const MAKE_WEBHOOK_URL = Deno.env.get('MAKE_WEBHOOK_URL')

interface WebhookPayload {
  listing_id: string
  title: string
  price: string
  city: string
  neighborhood?: string
  category: string
  condition?: string
  public_url: string
  image_url: string
  approved_at: string
  approved_by: string
}

serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { listing_id } = await req.json()

    if (!listing_id) {
      return new Response(
        JSON.stringify({ error: 'Missing listing_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with service role for admin access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Fetch the listing with all required data
    const { data: listing, error: fetchError } = await supabase
      .from('properties')
      .select(`
        id,
        title_fr,
        title_ar,
        price,
        property_type,
        transaction_type,
        images,
        approved_at,
        approved_by,
        facebook_posted,
        city:cities(name_fr, name_ar),
        neighborhood:neighborhoods(name_fr, name_ar)
      `)
      .eq('id', listing_id)
      .single()

    if (fetchError || !listing) {
      console.error('Error fetching listing:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Listing not found', details: fetchError }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // IDEMPOTENCY CHECK: Never post twice
    if (listing.facebook_posted) {
      console.log(`Listing ${listing_id} already posted to Facebook. Skipping.`)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Already posted to Facebook',
          already_posted: true 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if webhook URL is configured
    if (!MAKE_WEBHOOK_URL) {
      console.warn('MAKE_WEBHOOK_URL not configured. Skipping Facebook post.')
      
      // Update error field but don't fail
      await supabase
        .from('properties')
        .update({ 
          facebook_post_error: 'MAKE_WEBHOOK_URL not configured'
        })
        .eq('id', listing_id)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Webhook URL not configured',
          skipped: true 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build public URL for the listing
    const productionDomain = Deno.env.get('VITE_PRODUCTION_DOMAIN') || 'https://topaffaireimmo.vercel.app'
    const publicUrl = `${productionDomain}/listing/${listing_id}`

    // Get the main image URL (first image or empty string)
    const imageUrl = listing.images && listing.images.length > 0 
      ? listing.images[0] 
      : ''

    // Prepare webhook payload
    const webhookPayload: WebhookPayload = {
      listing_id: listing.id,
      title: listing.title_fr || listing.title_ar,
      price: listing.price.toString(),
      city: listing.city?.name_fr || '',
      neighborhood: listing.neighborhood?.name_fr || undefined,
      category: `${listing.transaction_type} - ${listing.property_type}`,
      condition: listing.property_type,
      public_url: publicUrl,
      image_url: imageUrl,
      approved_at: listing.approved_at || new Date().toISOString(),
      approved_by: listing.approved_by || ''
    }

    console.log('Sending webhook to Make:', MAKE_WEBHOOK_URL)
    console.log('Payload:', JSON.stringify(webhookPayload, null, 2))

    // Send webhook to Make
    const webhookResponse = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    })

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text()
      console.error('Webhook failed:', webhookResponse.status, errorText)
      
      // Store error but don't mark as posted
      await supabase
        .from('properties')
        .update({ 
          facebook_post_error: `Webhook failed: ${webhookResponse.status} - ${errorText}`
        })
        .eq('id', listing_id)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Webhook request failed',
          status: webhookResponse.status,
          details: errorText
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Parse Make response (optional: may contain facebook_post_id)
    let makeResponse: any = {}
    try {
      const responseText = await webhookResponse.text()
      if (responseText) {
        makeResponse = JSON.parse(responseText)
      }
    } catch (e) {
      console.log('Make response is not JSON or empty:', e)
    }

    // Update listing: mark as posted
    const updateData: any = {
      facebook_posted: true,
      facebook_posted_at: new Date().toISOString(),
      facebook_post_error: null, // Clear any previous errors
    }

    // If Make returns a facebook_post_id, store it
    if (makeResponse.facebook_post_id) {
      updateData.facebook_post_id = makeResponse.facebook_post_id
    }

    const { error: updateError } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', listing_id)

    if (updateError) {
      console.error('Error updating listing after webhook:', updateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to update listing after webhook',
          details: updateError
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Successfully posted listing ${listing_id} to Facebook via Make`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Posted to Facebook successfully',
        listing_id: listing_id,
        facebook_post_id: makeResponse.facebook_post_id || null
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
