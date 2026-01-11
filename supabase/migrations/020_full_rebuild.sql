-- =====================================================
-- TOPAFFAIREIMMO - COMPLETE DATABASE REBUILD
-- Full Supabase setup from scratch
-- =====================================================

-- =====================================================
-- 0. DROP ALL EXISTING OBJECTS (CLEAN SLATE)
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.check_user_role(uuid, text[]) CASCADE;

DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.banner_requests CASCADE;
DROP TABLE IF EXISTS public.banner_slots CASCADE;
DROP TABLE IF EXISTS public.property_images CASCADE;
DROP TABLE IF EXISTS public.properties CASCADE;
DROP TABLE IF EXISTS public.property_types CASCADE;
DROP TABLE IF EXISTS public.neighborhoods CASCADE;
DROP TABLE IF EXISTS public.cities CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- =====================================================
-- 1. PROFILES TABLE (Users with Roles)
-- =====================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  
  -- Role system: admin, real_estate_advertiser, commercial_advertiser
  user_role TEXT NOT NULL DEFAULT 'real_estate_advertiser' 
    CHECK (user_role IN ('admin', 'real_estate_advertiser', 'commercial_advertiser')),
  
  -- Sub-type for real estate advertisers only
  advertiser_type TEXT DEFAULT 'owner' 
    CHECK (advertiser_type IN ('owner', 'agency')),
  
  -- Agency-specific fields (only for advertiser_type = 'agency')
  agency_name TEXT,
  agency_logo TEXT,
  agency_description_fr TEXT,
  agency_description_ar TEXT,
  agency_cities TEXT[],
  agency_license TEXT,
  
  -- Commercial advertiser fields
  company_name TEXT,
  company_website TEXT,
  
  -- Settings
  preferred_language TEXT DEFAULT 'fr' CHECK (preferred_language IN ('fr', 'ar')),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for role-based queries
CREATE INDEX idx_profiles_user_role ON public.profiles(user_role);
CREATE INDEX idx_profiles_advertiser_type ON public.profiles(advertiser_type);

-- =====================================================
-- 2. REFERENCE DATA TABLES
-- =====================================================

-- Cities (Moroccan cities with bilingual support)
CREATE TABLE public.cities (
  id SERIAL PRIMARY KEY,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  region_fr TEXT,
  region_ar TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cities_active ON public.cities(is_active);

-- Property Types
CREATE TABLE public.property_types (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Neighborhoods
CREATE TABLE public.neighborhoods (
  id SERIAL PRIMARY KEY,
  city_id INTEGER NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_neighborhoods_city ON public.neighborhoods(city_id);

-- =====================================================
-- 3. PROPERTIES TABLE (Real Estate Listings - FREE)
-- =====================================================

CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Classification
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'rent')),
  property_type_id INTEGER REFERENCES public.property_types(id),
  property_type TEXT NOT NULL CHECK (property_type IN ('apartment', 'house', 'villa', 'commercial', 'land')),
  
  -- Location
  city_id INTEGER NOT NULL REFERENCES public.cities(id),
  neighborhood_id INTEGER REFERENCES public.neighborhoods(id),
  custom_neighborhood TEXT,
  address TEXT,
  
  -- Details
  price DECIMAL(15,2) NOT NULL,
  area DECIMAL(10,2),
  bedrooms INTEGER,
  bathrooms INTEGER,
  floor_number INTEGER,
  total_floors INTEGER,
  year_built INTEGER,
  
  -- Multilingual content
  title_fr TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_fr TEXT,
  description_ar TEXT,
  
  -- Features (JSON for flexibility)
  features JSONB DEFAULT '[]'::jsonb,
  amenities JSONB DEFAULT '[]'::jsonb,
  
  -- Images array
  images TEXT[] DEFAULT '{}',
  
  -- Contact
  contact_phone TEXT,
  contact_whatsapp TEXT,
  contact_email TEXT,
  
  -- Advertiser info
  advertiser_type TEXT DEFAULT 'owner' CHECK (advertiser_type IN ('owner', 'broker', 'agency')),
  
  -- Status and moderation
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'sold', 'rented', 'inactive')),
  rejection_reason TEXT,
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES public.profiles(id),
  
  -- Visibility
  featured BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for property queries
