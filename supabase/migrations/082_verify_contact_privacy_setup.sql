-- =====================================================
-- Verification Script: Contact Privacy Control Setup
-- =====================================================
--
-- This script verifies that the contact privacy control is correctly set up
-- Run this to ensure all components are in place
--
-- =====================================================

-- =====================================================
-- 1. Verify columns exist on properties table
-- =====================================================

DO $$
BEGIN
  -- Check for contact fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'properties' 
    AND column_name = 'contact_phone'
  ) THEN
    RAISE EXCEPTION 'Missing column: properties.contact_phone';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'properties' 
    AND column_name = 'contact_whatsapp'
  ) THEN
    RAISE EXCEPTION 'Missing column: properties.contact_whatsapp';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'properties' 
    AND column_name = 'contact_email'
  ) THEN
    RAISE EXCEPTION 'Missing column: properties.contact_email';
  END IF;

  -- Check for visibility flags
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'properties' 
    AND column_name = 'show_phone_public'
    AND data_type = 'boolean'
  ) THEN
    RAISE EXCEPTION 'Missing or incorrect type for column: properties.show_phone_public';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'properties' 
    AND column_name = 'show_whatsapp_public'
    AND data_type = 'boolean'
  ) THEN
    RAISE EXCEPTION 'Missing or incorrect type for column: properties.show_whatsapp_public';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'properties' 
    AND column_name = 'show_email_public'
    AND data_type = 'boolean'
  ) THEN
    RAISE EXCEPTION 'Missing or incorrect type for column: properties.show_email_public';
  END IF;

  RAISE NOTICE '✅ All required columns exist on properties table';
END $$;

-- =====================================================
-- 2. Verify properties_public view exists
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'properties_public'
  ) THEN
    RAISE EXCEPTION 'Missing view: properties_public';
  END IF;

  RAISE NOTICE '✅ properties_public view exists';
END $$;

-- =====================================================
-- 3. Verify RLS is enabled on properties table
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'properties' 
    AND rowsecurity = true
  ) THEN
    RAISE WARNING '⚠️  RLS is not enabled on properties table';
  ELSE
    RAISE NOTICE '✅ RLS is enabled on properties table';
  END IF;
END $$;

-- =====================================================
-- 4. Verify policies exist
-- =====================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Check for essential policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
  AND tablename = 'properties';

  IF policy_count = 0 THEN
    RAISE WARNING '⚠️  No policies found on properties table';
  ELSE
    RAISE NOTICE '✅ Found % policies on properties table', policy_count;
  END IF;

  -- Check that public select policy doesn't exist (should be removed)
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'properties'
    AND policyname = 'properties_select_public'
  ) THEN
    RAISE WARNING '⚠️  Public select policy still exists - should be removed for security';
  ELSE
    RAISE NOTICE '✅ Public select policy correctly removed';
  END IF;
END $$;

-- =====================================================
-- 5. Verify grants on properties_public view
-- =====================================================

DO $$
BEGIN
  -- Check if anon and authenticated roles can select from properties_public
  IF EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
    AND table_name = 'properties_public'
    AND privilege_type = 'SELECT'
    AND grantee IN ('anon', 'authenticated')
  ) THEN
    RAISE NOTICE '✅ Anonymous/authenticated users can SELECT from properties_public';
  ELSE
    RAISE WARNING '⚠️  Missing SELECT grants on properties_public for anon/authenticated';
  END IF;
END $$;

-- =====================================================
-- 6. Show summary of all policies on properties table
-- =====================================================

SELECT 
  '📋 Current Policies on properties table:' as info;

SELECT 
  policyname as policy,
  cmd as command,
  permissive,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'properties'
ORDER BY cmd, policyname;

-- =====================================================
-- END OF VERIFICATION
-- =====================================================
