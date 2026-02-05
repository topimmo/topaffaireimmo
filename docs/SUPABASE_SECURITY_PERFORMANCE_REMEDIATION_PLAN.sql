-- =====================================================
-- SUPABASE SECURITY & PERFORMANCE REMEDIATION PLAN
-- =====================================================
-- Project: TopAffaireImmo (PRODUCTION)
-- Generated: 2026-02-05
-- Security Issues: 5
-- Performance Issues: 160
-- 
-- CRITICAL: This is a PRODUCTION database.
-- Apply changes incrementally in small batches.
-- Test each change before moving to the next.
-- Keep rollback scripts ready.
-- =====================================================

-- =====================================================
-- SECTION A: INVENTORY QUERIES
-- =====================================================
-- Run these queries to identify exact security issues
-- Copy-paste each query into Supabase SQL Editor
-- =====================================================

-- -----------------------------------------------------
-- A.1 List ALL Tables with RLS Status
-- -----------------------------------------------------
-- Identifies tables without RLS enabled (security risk)

SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED - SECURITY RISK'
  END as rls_status,
  (SELECT count(*) FROM pg_policies WHERE schemaname = pt.schemaname AND tablename = pt.tablename) as policy_count
FROM pg_tables pt
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT IN ('spatial_ref_sys', 'geography_columns', 'geometry_columns')
ORDER BY 
  CASE WHEN rowsecurity THEN 1 ELSE 0 END,
  tablename;

-- Expected: All user-facing tables should have RLS enabled


-- -----------------------------------------------------
-- A.2 Identify Security Issue #1-3: Sensitive Admin Tables
-- -----------------------------------------------------
-- Check RLS policies for admin_audit_logs, admin_notifications, admin_whitelist

SELECT 
  t.tablename,
  CASE 
    WHEN t.rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END as rls_status,
  p.policyname,
  p.permissive,
  p.roles,
  p.cmd as command,
  p.qual as using_expression,
  p.with_check
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
  AND t.tablename IN ('admin_audit_logs', 'admin_notifications', 'admin_whitelist')
ORDER BY t.tablename, p.policyname;

-- Expected: These tables should have RLS enabled with admin-only policies


-- -----------------------------------------------------
-- A.3 Check GRANTS for anon/authenticated/service_role
-- -----------------------------------------------------
-- Identify tables where anon has excessive permissions

SELECT 
  schemaname,
  tablename,
  grantee,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.table_privileges
WHERE schemaname = 'public'
  AND grantee IN ('anon', 'authenticated', 'service_role', 'postgres')
  AND tablename IN (
    'admin_audit_logs', 'admin_notifications', 'admin_whitelist',
    'property_leads', 'property_views', 'property_contact_clicks',
    'advertising_inquiries'
  )
GROUP BY schemaname, tablename, grantee
ORDER BY tablename, 
  CASE grantee 
    WHEN 'anon' THEN 1 
    WHEN 'authenticated' THEN 2 
    WHEN 'service_role' THEN 3
    WHEN 'postgres' THEN 4
  END;

-- Expected Issues:
-- - anon should NOT have SELECT on admin_* tables
-- - anon should have INSERT on property_leads, advertising_inquiries
-- - anon should NOT have SELECT on property_leads (contains sensitive data)


-- -----------------------------------------------------
-- A.4 Security Issue #4: property_leads Data Exposure
-- -----------------------------------------------------
-- Check if anon can read sensitive lead data (phone, email)

SELECT 
  'property_leads' as table_name,
  policyname,
  roles,
  cmd,
  qual as using_check,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'property_leads'
ORDER BY policyname;

-- Expected: anon should only INSERT, not SELECT


-- -----------------------------------------------------
-- A.5 Security Issue #5: advertising_inquiries Data Exposure
-- -----------------------------------------------------
-- Check if anon can read inquiry data

SELECT 
  'advertising_inquiries' as table_name,
  policyname,
  roles,
  cmd,
  qual as using_check,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'advertising_inquiries'
ORDER BY policyname;

-- Expected: anon should only INSERT, not SELECT


-- -----------------------------------------------------
-- A.6 List ALL RLS Policies Summary
-- -----------------------------------------------------
-- Complete overview of all RLS policies

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as has_using,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK'
    ELSE 'No WITH CHECK'
  END as has_with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;


