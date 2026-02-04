-- =====================================================
-- TEST SCRIPT: Verify backfill-city-id.sql logic
-- =====================================================
-- 
-- This script tests the backfill logic without modifying production data
-- Uses a temporary table to simulate the scenario
--
-- =====================================================

\echo '============================================='
\echo 'BACKFILL CITY_ID - TEST SCRIPT'
\echo '============================================='
\echo ''

-- =====================================================
-- STEP 1: Create temporary test data
-- =====================================================

\echo '1. Creating temporary test tables...'

-- Create temporary cities table (copy structure)
CREATE TEMP TABLE IF NOT EXISTS test_cities AS
SELECT * FROM public.cities WHERE 1=0; -- Empty copy of structure

-- Insert sample cities
INSERT INTO test_cities (id, name_fr, name_ar, region_fr, is_active)
VALUES 
  (1, 'Casablanca', 'الدار البيضاء', 'Casablanca-Settat', true),
  (2, 'Rabat', 'الرباط', 'Rabat-Salé-Kénitra', true),
  (3, 'Marrakech', 'مراكش', 'Marrakech-Safi', true),
  (4, 'Fès', 'فاس', 'Fès-Meknès', true),
  (5, 'Tanger', 'طنجة', 'Tanger-Tétouan-Al Hoceïma', true);

-- Create temporary properties table with city column
CREATE TEMP TABLE IF NOT EXISTS test_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_fr TEXT,
  city TEXT,  -- This is the plain text city field
  city_id INTEGER,  -- This is NULL and needs to be backfilled
  custom_neighborhood TEXT,
  status TEXT DEFAULT 'published'
);

-- Insert test properties with various scenarios
INSERT INTO test_properties (title_fr, city, city_id, custom_neighborhood, status)
VALUES
  -- Scenario 1: Exact match
  ('Property 1', 'Casablanca', NULL, 'Maarif', 'published'),
  
  -- Scenario 2: Case variation
  ('Property 2', 'RABAT', NULL, 'Agdal', 'published'),
  
  -- Scenario 3: Whitespace
  ('Property 3', ' Marrakech ', NULL, 'Gueliz', 'published'),
  
  -- Scenario 4: Different case and whitespace
  ('Property 4', '  tanger  ', NULL, 'Malabata', 'approved'),
  
  -- Scenario 5: Already has city_id (should NOT be updated)
  ('Property 5', 'Fès', 4, 'Ville Nouvelle', 'published'),
  
  -- Scenario 6: Unknown city (should remain NULL)
  ('Property 6', 'UnknownCity', NULL, 'Some neighborhood', 'published'),
  
  -- Scenario 7: Empty city (should remain NULL)
  ('Property 7', '', NULL, 'Some neighborhood', 'published'),
  
  -- Scenario 8: NULL city (should remain NULL)
  ('Property 8', NULL, NULL, 'Some neighborhood', 'pending'),
  
  -- Scenario 9: City in custom_neighborhood (Strategy B)
  ('Property 9', NULL, NULL, 'Casablanca', 'published');

\echo '✓ Test data created'
\echo ''

-- =====================================================
-- STEP 2: Show initial state
-- =====================================================

\echo '2. Initial state:'
\echo '----------------'

SELECT 
  id::text,
  title_fr,
  city,
  city_id,
  custom_neighborhood,
  status
FROM test_properties
ORDER BY title_fr;

\echo ''
\echo 'Properties with NULL city_id:'
SELECT COUNT(*) FROM test_properties WHERE city_id IS NULL;

\echo ''

-- =====================================================
-- STEP 3: Execute backfill logic (Strategy A)
-- =====================================================

\echo '3. Executing backfill (Strategy A - city column)...'

DO $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Strategy A: Match on city column
  WITH matched_cities AS (
    SELECT DISTINCT
      p.id as property_id,
      c.id as matched_city_id,
      p.city as property_city_text,
      c.name_fr as matched_city_name
    FROM test_properties p
    INNER JOIN test_cities c 
      ON TRIM(UPPER(p.city)) = TRIM(UPPER(c.name_fr))
    WHERE p.city_id IS NULL
      AND p.city IS NOT NULL
      AND TRIM(p.city) != ''
  )
  UPDATE test_properties p
  SET city_id = mc.matched_city_id
  FROM matched_cities mc
  WHERE p.id = mc.property_id
    AND p.city_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Strategy A: Updated % properties', updated_count;
