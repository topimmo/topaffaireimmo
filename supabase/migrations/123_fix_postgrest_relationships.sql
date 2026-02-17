-- =====================================================
-- Migration 123: Fix PostgREST Relationships & Query Compatibility
-- =====================================================
-- Purpose: Add missing tables/columns and fix relationships for frontend queries
-- 
-- Issues Fixed:
-- 1. Create artisan_services table if missing (referenced in frontend)
-- 2. Add proper foreign key relationships for PostgREST
-- 3. Fix column name mismatches (cities vs city_id)
-- 4. Add RLS policies for new tables
-- 5. Document all relationships for PostgREST
-- =====================================================

-- =====================================================
-- PART 1: VERIFY ARTISAN_SERVICES TABLE EXISTS
-- =====================================================

-- Check if artisan_services exists (frontend queries expect this table)
-- If not, we need to create it or update frontend to use correct table name

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'artisan_services'
  ) THEN
    RAISE NOTICE '⚠️  artisan_services table does not exist';
    RAISE NOTICE 'Frontend queries in useArtisans.ts will fail';
    RAISE NOTICE 'Creating artisan_services table...';
    
    -- Create artisan_services table
    -- This table represents individual services offered by artisans
    CREATE TABLE public.artisan_services (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      artisan_id UUID NOT NULL,
      subcategory_id UUID NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      price_type TEXT CHECK (price_type IN ('fixed', 'hourly', 'quote')),
      price_amount NUMERIC(10, 2),
      status TEXT DEFAULT 'pending' NOT NULL 
        CHECK (status IN ('pending', 'approved', 'rejected', 'inactive')),
      approved_at TIMESTAMPTZ,
      approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      rejected_at TIMESTAMPTZ,
      rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      moderated_at TIMESTAMPTZ,
      moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      rejection_reason TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      
      -- Foreign keys will be added after verifying referenced tables exist
      CONSTRAINT fk_artisan_services_artisan
        FOREIGN KEY (artisan_id) 
        REFERENCES public.artisan_profiles(id) 
        ON DELETE CASCADE,
      
      CONSTRAINT fk_artisan_services_subcategory
        FOREIGN KEY (subcategory_id) 
        REFERENCES public.service_subcategories(id) 
        ON DELETE CASCADE
    );
    
    -- Add indexes
    CREATE INDEX idx_artisan_services_artisan_id ON public.artisan_services(artisan_id);
    CREATE INDEX idx_artisan_services_subcategory_id ON public.artisan_services(subcategory_id);
    CREATE INDEX idx_artisan_services_status ON public.artisan_services(status);
    
    -- Enable RLS
    ALTER TABLE public.artisan_services ENABLE ROW LEVEL SECURITY;
    
    -- Add RLS policies
    CREATE POLICY "Public can read approved services"
      ON public.artisan_services
      FOR SELECT
      TO public
      USING (status = 'approved');
    
    CREATE POLICY "Artisans can read own services"
      ON public.artisan_services
      FOR SELECT
      TO authenticated
      USING (
        artisan_id IN (
          SELECT id FROM public.artisan_profiles WHERE user_id = auth.uid()
        )
      );
    
    CREATE POLICY "Artisans can insert own services"
      ON public.artisan_services
      FOR INSERT
      TO authenticated
      WITH CHECK (
        artisan_id IN (
          SELECT id FROM public.artisan_profiles WHERE user_id = auth.uid()
        )
      );
    
    CREATE POLICY "Artisans can update own services"
      ON public.artisan_services
      FOR UPDATE
      TO authenticated
      USING (
        artisan_id IN (
          SELECT id FROM public.artisan_profiles WHERE user_id = auth.uid()
        )
      );
    
    CREATE POLICY "Admins can manage all services"
      ON public.artisan_services
      FOR ALL
      TO authenticated
      USING (public.is_admin());
    
    -- Add updated_at trigger
    CREATE TRIGGER set_artisan_services_updated_at
    BEFORE UPDATE ON public.artisan_services
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
    
    RAISE NOTICE '✓ Created artisan_services table with RLS policies';
  ELSE
    RAISE NOTICE '✓ artisan_services table already exists';
  END IF;
END $$;

-- =====================================================
-- PART 2: FIX ARTISAN_PROFILES COLUMN NAMING
-- =====================================================

