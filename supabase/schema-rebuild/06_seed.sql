-- =====================================================
-- 06_seed.sql - Seed Reference Data
-- =====================================================
-- Seeds Moroccan cities, neighborhoods, service categories,
-- and platform settings
-- =====================================================

-- =====================================================
-- SEED MOROCCAN CITIES
-- =====================================================

INSERT INTO public.cities (name_en, name_fr, name_ar) VALUES
  ('Casablanca', 'Casablanca', 'الدار البيضاء'),
  ('Rabat', 'Rabat', 'الرباط'),
  ('Marrakech', 'Marrakech', 'مراكش'),
  ('Fes', 'Fès', 'فاس'),
  ('Tangier', 'Tanger', 'طنجة'),
  ('Agadir', 'Agadir', 'أكادير'),
  ('Meknes', 'Meknès', 'مكناس'),
  ('Oujda', 'Oujda', 'وجدة'),
  ('Kenitra', 'Kénitra', 'القنيطرة'),
  ('Tetouan', 'Tétouan', 'تطوان'),
  ('Safi', 'Safi', 'آسفي'),
  ('Mohammedia', 'Mohammedia', 'المحمدية'),
  ('Khouribga', 'Khouribga', 'خريبكة'),
  ('El Jadida', 'El Jadida', 'الجديدة'),
  ('Beni Mellal', 'Béni Mellal', 'بني ملال'),
  ('Nador', 'Nador', 'الناظور'),
  ('Taza', 'Taza', 'تازة'),
  ('Settat', 'Settat', 'سطات')
ON CONFLICT DO NOTHING;

-- =====================================================
-- SEED NEIGHBORHOODS BY CITY
-- =====================================================

-- Casablanca neighborhoods
INSERT INTO public.neighborhoods (city_id, name_en, name_fr, name_ar, slug) VALUES
  (1, 'Maarif', 'Maârif', 'المعاريف', 'maarif'),
  (1, 'Anfa', 'Anfa', 'أنفا', 'anfa'),
  (1, 'Bourgogne', 'Bourgogne', 'بورغوان', 'bourgogne'),
  (1, 'Ain Diab', 'Aïn Diab', 'عين الذياب', 'ain-diab'),
  (1, 'Sidi Maarouf', 'Sidi Maarouf', 'سيدي معروف', 'sidi-maarouf'),
  (1, 'Hay Hassani', 'Hay Hassani', 'الحي الحسني', 'hay-hassani'),
  (1, 'California', 'California', 'كاليفورنيا', 'california'),
  (1, 'Gauthier', 'Gauthier', 'غوتييه', 'gauthier'),
  (1, 'Racine', 'Racine', 'راسين', 'racine'),
  (1, 'Ain Sebaa', 'Aïn Sebaâ', 'عين السبع', 'ain-sebaa'),
  (1, 'Bouskoura', 'Bouskoura', 'بوسكورة', 'bouskoura'),
  (1, 'Sidi Bernoussi', 'Sidi Bernoussi', 'سيدي برنوصي', 'sidi-bernoussi')
ON CONFLICT DO NOTHING;

-- Rabat neighborhoods
INSERT INTO public.neighborhoods (city_id, name_en, name_fr, name_ar, slug) VALUES
  (2, 'Agdal', 'Agdal', 'أكدال', 'agdal'),
  (2, 'Hassan', 'Hassan', 'حسان', 'hassan'),
  (2, 'Hay Riad', 'Hay Riad', 'حي الرياض', 'hay-riad'),
  (2, 'Souissi', 'Souissi', 'سويسي', 'souissi'),
  (2, 'Ocean', 'Océan', 'المحيط', 'ocean'),
  (2, 'Medina', 'Médina', 'المدينة القديمة', 'medina-rabat'),
  (2, 'Aviation', 'Aviation', 'الطيران', 'aviation'),
  (2, 'Hay Nahda', 'Hay Nahda', 'حي النهضة', 'hay-nahda'),
  (2, 'Temara', 'Témara', 'تمارة', 'temara'),
  (2, 'Sale', 'Salé', 'سلا', 'sale')
ON CONFLICT DO NOTHING;

