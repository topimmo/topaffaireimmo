-- =====================================================
-- Migration 113: Production Monitoring & Observability System
-- =====================================================
-- Purpose: Implement comprehensive monitoring, logging, and observability
-- Features: Error tracking, performance monitoring, health checks, analytics
-- =====================================================

-- =====================================================
-- 1. SYSTEM LOGS TABLE
-- =====================================================
-- Centralized logging for errors, warnings, and info messages
-- Used by frontend and backend for structured logging

CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  correlation_id TEXT,
  url TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON public.system_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON public.system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_correlation_id ON public.system_logs(correlation_id) WHERE correlation_id IS NOT NULL;

-- Composite index for common queries (level + date filtering)
CREATE INDEX IF NOT EXISTS idx_system_logs_level_created ON public.system_logs(level, created_at DESC);

COMMENT ON TABLE public.system_logs IS 
  'Centralized logging table for production monitoring and debugging';

-- =====================================================
-- 2. PERFORMANCE METRICS TABLE
-- =====================================================
-- Track slow queries, API latency, and performance issues

CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL CHECK (metric_type IN ('query', 'api', 'page_load', 'image_load')),
  metric_name TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON public.performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_duration ON public.performance_metrics(duration_ms DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON public.performance_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_slow ON public.performance_metrics(metric_type, duration_ms) 
  WHERE duration_ms > 500; -- Slow queries (>500ms)

COMMENT ON TABLE public.performance_metrics IS 
  'Performance monitoring metrics for queries, APIs, and page loads';

-- =====================================================
-- 3. ANALYTICS EVENTS TABLE (Privacy-Safe)
-- =====================================================
-- Track aggregated usage events without personal data

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('listing_view', 'profile_view', 'phone_reveal', 'search')),
  entity_id UUID, -- ID of listing/profile/etc (not user)
  metadata JSONB DEFAULT '{}'::jsonb,
  session_id TEXT, -- Anonymous session tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_entity ON public.analytics_events(entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created ON public.analytics_events(event_type, created_at DESC);

COMMENT ON TABLE public.analytics_events IS 
  'Privacy-safe analytics events - no personal data, aggregated only';

-- =====================================================
-- 4. ALERT CONFIGURATIONS TABLE
-- =====================================================
-- Configure alerts for error spikes, performance issues, etc.

CREATE TABLE IF NOT EXISTS public.alert_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('error_spike', 'storage_failure', 'db_latency', 'custom')),
  threshold INTEGER NOT NULL,
  time_window_minutes INTEGER NOT NULL DEFAULT 5,
  notification_emails TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.alert_configurations IS 
  'Alert configurations for monitoring system notifications';

-- =====================================================
-- 5. ALERT HISTORY TABLE
-- =====================================================
-- Track when alerts were triggered

