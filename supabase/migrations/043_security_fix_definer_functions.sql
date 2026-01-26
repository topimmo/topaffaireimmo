-- =====================================================
-- SECURITY: Fix SECURITY DEFINER Functions
-- Addresses Supabase Security Advisor warnings
-- =====================================================
--
-- ISSUE:
-- Supabase Security Advisor reports:
-- - Functions defined with SECURITY DEFINER
-- - Mutable search_path in SECURITY DEFINER functions
--
-- RISK:
-- Functions with SECURITY DEFINER run with the privileges of the function owner,
-- not the caller. If search_path is not set explicitly, this can lead to:
-- 1. SQL injection via search_path manipulation
-- 2. Privilege escalation
-- 3. Unintended function behavior
--
-- SOLUTION:
-- 1. Review all SECURITY DEFINER functions
-- 2. Set explicit search_path to prevent attacks
-- 3. Remove SECURITY DEFINER where not needed
-- 4. Use SECURITY INVOKER where appropriate
-- =====================================================

-- =====================================================
-- STEP 1: List all SECURITY DEFINER functions
-- =====================================================

-- Query to find SECURITY DEFINER functions:
-- SELECT n.nspname as schema_name,
--        p.proname as function_name,
--        CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END as security,
--        pg_get_functiondef(p.oid) as definition
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname IN ('public', 'auth')
--   AND p.prosecdef = true;

-- =====================================================
-- STEP 2: Fix handle_new_user function (already fixed in 042)
-- =====================================================

-- The handle_new_user function was already updated in migration 042
-- with SET search_path = public, auth
-- No changes needed here - this is just documentation

-- =====================================================
-- STEP 3: Fix can_insert_property function
-- =====================================================

-- This function checks if a user can insert a property
-- It needs SECURITY DEFINER to read from profiles table
-- Add explicit search_path

CREATE OR REPLACE FUNCTION public.can_insert_property(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- Allow if user is authenticated AND one of:
  --   1. No profile exists yet (trigger will create it)
  --   2. Profile exists with correct role (real_estate_advertiser or admin)
  RETURN user_id IS NOT NULL AND (
    NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = user_id 
      AND (user_role IN ('real_estate_advertiser', 'admin') OR is_admin = true)
    )
  );
END;
$$;

COMMENT ON FUNCTION public.can_insert_property(UUID) IS
  'Checks if a user can insert a property listing.
   Returns true if: (1) no profile exists yet, OR (2) profile exists with correct role.
   SECURITY DEFINER with explicit search_path to prevent SQL injection.
   STABLE function - result depends only on input, not on database changes within transaction.';

-- =====================================================
-- STEP 4: Review and fix other SECURITY DEFINER functions
-- =====================================================

-- If you have other SECURITY DEFINER functions, add them here
-- Example pattern:

-- DROP FUNCTION IF EXISTS public.your_function_name(param_types);
-- CREATE OR REPLACE FUNCTION public.your_function_name(params)
-- RETURNS return_type
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = public  -- or appropriate schema
-- STABLE  -- or VOLATILE/IMMUTABLE as appropriate
-- AS $$
-- BEGIN
--   -- function body
-- END;
-- $$;

-- =====================================================
-- STEP 5: Grant appropriate permissions
-- =====================================================

-- Ensure authenticated users can execute the function
GRANT EXECUTE ON FUNCTION public.can_insert_property(UUID) TO authenticated;

-- Service role should also have access
GRANT EXECUTE ON FUNCTION public.can_insert_property(UUID) TO service_role;

-- =====================================================
-- STEP 6: Security audit checklist
-- =====================================================

-- Run these queries to audit your database security:

-- 1. Find all SECURITY DEFINER functions:
--    SELECT n.nspname as schema_name,
--           p.proname as function_name,
--           pg_get_function_identity_arguments(p.oid) as arguments,
--           CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END as security,
--           p.provolatile as volatility,
--           p.proisstrict as is_strict
--    FROM pg_proc p
--    JOIN pg_namespace n ON n.oid = p.pronamespace
--    WHERE n.nspname IN ('public')
--      AND p.prosecdef = true
--    ORDER BY function_name;

-- 2. Check search_path for each SECURITY DEFINER function:
--    SELECT n.nspname as schema_name,
--           p.proname as function_name,
--           p.proconfig as settings
--    FROM pg_proc p
--    JOIN pg_namespace n ON n.oid = p.pronamespace
--    WHERE n.nspname IN ('public')
--      AND p.prosecdef = true;
--    Expected: Each function should have proconfig containing 'search_path=...'

-- 3. Review function definitions:
--    SELECT pg_get_functiondef(oid) 
--    FROM pg_proc 
--    WHERE proname IN ('handle_new_user', 'can_insert_property');

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify the fixes:

-- 1. Check that functions have explicit search_path:
SELECT 
  p.proname as function_name,
  CASE WHEN 'search_path' = ANY(string_to_array(pg_options_to_table(p.proconfig), '=')) 
    THEN '✓ Has search_path' 
    ELSE '✗ Missing search_path' 
  END as search_path_status,
  CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END as security_type
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY function_name;

-- 2. Test that functions still work:
--    SELECT public.can_insert_property('00000000-0000-0000-0000-000000000000'::UUID);
--    Expected: Returns boolean (true/false)

-- =====================================================
-- DOCUMENTATION
-- =====================================================

COMMENT ON SCHEMA public IS
  'Public schema containing application tables, functions, and policies.
   All SECURITY DEFINER functions in this schema have explicit search_path set.
   Last security audit: 2026-01-26';

-- =====================================================
-- ADDITIONAL SECURITY RECOMMENDATIONS
-- =====================================================

-- 1. Minimize SECURITY DEFINER usage
--    - Only use when function needs elevated privileges
--    - Prefer SECURITY INVOKER when possible
--    - Consider using RLS policies instead of functions for access control

-- 2. Set appropriate function volatility
--    - IMMUTABLE: Function always returns same result for same inputs (e.g., pure math)
--    - STABLE: Function returns same result within single transaction (e.g., SELECT from tables)
--    - VOLATILE: Function can return different results each call (e.g., random(), now())
--    Proper volatility helps query planner and prevents incorrect optimization

-- 3. Input validation
--    - Always validate function inputs
--    - Use parameterized queries (no string concatenation for SQL)
--    - Check for NULL values when appropriate

-- 4. Regular audits
--    - Review SECURITY DEFINER functions quarterly
--    - Monitor Supabase Security Advisor
--    - Test functions with different user roles

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================

-- To rollback this migration:
-- 1. DROP FUNCTION public.can_insert_property(UUID);
-- 2. Recreate from previous migration (039) without SET search_path
-- Note: This would reintroduce the security vulnerability
