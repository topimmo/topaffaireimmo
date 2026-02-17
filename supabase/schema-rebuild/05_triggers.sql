-- =====================================================
-- 05_triggers.sql - Triggers and RPC Functions
-- =====================================================
-- Creates all triggers for updated_at timestamps
-- and all RPC functions for authorization and business logic
-- =====================================================

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_admins_updated_at ON public.admins;
CREATE TRIGGER set_admins_updated_at
  BEFORE UPDATE ON public.admins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_properties_updated_at ON public.properties;
CREATE TRIGGER set_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_service_categories_updated_at ON public.service_categories;
CREATE TRIGGER set_service_categories_updated_at
  BEFORE UPDATE ON public.service_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_service_subcategories_updated_at ON public.service_subcategories;
CREATE TRIGGER set_service_subcategories_updated_at
  BEFORE UPDATE ON public.service_subcategories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_artisan_profiles_updated_at ON public.artisan_profiles;
CREATE TRIGGER set_artisan_profiles_updated_at
  BEFORE UPDATE ON public.artisan_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_artisan_services_updated_at ON public.artisan_services;
CREATE TRIGGER set_artisan_services_updated_at
  BEFORE UPDATE ON public.artisan_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_requests_updated_at ON public.requests;
CREATE TRIGGER set_requests_updated_at
  BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_reviews_updated_at ON public.reviews;
CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_payments_updated_at ON public.payments;
CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_boost_plans_updated_at ON public.boost_plans;
CREATE TRIGGER set_boost_plans_updated_at
  BEFORE UPDATE ON public.boost_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_property_boosts_updated_at ON public.property_boosts;
CREATE TRIGGER set_property_boosts_updated_at
  BEFORE UPDATE ON public.property_boosts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_promo_banners_updated_at ON public.promo_banners;
CREATE TRIGGER set_promo_banners_updated_at
  BEFORE UPDATE ON public.promo_banners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_site_pages_updated_at ON public.site_pages;
CREATE TRIGGER set_site_pages_updated_at
  BEFORE UPDATE ON public.site_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_seo_guides_updated_at ON public.seo_guides;
CREATE TRIGGER set_seo_guides_updated_at
  BEFORE UPDATE ON public.seo_guides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_alert_configurations_updated_at ON public.alert_configurations;
CREATE TRIGGER set_alert_configurations_updated_at
  BEFORE UPDATE ON public.alert_configurations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- AUTHORIZATION RPC FUNCTIONS
-- =====================================================

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid() AND is_active = TRUE
  );
$$;

COMMENT ON FUNCTION public.is_admin IS 
  'Returns TRUE if current user is an active admin (SINGLE SOURCE OF TRUTH)';

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- Check if can approve properties
CREATE OR REPLACE FUNCTION public.can_approve_properties()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin();
$$;

COMMENT ON FUNCTION public.can_approve_properties IS 
  'Returns TRUE if current user can approve/reject properties';

GRANT EXECUTE ON FUNCTION public.can_approve_properties() TO authenticated, anon;

-- Check if can approve services
CREATE OR REPLACE FUNCTION public.can_approve_services()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin();
$$;

COMMENT ON FUNCTION public.can_approve_services IS 
  'Returns TRUE if current user can approve/reject artisan services';

GRANT EXECUTE ON FUNCTION public.can_approve_services() TO authenticated, anon;

-- Generic permission checker
CREATE OR REPLACE FUNCTION public.has_permission(permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE permission_key
    WHEN 'approve_properties' THEN RETURN public.is_admin();
    WHEN 'approve_services' THEN RETURN public.is_admin();
    WHEN 'manage_users' THEN RETURN public.is_admin();
    WHEN 'view_analytics' THEN RETURN public.is_admin();
    ELSE RETURN FALSE;
  END CASE;
END;
$$;

COMMENT ON FUNCTION public.has_permission IS 'Generic permission checker for future RBAC';

GRANT EXECUTE ON FUNCTION public.has_permission(TEXT) TO authenticated, anon;

-- =====================================================
-- PROPERTY MODERATION TRIGGERS
-- =====================================================

-- Protect property status changes (only admins)
CREATE OR REPLACE FUNCTION public.protect_property_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NOT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = TRUE) THEN
      NEW.status := OLD.status;
      RAISE NOTICE 'Status change prevented: Only admins can change property status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_property_status_trigger ON public.properties;