CREATE INDEX idx_properties_owner ON public.properties(owner_id);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_city ON public.properties(city_id);
CREATE INDEX idx_properties_transaction ON public.properties(transaction_type);
CREATE INDEX idx_properties_type ON public.properties(property_type);
CREATE INDEX idx_properties_price ON public.properties(price);
CREATE INDEX idx_properties_created ON public.properties(created_at DESC);
CREATE INDEX idx_properties_featured ON public.properties(featured) WHERE featured = TRUE;

-- =====================================================
-- 4. PROPERTY IMAGES (Separate table for better management)
-- =====================================================

CREATE TABLE public.property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_property_images_property ON public.property_images(property_id);

-- =====================================================
-- 5. BANNER ADVERTISING SYSTEM (Revenue Source)
-- =====================================================

-- Banner Slots (Available ad positions)
CREATE TABLE public.banner_slots (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  page TEXT NOT NULL,
  position TEXT NOT NULL,
  size TEXT NOT NULL,
  price_per_day DECIMAL(10,2) NOT NULL,
  price_per_week DECIMAL(10,2),
  price_per_month DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  max_file_size INTEGER DEFAULT 1048576,
  allowed_formats TEXT[] DEFAULT ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banner Requests (Ad campaigns from commercial advertisers)
CREATE TABLE public.banner_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slot_id INTEGER NOT NULL REFERENCES public.banner_slots(id),
  
  -- Advertiser info
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  
  -- Campaign details
  duration_days INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  
  -- Creative
  banner_image_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  alt_text_fr TEXT,
  alt_text_ar TEXT,
  
  -- Payment
  payment_proof_url TEXT,
  payment_method TEXT,
  payment_reference TEXT,
  
  -- Status workflow: pending -> approved/rejected -> active -> expired
  status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'expired', 'cancelled')),
  
  -- Admin moderation
  admin_notes TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  
  -- Campaign dates
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  -- Analytics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_banner_requests_advertiser ON public.banner_requests(advertiser_id);
CREATE INDEX idx_banner_requests_slot ON public.banner_requests(slot_id);
CREATE INDEX idx_banner_requests_status ON public.banner_requests(status);
CREATE INDEX idx_banner_requests_dates ON public.banner_requests(start_date, end_date);

-- =====================================================
-- 6. PAYMENTS TABLE
-- =====================================================

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  banner_request_id UUID REFERENCES public.banner_requests(id) ON DELETE SET NULL,
  
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'MAD',
  
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'cash', 'check', 'mobile_payment')),
  payment_reference TEXT,
  receipt_url TEXT,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'refunded')),
  
  confirmed_by UUID REFERENCES public.profiles(id),
  confirmed_at TIMESTAMPTZ,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- =====================================================
-- 7. SITE SETTINGS TABLE
-- =====================================================

CREATE TABLE public.site_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  value_type TEXT DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'json', 'html')),
  category TEXT DEFAULT 'general',
  description_fr TEXT,
  description_ar TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_site_settings_category ON public.site_settings(category);
CREATE INDEX idx_site_settings_public ON public.site_settings(is_public);

-- =====================================================
-- 8. USER CREATION TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, user_role)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_role', 'real_estate_advertiser')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 9. HELPER FUNCTIONS
-- =====================================================

