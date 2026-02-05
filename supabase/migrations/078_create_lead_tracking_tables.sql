-- Migration: Create lead tracking tables
-- Description: Track property views, contact clicks, and form submissions for analytics and monetization
-- Business value: Critical for measuring advertiser ROI and platform performance

-- ============================================================================
-- 1. Property Views Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS property_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- User identification (nullable for anonymous visitors)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Technical tracking
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  session_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT property_views_property_fk FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_property_views_property_id ON property_views(property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_user_id ON property_views(user_id);
CREATE INDEX IF NOT EXISTS idx_property_views_created_at ON property_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_views_session_id ON property_views(session_id);

-- ============================================================================
-- 2. Contact Clicks Tracking (Phone, WhatsApp, Email)
-- ============================================================================

CREATE TABLE IF NOT EXISTS property_contact_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Contact type
  contact_type TEXT NOT NULL CHECK (contact_type IN ('phone', 'whatsapp', 'email')),
  
  -- User identification (nullable for anonymous)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Tracking
  ip_address INET,
  session_id TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT property_contact_clicks_property_fk FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contact_clicks_property_id ON property_contact_clicks(property_id);
CREATE INDEX IF NOT EXISTS idx_contact_clicks_user_id ON property_contact_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_clicks_created_at ON property_contact_clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_clicks_type ON property_contact_clicks(contact_type);

-- ============================================================================
-- 3. Lead Form Submissions (for future contact forms)
-- ============================================================================

CREATE TABLE IF NOT EXISTS property_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Advertiser (property owner)
  advertiser_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Lead information
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  message TEXT,
  
  -- Source tracking
  source TEXT NOT NULL DEFAULT 'form' CHECK (source IN ('form', 'phone', 'whatsapp', 'email')),
  
  -- Lead status
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'closed', 'spam')),
  
  -- Notes and follow-up
  notes TEXT,
  advertiser_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  contacted_at TIMESTAMPTZ,
  
  CONSTRAINT property_leads_property_fk FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT property_leads_advertiser_fk FOREIGN KEY (advertiser_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_property_id ON property_leads(property_id);
CREATE INDEX IF NOT EXISTS idx_leads_advertiser_id ON property_leads(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON property_leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON property_leads(created_at DESC);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Property Views (public can insert, property owners can read)
ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can track property views"
  ON property_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Property owners can view their property analytics"
  ON property_views FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all analytics"
  ON property_views FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active = true)
  );

-- Contact Clicks (public can insert, property owners can read)
ALTER TABLE property_contact_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can track contact clicks"
  ON property_contact_clicks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Property owners can view their contact clicks"
  ON property_contact_clicks FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all contact clicks"
  ON property_contact_clicks FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active = true)
  );

-- Property Leads (advertisers can manage, admins can view all)
ALTER TABLE property_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Advertisers can view their own leads"
  ON property_leads FOR SELECT
  USING (advertiser_id = auth.uid());

CREATE POLICY "Advertisers can update their own leads"
  ON property_leads FOR UPDATE
  USING (advertiser_id = auth.uid())
  WITH CHECK (advertiser_id = auth.uid());

CREATE POLICY "Anyone can create leads"
  ON property_leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all leads"
  ON property_leads FOR ALL
  USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active = true)
  );

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-update updated_at timestamp for leads
CREATE OR REPLACE FUNCTION update_property_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER property_leads_updated_at
  BEFORE UPDATE ON property_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_property_leads_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE property_views IS 'Tracks property page views for analytics';
COMMENT ON TABLE property_contact_clicks IS 'Tracks contact button clicks (phone, whatsapp, email)';
COMMENT ON TABLE property_leads IS 'Stores lead submissions and contact requests';

COMMENT ON COLUMN property_views.session_id IS 'Browser session identifier for deduplication';
COMMENT ON COLUMN property_contact_clicks.contact_type IS 'Type of contact: phone, whatsapp, or email';
COMMENT ON COLUMN property_leads.source IS 'How the lead was generated: form, phone, whatsapp, email';
COMMENT ON COLUMN property_leads.status IS 'Lead pipeline status: new, contacted, qualified, closed, spam';

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Lead tracking tables created successfully:';
  RAISE NOTICE '- property_views: Track page views';
  RAISE NOTICE '- property_contact_clicks: Track contact interactions';
  RAISE NOTICE '- property_leads: Store lead submissions';
  RAISE NOTICE 'All tables have RLS enabled for security';
END $$;
