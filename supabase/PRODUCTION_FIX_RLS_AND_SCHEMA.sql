-- =====================================================
-- PRODUCTION FIX: RLS Policies & Schema Validation
-- =====================================================
-- This migration ensures:
-- 1. All critical tables have RLS enabled
-- 2. Minimal working policies exist for user operations
-- 3. Foreign keys are validated
-- 4. PostgREST schema is reloaded
-- =====================================================

\echo '=================================================='
\echo 'PRODUCTION FIX: RLS & Schema'
\echo '=================================================='
\echo ''

-- =====================================================
-- STEP 1: Ensure RLS is Enabled
-- =====================================================
\echo 'STEP 1: Enabling RLS on critical tables...'

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisan_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisan_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

\echo '✅ RLS enabled on all critical tables'
\echo ''

-- =====================================================
-- STEP 2: Validate Foreign Keys
-- =====================================================
\echo 'STEP 2: Validating foreign key relationships...'

-- Ensure artisan_services.artisan_profile_id references artisan_profiles(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'artisan_services_artisan_profile_id_fkey'
    AND table_name = 'artisan_services'
  ) THEN
    ALTER TABLE public.artisan_services
    ADD CONSTRAINT artisan_services_artisan_profile_id_fkey
    FOREIGN KEY (artisan_profile_id)
    REFERENCES public.artisan_profiles(id)
    ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Added artisan_services.artisan_profile_id foreign key';
  ELSE
    RAISE NOTICE '✅ artisan_services.artisan_profile_id foreign key exists';
  END IF;
END $$;

-- Ensure properties has proper foreign keys
DO $$
BEGIN
  -- Check for user_id or owner_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'properties'
    AND constraint_type = 'FOREIGN KEY'
    AND (constraint_name LIKE '%user%' OR constraint_name LIKE '%owner%')
  ) THEN
    -- Determine which column exists (user_id or owner_id)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'user_id') THEN
      ALTER TABLE public.properties
      ADD CONSTRAINT properties_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
      RAISE NOTICE '✅ Added properties.user_id foreign key';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'owner_id') THEN
      ALTER TABLE public.properties
      ADD CONSTRAINT properties_owner_id_fkey
      FOREIGN KEY (owner_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
      RAISE NOTICE '✅ Added properties.owner_id foreign key';
    END IF;
  ELSE
    RAISE NOTICE '✅ properties foreign key to auth.users exists';
  END IF;
END $$;

\echo ''

-- =====================================================
-- STEP 3: Minimal Working RLS Policies
-- =====================================================
\echo 'STEP 3: Creating minimal working RLS policies...'

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================
\echo 'Setting up profiles policies...'

-- Allow users to read all profiles (for discovery/public listings)
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Allow users to insert their own profile
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow admins to delete profiles
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin"
  ON public.profiles
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.admins WHERE is_active = true
    )
  );

\echo '✅ Profiles policies configured'

-- =====================================================
-- PROPERTIES TABLE POLICIES
-- =====================================================
\echo 'Setting up properties policies...'

-- Determine ownership column (created_by, user_id, or owner_id)
DO $$
DECLARE
  ownership_column TEXT;