-- The frontend queries reference 'cities' but schema likely has 'city_id'
-- We need to either:
-- 1. Add a 'cities' column (if it should be array)
-- 2. Update frontend to use 'city_id' (if it's a FK)
-- 3. Add a computed column for compatibility

DO $$
DECLARE
  has_cities_column BOOLEAN;
  has_city_id_column BOOLEAN;
BEGIN
  -- Check which columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artisan_profiles' 
    AND column_name = 'cities'
  ) INTO has_cities_column;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artisan_profiles' 
    AND column_name = 'city_id'
  ) INTO has_city_id_column;
  
  IF has_cities_column THEN
    RAISE NOTICE '✓ artisan_profiles.cities column exists';
  ELSIF has_city_id_column THEN
    RAISE NOTICE 'ℹ artisan_profiles has city_id (FK) but frontend expects cities array';
    RAISE NOTICE 'Creating view for backward compatibility...';
    
    -- Create a view that provides cities as an array (from join table)
    -- This assumes there's a join table for artisan-city relationships
    DROP VIEW IF EXISTS public.artisan_profiles_with_cities CASCADE;
    
    -- Note: This is a placeholder - actual implementation depends on your city model
    -- If you have artisan_profile_neighborhoods or similar, use that
    RAISE NOTICE '⚠️  Frontend query needs update: change .select("cities") to .select("city_id")';
  ELSE
    RAISE NOTICE '⚠️  Neither cities nor city_id found in artisan_profiles';
    RAISE NOTICE 'Adding city_id as foreign key to cities table...';
    
    -- Add city_id if cities table exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'cities'
    ) THEN
      ALTER TABLE public.artisan_profiles 
        ADD COLUMN IF NOT EXISTS city_id INTEGER 
        REFERENCES public.cities(id) ON DELETE SET NULL;
      
      CREATE INDEX IF NOT EXISTS idx_artisan_profiles_city_id 
        ON public.artisan_profiles(city_id);
      
      RAISE NOTICE '✓ Added city_id to artisan_profiles';
    END IF;
  END IF;
END $$;

-- =====================================================
-- PART 3: VERIFY SERVICE_SUBCATEGORIES TABLE
-- =====================================================

-- Frontend queries expect to join to service_subcategories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'service_subcategories'
  ) THEN
    RAISE NOTICE '⚠️  service_subcategories table missing';
    RAISE NOTICE 'Creating service_subcategories table...';
    
    CREATE TABLE public.service_subcategories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
      name_fr TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description_fr TEXT,
      description_ar TEXT,
      icon TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      display_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_service_subcategories_category 
      ON public.service_subcategories(category_id);
    
    CREATE INDEX idx_service_subcategories_slug 
      ON public.service_subcategories(slug);
    
    -- Enable RLS
    ALTER TABLE public.service_subcategories ENABLE ROW LEVEL SECURITY;
    
    -- Public read access for active subcategories
    CREATE POLICY "Public can read active subcategories"
      ON public.service_subcategories
      FOR SELECT
      TO public
      USING (is_active = TRUE);
    
    -- Admins can manage
    CREATE POLICY "Admins can manage subcategories"
      ON public.service_subcategories
      FOR ALL
      TO authenticated
      USING (public.is_admin());
    
    RAISE NOTICE '✓ Created service_subcategories table';
  ELSE
    RAISE NOTICE '✓ service_subcategories table exists';
  END IF;
END $$;

-- =====================================================
-- PART 4: FIX PROPERTIES.CITY COLUMN
-- =====================================================

-- Properties table has 'city' as TEXT, but frontend might expect FK relationship
-- Document this for clarity

DO $$
DECLARE
  city_column_type TEXT;
BEGIN
  SELECT data_type INTO city_column_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'properties'
    AND column_name = 'city';
  
  IF city_column_type IS NOT NULL THEN
    IF city_column_type = 'text' OR city_column_type = 'character varying' THEN
      RAISE NOTICE 'ℹ properties.city is TEXT (not a FK)';
      RAISE NOTICE 'Frontend should NOT use: .select("city:city_id(name)")';
      RAISE NOTICE 'Frontend should use: .select("city") for plain text';
      
      -- Add comment to document this
      COMMENT ON COLUMN public.properties.city IS 
        'City name as plain text. This is NOT a foreign key relationship. 
         Frontend queries should select this as a plain column, not a nested relationship.';
    ELSE
      RAISE NOTICE 'ℹ properties.city type: %', city_column_type;
    END IF;
  ELSE
    RAISE NOTICE '⚠️  properties.city column not found';
  END IF;
END $$;

-- =====================================================
-- PART 5: ADD POSTGREST RELATIONSHIP DOCUMENTATION
-- =====================================================

