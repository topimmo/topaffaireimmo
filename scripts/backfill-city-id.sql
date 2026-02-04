-- =====================================================
-- BACKFILL SCRIPT: Populate properties.city_id from city text
-- =====================================================
-- 
-- PURPOSE:
-- Fix properties where city_id is NULL by matching city text with cities.name_fr
-- This makes listings visible on the public website which uses JOIN with cities table
--
-- ROOT CAUSE:
-- Some properties have NULL city_id but contain city name as plain text
-- Frontend uses: city:cities(name_fr, name_ar) which requires city_id to be set
-- Listings with NULL city_id are excluded from search/listing pages
--
-- SAFETY GUARANTEES:
-- ✓ Only updates rows where city_id IS NULL (never overwrites existing values)
-- ✓ Uses case-insensitive matching with TRIM to handle variations
-- ✓ No changes to profiles, advertiser_type, or neighborhoods
-- ✓ No schema changes (follows constraint: "do NOT change database schema")
-- ✓ Idempotent: safe to run multiple times
-- ✓ Read-only on cities table (no seed script execution)
-- ✓ Uses INNER JOIN to ensure only valid city matches are updated
--
-- ASSUMPTIONS:
-- This script assumes there is a TEXT column containing city names.
-- Common possibilities:
-- 1. properties.city (TEXT column with city name)
-- 2. properties.custom_neighborhood (might contain city name)
-- 3. properties.address (might contain city name)
--
-- We'll try multiple approaches to maximize coverage
--
-- =====================================================

\echo '============================================='
\echo 'CITY_ID BACKFILL SCRIPT'
\echo '============================================='
\echo 'This script will populate NULL city_id values'
\echo 'by matching city text with cities.name_fr'
\echo '============================================='
\echo ''

-- =====================================================
-- SECTION 1: DIAGNOSTIC - Check current state
-- =====================================================

\echo '1. DIAGNOSTIC: Current state'
\echo '----------------------------'

-- Count properties with NULL city_id
SELECT 
  COUNT(*) as properties_with_null_city_id,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM public.properties), 0), 2) as percentage
FROM public.properties
WHERE city_id IS NULL;

-- Count by status
SELECT 
  status,
  COUNT(*) as count_with_null_city_id
FROM public.properties
WHERE city_id IS NULL
GROUP BY status
ORDER BY count DESC;

\echo ''

-- =====================================================
-- SECTION 2: Check if a city TEXT column exists
-- =====================================================

\echo '2. SCHEMA CHECK: Looking for city text columns'
\echo '-----------------------------------------------'

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'properties'
  AND column_name IN ('city', 'custom_neighborhood', 'address')
ORDER BY column_name;

\echo ''

-- =====================================================
-- SECTION 3: Sample data inspection
-- =====================================================

\echo '3. SAMPLE DATA: Properties with NULL city_id'
\echo '---------------------------------------------'

-- Show sample of properties with NULL city_id
-- This helps us understand what data is available for matching
SELECT 
  id,
  title_fr,
  city_id,
  -- Try to show any city-related text fields that exist
  -- Note: This query will show NULL for columns that don't exist
  COALESCE(
    (SELECT column_name FROM information_schema.columns 
     WHERE table_name = 'properties' AND column_name = 'city' LIMIT 1),
    'N/A'
  ) as has_city_column,
  custom_neighborhood,
  SUBSTRING(address FROM 1 FOR 50) as address_preview
FROM public.properties
WHERE city_id IS NULL
  AND status IN ('published', 'approved', 'pending')
ORDER BY created_at DESC
LIMIT 5;

\echo ''

-- =====================================================
-- SECTION 4: BACKFILL STRATEGY
-- =====================================================

\echo '4. BACKFILL EXECUTION'
\echo '---------------------'
\echo ''

-- Strategy A: If properties.city column exists, match on it
-- This is the most direct approach mentioned in the problem statement

DO $$
DECLARE
  has_city_column BOOLEAN;
  updated_count INTEGER := 0;
BEGIN
  -- Check if city column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'properties' 
      AND column_name = 'city'
  ) INTO has_city_column;
  
  IF has_city_column THEN
    RAISE NOTICE 'Strategy A: Found city column, proceeding with backfill...';
    
    -- Update city_id by matching city text with cities.name_fr
    -- Uses TRIM and case-insensitive comparison (ILIKE)
    WITH matched_cities AS (
      SELECT DISTINCT
        p.id as property_id,
        c.id as matched_city_id,
        p.city as property_city_text,
        c.name_fr as matched_city_name
      FROM public.properties p
      INNER JOIN public.cities c 
        ON TRIM(UPPER(p.city)) = TRIM(UPPER(c.name_fr))
      WHERE p.city_id IS NULL
        AND p.city IS NOT NULL
        AND TRIM(p.city) != ''
    )
    UPDATE public.properties p
    SET city_id = mc.matched_city_id
    FROM matched_cities mc
    WHERE p.id = mc.property_id
      AND p.city_id IS NULL;  -- Double-check NULL to be extra safe
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE '✅ Strategy A completed: Updated % properties', updated_count;
    
  ELSE
    RAISE NOTICE '⚠️  Strategy A skipped: city column does not exist';
  END IF;
