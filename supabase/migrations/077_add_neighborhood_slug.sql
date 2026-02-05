-- Migration: Add slug field to neighborhoods table
-- Description: Add slug field for URL-friendly neighborhood identifiers
-- This is critical for SEO and routing purposes

-- Add slug column
ALTER TABLE neighborhoods 
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Generate slugs from French names for existing neighborhoods
-- Convert to lowercase, replace spaces and special chars with hyphens
UPDATE neighborhoods 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(name_fr, '[^a-zA-Z0-9\s-]', '', 'g'),  -- Remove special chars
    '\s+', '-', 'g'  -- Replace spaces with hyphens
  )
)
WHERE slug IS NULL;

-- Add unique constraint
ALTER TABLE neighborhoods 
  ADD CONSTRAINT neighborhoods_slug_unique UNIQUE (slug);

-- Make slug NOT NULL after backfilling
ALTER TABLE neighborhoods 
  ALTER COLUMN slug SET NOT NULL;

-- Add index for performance (slug will be used in queries)
CREATE INDEX IF NOT EXISTS idx_neighborhoods_slug ON neighborhoods(slug);

-- Add comment
COMMENT ON COLUMN neighborhoods.slug IS 'URL-friendly slug for neighborhood, generated from name_fr';

-- Verify the migration worked
DO $$
DECLARE
  slug_count INTEGER;
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO slug_count FROM neighborhoods WHERE slug IS NOT NULL;
  SELECT COUNT(*) INTO null_count FROM neighborhoods WHERE slug IS NULL;
  
  RAISE NOTICE 'Migration complete: % neighborhoods have slugs, % have NULL slugs', slug_count, null_count;
  
  IF null_count > 0 THEN
    RAISE WARNING 'Found % neighborhoods with NULL slugs - this should not happen', null_count;
  END IF;
END $$;
