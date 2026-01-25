-- =====================================================
-- COMPREHENSIVE FIX: User Profile Creation on Signup
-- Resolves: Users not appearing in Admin Dashboard & unable to publish listings
-- =====================================================
-- 
-- ISSUE: Users successfully sign up in auth.users but:
--   1. No profile created in public.profiles
--   2. Cannot upload images or create listings (blocked by profile check)
--   3. Don't appear in Admin Dashboard (reads from public.profiles)
--
-- ROOT CAUSES ADDRESSED:
--   1. Trigger not executing or failing silently
--   2. RLS policies blocking trigger execution
--   3. Missing error handling and logging
--   4. Race conditions during profile creation
--
-- SOLUTION:
--   1. Recreate trigger with comprehensive error handling
--   2. Ensure SECURITY DEFINER bypasses RLS
--   3. Add proper logging for debugging
--   4. Handle all edge cases and conflicts
-- =====================================================

-- ============================================
-- STEP 1: Drop and recreate trigger function
-- ============================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create robust trigger function with comprehensive error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role TEXT;
  v_full_name TEXT;
  v_phone TEXT;
  v_company_name TEXT;
BEGIN
  -- Log trigger execution for debugging
  RAISE LOG 'handle_new_user triggered for user ID: %', NEW.id;
  
  -- Extract metadata with safe defaults
  v_user_role := COALESCE(NEW.raw_user_meta_data->>'user_role', 'real_estate_advertiser');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_company_name := NEW.raw_user_meta_data->>'company_name';
  
  RAISE LOG 'Extracted metadata - Role: %', v_user_role;
  
  -- Insert profile with conflict handling
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    user_role,
    company_name,
    is_active,
    is_verified,
    is_admin,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_phone,
    v_user_role,
    v_company_name,
    true,  -- Active by default
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,  -- Verified if email confirmed
    false, -- Not admin by default
    NEW.created_at,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE 
      WHEN EXCLUDED.full_name != '' THEN EXCLUDED.full_name 
      ELSE profiles.full_name 
    END,
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    user_role = COALESCE(EXCLUDED.user_role, profiles.user_role),
    company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
    is_verified = EXCLUDED.is_verified,
    updated_at = NOW();
  
  RAISE LOG 'Profile created/updated successfully for user ID: %', NEW.id;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE WARNING 'Failed to create profile for user %: % - %', 
      NEW.id, SQLERRM, SQLSTATE;
    
    -- Attempt to insert a minimal profile as fallback
    BEGIN
      INSERT INTO public.profiles (id, email, is_active)
      VALUES (NEW.id, NEW.email, true)
      ON CONFLICT (id) DO NOTHING;
      
      RAISE LOG 'Minimal profile created for user ID: % as fallback', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to create minimal profile for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW; -- Always return NEW to allow auth user creation
END;
$$;

-- Add function documentation
COMMENT ON FUNCTION public.handle_new_user() IS 
  'Automatically creates a user profile in public.profiles when a new auth user is created. 
   Runs with SECURITY DEFINER to bypass RLS. Includes comprehensive error handling and logging.
   Created: 2026-01-25 to fix user signup issue where profiles were not being created.';

-- ============================================
-- STEP 2: Recreate trigger on auth.users
-- ============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 
  'Creates a profile in public.profiles for every new auth user';

-- ============================================
-- STEP 3: Fix RLS policies for profiles table
-- ============================================

-- Enable RLS (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing INSERT policies to avoid conflicts
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_system_or_own" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create new INSERT policy that works with SECURITY DEFINER trigger
-- The trigger bypasses RLS, but we need a policy for direct inserts
CREATE POLICY "profiles_insert_authenticated" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid() OR
    -- Allow if no auth context (should not happen, but safety fallback)
    auth.uid() IS NULL
  );

COMMENT ON POLICY "profiles_insert_authenticated" ON public.profiles IS
  'Allows authenticated users to insert their own profile. 
   Trigger uses SECURITY DEFINER and bypasses RLS entirely.';

-- Ensure SELECT policy exists for users to read their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

COMMENT ON POLICY "profiles_select_own" ON public.profiles IS
  'Users can view their own profile. Admins can view all profiles.';

-- Ensure UPDATE policy exists
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

COMMENT ON POLICY "profiles_update_own" ON public.profiles IS
  'Users can only update their own profile';

-- ============================================
-- STEP 4: Grant necessary permissions
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- ============================================
-- STEP 5: Backfill missing profiles
-- ============================================
-- For any existing auth users without profiles, create them now

DO $$
DECLARE
  v_user RECORD;
  v_count INTEGER := 0;
BEGIN
  RAISE LOG 'Starting profile backfill for existing auth users...';
  
  FOR v_user IN 
    SELECT 
      au.id,
      au.email,
      au.created_at,
      au.email_confirmed_at,
      au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL
  LOOP
    BEGIN
      INSERT INTO public.profiles (
        id,
        email,
        full_name,
        phone,
        user_role,
        company_name,
        is_active,
        is_verified,
        is_admin,
        created_at,
        updated_at
      )
      VALUES (
        v_user.id,
        v_user.email,
        COALESCE(v_user.raw_user_meta_data->>'full_name', ''),
        v_user.raw_user_meta_data->>'phone',
        COALESCE(v_user.raw_user_meta_data->>'user_role', 'real_estate_advertiser'),
        v_user.raw_user_meta_data->>'company_name',
        true,
        CASE WHEN v_user.email_confirmed_at IS NOT NULL THEN true ELSE false END,
        false,
        v_user.created_at,
        NOW()
      );
      
      v_count := v_count + 1;
      RAISE LOG 'Created profile for existing user ID: %', v_user.id;
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to backfill profile for user %: %', 
          v_user.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE LOG 'Profile backfill completed. Created % profiles.', v_count;
END;
$$;

-- ============================================
-- STEP 6: Add helpful indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON public.profiles(user_role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- ============================================
-- VERIFICATION & DIAGNOSTICS
-- ============================================

-- Add a helper function to check profile sync status
CREATE OR REPLACE FUNCTION public.check_profile_sync_status()
RETURNS TABLE (
  total_auth_users BIGINT,
  total_profiles BIGINT,
  missing_profiles BIGINT,
  orphaned_profiles BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM public.profiles) as total_profiles,
    (SELECT COUNT(*) FROM auth.users au 
     LEFT JOIN public.profiles p ON au.id = p.id 
     WHERE p.id IS NULL) as missing_profiles,
    (SELECT COUNT(*) FROM public.profiles p 
     LEFT JOIN auth.users au ON p.id = au.id 
     WHERE au.id IS NULL) as orphaned_profiles;
END;
$$;

COMMENT ON FUNCTION public.check_profile_sync_status() IS
  'Diagnostic function to check sync status between auth.users and public.profiles';

-- ============================================
-- FINAL NOTES
-- ============================================

-- Run this query to verify the fix:
-- SELECT * FROM public.check_profile_sync_status();
-- 
-- Expected result after fix:
--   missing_profiles = 0
--   orphaned_profiles = 0 (or small number if profiles were manually created)
--
-- To test trigger is working:
-- 1. Sign up a new user via the app
-- 2. Check if profile appears in public.profiles
-- 3. Check Postgres logs for "handle_new_user triggered" messages
--
-- To view trigger logs in Supabase:
-- Go to Database → Logs → Postgres Logs
