-- =====================================================
-- COMPREHENSIVE PROFILE FIX FOR PRODUCTION ISSUE
-- Resolves: "Erreur de chargement du profil" on mobile/desktop
-- =====================================================
--
-- ISSUE SUMMARY:
-- Users authenticate successfully but profile loading fails with error
-- "Erreur de chargement du profil. Veuillez rafraîchir la page."
--
-- ROOT CAUSES:
-- 1. Missing profiles for some authenticated users
-- 2. RLS policies blocking legitimate profile reads
-- 3. Trigger may not be firing or failing silently
-- 4. Schema fields missing (is_admin, is_verified, is_active)
--
-- SOLUTION:
-- 1. Ensure all required columns exist
-- 2. Recreate trigger with comprehensive error handling
-- 3. Fix RLS policies to allow proper access
-- 4. Backfill missing profiles
-- 5. Add diagnostic tools
-- =====================================================

-- =====================================================
-- STEP 1: Ensure all required columns exist in profiles
-- =====================================================

-- Add is_admin column if missing (required by AuthContext)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added is_admin column to profiles table';
  END IF;
END $$;

-- Add is_verified column if missing (required by AuthContext)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added is_verified column to profiles table';
  END IF;
END $$;

-- Add is_active column if missing (required by AuthContext)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added is_active column to profiles table';
  END IF;
END $$;

-- Add user_role column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'user_role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN user_role TEXT DEFAULT 'real_estate_advertiser'
      CHECK (user_role IN ('admin', 'real_estate_advertiser', 'commercial_advertiser'));
    RAISE NOTICE 'Added user_role column to profiles table';
  END IF;
END $$;

-- Add company_name column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'company_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN company_name TEXT;
    RAISE NOTICE 'Added company_name column to profiles table';
  END IF;
END $$;

-- Ensure created_at and updated_at exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added created_at column to profiles table';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to profiles table';
  END IF;
END $$;

-- =====================================================
-- STEP 2: Drop and recreate trigger with bulletproof logic
-- =====================================================

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create new trigger function with comprehensive error handling
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
  v_is_verified BOOLEAN;
BEGIN
  -- Log trigger execution (will appear in Postgres logs)
  RAISE LOG 'Profile creation trigger fired for user ID: %, email: %', NEW.id, NEW.email;
  
  -- Extract metadata with safe defaults
  v_user_role := COALESCE(NEW.raw_user_meta_data->>'user_role', 'real_estate_advertiser');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_company_name := NEW.raw_user_meta_data->>'company_name';
  v_is_verified := (NEW.email_confirmed_at IS NOT NULL);
  
  RAISE LOG 'Metadata extracted - Role: %, Name: %, Verified: %', v_user_role, v_full_name, v_is_verified;
  
  -- Insert profile with ON CONFLICT to handle race conditions
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    user_role,
    company_name,
    is_admin,
    is_active,
    is_verified,
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
    false,  -- Never auto-grant admin
    true,   -- Active by default
    v_is_verified,
    COALESCE(NEW.created_at, NOW()),
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
    -- Log the error but DO NOT fail the auth user creation
    RAISE WARNING 'Profile creation failed for user % (%). Error: % (%)', 
      NEW.id, NEW.email, SQLERRM, SQLSTATE;
    
    -- Attempt minimal fallback insert
    BEGIN
      INSERT INTO public.profiles (id, email, is_active)
      VALUES (NEW.id, NEW.email, true)
      ON CONFLICT (id) DO NOTHING;
      
      RAISE LOG 'Created minimal fallback profile for user ID: %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Even minimal profile creation failed for user %: %', NEW.id, SQLERRM;
    END;
    
    -- Always return NEW to allow user creation even if profile fails
    RETURN NEW;
END;
$$;

-- Add function documentation
COMMENT ON FUNCTION public.handle_new_user() IS 
  'Auto-creates user profile when new auth user is created. 
   Runs with SECURITY DEFINER to bypass RLS.
   Updated: 2026-01-26 - Comprehensive fix for production profile loading issue.';

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 
  'Creates profile in public.profiles for every new auth user';

-- =====================================================
-- STEP 3: Fix RLS policies for profiles table
-- =====================================================

-- Enable RLS (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing profile policies to start fresh
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_system_or_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Policy 1: SELECT - Users can read their own profile, admins can read all
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND (is_admin = true OR user_role = 'admin')
    )
  );

COMMENT ON POLICY "profiles_select_policy" ON public.profiles IS
  'Authenticated users can view their own profile. Admins can view all profiles.';

-- Policy 2: UPDATE - Users can update their own profile only
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

COMMENT ON POLICY "profiles_update_policy" ON public.profiles IS
  'Users can only update their own profile (cannot change ID).';

-- Policy 3: INSERT - Users can insert their own profile
-- NOTE: The trigger bypasses RLS with SECURITY DEFINER, but this policy
-- allows manual profile creation or fixes from the application
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

COMMENT ON POLICY "profiles_insert_policy" ON public.profiles IS
  'Users can insert their own profile. Trigger uses SECURITY DEFINER and bypasses this.';

