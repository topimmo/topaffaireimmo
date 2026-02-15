-- =====================================================
-- TopAffaireImmo Backend Validation Script
-- =====================================================
-- Run this script to verify complete backend setup
-- Execute in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. VERIFY EXTENSIONS
-- =====================================================

SELECT 'Checking Extensions...' as step;

SELECT 
  extname as extension_name,
  CASE 
    WHEN extname IN ('pg_trgm', 'unaccent', 'pgcrypto', 'uuid-ossp') THEN '✅ Required'
    ELSE '📦 Optional'
  END as status
FROM pg_extension
WHERE extname IN ('pg_trgm', 'unaccent', 'pgcrypto', 'uuid-ossp', 'postgis')
ORDER BY extname;

-- =====================================================
-- 2. VERIFY TABLES EXIST
-- =====================================================

SELECT 'Checking Tables...' as step;

WITH required_tables AS (
  SELECT unnest(ARRAY[
    'profiles',
    'properties',
    'property_images',
    'notifications',
    'boost_plans',
    'property_boosts',
    'payments',
    'phone_reveal_events',
    'artisan_profiles',
    'service_categories',
    'admins',
    'admin_audit_logs',
    'sms_logs',
    'email_resend_attempts',
    'system_logs',
    'performance_metrics'
  ]) AS table_name
)
SELECT 
  rt.table_name,
  CASE 
    WHEN t.table_name IS NOT NULL THEN '✅ Exists'
    ELSE '❌ Missing'
  END as status,
  CASE 
    WHEN t.table_name IS NOT NULL THEN pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name)::regclass))
    ELSE 'N/A'
  END as size
FROM required_tables rt
LEFT JOIN information_schema.tables t 
  ON t.table_name = rt.table_name 
  AND t.table_schema = 'public'
ORDER BY rt.table_name;

-- =====================================================
-- 3. VERIFY RLS IS ENABLED
-- =====================================================

SELECT 'Checking RLS Policies...' as step;

SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ Enabled'
    ELSE '⚠️ Disabled'
  END as rls_status,
  (
    SELECT count(*)
    FROM pg_policies pp
    WHERE pp.schemaname = pt.schemaname
      AND pp.tablename = pt.tablename
  ) as policy_count
FROM pg_tables pt
WHERE schemaname = 'public'
  AND tablename IN (
    'properties', 'property_images', 'notifications',
    'boost_plans', 'property_boosts', 'payments',
    'artisan_profiles', 'admins'
  )
ORDER BY tablename;

-- =====================================================
-- 4. VERIFY RPC FUNCTIONS EXIST
-- =====================================================

SELECT 'Checking RPC Functions...' as step;

WITH required_functions AS (
  SELECT unnest(ARRAY[
    'submit_property_for_review',
    'approve_property',
    'reject_property',
    'mark_notification_read',
    'mark_all_notifications_read',
    'search_properties',
    'resend_email_confirmation',
    'log_audit_event',
    'get_listing_phone',
    'get_artisan_phone',
    'hash_ip_address',
    'check_reveal_rate_limit'
  ]) AS function_name
)
SELECT 
  rf.function_name,
  CASE 
    WHEN p.proname IS NOT NULL THEN '✅ Exists'
    ELSE '❌ Missing'
  END as status,
  CASE 
    WHEN p.proname IS NOT NULL THEN 
      CASE p.prosecdef 
        WHEN true THEN 'DEFINER' 
        ELSE 'INVOKER' 
      END
    ELSE 'N/A'
  END as security_type
FROM required_functions rf
LEFT JOIN pg_proc p ON p.proname = rf.function_name
  AND p.pronamespace = 'public'::regnamespace
ORDER BY rf.function_name;

-- =====================================================
-- 5. VERIFY INDEXES FOR PERFORMANCE
-- =====================================================

SELECT 'Checking Performance Indexes...' as step;

SELECT 
  schemaname,
  tablename,
  indexname,
  CASE 
    WHEN indexdef LIKE '%gin_trgm_ops%' THEN '🔍 Text Search'
    WHEN indexdef LIKE '%GIN%' THEN '📊 GIN Index'
    WHEN indexdef LIKE '%UNIQUE%' THEN '🔑 Unique'
    ELSE '📈 Standard'
  END as index_type
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE '%trgm%'
    OR indexname LIKE '%_city_%'
    OR indexname LIKE '%_status_%'
    OR indexname LIKE '%_price_%'
    OR tablename IN ('notifications', 'property_boosts', 'phone_reveal_events')
  )
ORDER BY tablename, indexname;

-- =====================================================
-- 6. VERIFY STORAGE BUCKETS
-- =====================================================

SELECT 'Checking Storage Buckets...' as step;

WITH required_buckets AS (
  SELECT unnest(ARRAY[
    'property-images',
    'avatars',
    'payment-receipts',
    'banner-images',
    'agency-logos'
  ]) AS bucket_name
)
SELECT 
  rb.bucket_name,
  CASE 
    WHEN b.id IS NOT NULL THEN '✅ Exists'
    ELSE '❌ Missing'
  END as status,
  CASE 
    WHEN b.id IS NOT NULL THEN 
      CASE WHEN b.public THEN 'Public' ELSE 'Private' END
    ELSE 'N/A'
  END as visibility,
  COALESCE(
    (SELECT count(*) FROM storage.policies WHERE bucket_id = b.id),
    0
  ) as policy_count