END $$;

\echo ''

-- Strategy B: Try matching on custom_neighborhood
-- Some properties might have city name in custom_neighborhood field

DO $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Strategy B: Attempting to match city from custom_neighborhood...';
  
  -- Only match if custom_neighborhood exactly matches a city name
  -- This is conservative to avoid false positives
  WITH matched_cities AS (
    SELECT DISTINCT
      p.id as property_id,
      c.id as matched_city_id,
      p.custom_neighborhood as property_neighborhood_text,
      c.name_fr as matched_city_name
    FROM public.properties p
    INNER JOIN public.cities c 
      ON TRIM(UPPER(p.custom_neighborhood)) = TRIM(UPPER(c.name_fr))
    WHERE p.city_id IS NULL
      AND p.custom_neighborhood IS NOT NULL
      AND TRIM(p.custom_neighborhood) != ''
  )
  UPDATE public.properties p
  SET city_id = mc.matched_city_id
  FROM matched_cities mc
  WHERE p.id = mc.property_id
    AND p.city_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  IF updated_count > 0 THEN
    RAISE NOTICE '✅ Strategy B completed: Updated % properties', updated_count;
  ELSE
    RAISE NOTICE '⚠️  Strategy B: No matches found in custom_neighborhood';
  END IF;
END $$;

\echo ''

-- Strategy C: Try extracting city from address field
-- This is more aggressive and may have false positives
-- Only uncomment if Strategies A and B don't work

/*
DO $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Strategy C: Attempting to extract city from address...';
  
  -- Look for city names in address field
  -- Uses pattern matching: address contains city name
  WITH matched_cities AS (
    SELECT DISTINCT
      p.id as property_id,
      c.id as matched_city_id,
      p.address as property_address,
      c.name_fr as matched_city_name
    FROM public.properties p
    INNER JOIN public.cities c 
      ON UPPER(p.address) LIKE '%' || UPPER(c.name_fr) || '%'
    WHERE p.city_id IS NULL
      AND p.address IS NOT NULL
      AND TRIM(p.address) != ''
  )
  UPDATE public.properties p
  SET city_id = mc.matched_city_id
  FROM matched_cities mc
  WHERE p.id = mc.property_id
    AND p.city_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  IF updated_count > 0 THEN
    RAISE NOTICE '✅ Strategy C completed: Updated % properties', updated_count;
  ELSE
    RAISE NOTICE '⚠️  Strategy C: No matches found in address';
  END IF;
END $$;
*/

-- =====================================================
-- SECTION 5: VERIFICATION
-- =====================================================

\echo ''
\echo '5. VERIFICATION: Post-backfill state'
\echo '-------------------------------------'

-- Count remaining NULL city_id
SELECT 
  COUNT(*) as remaining_null_city_id,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM public.properties), 0), 2) as percentage
FROM public.properties
WHERE city_id IS NULL;

-- Show breakdown by status
SELECT 
  status,
  COUNT(*) as count_with_null_city_id
FROM public.properties
WHERE city_id IS NULL
GROUP BY status
ORDER BY count DESC;

\echo ''

-- Count properties that should now be visible
SELECT 
  COUNT(*) as newly_visible_properties
FROM public.properties
WHERE status = 'published'
  AND (is_archived = FALSE OR is_archived IS NULL)
  AND city_id IS NOT NULL;

\echo ''

-- Sample of updated properties with their city information
SELECT 
  p.id,
  p.title_fr,
  p.city_id,
  c.name_fr as city_name,
  p.status
FROM public.properties p
LEFT JOIN public.cities c ON p.city_id = c.id
WHERE p.status IN ('published', 'approved')
  AND p.city_id IS NOT NULL
ORDER BY p.updated_at DESC
LIMIT 5;

\echo ''
\echo '============================================='
\echo 'BACKFILL COMPLETE'
\echo '============================================='
\echo ''
\echo 'Summary:'
\echo '  ✓ Only updated properties with NULL city_id'
\echo '  ✓ Used case-insensitive matching with TRIM'
\echo '  ✓ No changes to profiles, advertiser_type, neighborhoods'
\echo '  ✓ No schema changes'
\echo '  ✓ Idempotent and safe to re-run'
\echo ''
\echo 'Next steps:'
\echo '  1. Verify listings are now visible on public website'
\echo '  2. Test search functionality'
\echo '  3. Check that city filters work correctly'
\echo '============================================='
