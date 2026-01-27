-- =====================================================
-- Migration 044: Fix announcer_type and user_role mapping
-- =====================================================
--
-- OBJECTIVE:
-- Update user_role values to use simplified technical roles
-- Update announcer_type to use French values
-- Keep user_role as single source of truth
--
-- CHANGES:
-- 1. Update 'user_role' values to: user, agent, merchant, admin
-- 2. Update 'announcer_type' to use French values (proprietaire, courtier, agence)
-- 3. Migrate existing data from old to new schema
-- 4. Update constraints and triggers
-- 5. Ensure RLS policies work correctly
--
-- MAPPING:
-- Old user_role=real_estate_advertiser + advertiser_type=owner  → user_role=user, announcer_type=proprietaire
-- Old user_role=real_estate_advertiser + advertiser_type=broker → user_role=agent, announcer_type=courtier
-- Old user_role=real_estate_advertiser + advertiser_type=agency → user_role=merchant, announcer_type=agence
-- Old user_role=admin                                           → user_role=admin, announcer_type=null
-- Old user_role=commercial_advertiser                           → user_role=merchant, announcer_type=null
-- =====================================================

-- =====================================================
-- STEP 1: Migrate existing data to new schema
-- =====================================================

-- Update user_role based on existing user_role and advertiser_type
UPDATE public.profiles
SET user_role = CASE
  -- Admin users stay admin
  WHEN user_role = 'admin' THEN 'admin'
  
  -- Real estate advertisers with specific advertiser types
  WHEN user_role = 'real_estate_advertiser' AND advertiser_type = 'owner' THEN 'user'
  WHEN user_role = 'real_estate_advertiser' AND advertiser_type = 'broker' THEN 'agent'
  WHEN user_role = 'real_estate_advertiser' AND advertiser_type = 'agency' THEN 'merchant'
  
  -- Real estate advertisers without advertiser_type (default to user)
  WHEN user_role = 'real_estate_advertiser' AND advertiser_type IS NULL THEN 'user'
  
  -- Commercial advertisers become merchant
  WHEN user_role = 'commercial_advertiser' THEN 'merchant'
  
  -- Default fallback
  ELSE 'user'
END
WHERE user_role IN ('real_estate_advertiser', 'commercial_advertiser');

-- Update announcer_type to use French values for real estate users
UPDATE public.profiles
SET announcer_type = CASE
  WHEN advertiser_type = 'owner' THEN 'proprietaire'
  WHEN advertiser_type = 'broker' THEN 'courtier'
  WHEN advertiser_type = 'agency' THEN 'agence'
  ELSE advertiser_type
END
WHERE advertiser_type IS NOT NULL
  AND advertiser_type IN ('owner', 'broker', 'agency');

-- Set announcer_type to null for admin users and pure merchants (no real estate business)
UPDATE public.profiles
SET announcer_type = NULL
WHERE user_role IN ('admin', 'merchant')
  AND advertiser_type IS NULL;

-- For users without announcer_type who are not admin or pure merchant, set default
UPDATE public.profiles
SET announcer_type = 'proprietaire'
WHERE user_role = 'user'
  AND announcer_type IS NULL;

-- =====================================================
-- STEP 2: Update constraints
-- =====================================================

-- Drop old constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_advertiser_type_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_role_check;

-- Add new user_role constraint with updated values
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_role_check 
  CHECK (user_role IN ('user', 'agent', 'merchant', 'admin'));

-- Add new announcer_type constraint (French values)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_announcer_type_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_announcer_type_check 
  CHECK (
    announcer_type IS NULL 
    OR announcer_type IN ('proprietaire', 'courtier', 'agence')
  );

-- =====================================================
-- STEP 3: Update trigger function
-- =====================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create new trigger function with user_role and announcer_type support
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_role_value TEXT;
  announcer_type_value TEXT;
BEGIN
  -- Get user_role from metadata, validate and default to 'user'
  user_role_value := COALESCE(NEW.raw_user_meta_data->>'user_role', 'user');
  
  -- Validate user_role value
  IF user_role_value NOT IN ('user', 'agent', 'merchant', 'admin') THEN
    user_role_value := 'user';
  END IF;
  
  -- Get announcer_type from metadata
  announcer_type_value := NEW.raw_user_meta_data->>'announcer_type';
  
  -- Validate announcer_type value
  IF announcer_type_value IS NOT NULL 
     AND announcer_type_value NOT IN ('proprietaire', 'courtier', 'agence') THEN
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

  -- Insert profile with new schema
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
    company_name = COALESCE(EXCLUDED.company_name, public.profiles.company_name);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS
  'Automatically creates a profile when a new user signs up.
   Sets user_role (user/agent/merchant/admin) and announcer_type (proprietaire/courtier/agence).
   SECURITY DEFINER with safe search_path to prevent SQL injection and bypass RLS.';

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
  'Triggers profile creation for new users with user_role and announcer_type support.';

-- =====================================================
-- STEP 4: Grant necessary permissions
-- =====================================================

-- Ensure the function can be executed
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

-- =====================================================
-- STEP 5: Verify RLS policies are compatible
-- =====================================================

-- RLS policies should already be in place from previous migrations
-- They work with the id column which hasn't changed
-- Just verify they exist

DO $$
BEGIN
  -- Check if policies exist, if not create them
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'profiles_select_own'
  ) THEN
    -- Users can view their own profile or admins can view all
    CREATE POLICY "profiles_select_own" ON public.profiles
      FOR SELECT 
      TO authenticated
      USING (
        id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() 
          AND (is_admin = true OR user_role = 'admin')
        )
      );
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'profiles_update_own'
  ) THEN
    -- Users can update their own profile
    CREATE POLICY "profiles_update_own" ON public.profiles
      FOR UPDATE 
      TO authenticated
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'profiles_insert_own'
  ) THEN
    -- Users can insert their own profile (trigger uses SECURITY DEFINER)
    CREATE POLICY "profiles_insert_own" ON public.profiles
      FOR INSERT 
      TO authenticated
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- These queries can be used to verify the migration:
-- 
-- 1. Check all users have a valid user_role:
--    SELECT id, email, user_role, announcer_type 
--    FROM public.profiles 
--    WHERE user_role IS NULL OR user_role NOT IN ('user', 'agent', 'merchant', 'admin');
--    Expected: 0 rows
--
-- 2. Check announcer_type values:
--    SELECT DISTINCT user_role, announcer_type 
--    FROM public.profiles 
--    ORDER BY user_role, announcer_type;
--    Expected: Valid combinations only
--
-- 3. Check migration results:
--    SELECT user_role, announcer_type, COUNT(*) 
--    FROM public.profiles 
--    GROUP BY user_role, announcer_type;

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
-- To rollback this migration:
-- 1. UPDATE public.profiles SET user_role = 'real_estate_advertiser' WHERE user_role IN ('user', 'agent');
-- 2. UPDATE public.profiles SET user_role = 'commercial_advertiser' WHERE user_role = 'merchant' AND announcer_type IS NULL;
-- 3. UPDATE public.profiles SET advertiser_type = ... (reverse French mapping)
-- 4. Restore previous trigger from migration 042
