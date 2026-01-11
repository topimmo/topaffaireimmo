-- TopAffaireImmo Full Database Rebuild
-- Complete Supabase schema for real estate classifieds platform
-- Supports French and Arabic, role-based access, commercial advertising separation

-- =====================================================
-- 1. DROP ALL EXISTING TABLES (Clean Rebuild)
-- =====================================================

DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS banner_requests CASCADE;
DROP TABLE IF EXISTS banner_slots CASCADE;
DROP TABLE IF EXISTS property_images CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS neighborhoods CASCADE;
DROP TABLE IF EXISTS cities CASCADE;
DROP TABLE IF EXISTS property_types CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =====================================================
-- 2. CORE TABLES
-- =====================================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  
  -- Role system (mutually exclusive)
  user_role TEXT NOT NULL DEFAULT 'user' CHECK (user_role IN ('user', 'admin', 'real_estate_advertiser', 'commercial_advertiser')),
  
  -- For real estate advertisers
  advertiser_type TEXT CHECK (advertiser_type IN ('owner', 'broker', 'agency')),
  agency_name TEXT,
  agency_license TEXT,
  agency_address TEXT,
  agency_logo_url TEXT,
  
  -- Settings
  preferred_language TEXT DEFAULT 'fr' CHECK (preferred_language IN ('fr', 'ar')),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property Types (reference table)
CREATE TABLE IF NOT EXISTS property_types (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cities (Moroccan cities)
CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  region_fr TEXT,
  region_ar TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Neighborhoods
CREATE TABLE IF NOT EXISTS neighborhoods (
  id SERIAL PRIMARY KEY,
  city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties (Real Estate Listings - FREE)
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Type and transaction
  property_type_id INTEGER REFERENCES property_types(id),
  property_type TEXT NOT NULL CHECK (property_type IN ('apartment', 'house', 'villa', 'land', 'commercial')),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'rent')),
  advertiser_type TEXT NOT NULL DEFAULT 'owner' CHECK (advertiser_type IN ('owner', 'broker', 'agency')),
  
  -- Location
  city_id INTEGER NOT NULL REFERENCES cities(id),
  neighborhood_id INTEGER REFERENCES neighborhoods(id),
  custom_neighborhood TEXT,
  address TEXT,
  
  -- Details
  price DECIMAL(15, 2) NOT NULL,
  area DECIMAL(10, 2),
  bedrooms INTEGER,
  bathrooms INTEGER,
  floor_number INTEGER,
  total_floors INTEGER,
  year_built INTEGER,
  
  -- Multilingual content
  title_fr TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_fr TEXT,
  description_ar TEXT,
  description_en TEXT,
  
  -- Features (JSON array)
  features JSONB DEFAULT '[]'::jsonb,
  
  -- Images (JSON array of URLs)
  images JSONB DEFAULT '[]'::jsonb,
  
  -- Contact
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'sold', 'rented', 'expired', 'archived')),
  rejection_reason TEXT,
  
  -- Stats
  views_count INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  
  -- Featured
  is_featured BOOLEAN DEFAULT FALSE,
  featured_until TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days')
);

-- Property Images (separate table for better management)
CREATE TABLE IF NOT EXISTS property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text_fr TEXT,
  alt_text_ar TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. COMMERCIAL ADVERTISING SYSTEM (Separate & Isolated)
-- =====================================================

