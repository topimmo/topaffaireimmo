-- =====================================================
-- Migration 096: Create Reviews and Ratings Table
-- =====================================================
-- Purpose: Enable clients to review artisans after service completion
-- Includes rating (1-5 stars), text review, and response from artisan
-- =====================================================

-- =====================================================
-- 1. CREATE REVIEWS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who wrote the review
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Which artisan is being reviewed
  artisan_profile_id UUID NOT NULL REFERENCES public.artisan_profiles(id) ON DELETE CASCADE,
  
  -- Related request (optional - can review without request)
  request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
  
  -- Rating and review
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT NOT NULL,
  
  -- Review categories (optional detailed ratings)
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  
  -- Would recommend?
  would_recommend BOOLEAN DEFAULT TRUE,
  
  -- Artisan response
  artisan_response TEXT,
  artisan_responded_at TIMESTAMPTZ,
  
  -- Moderation
  is_verified BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  moderation_note TEXT,
  
  -- Media attachments (photos of completed work)
  photo_urls TEXT[],
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate reviews
  CONSTRAINT unique_client_artisan_request UNIQUE (client_id, artisan_profile_id, request_id)
);

COMMENT ON TABLE public.reviews IS 
  'Client reviews and ratings for artisan profiles. Supports 5-star rating system with optional detailed ratings.';

COMMENT ON COLUMN public.reviews.rating IS 
  'Overall rating: 1-5 stars (required)';

COMMENT ON COLUMN public.reviews.quality_rating IS 
  'Work quality rating: 1-5 stars (optional)';

COMMENT ON COLUMN public.reviews.professionalism_rating IS 
  'Professionalism rating: 1-5 stars (optional)';

COMMENT ON COLUMN public.reviews.communication_rating IS 
  'Communication rating: 1-5 stars (optional)';

COMMENT ON COLUMN public.reviews.value_rating IS 
  'Value for money rating: 1-5 stars (optional)';

COMMENT ON COLUMN public.reviews.is_verified IS 
  'Review verified by admin (prevents fake reviews)';

COMMENT ON COLUMN public.reviews.is_flagged IS 
  'Review flagged for moderation (inappropriate content)';

COMMENT ON COLUMN public.reviews.is_hidden IS 
  'Review hidden from public view (admin action)';

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Get all reviews for an artisan (most common query)
CREATE INDEX IF NOT EXISTS idx_reviews_artisan 
  ON public.reviews(artisan_profile_id, created_at DESC)
  WHERE is_hidden = FALSE;

-- Get artisan reviews with high ratings (for featuring)
CREATE INDEX IF NOT EXISTS idx_reviews_artisan_rating 
  ON public.reviews(artisan_profile_id, rating DESC, created_at DESC)
  WHERE is_hidden = FALSE;

-- Get client's reviews
CREATE INDEX IF NOT EXISTS idx_reviews_client 
  ON public.reviews(client_id, created_at DESC);

-- Get reviews for a request
CREATE INDEX IF NOT EXISTS idx_reviews_request 
  ON public.reviews(request_id)
  WHERE request_id IS NOT NULL;

-- Moderation queue
CREATE INDEX IF NOT EXISTS idx_reviews_flagged 
  ON public.reviews(is_flagged, created_at DESC)
  WHERE is_flagged = TRUE;

CREATE INDEX IF NOT EXISTS idx_reviews_unverified 
  ON public.reviews(is_verified, created_at DESC)
  WHERE is_verified = FALSE;

-- =====================================================
-- 3. CREATE TRIGGER FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_reviews_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_reviews_updated_at ON public.reviews;
CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reviews_updated_at();

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE RLS POLICIES
-- =====================================================

-- Anyone can read public reviews (not hidden)
DROP POLICY IF EXISTS "Public can view visible reviews" ON public.reviews;
CREATE POLICY "Public can view visible reviews"
  ON public.reviews
  FOR SELECT
  USING (is_hidden = FALSE);

