-- =====================================================
-- Migration: Fix Supabase Signup Failure
-- Fixes RLS policy blocking profile creation during signup
-- =====================================================

-- PROBLEM: 
-- When users sign up via auth.signUp(), the handle_new_user() trigger
-- attempts to INSERT into profiles table. However, the RLS policy
-- "profiles_insert_own" requires an authenticated context with
-- auth.uid() matching the new user's ID. During signup trigger execution,
-- the auth context is not yet fully established, causing INSERT to fail.

-- SOLUTION:
-- Drop the restrictive INSERT policy and create a new policy that allows
-- profile creation during the trigger execution by checking if the
-- inserting user matches the profile ID being created OR if there's
-- no current auth context (which happens during trigger execution).

-- Step 1: Drop existing INSERT policy
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

-- Step 2: Create new INSERT policy that works with triggers
-- This policy allows:
-- 1. Authenticated users to insert their own profile (id = auth.uid())
-- 2. System/trigger to insert profiles when auth.uid() is NULL (during signup trigger)
CREATE POLICY "profiles_insert_system_or_own" ON public.profiles
  FOR INSERT
  WITH CHECK (
    -- Allow if user is inserting their own profile
    id = auth.uid() 
    OR 
    -- Allow if no auth context (trigger execution during signup)
    auth.uid() IS NULL
  );

-- Step 3: Ensure the trigger function is properly configured
-- Re-create the trigger function with proper settings to bypass RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    phone, 
    user_role, 
    company_name, 
    is_active
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'user_role', 'real_estate_advertiser'),
    NEW.raw_user_meta_data->>'company_name',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    user_role = COALESCE(EXCLUDED.user_role, profiles.user_role),
    company_name = COALESCE(EXCLUDED.company_name, profiles.company_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Ensure trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Add helpful comment
COMMENT ON POLICY "profiles_insert_system_or_own" ON public.profiles IS 
  'Allows authenticated users to insert their own profile and allows system triggers to insert profiles during signup when auth.uid() is NULL';

COMMENT ON FUNCTION public.handle_new_user() IS 
  'Trigger function that creates a profile when a new auth user is created. Runs with SECURITY DEFINER to bypass RLS during signup.';
