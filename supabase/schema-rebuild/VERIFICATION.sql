-- =====================================================
-- VERIFICATION.sql - Post-Migration Verification
-- =====================================================
-- Run this after executing all migration files
-- to verify the schema was created correctly
-- =====================================================

-- Check table count (should be 40+)
SELECT 'Tables Created' as check_type, COUNT(*)::text as result
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS is enabled on all tables
SELECT 'Tables Without RLS' as check_type, COUNT(*)::text as result
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;

-- Check index count
SELECT 'Indexes Created' as check_type, COUNT(*)::text as result
FROM pg_indexes 
WHERE schemaname = 'public';

-- Check RLS policy count
SELECT 'RLS Policies' as check_type, COUNT(*)::text as result
FROM pg_policies 
WHERE schemaname = 'public';

-- Check function count
SELECT 'RPC Functions' as check_type, COUNT(*)::text as result
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.prokind = 'f';

-- Check trigger count
SELECT 'Triggers' as check_type, COUNT(*)::text as result
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND NOT t.tgisinternal;

-- Check seeded data
SELECT 'Cities Seeded' as check_type, COUNT(*)::text as result FROM public.cities;
SELECT 'Neighborhoods Seeded' as check_type, COUNT(*)::text as result FROM public.neighborhoods;
SELECT 'Service Categories' as check_type, COUNT(*)::text as result FROM public.service_categories;
SELECT 'Boost Plans' as check_type, COUNT(*)::text as result FROM public.boost_plans;

-- Check platform settings
SELECT 'Platform Settings' as check_type, 
       CASE WHEN value->>'monetization_enabled' = 'false' THEN '✓ Monetization OFF' 
            ELSE '⚠ Monetization ON' END as result
FROM public.platform_settings WHERE key = 'monetization';

-- Check critical RPC functions exist
SELECT 'is_admin() function' as check_type,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_proc WHERE proname = 'is_admin'
       ) THEN '✓ Exists' ELSE '✗ Missing' END as result;

SELECT 'approve_property() function' as check_type,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_proc WHERE proname = 'approve_property'
       ) THEN '✓ Exists' ELSE '✗ Missing' END as result;

SELECT 'approve_artisan_service() function' as check_type,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_proc WHERE proname = 'approve_artisan_service'
       ) THEN '✓ Exists' ELSE '✗ Missing' END as result;

-- Check extensions
SELECT 'pg_trgm extension' as check_type,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
       ) THEN '✓ Installed' ELSE '✗ Missing' END as result;

SELECT 'unaccent extension' as check_type,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_extension WHERE extname = 'unaccent'
       ) THEN '✓ Installed' ELSE '✗ Missing' END as result;

-- Summary
SELECT '=================' as separator;
SELECT 'VERIFICATION COMPLETE' as status;
SELECT 'Check all results above' as instructions;
SELECT 'Expected: 40+ tables, 150+ indexes, 100+ policies' as expectations;
