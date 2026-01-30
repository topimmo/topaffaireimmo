-- =====================================================
-- FIX 005: Create First Admin User
-- =====================================================
-- 
-- PROBLEM: No admin users exist in the admins table
--
-- IMPACT: CRITICAL - Cannot access admin panel,
-- cannot approve listings, admin features broken
--
-- SOLUTION: Insert first admin user manually
-- =====================================================

-- =====================================================
-- STEP 1: Find Your User UUID
-- =====================================================

-- Replace 'your-email@example.com' with actual admin email
SELECT 
  id as user_uuid, 
  email, 
  created_at,
  confirmed_at
FROM auth.users 
WHERE email = 'your-email@example.com';

-- Copy the user_uuid from the result

-- =====================================================
-- STEP 2: Insert into Admins Table
-- =====================================================

-- Replace 'PASTE-UUID-HERE' with the UUID from Step 1
INSERT INTO public.admins (user_id) 
VALUES ('PASTE-UUID-HERE')
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- STEP 3: Verify Admin Created
-- =====================================================

-- Check admin was created successfully
SELECT 
  a.user_id, 
  u.email, 
  a.created_at as admin_since
FROM public.admins a
JOIN auth.users u ON a.user_id = u.id;

-- Expected output should show your admin user

-- =====================================================
-- ALTERNATIVE: Create Admin by Email (If User Exists)
-- =====================================================

-- This combines Step 1 and 2 in one query
-- Replace 'your-email@example.com' with actual admin email

INSERT INTO public.admins (user_id)
SELECT id FROM auth.users WHERE email = 'your-email@example.com'
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- STEP 4: Test Admin Access
-- =====================================================

-- After running the above, test in frontend:
-- 1. Login with admin email
-- 2. Navigate to /admin
-- 3. Should see admin dashboard (not 403 error)
-- 4. Try to approve a listing
-- 5. Check that status changes to 'approved'

-- Verify admin can see all properties:
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claims TO '{"sub": "admin-uuid-here"}';
-- SELECT COUNT(*) FROM public.properties;
-- RESET ROLE;

-- =====================================================
-- NOTES
-- =====================================================

-- To add more admin users later:
-- Run the same INSERT query with different user UUIDs

-- To remove admin access:
-- DELETE FROM public.admins WHERE user_id = 'user-uuid';

-- Only existing admins can add/remove other admins
-- due to RLS policies on the admins table

-- =====================================================
-- END OF FIX 005
-- =====================================================
