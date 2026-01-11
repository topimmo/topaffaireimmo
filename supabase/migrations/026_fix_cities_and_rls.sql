-- =====================================================
-- FIX: Ensure cities table has data and is accessible
-- =====================================================

-- First, ensure the cities table has the correct is_active setting
UPDATE public.cities SET is_active = true WHERE is_active IS NULL;

-- Verify cities have data by re-inserting if empty
INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Casablanca', 'الدار البيضاء', 'Casablanca-Settat', 'الدار البيضاء-سطات', 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Casablanca');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Rabat', 'الرباط', 'Rabat-Salé-Kénitra', 'الرباط-سلا-القنيطرة', 2, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Rabat');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Marrakech', 'مراكش', 'Marrakech-Safi', 'مراكش-آسفي', 3, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Marrakech');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Fès', 'فاس', 'Fès-Meknès', 'فاس-مكناس', 4, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Fès');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Tanger', 'طنجة', 'Tanger-Tétouan-Al Hoceïma', 'طنجة-تطوان-الحسيمة', 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Tanger');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Agadir', 'أكادير', 'Souss-Massa', 'سوس-ماسة', 6, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Agadir');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Meknès', 'مكناس', 'Fès-Meknès', 'فاس-مكناس', 7, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Meknès');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Oujda', 'وجدة', 'Oriental', 'الشرقية', 8, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Oujda');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Kenitra', 'القنيطرة', 'Rabat-Salé-Kénitra', 'الرباط-سلا-القنيطرة', 9, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Kenitra');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Tétouan', 'تطوان', 'Tanger-Tétouan-Al Hoceïma', 'طنجة-تطوان-الحسيمة', 10, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Tétouan');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Salé', 'سلا', 'Rabat-Salé-Kénitra', 'الرباط-سلا-القنيطرة', 11, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Salé');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Nador', 'الناظور', 'Oriental', 'الشرقية', 12, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Nador');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Mohammedia', 'المحمدية', 'Casablanca-Settat', 'الدار البيضاء-سطات', 13, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Mohammedia');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'El Jadida', 'الجديدة', 'Casablanca-Settat', 'الدار البيضاء-سطات', 14, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'El Jadida');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Béni Mellal', 'بني ملال', 'Béni Mellal-Khénifra', 'بني ملال-خنيفرة', 15, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Béni Mellal');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Khouribga', 'خريبكة', 'Béni Mellal-Khénifra', 'بني ملال-خنيفرة', 16, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Khouribga');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Settat', 'سطات', 'Casablanca-Settat', 'الدار البيضاء-سطات', 17, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Settat');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Safi', 'آسفي', 'Marrakech-Safi', 'مراكش-آسفي', 18, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Safi');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Essaouira', 'الصويرة', 'Marrakech-Safi', 'مراكش-آسفي', 19, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Essaouira');

INSERT INTO public.cities (name_fr, name_ar, region_fr, region_ar, display_order, is_active)
SELECT 'Errachidia', 'الراشيدية', 'Drâa-Tafilalet', 'درعة-تافيلالت', 20, true
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE name_fr = 'Errachidia');

-- Grant public SELECT on cities for anonymous access
DROP POLICY IF EXISTS "Cities are viewable by everyone" ON public.cities;
CREATE POLICY "Cities are viewable by everyone" ON public.cities
  FOR SELECT USING (true);

-- Grant public SELECT on property_types for anonymous access
DROP POLICY IF EXISTS "Property types are viewable by everyone" ON public.property_types;
CREATE POLICY "Property types are viewable by everyone" ON public.property_types
  FOR SELECT USING (true);

-- Grant public SELECT on neighborhoods for anonymous access
DROP POLICY IF EXISTS "Neighborhoods are viewable by everyone" ON public.neighborhoods;
CREATE POLICY "Neighborhoods are viewable by everyone" ON public.neighborhoods
  FOR SELECT USING (true);
