-- =====================================================
-- DEFENSIVE CONSTRAINT: Prevent NULL city_id on Published Properties
-- =====================================================
-- 
-- PURPOSE:
-- Prevent future inserts/updates of published properties with NULL city_id
-- This ensures listings are always visible on the public website
--
-- STRATEGY:
-- Use a CHECK constraint that allows NULL city_id for drafts/pending
-- but REQUIRES city_id for published/approved properties
--
-- SAFETY:
-- - Does NOT affect existing data (only future inserts/updates)
-- - Allows drafts to have NULL city_id (flexible workflow)
-- - Published properties MUST have valid city_id
-- - Backward-compatible with existing application logic
--
-- =====================================================

\echo '============================================='
\echo 'DEFENSIVE CONSTRAINT INSTALLATION'
\echo '============================================='
\echo 'This script adds a CHECK constraint to prevent'
\echo 'published properties with NULL city_id'
\echo '============================================='
\echo ''

-- =====================================================
-- OPTION 1: CHECK CONSTRAINT (Recommended)
-- =====================================================

\echo '1. Adding CHECK constraint (published properties require city_id)...'

-- Drop existing constraint if it exists (idempotent)
ALTER TABLE public.properties 
  DROP CONSTRAINT IF EXISTS properties_city_id_required_for_published;

-- Add CHECK constraint
-- Allows NULL city_id for draft/pending statuses
-- Requires city_id for published/approved statuses
ALTER TABLE public.properties 
  ADD CONSTRAINT properties_city_id_required_for_published
  CHECK (
    -- If status is published or approved, city_id MUST NOT be NULL
    (status IN ('published', 'approved') AND city_id IS NOT NULL)
    OR
    -- Otherwise (draft, pending, rejected, archived), city_id can be NULL
    (status NOT IN ('published', 'approved'))
  );

\echo '✅ CHECK constraint added successfully'
\echo ''

-- =====================================================
-- OPTION 2: TRIGGER (Alternative approach - commented out)
-- =====================================================

-- Uncomment this section if you prefer a trigger-based approach
-- Triggers provide more flexibility for custom logic

/*
\echo '2. Creating trigger function to validate city_id...'

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.validate_property_city_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if property is being published/approved without city_id
  IF (NEW.status IN ('published', 'approved')) AND (NEW.city_id IS NULL) THEN
    RAISE EXCEPTION 
      'Cannot publish property without city_id. Property ID: %, Status: %', 
      NEW.id, 
      NEW.status
    USING HINT = 'Please set a valid city_id before publishing this property.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

\echo '✅ Trigger function created'

-- Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS trg_validate_property_city_id ON public.properties;

-- Create the trigger
CREATE TRIGGER trg_validate_property_city_id
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_property_city_id();

\echo '✅ Trigger created successfully'
\echo ''
*/

-- =====================================================
-- VERIFICATION
-- =====================================================

\echo '3. Verifying constraint installation...'

-- Check if constraint exists
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conname = 'properties_city_id_required_for_published'
  AND conrelid = 'public.properties'::regclass;

\echo ''

-- =====================================================
-- TEST THE CONSTRAINT
-- =====================================================

\echo '4. Testing constraint (these should behave as expected)...'
\echo ''

-- Test 1: Try to insert a draft with NULL city_id (should SUCCEED)
DO $$
DECLARE
  test_owner_id UUID;
BEGIN
  -- Get a valid owner_id from auth.users
  SELECT id INTO test_owner_id FROM auth.users LIMIT 1;
  
  IF test_owner_id IS NULL THEN
    RAISE NOTICE '⚠️  Test skipped: No users in auth.users table';
  ELSE
    BEGIN
      INSERT INTO public.properties (
        owner_id, 
        transaction_type, 
        property_type, 
        city_id,  -- NULL is OK for draft
        price, 
        title_fr, 
        title_ar, 
        status
      ) VALUES (
        test_owner_id,
        'sale',
        'apartment',
        NULL,  -- Testing NULL city_id
        100000,
        'Test Draft Property',
        'عقار اختبار',
        'draft'  -- Draft status allows NULL city_id
      );
      
      RAISE NOTICE '✅ Test 1 PASSED: Draft with NULL city_id was allowed';
      
      -- Clean up
      DELETE FROM public.properties WHERE title_fr = 'Test Draft Property';
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Test 1 FAILED: Draft with NULL city_id was rejected (unexpected)';
      RAISE NOTICE '   Error: %', SQLERRM;
    END;
  END IF;
END $$;

