-- =====================================================
-- COMPREHENSIVE DIAGNOSTIC SCRIPT
-- =====================================================
-- This script performs a complete diagnostic of:
-- 1. Authentication configuration
-- 2. Database schema validation
-- 3. RLS policies audit
-- 4. Foreign key validation
-- 5. Table structure verification
-- =====================================================

\echo '=================================================='
\echo 'TOPAFFAIREIMMO - COMPREHENSIVE DIAGNOSTIC'
\echo '=================================================='
\echo ''

-- =====================================================
-- SECTION 1: TABLE EXISTENCE CHECK
-- =====================================================
\echo '1. TABLE EXISTENCE CHECK'
\echo '------------------------'

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') 
    THEN '✅ profiles table exists'
    ELSE '❌ profiles table MISSING'
  END AS profiles_check;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'properties') 
    THEN '✅ properties table exists'
    ELSE '❌ properties table MISSING'
  END AS properties_check;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'artisan_profiles') 
    THEN '✅ artisan_profiles table exists'
    ELSE '❌ artisan_profiles table MISSING'
  END AS artisan_profiles_check;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'artisan_services') 
    THEN '✅ artisan_services table exists'
    ELSE '❌ artisan_services table MISSING'
  END AS artisan_services_check;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_categories') 
    THEN '✅ service_categories table exists'
    ELSE '❌ service_categories table MISSING'
  END AS service_categories_check;

\echo ''

-- =====================================================
-- SECTION 2: TABLE STRUCTURE VALIDATION
-- =====================================================
\echo '2. TABLE STRUCTURE VALIDATION'
\echo '-----------------------------'

-- Check profiles table columns
\echo 'Profiles table columns:'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

\echo ''
\echo 'Properties table columns:'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'properties'
ORDER BY ordinal_position;

\echo ''
\echo 'Artisan Profiles table columns:'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'artisan_profiles'
ORDER BY ordinal_position;

\echo ''

-- =====================================================
-- SECTION 3: FOREIGN KEY VALIDATION
-- =====================================================
\echo '3. FOREIGN KEY RELATIONSHIPS'
\echo '----------------------------'

SELECT
  tc.table_name AS source_table,
  kcu.column_name AS source_column,
  ccu.table_name AS target_table,
  ccu.column_name AS target_column,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('profiles', 'properties', 'artisan_profiles', 'artisan_services')
ORDER BY tc.table_name, kcu.column_name;

\echo ''

-- =====================================================
-- SECTION 4: RLS STATUS CHECK
-- =====================================================
\echo '4. ROW LEVEL SECURITY STATUS'
\echo '----------------------------'

SELECT
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'properties', 'artisan_profiles', 'artisan_services', 'notifications', 'service_requests')
ORDER BY tablename;

\echo ''

-- =====================================================
-- SECTION 5: RLS POLICIES AUDIT
-- =====================================================
\echo '5. RLS POLICIES AUDIT'
\echo '---------------------'

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_clause,
  with_check AS with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'properties', 'artisan_profiles', 'artisan_services')
ORDER BY tablename, policyname;

\echo ''

-- =====================================================
-- SECTION 6: TRIGGERS VALIDATION
-- =====================================================
\echo '6. DATABASE TRIGGERS'
\echo '--------------------'

SELECT
  event_object_table AS table_name,
  trigger_name,
  event_manipulation AS event,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('profiles', 'properties', 'artisan_profiles')
ORDER BY event_object_table, trigger_name;

\echo ''

-- =====================================================
-- SECTION 7: DATA SAMPLE COUNTS
-- =====================================================
\echo '7. DATA SAMPLE COUNTS'
\echo '---------------------'

-- Count records in key tables
SELECT 
  (SELECT COUNT(*) FROM auth.users) AS total_users,
  (SELECT COUNT(*) FROM public.profiles) AS total_profiles,
  (SELECT COUNT(*) FROM public.properties) AS total_properties,
  (SELECT COUNT(*) FROM public.artisan_profiles) AS total_artisan_profiles;

\echo ''

-- =====================================================
-- SECTION 8: ORPHANED RECORDS CHECK
-- =====================================================
\echo '8. ORPHANED RECORDS CHECK'
\echo '-------------------------'

-- Check for users without profiles
SELECT 
  COUNT(*) AS users_without_profiles
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- Check for profiles without users
SELECT 
  COUNT(*) AS profiles_without_users
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = p.id
);

-- Check for properties without valid user_id
SELECT 
  COUNT(*) AS properties_with_invalid_user
FROM public.properties prop
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = prop.user_id
);

\echo ''

-- =====================================================
-- SECTION 9: STORAGE BUCKETS
-- =====================================================
\echo '9. STORAGE BUCKETS'
\echo '------------------'

SELECT
  id AS bucket_name,
  public,
  CASE 
    WHEN public = true THEN '✅ PUBLIC'
    ELSE '❌ PRIVATE'
  END AS access_level
FROM storage.buckets
ORDER BY id;

\echo ''

-- =====================================================
-- SECTION 10: STORAGE POLICIES
-- =====================================================
\echo '10. STORAGE POLICIES'
\echo '--------------------'

SELECT
  bucket_id,
  name AS policy_name,
  definition
FROM storage.policies
ORDER BY bucket_id, name;

\echo ''

-- =====================================================
-- SECTION 11: FUNCTIONS CHECK
-- =====================================================
\echo '11. CUSTOM FUNCTIONS'
\echo '--------------------'

SELECT
  n.nspname AS schema,
  p.proname AS function_name,
  pg_get_function_result(p.oid) AS return_type,
  pg_get_function_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%profile%' OR p.proname LIKE '%artisan%'
ORDER BY p.proname;

\echo ''
\echo '=================================================='
\echo 'DIAGNOSTIC COMPLETE'
\echo '=================================================='
\echo ''
\echo 'Next steps:'
\echo '1. Review RLS policies - ensure SELECT/INSERT/UPDATE/DELETE policies exist'
\echo '2. Check for orphaned records (users without profiles)'
\echo '3. Verify foreign key constraints are correct'
\echo '4. Test frontend queries match actual column names'
\echo '5. Run: NOTIFY pgrst, '\''reload schema'\'';'
\echo ''
