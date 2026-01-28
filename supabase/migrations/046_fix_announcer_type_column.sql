-- =====================================================
-- Migration 046: Fix announcer_type Column Name
-- =====================================================
--
-- ROOT CAUSE:
-- Migrations 044 and 045 reference 'announcer_type' column in triggers
-- but the actual table still has 'advertiser_type' column.
-- This causes "Database error saving new user" when signup triggers fire.
--
-- SOLUTION:
-- 1. Rename advertiser_type → announcer_type
-- 2. Update all constraints and indexes
-- 3. Ensure triggers use correct column name
-- 4. Maintain backward compatibility
-- =====================================================

-- =====================================================
-- STEP 1: Add announcer_type column if it doesn't exist
-- =====================================================

-- Add the new column (will be NULL initially)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'announcer_type'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN announcer_type TEXT;
    
    RAISE NOTICE 'Added announcer_type column';
  ELSE
    RAISE NOTICE 'announcer_type column already exists';
  END IF;
END $$;

-- =====================================================
-- STEP 2: Copy data from advertiser_type to announcer_type
-- =====================================================

-- Migrate existing data with proper French mapping
UPDATE public.profiles
SET announcer_type = CASE
  WHEN advertiser_type = 'owner' THEN 'proprietaire'
  WHEN advertiser_type = 'broker' THEN 'courtier'
  WHEN advertiser_type = 'agency' THEN 'agence'
  WHEN advertiser_type = 'proprietaire' THEN 'proprietaire'
  WHEN advertiser_type = 'courtier' THEN 'courtier'
  WHEN advertiser_type = 'agence' THEN 'agence'
  ELSE advertiser_type
END
WHERE advertiser_type IS NOT NULL
  AND (announcer_type IS NULL OR announcer_type = '');

RAISE NOTICE 'Migrated data from advertiser_type to announcer_type';

-- =====================================================
-- STEP 3: Update constraints
-- =====================================================

-- Drop old advertiser_type constraint if exists
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_advertiser_type_check;

-- Drop old announcer_type constraint if exists
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_announcer_type_check;

-- Add new announcer_type constraint with French values
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_announcer_type_check 
CHECK (
  announcer_type IS NULL 
  OR announcer_type IN ('proprietaire', 'courtier', 'agence')
);

COMMENT ON COLUMN public.profiles.announcer_type IS
  'Type of announcer for real estate users: proprietaire (owner), courtier (broker), agence (agency).
   NULL for admin users and pure merchants.';

-- =====================================================
-- STEP 4: Update indexes
-- =====================================================

-- Drop old index on advertiser_type if it exists
DROP INDEX IF EXISTS idx_profiles_advertiser_type;

-- Create index on new announcer_type column
CREATE INDEX IF NOT EXISTS idx_profiles_announcer_type 
ON public.profiles(announcer_type) 
WHERE announcer_type IS NOT NULL;

-- =====================================================
-- STEP 5: Keep advertiser_type for backward compatibility
-- =====================================================

-- Update advertiser_type to mirror announcer_type for apps still using old column
UPDATE public.profiles
SET advertiser_type = CASE
  WHEN announcer_type = 'proprietaire' THEN 'owner'
  WHEN announcer_type = 'courtier' THEN 'broker'
  WHEN announcer_type = 'agence' THEN 'agency'
  ELSE announcer_type
END
WHERE announcer_type IS NOT NULL
  AND (advertiser_type IS NULL OR advertiser_type != announcer_type);

-- Add constraint to advertiser_type for backward compatibility
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_advertiser_type_check_legacy;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_advertiser_type_check_legacy 
CHECK (
  advertiser_type IS NULL 
  OR advertiser_type IN ('owner', 'broker', 'agency', 'proprietaire', 'courtier', 'agence')
);

-- Mark as deprecated in schema
COMMENT ON COLUMN public.profiles.advertiser_type IS
  'DEPRECATED: Use announcer_type instead. Kept for backward compatibility.
   Maps to English values: owner, broker, agency.';