CREATE TRIGGER protect_property_status_trigger
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.protect_property_status();

-- =====================================================
-- ARTISAN SERVICE MODERATION TRIGGERS
-- =====================================================

-- Protect artisan service moderation fields
CREATE OR REPLACE FUNCTION public.protect_artisan_service_moderation()
RETURNS TRIGGER AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  v_is_admin := EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = TRUE
  );
  
  IF v_is_admin THEN
    RETURN NEW;
  END IF;
  
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    RAISE EXCEPTION 'Only admins can approve services';
  END IF;
  
  IF (OLD.approved_at IS DISTINCT FROM NEW.approved_at) OR
     (OLD.approved_by IS DISTINCT FROM NEW.approved_by) OR
     (OLD.rejected_at IS DISTINCT FROM NEW.rejected_at) OR
     (OLD.rejected_by IS DISTINCT FROM NEW.rejected_by) OR
     (OLD.moderated_at IS DISTINCT FROM NEW.moderated_at) OR
     (OLD.moderated_by IS DISTINCT FROM NEW.moderated_by) OR
     (OLD.rejection_reason IS DISTINCT FROM NEW.rejection_reason) THEN
    
    NEW.approved_at := OLD.approved_at;
    NEW.approved_by := OLD.approved_by;
    NEW.rejected_at := OLD.rejected_at;
    NEW.rejected_by := OLD.rejected_by;
    NEW.moderated_at := OLD.moderated_at;
    NEW.moderated_by := OLD.moderated_by;
    NEW.rejection_reason := OLD.rejection_reason;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_artisan_service_moderation_trigger ON public.artisan_services;
CREATE TRIGGER protect_artisan_service_moderation_trigger
  BEFORE UPDATE ON public.artisan_services
  FOR EACH ROW EXECUTE FUNCTION public.protect_artisan_service_moderation();

-- =====================================================
-- REQUEST STATUS TRIGGERS
-- =====================================================

-- Auto-update request status on view
CREATE OR REPLACE FUNCTION public.update_request_view_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.viewed_by_artisan_at IS NOT NULL AND OLD.viewed_by_artisan_at IS NULL THEN
    IF NEW.status = 'pending' THEN
      NEW.status = 'viewed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_update_request_view_status ON public.requests;
CREATE TRIGGER auto_update_request_view_status
  BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.update_request_view_status();

-- =====================================================
-- PROPERTY MODERATION RPC FUNCTIONS
-- =====================================================

-- Approve property
CREATE OR REPLACE FUNCTION public.approve_property(property_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property RECORD;
  v_admin_id UUID;
BEGIN
  SELECT user_id INTO v_admin_id
  FROM public.admins
  WHERE user_id = auth.uid() AND is_active = TRUE;
  
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Only admins can approve properties';
  END IF;
  
  SELECT * INTO v_property
  FROM public.properties WHERE id = property_id;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property not found';
  END IF;
  
  UPDATE public.properties
  SET status = 'approved',
      moderated_at = NOW(),
      moderated_by = v_admin_id,
      updated_at = NOW()
  WHERE id = property_id;
  
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    v_property.owner_id,
    'property_status',
    'Property Approved',
    'Your property "' || COALESCE(v_property.title_fr, v_property.title_ar) || '" has been approved.',
    jsonb_build_object('property_id', property_id, 'status', 'approved')
  );
  
  INSERT INTO public.admin_audit_logs (admin_id, action_type, target_type, target_id, metadata)
  VALUES (
    v_admin_id, 'approve', 'property', property_id,
    jsonb_build_object('previous_status', v_property.status)
  );
  
  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.approve_property IS 'Approve a property listing (admin only)';

GRANT EXECUTE ON FUNCTION public.approve_property(UUID) TO authenticated;

