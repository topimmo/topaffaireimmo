DROP TABLE IF EXISTS public.banner_requests CASCADE;
DROP TABLE IF EXISTS public.banner_slots CASCADE;

CREATE TABLE public.banner_slots (
  id SERIAL PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  page TEXT NOT NULL,
  position TEXT NOT NULL,
  size TEXT NOT NULL,
  description_en TEXT,
  description_fr TEXT,
  description_ar TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.banner_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slot_id INTEGER NOT NULL REFERENCES public.banner_slots(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  duration_days INTEGER NOT NULL CHECK (duration_days IN (7, 15, 30)),
  price DECIMAL(10,2) NOT NULL,
  banner_image_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  payment_proof_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'rejected', 'expired')),
  approved_at TIMESTAMP WITH TIME ZONE,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.banner_slots (name_en, name_fr, name_ar, page, position, size, description_en, description_fr, description_ar) VALUES
  ('Home Page Top Banner', 'Bannière Haut Page d''Accueil', 'بانر أعلى الصفحة الرئيسية', 'home', 'after_hero', '728x90', 'Premium banner displayed after hero section on homepage', 'Bannière premium affichée après la section héro sur la page d''accueil', 'بانر مميز يظهر بعد قسم البطل في الصفحة الرئيسية'),
  ('Home Page Middle Banner', 'Bannière Milieu Page d''Accueil', 'بانر وسط الصفحة الرئيسية', 'home', 'after_featured', '728x90', 'Banner displayed between Featured Properties and Latest Listings', 'Bannière affichée entre les propriétés en vedette et les dernières annonces', 'بانر يظهر بين العقارات المميزة وأحدث الإعلانات'),
  ('Home Page Bottom Banner', 'Bannière Bas Page d''Accueil', 'بانر أسفل الصفحة الرئيسية', 'home', 'before_footer', '728x90', 'Banner displayed before footer on homepage', 'Bannière affichée avant le pied de page sur la page d''accueil', 'بانر يظهر قبل تذييل الصفحة الرئيسية'),
  ('Search Results Top Banner', 'Bannière Haut Résultats', 'بانر أعلى نتائج البحث', 'search', 'top', '728x90', 'Banner at top of search results page', 'Bannière en haut de la page des résultats de recherche', 'بانر في أعلى صفحة نتائج البحث'),
  ('Search Results Middle Banner', 'Bannière Milieu Résultats', 'بانر وسط نتائج البحث', 'search', 'middle', '300x250', 'Banner in the middle of search results', 'Bannière au milieu des résultats de recherche', 'بانر في منتصف نتائج البحث'),
  ('Property Details Sidebar', 'Bannière Latérale Détails', 'بانر جانبي تفاصيل العقار', 'property_details', 'sidebar', '300x250', 'Sidebar banner on property details page', 'Bannière latérale sur la page des détails de la propriété', 'بانر جانبي في صفحة تفاصيل العقار'),
  ('Property Details Bottom', 'Bannière Bas Détails', 'بانر أسفل تفاصيل العقار', 'property_details', 'bottom', '728x90', 'Banner at bottom of property details', 'Bannière en bas des détails de la propriété', 'بانر في أسفل تفاصيل العقار');

CREATE INDEX idx_banner_requests_advertiser ON public.banner_requests(advertiser_id);
CREATE INDEX idx_banner_requests_slot ON public.banner_requests(slot_id);
CREATE INDEX idx_banner_requests_status ON public.banner_requests(status);
CREATE INDEX idx_banner_requests_dates ON public.banner_requests(start_date, end_date);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