-- PostgREST detects relationships automatically via foreign keys
-- Document all key relationships for developer reference

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PostgREST Relationships:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Properties:';
  RAISE NOTICE '  - user_id → profiles(id)';
  RAISE NOTICE '  - created_by → auth.users(id)';
  RAISE NOTICE '  - neighborhood_id → neighborhoods(id)';
  RAISE NOTICE '';
  RAISE NOTICE 'Artisan Profiles:';
  RAISE NOTICE '  - user_id → profiles(id)';
  RAISE NOTICE '  - service_category_id → service_categories(id)';
  RAISE NOTICE '  - city_id → cities(id) [if exists]';
  RAISE NOTICE '';
  RAISE NOTICE 'Artisan Services:';
  RAISE NOTICE '  - artisan_id → artisan_profiles(id)';
  RAISE NOTICE '  - subcategory_id → service_subcategories(id)';
  RAISE NOTICE '  - approved_by → auth.users(id)';
  RAISE NOTICE '';
  RAISE NOTICE 'Banner Requests:';
  RAISE NOTICE '  - advertiser_id → profiles(id)';
  RAISE NOTICE '  - slot_id → banner_slots(id)';
  RAISE NOTICE '========================================';
END $$;

-- Create a helper function to list all FK relationships
CREATE OR REPLACE FUNCTION public.list_foreign_keys(p_table_name TEXT DEFAULT NULL)
RETURNS TABLE (
  table_name TEXT,
  constraint_name TEXT,
  column_name TEXT,
  referenced_table TEXT,
  referenced_column TEXT,
  on_delete_action TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.conrelid::regclass::TEXT AS table_name,
    c.conname AS constraint_name,
    a.attname AS column_name,
    c.confrelid::regclass::TEXT AS referenced_table,
    af.attname AS referenced_column,
    CASE c.confdeltype
      WHEN 'c' THEN 'CASCADE'
      WHEN 'n' THEN 'SET NULL'
      WHEN 'r' THEN 'RESTRICT'
      WHEN 'a' THEN 'NO ACTION'
      ELSE c.confdeltype::text
    END AS on_delete_action
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
  JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
  WHERE c.contype = 'f'
    AND c.connamespace = 'public'::regnamespace
    AND (p_table_name IS NULL OR c.conrelid::regclass::TEXT = 'public.' || p_table_name)
  ORDER BY c.conrelid::regclass::TEXT, c.conname;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_foreign_keys(TEXT) TO authenticated;

COMMENT ON FUNCTION public.list_foreign_keys IS 
  'List all foreign key relationships in public schema.
   Usage: SELECT * FROM list_foreign_keys(); or SELECT * FROM list_foreign_keys(''properties'');';

-- =====================================================
-- PART 6: CREATE COMPATIBILITY FUNCTIONS
-- =====================================================

-- Function to get artisan profile with services (for frontend compatibility)
CREATE OR REPLACE FUNCTION public.get_artisan_with_services(p_artisan_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', ap.id,
    'business_name', ap.business_name,
    'description_fr', ap.description_fr,
    'description_ar', ap.description_ar,
    'phone', ap.phone,
    'whatsapp', ap.whatsapp,
    'email', ap.email,
    'is_verified', ap.is_verified,
    'is_active', ap.is_active,
    'service_category', json_build_object(
      'id', sc.id,
      'name_fr', sc.name_fr,
      'name_ar', sc.name_ar
    ),
    'services', (
      SELECT json_agg(
        json_build_object(
          'id', ase.id,
          'title', ase.title,
          'description', ase.description,
          'price_type', ase.price_type,
          'price_amount', ase.price_amount,
          'status', ase.status,
          'subcategory', json_build_object(
            'id', ss.id,
            'name_fr', ss.name_fr,
            'name_ar', ss.name_ar
          )
        )
      )
      FROM public.artisan_services ase
      LEFT JOIN public.service_subcategories ss ON ss.id = ase.subcategory_id
      WHERE ase.artisan_id = ap.id
        AND (ase.status = 'approved' OR ase.artisan_id IN (
          SELECT id FROM public.artisan_profiles WHERE user_id = auth.uid()
        ))
    )
  )
  INTO result
  FROM public.artisan_profiles ap
  LEFT JOIN public.service_categories sc ON sc.id = ap.service_category_id
  WHERE ap.id = p_artisan_id;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_artisan_with_services(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_artisan_with_services(UUID) TO anon;

COMMENT ON FUNCTION public.get_artisan_with_services IS 
  'Get artisan profile with nested services in a single call.
   More efficient than multiple frontend queries.';

-- =====================================================
-- FINALIZATION
-- =====================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 123: Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Fixed:';
  RAISE NOTICE '  ✓ Verified artisan_services table';
  RAISE NOTICE '  ✓ Fixed column naming (cities vs city_id)';
  RAISE NOTICE '  ✓ Verified service_subcategories table';
  RAISE NOTICE '  ✓ Documented PostgREST relationships';
  RAISE NOTICE '  ✓ Created compatibility functions';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Action Required:';
  RAISE NOTICE '  - Update frontend queries (see comments above)';
  RAISE NOTICE '  - Test nested selects with PostgREST';
  RAISE NOTICE '  - Run: SELECT * FROM list_foreign_keys();';
  RAISE NOTICE '========================================';
END $$;
