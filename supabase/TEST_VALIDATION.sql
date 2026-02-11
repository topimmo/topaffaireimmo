-- Test script to validate artisan monetization system
-- Run this in Supabase SQL Editor to verify all components are working

-- 1. Check artisan_profiles structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'artisan_profiles'
  AND column_name IN ('city_id', 'neighborhood_ids', 'cities_old')
ORDER BY column_name;

-- 2. Check contact_access_passes structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'contact_access_passes'
  AND column_name IN ('neighborhood_ids', 'city_id', 'service_category_id', 'expires_at')
ORDER BY column_name;

-- 3. List all RPC functions
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'create_my_artisan_profile',
    'ensure_wallet_exists',
    'toggle_artisan_boost',
    'check_contact_access',
    'debit_wallet_for_contact'
  )
ORDER BY p.proname;

-- 4. List RLS policies on artisan_profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'artisan_profiles'
ORDER BY policyname;

-- 5. List RLS policies on contact_access_passes
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'contact_access_passes'
ORDER BY policyname;

-- 6. Check indexes on artisan_profiles
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'artisan_profiles'
  AND indexname LIKE 'idx_artisan_profiles%'
ORDER BY indexname;

-- 7. Check platform settings
SELECT key, value
FROM public.platform_settings
WHERE key = 'monetization';