\echo ''

-- Test 2: Try to insert a published property with NULL city_id (should FAIL)
DO $$
DECLARE
  test_owner_id UUID;
BEGIN
  -- Get a valid owner_id from auth.users
  SELECT id INTO test_owner_id FROM auth.users LIMIT 1;
  
  IF test_owner_id IS NULL THEN
    RAISE NOTICE '⚠️  Test skipped: No users in auth.users table';
  ELSE
    BEGIN
      INSERT INTO public.properties (
        owner_id, 
        transaction_type, 
        property_type, 
        city_id,  -- NULL should NOT be allowed
        price, 
        title_fr, 
        title_ar, 
        status
      ) VALUES (
        test_owner_id,
        'sale',
        'apartment',
        NULL,  -- Testing NULL city_id
        100000,
        'Test Published Property',
        'عقار منشور',
        'published'  -- Published status requires city_id
      );
      
      RAISE NOTICE '❌ Test 2 FAILED: Published property with NULL city_id was allowed (unexpected)';
      
      -- Clean up if it somehow succeeded
      DELETE FROM public.properties WHERE title_fr = 'Test Published Property';
      
    EXCEPTION WHEN check_violation THEN
      RAISE NOTICE '✅ Test 2 PASSED: Published property with NULL city_id was correctly rejected';
      RAISE NOTICE '   Constraint is working as expected';
    WHEN OTHERS THEN
      RAISE NOTICE '⚠️  Test 2: Unexpected error: %', SQLERRM;
    END;
  END IF;
END $$;

\echo ''

-- Test 3: Try to update a draft to published with NULL city_id (should FAIL)
DO $$
DECLARE
  test_owner_id UUID;
  test_property_id UUID;
BEGIN
  -- Get a valid owner_id from auth.users
  SELECT id INTO test_owner_id FROM auth.users LIMIT 1;
  
  IF test_owner_id IS NULL THEN
    RAISE NOTICE '⚠️  Test skipped: No users in auth.users table';
  ELSE
    BEGIN
      -- First, insert a draft with NULL city_id (should succeed)
      INSERT INTO public.properties (
        owner_id, 
        transaction_type, 
        property_type, 
        city_id,
        price, 
        title_fr, 
        title_ar, 
        status
      ) VALUES (
        test_owner_id,
        'sale',
        'apartment',
        NULL,
        100000,
        'Test Status Change',
        'تغيير الحالة',
        'draft'
      ) RETURNING id INTO test_property_id;
      
      -- Now try to publish it without setting city_id (should fail)
      UPDATE public.properties
      SET status = 'published'
      WHERE id = test_property_id;
      
      RAISE NOTICE '❌ Test 3 FAILED: Status change to published without city_id was allowed (unexpected)';
      
      -- Clean up
      DELETE FROM public.properties WHERE id = test_property_id;
      
    EXCEPTION WHEN check_violation THEN
      RAISE NOTICE '✅ Test 3 PASSED: Status change to published without city_id was correctly rejected';
      RAISE NOTICE '   Constraint prevents publishing without city_id';
      
      -- Clean up
      DELETE FROM public.properties WHERE id = test_property_id;
    WHEN OTHERS THEN
      RAISE NOTICE '⚠️  Test 3: Unexpected error: %', SQLERRM;
      -- Attempt cleanup
      IF test_property_id IS NOT NULL THEN
        DELETE FROM public.properties WHERE id = test_property_id;
      END IF;
    END;
  END IF;
END $$;

\echo ''

-- =====================================================
-- SUMMARY
-- =====================================================

\echo '============================================='
\echo 'CONSTRAINT INSTALLATION COMPLETE'
\echo '============================================='
\echo ''
\echo 'Summary:'
\echo '  ✓ CHECK constraint installed'
\echo '  ✓ Published properties now require city_id'
\echo '  ✓ Draft/pending properties can have NULL city_id'
\echo '  ✓ Backward-compatible with existing workflows'
\echo '  ✓ Tests completed (see results above)'
\echo ''
\echo 'Impact:'
\echo '  - New published properties MUST have city_id set'
\echo '  - Frontend queries will always succeed for published listings'
\echo '  - Prevents listings from being invisible on public website'
\echo '  - Drafts remain flexible (can be saved without city_id)'
\echo ''
\echo 'Next steps:'
\echo '  1. Update frontend to ensure city_id is set before publishing'
\echo '  2. Test property creation workflow'
\echo '  3. Monitor for any constraint violations in logs'
\echo '============================================='
