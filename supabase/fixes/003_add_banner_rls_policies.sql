-- =====================================================
-- FIX 003: Add RLS Policies for Banner Tables
-- =====================================================
-- 
-- PROBLEM: banner_slots and banner_requests tables
-- have no RLS policies, allowing unrestricted access
--
-- IMPACT: Security issue - any user can modify banner data
--
-- SOLUTION: Add comprehensive RLS policies
-- =====================================================

-- =====================================================
-- STEP 1: Banner Slots Policies
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE public.banner_slots ENABLE ROW LEVEL SECURITY;

-- Public can read active banner slots
DROP POLICY IF EXISTS "banner_slots_select_public" ON public.banner_slots;
CREATE POLICY "banner_slots_select_public" ON public.banner_slots
  FOR SELECT USING (is_active = true);

-- Only admins can insert banner slots
DROP POLICY IF EXISTS "banner_slots_insert_admin" ON public.banner_slots;
CREATE POLICY "banner_slots_insert_admin" ON public.banner_slots
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Only admins can update banner slots
DROP POLICY IF EXISTS "banner_slots_update_admin" ON public.banner_slots;
CREATE POLICY "banner_slots_update_admin" ON public.banner_slots
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Only admins can delete banner slots
DROP POLICY IF EXISTS "banner_slots_delete_admin" ON public.banner_slots;
CREATE POLICY "banner_slots_delete_admin" ON public.banner_slots
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- =====================================================
-- STEP 2: Banner Requests Policies
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE public.banner_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own banner requests
DROP POLICY IF EXISTS "banner_requests_insert_own" ON public.banner_requests;
CREATE POLICY "banner_requests_insert_own" ON public.banner_requests
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    advertiser_id = auth.uid()
  );

-- Users can view their own banner requests
DROP POLICY IF EXISTS "banner_requests_select_own" ON public.banner_requests;
CREATE POLICY "banner_requests_select_own" ON public.banner_requests
  FOR SELECT USING (
    advertiser_id = auth.uid()
  );

-- Admins can view all banner requests
DROP POLICY IF EXISTS "banner_requests_select_admin" ON public.banner_requests;
CREATE POLICY "banner_requests_select_admin" ON public.banner_requests
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Users can update their own PENDING requests only
DROP POLICY IF EXISTS "banner_requests_update_own" ON public.banner_requests;
CREATE POLICY "banner_requests_update_own" ON public.banner_requests
  FOR UPDATE 
  USING (advertiser_id = auth.uid() AND status = 'pending')
  WITH CHECK (advertiser_id = auth.uid() AND status = 'pending');

-- Admins can update any banner request (status changes)
DROP POLICY IF EXISTS "banner_requests_update_admin" ON public.banner_requests;
CREATE POLICY "banner_requests_update_admin" ON public.banner_requests
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Users can delete their own PENDING requests
DROP POLICY IF EXISTS "banner_requests_delete_own" ON public.banner_requests;
CREATE POLICY "banner_requests_delete_own" ON public.banner_requests
  FOR DELETE USING (
    advertiser_id = auth.uid() AND status = 'pending'
  );

-- Admins can delete any banner request
DROP POLICY IF EXISTS "banner_requests_delete_admin" ON public.banner_requests;
CREATE POLICY "banner_requests_delete_admin" ON public.banner_requests
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('banner_slots', 'banner_requests');

-- Check all policies created
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('banner_slots', 'banner_requests')
ORDER BY tablename, policyname;

-- Expected:
-- banner_slots: 4 policies (select_public, insert/update/delete_admin)
-- banner_requests: 7 policies (select_own, select_admin, insert_own, update_own, update_admin, delete_own, delete_admin)

-- =====================================================
-- END OF FIX 003
-- =====================================================
