-- =====================================================
-- Migration: Rename announcer_type to advertiser_type (Optional)
-- File: 059_rename_announcer_to_advertiser_type.sql
-- Created: 2026-01-31
-- =====================================================
--
-- OBJECTIVE:
-- Fix potential column naming inconsistency in properties table.
-- Migration 050 may have added 'announcer_type' but code uses 'advertiser_type'.
--
-- ISSUE:
-- - Migration 050 has: ALTER TABLE properties ADD COLUMN announcer_type
-- - Types file has: advertiser_type: string | null
-- - Code may be using advertiser_type
--
-- SOLUTION:
-- This migration checks if the typo exists and fixes it.
-- Only runs if announcer_type exists and advertiser_type doesn't.
--
-- IMPORTANT:
-- Run this query FIRST to check if the issue exists:
--   SELECT column_name, data_type 
--   FROM information_schema.columns 
--   WHERE table_name = 'properties' 
--     AND column_name IN ('advertiser_type', 'announcer_type');
--
-- If you see BOTH columns, manual intervention is needed.
-- If you see only advertiser_type, this migration is not needed.
-- If you see only announcer_type, this migration will fix it.
--
-- =====================================================

-- Check if announcer_type exists and advertiser_type doesn't
DO $$
DECLARE
  has_announcer BOOLEAN;
  has_advertiser BOOLEAN;
BEGIN
  -- Check for announcer_type
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'properties' 
      AND column_name = 'announcer_type'
  ) INTO has_announcer;
  
  -- Check for advertiser_type
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'properties' 
      AND column_name = 'advertiser_type'
  ) INTO has_advertiser;
  
  -- Log what we found
  RAISE NOTICE 'Column check results:';
  RAISE NOTICE '  - announcer_type exists: %', has_announcer;
  RAISE NOTICE '  - advertiser_type exists: %', has_advertiser;
  
  -- Scenario 1: Only announcer_type exists (typo in migration 050)
  IF has_announcer AND NOT has_advertiser THEN
    -- Rename the column
    ALTER TABLE public.properties 
      RENAME COLUMN announcer_type TO advertiser_type;
    
    RAISE NOTICE '✅ SUCCESS: Column renamed from announcer_type to advertiser_type';
  
  -- Scenario 2: Only advertiser_type exists (already correct)
  ELSIF has_advertiser AND NOT has_announcer THEN
    RAISE NOTICE '✅ OK: Column advertiser_type already exists, no action needed';
  
  -- Scenario 3: Both exist (conflict - manual intervention needed)
  ELSIF has_announcer AND has_advertiser THEN
    RAISE WARNING '⚠️ WARNING: Both columns exist! Manual intervention required.';
    RAISE WARNING 'Please investigate which column is being used and drop the other.';
    RAISE WARNING 'Run: SELECT announcer_type, advertiser_type FROM properties LIMIT 10;';
  
  -- Scenario 4: Neither exists (unexpected)
  ELSE
    RAISE WARNING '⚠️ WARNING: Neither column exists! This is unexpected.';
    RAISE WARNING 'Check if properties table structure is correct.';
  END IF;
  
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- After running this migration, verify the column exists:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'properties' 
--   AND column_name = 'advertiser_type';

-- Check constraints are correct:
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_schema = 'public'
--   AND constraint_name LIKE '%advertiser_type%';

-- =====================================================
-- MANUAL CONFLICT RESOLUTION (if both columns exist)
-- =====================================================

-- If both columns exist, run these queries to investigate:
--
-- 1. Check data in both columns:
-- SELECT 
--   id, 
--   announcer_type, 
--   advertiser_type,
--   CASE 
--     WHEN announcer_type IS NOT NULL AND advertiser_type IS NOT NULL THEN 'both'
--     WHEN announcer_type IS NOT NULL THEN 'announcer only'
--     WHEN advertiser_type IS NOT NULL THEN 'advertiser only'
--     ELSE 'neither'
--   END as data_status
-- FROM properties
-- WHERE announcer_type IS NOT NULL OR advertiser_type IS NOT NULL
-- LIMIT 50;
--
-- 2. If advertiser_type has data, drop announcer_type:
-- ALTER TABLE public.properties DROP COLUMN announcer_type;
--
-- 3. If announcer_type has data, copy to advertiser_type then drop:
-- UPDATE public.properties SET advertiser_type = announcer_type WHERE advertiser_type IS NULL;
-- ALTER TABLE public.properties DROP COLUMN announcer_type;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
