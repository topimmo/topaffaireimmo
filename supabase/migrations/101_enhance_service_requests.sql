-- =====================================================
-- Migration 101: Enhance Service Requests Table
-- =====================================================
-- Updates service_requests table to match requirements
-- Adds missing fields and updates RLS policies
-- =====================================================

-- =====================================================
-- 1. ADD MISSING COLUMNS TO REQUESTS TABLE
-- =====================================================

-- Add subcategory_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'requests' 
    AND column_name = 'subcategory_id'
  ) THEN
    ALTER TABLE public.requests 
    ADD COLUMN subcategory_id UUID REFERENCES public.service_subcategories(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_requests_subcategory 
      ON public.requests(subcategory_id);
  END IF;
END $$;

-- Add assigned_artisan_id if it doesn't exist (different from artisan_profile_id)
-- This is the artisan assigned by admin for the request
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'requests' 
    AND column_name = 'assigned_artisan_id'
  ) THEN
    ALTER TABLE public.requests 
    ADD COLUMN assigned_artisan_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_requests_assigned_artisan 
      ON public.requests(assigned_artisan_id);
  END IF;
END $$;

-- Update status check constraint to include required statuses
DO $$
BEGIN
  -- Drop existing constraint
  ALTER TABLE public.requests 
    DROP CONSTRAINT IF EXISTS requests_status_check;
  
  -- Add new constraint with all required statuses
  ALTER TABLE public.requests 
    ADD CONSTRAINT requests_status_check 
    CHECK (status IN ('draft', 'pending', 'viewed', 'approved', 'rejected', 'completed', 'cancelled', 'contacted', 'accepted'));
END $$;

-- =====================================================
-- 2. UPDATE RLS POLICIES FOR SERVICE_REQUESTS
-- =====================================================

-- Drop old policies
DROP POLICY IF EXISTS "Clients can create requests" ON public.requests;
DROP POLICY IF EXISTS "Clients can view own requests" ON public.requests;
DROP POLICY IF EXISTS "Clients can update own pending requests" ON public.requests;
DROP POLICY IF EXISTS "Artisans can view own requests" ON public.requests;
DROP POLICY IF EXISTS "Artisans can respond to requests" ON public.requests;
DROP POLICY IF EXISTS "Admins can manage all requests" ON public.requests;

-- User can insert their own requests
CREATE POLICY "Users can create own requests"
  ON public.requests
  FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- User can select their own requests
CREATE POLICY "Users can view own requests"
  ON public.requests
  FOR SELECT
  USING (auth.uid() = client_id);

-- User can update their own requests (limited fields)
CREATE POLICY "Users can update own requests"
  ON public.requests
  FOR UPDATE
  USING (
    auth.uid() = client_id
    AND status IN ('draft', 'pending', 'viewed')
  )
  WITH CHECK (
    auth.uid() = client_id
    AND status IN ('draft', 'pending', 'viewed', 'cancelled')
  );

-- Artisan can select requests assigned to them
CREATE POLICY "Artisans can view assigned requests"
  ON public.requests
  FOR SELECT
  USING (auth.uid() = assigned_artisan_id);

-- Artisan can update requests assigned to them (change status and response)
CREATE POLICY "Artisans can update assigned requests"
  ON public.requests
  FOR UPDATE
  USING (auth.uid() = assigned_artisan_id)
  WITH CHECK (
    auth.uid() = assigned_artisan_id
    AND status IN ('viewed', 'contacted', 'accepted', 'rejected', 'completed')
  );

-- Admin has full access
CREATE POLICY "Admins have full access to requests"
  ON public.requests
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.admins))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

-- =====================================================
-- 3. ADD COMMENT
-- =====================================================

COMMENT ON COLUMN public.requests.assigned_artisan_id IS 
  'Artisan assigned by admin to handle this request (different from artisan_profile_id)';

COMMENT ON COLUMN public.requests.subcategory_id IS 
  'Optional service subcategory for more specific requests';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