-- =====================================================
-- STEP 6: Create trigger to keep both columns in sync
-- =====================================================

-- Drop old sync trigger if exists
DROP TRIGGER IF EXISTS sync_advertiser_announcer_type ON public.profiles;
DROP FUNCTION IF EXISTS public.sync_advertiser_announcer_type() CASCADE;

-- Create function to sync both columns
CREATE OR REPLACE FUNCTION public.sync_advertiser_announcer_type()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If announcer_type is set, sync to advertiser_type
  IF NEW.announcer_type IS NOT NULL THEN
    NEW.advertiser_type := CASE
      WHEN NEW.announcer_type = 'proprietaire' THEN 'owner'
      WHEN NEW.announcer_type = 'courtier' THEN 'broker'
      WHEN NEW.announcer_type = 'agence' THEN 'agency'
      ELSE NEW.advertiser_type
    END;
  -- If advertiser_type is set but announcer_type is null, sync the other way
  ELSIF NEW.advertiser_type IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.advertiser_type IS NULL) THEN
    NEW.announcer_type := CASE
      WHEN NEW.advertiser_type = 'owner' THEN 'proprietaire'
      WHEN NEW.advertiser_type = 'broker' THEN 'courtier'
      WHEN NEW.advertiser_type = 'agency' THEN 'agence'
      ELSE NEW.advertiser_type
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_advertiser_announcer_type() IS
  'Keeps advertiser_type and announcer_type in sync for backward compatibility.
   Priority: announcer_type (new) overwrites advertiser_type (deprecated).';

-- Create trigger
CREATE TRIGGER sync_advertiser_announcer_type
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_advertiser_announcer_type();

-- =====================================================
-- STEP 7: Verify handle_new_user trigger uses announcer_type
-- =====================================================

-- The handle_new_user function was already updated in migration 045
-- This just adds a verification that it exists and uses the right columns

DO $$
DECLARE
  function_source TEXT;
BEGIN
  SELECT pg_get_functiondef(oid) INTO function_source
  FROM pg_proc
  WHERE proname = 'handle_new_user'
  AND pronamespace = 'public'::regnamespace;
  
  IF function_source LIKE '%announcer_type%' THEN
    RAISE NOTICE '✓ handle_new_user function correctly uses announcer_type';
  ELSE
    RAISE WARNING '⚠ handle_new_user function may need updating to use announcer_type';
  END IF;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- 1. Verify both columns exist:
--    SELECT column_name, data_type, is_nullable 
--    FROM information_schema.columns 
--    WHERE table_name = 'profiles' 
--    AND column_name IN ('advertiser_type', 'announcer_type');
--    Expected: Both columns present

-- 2. Verify data is in sync:
--    SELECT 
--      announcer_type, 
--      advertiser_type, 
--      COUNT(*) 
--    FROM public.profiles 
--    GROUP BY announcer_type, advertiser_type;
--    Expected: Proper mappings (proprietaire→owner, courtier→broker, agence→agency)

-- 3. Verify constraints:
--    SELECT conname, pg_get_constraintdef(oid) 
--    FROM pg_constraint 
--    WHERE conrelid = 'public.profiles'::regclass 
--    AND conname LIKE '%announcer%' OR conname LIKE '%advertiser%';

-- 4. Test signup flow:
--    -- Create test user via Supabase Auth with announcer_type metadata
--    -- Verify profile is created with both columns populated correctly

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================

-- To rollback this migration (DO NOT run unless reverting):
-- 1. DROP TRIGGER IF EXISTS sync_advertiser_announcer_type ON public.profiles;
-- 2. DROP FUNCTION IF EXISTS public.sync_advertiser_announcer_type() CASCADE;
-- 3. ALTER TABLE public.profiles DROP COLUMN IF EXISTS announcer_type;
-- 4. Restore old advertiser_type constraint

-- =====================================================
-- END OF MIGRATION
-- =====================================================
