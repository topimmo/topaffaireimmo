-- =====================================================
-- PRODUCTION DATABASE DIAGNOSTIC SCRIPT
-- Run this in Supabase SQL Editor
-- =====================================================

-- PART 1: List all tables in public schema
-- This confirms what tables actually exist in production
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected to see: artisan_profiles, service_categories, cities, etc.

-- =====================================================
-- PART 2: Check if artisan_profiles exists specifically
-- =====================================================

SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'artisan_profiles'
) AS artisan_profiles_exists;

-- Expected result: true
-- If false: CRITICAL - table does not exist, migrations not applied

-- =====================================================
-- PART 3: Refresh schema cache (PostgREST)
-- This forces Supabase to reload the schema
-- =====================================================

NOTIFY pgrst, 'reload schema';

-- After running this, test your app immediately
-- The "schema cache" error should be resolved

-- =====================================================
-- PART 4: Verify artisan_profiles table structure
-- Only run if table exists
-- =====================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'artisan_profiles'
ORDER BY ordinal_position;

-- Expected columns:
-- id, user_id, business_name, description_fr, description_ar,
-- service_category_id, cities, phone, whatsapp, email,
-- is_verified, is_active, is_boosted, boosted_at,
-- created_at, updated_at

-- =====================================================
-- PART 5: Check RLS (Row Level Security) status
-- =====================================================

SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'artisan_profiles';

-- Expected: rls_enabled = true

-- =====================================================
-- PART 6: List all RLS policies on artisan_profiles
-- =====================================================

SELECT 
  policyname,
  permissive,
  roles,
  cmd AS permission_type,
  qual AS using_expression,
  with_check AS check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'artisan_profiles'
ORDER BY policyname;

-- Expected policies:
-- 1. "Public can read active artisan profiles" (SELECT)
-- 2. "Artisans can read own profiles" (SELECT)
-- 3. "Artisans can create own profiles" (INSERT)
-- 4. "Artisans can update own profiles" (UPDATE)
-- 5. "Admins can manage all artisan profiles" (ALL)

-- =====================================================
-- PART 7: Test SELECT query on artisan_profiles
-- This tests if public can actually query the table
-- =====================================================

SELECT COUNT(*) AS total_artisan_profiles
FROM public.artisan_profiles;

-- If this fails with permission error:
-- RLS is blocking access, need to check policies

-- =====================================================
-- PART 8: Test SELECT with filters (public access)
-- =====================================================

SELECT 
  id,
  business_name,
  is_verified,
  is_active,
  created_at
FROM public.artisan_profiles
WHERE is_verified = true
  AND is_active = true
LIMIT 5;

-- This should work for anonymous/public users
-- If fails: RLS policy for public SELECT is missing

-- =====================================================
-- PART 9: Check foreign key dependencies
-- =====================================================

-- Check service_categories table
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'service_categories'
) AS service_categories_exists;

-- Check cities table
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'cities'
) AS cities_exists;

-- Check artisan_services table
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'artisan_services'
) AS artisan_services_exists;

-- All should return true

-- =====================================================
-- PART 10: Check storage buckets
-- =====================================================

SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets
ORDER BY name;

-- Expected buckets:
-- - artisan-avatars (public = true)
-- - property-images (public = true)
-- - banner-images (public = true)
-- - agency-logos (public = true)
-- - payment-receipts (public = false)

-- =====================================================
-- PART 11: Check storage RLS policies
-- =====================================================

SELECT 
  policyname,
  cmd AS permission_type
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;

-- Should have policies for each bucket

-- =====================================================
-- PART 12: Verify migrations applied
-- Check what migrations have been run
-- =====================================================

SELECT 
  version,
  name,
  executed_at
FROM supabase_migrations.schema_migrations
WHERE version >= '089'
ORDER BY version DESC
LIMIT 20;

-- Critical migrations to verify:
-- 089 - artisan_profiles table
-- 100 - artisan_services table
-- 106 - artisan-avatars bucket
-- 114 - latest features

-- =====================================================
-- PART 13: Check if there's data in artisan_profiles
-- =====================================================

SELECT 
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE is_verified = true) AS verified,
  COUNT(*) FILTER (WHERE is_active = true) AS active,
  COUNT(*) FILTER (WHERE is_verified = true AND is_active = true) AS public_visible
FROM artisan_profiles;

-- =====================================================
-- PART 14: FIX - Create missing RLS policy if needed
-- Only run this if public SELECT policy is missing
-- =====================================================

-- UNCOMMENT AND RUN ONLY IF NEEDED:
/*
CREATE POLICY "Public can read active artisan profiles"
  ON public.artisan_profiles
  FOR SELECT
  USING (is_active = TRUE AND is_verified = TRUE);
*/

-- =====================================================
-- PART 15: FIX - Create missing storage bucket
-- Only run if artisan-avatars bucket is missing
-- =====================================================

-- UNCOMMENT AND RUN ONLY IF NEEDED:
/*
INSERT INTO storage.buckets (id, name, public)
VALUES ('artisan-avatars', 'artisan-avatars', true)
ON CONFLICT (id) DO NOTHING;
*/

-- =====================================================
-- DIAGNOSTIC SUMMARY
-- =====================================================

-- Run this to get a quick overview
SELECT 
  'artisan_profiles' AS check_item,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'artisan_profiles'
    ) THEN 'PASS ✅'
    ELSE 'FAIL ❌'
  END AS status

UNION ALL

SELECT 
  'service_categories',
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'service_categories'
    ) THEN 'PASS ✅'
    ELSE 'FAIL ❌'
  END

UNION ALL

SELECT 
  'cities',
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'cities'
    ) THEN 'PASS ✅'
    ELSE 'FAIL ❌'
  END

UNION ALL

SELECT 
  'artisan-avatars bucket',
  CASE 
    WHEN EXISTS (
      SELECT FROM storage.buckets 
      WHERE name = 'artisan-avatars'
    ) THEN 'PASS ✅'
    ELSE 'FAIL ❌'
  END

UNION ALL

SELECT 
  'RLS enabled on artisan_profiles',
  CASE 
    WHEN EXISTS (
      SELECT FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'artisan_profiles' 
      AND rowsecurity = true
    ) THEN 'PASS ✅'
    ELSE 'FAIL ❌'
  END

UNION ALL

SELECT 
  'Public SELECT policy exists',
  CASE 
    WHEN EXISTS (
      SELECT FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'artisan_profiles'
      AND cmd = 'SELECT'
      AND policyname LIKE '%ublic%'
    ) THEN 'PASS ✅'
    ELSE 'FAIL ❌'
  END;

-- =====================================================
-- EXPECTED OUTPUT (all should show PASS ✅)
-- =====================================================
-- artisan_profiles              | PASS ✅
-- service_categories             | PASS ✅
-- cities                         | PASS ✅
-- artisan-avatars bucket         | PASS ✅
-- RLS enabled on artisan_profiles| PASS ✅
-- Public SELECT policy exists    | PASS ✅
-- =====================================================
