-- =====================================================
-- Migration: Fix Profile Trigger RLS Issue
-- Issue: Database error during signup due to RLS blocking trigger
-- Solution: Ensure trigger bypasses RLS and has proper fallbacks
-- =====================================================

-- 1. Drop existing trigger and function to recreate cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Recreate the trigger function with proper error handling
-- SECURITY DEFINER ensures it runs with owner privileges, bypassing RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert new profile with ON CONFLICT to handle edge cases
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    phone, 
    user_role,
    company_name,
    is_admin,
    is_active,
    is_verified
  )
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'user_role', 'real_estate_advertiser'),
    NEW.raw_user_meta_data->>'company_name',
    false,
    true,
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    user_role = COALESCE(EXCLUDED.user_role, public.profiles.user_role),
    company_name = COALESCE(EXCLUDED.company_name, public.profiles.company_name);
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 
  'Automatically creates a profile when a new user signs up. Runs with SECURITY DEFINER to bypass RLS.';

-- 4. Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Ensure proper RLS policies exist for profiles
-- Drop all existing profile policies to avoid conflicts
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 6. Enable RLS (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 7. Create clean, simple policies
-- Users can view their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT 
  TO authenticated
  USING (
    id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE 
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users can insert their own profile (for manual inserts, not used by trigger)
-- Note: The trigger uses SECURITY DEFINER and bypasses RLS
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (id = auth.uid());

-- 8. Grant necessary permissions
-- These ensure the trigger and policies work correctly
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- 9. Verify the function has correct ownership
-- The function should be owned by postgres or a superuser
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

COMMENT ON POLICY "profiles_select_own" ON public.profiles IS 
  'Users can view their own profile and admins can view all profiles';
COMMENT ON POLICY "profiles_update_own" ON public.profiles IS 
  'Users can only update their own profile';
COMMENT ON POLICY "profiles_insert_own" ON public.profiles IS 
  'Users can insert their own profile (trigger uses SECURITY DEFINER to bypass this)';
