-- =====================================================
-- Migration 073: Add Sample Listing Fields
-- =====================================================
--
-- OBJECTIVE:
-- Add fields to support sample/demo property listings:
-- - is_sample: boolean flag to identify sample listings
-- - external_key: unique text identifier for idempotent seeding
--
-- USAGE:
-- Sample listings are used for demonstration and testing purposes.
-- They can be filtered out or highlighted in the UI as needed.
-- external_key ensures idempotent seeding (re-running seed scripts won't create duplicates).
--
-- =====================================================

-- =====================================================
-- STEP 1: Add is_sample column
-- =====================================================

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT FALSE;

-- Add index for filtering sample listings
CREATE INDEX IF NOT EXISTS idx_properties_is_sample 
  ON public.properties(is_sample) 
  WHERE is_sample = TRUE;

-- =====================================================
-- STEP 2: Add external_key column
-- =====================================================

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS external_key TEXT;

-- Add unique constraint when external_key is not null
-- This allows multiple NULL values but enforces uniqueness for non-null values
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_external_key_unique 
  ON public.properties(external_key) 
  WHERE external_key IS NOT NULL;

-- =====================================================
-- STEP 3: Add comments for documentation
-- =====================================================

COMMENT ON COLUMN public.properties.is_sample IS 
  'Boolean flag indicating if this is a sample/demo listing. Used for testing and demonstration purposes.';

COMMENT ON COLUMN public.properties.external_key IS 
  'Unique external identifier for this property. Used for idempotent seeding and external system integration. Must be unique when not null.';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify columns were added:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'properties' AND column_name IN ('is_sample', 'external_key');

-- Verify indexes were created:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'properties' AND indexname LIKE '%sample%' OR indexname LIKE '%external_key%';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