-- -----------------------------------------------------
-- A.7 Identify SECURITY DEFINER Functions without search_path
-- -----------------------------------------------------
-- Critical security issue: functions without proper search_path

SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE p.provolatile
    WHEN 'i' THEN 'IMMUTABLE'
    WHEN 's' THEN 'STABLE'
    WHEN 'v' THEN 'VOLATILE'
  END as volatility,
  CASE 
    WHEN p.prosecdef THEN '⚠️  SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security,
  COALESCE(array_to_string(p.proconfig, ', '), '❌ NO search_path SET') as config_settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'  -- Only functions, not procedures
ORDER BY 
  p.prosecdef DESC,  -- SECURITY DEFINER first
  CASE WHEN p.proconfig IS NULL THEN 0 ELSE 1 END,  -- Missing config first
  p.proname;

-- Expected: All SECURITY DEFINER functions should have search_path set


-- =====================================================
-- SECTION B: PERFORMANCE INVENTORY QUERIES
-- =====================================================

-- -----------------------------------------------------
-- B.1 Check if pg_stat_statements is Available
-- -----------------------------------------------------

SELECT 
  installed_version,
  CASE 
    WHEN installed_version IS NOT NULL THEN '✅ Available'
    ELSE '❌ Not Installed'
  END as status
FROM pg_available_extensions
WHERE name = 'pg_stat_statements';

-- If not available, rely on Supabase advisor or enable it:
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;


-- -----------------------------------------------------
-- B.2 Top 20 Slowest Queries (if pg_stat_statements available)
-- -----------------------------------------------------

SELECT 
  queryid,
  substring(query, 1, 100) as query_snippet,
  calls,
  total_exec_time::numeric(10,2) as total_ms,
  mean_exec_time::numeric(10,2) as mean_ms,
  max_exec_time::numeric(10,2) as max_ms,
  stddev_exec_time::numeric(10,2) as stddev_ms,
  rows,
  shared_blks_hit,
  shared_blks_read
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
  AND query NOT LIKE '%information_schema%'
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Alternative if pg_stat_statements not available:
-- Use Supabase Dashboard > Database > Query Performance


-- -----------------------------------------------------
-- B.3 Identify Missing Indexes on Hot Tables
-- -----------------------------------------------------
-- Tables with sequential scans that could benefit from indexes

SELECT 
  schemaname,
  tablename,
  seq_scan as sequential_scans,
  seq_tup_read as rows_read_sequentially,
  idx_scan as index_scans,
  idx_tup_fetch as rows_fetched_via_index,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  CASE 
    WHEN seq_scan > 0 THEN round((seq_tup_read::numeric / seq_scan), 2)
    ELSE 0
  END as avg_rows_per_seq_scan,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'property_views',
    'property_leads', 
    'property_contact_clicks',
    'advertising_inquiries',
    'properties',
    'profiles'
  )
ORDER BY seq_scan DESC, seq_tup_read DESC;

-- High seq_scan + seq_tup_read = needs indexes


-- -----------------------------------------------------
-- B.4 Current Indexes on Hot Tables
-- -----------------------------------------------------

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'property_views',
    'property_leads',
    'property_contact_clicks', 
    'advertising_inquiries',
    'properties',
    'profiles'
  )
ORDER BY tablename, indexname;


-- -----------------------------------------------------
-- B.5 Table Bloat Analysis
-- -----------------------------------------------------

SELECT 
  schemaname,
  tablename,
  n_live_tup as live_tuples,
  n_dead_tup as dead_tuples,
  round(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_tuple_percent,
  last_vacuum,
  last_autovacuum,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC
LIMIT 20;

-- High dead_tuple_percent > 20% indicates need for VACUUM


-- -----------------------------------------------------
-- B.6 Index Usage Statistics
-- -----------------------------------------------------

SELECT 
  schemaname,
  tablename,
  indexrelname as index_name,
  idx_scan as times_used,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'property_views',
    'property_leads',
    'property_contact_clicks',
    'advertising_inquiries'
  )
ORDER BY idx_scan DESC;

-- idx_scan = 0 means index is never used (consider dropping)