BEGIN
  -- Check which ownership column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'created_by') THEN
    ownership_column := 'created_by';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'user_id') THEN
    ownership_column := 'user_id';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'owner_id') THEN
    ownership_column := 'owner_id';
  ELSE
    RAISE EXCEPTION 'No ownership column found in properties table';
  END IF;

  RAISE NOTICE 'Properties ownership column: %', ownership_column;

  -- Create SELECT policy (users can read all properties)
  EXECUTE format('
    DROP POLICY IF EXISTS "properties_select_all" ON public.properties;
    CREATE POLICY "properties_select_all"
      ON public.properties
      FOR SELECT
      USING (true);
  ');

  -- Create INSERT policy (users can insert their own properties)
  EXECUTE format('
    DROP POLICY IF EXISTS "properties_insert_own" ON public.properties;
    CREATE POLICY "properties_insert_own"
      ON public.properties
      FOR INSERT
      WITH CHECK (auth.uid() = %I);
  ', ownership_column);

  -- Create UPDATE policy (users can update their own properties)
  EXECUTE format('
    DROP POLICY IF EXISTS "properties_update_own" ON public.properties;
    CREATE POLICY "properties_update_own"
      ON public.properties
      FOR UPDATE
      USING (auth.uid() = %I)
      WITH CHECK (auth.uid() = %I);
  ', ownership_column, ownership_column);

  -- Create DELETE policy (users can delete their own properties)
  EXECUTE format('
    DROP POLICY IF EXISTS "properties_delete_own" ON public.properties;
    CREATE POLICY "properties_delete_own"
      ON public.properties
      FOR DELETE
      USING (auth.uid() = %I);
  ', ownership_column);

  -- Admin policies
  EXECUTE '
    DROP POLICY IF EXISTS "properties_admin_all" ON public.properties;
    CREATE POLICY "properties_admin_all"
      ON public.properties
      FOR ALL
      USING (
        auth.uid() IN (
          SELECT user_id FROM public.admins WHERE is_active = true
        )
      );
  ';

  RAISE NOTICE '✅ Properties policies configured with ownership column: %', ownership_column;
END $$;

-- =====================================================
-- ARTISAN_PROFILES TABLE POLICIES
-- =====================================================
\echo 'Setting up artisan_profiles policies...'

-- Public can read active, verified artisan profiles
DROP POLICY IF EXISTS "artisan_profiles_select_public" ON public.artisan_profiles;
CREATE POLICY "artisan_profiles_select_public"
  ON public.artisan_profiles
  FOR SELECT
  USING (is_active = true AND is_verified = true);

-- Users can read their own artisan profile (even if not verified)
DROP POLICY IF EXISTS "artisan_profiles_select_own" ON public.artisan_profiles;
CREATE POLICY "artisan_profiles_select_own"
  ON public.artisan_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own artisan profile
DROP POLICY IF EXISTS "artisan_profiles_insert_own" ON public.artisan_profiles;
CREATE POLICY "artisan_profiles_insert_own"
  ON public.artisan_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own artisan profile
DROP POLICY IF EXISTS "artisan_profiles_update_own" ON public.artisan_profiles;
CREATE POLICY "artisan_profiles_update_own"
  ON public.artisan_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own artisan profile
DROP POLICY IF EXISTS "artisan_profiles_delete_own" ON public.artisan_profiles;
CREATE POLICY "artisan_profiles_delete_own"
  ON public.artisan_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can manage all artisan profiles
DROP POLICY IF EXISTS "artisan_profiles_admin_all" ON public.artisan_profiles;
CREATE POLICY "artisan_profiles_admin_all"
  ON public.artisan_profiles
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.admins WHERE is_active = true
    )
  );

\echo '✅ Artisan profiles policies configured'

-- =====================================================
-- ARTISAN_SERVICES TABLE POLICIES
-- =====================================================
\echo 'Setting up artisan_services policies...'

-- Determine artisan ID column (artisan_id or artisan_profile_id)
DO $$
DECLARE
  artisan_column TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artisan_services' AND column_name = 'artisan_id') THEN
    artisan_column := 'artisan_id';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artisan_services' AND column_name = 'artisan_profile_id') THEN
    artisan_column := 'artisan_profile_id';
  ELSE
    RAISE EXCEPTION 'No artisan ID column found in artisan_services table';
  END IF;

  RAISE NOTICE 'Artisan services ownership column: %', artisan_column;

  -- Public can read active services
  EXECUTE '
    DROP POLICY IF EXISTS "artisan_services_select_public" ON public.artisan_services;
    CREATE POLICY "artisan_services_select_public"
      ON public.artisan_services
      FOR SELECT
      USING (is_active = true);
  ';

  -- Users can read their own services
  IF artisan_column = 'artisan_id' THEN
    EXECUTE '
      DROP POLICY IF EXISTS "artisan_services_select_own" ON public.artisan_services;
      CREATE POLICY "artisan_services_select_own"
        ON public.artisan_services
        FOR SELECT
        USING (auth.uid() = artisan_id);
    ';
  ELSE
    EXECUTE '
      DROP POLICY IF EXISTS "artisan_services_select_own" ON public.artisan_services;
      CREATE POLICY "artisan_services_select_own"
        ON public.artisan_services
        FOR SELECT
        USING (
          auth.uid() IN (
            SELECT user_id FROM public.artisan_profiles WHERE id = artisan_profile_id
          )
        );
    ';
  END IF;

  -- Users can insert their own services
  IF artisan_column = 'artisan_id' THEN
    EXECUTE '
      DROP POLICY IF EXISTS "artisan_services_insert_own" ON public.artisan_services;
      CREATE POLICY "artisan_services_insert_own"
        ON public.artisan_services
        FOR INSERT
        WITH CHECK (auth.uid() = artisan_id);
    ';
  ELSE
    EXECUTE '
      DROP POLICY IF EXISTS "artisan_services_insert_own" ON public.artisan_services;
      CREATE POLICY "artisan_services_insert_own"
        ON public.artisan_services
        FOR INSERT
        WITH CHECK (
          auth.uid() IN (
            SELECT user_id FROM public.artisan_profiles WHERE id = artisan_profile_id
          )
        );
    ';
  END IF;

  -- Users can update their own services
  IF artisan_column = 'artisan_id' THEN
    EXECUTE '
      DROP POLICY IF EXISTS "artisan_services_update_own" ON public.artisan_services;
      CREATE POLICY "artisan_services_update_own"
        ON public.artisan_services
        FOR UPDATE
        USING (auth.uid() = artisan_id)
        WITH CHECK (auth.uid() = artisan_id);
    ';
  ELSE
    EXECUTE '
      DROP POLICY IF EXISTS "artisan_services_update_own" ON public.artisan_services;
      CREATE POLICY "artisan_services_update_own"
        ON public.artisan_services
        FOR UPDATE
        USING (
          auth.uid() IN (
            SELECT user_id FROM public.artisan_profiles WHERE id = artisan_profile_id
          )
        )
        WITH CHECK (
          auth.uid() IN (
            SELECT user_id FROM public.artisan_profiles WHERE id = artisan_profile_id
          )
        );
    ';
  END IF;

  -- Users can delete their own services
  IF artisan_column = 'artisan_id' THEN
    EXECUTE '
      DROP POLICY IF EXISTS "artisan_services_delete_own" ON public.artisan_services;
      CREATE POLICY "artisan_services_delete_own"
        ON public.artisan_services
        FOR DELETE
        USING (auth.uid() = artisan_id);
    ';
  ELSE
    EXECUTE '
      DROP POLICY IF EXISTS "artisan_services_delete_own" ON public.artisan_services;
      CREATE POLICY "artisan_services_delete_own"
        ON public.artisan_services
        FOR DELETE
        USING (
          auth.uid() IN (
            SELECT user_id FROM public.artisan_profiles WHERE id = artisan_profile_id
          )
        );
    ';
  END IF;

  -- Admins can manage all services
  EXECUTE '
    DROP POLICY IF EXISTS "artisan_services_admin_all" ON public.artisan_services;
    CREATE POLICY "artisan_services_admin_all"
      ON public.artisan_services
      FOR ALL
      USING (
        auth.uid() IN (
          SELECT user_id FROM public.admins WHERE is_active = true
        )
      );
  ';

  RAISE NOTICE '✅ Artisan services policies configured with column: %', artisan_column;
END $$;

\echo ''

-- =====================================================
-- STEP 4: Create Profile Trigger (if missing)
-- =====================================================
\echo 'STEP 4: Ensuring profile auto-creation trigger exists...'

-- Function to auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'user_role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

\echo '✅ Profile auto-creation trigger configured'
\echo ''

-- =====================================================
-- STEP 5: Reload PostgREST Schema
-- =====================================================
\echo 'STEP 5: Reloading PostgREST schema cache...'

NOTIFY pgrst, 'reload schema';

\echo '✅ PostgREST schema reloaded'
\echo ''

-- =====================================================
-- STEP 6: Create Orphaned Records Cleanup
-- =====================================================
\echo 'STEP 6: Checking for orphaned records...'

-- Count users without profiles
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
  );

  IF orphaned_count > 0 THEN
    RAISE NOTICE 'Found % users without profiles', orphaned_count;
    
    -- Create missing profiles
    INSERT INTO public.profiles (id, email, full_name, user_role)
    SELECT 
      u.id,
      u.email,
      COALESCE(u.raw_user_meta_data->>'full_name', u.email),
      COALESCE(u.raw_user_meta_data->>'user_role', 'user')
    FROM auth.users u
    WHERE NOT EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = u.id
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE '✅ Created % missing profiles', orphaned_count;
  ELSE
    RAISE NOTICE '✅ No orphaned users found';
  END IF;
END $$;

\echo ''

-- =====================================================
-- SUMMARY
-- =====================================================
\echo '=================================================='
\echo 'PRODUCTION FIX COMPLETE'
\echo '=================================================='
\echo ''
\echo 'Summary:'
\echo '✅ RLS enabled on all critical tables'
\echo '✅ Foreign key relationships validated'
\echo '✅ Minimal working RLS policies created'
\echo '✅ Profile auto-creation trigger configured'
\echo '✅ PostgREST schema reloaded'
\echo '✅ Orphaned records checked and fixed'
\echo ''
\echo 'Next steps:'
\echo '1. Test user signup → profile creation'
\echo '2. Test property creation'
\echo '3. Test artisan profile creation'
\echo '4. Verify frontend error logging'
\echo ''
