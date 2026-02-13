-- =====================================================
-- Migration 104: Unify Account Logic - Single user_role Based RBAC
-- =====================================================
-- OBJECTIVE:
-- Implement clean RBAC based ONLY on profiles.user_role
-- Make announcer_type a descriptive field (no permissions logic)
-- Ensure production-safe account architecture
--
-- RULES:
-- - user_role determines ALL permissions (user|agent|merchant|admin)
-- - announcer_type is metadata only (proprietaire|courtier|agence) for real estate
-- - No permission checks using announcer_type or advertiser_type
-- - Preserve existing data with safe migrations
-- =====================================================

-- =====================================================
-- STEP 1: Ensure schema columns exist with correct types
-- =====================================================

DO $$
BEGIN
  -- Ensure user_role exists with correct constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'user_role'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN user_role TEXT NOT NULL DEFAULT 'user';
  END IF;
  
  -- Update user_role default if needed
  ALTER TABLE public.profiles 
  ALTER COLUMN user_role SET DEFAULT 'user';
  
  -- Ensure announcer_type exists (can be null)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'announcer_type'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN announcer_type TEXT;
  END IF;
  
  -- Ensure agency_name exists (can be null)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'agency_name'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN agency_name TEXT;
  END IF;
END $$;

-- =====================================================
-- STEP 2: Backfill data from legacy fields
-- =====================================================

-- Migrate from old role values to new canonical roles
UPDATE public.profiles
SET user_role = CASE
  -- Preserve admin
  WHEN user_role = 'admin' THEN 'admin'
  
  -- Map old real_estate_advertiser based on advertiser_type
  WHEN user_role = 'real_estate_advertiser' AND advertiser_type = 'broker' THEN 'agent'
  WHEN user_role = 'real_estate_advertiser' AND advertiser_type = 'agency' THEN 'agent'
  WHEN user_role = 'real_estate_advertiser' AND advertiser_type = 'owner' THEN 'user'
  
  -- Map commercial_advertiser to merchant
  WHEN user_role = 'commercial_advertiser' THEN 'merchant'
  
  -- Default to user for any other cases
  ELSE 'user'
END
WHERE user_role IN ('real_estate_advertiser', 'commercial_advertiser')
   OR user_role NOT IN ('user', 'agent', 'merchant', 'admin');

-- Ensure announcer_type uses French values for real estate users
UPDATE public.profiles
SET announcer_type = CASE
  WHEN advertiser_type = 'owner' THEN 'proprietaire'
  WHEN advertiser_type = 'broker' THEN 'courtier'
  WHEN advertiser_type = 'agency' THEN 'agence'
  ELSE announcer_type
END
WHERE advertiser_type IS NOT NULL
  AND advertiser_type IN ('owner', 'broker', 'agency')
  AND (announcer_type IS NULL OR announcer_type NOT IN ('proprietaire', 'courtier', 'agence'));

-- For agent users without announcer_type, set default
UPDATE public.profiles
SET announcer_type = 'proprietaire'
WHERE user_role = 'agent'
  AND announcer_type IS NULL;

-- Clear announcer_type for admin users (not applicable)
UPDATE public.profiles
SET announcer_type = NULL
WHERE user_role = 'admin';

-- Check for artisan profiles and set merchant role
UPDATE public.profiles p
SET user_role = 'merchant'
WHERE EXISTS (
  SELECT 1 FROM public.artisan_profiles ap 
  WHERE ap.user_id = p.id
)
AND p.user_role = 'user';

-- =====================================================
-- STEP 3: Update constraints
-- =====================================================

-- Drop old constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_role_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_announcer_type_check;

-- Add canonical constraints
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_role_check 
CHECK (user_role IN ('user', 'agent', 'merchant', 'admin'));

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_announcer_type_check 
CHECK (
  announcer_type IS NULL 
  OR announcer_type IN ('proprietaire', 'courtier', 'agence')
);

-- =====================================================
-- STEP 4: Create RPC - ensure_profile_exists()
-- =====================================================

CREATE OR REPLACE FUNCTION public.ensure_profile_exists()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id UUID;
  profile_exists BOOLEAN;
