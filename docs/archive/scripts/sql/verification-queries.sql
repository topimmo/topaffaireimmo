-- =====================================================
-- VERIFICATION QUERIES: City ID Backfill
-- =====================================================
-- 
-- PURPOSE:
-- Verify the backfill script worked correctly and listings are now visible
--
-- Run these queries BEFORE and AFTER the backfill to compare results
--
-- =====================================================

\echo '============================================='
\echo 'VERIFICATION QUERIES - City ID Backfill'
\echo '============================================='
\echo ''

-- =====================================================
-- SECTION 1: NULL city_id Analysis
-- =====================================================

\echo '1. Properties with NULL city_id (should be 0 or minimal after backfill)'
\echo '------------------------------------------------------------------------'

-- Total count
SELECT 
  COUNT(*) as total_null_city_id,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM public.properties), 0), 2) as percentage_of_total
FROM public.properties
WHERE city_id IS NULL;

\echo ''

-- Breakdown by status
SELECT 
  status,
  COUNT(*) as count_with_null_city_id,
  ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0), 2) as percentage
FROM public.properties
WHERE city_id IS NULL
GROUP BY status
ORDER BY count_with_null_city_id DESC;

\echo ''

-- =====================================================
-- SECTION 2: Published Properties Visibility
-- =====================================================

\echo '2. Published properties that should be visible on website'
\echo '----------------------------------------------------------'

-- Count of visible published properties
SELECT 
  COUNT(*) as visible_published_properties
FROM public.properties
WHERE status = 'published'
  AND (is_archived = FALSE OR is_archived IS NULL)
  AND city_id IS NOT NULL;

\echo ''

-- Count of invisible published properties (potential problem)
SELECT 
  COUNT(*) as invisible_published_properties,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All published properties are visible'
    ELSE '⚠️  Some published properties are still invisible'
  END as status
FROM public.properties
WHERE status = 'published'
  AND (is_archived = FALSE OR is_archived IS NULL)
  AND city_id IS NULL;

\echo ''

-- =====================================================
-- SECTION 3: City Distribution
-- =====================================================

\echo '3. Published properties grouped by city (verifies visibility)'
\echo '-------------------------------------------------------------'

-- Group by city with counts
SELECT 
  c.name_fr as city_name_fr,
  c.name_ar as city_name_ar,
  COUNT(p.id) as property_count,
  COUNT(CASE WHEN p.status = 'published' THEN 1 END) as published_count,
  COUNT(CASE WHEN p.neighborhood_id IS NOT NULL THEN 1 END) as with_neighborhood
FROM public.cities c
LEFT JOIN public.properties p ON p.city_id = c.id
WHERE c.is_active = true
GROUP BY c.id, c.name_fr, c.name_ar
HAVING COUNT(p.id) > 0
ORDER BY published_count DESC, property_count DESC
LIMIT 20;

\echo ''

-- =====================================================
-- SECTION 4: Neighborhood Backfill Success
-- =====================================================

\echo '4. Neighborhood backfill results'
\echo '--------------------------------'

-- Count properties with neighborhood_id
SELECT 
  COUNT(*) as total_properties_with_neighborhood,
  COUNT(CASE WHEN status = 'published' THEN 1 END) as published_with_neighborhood
FROM public.properties
WHERE neighborhood_id IS NOT NULL;

\echo ''

-- Properties with city but no neighborhood (potential for improvement)
SELECT 
  COUNT(*) as properties_with_city_no_neighborhood
FROM public.properties
WHERE city_id IS NOT NULL
  AND neighborhood_id IS NULL
  AND status IN ('published', 'approved');

\echo ''

-- =====================================================
-- SECTION 5: Data Quality Check
-- =====================================================

\echo '5. Data quality verification'
\echo '----------------------------'

-- Check for orphaned city_id values (should be 0)
SELECT 
  COUNT(*) as orphaned_city_id_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No orphaned city_id values'
    ELSE '⚠️  Found orphaned city_id values (referential integrity issue)'
  END as status
FROM public.properties p
WHERE p.city_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.cities c WHERE c.id = p.city_id
  );

\echo ''

-- Check for orphaned neighborhood_id values (should be 0)
SELECT 
  COUNT(*) as orphaned_neighborhood_id_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No orphaned neighborhood_id values'
    ELSE '⚠️  Found orphaned neighborhood_id values (referential integrity issue)'
  END as status
FROM public.properties p
WHERE p.neighborhood_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.neighborhoods n WHERE n.id = p.neighborhood_id
  );

\echo ''

-- =====================================================
-- SECTION 6: Sample Data Preview
-- =====================================================

\echo '6. Sample of published properties with full location data'
\echo '----------------------------------------------------------'

SELECT 
  p.id::text as property_id,
  SUBSTRING(p.title_fr FROM 1 FOR 50) as title,
  c.name_fr as city,
  n.name_fr as neighborhood,
  p.status,
  p.price,
  p.created_at::date as created_date
