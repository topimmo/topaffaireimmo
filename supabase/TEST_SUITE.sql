-- ARTISAN MONETIZATION SYSTEM TEST SUITE
-- Execute this in Supabase SQL Editor to test all components
-- All tests should pass if migrations were executed correctly

-- ============================================
-- TEST 1: VERIFY TABLE STRUCTURES
-- ============================================

-- Test artisan_profiles has new columns
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'artisan_profiles' 
      AND column_name = 'city_id'
    ) THEN 'PASS: city_id column exists'
    ELSE 'FAIL: city_id column missing'
  END as test_city_id;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'artisan_profiles' 
      AND column_name = 'neighborhood_ids'
    ) THEN 'PASS: neighborhood_ids column exists'
    ELSE 'FAIL: neighborhood_ids column missing'
  END as test_neighborhood_ids;

-- Test contact_access_passes has neighborhood scope
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'contact_access_passes' 
      AND column_name = 'neighborhood_ids'
    ) THEN 'PASS: contact_access_passes.neighborhood_ids exists'
    ELSE 'FAIL: contact_access_passes.neighborhood_ids missing'
  END as test_access_pass_scope;

-- ============================================
-- TEST 2: VERIFY RPC FUNCTIONS EXIST
-- ============================================

SELECT 
  CASE 
    WHEN COUNT(*) = 5 THEN 'PASS: All 5 RPC functions exist'
    ELSE 'FAIL: Expected 5 functions, found ' || COUNT(*)::text
  END as test_rpc_functions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'create_my_artisan_profile',
    'ensure_wallet_exists',
    'toggle_artisan_boost',
    'check_contact_access',
    'debit_wallet_for_contact'
  );

-- ============================================
-- TEST 3: VERIFY RLS POLICIES
-- ============================================

SELECT 
  CASE 
    WHEN COUNT(*) >= 5 THEN 'PASS: artisan_profiles has required policies'
    ELSE 'FAIL: artisan_profiles missing policies (found ' || COUNT(*)::text || ')'
  END as test_artisan_policies
FROM pg_policies
WHERE tablename = 'artisan_profiles';

SELECT 
  CASE 
    WHEN COUNT(*) >= 2 THEN 'PASS: contact_access_passes has required policies'
    ELSE 'FAIL: contact_access_passes missing policies'
  END as test_access_pass_policies
FROM pg_policies
WHERE tablename = 'contact_access_passes';

-- ============================================
-- TEST 4: VERIFY INDEXES
-- ============================================

SELECT 
  CASE 
    WHEN COUNT(*) >= 3 THEN 'PASS: artisan_profiles has required indexes'
    ELSE 'FAIL: artisan_profiles missing indexes (found ' || COUNT(*)::text || ')'
  END as test_indexes
FROM pg_indexes
WHERE tablename = 'artisan_profiles'
  AND indexname LIKE 'idx_artisan_profiles%';

-- ============================================
-- TEST 5: VERIFY MONETIZATION SETTINGS
-- ============================================

SELECT 
  CASE 
    WHEN value->>'monetization_enabled' = 'false' THEN 'PASS: Monetization defaults to OFF'
    ELSE 'FAIL: Monetization should default to OFF'
  END as test_monetization_default
FROM platform_settings
WHERE key = 'monetization';

SELECT 
  CASE 
    WHEN (value->>'contact_reveal_fee_mad')::int = 5 THEN 'PASS: Contact reveal fee is 5 MAD'
    ELSE 'FAIL: Unexpected contact reveal fee'
  END as test_reveal_fee
FROM platform_settings
WHERE key = 'monetization';

SELECT 
  CASE 
    WHEN (value->>'contact_pass_duration_hours')::int = 12 THEN 'PASS: Access pass duration is 12h'
    ELSE 'FAIL: Unexpected pass duration'
  END as test_pass_duration
FROM platform_settings
WHERE key = 'monetization';

-- ============================================
-- TEST 6: VERIFY RLS IS ENABLED
-- ============================================

SELECT 
  CASE 
    WHEN rowsecurity = true THEN 'PASS: RLS enabled on artisan_profiles'
    ELSE 'FAIL: RLS not enabled on artisan_profiles'
  END as test_rls_artisans
FROM pg_tables
WHERE tablename = 'artisan_profiles';

SELECT 
  CASE 
    WHEN rowsecurity = true THEN 'PASS: RLS enabled on contact_access_passes'
    ELSE 'FAIL: RLS not enabled on contact_access_passes'
  END as test_rls_passes
FROM pg_tables
WHERE tablename = 'contact_access_passes';

SELECT 
  CASE 
    WHEN rowsecurity = true THEN 'PASS: RLS enabled on wallets'
    ELSE 'FAIL: RLS not enabled on wallets'
  END as test_rls_wallets
FROM pg_tables
WHERE tablename = 'wallets';

-- ============================================
-- TEST 7: VERIFY WALLET CONSTRAINTS
-- ============================================

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.check_constraints
      WHERE constraint_name LIKE '%balance_mad%'
      AND check_clause LIKE '%>= 0%'
    ) THEN 'PASS: Wallet has non-negative balance constraint'
    ELSE 'FAIL: Missing balance constraint'
  END as test_wallet_constraint;

-- ============================================
-- SUMMARY: COUNT TESTS
-- ============================================

SELECT 
  'Total tests executed: Check results above' as summary;