BEGIN
  -- Get current authenticated user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if profile exists
  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE id = current_user_id
  ) INTO profile_exists;
  
  -- If profile doesn't exist, create it
  IF NOT profile_exists THEN
    INSERT INTO public.profiles (
      id,
      email,
      user_role,
      full_name,
      is_active,
      is_verified
    )
    SELECT 
      au.id,
      au.email,
      'user', -- Default role
      COALESCE(au.raw_user_meta_data->>'full_name', ''),
      true,
      false
    FROM auth.users au
    WHERE au.id = current_user_id;
    
    RETURN true; -- Profile was created
  END IF;
  
  RETURN false; -- Profile already existed
END;
$$;

COMMENT ON FUNCTION public.ensure_profile_exists() IS
  'SECURITY DEFINER function to ensure a profile exists for the current user.
   Creates profile with user_role=user if missing. Returns true if created, false if already existed.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.ensure_profile_exists() TO authenticated;

-- =====================================================
-- STEP 5: Create RPC - set_user_role()
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_user_role(
  p_role TEXT,
  p_announcer_type TEXT DEFAULT NULL,
  p_agency_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id UUID;
  current_role TEXT;
BEGIN
  -- Get current authenticated user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Validate role
  IF p_role NOT IN ('user', 'agent', 'merchant') THEN
    RAISE EXCEPTION 'Invalid role. Must be one of: user, agent, merchant';
  END IF;
  
  -- Get current user role
  SELECT user_role INTO current_role
  FROM public.profiles
  WHERE id = current_user_id;
  
  -- Prevent users from setting role to admin (only admins can do that)
  -- Users can only set their role once from 'user' to another role
  IF current_role != 'user' AND current_role != p_role THEN
    RAISE EXCEPTION 'Cannot change role from % to %. Contact admin.', current_role, p_role;
  END IF;
  
  -- Validate announcer_type is only set for agent role
  IF p_announcer_type IS NOT NULL THEN
    IF p_role != 'agent' THEN
      RAISE EXCEPTION 'announcer_type can only be set for agent role';
    END IF;
    
    IF p_announcer_type NOT IN ('proprietaire', 'courtier', 'agence') THEN
      RAISE EXCEPTION 'Invalid announcer_type. Must be one of: proprietaire, courtier, agence';
    END IF;
  END IF;
  
  -- For merchant role, announcer_type must be null
  IF p_role = 'merchant' AND p_announcer_type IS NOT NULL THEN
    RAISE EXCEPTION 'Merchant role cannot have announcer_type';
  END IF;
  
  -- Update profile
  UPDATE public.profiles
  SET 
    user_role = p_role,
    announcer_type = CASE 
      WHEN p_role = 'agent' THEN COALESCE(p_announcer_type, 'proprietaire')
      ELSE NULL
    END,
    agency_name = CASE
      WHEN p_role = 'agent' AND p_announcer_type = 'agence' THEN p_agency_name
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE id = current_user_id;
  
  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.set_user_role(TEXT, TEXT, TEXT) IS
  'SECURITY DEFINER function to set user role safely.
   Users can only upgrade from user to agent/merchant once.
   Validates role and announcer_type combinations.
   Only users with role=user can change their role.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.set_user_role(TEXT, TEXT, TEXT) TO authenticated;

-- =====================================================
-- STEP 6: Create Admin RPC - admin_set_user_role()
-- =====================================================

CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_user_id UUID,
  p_role TEXT,
  p_announcer_type TEXT DEFAULT NULL,
  p_agency_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id UUID;
  is_admin_user BOOLEAN;
BEGIN
  -- Get current authenticated user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if current user is admin
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE id = current_user_id 
    AND user_role = 'admin'
  ) INTO is_admin_user;
  
  IF NOT is_admin_user THEN
    RAISE EXCEPTION 'Unauthorized. Admin role required.';
  END IF;
  
  -- Validate role
  IF p_role NOT IN ('user', 'agent', 'merchant', 'admin') THEN
    RAISE EXCEPTION 'Invalid role. Must be one of: user, agent, merchant, admin';
  END IF;
  
  -- Validate announcer_type if provided
  IF p_announcer_type IS NOT NULL THEN
    IF p_announcer_type NOT IN ('proprietaire', 'courtier', 'agence') THEN
      RAISE EXCEPTION 'Invalid announcer_type. Must be one of: proprietaire, courtier, agence';
    END IF;
  END IF;
  
  -- Update target user's profile
  UPDATE public.profiles
  SET 
    user_role = p_role,
    announcer_type = p_announcer_type,
    agency_name = p_agency_name,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Sync with admins table if setting admin role
  IF p_role = 'admin' THEN
    INSERT INTO public.admins (user_id, is_active, role)
    VALUES (p_user_id, true, 'admin')
    ON CONFLICT (user_id) DO UPDATE
    SET is_active = true, role = 'admin';
  ELSE
    -- Remove from admins table if removing admin role
    DELETE FROM public.admins WHERE user_id = p_user_id;
  END IF;
  
  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.admin_set_user_role(UUID, TEXT, TEXT, TEXT) IS
  'SECURITY DEFINER function for admins to set any user role.
   Can set any role including admin.
   Syncs with admins table for admin roles.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- =====================================================
