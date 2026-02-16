-- =====================================================
-- Migration 115: Diagnostic for Artisan Relationship Issue
-- =====================================================
-- Purpose: Diagnose the missing relationship between artisan_profiles and artisan_services
-- Issue: "Could not find a relationship between 'artisan_profiles' and 'artisan_services' in the schema cache"
-- =====================================================

-- =====================================================
-- DIAGNOSTIC SECTION - Check Current State
-- =====================================================

-- 1. Check if both tables exist
DO $$
BEGIN
  RAISE NOTICE '=== TABLE EXISTENCE CHECK ===';
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'artisan_profiles') THEN
    RAISE NOTICE '✓ artisan_profiles table exists';
  ELSE
    RAISE WARNING '✗ artisan_profiles table MISSING';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'artisan_services') THEN
    RAISE NOTICE '✓ artisan_services table exists';
  ELSE
    RAISE WARNING '✗ artisan_services table MISSING';
  END IF;
END $$;

-- 2. Check columns in artisan_services
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  RAISE NOTICE '=== ARTISAN_SERVICES COLUMNS CHECK ===';
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artisan_services' 
    AND column_name = 'artisan_id'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✓ artisan_services.artisan_id exists (references auth.users)';
  ELSE
    RAISE WARNING '✗ artisan_services.artisan_id MISSING';
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artisan_services' 
    AND column_name = 'artisan_profile_id'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✓ artisan_services.artisan_profile_id exists';
  ELSE
    RAISE WARNING '✗ artisan_services.artisan_profile_id MISSING (THIS IS THE PROBLEM!)';
  END IF;
END $$;

-- 3. Check foreign keys on artisan_services
SELECT 
  '=== FOREIGN KEYS ON ARTISAN_SERVICES ===' as check_type,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name = 'artisan_services';

-- 4. Check row counts
SELECT 
  '=== ROW COUNTS ===' as check_type,
  (SELECT COUNT(*) FROM public.artisan_profiles) as artisan_profiles_count,
  (SELECT COUNT(*) FROM public.artisan_services) as artisan_services_count;

-- 5. Check for orphaned records (services without matching profiles)
SELECT 
  '=== ORPHANED SERVICES CHECK ===' as check_type,
  COUNT(*) as orphaned_services_count
FROM public.artisan_services as2
WHERE NOT EXISTS (
  SELECT 1 FROM public.artisan_profiles ap
  WHERE ap.user_id = as2.artisan_id
  AND ap.service_category_id = as2.category_id
);

-- 6. Sample data - show relationship attempt
SELECT 
  '=== SAMPLE JOIN ATTEMPT ===' as check_type,
  as2.id as service_id,
  as2.artisan_id,
  ap.id as profile_id,
  ap.user_id,
  CASE 
    WHEN ap.id IS NULL THEN 'NO MATCH - Profile not found'
    ELSE 'MATCH FOUND'
  END as relationship_status
FROM public.artisan_services as2
LEFT JOIN public.artisan_profiles ap 
  ON ap.user_id = as2.artisan_id 
  AND ap.service_category_id = as2.category_id
LIMIT 5;

-- =====================================================
-- END OF DIAGNOSTIC
-- =====================================================
-- Next step: Run migration 116 to fix the relationship
-- =====================================================
