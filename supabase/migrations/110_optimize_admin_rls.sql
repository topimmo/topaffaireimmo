-- =====================================================
-- Migration 110: Optimize Admin RLS Performance
-- =====================================================
-- Purpose: Replace inefficient subquery pattern with cached function
-- Problem: auth.uid() IN (SELECT user_id FROM public.admins) runs per-row
-- Solution: Create optimized is_admin() function with caching
-- =====================================================

-- =====================================================
-- 1. CREATE OPTIMIZED ADMIN CHECK FUNCTION
-- =====================================================

-- This function is STABLE (can be cached within a transaction)
-- and avoids per-row subquery execution
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admins 
    WHERE user_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION public.is_admin IS 
  'Performance-optimized admin check. Returns TRUE if current user is admin. 
   Uses STABLE for query caching within transaction.';

-- Grant execute to all authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- =====================================================
-- 2. CREATE ADMIN USER ID GETTER (Optional Helper)
-- =====================================================

-- Helper function to get current admin's user_id
-- Returns NULL if not admin
CREATE OR REPLACE FUNCTION public.current_admin_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id 
  FROM public.admins 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.current_admin_id IS 
  'Returns current user ID if they are an admin, NULL otherwise.
   Performance-optimized with STABLE caching.';

GRANT EXECUTE ON FUNCTION public.current_admin_id() TO authenticated, anon;

-- =====================================================
-- 3. UPDATE REQUESTS TABLE RLS POLICIES
-- =====================================================

-- Drop old admin policy
DROP POLICY IF EXISTS "Admins can manage all requests" ON public.requests;
DROP POLICY IF EXISTS "Admins have full access to requests" ON public.requests;

-- Create optimized admin policy using function
CREATE POLICY "Admins have full access to requests"
  ON public.requests
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- 4. UPDATE REVIEWS TABLE RLS POLICIES
-- =====================================================

-- Drop old admin policy
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;

-- Create optimized admin policy using function
CREATE POLICY "Admins can manage all reviews"
  ON public.reviews
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- 5. UPDATE PLATFORM_SETTINGS TABLE RLS POLICIES
-- =====================================================

-- Drop old admin policies
DROP POLICY IF EXISTS "Admins can update platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Admins can insert platform settings" ON public.platform_settings;

-- Create optimized admin policies using function
CREATE POLICY "Admins can update platform settings"
  ON public.platform_settings
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can insert platform settings"
  ON public.platform_settings
  FOR INSERT
  WITH CHECK (public.is_admin());

-- =====================================================
-- 6. UPDATE ADMIN_AUDIT_LOGS TABLE RLS POLICIES
-- =====================================================

-- Drop old admin policies
DROP POLICY IF EXISTS "admins_can_view_all_audit_logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "admins_can_insert_audit_logs" ON public.admin_audit_logs;

-- Create optimized admin policies using function
CREATE POLICY "admins_can_view_all_audit_logs"
  ON public.admin_audit_logs
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "admins_can_insert_audit_logs"
  ON public.admin_audit_logs
  FOR INSERT
  WITH CHECK (public.is_admin());

-- =====================================================
-- 7. UPDATE ADMIN_NOTIFICATIONS TABLE RLS POLICIES
-- =====================================================

-- Drop old admin policies
DROP POLICY IF EXISTS "admin_select_own_notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "admin_update_own_notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "admin_insert_notifications" ON public.admin_notifications;

-- Create optimized admin policies using function
CREATE POLICY "admin_select_own_notifications"
  ON public.admin_notifications
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "admin_update_own_notifications"
  ON public.admin_notifications
  FOR UPDATE
  USING (
    public.is_admin() 
    AND user_id = auth.uid()
  )
  WITH CHECK (
    public.is_admin() 
    AND user_id = auth.uid()
  );

CREATE POLICY "admin_insert_notifications"
  ON public.admin_notifications
  FOR INSERT
  WITH CHECK (public.is_admin());

-- =====================================================
-- 8. UPDATE ADMINS TABLE RLS POLICIES
-- =====================================================

-- Drop old admin policies
DROP POLICY IF EXISTS "admins_select_admin_only" ON public.admins;
DROP POLICY IF EXISTS "admins_insert_admin_only" ON public.admins;
DROP POLICY IF EXISTS "admins_delete_admin_only" ON public.admins;

-- Create optimized admin policies using function
CREATE POLICY "admins_select_admin_only"
  ON public.admins
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "admins_insert_admin_only"
  ON public.admins
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "admins_delete_admin_only"
  ON public.admins
  FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Test the function works correctly
-- SELECT public.is_admin(); -- Should return TRUE for admins, FALSE for others

-- Check all policies now using the function
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   qual,
--   with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND (qual LIKE '%is_admin%' OR with_check LIKE '%is_admin%')
-- ORDER BY tablename, policyname;

-- Compare query performance before/after
-- BEFORE: SELECT COUNT(*) FROM requests WHERE auth.uid() IN (SELECT user_id FROM admins);
-- AFTER:  SELECT COUNT(*) FROM requests WHERE public.is_admin();

-- =====================================================
-- PERFORMANCE NOTES
-- =====================================================

-- STABLE functions are evaluated once per query, not per row
-- This eliminates the per-row subquery execution overhead
-- Expected performance improvement: 10-100x for queries returning many rows

-- The function uses SECURITY DEFINER to access admins table
-- even if user doesn't have direct SELECT permission on it

-- For best performance, ensure admins table has an index on user_id
-- (already exists as it's the primary key)