-- =====================================================
-- STEP 4: Grant necessary permissions
-- =====================================================

-- Ensure authenticated users have proper access to profiles table
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- =====================================================
-- STEP 5: Backfill missing profiles for existing users
-- =====================================================

DO $$
DECLARE
  v_user RECORD;
  v_count INTEGER := 0;
  v_failed INTEGER := 0;
BEGIN
  RAISE LOG '========================================';
  RAISE LOG 'Starting profile backfill...';
  RAISE LOG '========================================';
  
  -- Find all auth users without profiles
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
      -- Insert missing profile
      INSERT INTO public.profiles (
        id,
        email,
        full_name,
        phone,
        user_role,
        company_name,
        is_admin,
        is_active,
        is_verified,
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
        false,
        true,
        (v_user.email_confirmed_at IS NOT NULL),
        v_user.created_at,
        NOW()
      );
      
      v_count := v_count + 1;
      RAISE LOG 'Created profile for user: % (ID: %)', v_user.email, v_user.id;
      
    EXCEPTION
      WHEN OTHERS THEN
        v_failed := v_failed + 1;
        RAISE WARNING 'Failed to create profile for user % (ID: %): %', 
          v_user.email, v_user.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE LOG '========================================';
  RAISE LOG 'Profile backfill complete!';
  RAISE LOG 'Successfully created: % profiles', v_count;
  RAISE LOG 'Failed: % profiles', v_failed;
  RAISE LOG '========================================';
END;
$$;

-- =====================================================
-- STEP 6: Add helpful indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON public.profiles(user_role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- =====================================================
-- STEP 7: Add diagnostic function for troubleshooting
-- =====================================================

CREATE OR REPLACE FUNCTION public.diagnose_profile_sync()
RETURNS TABLE (
  metric TEXT,
  count BIGINT,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Total Auth Users'::TEXT,
    COUNT(*)::BIGINT,
    'Users in auth.users table'::TEXT
  FROM auth.users
  
  UNION ALL
  
  SELECT 
    'Total Profiles'::TEXT,
    COUNT(*)::BIGINT,
    'Profiles in public.profiles table'::TEXT
  FROM public.profiles
  
  UNION ALL
  
  SELECT 
    'Missing Profiles'::TEXT,
    COUNT(*)::BIGINT,
    'Auth users without a profile (CRITICAL - should be 0)'::TEXT
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL
  
  UNION ALL
  
  SELECT 
    'Orphaned Profiles'::TEXT,
    COUNT(*)::BIGINT,
    'Profiles without an auth user (cleanup may be needed)'::TEXT
  FROM public.profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  WHERE au.id IS NULL
  
  UNION ALL
  
  SELECT 
    'Active Profiles'::TEXT,
    COUNT(*)::BIGINT,
    'Profiles with is_active = true'::TEXT
  FROM public.profiles
  WHERE is_active = true
  
  UNION ALL
  
  SELECT 
    'Admin Users'::TEXT,
    COUNT(*)::BIGINT,
    'Profiles with admin privileges'::TEXT
  FROM public.profiles
  WHERE is_admin = true OR user_role = 'admin'
  
  UNION ALL
  
  SELECT 
    'Verified Users'::TEXT,
    COUNT(*)::BIGINT,
    'Profiles with email verified'::TEXT
  FROM public.profiles
  WHERE is_verified = true;
END;
$$;

COMMENT ON FUNCTION public.diagnose_profile_sync() IS
  'Diagnostic function to check auth.users ↔ profiles sync status and health.
   Run: SELECT * FROM diagnose_profile_sync();
   CRITICAL: missing_profiles should always be 0 in production.';

-- =====================================================
-- STEP 8: Verification
-- =====================================================

-- Run diagnostic check and display results
DO $$
DECLARE
  v_result RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PROFILE SYNC DIAGNOSTIC REPORT';
  RAISE NOTICE '========================================';
  
  FOR v_result IN SELECT * FROM public.diagnose_profile_sync()
  LOOP
    RAISE NOTICE '% : % - %', 
      RPAD(v_result.metric, 20), 
      LPAD(v_result.count::TEXT, 5), 
      v_result.details;
  END LOOP;
  
  RAISE NOTICE '========================================';
END;
$$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- VERIFICATION STEPS:
-- 1. Run: SELECT * FROM diagnose_profile_sync();
--    Expected: missing_profiles = 0
--
-- 2. Test new user signup:
--    - Sign up a new user
--    - Check that profile is created immediately
--    - Verify profile can be read after login
--
-- 3. Test existing user login:
--    - Login with existing account
--    - Verify profile loads without error
--    - Check on both mobile and desktop
--
-- 4. Check Postgres logs for trigger execution:
--    - Look for "Profile creation trigger fired for user ID"
--    - Verify no errors or warnings
--
-- 5. Test RLS policies:
--    - As regular user, verify can read own profile
--    - As regular user, verify cannot read other profiles
--    - As admin, verify can read all profiles