-- Banner Slots (where ads can appear)
CREATE TABLE IF NOT EXISTS banner_slots (
  id SERIAL PRIMARY KEY,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  page TEXT NOT NULL,
  position TEXT NOT NULL,
  size TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  price_per_day DECIMAL(10, 2) NOT NULL,
  price_per_week DECIMAL(10, 2),
  price_per_month DECIMAL(10, 2),
  max_file_size_kb INTEGER DEFAULT 500,
  allowed_formats TEXT[] DEFAULT ARRAY['jpg', 'jpeg', 'png', 'gif', 'webp'],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banner Requests (Commercial Advertising Orders)
CREATE TABLE IF NOT EXISTS banner_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slot_id INTEGER NOT NULL REFERENCES banner_slots(id),
  
  -- Advertiser info
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  website_url TEXT,
  
  -- Banner details
  banner_image_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  alt_text_fr TEXT,
  alt_text_ar TEXT,
  
  -- Duration and pricing
  duration_days INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  
  -- Payment
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'cash', 'mobile_payment')),
  payment_proof_url TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'received', 'verified', 'refunded')),
  
  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'rejected', 'expired', 'cancelled')),
  admin_notes TEXT,
  rejection_reason TEXT,
  
  -- Dates
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  
  -- Stats
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments tracking
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  banner_request_id UUID REFERENCES banner_requests(id) ON DELETE SET NULL,
  
  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'MAD',
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  receipt_url TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Notes
  description TEXT,
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- 4. SITE SETTINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value_text TEXT,
  value_json JSONB,
  description_fr TEXT,
  description_ar TEXT,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- 5. INSERT DEFAULT DATA
-- =====================================================

-- Property Types
INSERT INTO property_types (code, name_fr, name_ar, icon, sort_order) VALUES
  ('apartment', 'Appartement', 'شقة', 'building', 1),
  ('house', 'Maison', 'منزل', 'home', 2),
  ('villa', 'Villa', 'فيلا', 'castle', 3),
  ('land', 'Terrain', 'أرض', 'map', 4),
  ('commercial', 'Commercial', 'تجاري', 'store', 5)
ON CONFLICT (code) DO NOTHING;

-- Moroccan Cities
INSERT INTO cities (name_fr, name_ar, region_fr, region_ar, sort_order) VALUES
  ('Casablanca', 'الدار البيضاء', 'Casablanca-Settat', 'الدار البيضاء-سطات', 1),
  ('Rabat', 'الرباط', 'Rabat-Salé-Kénitra', 'الرباط-سلا-القنيطرة', 2),
  ('Marrakech', 'مراكش', 'Marrakech-Safi', 'مراكش-آسفي', 3),
  ('Fès', 'فاس', 'Fès-Meknès', 'فاس-مكناس', 4),
  ('Tanger', 'طنجة', 'Tanger-Tétouan-Al Hoceïma', 'طنجة-تطوان-الحسيمة', 5),
  ('Agadir', 'أكادير', 'Souss-Massa', 'سوس-ماسة', 6),
  ('Meknès', 'مكناس', 'Fès-Meknès', 'فاس-مكناس', 7),
  ('Oujda', 'وجدة', 'Oriental', 'الشرق', 8),
  ('Kénitra', 'القنيطرة', 'Rabat-Salé-Kénitra', 'الرباط-سلا-القنيطرة', 9),
  ('Tétouan', 'تطوان', 'Tanger-Tétouan-Al Hoceïma', 'طنجة-تطوان-الحسيمة', 10),
  ('Salé', 'سلا', 'Rabat-Salé-Kénitra', 'الرباط-سلا-القنيطرة', 11),
  ('Nador', 'الناظور', 'Oriental', 'الشرق', 12),
  ('Mohammedia', 'المحمدية', 'Casablanca-Settat', 'الدار البيضاء-سطات', 13),
  ('El Jadida', 'الجديدة', 'Casablanca-Settat', 'الدار البيضاء-سطات', 14),
  ('Béni Mellal', 'بني ملال', 'Béni Mellal-Khénifra', 'بني ملال-خنيفرة', 15),
  ('Khouribga', 'خريبكة', 'Béni Mellal-Khénifra', 'بني ملال-خنيفرة', 16),
  ('Settat', 'سطات', 'Casablanca-Settat', 'الدار البيضاء-سطات', 17),
  ('Safi', 'آسفي', 'Marrakech-Safi', 'مراكش-آسفي', 18),
  ('Laâyoune', 'العيون', 'Laâyoune-Sakia El Hamra', 'العيون-الساقية الحمراء', 19),
  ('Taza', 'تازة', 'Fès-Meknès', 'فاس-مكناس', 20),
  ('Errachidia', 'الراشيدية', 'Drâa-Tafilalet', 'درعة-تافيلالت', 21),
  ('Essaouira', 'الصويرة', 'Marrakech-Safi', 'مراكش-آسفي', 22),
  ('Ifrane', 'إفران', 'Fès-Meknès', 'فاس-مكناس', 23),
  ('Al Hoceïma', 'الحسيمة', 'Tanger-Tétouan-Al Hoceïma', 'طنجة-تطوان-الحسيمة', 24),
  ('Ouarzazate', 'ورزازات', 'Drâa-Tafilalet', 'درعة-تافيلالت', 25)
