-- =====================================================
-- Migration 105: Public Phone Reveal System
-- =====================================================
-- Implements a secure, analytics-enabled public phone reveal system
-- that allows anonymous users to view phone numbers while preventing abuse.
--
-- GOAL: Make phone reveal 100% public (no auth) while keeping it secure & measurable
-- 
-- FEATURES:
-- 1. phone_reveal_events table for analytics & rate limiting
-- 2. Secure hashing of IP and user agent for privacy
-- 3. RLS policies to prevent direct phone access via public queries
-- 4. Helper functions for IP hashing and rate limit checks
-- =====================================================

-- =====================================================
-- 1. CREATE PHONE REVEAL EVENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.phone_reveal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Entity being revealed (listing or artisan service)
  entity_type TEXT NOT NULL CHECK (entity_type IN ('listing', 'service')),
  entity_id UUID NOT NULL,
  
  -- Privacy-safe tracking (hashed identifiers)
  ip_hash TEXT NOT NULL,
  user_agent_hash TEXT NOT NULL,
  
  -- Analytics metadata
  referrer TEXT,
  page_url TEXT,
  language TEXT,
  source TEXT, -- 'immobilier' or 'services'
  
  -- Rate limiting tracking
  success BOOLEAN DEFAULT TRUE,
  blocked BOOLEAN DEFAULT FALSE,
  block_reason TEXT
);

-- Indexes for analytics and rate limiting
CREATE INDEX IF NOT EXISTS idx_phone_reveal_events_created_at 
  ON public.phone_reveal_events(created_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_phone_reveal_events_entity 
  ON public.phone_reveal_events(entity_type, entity_id);
  
CREATE INDEX IF NOT EXISTS idx_phone_reveal_events_ip_hash 
  ON public.phone_reveal_events(ip_hash, created_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_phone_reveal_events_rate_limit 
  ON public.phone_reveal_events(ip_hash, user_agent_hash, created_at)
  WHERE success = TRUE;

COMMENT ON TABLE public.phone_reveal_events IS 
  'Tracks phone number reveal events for analytics and rate limiting. Stores hashed IP/UA for privacy.';

-- =====================================================
-- 2. RLS POLICIES FOR PHONE REVEAL EVENTS
-- =====================================================

ALTER TABLE public.phone_reveal_events ENABLE ROW LEVEL SECURITY;

-- Public cannot read reveal events (analytics only)
DROP POLICY IF EXISTS "Public cannot read reveal events" ON public.phone_reveal_events;
CREATE POLICY "Public cannot read reveal events"
  ON public.phone_reveal_events
  FOR SELECT
  USING (FALSE);

-- Admins can read all reveal events for analytics
DROP POLICY IF EXISTS "Admins can read reveal events" ON public.phone_reveal_events;
CREATE POLICY "Admins can read reveal events"
  ON public.phone_reveal_events
  FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE)
  );

-- NOTE: Insert will be controlled by Edge Function with service role
-- No direct public insert policy

-- =====================================================
-- 3. HELPER FUNCTION: Hash IP Address
-- =====================================================
-- 
-- IMPORTANT: In production, set the hash salt via Supabase secrets:
--   1. In Supabase Dashboard: Settings -> Vault -> New Secret
--      Name: PHONE_REVEAL_HASH_SALT
--      Value: your-strong-random-salt-value
--   2. Or via ALTER DATABASE/ROLE SET command:
--      ALTER DATABASE postgres SET app.phone_reveal_hash_salt = 'your-salt';
-- =====================================================

