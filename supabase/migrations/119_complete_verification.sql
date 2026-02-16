-- =====================================================
-- Migration 119: Complete Production Verification
-- =====================================================
-- Purpose: Verify all fixes are working correctly
-- Checks: Artisan relationship + Admin authentication
-- =====================================================

-- =====================================================
-- PART 1: VERIFY ARTISAN RELATIONSHIP FIX
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  PART 1: ARTISAN RELATIONSHIP VERIFICATION        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;

-- Test 1: Check artisan_profile_id column exists
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artisan_services' 
    AND column_name = 'artisan_profile_id'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE NOTICE '✓ TEST 1 PASSED: artisan_profile_id column exists';
  ELSE
    RAISE WARNING '✗ TEST 1 FAILED: artisan_profile_id column missing';
  END IF;
END $$;

-- Test 2: Check foreign key constraint exists
DO $$
DECLARE
  fk_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'artisan_services' 
    AND constraint_name = 'artisan_services_profile_id_fkey'
  ) INTO fk_exists;
  
  IF fk_exists THEN
    RAISE NOTICE '✓ TEST 2 PASSED: Foreign key constraint exists';
  ELSE
    RAISE WARNING '✗ TEST 2 FAILED: Foreign key constraint missing';
  END IF;
END $$;

-- Test 3: Check index exists
DO $$
DECLARE
  index_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'artisan_services' 
    AND indexname = 'idx_artisan_services_profile_id'
  ) INTO index_exists;
  
  IF index_exists THEN
    RAISE NOTICE '✓ TEST 3 PASSED: Index on artisan_profile_id exists';
  ELSE
    RAISE WARNING '✗ TEST 3 FAILED: Index missing';
  END IF;
END $$;

-- Test 4: Verify all services are linked to profiles
DO $$
DECLARE
  total_services INTEGER;
  linked_services INTEGER;
  orphaned_services INTEGER;
  link_percentage NUMERIC;
BEGIN
  SELECT COUNT(*) INTO total_services FROM public.artisan_services;
  SELECT COUNT(*) INTO linked_services FROM public.artisan_services WHERE artisan_profile_id IS NOT NULL;
  SELECT COUNT(*) INTO orphaned_services FROM public.artisan_services WHERE artisan_profile_id IS NULL;
  
  IF total_services > 0 THEN
    link_percentage := (linked_services::NUMERIC / total_services::NUMERIC) * 100;
  ELSE
    link_percentage := 0;
  END IF;
  
  RAISE NOTICE '✓ TEST 4 RESULTS: Relationship linking';
  RAISE NOTICE '  - Total services: %', total_services;
  RAISE NOTICE '  - Linked to profiles: % (%.1f%%)', linked_services, link_percentage;
  RAISE NOTICE '  - Orphaned: %', orphaned_services;
  
  IF orphaned_services = 0 THEN
    RAISE NOTICE '✓ TEST 4 PASSED: All services linked';
  ELSE
    RAISE WARNING '⚠ TEST 4 WARNING: % orphaned services exist', orphaned_services;
  END IF;
END $$;

-- Test 5: Test JOIN query (simulate PostgREST behavior)
DO $$
DECLARE
  join_works BOOLEAN;
  sample_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sample_count
  FROM public.artisan_services as2
  INNER JOIN public.artisan_profiles ap ON ap.id = as2.artisan_profile_id
  LIMIT 10;
  
  join_works := (sample_count >= 0);
  
  IF join_works THEN
    RAISE NOTICE '✓ TEST 5 PASSED: JOIN query works (% records tested)', sample_count;
  ELSE
    RAISE WARNING '✗ TEST 5 FAILED: JOIN query failed';
  END IF;
END $$;

-- Show sample relationship data
SELECT 
  '=== SAMPLE RELATIONSHIP DATA ===' as test_name,
  as2.id as service_id,
  as2.artisan_id as user_id,
  as2.artisan_profile_id as profile_id,
  ap.business_name,
  as2.category_id,
  as2.city
FROM public.artisan_services as2
LEFT JOIN public.artisan_profiles ap ON ap.id = as2.artisan_profile_id
LIMIT 5;

-- =====================================================
-- PART 2: VERIFY ADMIN AUTHENTICATION FIX
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  PART 2: ADMIN AUTHENTICATION VERIFICATION        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;

-- Test 6: Check if admin user exists
DO $$
DECLARE
  user_exists BOOLEAN;
  user_id UUID;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'contact@topaffaireimmo.com'
  ) INTO user_exists;
  
  IF user_exists THEN
    SELECT id INTO user_id FROM auth.users WHERE email = 'contact@topaffaireimmo.com';
    RAISE NOTICE '✓ TEST 6 PASSED: Admin user exists (ID: %)', user_id;
  ELSE
    RAISE WARNING '✗ TEST 6 FAILED: Admin user does not exist';
    RAISE WARNING '  ACTION REQUIRED: Create user via Supabase Dashboard';
  END IF;