ON CONFLICT DO NOTHING;

-- Some neighborhoods for major cities
INSERT INTO neighborhoods (city_id, name_fr, name_ar) VALUES
  (1, 'Maarif', 'المعاريف'),
  (1, 'Anfa', 'أنفا'),
  (1, 'Bourgogne', 'بورغون'),
  (1, 'Ain Diab', 'عين الذياب'),
  (1, 'Hay Hassani', 'حي حسني'),
  (1, 'Sidi Moumen', 'سيدي مومن'),
  (1, 'Ain Sebaa', 'عين السبع'),
  (2, 'Agdal', 'أكدال'),
  (2, 'Hay Riad', 'حي الرياض'),
  (2, 'Hassan', 'حسان'),
  (2, 'Souissi', 'السويسي'),
  (2, 'Yacoub El Mansour', 'يعقوب المنصور'),
  (3, 'Guéliz', 'جليز'),
  (3, 'Hivernage', 'الشتاء'),
  (3, 'Médina', 'المدينة'),
  (3, 'Palmeraie', 'النخيل'),
  (5, 'Malabata', 'ملاباطا'),
  (5, 'Iberia', 'إيبيريا'),
  (5, 'Marshan', 'مرشان'),
  (6, 'Talborjt', 'تالبرجت'),
  (6, 'Hay Mohammadi', 'حي المحمدي')
ON CONFLICT DO NOTHING;

-- Banner Slots
INSERT INTO banner_slots (code, name_fr, name_ar, page, position, size, width, height, price_per_day, price_per_week, price_per_month) VALUES
  ('home_hero', 'Bannière Hero Accueil', 'بانر الصفحة الرئيسية', 'home', 'hero', '970x250', 970, 250, 150, 800, 3000),
  ('home_mid', 'Bannière Milieu Accueil', 'بانر وسط الصفحة الرئيسية', 'home', 'middle', '728x90', 728, 90, 100, 500, 1800),
  ('home_sidebar', 'Bannière Sidebar Accueil', 'بانر الجانب الرئيسية', 'home', 'sidebar', '300x250', 300, 250, 80, 400, 1500),
  ('search_top', 'Bannière Haut Recherche', 'بانر أعلى البحث', 'search', 'top', '728x90', 728, 90, 120, 600, 2200),
  ('search_sidebar', 'Bannière Sidebar Recherche', 'بانر جانب البحث', 'search', 'sidebar', '300x600', 300, 600, 100, 500, 1800),
  ('details_top', 'Bannière Détails Propriété', 'بانر تفاصيل العقار', 'property_details', 'top', '728x90', 728, 90, 80, 400, 1500),
  ('mobile_banner', 'Bannière Mobile', 'بانر الجوال', 'all', 'mobile', '320x100', 320, 100, 60, 300, 1000)
ON CONFLICT (code) DO NOTHING;

