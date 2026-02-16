-- =====================================================
-- Migration 118: Fix Admin User Authentication (Production Safe)
-- =====================================================
-- Purpose: Ensure admin user exists and has proper access
-- Email: contact@topaffaireimmo.com
-- =====================================================

-- =====================================================
-- IMPORTANT: PRODUCTION SAFETY
-- =====================================================
-- This migration:
-- ✓ Does NOT drop any tables
-- ✓ Does NOT delete any users
-- ✓ Does NOT reset the database
-- ✓ Only ADDS admin privileges if missing
-- ✓ Does NOT modify existing data
-- =====================================================

-- =====================================================
-- STEP 1: Add admin to admins table if user exists
-- =====================================================

DO $$
DECLARE
  admin_user_id UUID;
  is_already_admin BOOLEAN;
BEGIN
  RAISE NOTICE '=== ADDING ADMIN PRIVILEGES ===';
  
  -- Get user ID for the admin email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'contact@topaffaireimmo.com';
  
  IF admin_user_id IS NULL THEN
    RAISE WARNING '⚠ User contact@topaffaireimmo.com does not exist in auth.users';
    RAISE WARNING '⚠ Admin user must be created via Supabase Auth dashboard or signup flow';
    RAISE WARNING '⚠ After user is created, run this migration again';
  ELSE
    -- Check if already an admin
    SELECT EXISTS (
      SELECT 1 FROM public.admins WHERE user_id = admin_user_id
    ) INTO is_already_admin;
    
    IF is_already_admin THEN
      RAISE NOTICE 'ℹ User is already an admin';
    ELSE
      -- Add to admins table
      INSERT INTO public.admins (user_id)
      VALUES (admin_user_id)
      ON CONFLICT (user_id) DO NOTHING;
      
      RAISE NOTICE '✓ Added user to admins table';
    END IF;
    
    -- Verify email is confirmed
    IF EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = admin_user_id 
      AND email_confirmed_at IS NULL
    ) THEN
      RAISE WARNING '⚠ Admin user email is NOT CONFIRMED';
      RAISE WARNING '⚠ User must confirm email or admin must confirm it manually';
    ELSE
      RAISE NOTICE '✓ Admin user email is confirmed';
    END IF;
  END IF;
END $$;

-- =====================================================
-- STEP 2: Ensure admin has proper metadata
-- =====================================================

-- Note: User metadata updates should be done through Supabase Dashboard
-- or Auth Admin API, not directly in SQL for security reasons

DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'contact@topaffaireimmo.com';
  
  IF admin_user_id IS NOT NULL THEN
    RAISE NOTICE '=== ADMIN USER INFO ===';
    RAISE NOTICE 'User ID: %', admin_user_id;
    RAISE NOTICE 'To update user metadata, use Supabase Dashboard:';
    RAISE NOTICE '1. Go to Authentication → Users';
    RAISE NOTICE '2. Find user: contact@topaffaireimmo.com';
    RAISE NOTICE '3. Click to edit';
    RAISE NOTICE '4. Confirm email if needed';
    RAISE NOTICE '5. Set password if needed';
  END IF;
END $$;

-- =====================================================
-- STEP 3: Verify admin setup
-- =====================================================

DO $$
DECLARE
  admin_count INTEGER;
  admin_email TEXT;
  admin_confirmed BOOLEAN;
BEGIN
  RAISE NOTICE '=== VERIFICATION ===';
  
  -- Count total admins
  SELECT COUNT(*) INTO admin_count FROM public.admins;
  RAISE NOTICE 'Total admins in system: %', admin_count;
  
  -- Check if our admin is set up correctly
  SELECT 
    u.email,
    u.email_confirmed_at IS NOT NULL
  INTO admin_email, admin_confirmed
  FROM public.admins a
  JOIN auth.users u ON a.user_id = u.id
  WHERE u.email = 'contact@topaffaireimmo.com';
  
  IF admin_email IS NOT NULL THEN
    RAISE NOTICE '✓ Admin user found: %', admin_email;
    IF admin_confirmed THEN
      RAISE NOTICE '✓ Email is confirmed';
    ELSE
      RAISE WARNING '⚠ Email needs confirmation';
    END IF;
  ELSE
    RAISE WARNING '✗ Admin user not properly set up';
  END IF;
END $$;

-- =====================================================
-- STEP 4: List all admins (for verification)
-- =====================================================

SELECT 
  '=== CURRENT ADMINS ===' as status,
  u.id as user_id,
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  u.created_at as user_created,
  a.created_at as admin_since
FROM public.admins a
JOIN auth.users u ON a.user_id = u.id
ORDER BY a.created_at;

-- =====================================================
-- MANUAL STEPS REQUIRED (If User Doesn't Exist)
-- =====================================================

/*
IF THE USER DOES NOT EXIST IN auth.users, YOU MUST:

Option 1: Create via Supabase Dashboard (RECOMMENDED)
  1. Go to Supabase Dashboard → Authentication → Users
  2. Click "Invite User" or "Add User"
  3. Email: contact@topaffaireimmo.com
  4. Set a secure password
  5. Check "Auto-confirm user"
  6. Click "Create User"
  7. Re-run this migration to add admin role

Option 2: Create via Auth API (for bulk operations)
  Use the Supabase Admin API endpoint:
  POST /auth/v1/admin/users
  
  {
    "email": "contact@topaffaireimmo.com",
    "password": "SECURE_PASSWORD_HERE",
    "email_confirm": true,
    "user_metadata": {}
  }

Option 3: User Self-Signup (if signup is enabled)
  1. User signs up at /signup
  2. User confirms email
  3. Admin runs this migration to grant admin role

AFTER USER IS CREATED:
  - Re-run this migration
  - User will be added to admins table automatically
  - Login should work

FOR PASSWORD RESET ISSUES:
  Check Supabase Dashboard → Authentication → Email Templates
  Verify SMTP settings in Settings → Authentication → Email
  Ensure "Confirm Email" and "Reset Password" templates are enabled
*/

-- =====================================================
-- STEP 5: Test Admin Access (Run manually after login)
-- =====================================================

/*
To test admin access after fixing:

1. Frontend Login Test:
   - Navigate to /login
   - Enter: contact@topaffaireimmo.com
   - Enter password
   - Should successfully login

2. Admin Dashboard Test:
   - Navigate to /admin
   - Should see admin dashboard (not 403)

3. Admin Actions Test:
   - Try to view all properties
   - Try to approve/reject a listing
   - Check admin notifications

4. SQL Verification:
   SELECT auth.uid() as current_user_id;
   SELECT * FROM public.admins WHERE user_id = auth.uid();
*/

-- =====================================================
-- END OF MIGRATION
-- =====================================================

-- Summary of what this migration does:
-- 1. Adds contact@topaffaireimmo.com to admins table (if user exists)
-- 2. Verifies email confirmation status
-- 3. Provides instructions for manual user creation if needed
-- 4. Lists all current admins
-- 5. Does NOT modify or delete any existing data
-- =====================================================
