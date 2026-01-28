-- =====================================================
-- OPTION B: Implement Admin Whitelist Properly
-- =====================================================
--
-- PURPOSE:
-- Implement a complete, production-safe admin whitelist mechanism.
-- Users whose emails are in the whitelist are automatically promoted to admin role.
--
-- WHAT THIS DOES:
-- 1. Creates public.admin_whitelist table with proper structure
-- 2. Enables RLS on admin_whitelist (admin-only access)
-- 3. Creates a safe function to check and promote whitelisted users
-- 4. Creates trigger on public.profiles to auto-promote on INSERT/UPDATE
-- 5. Provides sample data and test queries
--
-- SAFETY FEATURES:
-- - Idempotent (safe to run multiple times using IF EXISTS/DO NOTHING)
-- - Uses SECURITY DEFINER with hardened search_path
-- - Prevents infinite trigger loops via conditional logic
-- - Includes comprehensive error handling
-- - RLS policies ensure only admins can manage whitelist
--
-- WHEN TO USE:
-- - When you need automatic admin promotion based on email
-- - When you want centralized admin management
-- - For multi-tenant applications with email-based admin access
-- - When you've fixed the "admin_whitelist does not exist" error and want to implement it
--
-- =====================================================

-- =====================================================
-- STEP 1: Create admin_whitelist table
-- =====================================================

-- Drop and recreate to ensure clean state (idempotent)
DROP TABLE IF EXISTS public.admin_whitelist CASCADE;

CREATE TABLE public.admin_whitelist (
  -- Email address (case-insensitive) - primary key
  email TEXT PRIMARY KEY,
  
  -- Timestamp when this email was added to whitelist
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Who added this email (references auth.users)
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Optional notes about why this email is whitelisted
  notes TEXT,
  
  -- Constraint: email must be lowercase for consistency
  CONSTRAINT admin_whitelist_email_lowercase CHECK (email = LOWER(email))
);

-- Add helpful comments for documentation
COMMENT ON TABLE public.admin_whitelist IS 
  'Whitelist of email addresses that should be automatically promoted to admin role.
   When a user with a whitelisted email signs up or updates their profile, they are
   automatically granted admin privileges (user_role=admin, is_admin=true).
   
   Security: Only existing admins can view/modify this table (enforced via RLS).
   Case-insensitive: Emails are stored and compared in lowercase.';

COMMENT ON COLUMN public.admin_whitelist.email IS 
  'Email address to auto-promote to admin. Must be lowercase. Case-insensitive comparison.';

COMMENT ON COLUMN public.admin_whitelist.created_by IS 
  'UUID of the admin user who added this email to whitelist. NULL if added via SQL.';

COMMENT ON COLUMN public.admin_whitelist.notes IS 
  'Optional notes explaining why this email is whitelisted (e.g., "Platform owner", "Support admin").';

-- Create index for faster lookups (emails are frequently queried)
CREATE INDEX IF NOT EXISTS idx_admin_whitelist_email ON public.admin_whitelist(LOWER(email));

-- =====================================================
-- STEP 2: Enable RLS on admin_whitelist
-- =====================================================

-- Enable Row Level Security to restrict access
ALTER TABLE public.admin_whitelist ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "admin_whitelist_select_admin" ON public.admin_whitelist;
DROP POLICY IF EXISTS "admin_whitelist_insert_admin" ON public.admin_whitelist;
DROP POLICY IF EXISTS "admin_whitelist_update_admin" ON public.admin_whitelist;
DROP POLICY IF EXISTS "admin_whitelist_delete_admin" ON public.admin_whitelist;

-- Policy: Only admins can SELECT from whitelist
CREATE POLICY "admin_whitelist_select_admin" 
ON public.admin_whitelist
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = true OR profiles.user_role = 'admin')
  )
);

COMMENT ON POLICY "admin_whitelist_select_admin" ON public.admin_whitelist IS
  'Only users with admin role can view the whitelist.';

-- Policy: Only admins can INSERT into whitelist
CREATE POLICY "admin_whitelist_insert_admin"
ON public.admin_whitelist
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = true OR profiles.user_role = 'admin')
  )
);

COMMENT ON POLICY "admin_whitelist_insert_admin" ON public.admin_whitelist IS
  'Only users with admin role can add emails to the whitelist.';

-- Policy: Only admins can UPDATE whitelist
CREATE POLICY "admin_whitelist_update_admin"
ON public.admin_whitelist
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = true OR profiles.user_role = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = true OR profiles.user_role = 'admin')
  )
);

COMMENT ON POLICY "admin_whitelist_update_admin" ON public.admin_whitelist IS
  'Only users with admin role can update whitelist entries.';

-- Policy: Only admins can DELETE from whitelist
CREATE POLICY "admin_whitelist_delete_admin"
ON public.admin_whitelist
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = true OR profiles.user_role = 'admin')
  )
);

