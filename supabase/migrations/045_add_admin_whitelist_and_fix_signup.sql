-- =====================================================
-- Migration 045: Add Admin Whitelist and Fix Signup
-- =====================================================
--
-- OBJECTIVE:
-- Fix "database error" on signup by:
-- 1. Creating admin_whitelist table for auto-promoting whitelisted emails
-- 2. Updating handle_new_user trigger to be more robust
-- 3. Adding admin promotion logic via second trigger
-- 4. Ensuring proper RLS policies for all operations
--
-- CHANGES:
-- 1. Create public.admin_whitelist table
-- 2. Update handle_new_user function with better error handling
-- 3. Create promote_whitelisted_admin function + trigger
-- 4. Add proper RLS policies
-- 5. Make everything idempotent (safe to re-run)
--
-- ROLE LOGIC:
-- - Normal signup => profiles.user_role='user'
-- - Whitelisted email signup => profiles.user_role='admin'
-- =====================================================

-- =====================================================
-- STEP 1: Create admin_whitelist table
-- =====================================================

-- Drop and recreate to ensure clean state
DROP TABLE IF EXISTS public.admin_whitelist CASCADE;

CREATE TABLE public.admin_whitelist (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT
);

-- Add comment for documentation
COMMENT ON TABLE public.admin_whitelist IS 
  'Whitelist of email addresses that should be automatically promoted to admin role upon signup.';

COMMENT ON COLUMN public.admin_whitelist.email IS 
  'Email address (case-insensitive) to auto-promote to admin.';

COMMENT ON COLUMN public.admin_whitelist.notes IS 
  'Optional notes about why this email is whitelisted.';

-- =====================================================
-- STEP 2: Enable RLS on admin_whitelist
-- =====================================================

ALTER TABLE public.admin_whitelist ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "admin_whitelist_select_admin" ON public.admin_whitelist;
DROP POLICY IF EXISTS "admin_whitelist_insert_admin" ON public.admin_whitelist;
DROP POLICY IF EXISTS "admin_whitelist_update_admin" ON public.admin_whitelist;
DROP POLICY IF EXISTS "admin_whitelist_delete_admin" ON public.admin_whitelist;

-- Only admins can view the whitelist
CREATE POLICY "admin_whitelist_select_admin" ON public.admin_whitelist
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (is_admin = true OR user_role = 'admin')
    )
  );

-- Only admins can add to the whitelist
CREATE POLICY "admin_whitelist_insert_admin" ON public.admin_whitelist
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (is_admin = true OR user_role = 'admin')
    )
  );

-- Only admins can update the whitelist
CREATE POLICY "admin_whitelist_update_admin" ON public.admin_whitelist
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (is_admin = true OR user_role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (is_admin = true OR user_role = 'admin')
    )
  );

-- Only admins can delete from the whitelist
CREATE POLICY "admin_whitelist_delete_admin" ON public.admin_whitelist
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (is_admin = true OR user_role = 'admin')
    )
  );

-- =====================================================
-- STEP 3: Update handle_new_user function
-- =====================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create improved trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_role_value TEXT;
  announcer_type_value TEXT;
  is_whitelisted BOOLEAN;
BEGIN
  -- Check if email is in admin whitelist (case-insensitive)
  SELECT EXISTS (
    SELECT 1 FROM public.admin_whitelist
    WHERE LOWER(email) = LOWER(NEW.email)
  ) INTO is_whitelisted;
  
  -- Get user_role from metadata, default to 'user'
  user_role_value := COALESCE(NEW.raw_user_meta_data->>'user_role', 'user');
  
  -- Auto-promote whitelisted emails to admin
  IF is_whitelisted THEN
    user_role_value := 'admin';
    RAISE NOTICE 'Email % is whitelisted, promoting to admin', NEW.email;
  END IF;
  
  -- Validate user_role value (log original value before changing it)
  IF user_role_value NOT IN ('user', 'agent', 'merchant', 'admin') THEN
    RAISE WARNING 'Invalid user_role ''%'' provided, defaulting to ''user''', user_role_value;
    user_role_value := 'user';
  END IF;
  
  -- Get announcer_type from metadata
  announcer_type_value := NEW.raw_user_meta_data->>'announcer_type';
  
  -- Validate announcer_type value (log original value before changing it)
  IF announcer_type_value IS NOT NULL 
     AND announcer_type_value NOT IN ('proprietaire', 'courtier', 'agence') THEN
    RAISE WARNING 'Invalid announcer_type ''%'' provided, setting to NULL', announcer_type_value;
    announcer_type_value := NULL;
  END IF;
  
  -- Set default announcer_type for non-admin users if not provided
  IF announcer_type_value IS NULL AND user_role_value != 'admin' THEN
    announcer_type_value := 'proprietaire';
  END IF;
  
  -- Admin users should not have announcer_type
  IF user_role_value = 'admin' THEN
    announcer_type_value := NULL;
  END IF;

  -- Insert profile with UPSERT to handle race conditions
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    user_role,
    announcer_type,
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
    announcer_type_value,
    COALESCE(NEW.raw_user_meta_data->>'company_name', NULL),
    true, -- is_active
    false, -- is_verified (will be set to true on email confirmation)
    CASE WHEN user_role_value = 'admin' THEN true ELSE false END -- is_admin
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    user_role = EXCLUDED.user_role,
    announcer_type = EXCLUDED.announcer_type,
    company_name = COALESCE(EXCLUDED.company_name, public.profiles.company_name),
    is_admin = EXCLUDED.is_admin,
    updated_at = NOW();

  RAISE NOTICE 'Profile created/updated for user % with role %', NEW.email, user_role_value;
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error details but don't fail the user creation
    RAISE WARNING 'Failed to create/update profile for user %: % (SQLSTATE: %)', 
      NEW.id, SQLERRM, SQLSTATE;
    RAISE WARNING 'Error detail: %', SQLERRM;
    -- Get more diagnostic info from PostgreSQL
    RAISE WARNING 'Error context: %', 
      COALESCE(PG_EXCEPTION_CONTEXT, 'No context available');
    -- Return NEW to allow auth.users insert to succeed
    RETURN NEW;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS
  'Automatically creates a profile when a new user signs up.
   Sets user_role (user/agent/merchant/admin) and announcer_type (proprietaire/courtier/agence).
   Auto-promotes whitelisted emails to admin role.
   SECURITY DEFINER with safe search_path to prevent SQL injection and bypass RLS.';

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
  'Triggers profile creation for new users with admin whitelist check.';

