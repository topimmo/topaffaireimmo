-- =====================================================
-- SUPABASE APPROVE/REJECT DIAGNOSTIC SCRIPTS
-- Complete SQL Setup & Verification Scripts
-- =====================================================

-- =====================================================
-- PART 1: VERIFICATION SCRIPTS
-- Run these to check current database state
-- =====================================================

-- 1.1 Check Current User & Admin Status
-- =====================================================
-- Run this to see who you're logged in as and if you're an admin

SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created,
  CASE 
    WHEN a.user_id IS NOT NULL THEN '✅ YES'
    ELSE '❌ NO'
  END as is_admin,
  a.created_at as admin_since
FROM auth.users u
LEFT JOIN public.admins a ON u.id = a.user_id
WHERE u.id = auth.uid();

-- Expected: Should show your email and admin status


-- 1.2 List All Admins
-- =====================================================
-- See all users who have admin privileges

SELECT 
  u.id,
  u.email,
  a.created_at as admin_since
FROM public.admins a
JOIN auth.users u ON a.user_id = u.id
ORDER BY a.created_at DESC;


-- 1.3 Check Properties Table Structure
-- =====================================================
-- Verify all required columns exist with correct types

SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'properties'
  AND column_name IN (
    'id', 'owner_id', 'status', 'rejection_reason', 
    'approved_at', 'approved_by', 'published_at',
    'created_at', 'updated_at'
  )
ORDER BY 
  CASE column_name
    WHEN 'id' THEN 1
    WHEN 'owner_id' THEN 2
    WHEN 'status' THEN 3
    WHEN 'rejection_reason' THEN 4
    WHEN 'approved_at' THEN 5
    WHEN 'approved_by' THEN 6
    WHEN 'published_at' THEN 7
    WHEN 'created_at' THEN 8
    WHEN 'updated_at' THEN 9
  END;

-- Expected columns:
-- status: text, default 'pending', NOT NULL
-- rejection_reason: text, nullable
-- approved_at: timestamptz, nullable
-- approved_by: uuid, nullable
-- published_at: timestamptz, nullable


-- 1.4 Check RLS Status
-- =====================================================
-- Verify RLS is enabled on critical tables

SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('properties', 'admins', 'admin_audit_logs')
ORDER BY tablename;

-- Expected: All three tables should show ENABLED


-- 1.5 List All RLS Policies on Properties Table
-- =====================================================

SELECT 
  policyname as policy_name,
  cmd as operation,
  CASE 
    WHEN permissive = 'PERMISSIVE' THEN '✅ Permissive'
    ELSE '⚠️ Restrictive'
  END as type,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'properties'
ORDER BY 
  CASE cmd
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
  END,
  policyname;

-- Expected: 8 policies total
-- 3 SELECT policies (own, admin, public)
-- 2 UPDATE policies (own, admin)
-- 1 INSERT policy (authenticated)
-- 2 DELETE policies (own, admin)


-- 1.6 Check Admin Table Policies
-- =====================================================

SELECT 
  policyname as policy_name,
  cmd as operation,
  qual as using_clause
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'admins'
ORDER BY cmd, policyname;

-- Expected: 3 policies (SELECT, INSERT, DELETE)


-- 1.7 Verify Triggers
-- =====================================================

SELECT 
  t.tgname as trigger_name,
  t.tgrelid::regclass as table_name,
  CASE t.tgtype::integer & 1
    WHEN 1 THEN 'ROW'
    ELSE 'STATEMENT'
  END as level,
  CASE t.tgtype::integer & 66
    WHEN 2 THEN 'BEFORE'
    WHEN 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END as timing,
  CASE 
    WHEN t.tgtype::integer & 4 != 0 THEN 'INSERT'
    WHEN t.tgtype::integer & 8 != 0 THEN 'DELETE'
    WHEN t.tgtype::integer & 16 != 0 THEN 'UPDATE'
  END as event,
  CASE t.tgenabled
    WHEN 'O' THEN '✅ ENABLED'
    WHEN 'D' THEN '❌ DISABLED'
    ELSE 'OTHER'
  END as status