-- Marrakech neighborhoods
INSERT INTO public.neighborhoods (city_id, name_en, name_fr, name_ar, slug) VALUES
  (3, 'Gueliz', 'Guéliz', 'جليز', 'gueliz'),
  (3, 'Hivernage', 'Hivernage', 'حي الشتاء', 'hivernage'),
  (3, 'Medina', 'Médina', 'المدينة القديمة', 'medina-marrakech'),
  (3, 'Palmeraie', 'Palmeraie', 'النخيل', 'palmeraie'),
  (3, 'Massira', 'Massira', 'المسيرة', 'massira'),
  (3, 'Targa', 'Targa', 'تارڭا', 'targa'),
  (3, 'Menara', 'Ménara', 'المنارة', 'menara'),
  (3, 'Daoudiate', 'Daoudiate', 'الداوديات', 'daoudiate'),
  (3, 'Route de Fes', 'Route de Fès', 'طريق فاس', 'route-de-fes'),
  (3, 'Route de Safi', 'Route de Safi', 'طريق آسفي', 'route-de-safi')
ON CONFLICT DO NOTHING;

-- Fes neighborhoods
INSERT INTO public.neighborhoods (city_id, name_en, name_fr, name_ar, slug) VALUES
  (4, 'Ville Nouvelle', 'Ville Nouvelle', 'المدينة الجديدة', 'ville-nouvelle-fes'),
  (4, 'Medina', 'Médina', 'المدينة القديمة', 'medina-fes'),
  (4, 'Fes Jdid', 'Fès Jdid', 'فاس الجديد', 'fes-jdid'),
  (4, 'Narjiss', 'Narjiss', 'النرجس', 'narjiss'),
  (4, 'Atlas', 'Atlas', 'أطلس', 'atlas-fes'),
  (4, 'Saiss', 'Saïss', 'سايس', 'saiss'),
  (4, 'Bensouda', 'Bensouda', 'بنسودة', 'bensouda'),
  (4, 'Zouagha', 'Zouagha', 'الزواغة', 'zouagha')
ON CONFLICT DO NOTHING;

-- Tangier neighborhoods
INSERT INTO public.neighborhoods (city_id, name_en, name_fr, name_ar, slug) VALUES
  (5, 'Malabata', 'Malabata', 'مالاباطا', 'malabata'),
  (5, 'Iberia', 'Ibéria', 'إيبيريا', 'iberia'),
  (5, 'Centre Ville', 'Centre Ville', 'وسط المدينة', 'centre-ville-tangier'),
  (5, 'Medina', 'Médina', 'المدينة القديمة', 'medina-tangier'),
  (5, 'Boubana', 'Boubana', 'بوبانا', 'boubana'),
  (5, 'California', 'California', 'كاليفورنيا', 'california-tangier'),
  (5, 'Tanja Balia', 'Tanja Balia', 'طنجة البالية', 'tanja-balia'),
  (5, 'Marchane', 'Marchane', 'مرشان', 'marchane')
ON CONFLICT DO NOTHING;

-- Agadir neighborhoods
INSERT INTO public.neighborhoods (city_id, name_en, name_fr, name_ar, slug) VALUES
  (6, 'Talborjt', 'Talborjt', 'تالبرجت', 'talborjt'),
  (6, 'Hay Mohammadi', 'Hay Mohammadi', 'حي محمدي', 'hay-mohammadi-agadir'),
  (6, 'Secteur Touristique', 'Secteur Touristique', 'القطاع السياحي', 'secteur-touristique'),
  (6, 'Founty', 'Founty', 'فونتي', 'founty'),
  (6, 'Anza', 'Anza', 'أنزا', 'anza'),
  (6, 'Nouveau Talborjt', 'Nouveau Talborjt', 'تالبرجت الجديد', 'nouveau-talborjt'),
  (6, 'Tilila', 'Tilila', 'تيليلا', 'tilila'),
  (6, 'Dakhla', 'Dakhla', 'الداخلة', 'dakhla-agadir')
ON CONFLICT DO NOTHING;

