-- =====================================================
-- Migration 116: Fix artisan_profiles ↔ artisan_services Relationship
-- =====================================================
-- Purpose: Add missing foreign key relationship between artisan_services and artisan_profiles
-- Issue: "Could not find a relationship between 'artisan_profiles' and 'artisan_services' in the schema cache"
-- Solution: Add artisan_profile_id column with FK constraint
-- =====================================================

-- =====================================================
-- STEP 1: Add artisan_profile_id column (IF NOT EXISTS)
-- =====================================================

DO $$
BEGIN
  -- Check if column already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artisan_services' 
    AND column_name = 'artisan_profile_id'
  ) THEN
    -- Add the column
    ALTER TABLE public.artisan_services 
    ADD COLUMN artisan_profile_id UUID;
    
    RAISE NOTICE '✓ Added artisan_profile_id column to artisan_services';
  ELSE
    RAISE NOTICE 'ℹ artisan_profile_id column already exists';
  END IF;
END $$;

-- =====================================================
-- STEP 2: Populate artisan_profile_id for existing records
-- =====================================================

-- Update existing records to link to the correct profile
-- Match on: user_id (artisan_id) AND service category
UPDATE public.artisan_services as2
SET artisan_profile_id = ap.id
FROM public.artisan_profiles ap
WHERE ap.user_id = as2.artisan_id
  AND ap.service_category_id = as2.category_id
  AND as2.artisan_profile_id IS NULL;

-- Log results
DO $$
DECLARE
  updated_count INTEGER;
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM public.artisan_services
  WHERE artisan_profile_id IS NOT NULL;
  
  SELECT COUNT(*) INTO null_count
  FROM public.artisan_services
  WHERE artisan_profile_id IS NULL;
  
  RAISE NOTICE '✓ Updated % artisan_services records with profile_id', updated_count;
  
  IF null_count > 0 THEN
    RAISE WARNING '⚠ % artisan_services records still have NULL profile_id (orphaned services)', null_count;
  END IF;
END $$;

-- =====================================================
-- STEP 3: Add Foreign Key Constraint (IF NOT EXISTS)
-- =====================================================

DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'artisan_services' 
    AND constraint_name = 'artisan_services_profile_id_fkey'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE public.artisan_services
    ADD CONSTRAINT artisan_services_profile_id_fkey
    FOREIGN KEY (artisan_profile_id)
    REFERENCES public.artisan_profiles(id)
    ON DELETE CASCADE;
    
    RAISE NOTICE '✓ Added foreign key constraint artisan_services_profile_id_fkey';
  ELSE
    RAISE NOTICE 'ℹ Foreign key constraint already exists';
  END IF;
END $$;

-- =====================================================
-- STEP 4: Create Index on artisan_profile_id (IF NOT EXISTS)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_artisan_services_profile_id 
ON public.artisan_services(artisan_profile_id);

-- =====================================================
-- STEP 5: Update Unique Constraint (Optional - for data integrity)
-- =====================================================

-- Drop old unique constraint and create new one that includes profile_id
DO $$
BEGIN
  -- Drop old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'artisan_services' 
    AND constraint_name = 'artisan_services_artisan_id_subcategory_id_city_key'
  ) THEN
    ALTER TABLE public.artisan_services
    DROP CONSTRAINT artisan_services_artisan_id_subcategory_id_city_key;
    
    RAISE NOTICE '✓ Dropped old unique constraint';
  END IF;
  
  -- Create new unique constraint that includes profile_id
  -- This ensures an artisan profile can't have duplicate subcategories in the same city
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'artisan_services' 
    AND constraint_name = 'artisan_services_profile_subcategory_city_key'
  ) THEN
    -- Only create unique constraint on non-null profile_ids
    -- to handle any orphaned records gracefully
    CREATE UNIQUE INDEX artisan_services_profile_subcategory_city_key
    ON public.artisan_services(artisan_profile_id, subcategory_id, city)
    WHERE artisan_profile_id IS NOT NULL;
    
    RAISE NOTICE '✓ Created new unique constraint on (profile_id, subcategory_id, city)';
  END IF;
END $$;

-- =====================================================
-- STEP 6: Add Comment
-- =====================================================

COMMENT ON COLUMN public.artisan_services.artisan_profile_id IS 
  'Foreign key to artisan_profiles. Links service offerings to the artisan profile. Required for PostgREST relationship queries.';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Test the relationship join
DO $$
DECLARE
  total_services INTEGER;
  linked_services INTEGER;
  orphaned_services INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_services FROM public.artisan_services;
  
  SELECT COUNT(*) INTO linked_services 
  FROM public.artisan_services 
  WHERE artisan_profile_id IS NOT NULL;
  
  SELECT COUNT(*) INTO orphaned_services 
  FROM public.artisan_services 
  WHERE artisan_profile_id IS NULL;
  
  RAISE NOTICE '=== RELATIONSHIP FIX SUMMARY ===';
  RAISE NOTICE 'Total artisan_services: %', total_services;
  RAISE NOTICE 'Linked to profiles: %', linked_services;
  RAISE NOTICE 'Orphaned (NULL profile_id): %', orphaned_services;
  
  IF orphaned_services = 0 THEN
    RAISE NOTICE '✓ All services successfully linked to profiles!';
  ELSE
    RAISE WARNING '⚠ Some services could not be linked (missing profiles)';
  END IF;
END $$;

-- =====================================================
-- REFRESH POSTGREST SCHEMA CACHE
-- =====================================================

-- This notifies PostgREST to reload the schema and detect the new relationship
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- END OF MIGRATION
-- =====================================================

-- After running this migration:
-- 1. PostgREST will detect the relationship between artisan_profiles and artisan_services
-- 2. Frontend queries like .select('*, artisan_profiles(*)') will work
-- 3. Joins on artisan_profile_id will work correctly
-- =====================================================