-- =====================================================
-- SECTION C: RECOMMENDED INDEXES
-- =====================================================
-- Top 10 indexes to add for performance improvement
-- Based on common query patterns and analytics needs
-- =====================================================

/*
RECOMMENDED INDEXES (Priority Order):

1. property_views.property_id + created_at (composite)
   Reason: Analytics queries filter by property and time range
   Benefit: 10-100x faster analytics queries
   
2. property_leads.advertiser_id + status + created_at (composite)
   Reason: Dashboard queries for advertisers to see their leads
   Benefit: Instant lead dashboard loading
   
3. property_contact_clicks.property_id + created_at (composite)
   Reason: Contact analytics by property and time
   Benefit: Faster engagement tracking
   
4. advertising_inquiries.status + created_at (composite)
   Reason: Admin dashboard filtering by status
   Benefit: Instant admin inquiry list
   
5. property_leads.email (partial index where email IS NOT NULL)
   Reason: Lookup leads by email for deduplication
   Benefit: Prevent duplicate submissions
   
6. property_leads.phone (partial index where phone IS NOT NULL)
   Reason: Lookup leads by phone for deduplication
   Benefit: Prevent duplicate submissions
   
7. property_views.user_id + created_at (partial, where user_id IS NOT NULL)
   Reason: Track registered user behavior
   Benefit: User analytics
   
8. property_contact_clicks.contact_type + created_at
   Reason: Analytics by contact method
   Benefit: Track which contact methods perform best
   
9. property_leads.source + created_at
   Reason: Track lead source effectiveness
   Benefit: Marketing attribution
   
10. advertising_inquiries.email
    Reason: Lookup inquiries by email
    Benefit: Prevent duplicates, faster search
*/


-- =====================================================
-- SECTION D: FIX BATCH #1 - CRITICAL SECURITY ISSUES
-- =====================================================
-- Apply these fixes FIRST to secure sensitive data
-- Execute in Supabase SQL Editor
-- =====================================================

-- -----------------------------------------------------
-- D.1 Fix: Remove anon access to admin_audit_logs
-- -----------------------------------------------------
-- Verify current grants first
SELECT grantee, privilege_type 
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
  AND table_name = 'admin_audit_logs'
  AND grantee = 'anon';

-- Apply fix
REVOKE ALL ON public.admin_audit_logs FROM anon;
REVOKE ALL ON public.admin_audit_logs FROM authenticated;

-- Verify (should return 0 rows)
SELECT grantee, privilege_type 
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
  AND table_name = 'admin_audit_logs'
  AND grantee IN ('anon', 'authenticated');


-- -----------------------------------------------------
-- D.2 Fix: Remove anon access to admin_notifications
-- -----------------------------------------------------
-- Verify current grants
SELECT grantee, privilege_type 
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
  AND table_name = 'admin_notifications'
  AND grantee = 'anon';

-- Apply fix
REVOKE ALL ON public.admin_notifications FROM anon;
REVOKE ALL ON public.admin_notifications FROM authenticated;

-- Verify (should return 0 rows)
SELECT grantee, privilege_type 
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
  AND table_name = 'admin_notifications'
  AND grantee IN ('anon', 'authenticated');


-- -----------------------------------------------------
-- D.3 Fix: Ensure admin_whitelist has proper RLS
-- -----------------------------------------------------
-- Already applied based on problem statement, verify:

SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as rls_status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'admin_whitelist';

SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'admin_whitelist';

-- Should show RLS enabled and "Admins only" policy


-- -----------------------------------------------------
-- D.4 Fix: Secure property_leads (no anon SELECT)
-- -----------------------------------------------------
-- Problem: Leads contain sensitive data (phone, email)
-- Solution: Allow INSERT for anon, but no SELECT

-- Check existing policies
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'property_leads'
ORDER BY cmd, policyname;

-- Drop any policies that allow anon SELECT
-- Note: Based on migration 078, there's "Anyone can create leads" for INSERT
-- That's correct. Ensure no SELECT policy for anon exists.

-- If there's a SELECT policy for anon/public, drop it:
-- DROP POLICY IF EXISTS "policy_name_here" ON property_leads;

-- Verify anon cannot SELECT
-- Expected: Only advertiser_id and admins can SELECT


