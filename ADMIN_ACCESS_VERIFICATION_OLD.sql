-- =====================================================
-- Admin Access Fix - Verification Queries
-- =====================================================
-- Run these queries to verify the admin authentication fix
-- =====================================================

-- =====================================================
-- 1. VERIFY MIGRATION APPLIED
-- =====================================================

-- Check if is_active column exists
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'admins'
ORDER BY ordinal_position;

-- Expected columns: user_id, created_at, is_active, role

-- =====================================================
-- 2. VERIFY RPC FUNCTION EXISTS
-- =====================================================

-- Check is_admin() function
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname = 'is_admin' 
  AND pronamespace = 'public'::regnamespace;

-- Check check_is_admin() function
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname = 'check_is_admin' 
  AND pronamespace = 'public'::regnamespace;

-- =====================================================
-- 3. LIST ALL ADMINS
-- =====================================================

-- Show all admins with their details
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created,
  u.email_confirmed_at,
  u.last_sign_in_at,
  a.role,
  a.is_active,
  a.created_at as admin_since,
  CASE 
    WHEN a.is_active THEN '✅ Active'
    ELSE '❌ Inactive'
  END as status
FROM public.admins a
JOIN auth.users u ON a.user_id = u.id
ORDER BY a.created_at DESC;

-- =====================================================
-- 4. CHECK SPECIFIC USER ADMIN STATUS
-- =====================================================

-- Replace 'user@example.com' with actual email
SELECT 
  u.id,
  u.email,
  EXISTS(
    SELECT 1 FROM public.admins 
    WHERE user_id = u.id
  ) as in_admins_table,
  EXISTS(
    SELECT 1 FROM public.admins 
    WHERE user_id = u.id AND is_active = TRUE
  ) as is_active_admin,
  (SELECT role FROM public.admins WHERE user_id = u.id) as admin_role,
  p.user_role as profile_role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'contact@topaffaireimmo.com';  -- Replace with your email

-- =====================================================
-- 5. TEST is_admin() RPC FUNCTION
-- =====================================================

-- This will return TRUE if you're currently logged in as admin
-- Run this from Supabase SQL Editor while authenticated as the user
SELECT public.is_admin() as am_i_admin;

-- Test the frontend-friendly wrapper
SELECT * FROM public.check_is_admin();

-- =====================================================
-- 6. VERIFY RLS POLICIES USING is_admin()
-- =====================================================

-- Check which policies use the is_admin() function
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual LIKE '%is_admin%' OR with_check LIKE '%is_admin%')
ORDER BY tablename, policyname;

-- =====================================================
-- 7. GRANT ADMIN ACCESS TO USER
-- =====================================================

-- OPTION 1: Add new admin
-- INSERT INTO public.admins (user_id, is_active, role)
-- VALUES ('user-uuid-here', TRUE, 'admin');

-- OPTION 2: Add admin by email (safer)
-- INSERT INTO public.admins (user_id, is_active, role)
-- SELECT id, TRUE, 'admin'
-- FROM auth.users
-- WHERE email = 'admin@example.com'
-- ON CONFLICT (user_id) DO UPDATE
-- SET is_active = TRUE, role = 'admin';

-- OPTION 3: Reactivate existing admin
-- UPDATE public.admins 
-- SET is_active = TRUE 
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');

-- =====================================================
-- 8. REVOKE ADMIN ACCESS
-- =====================================================

-- OPTION 1: Temporarily disable (recommended)
-- UPDATE public.admins 
-- SET is_active = FALSE 
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');

-- OPTION 2: Permanently remove
-- DELETE FROM public.admins 
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');

-- =====================================================
-- 9. AUDIT: Find users who might need migration
-- =====================================================

-- Users with user_role='admin' in profiles but NOT in admins table
SELECT 
  p.id,
  u.email,
  p.user_role,
  'Missing from admins table' as issue
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.user_role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.admins a WHERE a.user_id = p.id
  );

-- Users with is_admin=true in profiles but NOT in admins table
SELECT 
  p.id,
  u.email,
  p.is_admin,
  'Missing from admins table' as issue
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.is_admin = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM public.admins a WHERE a.user_id = p.id
  );

-- =====================================================
-- 10. MIGRATE OLD ADMIN USERS
-- =====================================================