-- Reject property
CREATE OR REPLACE FUNCTION public.reject_property(property_id UUID, reason TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property RECORD;
  v_admin_id UUID;
BEGIN
  SELECT user_id INTO v_admin_id
  FROM public.admins
  WHERE user_id = auth.uid() AND is_active = TRUE;
  
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Only admins can reject properties';
  END IF;
  
  IF reason IS NULL OR LENGTH(TRIM(reason)) < 10 THEN
    RAISE EXCEPTION 'Rejection reason must be at least 10 characters';
  END IF;
  
  SELECT * INTO v_property
  FROM public.properties WHERE id = property_id;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property not found';
  END IF;
  
  UPDATE public.properties
  SET status = 'rejected',
      rejection_reason = reason,
      moderated_at = NOW(),
      moderated_by = v_admin_id,
      updated_at = NOW()
  WHERE id = property_id;
  
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    v_property.owner_id,
    'property_status',
    'Property Rejected',
    'Your property has been rejected. Reason: ' || reason,
    jsonb_build_object('property_id', property_id, 'status', 'rejected', 'reason', reason)
  );
  
  INSERT INTO public.admin_audit_logs (admin_id, action_type, target_type, target_id, metadata)
  VALUES (
    v_admin_id, 'reject', 'property', property_id,
    jsonb_build_object('previous_status', v_property.status, 'reason', reason)
  );
  
  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.reject_property IS 'Reject a property listing with reason (admin only)';

GRANT EXECUTE ON FUNCTION public.reject_property(UUID, TEXT) TO authenticated;

-- =====================================================
-- ARTISAN SERVICE MODERATION RPC FUNCTIONS
-- =====================================================

-- Approve artisan service
CREATE OR REPLACE FUNCTION public.approve_artisan_service(service_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service RECORD;
  v_admin_id UUID;
BEGIN
  SELECT user_id INTO v_admin_id
  FROM public.admins
  WHERE user_id = auth.uid() AND is_active = TRUE;
  
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Only active admins can approve services';
  END IF;
  
  SELECT * INTO v_service
  FROM public.artisan_services WHERE id = service_id;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found';
  END IF;
  
  UPDATE public.artisan_services
  SET status = 'approved',
      approved_at = NOW(),
      approved_by = v_admin_id,
      moderated_at = NOW(),
      moderated_by = v_admin_id,
      rejected_at = NULL,
      rejected_by = NULL,
      rejection_reason = NULL
  WHERE id = service_id;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      v_service.artisan_id,
      'artisan_verification',
      'Service Approved',
      'Your service has been approved and is now visible to clients.',
      jsonb_build_object('service_id', service_id, 'status', 'approved')
    );
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_audit_logs') THEN
    INSERT INTO public.admin_audit_logs (admin_id, action_type, target_type, target_id, metadata)
    VALUES (
      v_admin_id, 'approve', 'artisan_service', service_id,
      jsonb_build_object('previous_status', v_service.status)
    );
  END IF;
  
  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.approve_artisan_service IS 'Approve an artisan service (admin only)';

GRANT EXECUTE ON FUNCTION public.approve_artisan_service(UUID) TO authenticated;

-- Reject artisan service
CREATE OR REPLACE FUNCTION public.reject_artisan_service(service_id UUID, reason TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service RECORD;
  v_admin_id UUID;
BEGIN
  SELECT user_id INTO v_admin_id
  FROM public.admins
  WHERE user_id = auth.uid() AND is_active = TRUE;
  
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Only active admins can reject services';
  END IF;
  
  IF reason IS NULL OR LENGTH(TRIM(reason)) < 10 THEN
    RAISE EXCEPTION 'Rejection reason must be at least 10 characters';
  END IF;
  
  SELECT * INTO v_service
  FROM public.artisan_services WHERE id = service_id;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found';
  END IF;
  
  UPDATE public.artisan_services
  SET status = 'rejected',
      rejected_at = NOW(),
      rejected_by = v_admin_id,
      rejection_reason = reason,
      moderated_at = NOW(),
      moderated_by = v_admin_id,
      approved_at = NULL,
      approved_by = NULL
  WHERE id = service_id;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      v_service.artisan_id,
      'artisan_verification',
      'Service Rejected',
      'Your service has been rejected. Reason: ' || reason,
      jsonb_build_object('service_id', service_id, 'status', 'rejected', 'reason', reason)
    );
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_audit_logs') THEN
    INSERT INTO public.admin_audit_logs (admin_id, action_type, target_type, target_id, metadata)
    VALUES (
      v_admin_id, 'reject', 'artisan_service', service_id,
      jsonb_build_object('previous_status', v_service.status, 'reason', reason)
    );
  END IF;
  
  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.reject_artisan_service IS 'Reject an artisan service with reason (admin only)';