-- -----------------------------------------------------
-- D.5 Fix: Secure advertising_inquiries (no anon SELECT)
-- -----------------------------------------------------
-- Same issue as property_leads

-- Check existing policies
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'advertising_inquiries'
ORDER BY cmd, policyname;

-- Based on migration 033, policies look correct:
-- - INSERT for public (anon can submit)
-- - SELECT only for admins

-- Verify (should only show admin SELECT, public INSERT)


-- -----------------------------------------------------
-- D.6 Verify: Revoke SELECT on sensitive columns
-- -----------------------------------------------------
-- Additional protection: Revoke SELECT on specific sensitive columns

-- For property_leads
REVOKE SELECT (email, phone) ON public.property_leads FROM anon;
REVOKE SELECT (email, phone) ON public.property_leads FROM authenticated;

-- For advertising_inquiries  
REVOKE SELECT (email, phone) ON public.advertising_inquiries FROM anon;
REVOKE SELECT (email, phone) ON public.advertising_inquiries FROM authenticated;

-- Verify
SELECT table_name, column_name, privilege_type, grantee
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name IN ('property_leads', 'advertising_inquiries')
  AND column_name IN ('email', 'phone')
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, column_name;

-- Should return 0 rows


-- =====================================================
-- SECTION E: FIX BATCH #2 - PERFORMANCE INDEXES
-- =====================================================
-- Create indexes CONCURRENTLY to avoid locking
-- Apply these in production during low-traffic hours
-- =====================================================

-- -----------------------------------------------------
-- E.1 property_views: Composite index for analytics
-- -----------------------------------------------------

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_property_views_property_created 
ON property_views(property_id, created_at DESC);

-- Verify index created
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'property_views'
  AND indexname = 'idx_property_views_property_created';

-- Test index usage
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*) 
FROM property_views 
WHERE property_id = 'some-uuid-here'
  AND created_at >= NOW() - INTERVAL '30 days';

-- Expected: Should use idx_property_views_property_created


-- -----------------------------------------------------
-- E.2 property_leads: Composite index for advertiser dashboard
-- -----------------------------------------------------

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_property_leads_advertiser_status_created
ON property_leads(advertiser_id, status, created_at DESC);

-- Verify
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'property_leads'
  AND indexname = 'idx_property_leads_advertiser_status_created';

-- Test
EXPLAIN (ANALYZE, BUFFERS)
SELECT * 
FROM property_leads
WHERE advertiser_id = 'some-uuid-here'
  AND status = 'new'
ORDER BY created_at DESC
LIMIT 10;


-- -----------------------------------------------------
-- E.3 property_contact_clicks: Composite index
-- -----------------------------------------------------

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contact_clicks_property_created
ON property_contact_clicks(property_id, created_at DESC);

-- Verify
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'property_contact_clicks'
  AND indexname = 'idx_contact_clicks_property_created';


-- -----------------------------------------------------
-- E.4 advertising_inquiries: Composite status + created_at
-- -----------------------------------------------------

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_advertising_inquiries_status_created
ON advertising_inquiries(status, created_at DESC);

-- Verify
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'advertising_inquiries'
  AND indexname = 'idx_advertising_inquiries_status_created';

-- Test
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM advertising_inquiries
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 20;


-- -----------------------------------------------------
-- E.5 property_leads: Email lookup (partial index)
-- -----------------------------------------------------

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_property_leads_email
ON property_leads(email)
WHERE email IS NOT NULL;

-- Verify
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'property_leads'
  AND indexname = 'idx_property_leads_email';


-- -----------------------------------------------------
-- E.6 property_leads: Phone lookup (partial index)
-- -----------------------------------------------------

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_property_leads_phone
ON property_leads(phone)
WHERE phone IS NOT NULL;

-- Verify
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'property_leads'
  AND indexname = 'idx_property_leads_phone';


