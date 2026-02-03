-- =====================================================
-- FIX SCRIPT: Resolve Property Listings Display Issues
-- =====================================================
-- Purpose: Fix common issues preventing property listings from showing
-- Based on diagnostic findings
-- =====================================================

\echo '============================================='
\echo 'PROPERTY LISTINGS FIX SCRIPT'
\echo '============================================='
\echo 'This script will:'
\echo '  1. Ensure promo_banners table exists'
\echo '  2. Fix property status/archived inconsistencies'
\echo '  3. Verify RLS policies are correct'
\echo '  4. Provide batch update examples'
\echo ''
\echo 'Review each section before running!'
\echo '============================================='

-- =====================================================
-- SECTION 1: ENSURE PROMO_BANNERS TABLE EXISTS
-- =====================================================

\echo '\n1. Checking promo_banners table...'

-- Create promo_banners if it doesn't exist (from migration 068)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'promo_banners'
  ) THEN
    RAISE NOTICE 'Creating promo_banners table...';
    
    CREATE TABLE public.promo_banners (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      image_url TEXT NOT NULL,
      link_url TEXT,
      position TEXT NOT NULL CHECK (position IN ('home-top', 'home-middle', 'listing-top')),
      is_active BOOLEAN DEFAULT FALSE,
      starts_at TIMESTAMP WITH TIME ZONE,
      ends_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX idx_promo_banners_active ON public.promo_banners(is_active, position);
    
    ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Anyone can view active promo banners"
      ON public.promo_banners
      FOR SELECT
      USING (
        is_active = true
        AND (starts_at IS NULL OR starts_at <= NOW())
        AND (ends_at IS NULL OR ends_at >= NOW())
      );
    
    CREATE POLICY "Admins can manage promo banners"
      ON public.promo_banners
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.admins
          WHERE admins.id = auth.uid()
          AND admins.is_active = true
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.admins
          WHERE admins.id = auth.uid()
          AND admins.is_active = true
        )
      );
    
    RAISE NOTICE 'promo_banners table created successfully';
  ELSE
    RAISE NOTICE 'promo_banners table already exists';
  END IF;
END $$;

-- =====================================================
-- SECTION 2: FIX PROPERTY STATUS INCONSISTENCIES
-- =====================================================

\echo '\n2. Fixing property status inconsistencies...'

-- Fix properties where status and is_archived don't match
UPDATE public.properties 
SET is_archived = TRUE
WHERE status = 'archived' AND is_archived = FALSE;

UPDATE public.properties
SET is_archived = FALSE
WHERE status IN ('draft', 'pending', 'published', 'rejected') AND is_archived = TRUE;

-- Set NULL is_archived to FALSE for non-archived statuses
UPDATE public.properties
SET is_archived = FALSE
WHERE is_archived IS NULL AND status != 'archived';

\echo 'Status/archived inconsistencies fixed'

-- =====================================================
-- SECTION 3: VERIFY/UPDATE PUBLISHED STATUS
-- =====================================================

\echo '\n3. Checking for approved properties that should be published...'

-- Count properties that are approved but not published
SELECT COUNT(*) as approved_not_published
FROM public.properties
WHERE status = 'approved';

-- Optionally: Auto-publish approved properties
-- UNCOMMENT THE FOLLOWING IF YOU WANT TO AUTO-PUBLISH APPROVED LISTINGS:
-- UPDATE public.properties 
-- SET status = 'published'
-- WHERE status = 'approved';
-- \echo 'Approved properties set to published'

-- =====================================================
-- SECTION 4: BATCH UPDATE EXAMPLE (Postgres-compatible)
-- =====================================================

\echo '\n4. Batch update examples (CTE-based, no LIMIT clause)...'

-- Example 1: Update first 200 draft properties to pending (using CTE)
-- This is a safe way to batch update without using UPDATE...LIMIT
/*
WITH properties_to_update AS (
  SELECT id
  FROM public.properties
  WHERE status = 'draft'
  ORDER BY created_at ASC
  LIMIT 200
)
UPDATE public.properties
SET status = 'pending'
WHERE id IN (SELECT id FROM properties_to_update);
*/

-- Example 2: Publish first 200 approved properties (using CTE)
/*
WITH properties_to_publish AS (
  SELECT id
  FROM public.properties
  WHERE status = 'approved'
  ORDER BY created_at ASC
  LIMIT 200
)
UPDATE public.properties
SET status = 'published', is_archived = FALSE
WHERE id IN (SELECT id FROM properties_to_publish);
*/

\echo 'Batch update examples provided (commented out)'
\echo 'Uncomment and run as needed'

-- =====================================================
-- SECTION 5: VERIFY RLS POLICIES
-- =====================================================

\echo '\n5. Verifying RLS policies on properties...'

-- Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'properties';

-- Count policies
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'properties';

-- Show public SELECT policy
SELECT 
  policyname,
  qual as using_clause
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'properties'
  AND cmd = 'SELECT'
  AND policyname LIKE '%public%';

-- =====================================================
-- SECTION 6: CREATE MISSING SELECT POLICY IF NEEDED
-- =====================================================

\echo '\n6. Ensuring public SELECT policy exists...'

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' 
      AND tablename = 'properties'
      AND policyname = 'properties_select_public'
  ) THEN
    RAISE NOTICE 'Creating properties_select_public policy...';
    
    CREATE POLICY "properties_select_public" ON public.properties
      FOR SELECT USING (
        status = 'published' AND (is_archived = FALSE OR is_archived IS NULL)
      );
    
    RAISE NOTICE 'Public SELECT policy created';
  ELSE
    RAISE NOTICE 'Public SELECT policy already exists';
  END IF;
END $$;

-- =====================================================
-- SECTION 7: FINAL VERIFICATION
-- =====================================================

\echo '\n7. Final verification...'

-- Count publicly visible properties
SELECT 
  COUNT(*) as publicly_visible_count
FROM public.properties
WHERE status = 'published' 
  AND (is_archived = FALSE OR is_archived IS NULL);

-- Show sample of what public users will see
SELECT 
  id,
  title_fr,
  status,
  is_archived,
  created_at
FROM public.properties
WHERE status = 'published' 
  AND (is_archived = FALSE OR is_archived IS NULL)
ORDER BY created_at DESC
LIMIT 5;

\echo '\n============================================='
\echo 'FIX SCRIPT COMPLETE'
\echo '============================================='
\echo 'Next steps:'
\echo '  1. Test listings display on frontend'
\echo '  2. Check browser console for errors'
\echo '  3. Verify API calls return expected data'
\echo '  4. If still issues, run diagnostic script again'
\echo '============================================='
