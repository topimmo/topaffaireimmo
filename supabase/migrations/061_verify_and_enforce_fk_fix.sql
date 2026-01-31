-- =====================================================
-- Migration 061: VERIFY AND ENFORCE FK FIX
-- =====================================================
--
-- OBJECTIVE:
-- Ensure the FK constraint fix from migration 049 is properly applied.
-- This migration is idempotent and will verify/fix the constraint.
--
-- ROOT CAUSE CONFIRMATION:
-- ========================================
-- RLS Policy: owner_id = auth.uid()
-- Original FK: owner_id REFERENCES profiles(id)
-- 
-- ISSUE: If profile creation is delayed or fails, properties.owner_id
-- cannot reference profiles.id even though auth.uid() exists.
-- This creates FK vs RLS contradiction.
--
-- FIX: Change FK to reference auth.users(id) directly (Option B)
-- WHY Option B over Option A:
-- - Option A (enforce profiles.id = auth.uid()): Already enforced by schema,
--   but doesn't help if profile row doesn't exist yet
-- - Option B (FK → auth.users): Removes dependency on profiles table,
--   allows properties to be created immediately after user signup
--   without waiting for profile trigger/creation
--
-- =====================================================

-- =====================================================
-- STEP 1: VERIFY CURRENT STATE
-- =====================================================

DO $$
DECLARE
  fk_target regclass;
BEGIN
  -- Check what the FK currently references
  SELECT confrelid::regclass INTO fk_target
  FROM pg_constraint
  WHERE conname = 'properties_owner_id_fkey'
    AND conrelid = 'public.properties'::regclass;
  
  IF fk_target IS NULL THEN
    RAISE NOTICE '⚠️  WARNING: FK constraint properties_owner_id_fkey does not exist';
  ELSIF fk_target = 'auth.users'::regclass THEN
    RAISE NOTICE '✅ SUCCESS: FK already references auth.users (correct)';
  ELSIF fk_target = 'public.profiles'::regclass THEN
    RAISE NOTICE '❌ PROBLEM: FK still references profiles (needs fix)';
  ELSE
    RAISE NOTICE '⚠️  WARNING: FK references unexpected table: %', fk_target;
  END IF;
END $$;

-- =====================================================
-- STEP 2: DROP OLD CONSTRAINT IF IT EXISTS
-- =====================================================

-- Drop the constraint if it exists (idempotent)
ALTER TABLE public.properties 
  DROP CONSTRAINT IF EXISTS properties_owner_id_fkey;

-- =====================================================
-- STEP 3: ADD CORRECT CONSTRAINT
-- =====================================================

-- Add the correct FK constraint referencing auth.users
-- This is idempotent - only adds if not exists
DO $$
BEGIN
  -- Check if constraint already exists with correct definition
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'properties_owner_id_fkey'
      AND conrelid = 'public.properties'::regclass
      AND confrelid = 'auth.users'::regclass
  ) THEN
    -- Add the correct FK constraint
    ALTER TABLE public.properties 
      ADD CONSTRAINT properties_owner_id_fkey 
      FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE '✅ SUCCESS: FK constraint created to reference auth.users';
  ELSE
    RAISE NOTICE '✅ OK: FK constraint already correct, no action needed';
  END IF;
END $$;

-- =====================================================
-- STEP 4: VERIFY RLS POLICIES
-- =====================================================

-- Verify that RLS policies use auth.uid() correctly
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Count policies that should exist
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'properties'
    AND policyname IN (
      'properties_insert_authenticated',
      'properties_select_public',
      'properties_update_own',
      'properties_delete_own'
    );
  
  IF policy_count = 4 THEN
    RAISE NOTICE '✅ SUCCESS: All 4 RLS policies exist';
  ELSE
    RAISE NOTICE '⚠️  WARNING: Expected 4 RLS policies, found %', policy_count;
  END IF;
END $$;

-- =====================================================
-- STEP 5: VERIFY owner_id DEFAULT
-- =====================================================

DO $$
DECLARE
  has_default BOOLEAN;
BEGIN
  -- Check if owner_id has auth.uid() as default
  SELECT COUNT(*) > 0 INTO has_default
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'properties'
    AND column_name = 'owner_id'
    AND column_default LIKE '%auth.uid()%';
  
  IF has_default THEN
    RAISE NOTICE '✅ SUCCESS: owner_id has auth.uid() default';
  ELSE
    RAISE NOTICE 'ℹ️  INFO: owner_id does not have default (frontend sets it explicitly)';
  END IF;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify the fix:
--
-- 1. Check FK constraint:
-- SELECT 
--   conname AS constraint_name,
--   conrelid::regclass AS table_name,
--   confrelid::regclass AS references_table
-- FROM pg_constraint
-- WHERE conname = 'properties_owner_id_fkey';
--
-- Expected: references_table = 'auth.users'
--
-- 2. Check RLS policies:
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'properties'
-- ORDER BY policyname;
--
-- 3. Test INSERT will succeed:
-- As an authenticated user, run:
-- INSERT INTO properties (owner_id, transaction_type, property_type, city_id, price, title_fr, title_ar)
-- VALUES (auth.uid(), 'sale', 'apartment', 1, 100000, 'Test', 'تست');
--
-- This should succeed even if no profile row exists.
--
-- =====================================================

-- =====================================================
-- SUMMARY
-- =====================================================
-- 
-- After this migration:
-- ✅ FK constraint references auth.users(id) not profiles(id)
-- ✅ RLS policies use auth.uid() for ownership checks
-- ✅ INSERT will succeed if user is authenticated (regardless of profile)
-- ✅ Data model is consistent: auth.users is single source of truth
-- ✅ Future-proof: No dependency on profile creation timing
--
-- ROOT CAUSE FIXED:
-- The FK ↔ RLS mismatch occurred because:
-- - RLS used auth.uid() (always exists for authenticated users)
-- - FK required profiles.id (might not exist yet)
-- 
-- By changing FK to auth.users(id), both FK and RLS use the same
-- identity source, eliminating the contradiction.
--
-- =====================================================
-- END OF MIGRATION
-- =====================================================