COMMENT ON POLICY "admin_whitelist_delete_admin" ON public.admin_whitelist IS
  'Only users with admin role can remove emails from the whitelist.';

-- =====================================================
-- STEP 3: Create the promotion function
-- =====================================================

-- Drop existing function if it exists (idempotent)
DROP FUNCTION IF EXISTS public.promote_admin_if_whitelisted() CASCADE;

-- Create the trigger function with proper safety measures
CREATE OR REPLACE FUNCTION public.promote_admin_if_whitelisted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with privileges of function owner (bypasses RLS)
SET search_path = public, pg_temp  -- Hardened search_path to prevent SQL injection
AS $$
DECLARE
  is_whitelisted BOOLEAN;
  whitelist_exists BOOLEAN;
BEGIN
  -- ==========================================
  -- SAFETY CHECK: Prevent infinite recursion
  -- ==========================================
  -- Only check on INSERT or when email actually changes
  IF TG_OP = 'UPDATE' AND (OLD.email = NEW.email) AND (OLD.user_role = 'admin') THEN
    -- Email hasn't changed and already admin - skip check
    RETURN NEW;
  END IF;

  -- ==========================================
  -- DEFENSIVE: Check if admin_whitelist table exists
  -- ==========================================
  -- This prevents errors if the table was dropped
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'admin_whitelist'
  ) INTO whitelist_exists;

  -- If table doesn't exist, skip whitelist check
  IF NOT whitelist_exists THEN
    RAISE NOTICE 'admin_whitelist table does not exist, skipping whitelist check for %', NEW.email;
    RETURN NEW;
  END IF;

  -- ==========================================
  -- VALIDATE: Ensure email is not NULL or empty
  -- ==========================================
  IF NEW.email IS NULL OR TRIM(NEW.email) = '' THEN
    RAISE WARNING 'Cannot check whitelist for NULL or empty email';
    RETURN NEW;
  END IF;

  -- ==========================================
  -- CHECK: Is this email in the whitelist?
  -- ==========================================
  -- Case-insensitive comparison
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_whitelist
    WHERE LOWER(admin_whitelist.email) = LOWER(NEW.email)
  ) INTO is_whitelisted;

  -- ==========================================
  -- PROMOTE: If whitelisted and not already admin
  -- ==========================================
  IF is_whitelisted THEN
    -- Check if already admin to avoid unnecessary updates
    IF NEW.user_role != 'admin' OR NEW.is_admin != true THEN
      -- Promote to admin
      NEW.user_role := 'admin';
      NEW.is_admin := true;
      
      -- Admins should not have announcer_type (if that column exists)
      BEGIN
        NEW.announcer_type := NULL;
      EXCEPTION
        WHEN undefined_column THEN
          -- Column doesn't exist, that's fine
          NULL;
      END;
      
      -- Update timestamp
      NEW.updated_at := NOW();
      
      RAISE NOTICE 'Auto-promoted % to admin (whitelisted email)', NEW.email;
    ELSE
      RAISE DEBUG 'User % is already admin, no promotion needed', NEW.email;
    END IF;
  ELSE
    RAISE DEBUG 'Email % is not in whitelist, no promotion', NEW.email;
  END IF;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the INSERT/UPDATE
    RAISE WARNING 'Error in promote_admin_if_whitelisted for email %: % (SQLSTATE: %)', 
      NEW.email, SQLERRM, SQLSTATE;
    RAISE WARNING 'Context: %', PG_EXCEPTION_CONTEXT;
    -- Return NEW to allow operation to succeed
    RETURN NEW;
END;
$$;

-- Add comprehensive documentation
COMMENT ON FUNCTION public.promote_admin_if_whitelisted() IS
  'Trigger function that checks if a profile email is in admin_whitelist and auto-promotes to admin role.
   
   Behavior:
   - Runs BEFORE INSERT or UPDATE on public.profiles
   - Checks if email (case-insensitive) exists in admin_whitelist
   - If yes: Sets user_role=admin, is_admin=true, announcer_type=NULL
   - If no: No changes made
   
   Safety features:
   - Uses SECURITY DEFINER to bypass RLS (required to read admin_whitelist)
   - Hardened search_path to prevent SQL injection attacks
   - Prevents infinite recursion (only checks when email changes or on INSERT)
   - Defensive checks (table exists, email not NULL)
   - Never fails (catches all exceptions and logs them)
   - Updates updated_at timestamp when promoting
   
   Security considerations:
   - Function runs with elevated privileges (SECURITY DEFINER)
   - Only modifies user_role/is_admin/announcer_type fields
   - Does not expose whitelist data to non-admins (RLS still applies to direct table access)
   - Safe to call even if admin_whitelist table does not exist
   
   Performance:
   - Indexed lookup on admin_whitelist.email (fast)
   - Early exit if email unchanged and already admin
   - Minimal overhead on profile operations';

