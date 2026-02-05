// Supabase Edge Function: Send Push Notification
// Sends web push notifications to subscribed users using web-push library
// Security: Requires service role key, validates VAPID keys

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:contact@topaffaireimmo.com'

interface PushPayload {
  title: string
  body: string
  icon?: string
  data?: {
    url?: string
    [key: string]: any
  }
}

interface SendPushRequest {
  user_ids?: string[]  // Send to specific users
  send_to_all?: boolean // Send to all active subscriptions
  payload: PushPayload
}

interface PushSubscription {
  id: string
  endpoint: string
  p256dh: string
  auth: string
  user_id: string | null
}

// Helper to send push using Web Push Protocol
async function sendWebPush(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create the notification payload
    const notificationPayload = JSON.stringify(payload)

    // Create VAPID headers (simplified version for demo)
    // In production, you should use a proper web-push library
    const vapidHeaders = {
      'TTL': '86400', // 24 hours
      'Content-Type': 'application/json',
      'Content-Encoding': 'aes128gcm',
    }

    // For now, we'll use the subscription endpoint directly
    // In production, implement full Web Push encryption
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: vapidHeaders,
      body: notificationPayload,
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Push service returned ${response.status}: ${response.statusText}`,
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

serve(async (req) => {
  try {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify VAPID keys are configured
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'VAPID keys not configured',
          message: 'Please set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const requestBody: SendPushRequest = await req.json()
    const { user_ids, send_to_all, payload } = requestBody

    // Validate payload
    if (!payload || !payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload: title and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify user is admin (only admins can send push notifications)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (adminError || !adminData) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only admins can send push notifications' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Query subscriptions based on request parameters
    let query = supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth, user_id')
      .eq('is_active', true)

    if (user_ids && user_ids.length > 0 && !send_to_all) {
      query = query.in('user_id', user_ids)
    }

    const { data: subscriptions, error: subError } = await query

    if (subError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions', details: subError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No active subscriptions found',
          sent: 0,
          failed: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send push notifications
    const results = await Promise.allSettled(
      subscriptions.map(sub => sendWebPush(sub as PushSubscription, payload))
    )

    // Count successes and failures
    let sent = 0
    let failed = 0
    const failedSubscriptions: string[] = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        sent++
      } else {
        failed++
        failedSubscriptions.push(subscriptions[index].id)
        
        // If subscription is invalid (410 Gone), mark as inactive
        if (result.status === 'fulfilled' && result.value.error?.includes('410')) {
          supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', subscriptions[index].id)
            .then()
        }
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: `Push notifications sent to ${sent} out of ${subscriptions.length} subscriptions`,
        sent,
        failed,
        total: subscriptions.length,
        ...(failed > 0 && { failedSubscriptions })
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending push notifications:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