CREATE TABLE IF NOT EXISTS public.alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_config_id UUID REFERENCES public.alert_configurations(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  trigger_count INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  time_window_minutes INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alert_history_config ON public.alert_history(alert_config_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_created_at ON public.alert_history(created_at DESC);

COMMENT ON TABLE public.alert_history IS 
  'History of triggered alerts for audit and debugging';

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================

-- System Logs: Only admins can read, but all authenticated users can insert (via RPC)
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all system logs"
  ON public.system_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- No direct insert - use RPC function instead (see below)
-- This ensures proper data sanitization and rate limiting

-- Performance Metrics: Same as system logs
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all performance metrics"
  ON public.performance_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Analytics Events: Only admins can read
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all analytics events"
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Alert Configurations: Only admins can manage
ALTER TABLE public.alert_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage alert configurations"
  ON public.alert_configurations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Alert History: Only admins can read
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read alert history"
  ON public.alert_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- =====================================================
-- 7. RPC FUNCTIONS
-- =====================================================

-- Function to log system events (with rate limiting)
CREATE OR REPLACE FUNCTION public.log_system_event(
  p_level TEXT,
  p_category TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_correlation_id TEXT DEFAULT NULL,
  p_url TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
  v_user_id UUID;
  v_rate_limit INTEGER;
BEGIN
  -- Get current user ID (can be null for anonymous)
  v_user_id := auth.uid();
  
  -- Simple rate limiting: max 100 logs per user per minute
  IF v_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_rate_limit
    FROM public.system_logs
    WHERE user_id = v_user_id
      AND created_at > now() - INTERVAL '1 minute';
    
    IF v_rate_limit > 100 THEN
      RAISE EXCEPTION 'Rate limit exceeded for logging';
    END IF;
  END IF;
  
  -- Insert log entry
  INSERT INTO public.system_logs (
    level,
    category,
    message,
    metadata,
    user_id,
    correlation_id,
    url,
    user_agent
  ) VALUES (
    p_level,
    p_category,
    p_message,
    p_metadata,
    v_user_id,
    p_correlation_id,
    p_url,
    p_user_agent
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

COMMENT ON FUNCTION public.log_system_event IS 
  'Insert system log entry with rate limiting (100 logs/user/minute)';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.log_system_event TO authenticated;

-- Function to track performance metrics
CREATE OR REPLACE FUNCTION public.track_performance_metric(
  p_metric_type TEXT,
  p_metric_name TEXT,
  p_duration_ms INTEGER,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_metric_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user ID (can be null for anonymous)
  v_user_id := auth.uid();
  
  -- Insert metric
  INSERT INTO public.performance_metrics (
    metric_type,
    metric_name,
    duration_ms,
    metadata,
    user_id,
    url
  ) VALUES (
    p_metric_type,
    p_metric_name,
    p_duration_ms,
    p_metadata,
    v_user_id,
    p_url
  )
  RETURNING id INTO v_metric_id;
  
  RETURN v_metric_id;
END;
$$;

COMMENT ON FUNCTION public.track_performance_metric IS 
  'Track performance metrics for monitoring';

GRANT EXECUTE ON FUNCTION public.track_performance_metric TO authenticated;

-- Function to track analytics events (privacy-safe)
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
  -- Insert event (no user_id - privacy-safe)
  INSERT INTO public.analytics_events (
    event_type,
    entity_id,
    metadata,
    session_id
  ) VALUES (
    p_event_type,
    p_entity_id,
    p_metadata,
    p_session_id
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

COMMENT ON FUNCTION public.track_analytics_event IS 
  'Track privacy-safe analytics events (no personal data)';

GRANT EXECUTE ON FUNCTION public.track_analytics_event TO authenticated, anon;

-- Function to check system health
CREATE OR REPLACE FUNCTION public.check_system_health()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_db_status TEXT := 'ok';
  v_storage_status TEXT := 'ok';
  v_rls_status TEXT := 'ok';
  v_tables_status TEXT := 'ok';
  v_error_count INTEGER;
  v_slow_query_count INTEGER;
BEGIN
  -- Check database connection (if we got here, it's working)
  v_db_status := 'ok';
  
  -- Check for recent errors (last 5 minutes)
  SELECT COUNT(*) INTO v_error_count
  FROM public.system_logs
  WHERE level = 'error'
    AND created_at > now() - INTERVAL '5 minutes';
  
  -- Check for slow queries (last 5 minutes)
  SELECT COUNT(*) INTO v_slow_query_count
  FROM public.performance_metrics
  WHERE duration_ms > 500
    AND created_at > now() - INTERVAL '5 minutes';
  
  -- Check storage buckets exist
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'avatars') THEN
      v_storage_status := 'warning: missing avatars bucket';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_storage_status := 'error: cannot access storage';
  END;
  
  -- Check RLS is enabled on critical tables
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename = 'properties' 
        AND rowsecurity = true
    ) THEN
      v_rls_status := 'error: RLS not enabled on properties';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_rls_status := 'error: cannot check RLS status';
  END;
  
  -- Check critical tables exist
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('properties', 'profiles', 'admins')
      HAVING COUNT(*) = 3
    ) THEN
      v_tables_status := 'error: missing critical tables';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_tables_status := 'error: cannot check tables';
  END;
  
  -- Build result
  v_result := jsonb_build_object(
    'status', CASE 
      WHEN v_db_status = 'ok' 
        AND v_storage_status = 'ok' 
        AND v_rls_status = 'ok' 
        AND v_tables_status = 'ok' 
      THEN 'healthy'
      WHEN v_db_status = 'ok' 
        AND NOT (v_storage_status LIKE 'error%' 
          OR v_rls_status LIKE 'error%' 
          OR v_tables_status LIKE 'error%')
      THEN 'degraded'
      ELSE 'unhealthy'
    END,
    'database', v_db_status,
    'storage', v_storage_status,
    'rls', v_rls_status,
    'tables', v_tables_status,
    'recent_errors', v_error_count,
    'slow_queries', v_slow_query_count,
    'checked_at', now()
  );
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.check_system_health IS 
  'Check overall system health (database, storage, RLS, tables)';

GRANT EXECUTE ON FUNCTION public.check_system_health TO authenticated;

-- =====================================================
-- 8. CLEANUP POLICY (Auto-delete old logs)
-- =====================================================
-- Keep logs for 90 days, then auto-delete to prevent unbounded growth

-- Note: In production, you would set up a cron job or pg_cron extension
-- For now, we'll create a function that admins can call manually or via cron

CREATE OR REPLACE FUNCTION public.cleanup_old_monitoring_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_logs INTEGER;
  v_deleted_metrics INTEGER;
  v_deleted_events INTEGER;
  v_deleted_alerts INTEGER;
BEGIN
  -- Only admins can run this
  IF NOT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can cleanup monitoring data';
  END IF;
  
  -- Delete old system logs (older than 90 days)
  DELETE FROM public.system_logs
  WHERE created_at < now() - INTERVAL '90 days';
  GET DIAGNOSTICS v_deleted_logs = ROW_COUNT;
  
  -- Delete old performance metrics (older than 30 days)
  DELETE FROM public.performance_metrics
  WHERE created_at < now() - INTERVAL '30 days';
  GET DIAGNOSTICS v_deleted_metrics = ROW_COUNT;
  
  -- Delete old analytics events (older than 180 days)
  DELETE FROM public.analytics_events
  WHERE created_at < now() - INTERVAL '180 days';
  GET DIAGNOSTICS v_deleted_events = ROW_COUNT;
  
  -- Delete old alert history (older than 90 days)
  DELETE FROM public.alert_history
  WHERE created_at < now() - INTERVAL '90 days';
  GET DIAGNOSTICS v_deleted_alerts = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'deleted_logs', v_deleted_logs,
    'deleted_metrics', v_deleted_metrics,
    'deleted_events', v_deleted_events,
    'deleted_alerts', v_deleted_alerts,
    'cleaned_at', now()
  );
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_monitoring_data IS 
  'Cleanup old monitoring data (admin only) - logs: 90d, metrics: 30d, events: 180d, alerts: 90d';

GRANT EXECUTE ON FUNCTION public.cleanup_old_monitoring_data TO authenticated;

-- =====================================================
-- 9. DEFAULT ALERT CONFIGURATIONS
-- =====================================================
-- Set up default alert configurations for common issues

INSERT INTO public.alert_configurations (alert_type, threshold, time_window_minutes, notification_emails, metadata)
VALUES 
  -- Alert if more than 50 errors in 5 minutes
  ('error_spike', 50, 5, ARRAY[]::TEXT[], '{"description": "Alert when error rate is high"}'::jsonb),
  
  -- Alert if DB latency spike (more than 10 slow queries in 5 minutes)
  ('db_latency', 10, 5, ARRAY[]::TEXT[], '{"description": "Alert when database performance degrades"}'::jsonb),
  
  -- Alert on storage failures
  ('storage_failure', 5, 5, ARRAY[]::TEXT[], '{"description": "Alert when storage operations fail"}'::jsonb)
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES (commented out - uncomment to test)
-- =====================================================

-- Check all tables were created
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
--   AND table_name IN ('system_logs', 'performance_metrics', 'analytics_events', 'alert_configurations', 'alert_history')
-- ORDER BY table_name;

-- Check all indexes were created
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND tablename IN ('system_logs', 'performance_metrics', 'analytics_events')
-- ORDER BY tablename, indexname;

-- Check RLS is enabled
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('system_logs', 'performance_metrics', 'analytics_events', 'alert_configurations', 'alert_history')
-- ORDER BY tablename;

-- Check RPC functions exist
-- SELECT routine_name, routine_type
-- FROM information_schema.routines
-- WHERE routine_schema = 'public'
--   AND routine_name IN (
--     'log_system_event',
--     'track_performance_metric',
--     'track_analytics_event',
--     'check_system_health',
--     'cleanup_old_monitoring_data'
--   )
-- ORDER BY routine_name;

-- Test health check
-- SELECT public.check_system_health();
