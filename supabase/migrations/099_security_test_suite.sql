-- =====================================================
-- Security Hardening Test Suite
-- =====================================================
-- Purpose: Validate all security fixes from migration 098
-- Run these tests manually after applying the migration
-- =====================================================

-- =====================================================
-- TEST 1: Verify RLS prevents direct is_boosted update
-- =====================================================

-- Setup: Create test artisan user
DO $$
DECLARE
  v_test_user_id UUID;
  v_test_profile_id UUID;
BEGIN
  -- This should be run as an authenticated non-admin artisan
  -- Expected: UPDATE fails with RLS policy violation
  
  RAISE NOTICE '=== TEST 1: RLS Protection for is_boosted ===';
  
  -- Try to update is_boosted directly (should fail)
  -- UPDATE artisan_profiles SET is_boosted = TRUE WHERE user_id = auth.uid();
  -- Expected: permission denied for table artisan_profiles OR new row violates check option
  
  RAISE NOTICE 'Run as artisan: UPDATE artisan_profiles SET is_boosted = TRUE WHERE user_id = auth.uid();';
  RAISE NOTICE 'Expected: Policy violation error';
END $$;

-- =====================================================
-- TEST 2: Verify wallet deduction on boost activation
-- =====================================================

DO $$
DECLARE
  v_test_user_id UUID := gen_random_uuid();
  v_test_profile_id UUID;
  v_initial_balance INTEGER := 100;
  v_boost_fee INTEGER := 50;
  v_new_balance INTEGER;
  v_transaction_count INTEGER;
BEGIN
  RAISE NOTICE '=== TEST 2: Wallet Deduction on Boost ===';
  
  -- Create test user in auth.users (if possible in test environment)
  -- CREATE user and wallet
  INSERT INTO wallets (user_id, balance_mad)
  VALUES (v_test_user_id, v_initial_balance);
  
  -- Create artisan profile
  INSERT INTO artisan_profiles (user_id, service_category_id, business_name, city_id, phone)
  SELECT v_test_user_id, id, 'Test Artisan', 1, '0600000000'
  FROM service_categories LIMIT 1
  RETURNING id INTO v_test_profile_id;
  
  -- Call toggle_artisan_boost (should deduct fee)
  -- Note: This would need to be called with proper auth context
  
  -- Verify wallet was debited
  SELECT balance_mad INTO v_new_balance
  FROM wallets
  WHERE user_id = v_test_user_id;
  
  -- Verify transaction was logged
  SELECT COUNT(*) INTO v_transaction_count
  FROM wallet_transactions
  WHERE user_id = v_test_user_id
    AND reason = 'boost_activation';
  
  RAISE NOTICE 'Initial balance: %', v_initial_balance;
  RAISE NOTICE 'New balance: %', v_new_balance;
  RAISE NOTICE 'Transaction count: %', v_transaction_count;
  
  -- Cleanup
  DELETE FROM artisan_profiles WHERE id = v_test_profile_id;
  DELETE FROM wallet_transactions WHERE user_id = v_test_user_id;
  DELETE FROM wallets WHERE user_id = v_test_user_id;
  
  RAISE NOTICE 'Test cleanup complete';
END $$;

-- =====================================================
-- TEST 3: Verify negative balance is prevented
-- =====================================================

DO $$
DECLARE
  v_test_user_id UUID := gen_random_uuid();
  v_error_caught BOOLEAN := FALSE;
BEGIN
  RAISE NOTICE '=== TEST 3: Negative Balance Prevention ===';
  
  -- Create wallet with low balance
  INSERT INTO wallets (user_id, balance_mad)
  VALUES (v_test_user_id, 10);
  
  BEGIN
    -- Try to set negative balance
    UPDATE wallets SET balance_mad = -100 WHERE user_id = v_test_user_id;
  EXCEPTION
    WHEN check_violation THEN
      v_error_caught := TRUE;
      RAISE NOTICE 'SUCCESS: Check constraint prevented negative balance';
  END;
  
  IF NOT v_error_caught THEN
    RAISE EXCEPTION 'FAILED: Negative balance was allowed!';
  END IF;
  
  -- Cleanup
  DELETE FROM wallets WHERE user_id = v_test_user_id;
END $$;

-- =====================================================
-- TEST 4: Verify join table migration
-- =====================================================

