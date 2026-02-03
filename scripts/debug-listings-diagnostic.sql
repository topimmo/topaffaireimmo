-- =====================================================
-- DIAGNOSTIC SCRIPT: Debug Property Listings Not Showing
-- =====================================================
-- Purpose: Investigate why property listings are not showing on TopAffaireImmo
-- Symptoms: HTTP 300 on /rest/v1/properties, HTTP 404 on /rest/v1/promo_banners
--          Empty properties table, UPDATE...LIMIT syntax errors
-- =====================================================

\echo '============================================='
\echo 'A) VERIFY DATABASE CONTAINS LISTINGS'
\echo '============================================='

-- Count total properties
\echo '\n1. Total properties count:'
SELECT COUNT(*) as total_properties FROM public.properties;

-- Count by status
\echo '\n2. Properties by status:'
SELECT 
  status, 
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0), 2) as percentage
FROM public.properties 
GROUP BY status
ORDER BY count DESC;

-- Count by is_archived
\echo '\n3. Properties by is_archived flag:'
SELECT 
  COALESCE(is_archived::TEXT, 'NULL') as is_archived, 
  COUNT(*) as count
FROM public.properties 
GROUP BY is_archived
ORDER BY count DESC;

-- Combined status + archived view
\echo '\n4. Properties by status AND is_archived (combined view):'
SELECT 
  status,
  COALESCE(is_archived::TEXT, 'NULL') as is_archived,
  COUNT(*) as count
FROM public.properties 
GROUP BY status, is_archived
ORDER BY status, is_archived;

-- Check for sample listings
\echo '\n5. Sample vs real listings:'
SELECT 
  COALESCE(is_sample::TEXT, 'NULL') as is_sample,
  COUNT(*) as count
FROM public.properties 
GROUP BY is_sample;

-- Check publicly visible listings (what users should see)
\echo '\n6. Publicly visible listings (status=published, is_archived=false):'
SELECT COUNT(*) as publicly_visible
FROM public.properties
WHERE status = 'published' 
  AND (is_archived = FALSE OR is_archived IS NULL);

\echo '\n============================================='
\echo 'B) CHECK DATABASE SCHEMA & COLUMNS'
\echo '============================================='

-- Verify properties table columns
\echo '\n7. Properties table columns:'
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'properties'
  AND column_name IN ('id', 'status', 'is_archived', 'published_at', 'approved_at', 'created_at', 'owner_id', 'created_by')
ORDER BY ordinal_position;

\echo '\n============================================='
\echo 'C) CHECK RLS POLICIES'
\echo '============================================='

-- Check if RLS is enabled
\echo '\n8. RLS status on properties table:'
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'properties';

-- List all policies on properties table
\echo '\n9. All RLS policies on properties table:'
SELECT 
  policyname,
  cmd as command,
  permissive,
  roles,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'properties'
ORDER BY cmd, policyname;

\echo '\n============================================='
\echo 'D) CHECK PROMO_BANNERS TABLE'
\echo '============================================='

-- Check if promo_banners table exists
\echo '\n10. Promo banners table exists:'
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'promo_banners';

-- If exists, count rows
\echo '\n11. Promo banners count:'
SELECT COUNT(*) as total_banners FROM public.promo_banners;

-- Check active promo banners
\echo '\n12. Active promo banners:'
SELECT 
  id, 
  title, 
  position, 
  is_active,
  starts_at,
  ends_at
FROM public.promo_banners
WHERE is_active = true
  AND (starts_at IS NULL OR starts_at <= NOW())
  AND (ends_at IS NULL OR ends_at >= NOW());

-- Check RLS on promo_banners
\echo '\n13. RLS policies on promo_banners:'
SELECT 
  policyname,
  cmd as command,
  qual as using_clause
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'promo_banners'
ORDER BY cmd, policyname;

\echo '\n============================================='
\echo 'E) CHECK INDEXES & PERFORMANCE'
\echo '============================================='

-- Check indexes on properties table
\echo '\n14. Indexes on properties table:'
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'properties'
ORDER BY indexname;

\echo '\n============================================='
\echo 'F) SAMPLE QUERY TEST (as anon user)'
\echo '============================================='

-- Simulate what public users would see (without auth)
\echo '\n15. Sample properties that should be visible to public:'
SELECT 
  id,
  title_fr,
  status,
  is_archived,
  created_at,
  owner_id
FROM public.properties
WHERE status = 'published' 
  AND (is_archived = FALSE OR is_archived IS NULL)
ORDER BY created_at DESC
LIMIT 5;

\echo '\n============================================='
\echo 'G) CHECK FOR COMMON ISSUES'
\echo '============================================='

-- Check for properties with inconsistent status/archived state
\echo '\n16. Inconsistent status/archived states:'
SELECT 
  id,
  status,
  is_archived,
  created_at
FROM public.properties
WHERE (status = 'archived' AND is_archived = FALSE)
   OR (status != 'archived' AND is_archived = TRUE)
LIMIT 10;

-- Check for properties with NULL status
\echo '\n17. Properties with NULL or unexpected status:'
SELECT 
  COUNT(*) as count_null_status
FROM public.properties
WHERE status IS NULL;

\echo '\n============================================='
\echo 'H) DIAGNOSTIC SUMMARY'
\echo '============================================='

\echo '\nDiagnostic complete. Review results above to identify:'
\echo '  1. If properties table is empty (need to seed data)'
\echo '  2. If properties exist but all have wrong status (need to update)'
\echo '  3. If RLS policies are too restrictive (need to fix policies)'
\echo '  4. If promo_banners table is missing (need to run migration)'
\echo '  5. If indexes are missing (performance issue, not blocking)'
\echo ''
\echo 'Next steps: Based on findings, run appropriate fix script.'
\echo '============================================='
