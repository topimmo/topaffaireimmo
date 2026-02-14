-- =====================================================
-- Migration 111: Complete Admin RLS Optimization - All Tables
-- =====================================================
-- Purpose: Replace ALL remaining subquery patterns with is_admin() function
-- This completes the optimization started in migration 110
-- =====================================================

-- =====================================================
-- PROPERTIES TABLE
-- =====================================================

DROP POLICY IF EXISTS "admin_full_access" ON public.properties;
DROP POLICY IF EXISTS "properties_admin_full_access" ON public.properties;

CREATE POLICY "properties_admin_full_access"
  ON public.properties
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- PROFILES TABLE  
-- =====================================================

DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;

CREATE POLICY "profiles_admin_all"
  ON public.profiles
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- SITE_PAGES TABLE
-- =====================================================

DROP POLICY IF EXISTS "site_pages_select_all" ON public.site_pages;
DROP POLICY IF EXISTS "site_pages_insert_admin" ON public.site_pages;
DROP POLICY IF EXISTS "site_pages_update_admin" ON public.site_pages;
DROP POLICY IF EXISTS "site_pages_delete_admin" ON public.site_pages;

CREATE POLICY "site_pages_insert_admin"
  ON public.site_pages
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "site_pages_update_admin"
  ON public.site_pages
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "site_pages_delete_admin"
  ON public.site_pages
  FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- SITE_CATEGORIES TABLE
-- =====================================================

DROP POLICY IF EXISTS "site_categories_select_all" ON public.site_categories;
DROP POLICY IF EXISTS "site_categories_insert_admin" ON public.site_categories;
DROP POLICY IF EXISTS "site_categories_update_admin" ON public.site_categories;
DROP POLICY IF EXISTS "site_categories_delete_admin" ON public.site_categories;

CREATE POLICY "site_categories_insert_admin"
  ON public.site_categories
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "site_categories_update_admin"
  ON public.site_categories
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "site_categories_delete_admin"
  ON public.site_categories
  FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- ADVERTISING_INQUIRIES TABLE
-- =====================================================

DROP POLICY IF EXISTS "advertising_inquiries_select_admin" ON public.advertising_inquiries;
DROP POLICY IF EXISTS "advertising_inquiries_update_admin" ON public.advertising_inquiries;
DROP POLICY IF EXISTS "advertising_inquiries_delete_admin" ON public.advertising_inquiries;

CREATE POLICY "advertising_inquiries_select_admin"
  ON public.advertising_inquiries
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "advertising_inquiries_update_admin"
  ON public.advertising_inquiries
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "advertising_inquiries_delete_admin"
  ON public.advertising_inquiries
  FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- PROPERTY_STATUS_WORKFLOW TABLE
-- =====================================================

DROP POLICY IF EXISTS "property_status_workflow_admin_all" ON public.property_status_workflow;

CREATE POLICY "property_status_workflow_admin_all"
  ON public.property_status_workflow
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- PROMO_BANNERS TABLE
-- =====================================================

DROP POLICY IF EXISTS "promo_banners_admin_full" ON public.promo_banners;

CREATE POLICY "promo_banners_admin_full"
  ON public.promo_banners
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- ARTISAN_PROFILES TABLE
-- =====================================================

DROP POLICY IF EXISTS "artisan_profiles_admin_all" ON public.artisan_profiles;

CREATE POLICY "artisan_profiles_admin_all"
  ON public.artisan_profiles
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- SERVICE_CATEGORIES TABLE
-- =====================================================

DROP POLICY IF EXISTS "service_categories_admin_all" ON public.service_categories;

CREATE POLICY "service_categories_admin_all"
  ON public.service_categories
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- SERVICE_SUBCATEGORIES TABLE
-- =====================================================

DROP POLICY IF EXISTS "service_subcategories_admin_all" ON public.service_subcategories;

CREATE POLICY "service_subcategories_admin_all"
  ON public.service_subcategories
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- ARTISAN_SERVICES TABLE
-- =====================================================

DROP POLICY IF EXISTS "artisan_services_admin_all" ON public.artisan_services;

CREATE POLICY "artisan_services_admin_all"
  ON public.artisan_services
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- REQUEST_STATUS_HISTORY TABLE
-- =====================================================

DROP POLICY IF EXISTS "request_status_history_admin_all" ON public.request_status_history;

CREATE POLICY "request_status_history_admin_all"
  ON public.request_status_history
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- MEDIA TABLE
-- =====================================================

DROP POLICY IF EXISTS "media_admin_all" ON public.media;

CREATE POLICY "media_admin_all"
  ON public.media
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- PHONE_REVEAL_LOGS TABLE
-- =====================================================

DROP POLICY IF EXISTS "phone_reveal_logs_admin_all" ON public.phone_reveal_logs;

CREATE POLICY "phone_reveal_logs_admin_all"
  ON public.phone_reveal_logs
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- List all policies using is_admin() function
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   cmd,
--   qual,
--   with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND (
--     qual LIKE '%is_admin()%' 
--     OR with_check LIKE '%is_admin()%'
--   )
-- ORDER BY tablename, policyname;

-- Check for any remaining subquery patterns (should return 0 rows from new policies)
-- SELECT 
--   schemaname,
--   tablename,
--   policyname
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND (
--     qual LIKE '%IN (SELECT user_id FROM public.admins)%'
--     OR with_check LIKE '%IN (SELECT user_id FROM public.admins)%'
--   )
-- ORDER BY tablename, policyname;