CREATE OR REPLACE FUNCTION public.hash_ip_address(ip_address TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_salt TEXT;
BEGIN
  -- Get salt from environment or use default for development
  -- IMPORTANT: In production, set PHONE_REVEAL_HASH_SALT in Supabase secrets
  v_salt := current_setting('app.phone_reveal_hash_salt', true);
  IF v_salt IS NULL OR v_salt = '' THEN
    -- Fallback for development/testing only
    -- SECURITY: This should be overridden in production via ALTER DATABASE/ROLE SET
    v_salt := 'topaffaire_default_salt_change_in_production';
  END IF;
  
  -- Use SHA-256 hashing for privacy
  RETURN encode(digest(ip_address || v_salt, 'sha256'), 'hex');
END;
$$;

COMMENT ON FUNCTION public.hash_ip_address IS 
  'Hashes IP address using SHA-256 for privacy-safe storage. Uses app.phone_reveal_hash_salt setting or fallback.';

-- =====================================================
-- 4. HELPER FUNCTION: Hash User Agent
-- =====================================================

CREATE OR REPLACE FUNCTION public.hash_user_agent(user_agent TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_salt TEXT;
BEGIN
  -- Get salt from environment or use default for development
  -- IMPORTANT: In production, set PHONE_REVEAL_HASH_SALT in Supabase secrets
  v_salt := current_setting('app.phone_reveal_hash_salt', true);
  IF v_salt IS NULL OR v_salt = '' THEN
    -- Fallback for development/testing only
    v_salt := 'topaffaire_default_salt_change_in_production';
  END IF;
  
  -- Use SHA-256 hashing for privacy
  RETURN encode(digest(user_agent || v_salt, 'sha256'), 'hex');
END;
$$;

COMMENT ON FUNCTION public.hash_user_agent IS 
  'Hashes user agent string using SHA-256 for privacy-safe storage. Uses app.phone_reveal_hash_salt setting or fallback.';

-- =====================================================
-- 5. HELPER FUNCTION: Check Rate Limit
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_reveal_rate_limit(
  p_ip_hash TEXT,
  p_user_agent_hash TEXT,
  p_entity_id UUID,
  p_time_window_seconds INTEGER DEFAULT 60,
  p_max_requests INTEGER DEFAULT 10
)
RETURNS TABLE (
  is_allowed BOOLEAN,
  reason TEXT,
  requests_in_window INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_count INTEGER;
  v_entity_recent_count INTEGER;
BEGIN
  -- Count requests from this IP + UA in the time window
  SELECT COUNT(*)
  INTO v_request_count
  FROM public.phone_reveal_events
  WHERE ip_hash = p_ip_hash
    AND user_agent_hash = p_user_agent_hash
    AND created_at > NOW() - make_interval(secs => p_time_window_seconds)
    AND success = TRUE;

  -- Check if exceeded max requests
  IF v_request_count >= p_max_requests THEN
    RETURN QUERY SELECT 
      FALSE,
      'Rate limit exceeded. Please wait before requesting more reveals.'::TEXT,
      v_request_count;
    RETURN;
  END IF;

  -- Check for rapid repeated requests for the same entity (anti-spam)
  -- Allow max 2 reveals per entity per minute from same IP
  SELECT COUNT(*)
  INTO v_entity_recent_count
  FROM public.phone_reveal_events
  WHERE ip_hash = p_ip_hash
    AND entity_id = p_entity_id
    AND created_at > NOW() - INTERVAL '60 seconds'
    AND success = TRUE;

  IF v_entity_recent_count >= 2 THEN
    RETURN QUERY SELECT 
      FALSE,
      'Too many requests for this listing. Please wait.'::TEXT,
      v_request_count;
    RETURN;
  END IF;

  -- Allow the request
  RETURN QUERY SELECT 
    TRUE,
    'OK'::TEXT,
    v_request_count;
END;
$$;

COMMENT ON FUNCTION public.check_reveal_rate_limit IS 
  'Checks if a reveal request should be allowed based on rate limiting rules';

-- =====================================================
-- 6. UPDATE RLS POLICIES: Prevent Public Phone Access
-- =====================================================

-- Properties table: Ensure phone is NOT accessible via public select
-- (Already handled by properties_public view from migration 080)

-- Update properties_public view to ensure it doesn't expose phone when show_phone_public = false
DROP VIEW IF EXISTS public.properties_public;
CREATE OR REPLACE VIEW public.properties_public AS
SELECT 
  p.id,
  p.title_fr,
  p.title_ar,
  p.description_fr,
  p.description_ar,
  p.price,
  p.transaction_type,
  p.property_type,
  p.status,
  p.created_at,
  p.images,
  p.address,
  p.bedrooms,
  p.bathrooms,
  p.area,
  p.year_built,
  p.featured,
  p.advertiser_type,
  p.city_id,
  p.neighborhood_id,
  p.custom_neighborhood,
  p.owner_id,
  
  -- SECURITY: Never expose raw phone via public view
  -- Phone must be revealed via secure endpoint only
  NULL::TEXT AS contact_phone,
  
  -- WhatsApp and email can remain conditionally exposed
  CASE WHEN p.show_whatsapp_public = true THEN p.contact_whatsapp ELSE NULL END AS contact_whatsapp,
  CASE WHEN p.show_email_public = true THEN p.contact_email ELSE NULL END AS contact_email,
  
  -- Expose visibility flags so UI knows what can be revealed
  p.show_phone_public,
  p.show_whatsapp_public,
  p.show_email_public
FROM public.properties p
WHERE p.status = 'published' AND (p.is_archived = FALSE OR p.is_archived IS NULL);

COMMENT ON VIEW public.properties_public IS 
  'Public-safe view of properties. Phone numbers must be revealed via secure endpoint.';

-- Ensure permissions
GRANT SELECT ON public.properties_public TO anon;
GRANT SELECT ON public.properties_public TO authenticated;

-- =====================================================
-- 7. CREATE SECURE RPC FUNCTION: Get Listing Phone
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_listing_phone(
  p_listing_id UUID
)
RETURNS TABLE (
  phone TEXT,
  whatsapp TEXT,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return phone number only if listing exists and is published
  RETURN QUERY
  SELECT 
    CASE WHEN show_phone_public = TRUE THEN contact_phone ELSE NULL END,
    CASE WHEN show_whatsapp_public = TRUE THEN contact_whatsapp ELSE NULL END,
    CASE WHEN show_email_public = TRUE THEN contact_email ELSE NULL END
  FROM public.properties
  WHERE id = p_listing_id
    AND status = 'published'
    AND (is_archived = FALSE OR is_archived IS NULL);
    
  -- If no results, entity doesn't exist or is not accessible
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found or not available';
  END IF;
END;
$$;

COMMENT ON FUNCTION public.get_listing_phone IS 
  'Securely retrieves listing contact info. Used by reveal endpoint with rate limiting.';

-- =====================================================
-- 8. CREATE SECURE RPC FUNCTION: Get Artisan Phone
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_artisan_phone(
  p_artisan_id UUID
)
RETURNS TABLE (
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  business_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return phone number only if artisan profile exists and is active/verified
  RETURN QUERY
  SELECT 
    ap.phone,
    ap.whatsapp,
    ap.email,
    ap.business_name
  FROM public.artisan_profiles ap
  WHERE ap.id = p_artisan_id
    AND ap.is_active = TRUE
    AND ap.is_verified = TRUE;
    
  -- If no results, entity doesn't exist or is not accessible
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Artisan profile not found or not available';
  END IF;
END;
$$;

COMMENT ON FUNCTION public.get_artisan_phone IS 
  'Securely retrieves artisan contact info. Used by reveal endpoint with rate limiting.';

-- =====================================================
-- 9. GRANT PERMISSIONS
-- =====================================================

-- Allow public to call rate limit check function
GRANT EXECUTE ON FUNCTION public.check_reveal_rate_limit TO anon;
GRANT EXECUTE ON FUNCTION public.check_reveal_rate_limit TO authenticated;

-- NOTE: Phone retrieval functions will be called by Edge Function with service role
-- Do NOT grant public execute on get_listing_phone or get_artisan_phone

-- =====================================================
-- 10. ANALYTICS SUMMARY VIEW (Admin Only)
-- =====================================================

CREATE OR REPLACE VIEW public.phone_reveal_analytics AS
SELECT 
  DATE(created_at) as reveal_date,
  entity_type,
  source,
  COUNT(*) as total_reveals,
  COUNT(DISTINCT ip_hash) as unique_ips,
  COUNT(CASE WHEN success = TRUE THEN 1 END) as successful_reveals,
  COUNT(CASE WHEN blocked = TRUE THEN 1 END) as blocked_reveals
FROM public.phone_reveal_events
GROUP BY DATE(created_at), entity_type, source
ORDER BY reveal_date DESC;

COMMENT ON VIEW public.phone_reveal_analytics IS 
  'Daily analytics summary of phone reveals (admin only)';

-- Grant to admins only (via RLS on underlying table)
GRANT SELECT ON public.phone_reveal_analytics TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
