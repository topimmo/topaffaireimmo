-- =====================================================
-- Migration 066: Add UPDATE Policy for Admins Table
-- =====================================================
--
-- OBJECTIVE:
-- Add missing UPDATE policy for admins table
-- Ensure all RLS policies have both USING and WITH CHECK clauses
--
-- =====================================================

-- Add UPDATE policy for admins table (if it doesn't exist)
-- Only admins can update admin records
DROP POLICY IF EXISTS "admins_update_admin_only" ON public.admins;
CREATE POLICY "admins_update_admin_only" ON public.admins
  FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.admins))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

-- Log successful policy creation
DO $$
BEGIN
  RAISE NOTICE '✅ Admins table UPDATE policy created';
END $$;