-- Meknes neighborhoods
INSERT INTO public.neighborhoods (city_id, name_en, name_fr, name_ar, slug) VALUES
  (7, 'Hamria', 'Hamria', 'الحمرية', 'hamria'),
  (7, 'Belle Vue', 'Belle Vue', 'بيل فو', 'belle-vue'),
  (7, 'Medina', 'Médina', 'المدينة القديمة', 'medina-meknes'),
  (7, 'Ville Nouvelle', 'Ville Nouvelle', 'المدينة الجديدة', 'ville-nouvelle-meknes'),
  (7, 'Al Bassatine', 'Al Bassatine', 'البساتين', 'al-bassatine'),
  (7, 'Zitoune', 'Zitoune', 'الزيتون', 'zitoune'),
  (7, 'Toulal', 'Toulal', 'التولال', 'toulal'),
  (7, 'Riad', 'Riad', 'الرياض', 'riad-meknes')
ON CONFLICT DO NOTHING;

-- Oujda neighborhoods
INSERT INTO public.neighborhoods (city_id, name_en, name_fr, name_ar, slug) VALUES
  (8, 'Centre Ville', 'Centre Ville', 'وسط المدينة', 'centre-ville-oujda'),
  (8, 'Hay Salam', 'Hay Salam', 'حي السلام', 'hay-salam'),
  (8, 'Lazaret', 'Lazaret', 'لازاريت', 'lazaret'),
  (8, 'Medina', 'Médina', 'المدينة القديمة', 'medina-oujda'),
  (8, 'Hay Al Qods', 'Hay Al Qods', 'حي القدس', 'hay-al-qods'),
  (8, 'Hay Mohammadi', 'Hay Mohammadi', 'حي محمدي', 'hay-mohammadi-oujda')
ON CONFLICT DO NOTHING;

-- =====================================================
-- SEED SERVICE CATEGORIES
-- =====================================================

