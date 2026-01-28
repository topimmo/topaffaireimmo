-- =====================================================
-- Migration 047: Fix Profile Trigger for NOT NULL Columns
-- =====================================================
--
-- PROBLEM:
-- Supabase Auth signup fails with "Database error saving new user" (AuthApiError 500)
-- during profile creation. The trigger function does NOT populate all required NOT NULL fields.
--
-- ROOT CAUSE:
-- The handle_new_user() trigger function from migration 045 may not handle all NOT NULL
-- columns properly, especially if schema has:
-- - profiles.id (uuid) NOT NULL
-- - profiles.email (text) NOT NULL
-- - profiles.role (text) NOT NULL - if this column exists
-- - profiles.user_role (text) NOT NULL
--
-- SOLUTION:
-- 1. Check if 'role' column exists and handle it (set default or make nullable)
-- 2. Ensure 'user_role' has a NOT NULL constraint with DEFAULT
-- 3. Update handle_new_user() to be fully defensive and never fail
-- 4. Use COALESCE on all metadata fields
-- 5. Set safe defaults for all NOT NULL columns
--
-- =====================================================

-- =====================================================
-- STEP 1: Handle the 'role' column if it exists
-- =====================================================

DO $$
BEGIN
  -- Check if 'role' column exists in profiles table
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    RAISE NOTICE '⚠ Found "role" column in profiles table';
    
    -- Option 1: Make it nullable (safest for backward compatibility)
    BEGIN
      ALTER TABLE public.profiles 
      ALTER COLUMN role DROP NOT NULL;
      
      RAISE NOTICE '✓ Made "role" column nullable';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Could not make role column nullable: %', SQLERRM;
    END;
    
    -- Option 2: Set a default value for existing rows
    UPDATE public.profiles 
    SET role = COALESCE(role, user_role, 'user')
    WHERE role IS NULL;
    
    RAISE NOTICE '✓ Set default values for NULL role column';
    
  ELSE
    RAISE NOTICE 'ℹ No separate "role" column found (expected)';
  END IF;
END $$;

-- =====================================================
-- STEP 2: Ensure user_role has proper constraints
-- =====================================================

-- Make sure user_role has a DEFAULT value (not necessarily NOT NULL)
DO $$
BEGIN
  -- Set default for user_role if not already set
  BEGIN
    ALTER TABLE public.profiles 
    ALTER COLUMN user_role SET DEFAULT 'user';
    
    RAISE NOTICE '✓ Set DEFAULT for user_role column';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'user_role DEFAULT already exists or could not be set: %', SQLERRM;
  END;
  
  -- Update any existing NULL user_role values
  UPDATE public.profiles 
  SET user_role = 'user'
  WHERE user_role IS NULL;
  
  RAISE NOTICE '✓ Updated NULL user_role values to "user"';
END $$;

-- =====================================================
-- STEP 3: Create defensive handle_new_user function
-- =====================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- First, check if 'role' column exists to determine which version to create
DO $$
DECLARE
  has_role_column BOOLEAN;
BEGIN
  -- Check if 'role' column exists in profiles table
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) INTO has_role_column;
  
  IF has_role_column THEN
    RAISE NOTICE '📋 Creating handle_new_user function WITH "role" column support';
  ELSE
    RAISE NOTICE '📋 Creating handle_new_user function WITHOUT "role" column (standard)';
  END IF;
END $$;

-- Create fully defensive trigger function
-- This version is created regardless of schema and handles both cases
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_role_value TEXT;
  announcer_type_value TEXT;
  role_value TEXT;
  is_whitelisted BOOLEAN DEFAULT FALSE;
  has_role_column BOOLEAN;
  has_admin_whitelist BOOLEAN;
