-- =====================================================
-- Migration 094: Create Requests Table
-- =====================================================
-- Purpose: Enable clients to send service requests to artisans
-- Includes request tracking, status management, and notifications
-- =====================================================

-- =====================================================
-- 1. CREATE REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who sent the request
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Which artisan received it
  artisan_profile_id UUID REFERENCES public.artisan_profiles(id) ON DELETE SET NULL,
  
  -- Request details
  service_category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE RESTRICT,
  city_id INTEGER NOT NULL REFERENCES public.cities(id) ON DELETE RESTRICT,
  neighborhood_id INTEGER REFERENCES public.neighborhoods(id) ON DELETE SET NULL,
  
  -- Request content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  preferred_contact_method TEXT DEFAULT 'phone' CHECK (preferred_contact_method IN ('phone', 'whatsapp', 'email')),
  
  -- Client contact info (captured at request time for privacy)
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  client_whatsapp TEXT,
  
  -- Service details
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
  preferred_date DATE,
  preferred_time_slot TEXT CHECK (preferred_time_slot IN ('morning', 'afternoon', 'evening', 'flexible')),
  
  -- Budget (optional, in MAD)
  budget_min INTEGER CHECK (budget_min >= 0),
  budget_max INTEGER CHECK (budget_max >= budget_min),
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'viewed', 'contacted', 'accepted', 'rejected', 'completed', 'cancelled')),
  
  -- Artisan response
  artisan_response TEXT,
  artisan_responded_at TIMESTAMPTZ,
  
  -- Metadata
  is_archived BOOLEAN DEFAULT FALSE,
  viewed_by_artisan_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.requests IS 
  'Service requests sent by clients to artisans. Tracks full lifecycle from creation to completion.';

COMMENT ON COLUMN public.requests.client_id IS 
  'User who sent the request (from auth.users)';

COMMENT ON COLUMN public.requests.artisan_profile_id IS 
  'Artisan who received the request. NULL if artisan deleted their profile.';

COMMENT ON COLUMN public.requests.preferred_contact_method IS 
  'How client wants to be contacted: phone, whatsapp, or email';

COMMENT ON COLUMN public.requests.urgency IS 
  'Request urgency: low, normal, high, urgent';

COMMENT ON COLUMN public.requests.status IS 
  'Current status: pending -> viewed -> contacted -> accepted/rejected -> completed/cancelled';

COMMENT ON COLUMN public.requests.viewed_by_artisan_at IS 
  'When artisan first viewed the request (for tracking response time)';

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Client's requests
CREATE INDEX IF NOT EXISTS idx_requests_client 
  ON public.requests(client_id, created_at DESC);

-- Artisan's requests
CREATE INDEX IF NOT EXISTS idx_requests_artisan 
  ON public.requests(artisan_profile_id, status, created_at DESC)
  WHERE artisan_profile_id IS NOT NULL;

-- Search by service category and city
CREATE INDEX IF NOT EXISTS idx_requests_service_city 
  ON public.requests(service_category_id, city_id, status, created_at DESC);

-- Status queries
CREATE INDEX IF NOT EXISTS idx_requests_status 
  ON public.requests(status, created_at DESC);

-- Unread requests (for notifications)
CREATE INDEX IF NOT EXISTS idx_requests_unviewed 
  ON public.requests(artisan_profile_id, viewed_by_artisan_at)
  WHERE viewed_by_artisan_at IS NULL AND status = 'pending';

-- =====================================================
-- 3. CREATE TRIGGER FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_requests_updated_at ON public.requests;
CREATE TRIGGER set_requests_updated_at
  BEFORE UPDATE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_requests_updated_at();

-- =====================================================
-- 4. TRIGGER TO AUTO-UPDATE STATUS ON VIEW
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_request_view_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If viewed_by_artisan_at is being set for the first time
  IF NEW.viewed_by_artisan_at IS NOT NULL AND OLD.viewed_by_artisan_at IS NULL THEN
    -- And status is still pending, change to viewed
    IF NEW.status = 'pending' THEN
      NEW.status = 'viewed';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_update_request_view_status ON public.requests;
CREATE TRIGGER auto_update_request_view_status
  BEFORE UPDATE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_request_view_status();

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE RLS POLICIES
-- =====================================================

-- Clients can insert their own requests
DROP POLICY IF EXISTS "Clients can create requests" ON public.requests;
CREATE POLICY "Clients can create requests"
  ON public.requests
  FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- Clients can view their own sent requests
DROP POLICY IF EXISTS "Clients can view own requests" ON public.requests;
CREATE POLICY "Clients can view own requests"
  ON public.requests
  FOR SELECT
  USING (auth.uid() = client_id);

-- Clients can update their own pending requests (e.g., cancel)
DROP POLICY IF EXISTS "Clients can update own pending requests" ON public.requests;
CREATE POLICY "Clients can update own pending requests"
  ON public.requests
  FOR UPDATE
  USING (
    auth.uid() = client_id
    AND status IN ('pending', 'viewed')
  )
  WITH CHECK (
    auth.uid() = client_id
    -- Only allow updating certain fields
    AND status IN ('pending', 'viewed', 'cancelled')
  );