-- Check if user has specific role(s)
CREATE OR REPLACE FUNCTION public.check_user_role(user_id UUID, allowed_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND user_role = ANY(allowed_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND user_role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. SEED DATA - MOROCCAN CITIES
-- =====================================================

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order) VALUES
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
  ('Témara', 'تمارة', 'Rabat-Salé-Kénitra', 'الرباط-سلا-القنيطرة', 12),
  ('El Jadida', 'الجديدة', 'Casablanca-Settat', 'الدار البيضاء-سطات', 13),
  ('Mohammedia', 'المحمدية', 'Casablanca-Settat', 'الدار البيضاء-سطات', 14),
  ('Béni Mellal', 'بني ملال', 'Béni Mellal-Khénifra', 'بني ملال-خنيفرة', 15),
  ('Nador', 'الناظور', 'Oriental', 'الشرق', 16),
  ('Khouribga', 'خريبكة', 'Béni Mellal-Khénifra', 'بني ملال-خنيفرة', 17),
  ('Settat', 'سطات', 'Casablanca-Settat', 'الدار البيضاء-سطات', 18),
  ('Safi', 'آسفي', 'Marrakech-Safi', 'مراكش-آسفي', 19),
  ('Errachidia', 'الراشيدية', 'Drâa-Tafilalet', 'درعة-تافيلالت', 20);

-- =====================================================
-- 11. SEED DATA - PROPERTY TYPES
-- =====================================================

INSERT INTO public.property_types (code, name_fr, name_ar, icon, display_order) VALUES
  ('apartment', 'Appartement', 'شقة', 'Building', 1),
  ('house', 'Maison', 'منزل', 'Home', 2),
  ('villa', 'Villa', 'فيلا', 'Castle', 3),
  ('commercial', 'Local Commercial', 'محل تجاري', 'Store', 4),
  ('land', 'Terrain', 'أرض', 'Map', 5);

-- =====================================================
-- 12. SEED DATA - NEIGHBORHOODS (Major cities)
-- =====================================================

INSERT INTO public.neighborhoods (city_id, name_fr, name_ar) VALUES
  -- Casablanca
  (1, 'Maârif', 'المعاريف'),
  (1, 'Anfa', 'أنفا'),
  (1, 'Bourgogne', 'بورغون'),
  (1, 'Aïn Diab', 'عين الذياب'),
  (1, 'Sidi Maarouf', 'سيدي معروف'),
  (1, 'Hay Hassani', 'الحي الحسني'),
  (1, 'Gauthier', 'غوتيي'),
  (1, '2 Mars', '2 مارس'),
  -- Rabat
  (2, 'Agdal', 'أكدال'),
  (2, 'Hassan', 'حسان'),
  (2, 'Hay Riad', 'حي الرياض'),
  (2, 'Souissi', 'سويسي'),
  (2, 'Océan', 'أوسيان'),
  -- Marrakech
  (3, 'Guéliz', 'جليز'),
  (3, 'Hivernage', 'هيفرناج'),
  (3, 'Médina', 'المدينة'),
  (3, 'Palmeraie', 'النخيل'),
  (3, 'Targa', 'تارگا'),
  -- Tanger
  (5, 'Malabata', 'مالاباطا'),
  (5, 'Iberia', 'إيبيريا'),
  (5, 'Centre Ville', 'وسط المدينة'),
  (5, 'Marchane', 'مرشان'),
  -- Agadir
  (6, 'Talborjt', 'تالبرجت'),
  (6, 'Hay Mohammadi', 'حي محمدي'),
  (6, 'Dakhla', 'الداخلة');

-- =====================================================
-- 13. SEED DATA - BANNER SLOTS
-- =====================================================

INSERT INTO public.banner_slots (code, name_fr, name_ar, page, position, size, price_per_day, price_per_week, price_per_month) VALUES
  ('home_hero', 'Bannière Hero Accueil', 'بانر البطل الرئيسي', 'home', 'hero', '1200x400', 500.00, 2500.00, 8000.00),
  ('home_middle', 'Bannière Milieu Accueil', 'بانر وسط الصفحة الرئيسية', 'home', 'middle', '728x90', 300.00, 1500.00, 5000.00),
  ('home_sidebar', 'Bannière Sidebar Accueil', 'بانر الجانب الرئيسي', 'home', 'sidebar', '300x250', 200.00, 1000.00, 3500.00),
  ('search_top', 'Bannière Haut Recherche', 'بانر أعلى البحث', 'search', 'top', '728x90', 350.00, 1750.00, 6000.00),
  ('search_sidebar', 'Bannière Sidebar Recherche', 'بانر جانب البحث', 'search', 'sidebar', '300x600', 250.00, 1250.00, 4500.00),
  ('property_bottom', 'Bannière Bas Propriété', 'بانر أسفل العقار', 'property', 'bottom', '728x90', 400.00, 2000.00, 7000.00);

-- =====================================================
-- 14. SEED DATA - SITE SETTINGS
-- =====================================================

INSERT INTO public.site_settings (key, value, value_type, category, is_public, description_fr, description_ar) VALUES
  ('site_name', '"TopAffaireImmo"', 'string', 'general', true, 'Nom du site', 'اسم الموقع'),
  ('site_description_fr', '"Votre portail immobilier au Maroc"', 'string', 'general', true, 'Description du site (FR)', 'وصف الموقع (فرنسي)'),
  ('site_description_ar', '"بوابتك العقارية في المغرب"', 'string', 'general', true, 'Description du site (AR)', 'وصف الموقع (عربي)'),
  ('contact_email', '"contact@topaffaireimmo.com"', 'string', 'contact', true, 'Email de contact', 'البريد الإلكتروني للتواصل'),
  ('contact_phone', '"+212 5XX XX XX XX"', 'string', 'contact', true, 'Téléphone de contact', 'هاتف التواصل'),
  ('whatsapp_number', '"+212 6XX XX XX XX"', 'string', 'contact', true, 'Numéro WhatsApp', 'رقم واتساب'),
  ('facebook_url', '""', 'string', 'social', true, 'URL Facebook', 'رابط فيسبوك'),
  ('instagram_url', '""', 'string', 'social', true, 'URL Instagram', 'رابط إنستغرام'),
  ('youtube_url', '""', 'string', 'social', true, 'URL YouTube', 'رابط يوتيوب'),
  ('max_images_per_property', '10', 'number', 'limits', false, 'Nombre max d''images par propriété', 'الحد الأقصى للصور لكل عقار'),
  ('property_auto_approve', 'false', 'boolean', 'moderation', false, 'Approbation auto des propriétés', 'الموافقة التلقائية على العقارات'),
  ('banner_auto_approve', 'false', 'boolean', 'moderation', false, 'Approbation auto des bannières', 'الموافقة التلقائية على البانرات');

-- =====================================================
-- 15. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 16. RLS POLICIES - PROFILES
-- =====================================================

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() OR 
    public.is_admin(auth.uid()) OR
    (user_role = 'real_estate_advertiser' AND advertiser_type = 'agency')
  );

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (
    id = auth.uid() OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- =====================================================
-- 17. RLS POLICIES - PROPERTIES (Real Estate - FREE)
-- =====================================================

DROP POLICY IF EXISTS "properties_select_public" ON public.properties;
CREATE POLICY "properties_select_public" ON public.properties
  FOR SELECT USING (
    status = 'approved' OR 
    owner_id = auth.uid() OR 
    public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "properties_insert_real_estate" ON public.properties;
CREATE POLICY "properties_insert_real_estate" ON public.properties
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    owner_id = auth.uid() AND
    public.check_user_role(auth.uid(), ARRAY['real_estate_advertiser', 'admin'])
  );

DROP POLICY IF EXISTS "properties_update_own" ON public.properties;
CREATE POLICY "properties_update_own" ON public.properties
  FOR UPDATE USING (
    owner_id = auth.uid() OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "properties_delete_own" ON public.properties;
CREATE POLICY "properties_delete_own" ON public.properties
  FOR DELETE USING (
    owner_id = auth.uid() OR public.is_admin(auth.uid())
  );

-- =====================================================
-- 18. RLS POLICIES - PROPERTY IMAGES
-- =====================================================

DROP POLICY IF EXISTS "property_images_select" ON public.property_images;
CREATE POLICY "property_images_select" ON public.property_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p 
      WHERE p.id = property_id 
      AND (p.status = 'approved' OR p.owner_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "property_images_insert" ON public.property_images;
CREATE POLICY "property_images_insert" ON public.property_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p 
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "property_images_delete" ON public.property_images;
CREATE POLICY "property_images_delete" ON public.property_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.properties p 
      WHERE p.id = property_id 
      AND (p.owner_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

-- =====================================================
-- 19. RLS POLICIES - BANNER REQUESTS (Commercial Only)
-- =====================================================

DROP POLICY IF EXISTS "banner_requests_select" ON public.banner_requests;
CREATE POLICY "banner_requests_select" ON public.banner_requests
  FOR SELECT USING (
    advertiser_id = auth.uid() OR 
    public.is_admin(auth.uid()) OR
    status = 'active'
  );

DROP POLICY IF EXISTS "banner_requests_insert_commercial" ON public.banner_requests;
CREATE POLICY "banner_requests_insert_commercial" ON public.banner_requests
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    advertiser_id = auth.uid() AND
    public.check_user_role(auth.uid(), ARRAY['commercial_advertiser', 'admin'])
  );

DROP POLICY IF EXISTS "banner_requests_update" ON public.banner_requests;
CREATE POLICY "banner_requests_update" ON public.banner_requests
  FOR UPDATE USING (
    (advertiser_id = auth.uid() AND status = 'pending') OR 
    public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "banner_requests_delete" ON public.banner_requests;
CREATE POLICY "banner_requests_delete" ON public.banner_requests
  FOR DELETE USING (
    (advertiser_id = auth.uid() AND status = 'pending') OR 
    public.is_admin(auth.uid())
  );

-- =====================================================
-- 20. RLS POLICIES - PAYMENTS
-- =====================================================

DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "payments_insert_own" ON public.payments;
CREATE POLICY "payments_insert_own" ON public.payments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "payments_update_admin" ON public.payments;
CREATE POLICY "payments_update_admin" ON public.payments
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- =====================================================
-- 21. RLS POLICIES - REFERENCE DATA (Public Read)
-- =====================================================

DROP POLICY IF EXISTS "cities_select_all" ON public.cities;
CREATE POLICY "cities_select_all" ON public.cities
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "cities_admin_all" ON public.cities;
CREATE POLICY "cities_admin_all" ON public.cities
  FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "neighborhoods_select_all" ON public.neighborhoods;
CREATE POLICY "neighborhoods_select_all" ON public.neighborhoods
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "neighborhoods_insert_auth" ON public.neighborhoods;
CREATE POLICY "neighborhoods_insert_auth" ON public.neighborhoods
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "property_types_select_all" ON public.property_types;
CREATE POLICY "property_types_select_all" ON public.property_types
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "property_types_admin_all" ON public.property_types;
CREATE POLICY "property_types_admin_all" ON public.property_types
  FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "banner_slots_select_all" ON public.banner_slots;
CREATE POLICY "banner_slots_select_all" ON public.banner_slots
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "banner_slots_admin_all" ON public.banner_slots;
CREATE POLICY "banner_slots_admin_all" ON public.banner_slots
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- 22. RLS POLICIES - SITE SETTINGS
-- =====================================================

DROP POLICY IF EXISTS "site_settings_select_public" ON public.site_settings;
CREATE POLICY "site_settings_select_public" ON public.site_settings
  FOR SELECT USING (is_public = true OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "site_settings_admin_all" ON public.site_settings;
CREATE POLICY "site_settings_admin_all" ON public.site_settings
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- 23. ENABLE REALTIME FOR KEY TABLES
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;
ALTER PUBLICATION supabase_realtime ADD TABLE public.banner_requests;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