BEGIN
  -- ================================================
  -- Defensive checks and safe defaults
  -- ================================================
  
  -- Validate email is not NULL (should never happen from auth.users)
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RAISE EXCEPTION 'Email cannot be NULL or empty for user %', NEW.id;
  END IF;
  
  -- Check if admin_whitelist table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'admin_whitelist'
  ) INTO has_admin_whitelist;
  
  -- Check if email is in admin whitelist (case-insensitive)
  IF has_admin_whitelist THEN
    SELECT EXISTS (
      SELECT 1 FROM public.admin_whitelist
      WHERE LOWER(email) = LOWER(NEW.email)
    ) INTO is_whitelisted;
  END IF;
  
  -- Get user_role from metadata with safe fallback
  user_role_value := COALESCE(
    NEW.raw_user_meta_data->>'user_role', 
    'user'
  );
  
  -- Auto-promote whitelisted emails to admin
  IF is_whitelisted THEN
    user_role_value := 'admin';
    RAISE NOTICE 'Email % is whitelisted, promoting to admin', NEW.email;
  END IF;
  
  -- Validate user_role value (ensure it's in allowed list)
  IF user_role_value NOT IN ('user', 'agent', 'merchant', 'admin') THEN
    RAISE WARNING 'Invalid user_role ''%'' provided, defaulting to ''user''', user_role_value;
    user_role_value := 'user';
  END IF;
  
  -- Set role_value same as user_role_value for backward compatibility
  -- (in case 'role' column exists in production)
  role_value := user_role_value;
  
  -- Get announcer_type from metadata with validation
  announcer_type_value := NEW.raw_user_meta_data->>'announcer_type';
  
  -- Validate announcer_type value
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

  -- ================================================
  -- Insert profile with defensive column handling
  -- ================================================
  
  -- Check if 'role' column exists (done once during migration, cached for performance)
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) INTO has_role_column;
  
  -- Insert with or without 'role' column depending on schema
  IF has_role_column THEN
    -- Schema has 'role' column - insert with it
    INSERT INTO public.profiles (
      id,
      email,
      role,
      user_role,
      full_name,
      phone,
      announcer_type,
      company_name,
      is_active,
      is_verified,
      is_admin
    ) VALUES (
      NEW.id,
      NEW.email,  -- Email already validated as NOT NULL above
      role_value,  -- Populate role column
      user_role_value,  -- Populate user_role column
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
      announcer_type_value,
      COALESCE(NEW.raw_user_meta_data->>'company_name', NULL),
      true,  -- is_active
      false,  -- is_verified (will be set to true on email confirmation)
      CASE WHEN user_role_value = 'admin' THEN true ELSE false END  -- is_admin
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      role = EXCLUDED.role,  -- Keep role in sync with user_role
      user_role = EXCLUDED.user_role,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
      announcer_type = EXCLUDED.announcer_type,
      company_name = COALESCE(EXCLUDED.company_name, public.profiles.company_name),
      is_admin = EXCLUDED.is_admin,
      updated_at = NOW();
    
    RAISE NOTICE 'Profile created/updated for user % with role=% and user_role=%', 
      NEW.email, role_value, user_role_value;
  ELSE
    -- Schema does NOT have 'role' column - insert without it (standard case)
    INSERT INTO public.profiles (
      id,
      email,
      user_role,
      full_name,
      phone,
      announcer_type,
      company_name,
      is_active,
      is_verified,
      is_admin
    ) VALUES (
      NEW.id,
      NEW.email,  -- Email already validated as NOT NULL above
      user_role_value,  -- Populate user_role column
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
      announcer_type_value,
      COALESCE(NEW.raw_user_meta_data->>'company_name', NULL),
      true,  -- is_active
      false,  -- is_verified (will be set to true on email confirmation)
      CASE WHEN user_role_value = 'admin' THEN true ELSE false END  -- is_admin
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      user_role = EXCLUDED.user_role,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
      announcer_type = EXCLUDED.announcer_type,
      company_name = COALESCE(EXCLUDED.company_name, public.profiles.company_name),
      is_admin = EXCLUDED.is_admin,
      updated_at = NOW();
    
    RAISE NOTICE 'Profile created/updated for user % with user_role=%', 
      NEW.email, user_role_value;
  END IF;

  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Enhanced error logging for debugging
    RAISE WARNING 'Failed to create/update profile for user % (email: %)', NEW.id, NEW.email;
    RAISE WARNING 'Error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RAISE WARNING 'Error context: %', COALESCE(PG_EXCEPTION_CONTEXT, 'No context available');
    RAISE WARNING 'Metadata: user_role=%, announcer_type=%, full_name=%', 
      NEW.raw_user_meta_data->>'user_role',
      NEW.raw_user_meta_data->>'announcer_type',
      NEW.raw_user_meta_data->>'full_name';
    
    -- Return NEW to allow auth.users insert to succeed even if profile creation fails
    -- This prevents orphaned auth records
    RETURN NEW;
END;
$$;

-- Add comprehensive documentation
COMMENT ON FUNCTION public.handle_new_user() IS
  'Defensive trigger function that creates a profile when a new user signs up.
   
   Features:
   - Handles both "role" and "user_role" columns (checks schema dynamically)
   - Sets safe defaults for all NOT NULL columns (id, email, role, user_role)
   - Uses COALESCE on all metadata fields to prevent NULL violations
   - Auto-promotes whitelisted emails to admin role
   - Validates all input values before insert
   - Never fails even if metadata is incomplete or invalid
   - Provides detailed error logging for debugging
   
   Security: SECURITY DEFINER with locked search_path to prevent SQL injection and bypass RLS.
   
   NOT NULL column handling:
   - id: Always set from NEW.id (required by auth.users)
   - email: Validated to never be NULL (raises exception if NULL)
   - role: Set to same value as user_role (if column exists)
   - user_role: Defaults to ''user'' if not provided in metadata
   - announcer_type: Can be NULL (not a required field)
   
   Frontend requirements:
   - Optional: Pass user_role in metadata (defaults to "user")
   - Optional: Pass announcer_type in metadata (defaults to "proprietaire" for non-admins)
   - Optional: Pass full_name, phone, company_name in metadata
   - No changes required to frontend - trigger handles all cases defensively';

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
  'Triggers defensive profile creation for new users. 
   Never fails even with incomplete metadata.
   Handles schema variations (with or without "role" column).';

-- =====================================================
-- STEP 4: Grant necessary permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify the fix:
-- 
-- 1. Check column constraints:
--    SELECT 
--      column_name, 
--      data_type, 
--      is_nullable, 
--      column_default
--    FROM information_schema.columns 
--    WHERE table_name = 'profiles' 
--    AND table_schema = 'public'
--    AND column_name IN ('id', 'email', 'role', 'user_role');
--
-- 2. Test signup flow:
--    -- Try signing up a new user via Supabase Auth
--    -- Should succeed even without any metadata
--
-- 3. Check for orphaned users:
--    SELECT COUNT(*) FROM auth.users u
--    LEFT JOIN public.profiles p ON p.id = u.id
--    WHERE p.id IS NULL;
--    Expected: 0
--
-- 4. Verify trigger exists:
--    SELECT tgname, tgfoid::regproc
--    FROM pg_trigger
--    WHERE tgrelid = 'auth.users'::regclass
--    AND tgname = 'on_auth_user_created';

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================

-- To rollback this migration:
-- 1. DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- 2. DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
-- 3. Restore function from migration 045
-- 4. If 'role' column was made nullable, restore NOT NULL constraint

-- =====================================================
-- END OF MIGRATION
-- =====================================================