GRANT EXECUTE ON FUNCTION public.reject_artisan_service(UUID, TEXT) TO authenticated;

-- =====================================================
-- ANALYTICS & MONITORING RPC FUNCTIONS
-- =====================================================

-- Track analytics event
CREATE OR REPLACE FUNCTION public.track_analytics_event(
  p_event_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_session_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.analytics_events (event_type, entity_id, metadata, session_id)
  VALUES (p_event_type, p_entity_id, p_metadata, p_session_id)
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

COMMENT ON FUNCTION public.track_analytics_event IS 'Track privacy-safe analytics events';

GRANT EXECUTE ON FUNCTION public.track_analytics_event TO authenticated, anon;

-- Get artisan rating stats
CREATE OR REPLACE FUNCTION public.get_artisan_rating_stats(p_artisan_profile_id UUID)
RETURNS TABLE (
  avg_rating NUMERIC,
  total_reviews BIGINT,
  rating_5_count BIGINT,
  rating_4_count BIGINT,
  rating_3_count BIGINT,
  rating_2_count BIGINT,
  rating_1_count BIGINT,
  avg_quality NUMERIC,
  avg_professionalism NUMERIC,
  avg_communication NUMERIC,
  avg_value NUMERIC,
  recommend_percentage NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ROUND(AVG(rating), 2) as avg_rating,
    COUNT(*) as total_reviews,
    COUNT(*) FILTER (WHERE rating = 5) as rating_5_count,
    COUNT(*) FILTER (WHERE rating = 4) as rating_4_count,
    COUNT(*) FILTER (WHERE rating = 3) as rating_3_count,
    COUNT(*) FILTER (WHERE rating = 2) as rating_2_count,
    COUNT(*) FILTER (WHERE rating = 1) as rating_1_count,
    ROUND(AVG(quality_rating), 2) as avg_quality,
    ROUND(AVG(professionalism_rating), 2) as avg_professionalism,
    ROUND(AVG(communication_rating), 2) as avg_communication,
    ROUND(AVG(value_rating), 2) as avg_value,
    ROUND(
      COUNT(*) FILTER (WHERE would_recommend = TRUE)::NUMERIC / 
      NULLIF(COUNT(*), 0) * 100, 
      1
    ) as recommend_percentage
  FROM public.reviews
  WHERE artisan_profile_id = p_artisan_profile_id AND is_hidden = FALSE;
$$;

COMMENT ON FUNCTION public.get_artisan_rating_stats IS 'Get comprehensive rating statistics for an artisan';

GRANT EXECUTE ON FUNCTION public.get_artisan_rating_stats(UUID) TO anon, authenticated;

-- =====================================================
-- NOTIFICATION RPC FUNCTIONS
-- =====================================================

-- Mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE
  WHERE id = notification_id AND user_id = auth.uid();
  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.mark_notification_read IS 'Mark a notification as read';

GRANT EXECUTE ON FUNCTION public.mark_notification_read(UUID) TO authenticated;

-- Mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE
  WHERE user_id = auth.uid() AND is_read = FALSE;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

COMMENT ON FUNCTION public.mark_all_notifications_read IS 'Mark all notifications as read for current user';

GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;

-- =====================================================
-- SYSTEM HEALTH & MONITORING
-- =====================================================

-- Check system health
CREATE OR REPLACE FUNCTION public.check_system_health()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_error_count INTEGER;
  v_slow_query_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_error_count
  FROM public.system_logs
  WHERE level = 'error' AND created_at > NOW() - INTERVAL '5 minutes';
  
  SELECT COUNT(*) INTO v_slow_query_count
  FROM public.performance_metrics
  WHERE duration_ms > 500 AND created_at > NOW() - INTERVAL '5 minutes';
  
  v_result := jsonb_build_object(
    'status', 'healthy',
    'recent_errors', v_error_count,
    'slow_queries', v_slow_query_count,
    'checked_at', NOW()
  );
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.check_system_health IS 'Check overall system health';

GRANT EXECUTE ON FUNCTION public.check_system_health() TO authenticated;

-- =====================================================
-- END OF TRIGGERS AND RPC FUNCTIONS
-- =====================================================
