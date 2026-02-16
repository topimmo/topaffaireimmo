-- =====================================================
-- Migration 117: Diagnostic for Admin Authentication
-- =====================================================
-- Purpose: Diagnose admin login and password reset issues
-- Issue: Admin login fails, password reset shows error
-- Email: contact@topaffaireimmo.com
-- =====================================================

-- =====================================================
-- DIAGNOSTIC SECTION - Check Admin User Status
-- =====================================================

-- 1. Check if admin email exists in auth.users
DO $$
DECLARE
  user_exists BOOLEAN;
  user_uuid UUID;
  user_confirmed BOOLEAN;
  user_email_confirmed_at TIMESTAMPTZ;
BEGIN
  RAISE NOTICE '=== ADMIN USER EXISTENCE CHECK ===';
  
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'contact@topaffaireimmo.com'
  ) INTO user_exists;
  
  IF user_exists THEN
    SELECT id, email_confirmed_at IS NOT NULL, email_confirmed_at
    INTO user_uuid, user_confirmed, user_email_confirmed_at
    FROM auth.users 
    WHERE email = 'contact@topaffaireimmo.com';
    
    RAISE NOTICE '✓ User exists with UUID: %', user_uuid;
    RAISE NOTICE 'Email confirmed: %', user_confirmed;
    RAISE NOTICE 'Confirmed at: %', user_email_confirmed_at;
  ELSE
    RAISE WARNING '✗ User with email contact@topaffaireimmo.com NOT FOUND in auth.users';
    RAISE WARNING 'Admin user needs to be created!';
  END IF;
END $$;

-- 2. Check if admin is in admins table
DO $$
DECLARE
  is_admin BOOLEAN;
  admin_since TIMESTAMPTZ;
BEGIN
  RAISE NOTICE '=== ADMIN TABLE CHECK ===';
  
  SELECT EXISTS (
    SELECT 1 
    FROM public.admins a
    JOIN auth.users u ON a.user_id = u.id
    WHERE u.email = 'contact@topaffaireimmo.com'
  ) INTO is_admin;
  
  IF is_admin THEN
    SELECT a.created_at INTO admin_since
    FROM public.admins a
    JOIN auth.users u ON a.user_id = u.id
    WHERE u.email = 'contact@topaffaireimmo.com';
    
    RAISE NOTICE '✓ User is in admins table since: %', admin_since;
  ELSE
    RAISE WARNING '✗ User is NOT in admins table';
    RAISE WARNING 'Even if user exists, they do not have admin privileges!';
  END IF;
END $$;

-- 3. Check user metadata and role
SELECT 
  '=== AUTH USER DETAILS ===' as check_type,
  id as user_id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_sso_user,
  CASE 
    WHEN banned_until IS NOT NULL AND banned_until > NOW() THEN 'BANNED'
    WHEN email_confirmed_at IS NULL THEN 'UNCONFIRMED'
    ELSE 'ACTIVE'
  END as account_status
FROM auth.users
WHERE email = 'contact@topaffaireimmo.com';

-- 4. Check if user has any password set
DO $$
DECLARE
  has_password BOOLEAN;
BEGIN
  RAISE NOTICE '=== PASSWORD CHECK ===';
  
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'contact@topaffaireimmo.com'
    AND encrypted_password IS NOT NULL
    AND encrypted_password != ''
  ) INTO has_password;
  
  IF has_password THEN
    RAISE NOTICE '✓ User has a password hash set';
  ELSE
    RAISE WARNING '✗ User has NO password hash - cannot login with email/password!';
  END IF;
END $$;

-- 5. List all admins for reference
SELECT 
  '=== ALL ADMINS ===' as check_type,
  u.id,
  u.email,
  a.created_at as admin_since
FROM public.admins a
JOIN auth.users u ON a.user_id = u.id
ORDER BY a.created_at;

-- =====================================================
-- CONFIGURATION CHECKS
-- =====================================================

-- 6. Check platform settings
SELECT 
  '=== PLATFORM SETTINGS ===' as check_type,
  key,
  value
FROM public.platform_settings;

-- 7. Check if whitelist exists and admin is in it
DO $$
BEGIN
  RAISE NOTICE '=== EMAIL WHITELIST CHECK ===';
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_whitelist') THEN
    IF EXISTS (SELECT 1 FROM public.email_whitelist WHERE email = 'contact@topaffaireimmo.com') THEN
      RAISE NOTICE '✓ Admin email is in whitelist';
    ELSE
      RAISE WARNING '⚠ Admin email NOT in whitelist (may affect signup)';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ email_whitelist table does not exist';
  END IF;
END $$;

-- =====================================================
-- SUMMARY
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=== DIAGNOSTIC SUMMARY ===';
  RAISE NOTICE 'Run this diagnostic to check:';
  RAISE NOTICE '1. User existence in auth.users';
  RAISE NOTICE '2. Admin role in public.admins';
  RAISE NOTICE '3. Email confirmation status';
  RAISE NOTICE '4. Password hash existence';
  RAISE NOTICE '5. Account ban/block status';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run migration 118 to fix admin user issues';
END $$;

-- =====================================================
-- ADDITIONAL VERIFICATION QUERIES
-- =====================================================

-- Check for any auth-related issues
SELECT 
  '=== AUTH AUDIT LOG ===' as check_type,
  instance_id,
  created_at,
  ip_address,
  user_id
FROM auth.audit_log_entries
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'contact@topaffaireimmo.com')
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- END OF DIAGNOSTIC
-- =====================================================
