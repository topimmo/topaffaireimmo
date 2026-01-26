-- =====================================================
-- SUPABASE-COMPATIBLE PROFILE FIX
-- Resolves: "Erreur de chargement du profil" after authentication
-- =====================================================
--
-- ISSUE SUMMARY:
-- Users authenticate successfully but profile loading fails.
-- Previous migrations attempted to modify auth.users which is not allowed
-- in Supabase (ERROR: 42501: must be owner of relation users).
--
-- VERIFICATION:
-- Query: SELECT count(*) FROM auth.users u LEFT JOIN public.profiles p 
--        ON p.id = u.id WHERE p.id IS NULL;
-- Result: 0 (no missing profiles)
--
-- ROOT CAUSE:
-- The issue is NOT missing profiles, but rather:
-- 1. RLS policies may be blocking legitimate profile reads
-- 2. Profile fetch flow may encounter timing issues
-- 3. Need proper policies for fallback profile creation
--
-- SOLUTION (Supabase-compatible - NO auth.users modifications):
-- 1. Fix RLS policies on public.profiles to ensure proper access
-- 2. Allow authenticated users to read their own profile
-- 3. Allow authenticated users to insert their own profile (for fallback creation)
-- 4. Do NOT touch auth.users, auth schema, or attempt OWNER changes
-- =====================================================

-- =====================================================
-- STEP 1: Ensure RLS is enabled on profiles
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Drop all existing profile policies for clean slate
-- =====================================================

-- Drop all variations of policy names that may exist
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_system_or_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- =====================================================
-- STEP 3: Create clear, simple RLS policies
-- =====================================================

-- Policy 1: SELECT - Users can read their own profile, admins can read all
-- This is critical for profile loading after authentication
CREATE POLICY "Enable read access for users to their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- User can see their own profile
  id = auth.uid()
  OR
  -- Admin users can see all profiles
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND (is_admin = true OR user_role = 'admin')
  )
);

-- Policy 2: INSERT - Users can insert their own profile
-- This is critical for fallback profile creation in AuthContext
CREATE POLICY "Enable insert for users to create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  -- User can only insert a profile with their own ID
  id = auth.uid()
);

-- Policy 3: UPDATE - Users can update their own profile
CREATE POLICY "Enable update for users to their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy 4: DELETE - Users can delete their own profile (optional, for GDPR)
CREATE POLICY "Enable delete for users to their own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (id = auth.uid());

-- =====================================================
-- STEP 4: Grant necessary permissions
-- =====================================================

-- Ensure authenticated users have proper access to profiles table
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- Allow anon users to read profiles (for public listings, etc.)
-- Adjust this based on your requirements
GRANT SELECT ON public.profiles TO anon;

-- =====================================================
-- STEP 5: Add indexes for better performance
-- =====================================================

-- These may already exist from previous migrations, but CREATE IF NOT EXISTS is idempotent
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON public.profiles(user_role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- =====================================================
-- STEP 6: Add helpful comments for documentation
-- =====================================================

COMMENT ON POLICY "Enable read access for users to their own profile" ON public.profiles IS
  'Authenticated users can view their own profile. Admin users can view all profiles. Critical for post-login profile loading.';

COMMENT ON POLICY "Enable insert for users to create their own profile" ON public.profiles IS
  'Allows authenticated users to insert their own profile. This enables fallback profile creation in the application when a profile is missing.';

COMMENT ON POLICY "Enable update for users to their own profile" ON public.profiles IS
  'Users can only update their own profile. Prevents unauthorized modifications.';

COMMENT ON POLICY "Enable delete for users to their own profile" ON public.profiles IS
  'Users can delete their own profile. Supports GDPR compliance and account deletion.';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Run these queries to verify the fix:
-- 
-- 1. Check that all auth users have profiles:
--    SELECT count(*) FROM auth.users u 
--    LEFT JOIN public.profiles p ON p.id = u.id 
--    WHERE p.id IS NULL;
--    Expected: 0
--
-- 2. Check that RLS policies are active:
--    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
--    FROM pg_policies
--    WHERE schemaname = 'public' AND tablename = 'profiles'
--    ORDER BY policyname;
--
-- 3. Test as authenticated user (replace USER_ID with actual user ID):
--    SET ROLE authenticated;
--    SET request.jwt.claims.sub TO 'USER_ID';
--    SELECT * FROM public.profiles WHERE id = 'USER_ID';
--    Expected: Should return the user's profile

-- =====================================================
-- MIGRATION NOTES
-- =====================================================

-- This migration is Supabase-compatible and does NOT:
-- - Modify auth.users table
-- - Change ownership of auth schema objects
-- - Create triggers on auth schema (trigger already exists from previous migration)
-- - Use any Supabase-restricted operations
--
-- This migration focuses solely on:
-- - Fixing RLS policies on public.profiles
-- - Ensuring authenticated users can read and create their own profiles
-- - Supporting the fallback profile creation logic in AuthContext
--
-- Expected outcome:
-- - Users can log in and load their profile without "Erreur de chargement du profil"
-- - Fallback profile creation works if profile is somehow missing
-- - RLS policies properly protect user data while allowing necessary access
