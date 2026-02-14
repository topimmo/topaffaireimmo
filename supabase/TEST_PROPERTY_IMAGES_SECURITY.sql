-- =====================================================
-- TEST SUITE: Property Images Security Fix
-- Test migration 108 to ensure property images are secure
-- =====================================================

-- ============================================
-- TEST 1: Verify Old Insecure Policy Is Removed
-- ============================================
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: Old insecure policy removed'
    ELSE '❌ FAIL: Old insecure policy still exists'
  END as test_old_policy_removed
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname = 'property_images_read_approved_owners_only';

-- ============================================
-- TEST 2: Verify New Secure Policy Exists
-- ============================================
SELECT 
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ PASS: New secure policy exists'
    ELSE '❌ FAIL: New secure policy missing (found ' || COUNT(*)::text || ')'
  END as test_new_policy_exists
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname = 'property_images_select_secure';

-- ============================================
-- TEST 3: Verify Policy Does NOT Have Public Access (TRUE clause)
-- ============================================
-- Check if the policy definition contains unrestricted TRUE
SELECT 
  policyname,
  CASE 
    WHEN definition LIKE '%TRUE)%' OR definition LIKE '%TRUE OR%' THEN '❌ FAIL: Policy has TRUE clause (public access)'
    ELSE '✅ PASS: No unrestricted TRUE clause found'
  END as test_no_public_access,
  definition
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname = 'property_images_select_secure';

-- ============================================
-- TEST 4: Verify property_images Table Is Populated
-- ============================================
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS: property_images table has data (' || COUNT(*)::text || ' entries)'
    ELSE '⚠️  WARNING: property_images table is empty (no images to migrate)'
  END as test_table_populated,
  COUNT(*) as total_entries
FROM public.property_images;

-- ============================================
-- TEST 5: Verify Trigger Exists
-- ============================================
SELECT 
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ PASS: Auto-sync trigger exists'
    ELSE '❌ FAIL: Auto-sync trigger missing'
  END as test_trigger_exists
FROM pg_trigger
WHERE tgname = 'sync_property_images_trigger';

-- ============================================
-- TEST 6: Verify Helper Functions Exist
-- ============================================
-- Migration 052 created: can_access_property_image, validate_property_image_access
-- Migration 108 created: sync_property_images, get_image_access_status
SELECT 
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ PASS: All helper functions exist'
    ELSE '❌ FAIL: Missing helper functions (found ' || COUNT(*)::text || ' of 4)'
  END as test_functions_exist
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'can_access_property_image',        -- From migration 052
    'validate_property_image_access',   -- From migration 052
    'sync_property_images',              -- From migration 108
    'get_image_access_status'           -- From migration 108
  );

-- ============================================
-- TEST 7: Compare Images Count
-- ============================================
-- Count images in properties.images vs property_images table
WITH image_counts AS (
  SELECT 
    COUNT(*) as properties_with_images,
    SUM(array_length(images, 1)) as total_images_in_array
  FROM public.properties
  WHERE images IS NOT NULL AND array_length(images, 1) > 0
),
tracked_images AS (
  SELECT COUNT(*) as tracked_count
  FROM public.property_images
)
SELECT 
  ic.properties_with_images,
  ic.total_images_in_array as images_in_properties_table,
  ti.tracked_count as images_in_property_images_table,
  CASE 
    WHEN ic.total_images_in_array = ti.tracked_count THEN '✅ PASS: All images are tracked'
    WHEN ti.tracked_count > ic.total_images_in_array THEN '⚠️  WARNING: More tracked than in array (duplicates?)'
    ELSE '❌ FAIL: Some images not tracked (' || (ic.total_images_in_array - ti.tracked_count)::text || ' missing)'
  END as test_all_images_tracked
FROM image_counts ic, tracked_images ti;

-- ============================================
-- TEST 8: Verify Security By Property Status
-- ============================================
-- Count images by property status to verify security model
SELECT 
  p.status,
  COUNT(DISTINCT pi.id) as image_count,
  COUNT(DISTINCT p.id) as property_count,
  CASE 
    WHEN p.status = 'approved' THEN '✅ These images should be publicly accessible'
    ELSE '🔒 These images should require authentication'
  END as access_level
FROM public.properties p
LEFT JOIN public.property_images pi ON p.id = pi.property_id
WHERE pi.id IS NOT NULL
GROUP BY p.status
ORDER BY p.status;

-- ============================================
-- TEST 9: Sample Access Check
-- ============================================
-- Test the get_image_access_status function (if there are images)
SELECT 
  '🧪 Testing access check function...' as test_name;

-- Get a sample approved property image
WITH sample_approved AS (
  SELECT pi.image_path
  FROM public.property_images pi
  JOIN public.properties p ON pi.property_id = p.id
  WHERE p.status = 'approved'
  LIMIT 1
)
SELECT 
  image_path,
  (SELECT * FROM public.get_image_access_status(image_path)) as access_info
FROM sample_approved;

-- Get a sample unapproved property image
WITH sample_unapproved AS (
  SELECT pi.image_path
  FROM public.property_images pi
  JOIN public.properties p ON pi.property_id = p.id
  WHERE p.status != 'approved'
  LIMIT 1
)
SELECT 
  image_path,
  (SELECT * FROM public.get_image_access_status(image_path)) as access_info
FROM sample_unapproved;

-- ============================================
-- SUMMARY
-- ============================================
SELECT 
  '🎯 SECURITY FIX VERIFICATION COMPLETE' as summary,
  'Review all test results above to ensure migration was successful' as instructions;

-- =====================================================
-- END OF TEST SUITE
-- =====================================================