-- Site Settings
INSERT INTO site_settings (key, value_text, description_fr, description_ar, category, is_public) VALUES
  ('site_name', 'TopAffaireImmo', 'Nom du site', 'اسم الموقع', 'general', true),
  ('site_description_fr', 'La plateforme immobilière de référence au Maroc', 'Description en français', 'الوصف بالفرنسية', 'general', true),
  ('site_description_ar', 'المنصة العقارية المرجعية في المغرب', 'Description en arabe', 'الوصف بالعربية', 'general', true),
  ('contact_email', 'contact@topaffaireimmo.com', 'Email de contact', 'البريد الإلكتروني للتواصل', 'contact', true),
  ('contact_phone', '+212 5XX-XXXXXX', 'Téléphone de contact', 'هاتف التواصل', 'contact', true),
  ('default_language', 'fr', 'Langue par défaut', 'اللغة الافتراضية', 'general', true),
  ('listing_expiry_days', '90', 'Durée de validité des annonces (jours)', 'مدة صلاحية الإعلانات (أيام)', 'listings', false),
  ('max_images_per_listing', '10', 'Nombre max d''images par annonce', 'الحد الأقصى للصور لكل إعلان', 'listings', false),
  ('auto_approve_listings', 'false', 'Approuver automatiquement les annonces', 'الموافقة التلقائية على الإعلانات', 'listings', false)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6.1 PROFILES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin')
  );

DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
CREATE POLICY "profiles_select_public" ON profiles
  FOR SELECT USING (
    user_role = 'real_estate_advertiser' AND is_active = true
  );

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin')
  );

-- =====================================================
-- 6.2 PROPERTIES POLICIES (Real Estate - Isolated from Commercial)
-- =====================================================

DROP POLICY IF EXISTS "properties_select_approved" ON properties;
CREATE POLICY "properties_select_approved" ON properties
  FOR SELECT USING (
    status = 'approved' OR 
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin')
  );

DROP POLICY IF EXISTS "properties_insert_own" ON properties;
CREATE POLICY "properties_insert_own" ON properties
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('user', 'real_estate_advertiser', 'admin')
      AND user_role != 'commercial_advertiser'
    )
  );

DROP POLICY IF EXISTS "properties_update_own" ON properties;
CREATE POLICY "properties_update_own" ON properties
  FOR UPDATE USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin')
  );

DROP POLICY IF EXISTS "properties_delete_own" ON properties;
CREATE POLICY "properties_delete_own" ON properties
  FOR DELETE USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin')
  );

-- =====================================================
-- 6.3 PROPERTY IMAGES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "property_images_select" ON property_images;
CREATE POLICY "property_images_select" ON property_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_images.property_id 
      AND (properties.status = 'approved' OR properties.owner_id = auth.uid())
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin')
  );

DROP POLICY IF EXISTS "property_images_insert" ON property_images;
CREATE POLICY "property_images_insert" ON property_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_images.property_id 
      AND properties.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "property_images_delete" ON property_images;
CREATE POLICY "property_images_delete" ON property_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_images.property_id 
      AND properties.owner_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin')
  );

-- =====================================================
-- 6.4 BANNER SYSTEM POLICIES (Commercial - Isolated from Real Estate)
-- =====================================================

DROP POLICY IF EXISTS "banner_slots_select" ON banner_slots;
CREATE POLICY "banner_slots_select" ON banner_slots
  FOR SELECT USING (is_active = true OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin'));

DROP POLICY IF EXISTS "banner_slots_admin" ON banner_slots;
CREATE POLICY "banner_slots_admin" ON banner_slots
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin'));

DROP POLICY IF EXISTS "banner_requests_select_own" ON banner_requests;
CREATE POLICY "banner_requests_select_own" ON banner_requests
  FOR SELECT USING (
    advertiser_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin')
  );

DROP POLICY IF EXISTS "banner_requests_insert" ON banner_requests;
CREATE POLICY "banner_requests_insert" ON banner_requests
  FOR INSERT WITH CHECK (
    auth.uid() = advertiser_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('commercial_advertiser', 'admin')
      AND user_role NOT IN ('real_estate_advertiser')
    )
  );

DROP POLICY IF EXISTS "banner_requests_update_own" ON banner_requests;
CREATE POLICY "banner_requests_update_own" ON banner_requests
  FOR UPDATE USING (
    (advertiser_id = auth.uid() AND status = 'pending') OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin')
  );

