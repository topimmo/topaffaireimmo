-- =====================================================
-- Migration 102: Service Management RPC Functions
-- =====================================================
-- Creates secure RPC functions for:
-- - Admin service category management
-- - Admin service subcategory management  
-- - Admin service request management
-- - Artisan service management
-- All functions use SECURITY DEFINER with safe search_path
-- =====================================================

-- =====================================================
-- 1. ADMIN: UPSERT SERVICE CATEGORY
-- =====================================================

CREATE OR REPLACE FUNCTION public.admin_upsert_service_category(
  p_id UUID DEFAULT NULL,
  p_slug TEXT DEFAULT NULL,
  p_name_fr TEXT DEFAULT NULL,
  p_name_ar TEXT DEFAULT NULL,
  p_description_fr TEXT DEFAULT NULL,
  p_description_ar TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT NULL,
  p_sort_order INTEGER DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT TRUE,
  p_seo_title TEXT DEFAULT NULL,
  p_seo_description TEXT DEFAULT NULL,
  p_cover_image TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  category_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
  v_category_id UUID;
BEGIN
  -- Check authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Check admin status
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = v_user_id
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: Admin access required'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Validate required fields for insert
  IF p_id IS NULL THEN
    IF p_slug IS NULL OR p_name_fr IS NULL OR p_name_ar IS NULL THEN
      RETURN QUERY SELECT FALSE, 'Required fields: slug, name_fr, name_ar'::TEXT, NULL::UUID;
      RETURN;
    END IF;
  END IF;
  
  -- Insert or update
  IF p_id IS NULL THEN
    -- Insert new category
    INSERT INTO public.service_categories (
      slug, name_fr, name_ar, description_fr, description_ar, 
      icon, sort_order, is_active
    ) VALUES (
      p_slug, p_name_fr, p_name_ar, p_description_fr, p_description_ar,
      p_icon, COALESCE(p_sort_order, 0), p_is_active
    )
    RETURNING id INTO v_category_id;
  ELSE
    -- Update existing category
    UPDATE public.service_categories
    SET
      name_fr = COALESCE(p_name_fr, name_fr),
      name_ar = COALESCE(p_name_ar, name_ar),
      description_fr = COALESCE(p_description_fr, description_fr),
      description_ar = COALESCE(p_description_ar, description_ar),
      icon = COALESCE(p_icon, icon),
      sort_order = COALESCE(p_sort_order, sort_order),
      is_active = COALESCE(p_is_active, is_active),
      slug = COALESCE(p_slug, slug)
    WHERE id = p_id
    RETURNING id INTO v_category_id;
    
    IF v_category_id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'Category not found'::TEXT, NULL::UUID;
      RETURN;
    END IF;
  END IF;
  
  RETURN QUERY SELECT TRUE, 'Category saved successfully'::TEXT, v_category_id;
END;
$$;

COMMENT ON FUNCTION public.admin_upsert_service_category IS 
  'Admin-only function to create or update service categories';

GRANT EXECUTE ON FUNCTION public.admin_upsert_service_category TO authenticated;

-- =====================================================
-- 2. ADMIN: TOGGLE SERVICE CATEGORY
-- =====================================================

CREATE OR REPLACE FUNCTION public.admin_toggle_service_category(
  p_category_id UUID,
  p_is_active BOOLEAN
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
  v_updated BOOLEAN;
BEGIN
  -- Check authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated'::TEXT;
    RETURN;
  END IF;
  
  -- Check admin status
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = v_user_id
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: Admin access required'::TEXT;
    RETURN;
  END IF;
  
  -- Update category
  UPDATE public.service_categories
  SET is_active = p_is_active
  WHERE id = p_category_id;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT > 0;
  
  IF NOT v_updated THEN
    RETURN QUERY SELECT FALSE, 'Category not found'::TEXT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT TRUE, 'Category status updated'::TEXT;
END;
$$;

COMMENT ON FUNCTION public.admin_toggle_service_category IS 
  'Admin-only function to activate/deactivate service categories';

GRANT EXECUTE ON FUNCTION public.admin_toggle_service_category TO authenticated;

-- =====================================================
-- 3. ADMIN: REORDER SERVICE CATEGORIES
-- =====================================================

CREATE OR REPLACE FUNCTION public.admin_reorder_service_categories(
  p_category_orders JSONB -- Array of {id: UUID, order_index: INTEGER}
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
  v_item JSONB;
  v_updated_count INTEGER := 0;
BEGIN
  -- Check authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated'::TEXT;
    RETURN;
  END IF;
  
  -- Check admin status
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = v_user_id
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: Admin access required'::TEXT;
    RETURN;
  END IF;
  
  -- Update each category's sort_order
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_category_orders)
  LOOP
    UPDATE public.service_categories
    SET sort_order = (v_item->>'order_index')::INTEGER
    WHERE id = (v_item->>'id')::UUID;
    
    v_updated_count := v_updated_count + 1;
  END LOOP;
  
  RETURN QUERY SELECT TRUE, format('Updated %s categories', v_updated_count)::TEXT;
END;
$$;

COMMENT ON FUNCTION public.admin_reorder_service_categories IS 
  'Admin-only function to reorder service categories';

GRANT EXECUTE ON FUNCTION public.admin_reorder_service_categories TO authenticated;

-- =====================================================
-- 4. ADMIN: UPSERT SERVICE SUBCATEGORY
-- =====================================================

CREATE OR REPLACE FUNCTION public.admin_upsert_service_subcategory(
  p_id UUID DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_slug TEXT DEFAULT NULL,
  p_name_fr TEXT DEFAULT NULL,
  p_name_ar TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  subcategory_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
  v_subcategory_id UUID;
BEGIN
  -- Check authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Check admin status
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = v_user_id
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: Admin access required'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Validate required fields for insert
  IF p_id IS NULL THEN
    IF p_category_id IS NULL OR p_slug IS NULL OR p_name_fr IS NULL OR p_name_ar IS NULL THEN
      RETURN QUERY SELECT FALSE, 'Required fields: category_id, slug, name_fr, name_ar'::TEXT, NULL::UUID;
      RETURN;
    END IF;
  END IF;
  
  -- Insert or update
  IF p_id IS NULL THEN
    -- Insert new subcategory
    INSERT INTO public.service_subcategories (
      category_id, slug, name_fr, name_ar, is_active
    ) VALUES (
      p_category_id, p_slug, p_name_fr, p_name_ar, p_is_active
    )
    RETURNING id INTO v_subcategory_id;
  ELSE
    -- Update existing subcategory
    UPDATE public.service_subcategories
    SET
      category_id = COALESCE(p_category_id, category_id),
      slug = COALESCE(p_slug, slug),
      name_fr = COALESCE(p_name_fr, name_fr),
      name_ar = COALESCE(p_name_ar, name_ar),
      is_active = COALESCE(p_is_active, is_active)
    WHERE id = p_id
    RETURNING id INTO v_subcategory_id;
    
    IF v_subcategory_id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'Subcategory not found'::TEXT, NULL::UUID;
      RETURN;
    END IF;
  END IF;
  
  RETURN QUERY SELECT TRUE, 'Subcategory saved successfully'::TEXT, v_subcategory_id;
END;
$$;

COMMENT ON FUNCTION public.admin_upsert_service_subcategory IS 
  'Admin-only function to create or update service subcategories';

GRANT EXECUTE ON FUNCTION public.admin_upsert_service_subcategory TO authenticated;

-- =====================================================
-- 5. ADMIN: ASSIGN REQUEST TO ARTISAN
-- =====================================================

CREATE OR REPLACE FUNCTION public.admin_assign_request(
  p_request_id UUID,
  p_artisan_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
  v_request_status TEXT;
  v_updated BOOLEAN;
BEGIN
  -- Check authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated'::TEXT;
    RETURN;
  END IF;
  
  -- Check admin status
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = v_user_id
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: Admin access required'::TEXT;
    RETURN;
  END IF;
  
  -- Check request status (can only assign approved requests)
  SELECT status INTO v_request_status
  FROM public.requests
  WHERE id = p_request_id;
  
  IF v_request_status IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Request not found'::TEXT;
    RETURN;
  END IF;
  
  IF v_request_status NOT IN ('approved', 'pending') THEN
    RETURN QUERY SELECT FALSE, format('Cannot assign request with status: %s', v_request_status)::TEXT;
    RETURN;
  END IF;
  
  -- Assign artisan
  UPDATE public.requests
  SET assigned_artisan_id = p_artisan_id,
      status = 'approved'
  WHERE id = p_request_id;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT > 0;
  
  IF NOT v_updated THEN
    RETURN QUERY SELECT FALSE, 'Failed to assign request'::TEXT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT TRUE, 'Request assigned successfully'::TEXT;
END;
$$;

COMMENT ON FUNCTION public.admin_assign_request IS 
  'Admin-only function to assign service requests to artisans. Only approved/pending requests can be assigned.';

GRANT EXECUTE ON FUNCTION public.admin_assign_request TO authenticated;

-- =====================================================
-- 6. ADMIN: UPDATE REQUEST STATUS
-- =====================================================

CREATE OR REPLACE FUNCTION public.admin_update_request_status(
  p_request_id UUID,
  p_status TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
  v_updated BOOLEAN;
BEGIN
  -- Check authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated'::TEXT;
    RETURN;
  END IF;
  
  -- Check admin status
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = v_user_id
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: Admin access required'::TEXT;
    RETURN;
  END IF;
  
  -- Validate status
  IF p_status NOT IN ('draft', 'pending', 'approved', 'rejected', 'completed', 'cancelled') THEN
    RETURN QUERY SELECT FALSE, 'Invalid status'::TEXT;
    RETURN;
  END IF;
  
  -- Update request status
  UPDATE public.requests
  SET status = p_status
  WHERE id = p_request_id;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT > 0;
  
  IF NOT v_updated THEN
    RETURN QUERY SELECT FALSE, 'Request not found'::TEXT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT TRUE, 'Request status updated'::TEXT;
END;
$$;

COMMENT ON FUNCTION public.admin_update_request_status IS 
  'Admin-only function to update service request status';

GRANT EXECUTE ON FUNCTION public.admin_update_request_status TO authenticated;

-- =====================================================
-- 7. ARTISAN: UPSERT SERVICE
-- =====================================================

CREATE OR REPLACE FUNCTION public.artisan_upsert_service(
  p_artisan_id UUID,
  p_category_id UUID,
  p_subcategory_id UUID,
  p_city TEXT,
  p_is_active BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  service_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_verified BOOLEAN;
  v_service_id UUID;
BEGIN
  -- Check authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Verify user owns the artisan profile
  IF v_user_id != p_artisan_id THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: Can only manage own services'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if artisan is verified (required to activate services)
  SELECT is_verified INTO v_is_verified
  FROM public.artisan_profiles
  WHERE user_id = v_user_id
  LIMIT 1;
  
  IF p_is_active AND NOT COALESCE(v_is_verified, FALSE) THEN
    RETURN QUERY SELECT FALSE, 'Cannot activate service: Artisan profile must be verified first'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Validate required fields
  IF p_category_id IS NULL OR p_city IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Required fields: category_id, city'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Insert or update service
  INSERT INTO public.artisan_services (
    artisan_id, category_id, subcategory_id, city, is_active
  ) VALUES (
    p_artisan_id, p_category_id, p_subcategory_id, p_city, p_is_active
  )
  ON CONFLICT (artisan_id, subcategory_id, city) 
  DO UPDATE SET
    is_active = p_is_active,
    category_id = p_category_id
  RETURNING id INTO v_service_id;
  
  RETURN QUERY SELECT TRUE, 'Service saved successfully'::TEXT, v_service_id;
END;
$$;

COMMENT ON FUNCTION public.artisan_upsert_service IS 
  'Artisan function to create or update their service offerings. Verified artisans can activate services.';

GRANT EXECUTE ON FUNCTION public.artisan_upsert_service TO authenticated;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