END $$;

-- Test 7: Check if user is in admins table
DO $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.admins a
    JOIN auth.users u ON a.user_id = u.id
    WHERE u.email = 'contact@topaffaireimmo.com'
  ) INTO is_admin;
  
  IF is_admin THEN
    RAISE NOTICE '✓ TEST 7 PASSED: User has admin role';
  ELSE
    RAISE WARNING '✗ TEST 7 FAILED: User is not in admins table';
    RAISE WARNING '  ACTION REQUIRED: Run migration 118 to add admin role';
  END IF;
END $$;

-- Test 8: Check email confirmation
DO $$
DECLARE
  is_confirmed BOOLEAN;
BEGIN
  SELECT email_confirmed_at IS NOT NULL INTO is_confirmed
  FROM auth.users
  WHERE email = 'contact@topaffaireimmo.com';
  
  IF is_confirmed THEN
    RAISE NOTICE '✓ TEST 8 PASSED: Email is confirmed';
  ELSE
    RAISE WARNING '⚠ TEST 8 WARNING: Email not confirmed';
    RAISE WARNING '  ACTION REQUIRED: Confirm email via Supabase Dashboard';
  END IF;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RAISE WARNING '✗ TEST 8 FAILED: User not found';
END $$;

-- Test 9: Check password hash exists
DO $$
DECLARE
  has_password BOOLEAN;
BEGIN
  SELECT encrypted_password IS NOT NULL AND encrypted_password != '' INTO has_password
  FROM auth.users
  WHERE email = 'contact@topaffaireimmo.com';
  
  IF has_password THEN
    RAISE NOTICE '✓ TEST 9 PASSED: User has password set';
  ELSE
    RAISE WARNING '⚠ TEST 9 WARNING: User has no password';
    RAISE WARNING '  ACTION REQUIRED: Set password via Supabase Dashboard or password reset';
  END IF;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RAISE WARNING '✗ TEST 9 FAILED: User not found';
END $$;

-- Test 10: Check user is not banned
DO $$
DECLARE
  is_banned BOOLEAN;
BEGIN
  SELECT banned_until IS NOT NULL AND banned_until > NOW() INTO is_banned
  FROM auth.users
  WHERE email = 'contact@topaffaireimmo.com';
  
  IF NOT is_banned THEN
    RAISE NOTICE '✓ TEST 10 PASSED: User is not banned';
  ELSE
    RAISE WARNING '✗ TEST 10 FAILED: User is banned';
    RAISE WARNING '  ACTION REQUIRED: Unban user via Supabase Dashboard';
  END IF;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RAISE WARNING '✗ TEST 10 FAILED: User not found';
END $$;

-- Show admin user details
SELECT 
  '=== ADMIN USER DETAILS ===' as test_name,
  u.id as user_id,
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  u.encrypted_password IS NOT NULL as has_password,
  u.banned_until IS NULL OR u.banned_until < NOW() as not_banned,
  u.created_at as user_created,
  a.created_at as admin_since
FROM auth.users u
LEFT JOIN public.admins a ON a.user_id = u.id
WHERE u.email = 'contact@topaffaireimmo.com';

-- =====================================================
-- PART 3: OVERALL HEALTH CHECK
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  PART 3: OVERALL DATABASE HEALTH                  ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;

-- Test 11: Check migration history
SELECT 
  '=== APPLIED MIGRATIONS ===' as test_name,
  version,
  name
FROM supabase_migrations.schema_migrations
WHERE version IN ('115', '116', '117', '118', '119')
ORDER BY version;

-- Test 12: Count key tables
SELECT 
  '=== TABLE ROW COUNTS ===' as test_name,
  (SELECT COUNT(*) FROM public.artisan_profiles) as artisan_profiles,
  (SELECT COUNT(*) FROM public.artisan_services) as artisan_services,
  (SELECT COUNT(*) FROM public.service_categories) as service_categories,
  (SELECT COUNT(*) FROM public.admins) as admins_count,
  (SELECT COUNT(*) FROM auth.users) as total_users;

-- =====================================================
-- FINAL SUMMARY
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  VERIFICATION COMPLETE                             ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Review the test results above:';
  RAISE NOTICE '- All ✓ marks indicate successful fixes';
  RAISE NOTICE '- Any ✗ or ⚠ marks require attention';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Address any failed tests';
  RAISE NOTICE '2. Test login at frontend: /login';
  RAISE NOTICE '3. Test admin access: /admin';
  RAISE NOTICE '4. Test password reset: /forgot-password';
  RAISE NOTICE '5. Verify artisan services are visible';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- POSTGREST CACHE REFRESH
-- =====================================================

-- Refresh PostgREST cache to ensure new relationships are detected
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- END OF VERIFICATION
-- =====================================================
