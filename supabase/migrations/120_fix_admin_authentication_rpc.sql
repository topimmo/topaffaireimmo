-- =====================================================
-- Migration 120: Fix Admin Authentication System
-- =====================================================
-- Purpose: Use public.admins as single source of truth
-- - Add is_active column to admins table
-- - Update is_admin() RPC to check is_active status
-- - Ensure frontend can use RPC for admin checks
-- =====================================================

-- =====================================================
-- STEP 1: Add is_active column to admins table
-- =====================================================

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'admins' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.admins 
      ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL;
    
    RAISE NOTICE '✓ Added is_active column to admins table';
  ELSE
    RAISE NOTICE 'ℹ is_active column already exists';
  END IF;
END $$;

-- Add role column to admins table for consistency
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'admins' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.admins 
      ADD COLUMN role TEXT DEFAULT 'admin' NOT NULL
      CHECK (role IN ('admin', 'super_admin'));
    
    RAISE NOTICE '✓ Added role column to admins table';
  ELSE
    RAISE NOTICE 'ℹ role column already exists';
  END IF;
END $$;

-- Create index on is_active for performance
CREATE INDEX IF NOT EXISTS idx_admins_is_active 
  ON public.admins(is_active) 
  WHERE is_active = TRUE;

-- =====================================================
-- STEP 2: Update is_admin() RPC Function
-- =====================================================

-- Drop old version if exists
DROP FUNCTION IF EXISTS public.is_admin();

-- Create new version that checks both membership AND is_active
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
      AND is_active = TRUE
  );
$$;

COMMENT ON FUNCTION public.is_admin IS 
  'Returns TRUE if current user is an active admin in public.admins table.
   This is the SINGLE SOURCE OF TRUTH for admin status.
   Uses STABLE for query caching within transaction.';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Grant execute to anon users (for public routes that need to check)
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- =====================================================
-- STEP 3: Create Helper RPC for Frontend Use
-- =====================================================

-- Create a wrapper function specifically for frontend use
-- This ensures consistent admin checking across the application
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS TABLE(is_admin BOOLEAN)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin();
$$;

COMMENT ON FUNCTION public.check_is_admin IS 
  'Frontend-friendly wrapper for is_admin().
   Returns a table with single boolean column for easy destructuring.
   Usage: const { data } = await supabase.rpc("check_is_admin");';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_admin() TO anon;

-- =====================================================
-- STEP 4: Update existing admins to have is_active = true
-- =====================================================

-- Ensure all existing admins have is_active set to true
UPDATE public.admins 
SET is_active = TRUE 
WHERE is_active IS NULL OR is_active = FALSE;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify column was added
DO $$
DECLARE
  has_is_active BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'admins' 
    AND column_name = 'is_active'
  ) INTO has_is_active;
  
  IF has_is_active THEN
    RAISE NOTICE '✓ Verified: is_active column exists in admins table';
  ELSE
    RAISE WARNING '✗ Failed: is_active column missing';
  END IF;
END $$;

-- List all active admins
SELECT 
  '=== ACTIVE ADMINS ===' as status,
  u.id,
  u.email,
  a.role,
  a.is_active,
  a.created_at
FROM public.admins a
JOIN auth.users u ON a.user_id = u.id
WHERE a.is_active = TRUE
ORDER BY a.created_at;

-- Test the RPC function (should work in SQL console)
-- SELECT public.is_admin();
-- SELECT * FROM public.check_is_admin();

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================

/*
After this migration:

1. Admin status is determined ONLY by:
   - Presence in public.admins table
   - is_active = TRUE

2. Frontend should use:
   const { data: isAdmin } = await supabase.rpc('check_is_admin');
   OR
   const { data } = await supabase.rpc('is_admin');

3. RLS policies already use public.is_admin() function

4. To grant admin access:
   INSERT INTO public.admins (user_id, is_active, role)
   VALUES ('user-uuid-here', TRUE, 'admin');

5. To revoke admin access:
   UPDATE public.admins SET is_active = FALSE WHERE user_id = 'user-uuid';
   OR
   DELETE FROM public.admins WHERE user_id = 'user-uuid';

6. profiles.user_role is now DEPRECATED for admin checks
   - Keep for backward compatibility but not used for admin auth
   - Admin status comes ONLY from public.admins table
*/

-- =====================================================
-- END OF MIGRATION
-- =====================================================
