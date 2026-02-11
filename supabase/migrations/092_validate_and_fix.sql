-- =====================================================
-- Migration 092: Validation and Fixes
-- =====================================================
-- This migration validates that all previous migrations executed correctly
-- and provides any necessary fixes

-- =====================================================
-- 1. VERIFY ARTISAN_PROFILES STRUCTURE
-- =====================================================

-- Verify city_id column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artisan_profiles' 
    AND column_name = 'city_id'
  ) THEN
    RAISE EXCEPTION 'city_id column missing from artisan_profiles';
  END IF;
END $$;

-- Verify neighborhood_ids column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artisan_profiles' 
    AND column_name = 'neighborhood_ids'
  ) THEN
    RAISE EXCEPTION 'neighborhood_ids column missing from artisan_profiles';
  END IF;
END $$;

-- =====================================================
-- 2. VERIFY CONTACT_ACCESS_PASSES STRUCTURE
-- =====================================================

-- Verify neighborhood_ids column exists in contact_access_passes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contact_access_passes' 
    AND column_name = 'neighborhood_ids'
  ) THEN
    RAISE EXCEPTION 'neighborhood_ids column missing from contact_access_passes';
  END IF;
END $$;

-- =====================================================
-- 3. VERIFY ALL RPC FUNCTIONS EXIST
-- =====================================================

-- Verify create_my_artisan_profile exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'create_my_artisan_profile'
  ) THEN
    RAISE EXCEPTION 'create_my_artisan_profile function missing';
  END IF;
END $$;

-- Verify ensure_wallet_exists exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'ensure_wallet_exists'
  ) THEN
    RAISE EXCEPTION 'ensure_wallet_exists function missing';
  END IF;
END $$;

-- Verify toggle_artisan_boost exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'toggle_artisan_boost'
  ) THEN
    RAISE EXCEPTION 'toggle_artisan_boost function missing';
  END IF;
END $$;

-- Verify check_contact_access exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'check_contact_access'
  ) THEN
    RAISE EXCEPTION 'check_contact_access function missing';
  END IF;
END $$;

-- Verify debit_wallet_for_contact exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'debit_wallet_for_contact'
  ) THEN
    RAISE EXCEPTION 'debit_wallet_for_contact function missing';
  END IF;
END $$;

-- =====================================================
-- 4. VERIFY RLS POLICIES EXIST
-- =====================================================

-- Verify RLS is enabled on artisan_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'artisan_profiles'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS not enabled on artisan_profiles';
  END IF;
END $$;

-- Verify RLS is enabled on contact_access_passes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'contact_access_passes'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS not enabled on contact_access_passes';
  END IF;
END $$;

-- =====================================================
-- 5. VERIFY INDEXES EXIST
-- =====================================================

-- Verify city_id index exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'artisan_profiles'
    AND indexname = 'idx_artisan_profiles_city_id'
  ) THEN
    RAISE EXCEPTION 'idx_artisan_profiles_city_id index missing';
  END IF;
END $$;

-- Verify neighborhood_ids GIN index exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'artisan_profiles'
    AND indexname = 'idx_artisan_profiles_neighborhoods'
  ) THEN
    RAISE EXCEPTION 'idx_artisan_profiles_neighborhoods index missing';
  END IF;
END $$;

-- Verify composite search index exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'artisan_profiles'
    AND indexname = 'idx_artisan_profiles_search'
  ) THEN
    RAISE EXCEPTION 'idx_artisan_profiles_search index missing';
  END IF;
END $$;

-- =====================================================
-- 6. SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'All validations passed successfully!';
  RAISE NOTICE 'artisan_profiles: city_id and neighborhood_ids columns exist';
  RAISE NOTICE 'contact_access_passes: neighborhood_ids column exists';
  RAISE NOTICE 'All 5 RPC functions exist';
  RAISE NOTICE 'RLS enabled on required tables';
  RAISE NOTICE 'All required indexes created';
END $$;

-- =====================================================
-- 7. TESTING HELPER FUNCTIONS
-- =====================================================
-- NOTE: These are for testing in SQL Editor only
-- In production, auth.uid() is automatically set by Supabase Auth

-- Helper function to simulate authenticated user for testing
-- Usage: SELECT set_config('request.jwt.claim.sub', 'your-user-uuid-here', false);
-- Then you can test functions that use auth.uid()

-- Example test scenario:
-- 1. Set test user ID:
--    SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
--
-- 2. Verify it works:
--    SELECT auth.uid();
--    -- Should return: 00000000-0000-0000-0000-000000000001
--
-- 3. Test create_my_artisan_profile:
--    SELECT * FROM public.create_my_artisan_profile(
--      p_service_category_id := 'category-uuid-here',
--      p_business_name := 'Test Business',
--      p_city_id := 1,
--      p_neighborhood_ids := ARRAY[1,2],
--      p_phone := '0612345678'
--    );
--
-- 4. Clear test user (reset to postgres/admin):
--    SELECT set_config('request.jwt.claim.sub', '', false);

-- Create a test helper function for convenience
CREATE OR REPLACE FUNCTION public.set_test_user(user_uuid TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', user_uuid, false);
  RETURN 'Test user set to: ' || user_uuid || '. auth.uid() will now return this UUID.';
END;
$$;

COMMENT ON FUNCTION public.set_test_user IS 
  'Helper function for testing - sets auth.uid() to a specific UUID in SQL Editor. Use only for development/testing.';

-- Create a function to clear test user
CREATE OR REPLACE FUNCTION public.clear_test_user()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '', false);
  RETURN 'Test user cleared. auth.uid() will now return NULL.';
END;
$$;

COMMENT ON FUNCTION public.clear_test_user IS 
  'Helper function for testing - clears the test user set by set_test_user(). Use only for development/testing.';