FROM pg_trigger t
WHERE t.tgname IN (
  'protect_property_status_trigger',
  'update_properties_updated_at'
)
ORDER BY t.tgname;

-- Expected: 2 triggers
-- 1. protect_property_status_trigger (BEFORE UPDATE on properties)
-- 2. update_properties_updated_at (BEFORE UPDATE on properties)


-- 1.8 Check Trigger Functions
-- =====================================================

SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  CASE p.provolatile
    WHEN 'i' THEN 'IMMUTABLE'
    WHEN 's' THEN 'STABLE'
    WHEN 'v' THEN 'VOLATILE'
  END as volatility,
  CASE p.prosecdef
    WHEN true THEN '⚠️ SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security
FROM pg_proc p
WHERE p.proname IN (
  'protect_property_status',
  'update_updated_at',
  'is_admin'
)
ORDER BY p.proname;

-- Expected: 3 functions
-- protect_property_status: SECURITY DEFINER
-- update_updated_at: SECURITY INVOKER
-- is_admin: SECURITY DEFINER


-- 1.9 Check Recent Properties
-- =====================================================
-- View recent properties with approval status

SELECT 
  p.id,
  p.title_fr,
  p.status,
  p.approved_at,
  p.approved_by,
  p.created_at,
  u.email as owner_email,
  admin_u.email as approved_by_email
FROM public.properties p
JOIN auth.users u ON p.owner_id = u.id
LEFT JOIN auth.users admin_u ON p.approved_by = admin_u.id
ORDER BY p.created_at DESC
LIMIT 20;


-- 1.10 Check Audit Logs
-- =====================================================
-- View recent admin actions

SELECT 
  aal.created_at,
  u.email as admin_email,
  aal.action,
  aal.entity_type,
  aal.entity_id,
  aal.metadata->>'title' as property_title,
  aal.metadata->>'rejection_reason' as rejection_reason
FROM public.admin_audit_logs aal
JOIN auth.users u ON aal.admin_id = u.id
ORDER BY aal.created_at DESC
LIMIT 30;


-- =====================================================
-- PART 2: SETUP SCRIPTS
-- Run these if you need to set up admin or fix issues
-- =====================================================

-- 2.1 CREATE FIRST ADMIN USER
-- =====================================================
-- ⚠️ IMPORTANT: Replace 'YOUR_EMAIL_HERE' with your actual email
-- This script finds your user ID and makes you an admin

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'YOUR_EMAIL_HERE'; -- ← CHANGE THIS
BEGIN
  -- Find user ID by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', v_email;
  END IF;
  
  -- Insert into admins table
  INSERT INTO public.admins (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RAISE NOTICE 'Admin user created successfully for: % (ID: %)', v_email, v_user_id;
END $$;


-- 2.2 ADD ADMIN BY USER ID
-- =====================================================
-- If you already know the user ID, use this simpler version
-- Replace 'USER_UUID_HERE' with actual UUID

INSERT INTO public.admins (user_id)
VALUES ('USER_UUID_HERE') -- ← CHANGE THIS
ON CONFLICT (user_id) DO NOTHING;


-- 2.3 ADD MULTIPLE ADMINS AT ONCE
-- =====================================================
-- Add several admins in one go

INSERT INTO public.admins (user_id)
VALUES 
  ('ADMIN_UUID_1'), -- ← CHANGE THESE
  ('ADMIN_UUID_2'),
  ('ADMIN_UUID_3')
ON CONFLICT (user_id) DO NOTHING;


-- 2.4 REMOVE ADMIN ACCESS
-- =====================================================
-- Remove admin privileges from a user

DELETE FROM public.admins
WHERE user_id = 'USER_UUID_HERE'; -- ← CHANGE THIS


-- =====================================================
-- PART 3: FIX/REPAIR SCRIPTS
-- Run these if something is broken
-- =====================================================

-- 3.1 ENABLE RLS (if disabled)
-- =====================================================

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;


-- 3.2 RECREATE ADMINS TABLE (if missing)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;


-- 3.3 RECREATE ADMIN POLICIES (if missing)
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "admins_select_admin_only" ON public.admins;
DROP POLICY IF EXISTS "admins_insert_admin_only" ON public.admins;
DROP POLICY IF EXISTS "admins_delete_admin_only" ON public.admins;

-- Recreate policies
CREATE POLICY "admins_select_admin_only" ON public.admins
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

CREATE POLICY "admins_insert_admin_only" ON public.admins
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

CREATE POLICY "admins_delete_admin_only" ON public.admins
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );


