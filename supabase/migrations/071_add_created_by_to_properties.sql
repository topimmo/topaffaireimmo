-- =====================================================
-- Migration 071: Add created_by to properties table
-- =====================================================
--
-- OBJECTIVE:
-- Add created_by column to track the original creator of a property
-- This ensures users can always see/update/delete their own listings
-- even if they change advertiser_type over time (owner/broker/agency)
--
-- =====================================================

-- =====================================================
-- STEP 1: Add created_by column
-- =====================================================

-- Add created_by column (nullable initially for existing data)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- =====================================================
-- STEP 2: Backfill created_by from owner_id
-- =====================================================

-- For existing properties, set created_by = owner_id
-- This assumes the current owner is also the original creator
UPDATE public.properties
SET created_by = owner_id
WHERE created_by IS NULL;

-- =====================================================
-- STEP 3: Make created_by NOT NULL with default
-- =====================================================

-- Now that all existing rows have created_by, make it NOT NULL
ALTER TABLE public.properties
  ALTER COLUMN created_by SET NOT NULL;

-- Set default to auth.uid() for new insertions
ALTER TABLE public.properties
  ALTER COLUMN created_by SET DEFAULT auth.uid();

-- =====================================================
-- STEP 4: Create index for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_properties_created_by 
  ON public.properties(created_by);

-- =====================================================
-- STEP 5: Add trigger to prevent created_by changes
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS prevent_created_by_change_trigger ON public.properties;
DROP FUNCTION IF EXISTS public.prevent_created_by_change() CASCADE;

-- Create function to prevent created_by from being changed
CREATE OR REPLACE FUNCTION public.prevent_created_by_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If created_by is being changed (and it's not the initial insert)
  IF OLD.created_by IS NOT NULL AND NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'created_by cannot be changed after property creation'
      USING HINT = 'The created_by field is immutable and tracks the original creator';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce immutability
CREATE TRIGGER prevent_created_by_change_trigger
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_created_by_change();

-- =====================================================
-- STEP 6: Add comments for documentation
-- =====================================================

COMMENT ON COLUMN public.properties.created_by IS 
  'Immutable UUID of the user who originally created this property listing. Used for ownership tracking regardless of advertiser_type changes.';

COMMENT ON COLUMN public.properties.owner_id IS 
  'Current owner of the property listing. May change over time (e.g., when transferring ownership).';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify column was added:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'properties' AND column_name IN ('created_by', 'owner_id');

-- Verify all properties have created_by set:
-- SELECT COUNT(*) as total,
--        COUNT(created_by) as with_created_by,
--        COUNT(*) - COUNT(created_by) as missing_created_by
-- FROM public.properties;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