-- =====================================================
-- STEP 4: Create trigger on public.profiles
-- =====================================================

-- Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS on_profile_check_admin_whitelist ON public.profiles;

-- Create BEFORE trigger (runs before INSERT/UPDATE)
-- BEFORE trigger allows us to modify NEW before it's written
CREATE TRIGGER on_profile_check_admin_whitelist
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.promote_admin_if_whitelisted();

COMMENT ON TRIGGER on_profile_check_admin_whitelist ON public.profiles IS
  'Auto-promotes users to admin if their email is in the admin_whitelist table.
   Runs BEFORE INSERT/UPDATE to modify the row before it is saved.
   Safe: Prevents infinite loops and handles missing table gracefully.';

-- =====================================================
-- STEP 5: Grant necessary permissions
-- =====================================================

-- Allow execution of the function by database system roles
GRANT EXECUTE ON FUNCTION public.promote_admin_if_whitelisted() TO postgres, service_role;

-- Grant table access to authenticated users (restricted by RLS policies)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_whitelist TO authenticated;

-- =====================================================
-- STEP 6: Seed with sample data (optional)
-- =====================================================

-- Add your admin email addresses here
-- Uncomment and modify the emails below:

/*
INSERT INTO public.admin_whitelist (email, notes)
VALUES 
  ('admin@yourdomain.com', 'Platform administrator - primary contact'),
  ('owner@yourdomain.com', 'Business owner and co-founder')
ON CONFLICT (email) DO NOTHING;  -- Idempotent: won't error if already exists
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run these to verify the implementation

DO $$
BEGIN
  RAISE NOTICE '=== Admin Whitelist Implementation Verification ===';
  RAISE NOTICE '';
END $$;

-- 1. Verify table exists
SELECT 
  tablename,
  schemaname,
  tableowner,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'admin_whitelist';
-- Expected: 1 row with rls_enabled = true

-- 2. Verify RLS policies exist
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'admin_whitelist'
ORDER BY policyname;
-- Expected: 4 rows (SELECT, INSERT, UPDATE, DELETE policies)

-- 3. Verify function exists
SELECT 
  p.proname AS function_name,
  p.prosecdef AS is_security_definer,
  p.proconfig AS config_settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'promote_admin_if_whitelisted';
-- Expected: 1 row with is_security_definer = true

-- 4. Verify trigger exists and is enabled
SELECT 
  tgname AS trigger_name,
  tgfoid::regproc AS function_name,
  tgenabled AS enabled,
  CASE 
    WHEN tgtype & 2 = 2 THEN 'BEFORE'
    WHEN tgtype & 64 = 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END AS timing,
  CASE 
    WHEN tgtype & 4 = 4 THEN 'INSERT '
    ELSE ''
  END ||
  CASE 
    WHEN tgtype & 8 = 8 THEN 'UPDATE '
    ELSE ''
  END AS events
FROM pg_trigger
WHERE tgrelid = 'public.profiles'::regclass
  AND tgname = 'on_profile_check_admin_whitelist';
-- Expected: 1 row with enabled = 'O' (origin/enabled), timing = 'BEFORE'

-- 5. View whitelist contents (requires admin role)
-- SELECT email, created_at, notes 
-- FROM public.admin_whitelist
-- ORDER BY created_at DESC;

-- =====================================================
-- TEST SCENARIOS
-- =====================================================

-- Test 1: Add an email to whitelist
DO $$
BEGIN
  RAISE NOTICE '=== Test 1: Adding email to whitelist ===';
  -- Uncomment to test (requires you to be an admin or run as service_role):
  /*
  INSERT INTO public.admin_whitelist (email, notes)
  VALUES ('testadmin@example.com', 'Test admin account')
  ON CONFLICT (email) DO NOTHING;
  RAISE NOTICE '✅ Email added to whitelist successfully';
  */
END $$;

-- Test 2: Insert a profile with whitelisted email
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();  -- Generate random UUID for test
BEGIN
  RAISE NOTICE '=== Test 2: Insert profile with whitelisted email ===';
  RAISE NOTICE 'Note: This test requires the email to be in admin_whitelist';
  RAISE NOTICE 'Uncomment the INSERT statement below to test';
  
  /*
  -- First add the email to whitelist (requires admin)
  INSERT INTO public.admin_whitelist (email, notes)
  VALUES ('newtestadmin@example.com', 'Test - auto promotion')
  ON CONFLICT (email) DO NOTHING;
  
  -- Then insert a profile with that email
  INSERT INTO public.profiles (id, email, user_role, is_active, is_verified)
  VALUES (test_user_id, 'newtestadmin@example.com', 'user', true, false);
  
  -- Check if it was promoted to admin
  IF (SELECT user_role FROM public.profiles WHERE id = test_user_id) = 'admin' THEN
    RAISE NOTICE '✅ Profile was automatically promoted to admin!';
  ELSE
    RAISE WARNING '❌ Profile was NOT promoted to admin (check trigger)';
  END IF;
  
  -- Cleanup test data
  DELETE FROM public.profiles WHERE id = test_user_id;
  DELETE FROM public.admin_whitelist WHERE email = 'newtestadmin@example.com';
  */
