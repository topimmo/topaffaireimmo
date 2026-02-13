-- =====================================================
-- VALIDATION SCRIPT: Services Module
-- =====================================================
-- Run this script to validate the services module setup
-- =====================================================

-- 1. Check Tables Exist
SELECT 
  table_name,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('service_categories', 'service_subcategories', 'artisan_services', 'requests')
ORDER BY table_name;

-- 2. Check RLS is Enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('service_categories', 'service_subcategories', 'artisan_services', 'requests');

-- 3. Check RPC Functions Exist
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'admin_upsert_service_category',
    'admin_toggle_service_category',
    'admin_reorder_service_categories',
    'admin_upsert_service_subcategory',
    'admin_assign_request',
    'admin_update_request_status',
    'artisan_upsert_service'
  )
ORDER BY routine_name;

-- 4. Check Policies Exist
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('service_categories', 'service_subcategories', 'artisan_services', 'requests')
ORDER BY tablename, policyname;

-- 5. Check Indexes Exist
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('service_categories', 'service_subcategories', 'artisan_services', 'requests')
ORDER BY tablename, indexname;

-- =====================================================
-- Expected Results Summary:
-- =====================================================
-- Tables: 4 tables (service_categories, service_subcategories, artisan_services, requests)
-- RLS: All tables should have rowsecurity = true
-- Functions: 7 RPC functions (all with security_type = DEFINER)
-- Policies: Multiple policies per table for SELECT, INSERT, UPDATE, DELETE
-- Indexes: Multiple indexes for performance
-- =====================================================