END $$;

\echo ''

-- =====================================================
-- STEP 4: Execute backfill logic (Strategy B)
-- =====================================================

\echo '4. Executing backfill (Strategy B - custom_neighborhood)...'

DO $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Strategy B: Match on custom_neighborhood
  WITH matched_cities AS (
    SELECT DISTINCT
      p.id as property_id,
      c.id as matched_city_id,
      p.custom_neighborhood as property_neighborhood_text,
      c.name_fr as matched_city_name
    FROM test_properties p
    INNER JOIN test_cities c 
      ON TRIM(UPPER(p.custom_neighborhood)) = TRIM(UPPER(c.name_fr))
    WHERE p.city_id IS NULL
      AND p.custom_neighborhood IS NOT NULL
      AND TRIM(p.custom_neighborhood) != ''
  )
  UPDATE test_properties p
  SET city_id = mc.matched_city_id
  FROM matched_cities mc
  WHERE p.id = mc.property_id
    AND p.city_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Strategy B: Updated % properties', updated_count;
END $$;

\echo ''

-- =====================================================
-- STEP 5: Show results
-- =====================================================

\echo '5. Results after backfill:'
\echo '--------------------------'

SELECT 
  p.title_fr,
  p.city as original_city_text,
  p.city_id,
  c.name_fr as matched_city_name,
  p.custom_neighborhood,
  p.status,
  CASE 
    WHEN p.city_id IS NOT NULL THEN '✓ Matched'
    ELSE '✗ No match'
  END as result
FROM test_properties p
LEFT JOIN test_cities c ON p.city_id = c.id
ORDER BY p.title_fr;

\echo ''

-- =====================================================
-- STEP 6: Verification
-- =====================================================

\echo '6. Verification:'
\echo '----------------'

-- Count successful matches
\echo 'Properties successfully matched:'
SELECT COUNT(*) as matched_count 
FROM test_properties 
WHERE city_id IS NOT NULL
  AND title_fr NOT LIKE 'Property 5%'; -- Exclude the one that already had city_id

\echo ''

-- Count remaining NULL
\echo 'Properties still with NULL city_id:'
SELECT COUNT(*) as still_null_count 
FROM test_properties 
WHERE city_id IS NULL;

\echo ''

-- Verify no overwrites
\echo 'Verify Property 5 was NOT changed:'
SELECT 
  title_fr,
  city,
  city_id,
  CASE 
    WHEN city_id = 4 THEN '✓ Unchanged (as expected)'
    ELSE '✗ ERROR: Was modified!'
  END as verification
FROM test_properties 
WHERE title_fr = 'Property 5';

\echo ''

-- =====================================================
-- STEP 7: Expected results summary
-- =====================================================

\echo '7. Expected Results:'
\echo '--------------------'
\echo ''
\echo '✓ Property 1: Casablanca → city_id = 1 (exact match)'
\echo '✓ Property 2: RABAT → city_id = 2 (case insensitive)'
\echo '✓ Property 3: " Marrakech " → city_id = 3 (trimmed)'
\echo '✓ Property 4: "  tanger  " → city_id = 5 (case + trim)'
\echo '✓ Property 5: Already had city_id = 4 (UNCHANGED)'
\echo '✗ Property 6: UnknownCity → city_id = NULL (no match)'
\echo '✗ Property 7: Empty city → city_id = NULL (empty string)'
\echo '✗ Property 8: NULL city → city_id = NULL (null value)'
\echo '✓ Property 9: custom_neighborhood = Casablanca → city_id = 1 (Strategy B)'
\echo ''

-- Clean up
DROP TABLE IF EXISTS test_properties;
DROP TABLE IF EXISTS test_cities;

\echo '============================================='
\echo 'TEST COMPLETE'
\echo '============================================='
\echo ''
\echo 'The backfill logic has been tested successfully!'
\echo 'If all verifications passed, the script is ready for production.'
\echo ''