DO $$
DECLARE
  v_pass_count INTEGER;
  v_neighborhood_count INTEGER;
BEGIN
  RAISE NOTICE '=== TEST 4: Join Table Migration ===';
  
  -- Count contact access passes
  SELECT COUNT(*) INTO v_pass_count
  FROM contact_access_passes;
  
  -- Count neighborhoods in join table
  SELECT COUNT(*) INTO v_neighborhood_count
  FROM contact_access_neighborhoods;
  
  RAISE NOTICE 'Contact access passes: %', v_pass_count;
  RAISE NOTICE 'Neighborhood associations: %', v_neighborhood_count;
  
  -- Verify no orphaned records
  IF EXISTS (
    SELECT 1 FROM contact_access_neighborhoods can
    WHERE NOT EXISTS (
      SELECT 1 FROM contact_access_passes WHERE id = can.access_pass_id
    )
  ) THEN
    RAISE WARNING 'Found orphaned neighborhood associations!';
  ELSE
    RAISE NOTICE 'No orphaned records found';
  END IF;
END $$;

-- =====================================================
-- TEST 5: Verify check_contact_access uses join table
-- =====================================================

DO $$
DECLARE
  v_test_user_id UUID := gen_random_uuid();
  v_test_pass_id UUID;
  v_has_access BOOLEAN;
BEGIN
  RAISE NOTICE '=== TEST 5: check_contact_access Join Table Logic ===';
  
  -- Create test access pass
  INSERT INTO contact_access_passes (user_id, city_id, service_category_id, expires_at)
  SELECT v_test_user_id, 1, id, NOW() + INTERVAL '1 hour'
  FROM service_categories LIMIT 1
  RETURNING id INTO v_test_pass_id;
  
  -- Add neighborhood to join table
  INSERT INTO contact_access_neighborhoods (access_pass_id, neighborhood_id)
  VALUES (v_test_pass_id, 1);
  
  -- Check access (should return true for neighborhood 1)
  SELECT has_access INTO v_has_access
  FROM check_contact_access(
    v_test_user_id,
    1,
    (SELECT id FROM service_categories LIMIT 1),
    ARRAY[1]
  );
  
  RAISE NOTICE 'Has access to neighborhood 1: %', v_has_access;
  
  -- Cleanup
  DELETE FROM contact_access_neighborhoods WHERE access_pass_id = v_test_pass_id;
  DELETE FROM contact_access_passes WHERE id = v_test_pass_id;
END $$;

-- =====================================================
-- TEST 6: Verify indexes exist
-- =====================================================

DO $$
DECLARE
  v_index_count INTEGER;
BEGIN
  RAISE NOTICE '=== TEST 6: Index Verification ===';
  
  -- Check critical indexes
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname IN (
      'idx_wallets_user_id',
      'idx_wallet_transactions_user_created',
      'idx_can_access_pass',
      'idx_can_neighborhood',
      'idx_contact_passes_user_expires'
    );
  
  RAISE NOTICE 'Critical indexes found: % / 5', v_index_count;
  
  IF v_index_count < 5 THEN
    RAISE WARNING 'Some indexes are missing!';
  END IF;
END $$;

-- =====================================================
-- TEST 7: Verify RLS policies exist
-- =====================================================

DO $$
DECLARE
  v_policy_count INTEGER;
BEGIN
  RAISE NOTICE '=== TEST 7: RLS Policy Verification ===';
  
  -- Check critical policies
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('artisan_profiles', 'wallets', 'contact_access_neighborhoods')
    AND policyname LIKE '%can%update%' OR policyname LIKE '%can%read%';
  
  RAISE NOTICE 'RLS policies found: %', v_policy_count;
END $$;

-- =====================================================
-- SUMMARY REPORT
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SECURITY HARDENING TEST SUITE COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Review all test results above';
  RAISE NOTICE 'All tests should pass without errors';
  RAISE NOTICE '';
  RAISE NOTICE 'Manual verification required:';
  RAISE NOTICE '1. Try direct UPDATE of is_boosted as artisan';
  RAISE NOTICE '2. Enable boost and verify wallet deduction';
  RAISE NOTICE '3. Try to set negative wallet balance';
  RAISE NOTICE '4. Purchase contact access and verify join table';
END $$;