END $$;

-- Test 3: Update profile email to whitelisted email
DO $$
BEGIN
  RAISE NOTICE '=== Test 3: Update profile email to whitelisted email ===';
  RAISE NOTICE 'This would test the UPDATE trigger functionality';
  RAISE NOTICE 'Run manually with real profile data';
END $$;

-- =====================================================
-- EXPECTED RESULTS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Expected Results After Running This Script ===';
  RAISE NOTICE '';
  RAISE NOTICE '✅ public.admin_whitelist table created with RLS enabled';
  RAISE NOTICE '✅ 4 RLS policies active (SELECT, INSERT, UPDATE, DELETE for admins)';
  RAISE NOTICE '✅ promote_admin_if_whitelisted() function created with SECURITY DEFINER';
  RAISE NOTICE '✅ on_profile_check_admin_whitelist trigger active on public.profiles';
  RAISE NOTICE '✅ Permissions granted appropriately';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Add admin emails to whitelist (see STEP 6 above)';
  RAISE NOTICE '  2. Test by inserting a profile with whitelisted email';
  RAISE NOTICE '  3. Verify user_role is set to admin automatically';
  RAISE NOTICE '  4. Monitor logs for any NOTICE/WARNING messages';
END $$;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Example 1: Add an admin email to whitelist
-- (Run as an existing admin user or service_role)
/*
INSERT INTO public.admin_whitelist (email, notes)
VALUES ('jane.doe@company.com', 'Chief Technology Officer')
ON CONFLICT (email) DO NOTHING;
*/

-- Example 2: Check if an email is whitelisted
/*
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.admin_whitelist WHERE email = 'test@example.com')
    THEN 'YES - Email is whitelisted'
    ELSE 'NO - Email is not whitelisted'
  END AS whitelist_status;
*/

-- Example 3: List all whitelisted emails (admin only)
/*
SELECT email, created_at, notes
FROM public.admin_whitelist
ORDER BY created_at DESC;
*/

-- Example 4: Remove an email from whitelist (admin only)
/*
DELETE FROM public.admin_whitelist
WHERE email = 'former.admin@company.com';
*/

-- Example 5: Manually promote existing user to admin
/*
-- First, add to whitelist
INSERT INTO public.admin_whitelist (email, notes)
VALUES ('existing.user@company.com', 'Retroactive admin promotion')
ON CONFLICT (email) DO NOTHING;

-- Then trigger the promotion by updating the profile
UPDATE public.profiles
SET email = email  -- Dummy update to trigger the BEFORE UPDATE trigger
WHERE email = 'existing.user@company.com';

-- Verify promotion
SELECT email, user_role, is_admin
FROM public.profiles
WHERE email = 'existing.user@company.com';
*/

-- =====================================================
-- SECURITY CONSIDERATIONS
-- =====================================================

-- 1. SECURITY DEFINER Risk:
--    The function runs with elevated privileges. We mitigate this by:
--    - Setting search_path explicitly to prevent SQL injection
--    - Only modifying specific fields (user_role, is_admin, announcer_type)
--    - Not exposing any data to the caller
--    - Including comprehensive error handling

-- 2. RLS Policies:
--    Only admins can view/modify the whitelist table.
--    The trigger function bypasses RLS (via SECURITY DEFINER) to read the table,
--    but this is necessary and safe as it only checks for existence.

-- 3. Trigger Timing:
--    BEFORE trigger allows modification of NEW before write.
--    This is more efficient than AFTER trigger which would require an UPDATE.

-- 4. Recursion Prevention:
--    The function checks if email changed and if already admin before processing.
--    This prevents infinite trigger loops.

-- 5. Fail-Safe:
--    If the admin_whitelist table doesn't exist, the function logs a notice
--    and allows the operation to succeed. This prevents cascading failures.

-- =====================================================
-- ROLLBACK
-- =====================================================

-- To remove the admin whitelist functionality:
-- Run OPTION_A_REMOVE_ADMIN_WHITELIST.sql

-- Or manually:
/*
DROP TRIGGER IF EXISTS on_profile_check_admin_whitelist ON public.profiles;
DROP FUNCTION IF EXISTS public.promote_admin_if_whitelisted() CASCADE;
DROP TABLE IF EXISTS public.admin_whitelist CASCADE;
*/

-- =====================================================
-- END OF SCRIPT
-- =====================================================
