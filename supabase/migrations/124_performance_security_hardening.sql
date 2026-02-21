-- =====================================================
-- Migration 124: Performance & Security Hardening
-- =====================================================
-- Purpose: Add missing performance indexes and security constraints
--          identified during the comprehensive security audit.
--
-- Changes:
-- 1. Trigram index on artisan_profiles.business_name for ILIKE search
-- 2. Composite index on property_types(is_active, display_order) for sort
-- 3. Index on cities(name_fr) for search/lookup
-- 4. CHECK constraint on properties.price (non-negative)
-- 5. login_attempts table for server-side brute-force protection
-- 6. updated_at trigger on admins table if missing
-- =====================================================

-- =====================================================
-- 1. ENABLE TRIGRAM EXTENSION (idempotent)
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- 2. TRIGRAM INDEXES ON artisan_profiles (specialty, description)
--    Used by: useArtisans.ts ILIKE '%searchTerm%' query
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_artisan_profiles_specialty_trgm
  ON public.artisan_profiles
  USING gin(specialty gin_trgm_ops)
  WHERE is_verified = TRUE;

COMMENT ON INDEX idx_artisan_profiles_specialty_trgm IS
  'Performance: Fast ILIKE search on verified artisan specialties';

CREATE INDEX IF NOT EXISTS idx_artisan_profiles_description_trgm
  ON public.artisan_profiles
  USING gin(description gin_trgm_ops)
  WHERE is_verified = TRUE;

COMMENT ON INDEX idx_artisan_profiles_description_trgm IS
  'Performance: Fast ILIKE search on verified artisan descriptions';

-- =====================================================
-- 3. COMPOSITE INDEX ON property_types FOR ORDERED LISTING
--    Used by: usePropertyTypes() → ORDER BY display_order
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_property_types_active_order
  ON public.property_types(is_active, display_order)
  WHERE is_active = TRUE;

COMMENT ON INDEX idx_property_types_active_order IS
  'Performance: Fast ordered lookup of active property types';

-- =====================================================
-- 4. INDEX ON cities.name_fr FOR SEARCH
--    Used by: city autocomplete / filter dropdowns
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_cities_name_fr
  ON public.cities(name_fr)
  WHERE is_active = TRUE;

COMMENT ON INDEX idx_cities_name_fr IS
  'Performance: Fast city lookup by French name for search dropdowns';

-- =====================================================
-- 5. CHECK CONSTRAINT: properties.price >= 0
--    Prevents negative prices being stored
-- =====================================================

DO $$
BEGIN
  -- Only add constraint if price column exists and constraint doesn't already exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'properties'
      AND column_name = 'price'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'properties'
      AND c.conname = 'properties_price_non_negative'
  ) THEN
    ALTER TABLE public.properties
      ADD CONSTRAINT properties_price_non_negative CHECK (price IS NULL OR price >= 0);
    RAISE NOTICE '✅ Added CHECK constraint properties_price_non_negative';
  ELSE
    RAISE NOTICE '⏭ CHECK constraint properties_price_non_negative already exists or price column missing';
  END IF;
END $$;

-- =====================================================
-- 6. LOGIN ATTEMPTS TABLE FOR EMAIL/PASSWORD BRUTE-FORCE
--    Supplements client-side limiting (LoginPage.tsx) with
--    server-side enforcement via RPC
-- =====================================================

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  ip_address  TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  succeeded   BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time
  ON public.login_attempts(email, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_attempts_cleanup
  ON public.login_attempts(attempted_at)
  WHERE succeeded = FALSE;

COMMENT ON TABLE public.login_attempts IS
  'Tracks email/password login attempts for server-side brute-force protection. '
  'Rows older than 1 hour are irrelevant and should be cleaned up periodically.';

-- Enable RLS: only service role can read/write
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- No direct client access - all access via RPC functions
CREATE POLICY "login_attempts_service_only"
  ON public.login_attempts
  USING (FALSE);

COMMENT ON POLICY "login_attempts_service_only" ON public.login_attempts IS
  'Login attempts are only accessible via service role or RPC functions';

-- =====================================================
-- 7. RPC: Check and record login attempts
--    SECURITY DEFINER runs with elevated privileges
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_login_allowed(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_failures INTEGER;
  v_window_start TIMESTAMPTZ := NOW() - INTERVAL '15 minutes';
  -- Max failures before lockout. Adjust by redeploying this function if needed.
  v_max_failures CONSTANT INTEGER := 5;
BEGIN
  -- Count failed attempts in the last 15 minutes
  SELECT COUNT(*)
  INTO v_recent_failures
  FROM public.login_attempts
  WHERE email = LOWER(p_email)
    AND attempted_at > v_window_start
    AND succeeded = FALSE;

  IF v_recent_failures >= v_max_failures THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'reason', 'too_many_attempts',
      'retry_after_seconds', 
        EXTRACT(EPOCH FROM (
          (SELECT MIN(attempted_at) FROM public.login_attempts
           WHERE email = LOWER(p_email)
             AND attempted_at > v_window_start
             AND succeeded = FALSE)
          + INTERVAL '15 minutes' - NOW()
        ))::INTEGER
    );
  END IF;

  RETURN jsonb_build_object('allowed', TRUE, 'failures', v_recent_failures);
END;
$$;

COMMENT ON FUNCTION public.check_login_allowed IS
  'Checks whether an email address is allowed to attempt login. '
  'Returns {allowed: bool, reason?: string}. Called before password verification.';

CREATE OR REPLACE FUNCTION public.record_login_attempt(
  p_email    TEXT,
  p_succeeded BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.login_attempts(email, succeeded)
  VALUES (LOWER(p_email), p_succeeded);

  -- Purge attempts older than 24 hours to keep the table small
  DELETE FROM public.login_attempts
  WHERE attempted_at < NOW() - INTERVAL '24 hours';
END;
$$;

COMMENT ON FUNCTION public.record_login_attempt IS
  'Records an email/password login attempt result and prunes stale rows. '
  'Call after each auth attempt with success/failure status.';

-- Grant execute to authenticated and anon (they call these via supabase client)
GRANT EXECUTE ON FUNCTION public.check_login_allowed(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_login_attempt(TEXT, BOOLEAN) TO anon, authenticated;

-- =====================================================
-- 8. UPDATED_AT TRIGGER ON admins TABLE (if missing)
-- =====================================================

DO $$
BEGIN
  -- Only create trigger if admins table exists and trigger doesn't already exist
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'admins'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'admins'
      AND t.tgname = 'set_admins_updated_at'
  ) THEN
    -- Check if updated_at column exists on admins
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'admins'
        AND column_name = 'updated_at'
    ) THEN
      CREATE TRIGGER set_admins_updated_at
        BEFORE UPDATE ON public.admins
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
      RAISE NOTICE '✅ Created updated_at trigger on admins table';
    ELSE
      RAISE NOTICE '⏭ admins table has no updated_at column - skipping trigger';
    END IF;
  ELSE
    RAISE NOTICE '⏭ Trigger set_admins_updated_at already exists or admins table missing';
  END IF;
END $$;
