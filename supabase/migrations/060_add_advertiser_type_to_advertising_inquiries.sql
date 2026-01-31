-- =====================================================
-- Migration: Add advertiser_type to advertising_inquiries
-- File: 060_add_advertiser_type_to_advertising_inquiries.sql
-- Created: 2026-01-31
-- =====================================================
--
-- OBJECTIVE:
-- Add advertiser_type column to advertising_inquiries table
-- to distinguish between different types of advertisers.
--
-- ISSUE:
-- Frontend code sends advertiser_type but column doesn't exist in table.
-- This causes constraint violations when inserting records.
--
-- SOLUTION:
-- Add advertiser_type column with default value 'agency'
-- and check constraint to ensure valid values.
--
-- =====================================================

-- Add advertiser_type column if it doesn't exist
DO $$
BEGIN
  -- Check if column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'advertising_inquiries' 
      AND column_name = 'advertiser_type'
  ) THEN
    -- Add the column
    ALTER TABLE public.advertising_inquiries 
      ADD COLUMN advertiser_type TEXT DEFAULT 'agency' NOT NULL
      CHECK (advertiser_type IN ('agency', 'merchant', 'individual', 'other'));
    
    RAISE NOTICE '✅ SUCCESS: Column advertiser_type added to advertising_inquiries';
  ELSE
    RAISE NOTICE '✅ OK: Column advertiser_type already exists, no action needed';
  END IF;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- After running this migration, verify the column exists:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'advertising_inquiries' 
--   AND column_name = 'advertiser_type';

-- Check constraints are correct:
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_schema = 'public'
--   AND constraint_name LIKE '%advertiser_type%';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