-- -----------------------------------------------------
-- E.7 property_views: User behavior tracking
-- -----------------------------------------------------

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_property_views_user_created
ON property_views(user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- Verify
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'property_views'
  AND indexname = 'idx_property_views_user_created';


-- -----------------------------------------------------
-- E.8 property_contact_clicks: Contact type analytics
-- -----------------------------------------------------

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contact_clicks_type_created
ON property_contact_clicks(contact_type, created_at DESC);

-- Verify
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'property_contact_clicks'
  AND indexname = 'idx_contact_clicks_type_created';


-- -----------------------------------------------------
-- E.9 property_leads: Source tracking
-- -----------------------------------------------------

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_property_leads_source_created
ON property_leads(source, created_at DESC);

-- Verify
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'property_leads'
  AND indexname = 'idx_property_leads_source_created';


-- -----------------------------------------------------
-- E.10 advertising_inquiries: Email lookup
-- -----------------------------------------------------

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_advertising_inquiries_email
ON advertising_inquiries(email);

-- Verify
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'advertising_inquiries'
  AND indexname = 'idx_advertising_inquiries_email';


-- =====================================================
-- SECTION F: FIX BATCH #3 - SECURITY HARDENING
-- =====================================================
-- Ensure all SECURITY DEFINER functions have search_path
-- =====================================================

-- -----------------------------------------------------
-- F.1 List functions missing search_path
-- -----------------------------------------------------

SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE 
    WHEN p.prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND p.prosecdef = true  -- Only SECURITY DEFINER
  AND p.proconfig IS NULL  -- Missing configuration
ORDER BY p.proname;


-- -----------------------------------------------------
-- F.2 Fix: update_updated_at function (already fixed per problem statement)
-- -----------------------------------------------------
-- Verify it has search_path set

SELECT 
  p.proname,
  array_to_string(p.proconfig, ', ') as config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'update_updated_at';

-- Expected: Should show search_path=public


-- -----------------------------------------------------
-- F.3 Fix: update_property_leads_updated_at
-- -----------------------------------------------------
-- From migration 078, this function needs search_path

ALTER FUNCTION public.update_property_leads_updated_at()
SET search_path = public;

-- Verify
SELECT 
  p.proname,
  array_to_string(p.proconfig, ', ') as config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'update_property_leads_updated_at';


-- -----------------------------------------------------
-- F.4 Find and fix any other SECURITY DEFINER functions
-- -----------------------------------------------------
-- Generate ALTER statements for all SECURITY DEFINER functions without search_path

SELECT 
  'ALTER FUNCTION ' || n.nspname || '.' || p.proname || 
  '(' || pg_get_function_identity_arguments(p.oid) || ')' ||
  E'\nSET search_path = public;' as fix_statement
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND p.prosecdef = true
  AND p.proconfig IS NULL
ORDER BY p.proname;

-- Copy and execute each ALTER statement


-- -----------------------------------------------------
-- F.5 Verify all SECURITY DEFINER functions are secured
-- -----------------------------------------------------

SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE 
    WHEN p.prosecdef THEN '⚠️  SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security,
  COALESCE(array_to_string(p.proconfig, ', '), '❌ MISSING') as search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND p.prosecdef = true
ORDER BY p.proname;

-- Expected: All should have search_path configured


-- =====================================================
-- SECTION G: FINAL VERIFICATION QUERIES
-- =====================================================

-- -----------------------------------------------------
-- G.1 Security Verification Checklist
-- -----------------------------------------------------

-- Check 1: RLS enabled on all sensitive tables
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅' ELSE '❌' END as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'admin_audit_logs',
    'admin_notifications', 
    'admin_whitelist',
    'property_leads',
    'property_views',
    'property_contact_clicks',
    'advertising_inquiries'
  )
ORDER BY tablename;

-- Check 2: No anon SELECT on sensitive tables
SELECT 
  table_name,
  privilege_type,
  grantee
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN (
    'admin_audit_logs',
    'admin_notifications',
    'admin_whitelist',
    'property_leads',
    'advertising_inquiries'
  )
  AND grantee = 'anon'
  AND privilege_type = 'SELECT';

-- Expected: 0 rows

-- Check 3: All SECURITY DEFINER functions have search_path
SELECT 
  p.proname as function_name,
  CASE 
    WHEN p.proconfig IS NOT NULL THEN '✅ Secured'
    ELSE '❌ VULNERABLE'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY status, p.proname;

-- Expected: All show "✅ Secured"


-- -----------------------------------------------------
-- G.2 Performance Verification
-- -----------------------------------------------------