-- 3.4 RECREATE PROPERTIES ADMIN POLICIES (if missing)
-- =====================================================

-- Drop existing admin policies
DROP POLICY IF EXISTS "properties_select_admin" ON public.properties;
DROP POLICY IF EXISTS "properties_update_admin" ON public.properties;
DROP POLICY IF EXISTS "properties_delete_admin" ON public.properties;

-- Recreate admin policies
CREATE POLICY "properties_select_admin" ON public.properties
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

CREATE POLICY "properties_update_admin" ON public.properties
  FOR UPDATE 
  USING (auth.uid() IN (SELECT user_id FROM public.admins))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

CREATE POLICY "properties_delete_admin" ON public.properties
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );


-- 3.5 RECREATE STATUS PROTECTION TRIGGER (if missing)
-- =====================================================

-- Drop existing
DROP TRIGGER IF EXISTS protect_property_status_trigger ON public.properties;
DROP FUNCTION IF EXISTS public.protect_property_status();

-- Recreate function
CREATE OR REPLACE FUNCTION public.protect_property_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is being changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Check if user is admin
    IF NOT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) THEN
      -- If not admin, prevent status change
      NEW.status := OLD.status;
      RAISE NOTICE 'Status change prevented: Only admins can change property status';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER protect_property_status_trigger
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_property_status();


-- 3.6 ADD MISSING COLUMNS (if needed)
-- =====================================================

-- Add approved_at if missing
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Add approved_by if missing
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Add published_at if missing
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Add rejection_reason if missing
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;


-- =====================================================
-- PART 4: TESTING SCRIPTS
-- Run these to test the approve/reject flow
-- =====================================================

-- 4.1 TEST: Create Test Property
-- =====================================================
-- Creates a test property you can use to test approval

DO $$
DECLARE
  v_property_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  INSERT INTO public.properties (
    owner_id,
    property_type,
    transaction_type,
    advertiser_type,
    city_id,
    price,
    title_fr,
    title_ar,
    description_fr,
    status
  ) VALUES (
    v_user_id,
    'apartment',
    'sale',
    'owner',
    1, -- Casablanca
    500000.00,
    'TEST PROPERTY - Villa de test',
    'عقار تجريبي',
    'Ceci est une propriété de test pour tester le flux approve/reject',
    'pending'
  ) RETURNING id INTO v_property_id;
  
  RAISE NOTICE 'Test property created with ID: %', v_property_id;
END $$;


-- 4.2 TEST: Approve Property
-- =====================================================
-- Replace PROPERTY_ID with the actual property UUID

UPDATE public.properties
SET 
  status = 'approved',
  approved_at = NOW(),
  approved_by = auth.uid(),
  published_at = NOW()
WHERE id = 'PROPERTY_ID_HERE' -- ← CHANGE THIS
RETURNING id, status, approved_at, approved_by;

-- Expected: Should return the property with status='approved'
-- If you're not admin, status will stay 'pending' (trigger protection)


-- 4.3 TEST: Reject Property
-- =====================================================
-- Replace PROPERTY_ID with the actual property UUID

UPDATE public.properties
SET 
  status = 'rejected',
  rejection_reason = 'Test rejection - does not meet quality standards'
