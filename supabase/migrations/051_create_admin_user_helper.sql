-- =====================================================
-- Helper Script: Create Admin User
-- =====================================================
--
-- This script helps you create your first admin user.
-- Run this AFTER migration 050 has been applied.
--
-- INSTRUCTIONS:
-- 1. First, create a user account through the normal signup process
-- 2. Get the user's UUID from auth.users table
-- 3. Replace 'USER_UUID_HERE' below with the actual UUID
-- 4. Run this script
--
-- =====================================================

-- Example: Find user UUID by email
-- SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- Add user to admins table
-- Replace 'USER_UUID_HERE' with the actual user UUID
INSERT INTO public.admins (user_id)
VALUES ('USER_UUID_HERE')
ON CONFLICT (user_id) DO NOTHING;

-- Verify admin was added
SELECT 
  a.user_id,
  u.email,
  a.created_at
FROM public.admins a
JOIN auth.users u ON u.id = a.user_id;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- After adding admin, you can verify the user has admin access by:
-- 1. Logging in with that user account
-- 2. Checking if "Administration" link appears in the header
-- 3. Trying to access /admin route

-- =====================================================
-- REMOVING ADMIN ACCESS
-- =====================================================

-- To remove admin access from a user:
-- DELETE FROM public.admins WHERE user_id = 'USER_UUID_HERE';

-- =====================================================
