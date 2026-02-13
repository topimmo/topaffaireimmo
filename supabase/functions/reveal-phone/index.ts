// Supabase Edge Function: Reveal Phone Number
// Secure, public endpoint for revealing phone numbers with rate limiting and analytics
// 
// Security measures:
// - Rate limiting per IP + user agent
// - Hashed IP and user agent storage (privacy)
// - Entity validation
// - Analytics tracking
// - Bot protection via cooldown periods

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Rate limiting configuration
const RATE_LIMIT_WINDOW_SECONDS = 60 // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 10 // Max 10 reveals per minute per IP+UA

interface RevealPhoneRequest {
  entityType: 'listing' | 'service'
  entityId: string
  metadata?: {
    referrer?: string
    pageUrl?: string
    language?: string
    source?: string
  }
}

interface RevealPhoneResponse {
  success: boolean
  phone?: string
  whatsapp?: string
  email?: string
  businessName?: string
  error?: string
  message?: string
}

// Hash function for IP addresses (privacy-safe)
async function hashString(input: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input + salt)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hash))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Extract real IP from request (handles proxies)
function getClientIP(req: Request): string {
  // Try Cloudflare headers first
  const cfConnectingIP = req.headers.get('CF-Connecting-IP')
  if (cfConnectingIP) return cfConnectingIP
  
  // Try X-Forwarded-For
  const xForwardedFor = req.headers.get('X-Forwarded-For')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }
  
  // Try X-Real-IP
  const xRealIP = req.headers.get('X-Real-IP')
  if (xRealIP) return xRealIP
  
  // Fallback to 'unknown'
  return 'unknown'
}

serve(async (req) => {
  try {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    }

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Method not allowed. Use POST.' 
        }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    let requestBody: RevealPhoneRequest
    try {
      requestBody = await req.json()
    } catch (err) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid JSON in request body' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { entityType, entityId, metadata } = requestBody

    // Validate required fields
    if (!entityType || !entityId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required fields: entityType and entityId' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate entityType
    if (entityType !== 'listing' && entityType !== 'service') {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid entityType. Must be "listing" or "service"' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate entityId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(entityId)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid entityId format. Must be a valid UUID' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract IP and User Agent
    const clientIP = getClientIP(req)
    const userAgent = req.headers.get('User-Agent') || 'unknown'

    // Hash IP and UA for privacy
    const ipHash = await hashString(clientIP, 'topaffaire_salt_2024')
    const userAgentHash = await hashString(userAgent, 'topaffaire_salt_2024')

    // Initialize Supabase client with service role (bypass RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check rate limit
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .rpc('check_reveal_rate_limit', {
        p_ip_hash: ipHash,
        p_user_agent_hash: userAgentHash,
        p_entity_id: entityId,
        p_time_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
        p_max_requests: RATE_LIMIT_MAX_REQUESTS
      })

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError)
      // On error, allow but log
    } else if (rateLimitData && rateLimitData.length > 0 && !rateLimitData[0].is_allowed) {
      // Rate limit exceeded - log blocked event
      await supabase
        .from('phone_reveal_events')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          ip_hash: ipHash,
          user_agent_hash: userAgentHash,
          referrer: metadata?.referrer || null,
          page_url: metadata?.pageUrl || null,
          language: metadata?.language || null,
          source: metadata?.source || null,
          success: false,
          blocked: true,
          block_reason: rateLimitData[0].reason
        })

      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Rate limit exceeded',
          message: rateLimitData[0].reason
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          } 
        }
      )
    }

    // Fetch phone number based on entity type
    let phoneData: any = null
    let fetchError: any = null

    if (entityType === 'listing') {
      const { data, error } = await supabase.rpc('get_listing_phone', {
        p_listing_id: entityId
      })
      phoneData = data
      fetchError = error
    } else if (entityType === 'service') {
      const { data, error } = await supabase.rpc('get_artisan_phone', {
        p_artisan_id: entityId
      })
      phoneData = data
      fetchError = error
    }

    // Handle fetch errors
    if (fetchError) {
      console.error('Error fetching phone:', fetchError)
      
      // Log failed event
      await supabase
        .from('phone_reveal_events')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          ip_hash: ipHash,
          user_agent_hash: userAgentHash,
          referrer: metadata?.referrer || null,
          page_url: metadata?.pageUrl || null,
          language: metadata?.language || null,
          source: metadata?.source || null,
          success: false,
          blocked: false,
          block_reason: 'Entity not found or not accessible'
        })

      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Entity not found or not accessible',
          message: fetchError.message
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if phone data was returned
    if (!phoneData || phoneData.length === 0) {
      // Log failed event
      await supabase
        .from('phone_reveal_events')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          ip_hash: ipHash,
          user_agent_hash: userAgentHash,
          referrer: metadata?.referrer || null,
          page_url: metadata?.pageUrl || null,
          language: metadata?.language || null,
          source: metadata?.source || null,
          success: false,
          blocked: false,
          block_reason: 'No phone data available'
        })

      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No contact information available for this entity'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const contactInfo = phoneData[0]

    // Check if phone is actually available
    if (!contactInfo.phone && !contactInfo.whatsapp && !contactInfo.email) {
      // Log failed event
      await supabase
        .from('phone_reveal_events')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          ip_hash: ipHash,
          user_agent_hash: userAgentHash,
          referrer: metadata?.referrer || null,
          page_url: metadata?.pageUrl || null,
          language: metadata?.language || null,
          source: metadata?.source || null,
          success: false,
          blocked: false,
          block_reason: 'No contact info set'
        })

      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No contact information available'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log successful reveal event
    const { error: logError } = await supabase
      .from('phone_reveal_events')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        ip_hash: ipHash,
        user_agent_hash: userAgentHash,
        referrer: metadata?.referrer || null,
        page_url: metadata?.pageUrl || null,
        language: metadata?.language || null,
        source: metadata?.source || null,
        success: true,
        blocked: false,
        block_reason: null
      })

    if (logError) {
      console.error('Error logging reveal event:', logError)
      // Don't fail the request, just log the error
    }

    // Return contact information
    const response: RevealPhoneResponse = {
      success: true,
      phone: contactInfo.phone || undefined,
      whatsapp: contactInfo.whatsapp || undefined,
      email: contactInfo.email || undefined,
    }

    // Include business name for artisan services
    if (entityType === 'service' && contactInfo.business_name) {
      response.businessName = contactInfo.business_name
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in reveal-phone function:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
})
