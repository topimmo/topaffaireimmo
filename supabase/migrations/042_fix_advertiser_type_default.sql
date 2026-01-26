-- =====================================================
-- FIX ADVERTISER_TYPE DEFAULT AND PROFILE CREATION
-- Ensures all profiles have a valid advertiser_type
-- =====================================================
-- 
-- ISSUE: 
-- Users may have NULL advertiser_type, blocking storage uploads.
-- Error: "You don't have permission to upload images. You must be an annonceur immobilier."
--
-- SOLUTION:
-- 1. Set default advertiser_type to 'owner' for all real_estate_advertiser users
-- 2. Update existing NULL advertiser_type to 'owner'
-- 3. Ensure profile trigger sets advertiser_type on creation
-- =====================================================

-- =====================================================
-- STEP 1: Update existing profiles with NULL advertiser_type
-- =====================================================

-- For real_estate_advertiser users, set advertiser_type to 'owner' if NULL
UPDATE public.profiles
SET advertiser_type = 'owner'
WHERE user_role = 'real_estate_advertiser'
  AND advertiser_type IS NULL;

-- For commercial_advertiser and admin users, set to NULL (they don't use advertiser_type)
UPDATE public.profiles
SET advertiser_type = NULL
WHERE user_role IN ('commercial_advertiser', 'admin')
  AND advertiser_type IS NOT NULL;

-- =====================================================
-- STEP 2: Add constraint to ensure advertiser_type is set for real_estate_advertisers
-- =====================================================

-- Drop existing constraint if it exists
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_advertiser_type_check;

-- Add new check constraint
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_advertiser_type_check CHECK (
  -- advertiser_type is only for real_estate_advertisers
  (user_role = 'real_estate_advertiser' AND advertiser_type IN ('owner', 'broker', 'agency'))
  OR
  -- Other roles should have NULL advertiser_type
  (user_role IN ('commercial_advertiser', 'admin') AND advertiser_type IS NULL)
);

-- =====================================================
-- STEP 3: Update or recreate the profile creation trigger
-- =====================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create improved profile creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_role_value TEXT;
  advertiser_type_value TEXT;
BEGIN
  -- Get user_role from metadata, default to 'real_estate_advertiser'
  user_role_value := COALESCE(NEW.raw_user_meta_data->>'user_role', 'real_estate_advertiser');
  
  -- Set advertiser_type based on user_role
  IF user_role_value = 'real_estate_advertiser' THEN
    -- For real estate advertisers, default to 'owner'
    -- Can be changed later in profile settings
    advertiser_type_value := 'owner';
  ELSE
    -- For commercial advertisers and admins, no advertiser_type
    advertiser_type_value := NULL;
  END IF;

  -- Insert profile with proper defaults
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    user_role,
    advertiser_type,
    company_name,
    is_active,
    is_verified,
    is_admin
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    user_role_value,
    advertiser_type_value,
    COALESCE(NEW.raw_user_meta_data->>'company_name', NULL),
    true, -- is_active
    false, -- is_verified (will be set to true on email confirmation)
    CASE WHEN user_role_value = 'admin' THEN true ELSE false END -- is_admin
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors

  RETURN NEW;
END;
$$;

-- Add security comment
COMMENT ON FUNCTION public.handle_new_user() IS
  'Automatically creates a profile when a new user signs up via Supabase Auth.
   Sets advertiser_type to "owner" by default for real_estate_advertisers.
   SECURITY DEFINER with safe search_path to prevent SQL injection.';

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
  'Triggers profile creation for new users. Runs after user insert in auth.users.';

-- =====================================================
-- STEP 4: Grant necessary permissions
-- =====================================================

-- Ensure the function can be executed
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Run these queries to verify the fix:
-- 
-- 1. Check all real_estate_advertiser users have advertiser_type:
--    SELECT id, email, user_role, advertiser_type 
--    FROM public.profiles 
--    WHERE user_role = 'real_estate_advertiser' AND advertiser_type IS NULL;
--    Expected: 0 rows
--
-- 2. Check all other users have NULL advertiser_type:
--    SELECT id, email, user_role, advertiser_type 
--    FROM public.profiles 
--    WHERE user_role IN ('commercial_advertiser', 'admin') AND advertiser_type IS NOT NULL;
--    Expected: 0 rows
--
-- 3. Test profile creation:
--    Create a new user via Supabase Auth and check profile is created with advertiser_type = 'owner'

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================

-- To rollback this migration:
-- 1. DROP TRIGGER on_auth_user_created ON auth.users;
-- 2. DROP FUNCTION public.handle_new_user();
-- 3. ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_advertiser_type_check;
-- 4. Recreate previous trigger/function from migration 041 or earlier