FROM required_buckets rb
LEFT JOIN storage.buckets b ON b.id = rb.bucket_name
ORDER BY rb.bucket_name;

-- =====================================================
-- 7. VERIFY BOOST PLANS SEEDED
-- =====================================================

SELECT 'Checking Boost Plans...' as step;

SELECT 
  name,
  price,
  duration_days,
  CASE WHEN is_active THEN '✅ Active' ELSE '⚠️ Inactive' END as status,
  display_order
FROM public.boost_plans
ORDER BY display_order;

-- =====================================================
-- 8. CHECK ADMIN USERS
-- =====================================================

SELECT 'Checking Admin Users...' as step;

SELECT 
  a.user_id,
  p.email,
  p.full_name,
  CASE WHEN a.is_active THEN '✅ Active' ELSE '⚠️ Inactive' END as status,
  a.created_at
FROM public.admins a
JOIN public.profiles p ON p.id = a.user_id
ORDER BY a.created_at;

-- =====================================================
-- 9. VERIFY TRIGGERS
-- =====================================================

SELECT 'Checking Triggers...' as step;

SELECT 
  trigger_schema,
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation as event
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN (
    'properties', 'boost_plans', 'property_boosts',
    'artisan_profiles', 'notifications'
  )
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 10. TEST RPC FUNCTIONS (Basic Validation)
-- =====================================================

SELECT 'Testing RPC Functions...' as step;

-- Test hash function (should return a hash)
SELECT 
  'hash_ip_address' as function_name,
  CASE 
    WHEN public.hash_ip_address('127.0.0.1') IS NOT NULL 
    THEN '✅ Working'
    ELSE '❌ Failed'
  END as test_result;

-- Check notification system is ready
SELECT 
  'Notification System' as component,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND column_name IN ('id', 'user_id', 'type', 'title', 'body', 'is_read')
    )
    THEN '✅ Ready'
    ELSE '❌ Not Ready'
  END as status;

-- Check boost system is ready
SELECT 
  'Boost System' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.boost_plans WHERE is_active = true)
    THEN '✅ Ready'
    ELSE '⚠️ No Active Plans'
  END as status;

-- =====================================================
-- 11. DATABASE STATISTICS
-- =====================================================

SELECT 'Database Statistics...' as step;

SELECT 
  'Total Tables' as metric,
  count(*)::text as value
FROM information_schema.tables
WHERE table_schema = 'public'
UNION ALL
SELECT 
  'Total RPC Functions',
  count(*)::text
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
UNION ALL
SELECT 
  'Total RLS Policies',
  count(*)::text
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT 
  'Total Storage Buckets',
  count(*)::text
FROM storage.buckets
UNION ALL
SELECT 
  'Database Size',
  pg_size_pretty(pg_database_size(current_database()))
UNION ALL
SELECT 
  'Total Properties',
  count(*)::text
FROM public.properties
UNION ALL
SELECT 
  'Approved Properties',
  count(*)::text
FROM public.properties
WHERE status = 'approved';

-- =====================================================
-- 12. SECURITY VALIDATION
-- =====================================================

SELECT 'Security Validation...' as step;

-- Check for tables without RLS
SELECT 
  'Tables Without RLS' as check_name,
  CASE 
    WHEN count(*) = 0 THEN '✅ All Protected'
    ELSE '⚠️ ' || count(*)::text || ' tables need RLS'
  END as result
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
  AND rowsecurity = false;

-- Check for functions without explicit security
SELECT 
  'Functions Security' as check_name,
  '✅ ' || count(*)::text || ' DEFINER functions' as result
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND prosecdef = true;

-- =====================================================
-- 13. PERFORMANCE CHECKS
-- =====================================================

SELECT 'Performance Checks...' as step;

-- Check for missing indexes on foreign keys
SELECT 
  'Foreign Key Indexes' as check_name,
  CASE 
    WHEN count(*) > 0 THEN '⚠️ ' || count(*)::text || ' missing indexes'
    ELSE '✅ All Indexed'
  END as result
FROM (
  SELECT 
    tc.table_name,
    kcu.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND NOT EXISTS (
      SELECT 1 
      FROM pg_indexes pi
      WHERE pi.schemaname = 'public'
        AND pi.tablename = tc.table_name
        AND pi.indexdef LIKE '%' || kcu.column_name || '%'
    )
) missing_indexes;

-- =====================================================
-- FINAL SUMMARY
-- =====================================================

SELECT 'Final Validation Summary...' as step;

SELECT 
  '🎯 Backend Validation Complete' as summary,
  NOW() as validated_at;

-- =====================================================
-- RECOMMENDATIONS
-- =====================================================

SELECT 'Recommendations...' as step;

SELECT 
  CASE 
    WHEN (SELECT count(*) FROM public.admins WHERE is_active = true) = 0 
    THEN '⚠️ No admin users found. Create at least one admin.'
    WHEN (SELECT count(*) FROM public.boost_plans WHERE is_active = true) = 0 
    THEN '⚠️ No active boost plans. Migration may not have seeded data.'
    WHEN NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm')
    THEN '⚠️ pg_trgm extension missing. Search will not work optimally.'
    ELSE '✅ All systems ready for production!'
  END as recommendation;

-- =====================================================
-- END OF VALIDATION
-- =====================================================

SELECT '✅ Validation Script Complete' as final_message;
SELECT 'Review results above for any ❌ or ⚠️ items' as action_required;