-- STEP 7: Update RLS policies for profiles
-- =====================================================

-- Drop existing update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Create new update policy that prevents direct user_role updates
-- Users must use set_user_role() RPC to change roles
CREATE POLICY "profiles_update_own_limited" ON public.profiles
  FOR UPDATE 
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() 
    AND (
      -- Only allow updating these safe fields directly
      -- user_role changes must go through RPC
      user_role = (SELECT user_role FROM public.profiles WHERE id = auth.uid())
      OR
      -- Admins can update anything
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND user_role = 'admin'
      )
    )
  );

COMMENT ON POLICY "profiles_update_own_limited" ON public.profiles IS
  'Users can update their own profile but NOT user_role directly.
   Role changes must use set_user_role() RPC.
   Admins can update anything.';

-- Ensure insert policy exists for profile creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'profiles_insert_own'
  ) THEN
    CREATE POLICY "profiles_insert_own" ON public.profiles
      FOR INSERT 
      TO authenticated
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- =====================================================
-- STEP 8: Update trigger to use new schema
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Insert profile with canonical schema
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    user_role,
    announcer_type,
    agency_name,
    is_active,
    is_verified
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    'user', -- Always start as user role
    NULL,   -- No announcer_type initially
    NULL,   -- No agency_name initially
    true,   -- Active by default
    false   -- Not verified until email confirmed
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Trigger function to create profile for new users.
   Always creates with user_role=user.
   Users then select their path (Immobilier/Services) which calls set_user_role().';

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STEP 9: Add helpful comments
-- =====================================================

COMMENT ON COLUMN public.profiles.user_role IS 
  'PRIMARY permission field. One of: user, agent, merchant, admin.
   All route guards and permissions check ONLY this field.
   Change via set_user_role() RPC only.';

COMMENT ON COLUMN public.profiles.announcer_type IS 
  'DESCRIPTIVE field for real estate agents only.
   One of: proprietaire, courtier, agence.
   NEVER used for permissions or route guards.
   Only for UI display and filtering.';

COMMENT ON COLUMN public.profiles.agency_name IS 
  'Agency name for announcer_type=agence users.
   Descriptive only, not used for permissions.';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check all users have valid user_role
-- Expected: 0 rows with invalid values
-- SELECT id, email, user_role FROM public.profiles 
-- WHERE user_role NOT IN ('user', 'agent', 'merchant', 'admin');

-- Check role distribution
-- SELECT user_role, COUNT(*) as count 
-- FROM public.profiles 
-- GROUP BY user_role 
-- ORDER BY count DESC;

-- Check announcer_type usage
-- SELECT user_role, announcer_type, COUNT(*) as count 
-- FROM public.profiles 
-- GROUP BY user_role, announcer_type 
-- ORDER BY user_role, announcer_type;

-- Test RPC functions
-- SELECT public.ensure_profile_exists(); -- Should work for authenticated users
-- SELECT public.set_user_role('agent', 'courtier', NULL); -- Should work once

-- =====================================================
-- END OF MIGRATION
-- =====================================================