-- Check indexes created
SELECT 
  tablename,
  COUNT(*) as index_count,
  pg_size_pretty(SUM(pg_relation_size(indexrelid))) as total_index_size
FROM pg_indexes
JOIN pg_class ON pg_indexes.indexname = pg_class.relname
WHERE schemaname = 'public'
  AND tablename IN (
    'property_views',
    'property_leads',
    'property_contact_clicks',
    'advertising_inquiries'
  )
GROUP BY tablename
ORDER BY tablename;

-- Expected: Each table should have multiple indexes


-- -----------------------------------------------------
-- G.3 Test Query Performance
-- -----------------------------------------------------

-- Test 1: property_views analytics
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
  property_id,
  COUNT(*) as view_count,
  COUNT(DISTINCT session_id) as unique_sessions
FROM property_views
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY property_id
ORDER BY view_count DESC
LIMIT 10;

-- Test 2: property_leads dashboard
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM property_leads
WHERE advertiser_id = auth.uid()
  AND status = 'new'
ORDER BY created_at DESC
LIMIT 20;

-- Test 3: advertising_inquiries admin view
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM advertising_inquiries
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 50;

-- Look for "Index Scan" instead of "Seq Scan" in EXPLAIN output


-- =====================================================
-- SECTION H: ROLLBACK SCRIPTS
-- =====================================================
-- Use these if you need to revert changes
-- =====================================================

-- -----------------------------------------------------
-- H.1 Rollback: Drop indexes if needed
-- -----------------------------------------------------

-- Drop property_views indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_property_views_property_created;
DROP INDEX CONCURRENTLY IF EXISTS idx_property_views_user_created;

-- Drop property_leads indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_property_leads_advertiser_status_created;
DROP INDEX CONCURRENTLY IF EXISTS idx_property_leads_email;
DROP INDEX CONCURRENTLY IF EXISTS idx_property_leads_phone;
DROP INDEX CONCURRENTLY IF EXISTS idx_property_leads_source_created;

-- Drop property_contact_clicks indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_contact_clicks_property_created;
DROP INDEX CONCURRENTLY IF EXISTS idx_contact_clicks_type_created;

-- Drop advertising_inquiries indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_advertising_inquiries_status_created;
DROP INDEX CONCURRENTLY IF EXISTS idx_advertising_inquiries_email;


-- -----------------------------------------------------
-- H.2 Rollback: Re-grant permissions (NOT RECOMMENDED)
-- -----------------------------------------------------
-- Only use if you need to temporarily restore access

-- GRANT SELECT ON public.admin_audit_logs TO anon;  -- NOT RECOMMENDED
-- GRANT SELECT ON public.admin_notifications TO anon;  -- NOT RECOMMENDED


-- -----------------------------------------------------
-- H.3 Rollback: Remove search_path from functions
-- -----------------------------------------------------
-- Only if absolutely necessary (NOT RECOMMENDED)

-- ALTER FUNCTION public.update_updated_at() RESET search_path;
-- ALTER FUNCTION public.update_property_leads_updated_at() RESET search_path;


-- =====================================================
-- SECTION I: ROLLOUT PLAN & CHECKLIST
-- =====================================================