-- =====================================================
-- 6.5 PAYMENTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "payments_select_own" ON payments;
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin')
  );

DROP POLICY IF EXISTS "payments_insert_own" ON payments;
CREATE POLICY "payments_insert_own" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "payments_admin" ON payments;
CREATE POLICY "payments_admin" ON payments
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin'));

-- =====================================================
-- 6.6 REFERENCE DATA POLICIES (Public Read)
-- =====================================================

DROP POLICY IF EXISTS "cities_select" ON cities;
CREATE POLICY "cities_select" ON cities FOR SELECT USING (true);

DROP POLICY IF EXISTS "cities_admin" ON cities;
CREATE POLICY "cities_admin" ON cities
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin'));

DROP POLICY IF EXISTS "neighborhoods_select" ON neighborhoods;
CREATE POLICY "neighborhoods_select" ON neighborhoods FOR SELECT USING (true);

DROP POLICY IF EXISTS "neighborhoods_admin" ON neighborhoods;
CREATE POLICY "neighborhoods_admin" ON neighborhoods
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin'));

DROP POLICY IF EXISTS "property_types_select" ON property_types;
CREATE POLICY "property_types_select" ON property_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "property_types_admin" ON property_types;
CREATE POLICY "property_types_admin" ON property_types
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin'));

DROP POLICY IF EXISTS "site_settings_select_public" ON site_settings;
CREATE POLICY "site_settings_select_public" ON site_settings
  FOR SELECT USING (is_public = true OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin'));

DROP POLICY IF EXISTS "site_settings_admin" ON site_settings;
CREATE POLICY "site_settings_admin" ON site_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin'));

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, preferred_language)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'fr')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_banner_requests_updated_at ON banner_requests;
CREATE TRIGGER update_banner_requests_updated_at
  BEFORE UPDATE ON banner_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- 8. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_transaction ON properties(transaction_type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_created ON properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_property_images_property ON property_images(property_id);

CREATE INDEX IF NOT EXISTS idx_banner_requests_advertiser ON banner_requests(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_banner_requests_status ON banner_requests(status);
CREATE INDEX IF NOT EXISTS idx_banner_requests_slot ON banner_requests(slot_id);
CREATE INDEX IF NOT EXISTS idx_banner_requests_active ON banner_requests(status, start_date, end_date) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_neighborhoods_city ON neighborhoods(city_id);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(user_role);

-- =====================================================
-- 9. ENABLE REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE properties;
ALTER PUBLICATION supabase_realtime ADD TABLE banner_requests;

-- =====================================================
-- 10. STORAGE BUCKETS CONFIGURATION
-- Note: Storage buckets and policies are created via Supabase Dashboard
-- or API. Below is the configuration documentation.
-- =====================================================

/*
STORAGE BUCKETS TO CREATE:

1. property-images
   - Public: false
   - File size limit: 5MB
   - Allowed MIME types: image/jpeg, image/png, image/webp
   - Policies:
     - SELECT: Authenticated users can view property images (if property is approved or owned by them)
     - INSERT: Authenticated users can upload to their own folder (owner_id/property_id/)
     - DELETE: Owners can delete their own images, admins can delete any

2. banner-images
   - Public: false
   - File size limit: 1MB
   - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
   - Policies:
     - SELECT: Public read for active banners
     - INSERT: Commercial advertisers can upload
     - DELETE: Owners can delete their own, admins can delete any

3. payment-receipts
   - Public: false
   - File size limit: 2MB
   - Allowed MIME types: image/jpeg, image/png, application/pdf
   - Policies:
     - SELECT: User can view their own, admins can view all
     - INSERT: Authenticated users can upload to their own folder
     - DELETE: Admins only

4. agency-logos
   - Public: true (for display purposes)
   - File size limit: 500KB
   - Allowed MIME types: image/jpeg, image/png, image/webp
   - Policies:
     - SELECT: Public
     - INSERT: Real estate advertisers (agencies) only
     - DELETE: Owner or admin
*/