INSERT INTO public.service_categories (slug, name_fr, name_ar, description_fr, description_ar, icon, sort_order, is_active)
VALUES
  ('plomberie', 'Plomberie', 'السباكة', 
   'Installation et réparation de plomberie, robinetterie, sanitaires', 
   'التركيب والصيانة في السباكة، الحنفيات، المعدات الصحية', 
   'wrench', 1, TRUE),
  
  ('electricite', 'Électricité', 'الكهرباء', 
   'Dépannage électrique, installations, tableaux électriques', 
   'إصلاح الكهرباء، التركيبات، اللوحات الكهربائية', 
   'zap', 2, TRUE),
  
  ('climatisation', 'Climatisation', 'التكييف', 
   'Installation et entretien de climatisation et chauffage', 
   'تركيب وصيانة أجهزة التكييف والتدفئة', 
   'wind', 3, TRUE),
  
  ('peinture', 'Peinture', 'الطلاء', 
   'Peinture intérieure et extérieure, décoration murale', 
   'أعمال الطلاء الداخلية والخارجية، الديكور الجداري', 
   'paint-roller', 4, TRUE),
  
  ('nettoyage', 'Nettoyage', 'التنظيف', 
   'Nettoyage ménager, professionnel et après travaux', 
   'خدمات التنظيف المنزلي، المهني وبعد الأشغال', 
   'sparkles', 5, TRUE),
  
  ('jardinage', 'Jardinage', 'البستنة', 
   'Entretien des jardins, taille, aménagement paysager', 
   'العناية بالحدائق، التقليم، تنسيق المساحات الخضراء', 
   'leaf', 6, TRUE),
  
  ('menuiserie', 'Menuiserie', 'النجارة', 
   'Fabrication et réparation de meubles, portes, fenêtres', 
   'صناعة وإصلاح الأثاث، الأبواب، النوافذ', 
   'hammer', 7, TRUE),
  
  ('serrurerie', 'Serrurerie', 'الحدادة', 
   'Dépannage serrures, portes blindées, grilles', 
   'إصلاح الأقفال، الأبواب المصفحة، الشبابيك الحديدية', 
   'key', 8, TRUE),
  
  ('maconnerie', 'Maçonnerie', 'البناء', 
   'Travaux de maçonnerie, rénovation, construction', 
   'أعمال البناء، الترميم، الإنشاءات', 
   'building', 9, TRUE),
  
  ('carrelage', 'Carrelage', 'البلاط', 
   'Pose de carrelage, faïence, revêtements de sol', 
   'تركيب البلاط، الزليج، تغطية الأرضيات', 
   'grid', 10, TRUE),
  
  ('demenagement', 'Déménagement', 'نقل الأثاث', 
   'Services de déménagement résidentiel et commercial', 
   'خدمات نقل الأثاث السكني والتجاري', 
   'truck', 11, TRUE),
  
  ('depannage', 'Dépannage', 'الإصلاح السريع', 
   'Dépannages urgents tous corps de métier', 
   'الإصلاحات العاجلة لجميع الخدمات', 
   'tool', 12, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- SEED PLATFORM SETTINGS
-- =====================================================

INSERT INTO public.platform_settings (key, value)
VALUES (
  'monetization',
  jsonb_build_object(
    'monetization_enabled', false,
    'pay_per_contact_enabled', false,
    'pay_to_be_visible_enabled', false,
    'contact_reveal_fee_mad', 5,
    'artisan_min_wallet_mad', 50,
    'contact_pass_duration_hours', 12,
    'free_contact_reveals_per_day', 3,
    'boost_plans_enabled', false
  )
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- =====================================================
-- SEED BOOST PLANS (Initially inactive)
-- =====================================================

INSERT INTO public.boost_plans (name, description, price, duration_days, features, display_order, is_active)
VALUES 
  (
    'Boost Basique',
    'Mettez en avant votre bien pendant 7 jours',
    99.00,
    7,
    '["Badge Mis en Avant", "Priorité dans les résultats", "Visibilité x2"]'::jsonb,
    1,
    FALSE
  ),
  (
    'Boost Premium',
    'Visibilité maximale pendant 14 jours',
    179.00,
    14,
    '["Badge Mis en Avant", "Priorité dans les résultats", "Top de catégorie", "Visibilité x4", "Promotion réseaux sociaux"]'::jsonb,
    2,
    FALSE
  ),
  (
    'Boost Ultimate',
    'Exposition premium pendant 30 jours',
    299.00,
    30,
    '["Badge Mis en Avant", "Priorité dans les résultats", "Top de catégorie", "Page d''accueil", "Visibilité x6", "Promotion réseaux sociaux", "Newsletter"]'::jsonb,
    3,
    FALSE
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- SEED ALERT CONFIGURATIONS
-- =====================================================

INSERT INTO public.alert_configurations (alert_type, threshold, time_window_minutes, notification_emails, metadata, is_active)
VALUES 
  ('error_spike', 50, 5, ARRAY[]::TEXT[], '{"description": "Alert when error rate is high"}'::jsonb, TRUE),
  ('db_latency', 10, 5, ARRAY[]::TEXT[], '{"description": "Alert when database performance degrades"}'::jsonb, TRUE),
  ('storage_failure', 5, 5, ARRAY[]::TEXT[], '{"description": "Alert when storage operations fail"}'::jsonb, TRUE)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SEED SITE CATEGORIES
-- =====================================================

INSERT INTO public.site_categories (name_fr, name_ar, slug, sort_order)
VALUES
  ('Guide d''Achat', 'دليل الشراء', 'guide-achat', 1),
  ('Guide de Location', 'دليل الإيجار', 'guide-location', 2),
  ('Conseils Juridiques', 'نصائح قانونية', 'conseils-juridiques', 3),
  ('Financement', 'التمويل', 'financement', 4),
  ('Décoration', 'الديكور', 'decoration', 5),
  ('Rénovation', 'الترميم', 'renovation', 6)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- END OF SEED DATA
-- =====================================================

-- Summary of what was seeded
DO $$
DECLARE
  city_count INTEGER;
  neighborhood_count INTEGER;
  category_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO city_count FROM public.cities;
  SELECT COUNT(*) INTO neighborhood_count FROM public.neighborhoods;
  SELECT COUNT(*) INTO category_count FROM public.service_categories;
  
  RAISE NOTICE '=== SEED DATA SUMMARY ===';
  RAISE NOTICE 'Cities: %', city_count;
  RAISE NOTICE 'Neighborhoods: %', neighborhood_count;
  RAISE NOTICE 'Service Categories: %', category_count;
  RAISE NOTICE 'Platform Settings: Monetization OFF by default';
  RAISE NOTICE 'Boost Plans: 3 plans created (inactive)';
END $$;