/*
RECOMMENDED ROLLOUT ORDER:

📋 PHASE 1: INVENTORY & ASSESSMENT (Safe, Read-Only)
- [ ] Run all queries in Section A (Inventory Queries)
- [ ] Run all queries in Section B (Performance Queries)
- [ ] Document current state and issues found
- [ ] Review with team
- [ ] Schedule maintenance window for changes

📋 PHASE 2: CRITICAL SECURITY FIXES (30 minutes, Low Risk)
Execute during business hours:
- [ ] D.1: REVOKE admin_audit_logs from anon
- [ ] D.2: REVOKE admin_notifications from anon
- [ ] D.3: Verify admin_whitelist RLS
- [ ] D.4: Verify property_leads policies
- [ ] D.5: Verify advertising_inquiries policies
- [ ] D.6: REVOKE sensitive columns
- [ ] Test: Verify anon cannot read sensitive data
- [ ] Test: Verify forms still work (submit lead, inquiry)

📋 PHASE 3: PERFORMANCE INDEXES BATCH 1 (1 hour, Low Risk)
Execute during LOW-TRAFFIC hours (e.g., 2-4 AM):
- [ ] E.1: Create idx_property_views_property_created
- [ ] E.2: Create idx_property_leads_advertiser_status_created
- [ ] E.3: Create idx_contact_clicks_property_created
- [ ] E.4: Create idx_advertising_inquiries_status_created
- [ ] Monitor: Check CPU and disk I/O during creation
- [ ] Verify: Run test queries to confirm index usage

📋 PHASE 4: PERFORMANCE INDEXES BATCH 2 (1 hour, Low Risk)
Execute during LOW-TRAFFIC hours (next day):
- [ ] E.5: Create idx_property_leads_email
- [ ] E.6: Create idx_property_leads_phone
- [ ] E.7: Create idx_property_views_user_created
- [ ] E.8: Create idx_contact_clicks_type_created
- [ ] E.9: Create idx_property_leads_source_created
- [ ] E.10: Create idx_advertising_inquiries_email
- [ ] Verify: Run performance tests (Section G.3)

📋 PHASE 5: SECURITY HARDENING (15 minutes, Low Risk)
Execute during business hours:
- [ ] F.1: List functions without search_path
- [ ] F.3: Fix update_property_leads_updated_at
- [ ] F.4: Fix any other SECURITY DEFINER functions
- [ ] F.5: Verify all functions secured
- [ ] Test: Verify triggers still work

📋 PHASE 6: FINAL VERIFICATION (30 minutes, Safe)
- [ ] G.1: Run all security verification checks
- [ ] G.2: Run performance verification
- [ ] G.3: Test query performance
- [ ] Monitor: Watch Supabase Dashboard for errors
- [ ] Monitor: Check application logs
- [ ] Document: Update this file with actual results

📋 PHASE 7: MONITORING (Ongoing)
First 24 hours after changes:
- [ ] Monitor query performance in Supabase Dashboard
- [ ] Monitor error logs
- [ ] Monitor user complaints/support tickets
- [ ] Track Security Advisor score (should drop from 165 to <10)
- [ ] If issues: Execute rollback scripts (Section H)

WHAT TO DO IN SUPABASE UI:
1. SQL Editor:
   - Copy-paste and run each SQL block
   - Review results before moving to next
   - Save successful queries for documentation

2. Database > Tables:
   - Verify RLS status (should show shield icon)
   - Check table sizes before/after indexes

3. Database > Indexes:
   - Verify new indexes appear
   - Monitor index size growth

4. Database > Query Performance:
   - Watch for slow queries
   - Verify indexes being used

5. Security Advisor:
   - Re-run after each phase
   - Track issue count reduction

EMERGENCY ROLLBACK:
If anything breaks:
1. Check Section H for rollback scripts
2. Drop recently created indexes first
3. Contact Supabase support if needed
4. Document what happened
5. Review plan before retry

CONSTRAINTS VERIFIED:
✅ Public website forms work (anon INSERT on leads/inquiries)
✅ Sensitive data protected (no anon SELECT)
✅ Minimal breaking changes (only revoke unnecessary permissions)
✅ Incremental rollout (7 phases)
✅ Rollback scripts ready (Section H)
*/


-- =====================================================
-- SECTION J: MONITORING QUERIES
-- =====================================================
-- Run these daily for first week after deployment
-- =====================================================

-- Check for new slow queries
SELECT 
  queryid,
  substring(query, 1, 100) as query_snippet,
  calls,
  mean_exec_time::numeric(10,2) as mean_ms,
  total_exec_time::numeric(10,2) as total_ms
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'
  AND mean_exec_time > 100  -- Queries slower than 100ms
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexrelname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC  -- Least used indexes
LIMIT 10;

-- Check table bloat
SELECT 
  schemaname,
  tablename,
  n_dead_tup as dead_tuples,
  round(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_pct,
  last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- Check for permission errors in logs
-- (Run this in Supabase Dashboard > Logs)

-- =====================================================
-- END OF REMEDIATION PLAN
-- =====================================================
-- Questions? Contact DevOps team
-- Issues? Refer to Section H (Rollback)
-- =====================================================
