-- =====================================================
-- Migration 107: Enhance Multi-Service Support for Artisans
-- =====================================================
-- Adds validation for max 5 services per artisan
-- Creates helper functions for service management
-- =====================================================

-- =====================================================
-- 1. CREATE FUNCTION TO COUNT ARTISAN SERVICES
-- =====================================================

CREATE OR REPLACE FUNCTION public.count_artisan_services(artisan_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO service_count
  FROM public.artisan_services
  WHERE artisan_id = artisan_user_id
    AND is_active = TRUE;
    
  RETURN service_count;
END;
$$;

COMMENT ON FUNCTION public.count_artisan_services IS 
  'Counts active services for a given artisan';

-- =====================================================
-- 2. CREATE TRIGGER FUNCTION TO VALIDATE MAX 5 SERVICES
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_artisan_service_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Only validate for INSERT and for active services
  IF (TG_OP = 'INSERT' AND NEW.is_active = TRUE) OR 
     (TG_OP = 'UPDATE' AND NEW.is_active = TRUE AND OLD.is_active = FALSE) THEN
    
    -- Count current active services (excluding the one being inserted/updated)
    SELECT COUNT(*)
    INTO current_count
    FROM public.artisan_services
    WHERE artisan_id = NEW.artisan_id
      AND is_active = TRUE
      AND (TG_OP = 'UPDATE' AND id != NEW.id OR TG_OP = 'INSERT');
    
    -- Check if limit would be exceeded
    IF current_count >= 5 THEN
      RAISE EXCEPTION 'Artisan cannot have more than 5 active services. Current count: %', current_count
        USING ERRCODE = 'check_violation',
              HINT = 'Deactivate an existing service before adding a new one';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_artisan_service_limit IS 
  'Validates that artisans do not exceed 5 active services';

-- =====================================================
-- 3. CREATE TRIGGER FOR SERVICE LIMIT VALIDATION
-- =====================================================

DROP TRIGGER IF EXISTS enforce_artisan_service_limit ON public.artisan_services;

CREATE TRIGGER enforce_artisan_service_limit
  BEFORE INSERT OR UPDATE ON public.artisan_services
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_artisan_service_limit();

-- =====================================================
-- 4. CREATE HELPER FUNCTION TO GET ARTISAN SERVICES
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_artisan_services_with_details(artisan_user_id UUID)
RETURNS TABLE (
  service_id UUID,
  category_id UUID,
  category_name_fr TEXT,
  category_name_ar TEXT,
  category_slug TEXT,
  subcategory_id UUID,
  subcategory_name_fr TEXT,
  subcategory_name_ar TEXT,
  subcategory_slug TEXT,
  city TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a_s.id AS service_id,
    a_s.category_id,
    s_c.name_fr AS category_name_fr,
    s_c.name_ar AS category_name_ar,
    s_c.slug AS category_slug,
    a_s.subcategory_id,
    s_sub.name_fr AS subcategory_name_fr,
    s_sub.name_ar AS subcategory_name_ar,
    s_sub.slug AS subcategory_slug,
    a_s.city,
    a_s.is_active,
    a_s.created_at
  FROM public.artisan_services a_s
  INNER JOIN public.service_categories s_c ON a_s.category_id = s_c.id
  LEFT JOIN public.service_subcategories s_sub ON a_s.subcategory_id = s_sub.id
  WHERE a_s.artisan_id = artisan_user_id
  ORDER BY a_s.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_artisan_services_with_details IS 
  'Retrieves all services for an artisan with category and subcategory details';

-- =====================================================
-- 5. CREATE FUNCTION TO UPSERT ARTISAN SERVICES
-- =====================================================

CREATE OR REPLACE FUNCTION public.upsert_artisan_services(
  artisan_user_id UUID,
  services JSONB -- Array of {category_id, subcategory_id, city}
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_record JSONB;
  result JSONB;
  inserted_count INTEGER := 0;
  error_message TEXT;
BEGIN
  -- Validate caller is the artisan or an admin
  IF auth.uid() != artisan_user_id AND auth.uid() NOT IN (SELECT user_id FROM public.admins) THEN
    RAISE EXCEPTION 'Unauthorized: You can only manage your own services'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Validate service count doesn't exceed 5
  IF jsonb_array_length(services) > 5 THEN
    RAISE EXCEPTION 'Cannot add more than 5 services. Provided: %', jsonb_array_length(services)
      USING ERRCODE = 'check_violation';
  END IF;

  -- Deactivate all current services for this artisan
  UPDATE public.artisan_services
  SET is_active = FALSE
  WHERE artisan_id = artisan_user_id;

  -- Insert/activate each service
  FOR service_record IN SELECT * FROM jsonb_array_elements(services)
  LOOP
    BEGIN
      -- Try to reactivate existing service or insert new one
      INSERT INTO public.artisan_services (
        artisan_id,
        category_id,
        subcategory_id,
        city,
        is_active
      )
      VALUES (
        artisan_user_id,
        (service_record->>'category_id')::UUID,
        (service_record->>'subcategory_id')::UUID,
        service_record->>'city',
        TRUE
      )
      ON CONFLICT (artisan_id, subcategory_id, city)
      DO UPDATE SET is_active = TRUE, updated_at = NOW();
      
      inserted_count := inserted_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        error_message := SQLERRM;
        RAISE WARNING 'Failed to insert service: %', error_message;
    END;
  END LOOP;

  result := jsonb_build_object(
    'success', TRUE,
    'inserted_count', inserted_count,
    'total_requested', jsonb_array_length(services)
  );

  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.upsert_artisan_services IS 
  'Replaces artisan services with new set (max 5). Deactivates old services and activates/inserts new ones.';

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.count_artisan_services TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_artisan_services_with_details TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.upsert_artisan_services TO authenticated;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
