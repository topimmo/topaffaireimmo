-- =====================================================
-- Migration 095: Create Request Status History Table
-- =====================================================
-- Purpose: Audit trail for request status changes
-- Enables tracking of when and by whom status changed
-- =====================================================

-- =====================================================
-- 1. CREATE REQUEST STATUS HISTORY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.request_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Which request
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  
  -- Status change
  from_status TEXT,
  to_status TEXT NOT NULL,
  
  -- Who changed it
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Additional context
  note TEXT,
  metadata JSONB,
  
  -- When
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.request_status_history IS 
  'Audit trail of request status changes. Tracks who changed status and when.';

COMMENT ON COLUMN public.request_status_history.from_status IS 
  'Previous status (NULL for first entry)';

COMMENT ON COLUMN public.request_status_history.to_status IS 
  'New status after change';

COMMENT ON COLUMN public.request_status_history.changed_by IS 
  'User who made the change (client, artisan, or admin)';

COMMENT ON COLUMN public.request_status_history.metadata IS 
  'Additional context (e.g., rejection reason, completion notes)';

-- =====================================================
-- 2. CREATE INDEXES
-- =====================================================

-- Lookup history for a request
CREATE INDEX IF NOT EXISTS idx_request_history_request 
  ON public.request_status_history(request_id, created_at DESC);

-- Audit queries by user
CREATE INDEX IF NOT EXISTS idx_request_history_user 
  ON public.request_status_history(changed_by, created_at DESC);

-- =====================================================
-- 3. CREATE TRIGGER TO AUTO-LOG STATUS CHANGES
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_request_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if status actually changed
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.request_status_history (
      request_id,
      from_status,
      to_status,
      changed_by,
      note,
      metadata
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      CASE
        WHEN NEW.status = 'rejected' AND NEW.artisan_response IS NOT NULL 
          THEN 'Artisan response: ' || NEW.artisan_response
        WHEN NEW.status = 'cancelled' 
          THEN 'Cancelled by client'
        ELSE NULL
      END,
      jsonb_build_object(
        'urgency', NEW.urgency,
        'artisan_responded_at', NEW.artisan_responded_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_log_request_status ON public.requests;
CREATE TRIGGER auto_log_request_status
  AFTER UPDATE ON public.requests
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION public.log_request_status_change();

COMMENT ON FUNCTION public.log_request_status_change IS 
  'Automatically log request status changes to request_status_history table';

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.request_status_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE RLS POLICIES
-- =====================================================

-- Clients can view history of their own requests
DROP POLICY IF EXISTS "Clients can view own request history" ON public.request_status_history;
CREATE POLICY "Clients can view own request history"
  ON public.request_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.requests
      WHERE id = request_id
        AND client_id = auth.uid()
    )
  );

-- Artisans can view history of requests sent to them
DROP POLICY IF EXISTS "Artisans can view request history" ON public.request_status_history;
CREATE POLICY "Artisans can view request history"
  ON public.request_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.requests r
      JOIN public.artisan_profiles ap ON ap.id = r.artisan_profile_id
      WHERE r.id = request_id
        AND ap.user_id = auth.uid()
    )
  );

-- Admins have full access
DROP POLICY IF EXISTS "Admins can view all request history" ON public.request_status_history;
CREATE POLICY "Admins can view all request history"
  ON public.request_status_history
  FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON public.request_status_history TO authenticated;
GRANT ALL ON public.request_status_history TO postgres, service_role;

-- =====================================================
-- 7. CREATE HELPER FUNCTION: GET REQUEST TIMELINE
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_request_timeline(p_request_id UUID)
RETURNS TABLE (
  status TEXT,
  changed_at TIMESTAMPTZ,
  changed_by_name TEXT,
  note TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify user has access to this request
  IF NOT EXISTS (
    SELECT 1 FROM public.requests r
    WHERE r.id = p_request_id
      AND (
        r.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.artisan_profiles ap
          WHERE ap.id = r.artisan_profile_id
            AND ap.user_id = auth.uid()
        )
        OR auth.uid() IN (SELECT user_id FROM public.admins)
      )
  ) THEN
    RAISE EXCEPTION 'Access denied to this request';
  END IF;
  
  -- Return timeline
  RETURN QUERY
  SELECT 
    h.to_status as status,
    h.created_at as changed_at,
    COALESCE(p.full_name, 'System') as changed_by_name,
    h.note
  FROM public.request_status_history h
  LEFT JOIN public.profiles p ON p.id = h.changed_by
  WHERE h.request_id = p_request_id
  ORDER BY h.created_at ASC;
END;
$$;

COMMENT ON FUNCTION public.get_request_timeline IS 
  'Get chronological timeline of request status changes with user names';

GRANT EXECUTE ON FUNCTION public.get_request_timeline TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES (Run manually after migration)
-- =====================================================

-- Test auto-logging by updating a request status:
-- UPDATE public.requests SET status = 'viewed' WHERE id = 'some-uuid';
-- SELECT * FROM public.request_status_history WHERE request_id = 'some-uuid';
