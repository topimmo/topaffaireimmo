DROP TABLE IF EXISTS public.properties CASCADE;
DROP TABLE IF EXISTS public.neighborhoods CASCADE;
DROP TABLE IF EXISTS public.cities CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  user_type TEXT DEFAULT 'advertiser' CHECK (user_type IN ('advertiser', 'agency')),
  agency_name TEXT,
  agency_logo TEXT,
  agency_description_fr TEXT,
  agency_description_ar TEXT,
  agency_cities TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.cities (
  id SERIAL PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.neighborhoods (
  id SERIAL PRIMARY KEY,
  city_id INTEGER NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'rent')),
  property_type TEXT NOT NULL CHECK (property_type IN ('apartment', 'house', 'villa', 'commercial', 'land')),
  city_id INTEGER NOT NULL REFERENCES public.cities(id),
  neighborhood_id INTEGER REFERENCES public.neighborhoods(id),
  custom_neighborhood TEXT,
  address TEXT,
  price DECIMAL(15,2) NOT NULL,
  area DECIMAL(10,2),
  bedrooms INTEGER,
  bathrooms INTEGER,
  title_en TEXT NOT NULL,
  title_fr TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_en TEXT,
  description_fr TEXT,
  description_ar TEXT,
  images TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'inactive')),
  featured BOOLEAN DEFAULT FALSE,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.cities (name_en, name_fr, name_ar) VALUES
  ('Casablanca', 'Casablanca', 'الدار البيضاء'),
  ('Rabat', 'Rabat', 'الرباط'),
  ('Marrakech', 'Marrakech', 'مراكش'),
  ('Fes', 'Fès', 'فاس'),
  ('Tangier', 'Tanger', 'طنجة'),
  ('Agadir', 'Agadir', 'أكادير'),
  ('Meknes', 'Meknès', 'مكناس'),
  ('Oujda', 'Oujda', 'وجدة');

INSERT INTO public.neighborhoods (city_id, name_en, name_fr, name_ar) VALUES
  (1, 'Maarif', 'Maârif', 'المعاريف'),
  (1, 'Anfa', 'Anfa', 'أنفا'),
  (1, 'Bourgogne', 'Bourgogne', 'بورغوان'),
  (1, 'Ain Diab', 'Aïn Diab', 'عين الذياب'),
  (1, 'Sidi Maarouf', 'Sidi Maarouf', 'سيدي معروف'),
  (1, 'Hay Hassani', 'Hay Hassani', 'الحي الحسني'),
  (2, 'Agdal', 'Agdal', 'أكدال'),
  (2, 'Hassan', 'Hassan', 'حسان'),
  (2, 'Hay Riad', 'Hay Riad', 'حي الرياض'),
  (2, 'Souissi', 'Souissi', 'سويسي'),
  (3, 'Gueliz', 'Guéliz', 'جليز'),
  (3, 'Hivernage', 'Hivernage', 'حي الشتاء'),
  (3, 'Medina', 'Médina', 'المدينة القديمة'),
  (3, 'Palmeraie', 'Palmeraie', 'النخيل'),
  (4, 'Ville Nouvelle', 'Ville Nouvelle', 'المدينة الجديدة'),
  (4, 'Medina', 'Médina', 'المدينة القديمة'),
  (5, 'Malabata', 'Malabata', 'مالاباطا'),
  (5, 'Iberia', 'Ibéria', 'إيبيريا'),
  (5, 'Centre Ville', 'Centre Ville', 'وسط المدينة'),
  (6, 'Talborjt', 'Talborjt', 'تالبرجت'),
  (6, 'Hay Mohammadi', 'Hay Mohammadi', 'حي محمدي'),
  (7, 'Hamria', 'Hamria', 'الحمرية'),
  (7, 'Belle Vue', 'Belle Vue', 'بيل فو'),
  (8, 'Centre Ville', 'Centre Ville', 'وسط المدينة'),
  (8, 'Hay Salam', 'Hay Salam', 'حي السلام');

CREATE INDEX idx_properties_owner ON public.properties(owner_id);
CREATE INDEX idx_properties_city ON public.properties(city_id);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_neighborhoods_city ON public.neighborhoods(city_id);