WHERE id = 'PROPERTY_ID_HERE' -- ← CHANGE THIS
RETURNING id, status, rejection_reason;


-- 4.4 TEST: Try Status Change as Non-Admin
-- =====================================================
-- This should fail (status stays pending)

-- First, create a test property
INSERT INTO public.properties (
  owner_id, property_type, transaction_type, city_id,
  price, title_fr, title_ar, status
) VALUES (
  auth.uid(), 'apartment', 'sale', 1,
  100000, 'Test - Non-admin attempt', 'اختبار', 'pending'
) RETURNING id;

-- Note the ID, then try to update status
-- (Replace PROPERTY_ID)
UPDATE public.properties
SET status = 'approved'
WHERE id = 'PROPERTY_ID_HERE' -- ← CHANGE THIS
RETURNING status;

-- Expected for non-admin: status remains 'pending'
-- Expected for admin: status changes to 'approved'


-- =====================================================
-- PART 5: CLEANUP SCRIPTS
-- Remove test data
-- =====================================================

-- 5.1 DELETE TEST PROPERTIES
-- =====================================================
-- Careful! This deletes properties with "TEST" in title

DELETE FROM public.properties
WHERE title_fr ILIKE '%TEST%' 
  AND owner_id = auth.uid();


-- 5.2 CLEAR ALL AUDIT LOGS (careful!)
-- =====================================================
-- Only run if you want to clear audit history

-- TRUNCATE public.admin_audit_logs; -- Uncomment to run


-- =====================================================
-- PART 6: DIAGNOSTIC QUERIES
-- Use these to debug issues
-- =====================================================

-- 6.1 Find Properties Stuck in Pending
-- =====================================================

SELECT 
  p.id,
  p.title_fr,
  p.status,
  p.created_at,
  u.email as owner_email,
  EXTRACT(DAY FROM NOW() - p.created_at) as days_pending
FROM public.properties p
JOIN auth.users u ON p.owner_id = u.id
WHERE p.status = 'pending'
ORDER BY p.created_at ASC;


-- 6.2 Check Failed Status Changes
-- =====================================================
-- Properties that were updated but status didn't change
-- (indicates trigger blocked the change)

SELECT 
  p.id,
  p.title_fr,
  p.status,
  p.updated_at,
  p.created_at,
  u.email as owner_email
FROM public.properties p
JOIN auth.users u ON p.owner_id = u.id
WHERE p.status = 'pending'
  AND p.updated_at > p.created_at + INTERVAL '1 minute'
ORDER BY p.updated_at DESC;


-- 6.3 Admin Activity Report
-- =====================================================

SELECT 
  u.email as admin_email,
  COUNT(*) FILTER (WHERE aal.action = 'approve') as approvals,
  COUNT(*) FILTER (WHERE aal.action = 'reject') as rejections,
  COUNT(*) as total_actions,
  MIN(aal.created_at) as first_action,
  MAX(aal.created_at) as last_action
FROM public.admin_audit_logs aal
JOIN auth.users u ON aal.admin_id = u.id
WHERE aal.entity_type = 'property'
GROUP BY u.email
ORDER BY total_actions DESC;


-- 6.4 Properties by Status Summary
-- =====================================================

SELECT 
  status,
  COUNT(*) as count,
  ROUND(AVG(price), 2) as avg_price,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM public.properties
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'pending' THEN 1
    WHEN 'approved' THEN 2
    WHEN 'rejected' THEN 3
    ELSE 4
  END;


-- =====================================================
-- END OF DIAGNOSTIC SCRIPTS
-- =====================================================

-- Notes:
-- 1. All scripts marked with "← CHANGE THIS" need values replaced
-- 2. Scripts in PART 2 require service role or existing admin
-- 3. Test scripts (PART 4) are safe to run multiple times
-- 4. Cleanup scripts (PART 5) are destructive - use with caution
-- 5. For first-time setup, run scripts in order: 
--    PART 1 (verify) → PART 2 (setup admin) → PART 4 (test)