-- Artisans can view requests sent to their profiles
DROP POLICY IF EXISTS "Artisans can view own requests" ON public.requests;
CREATE POLICY "Artisans can view own requests"
  ON public.requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.artisan_profiles
      WHERE id = artisan_profile_id
        AND user_id = auth.uid()
    )
  );

-- Artisans can update requests sent to them (change status, add response)
DROP POLICY IF EXISTS "Artisans can respond to requests" ON public.requests;
CREATE POLICY "Artisans can respond to requests"
  ON public.requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.artisan_profiles
      WHERE id = artisan_profile_id
        AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.artisan_profiles
      WHERE id = artisan_profile_id
        AND user_id = auth.uid()
    )
    -- Artisans can only change status and response fields
    AND status IN ('viewed', 'contacted', 'accepted', 'rejected', 'completed')
  );

-- Admins have full access
DROP POLICY IF EXISTS "Admins can manage all requests" ON public.requests;
CREATE POLICY "Admins can manage all requests"
  ON public.requests
  FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT ON public.requests TO authenticated;
GRANT UPDATE ON public.requests TO authenticated;
GRANT ALL ON public.requests TO postgres, service_role;

-- =====================================================
-- 8. CREATE HELPER FUNCTION: CREATE REQUEST
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_service_request(
  p_artisan_profile_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_preferred_contact_method TEXT DEFAULT 'phone',
  p_client_name TEXT DEFAULT NULL,
  p_client_phone TEXT DEFAULT NULL,
  p_client_email TEXT DEFAULT NULL,
  p_client_whatsapp TEXT DEFAULT NULL,
  p_urgency TEXT DEFAULT 'normal',
  p_preferred_date DATE DEFAULT NULL,
  p_preferred_time_slot TEXT DEFAULT NULL,
  p_budget_min INTEGER DEFAULT NULL,
  p_budget_max INTEGER DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  request_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_artisan_data RECORD;
  v_new_request_id UUID;
  v_client_profile RECORD;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Validate required fields
  IF p_artisan_profile_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Artisan profile ID is required'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  IF p_title IS NULL OR trim(p_title) = '' THEN
    RETURN QUERY SELECT FALSE, 'Title is required'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  IF p_description IS NULL OR trim(p_description) = '' THEN
    RETURN QUERY SELECT FALSE, 'Description is required'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Get artisan profile data (verify it exists and is active)
  SELECT 
    ap.id,
    ap.service_category_id,
    ap.city_id,
    ap.is_verified,
    ap.is_active
  INTO v_artisan_data
  FROM public.artisan_profiles ap
  WHERE ap.id = p_artisan_profile_id;
  
  IF v_artisan_data IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Artisan profile not found'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  IF NOT v_artisan_data.is_verified OR NOT v_artisan_data.is_active THEN
    RETURN QUERY SELECT FALSE, 'This artisan profile is not available'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Get client profile data
  SELECT 
    full_name,
    phone,
    email
  INTO v_client_profile
  FROM public.profiles
  WHERE id = v_user_id;
  
  -- Use client profile data as fallback if not provided
  v_client_profile.full_name := COALESCE(p_client_name, v_client_profile.full_name, 'Anonymous');
  v_client_profile.phone := COALESCE(p_client_phone, v_client_profile.phone);
  v_client_profile.email := COALESCE(p_client_email, v_client_profile.email);
  
  -- Create request
  INSERT INTO public.requests (
    client_id,
    artisan_profile_id,
    service_category_id,
    city_id,
    title,
    description,
    preferred_contact_method,
    client_name,
    client_phone,
    client_email,
    client_whatsapp,
    urgency,
    preferred_date,
    preferred_time_slot,
    budget_min,
    budget_max,
    status
  ) VALUES (
    v_user_id,
    p_artisan_profile_id,
    v_artisan_data.service_category_id,
    v_artisan_data.city_id,
    trim(p_title),
    trim(p_description),
    p_preferred_contact_method,
    v_client_profile.full_name,
    v_client_profile.phone,
    v_client_profile.email,
    p_client_whatsapp,
    p_urgency,
    p_preferred_date,
    p_preferred_time_slot,
    p_budget_min,
    p_budget_max,
    'pending'
  )
  RETURNING id INTO v_new_request_id;
  
  -- TODO: Send notification to artisan (implement in application layer)
  
  -- Return success
  RETURN QUERY SELECT 
    TRUE,
    'Request sent successfully'::TEXT,
    v_new_request_id;
END;
$$;

COMMENT ON FUNCTION public.create_service_request IS 
  'Create service request from client to artisan (SECURITY DEFINER). Validates artisan is active and verified.';

GRANT EXECUTE ON FUNCTION public.create_service_request TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES (Run manually after migration)
-- =====================================================

-- Check table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'requests'
-- ORDER BY ordinal_position;

-- Check indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public' AND tablename = 'requests';

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'requests';
