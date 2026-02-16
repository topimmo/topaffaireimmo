-- =====================================================
-- Manual Test Queries for Production Verification
-- =====================================================
-- Run these queries manually after deploying migrations
-- to verify everything works correctly
-- =====================================================

-- =====================================================
-- TEST 1: Verify artisan_services structure
-- =====================================================
\echo '\n=== TEST 1: Artisan Services Structure ===\n'

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'artisan_services'
  AND column_name IN ('id', 'artisan_id', 'artisan_profile_id', 'category_id', 'subcategory_id', 'city')
ORDER BY ordinal_position;

-- =====================================================
-- TEST 2: Verify foreign key relationships
-- =====================================================
\echo '\n=== TEST 2: Foreign Key Relationships ===\n'

SELECT 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'artisan_services' 
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.constraint_name;

-- =====================================================
-- TEST 3: Verify indexes
-- =====================================================
\echo '\n=== TEST 3: Indexes on artisan_services ===\n'

SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'artisan_services'
  AND schemaname = 'public'
ORDER BY indexname;

-- =====================================================
-- TEST 4: Count records and check linking
-- =====================================================
\echo '\n=== TEST 4: Record Counts and Linking ===\n'

SELECT 
  'Artisan Profiles' as table_name,
  COUNT(*) as record_count
FROM public.artisan_profiles
UNION ALL
SELECT 
  'Artisan Services' as table_name,
  COUNT(*) as record_count
FROM public.artisan_services
UNION ALL
SELECT 
  'Services with Profile ID' as table_name,
  COUNT(*) as record_count
FROM public.artisan_services
WHERE artisan_profile_id IS NOT NULL
UNION ALL
SELECT 
  'Orphaned Services' as table_name,
  COUNT(*) as record_count
FROM public.artisan_services
WHERE artisan_profile_id IS NULL;

-- =====================================================
-- TEST 5: Test JOIN between tables
-- =====================================================
\echo '\n=== TEST 5: JOIN Test (Sample Data) ===\n'

SELECT 
  s.id as service_id,
  s.city,
  s.is_active as service_active,
  p.id as profile_id,
  p.business_name,
  p.phone,
  p.is_verified,
  p.is_active as profile_active,
  sc.name_fr as category_name
FROM public.artisan_services s
INNER JOIN public.artisan_profiles p 
  ON p.id = s.artisan_profile_id
LEFT JOIN public.service_categories sc
  ON sc.id = s.category_id
WHERE s.is_active = true
  AND p.is_active = true
LIMIT 5;

-- =====================================================
-- TEST 6: Simulate PostgREST query
-- =====================================================
\echo '\n=== TEST 6: PostgREST-style Query ===\n'

-- This simulates what PostgREST does when you query:
-- .from('artisan_services').select('*, artisan_profiles(*)')
SELECT 
  json_build_object(
    'id', s.id,
    'city', s.city,
    'category_id', s.category_id,
    'is_active', s.is_active,
    'artisan_profiles', json_build_object(
      'id', p.id,
      'business_name', p.business_name,
      'phone', p.phone,
      'description_fr', p.description_fr,
      'is_verified', p.is_verified
    )
  ) as postgrest_result
FROM public.artisan_services s
LEFT JOIN public.artisan_profiles p 
  ON p.id = s.artisan_profile_id
WHERE s.is_active = true
LIMIT 3;

-- =====================================================
-- TEST 7: Verify admin user
-- =====================================================
\echo '\n=== TEST 7: Admin User Check ===\n'

SELECT 
  u.id as user_id,
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  u.encrypted_password IS NOT NULL as has_password,
  u.banned_until IS NULL OR u.banned_until < NOW() as not_banned,
  u.created_at as user_created,
  a.created_at as admin_since,
  CASE 
    WHEN a.user_id IS NOT NULL THEN '✓ IS ADMIN'
    ELSE '✗ NOT ADMIN'
  END as admin_status
FROM auth.users u
LEFT JOIN public.admins a ON a.user_id = u.id
WHERE u.email = 'contact@topaffaireimmo.com';

-- =====================================================
-- TEST 8: Check RLS policies
-- =====================================================
\echo '\n=== TEST 8: RLS Policies on artisan_services ===\n'

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'artisan_services'
  AND schemaname = 'public'
ORDER BY policyname;

-- =====================================================
-- TEST 9: Check applied migrations
-- =====================================================
\echo '\n=== TEST 9: Applied Migrations ===\n'

SELECT 
  version,
  name,
  executed_at
FROM supabase_migrations.schema_migrations
WHERE version IN ('115', '116', '117', '118', '119')
ORDER BY version;

-- =====================================================
-- TEST 10: Performance test (optional)
-- =====================================================
\echo '\n=== TEST 10: Performance Test ===\n'

EXPLAIN ANALYZE
SELECT 
  s.id,
  s.city,
  p.business_name,
  p.phone
FROM public.artisan_services s
INNER JOIN public.artisan_profiles p 
  ON p.id = s.artisan_profile_id
WHERE s.city = 'casablanca'
  AND s.is_active = true
  AND p.is_verified = true
LIMIT 10;

-- =====================================================
-- SUMMARY
-- =====================================================
\echo '\n=== VERIFICATION COMPLETE ===\n'
\echo 'Check all tests above for:'
\echo '  ✓ artisan_profile_id column exists'
\echo '  ✓ Foreign key constraint exists'
\echo '  ✓ Index exists'
\echo '  ✓ All services linked (0 orphaned)'
\echo '  ✓ JOIN queries work'
\echo '  ✓ Admin user properly configured'
\echo '  ✓ Migrations applied'
\echo '\n'

-- =====================================================
-- EXPECTED RESULTS
-- =====================================================

/*
TEST 1: Should show artisan_profile_id as UUID, nullable
TEST 2: Should show FK to artisan_profiles(id)
TEST 3: Should show idx_artisan_services_profile_id
TEST 4: Should show 0 orphaned services
TEST 5: Should return sample joined data
TEST 6: Should return nested JSON
TEST 7: Should show admin user with ✓ IS ADMIN
TEST 8: Should show RLS policies
TEST 9: Should show migrations 115-119
TEST 10: Should use index (check Seq Scan vs Index Scan)
*/