-- Migrate users from profiles.user_role to admins table
-- INSERT INTO public.admins (user_id, is_active, role)
-- SELECT id, TRUE, 'admin'
-- FROM profiles 
-- WHERE user_role = 'admin'
-- ON CONFLICT (user_id) DO UPDATE
-- SET is_active = TRUE, role = 'admin';

-- Migrate users from profiles.is_admin to admins table
-- INSERT INTO public.admins (user_id, is_active, role)
-- SELECT id, TRUE, 'admin'
-- FROM profiles 
-- WHERE is_admin = TRUE
-- ON CONFLICT (user_id) DO UPDATE
-- SET is_active = TRUE, role = 'admin';

-- =====================================================
-- 11. PERFORMANCE CHECK
-- =====================================================

-- Check if index exists on is_active
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'admins'
  AND indexname LIKE '%is_active%';

-- Analyze query performance for is_admin check
EXPLAIN ANALYZE
SELECT EXISTS (
  SELECT 1 
  FROM public.admins 
  WHERE user_id = '00000000-0000-0000-0000-000000000000'  -- Replace with real UUID
    AND is_active = TRUE
);

-- =====================================================
-- 12. COUNT STATISTICS
-- =====================================================

-- Summary statistics
SELECT 
  COUNT(*) as total_admins,
  COUNT(*) FILTER (WHERE is_active = TRUE) as active_admins,
  COUNT(*) FILTER (WHERE is_active = FALSE) as inactive_admins,
  COUNT(*) FILTER (WHERE role = 'admin') as regular_admins,
  COUNT(*) FILTER (WHERE role = 'super_admin') as super_admins
FROM public.admins;

-- =====================================================
-- 13. RECENT ADMIN ACTIVITY
-- =====================================================

-- Show recent sign-ins by admin users
SELECT 
  u.email,
  u.last_sign_in_at,
  a.role,
  a.is_active,
  u.confirmed_at as email_confirmed
FROM public.admins a
JOIN auth.users u ON a.user_id = u.id
WHERE a.is_active = TRUE
ORDER BY u.last_sign_in_at DESC NULLS LAST
LIMIT 10;

-- =====================================================
-- 14. SECURITY AUDIT
-- =====================================================

-- Check for admins with unconfirmed emails
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  a.role,
  a.is_active,
  '⚠️ Unconfirmed email' as warning
FROM public.admins a
JOIN auth.users u ON a.user_id = u.id
WHERE a.is_active = TRUE
  AND u.email_confirmed_at IS NULL;

-- Check for admins who never signed in
SELECT 
  u.id,
  u.email,
  u.last_sign_in_at,
  a.role,
  a.is_active,
  a.created_at as admin_since,
  '⚠️ Never signed in' as warning
FROM public.admins a
JOIN auth.users u ON a.user_id = u.id
WHERE a.is_active = TRUE
  AND u.last_sign_in_at IS NULL;

-- =====================================================
-- 15. CLEANUP OLD ADMIN CHECKS (Optional)
-- =====================================================

-- This section is for reference only - DO NOT RUN unless you want to
-- remove the old admin checking fields from profiles table

-- WARNING: These queries modify the profiles table structure
-- Only run if you're sure you don't need backward compatibility

-- Remove is_admin column from profiles (if exists)
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin;

-- Change user_role check constraint to exclude 'admin' value
-- ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_role_check;
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_role_check 
--   CHECK (user_role IN ('user', 'real_estate_advertiser', 'commercial_advertiser', 'artisan', 'advertiser'));

-- =====================================================
-- VERIFICATION COMPLETE
-- =====================================================

-- Final verification checklist:
SELECT 
  'Migration Applied' as check_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admins' AND column_name = 'is_active'
  ) as passed
UNION ALL
SELECT 
  'RPC Function Exists',
  EXISTS(
    SELECT 1 FROM pg_proc 
    WHERE proname = 'is_admin' AND pronamespace = 'public'::regnamespace
  )
UNION ALL
SELECT 
  'At Least One Active Admin',
  EXISTS(
    SELECT 1 FROM public.admins WHERE is_active = TRUE
  )
UNION ALL
SELECT 
  'Index on is_active',
  EXISTS(
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'admins' AND indexname LIKE '%is_active%'
  );

-- =====================================================
-- END OF VERIFICATION QUERIES
-- =====================================================