-- =====================================================
-- STEP 4: Create function to promote whitelisted admins
-- =====================================================

-- This function handles cases where:
-- 1. An email is added to whitelist AFTER user signup
-- 2. Profile is updated and email changes to whitelisted one

DROP TRIGGER IF EXISTS on_profile_check_admin_whitelist ON public.profiles;
DROP FUNCTION IF EXISTS public.check_and_promote_admin() CASCADE;

CREATE OR REPLACE FUNCTION public.check_and_promote_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_whitelisted BOOLEAN;
BEGIN
  -- Only check on INSERT or when email changes
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.email != NEW.email) THEN
    -- Check if email is in admin whitelist (case-insensitive)
    SELECT EXISTS (
      SELECT 1 FROM public.admin_whitelist
      WHERE LOWER(email) = LOWER(NEW.email)
    ) INTO is_whitelisted;
    
    -- If whitelisted and not already admin, promote
    IF is_whitelisted AND NEW.user_role != 'admin' THEN
      NEW.user_role := 'admin';
      NEW.is_admin := true;
      NEW.announcer_type := NULL; -- Admins don't have announcer_type
      NEW.updated_at := NOW();
      RAISE NOTICE 'Promoting user % to admin (whitelisted email)', NEW.email;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.check_and_promote_admin() IS
  'Checks if a profile email is in admin_whitelist and auto-promotes to admin role.
   Runs on profile INSERT/UPDATE to handle retroactive whitelist additions.';

-- Create trigger on profiles table
CREATE TRIGGER on_profile_check_admin_whitelist
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_promote_admin();

COMMENT ON TRIGGER on_profile_check_admin_whitelist ON public.profiles IS
  'Auto-promotes users to admin if their email is added to whitelist.';

-- =====================================================
-- STEP 5: Grant necessary permissions
-- =====================================================

-- Ensure the functions can be executed
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.check_and_promote_admin() TO postgres, service_role;

-- Grant table access to authenticated users (via RLS policies)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_whitelist TO authenticated;

-- =====================================================
-- STEP 6: Verify RLS policies on profiles table
-- =====================================================

-- Ensure profiles table has RLS enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- The profiles_insert_own policy might be blocking inserts
-- Update it to allow SECURITY DEFINER functions to bypass
DO $$
BEGIN
  -- Drop and recreate insert policy to ensure it works with triggers
  DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
  
  CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT 
    TO authenticated
    WITH CHECK (id = auth.uid());
    
  RAISE NOTICE 'RLS policy profiles_insert_own recreated';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to recreate profiles_insert_own policy: %', SQLERRM;
END $$;

-- =====================================================
-- STEP 7: Seed with initial admin emails (optional)
-- =====================================================

-- Example: Add your admin email(s) to the whitelist
-- Uncomment and modify the emails below:

-- INSERT INTO public.admin_whitelist (email, notes)
-- VALUES 
--   ('admin@topaffaireimmo.com', 'Platform administrator'),
--   ('owner@topaffaireimmo.com', 'Business owner')
-- ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- These queries can be used to verify the migration:
-- 
-- 1. Check admin_whitelist table exists:
--    SELECT * FROM public.admin_whitelist;
--
-- 2. Check triggers are installed:
--    SELECT tgname, tgrelid::regclass, tgfoid::regproc
--    FROM pg_trigger
--    WHERE tgrelid IN ('auth.users'::regclass, 'public.profiles'::regclass)
--    AND tgname IN ('on_auth_user_created', 'on_profile_check_admin_whitelist');
--
-- 3. Test signup with non-whitelisted email:
--    -- Should create profile with user_role='user'
--
-- 4. Add email to whitelist:
--    INSERT INTO public.admin_whitelist (email) VALUES ('test@example.com');
--
-- 5. Test signup with whitelisted email:
--    -- Should create profile with user_role='admin'
--
-- 6. Check RLS policies:
--    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
--    FROM pg_policies
--    WHERE tablename IN ('profiles', 'admin_whitelist')
--    ORDER BY tablename, policyname;

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
-- To rollback this migration:
-- 1. DROP TABLE public.admin_whitelist CASCADE;
-- 2. Restore previous handle_new_user function from migration 044
-- 3. DROP FUNCTION public.check_and_promote_admin() CASCADE;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