FROM public.properties p
LEFT JOIN public.cities c ON p.city_id = c.id
LEFT JOIN public.neighborhoods n ON p.neighborhood_id = n.id
WHERE p.status = 'published'
  AND (p.is_archived = FALSE OR p.is_archived IS NULL)
ORDER BY p.created_at DESC
LIMIT 10;

\echo ''

-- =====================================================
-- SECTION 7: Frontend Query Simulation
-- =====================================================

\echo '7. Simulating frontend query (what users will see)'
\echo '---------------------------------------------------'

-- This simulates the Supabase query used in frontend:
-- .select('id, title_fr, city:cities(name_fr, name_ar)')
SELECT 
  jsonb_build_object(
    'id', p.id,
    'title_fr', p.title_fr,
    'price', p.price,
    'transaction_type', p.transaction_type,
    'property_type', p.property_type,
    'city', jsonb_build_object(
      'name_fr', c.name_fr,
      'name_ar', c.name_ar
    ),
    'neighborhood', CASE 
      WHEN n.id IS NOT NULL THEN jsonb_build_object(
        'name_fr', n.name_fr,
        'name_ar', n.name_ar
      )
      ELSE NULL
    END
  ) as property_data
FROM public.properties p
INNER JOIN public.cities c ON p.city_id = c.id
LEFT JOIN public.neighborhoods n ON p.neighborhood_id = n.id
WHERE p.status = 'published'
  AND (p.is_archived = FALSE OR p.is_archived IS NULL)
ORDER BY p.created_at DESC
LIMIT 5;

\echo ''

-- =====================================================
-- SECTION 8: Advertiser Type Verification
-- =====================================================

\echo '8. Verify advertiser_type preserved (should show all three types)'
\echo '-------------------------------------------------------------------'

-- Count by advertiser_type (verify no changes)
SELECT 
  advertiser_type,
  COUNT(*) as count,
  COUNT(CASE WHEN status = 'published' THEN 1 END) as published_count
FROM public.properties
WHERE advertiser_type IS NOT NULL
GROUP BY advertiser_type
ORDER BY count DESC;

\echo ''

-- Verify users can have multiple listings with different advertiser types
SELECT 
  owner_id::text,
  COUNT(DISTINCT advertiser_type) as different_advertiser_types,
  COUNT(*) as total_listings,
  array_agg(DISTINCT advertiser_type) as types_used
FROM public.properties
GROUP BY owner_id
HAVING COUNT(DISTINCT advertiser_type) > 1
LIMIT 5;

\echo ''

-- =====================================================
-- SECTION 9: Constraint Verification
-- =====================================================

\echo '9. Verify defensive constraint is active'
\echo '-----------------------------------------'

-- Check if constraint exists
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition,
  '✅ Constraint is active' as status
FROM pg_constraint
WHERE conname = 'properties_city_id_required_for_published'
  AND conrelid = 'public.properties'::regclass;

\echo ''

-- Count properties that violate the constraint (should be 0)
SELECT 
  COUNT(*) as constraint_violations,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No constraint violations (all published properties have city_id)'
    ELSE '⚠️  Constraint violations found (should not happen after backfill)'
  END as status
FROM public.properties
WHERE status IN ('published', 'approved')
  AND city_id IS NULL;

\echo ''

-- =====================================================
-- SECTION 10: Before/After Comparison
-- =====================================================

\echo '10. Before/After Summary (run before backfill, then after)'
\echo '----------------------------------------------------------'

-- Comprehensive summary
SELECT 
  (SELECT COUNT(*) FROM public.properties) as total_properties,
  (SELECT COUNT(*) FROM public.properties WHERE city_id IS NULL) as null_city_id,
  (SELECT COUNT(*) FROM public.properties WHERE city_id IS NOT NULL) as has_city_id,
  (SELECT COUNT(*) FROM public.properties WHERE status = 'published' AND city_id IS NOT NULL) as visible_published,
  (SELECT COUNT(*) FROM public.properties WHERE status = 'published' AND city_id IS NULL) as invisible_published,
  (SELECT COUNT(*) FROM public.properties WHERE neighborhood_id IS NOT NULL) as has_neighborhood,
  (SELECT COUNT(DISTINCT advertiser_type) FROM public.properties) as distinct_advertiser_types;

\echo ''

-- =====================================================
-- SUCCESS CRITERIA
-- =====================================================

\echo '============================================='
\echo 'SUCCESS CRITERIA (After Backfill)'
\echo '============================================='
\echo ''
\echo 'The backfill is successful if:'
\echo '  ✓ NULL city_id count is 0 or minimal (only drafts/pending)'
\echo '  ✓ invisible_published count is 0'
\echo '  ✓ All cities show property counts'
\echo '  ✓ Frontend query simulation returns data with city objects'
\echo '  ✓ advertiser_type has 3 distinct values (owner, broker, agency)'
\echo '  ✓ Constraint is active and no violations exist'
\echo '  ✓ No orphaned city_id or neighborhood_id values'
\echo ''
\echo '============================================='