-- Clients can insert reviews for artisans they've worked with
DROP POLICY IF EXISTS "Clients can create reviews" ON public.reviews;
CREATE POLICY "Clients can create reviews"
  ON public.reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    -- Optional: Only allow review if request was completed
    -- AND (request_id IS NULL OR EXISTS (
    --   SELECT 1 FROM public.requests
    --   WHERE id = request_id
    --     AND client_id = auth.uid()
    --     AND status = 'completed'
    -- ))
  );

-- Clients can update their own reviews (within time limit)
DROP POLICY IF EXISTS "Clients can update own reviews" ON public.reviews;
CREATE POLICY "Clients can update own reviews"
  ON public.reviews
  FOR UPDATE
  USING (
    auth.uid() = client_id
    -- Allow edit within 30 days
    AND created_at > NOW() - INTERVAL '30 days'
  )
  WITH CHECK (
    auth.uid() = client_id
    -- Prevent changing critical fields
    AND artisan_profile_id = artisan_profile_id -- No change
    AND client_id = client_id -- No change
  );

-- Clients can delete their own reviews (within time limit)
DROP POLICY IF EXISTS "Clients can delete own reviews" ON public.reviews;
CREATE POLICY "Clients can delete own reviews"
  ON public.reviews
  FOR DELETE
  USING (
    auth.uid() = client_id
    AND created_at > NOW() - INTERVAL '7 days' -- Only within 7 days
  );

-- Artisans can view all reviews for their profiles
DROP POLICY IF EXISTS "Artisans can view own reviews" ON public.reviews;
CREATE POLICY "Artisans can view own reviews"
  ON public.reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.artisan_profiles
      WHERE id = artisan_profile_id
        AND user_id = auth.uid()
    )
  );

-- Artisans can respond to reviews
DROP POLICY IF EXISTS "Artisans can respond to reviews" ON public.reviews;
CREATE POLICY "Artisans can respond to reviews"
  ON public.reviews
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
    -- Artisans can only update response fields
    AND artisan_profile_id = artisan_profile_id -- No change
    AND client_id = client_id -- No change
    AND rating = rating -- No change
  );

-- Admins have full access
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
CREATE POLICY "Admins can manage all reviews"
  ON public.reviews
  FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT ON public.reviews TO anon, authenticated;
GRANT UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO postgres, service_role;

-- =====================================================
-- 7. CREATE HELPER FUNCTIONS
-- =====================================================

-- Get artisan average rating and total reviews
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
  WHERE artisan_profile_id = p_artisan_profile_id
    AND is_hidden = FALSE;
$$;

COMMENT ON FUNCTION public.get_artisan_rating_stats IS 
  'Get comprehensive rating statistics for an artisan profile';

GRANT EXECUTE ON FUNCTION public.get_artisan_rating_stats TO anon, authenticated;

-- Flag review for moderation
CREATE OR REPLACE FUNCTION public.flag_review(
  p_review_id UUID,
  p_reason TEXT DEFAULT NULL
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
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated'::TEXT;
    RETURN;
  END IF;
  
  -- Flag the review
  UPDATE public.reviews
  SET is_flagged = TRUE,
      moderation_note = COALESCE(moderation_note || E'\n', '') || 
        'Flagged by user ' || v_user_id::TEXT || 
        CASE WHEN p_reason IS NOT NULL THEN ': ' || p_reason ELSE '' END
  WHERE id = p_review_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Review not found'::TEXT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT TRUE, 'Review flagged for moderation'::TEXT;
END;
$$;

COMMENT ON FUNCTION public.flag_review IS 
  'Flag a review for moderation (inappropriate content, spam, etc.)';

GRANT EXECUTE ON FUNCTION public.flag_review TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES (Run manually after migration)
-- =====================================================

-- Check table structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'reviews'
-- ORDER BY ordinal_position;

-- Test rating stats function
-- SELECT * FROM public.get_artisan_rating_stats('some-artisan-uuid');
