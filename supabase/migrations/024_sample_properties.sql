-- =====================================================
-- SAMPLE PROPERTIES FOR TOPAFFAIREIMMO (DEMO SEED)
-- Safe/idempotent seed data
-- =====================================================

BEGIN;

-- 1) Disable RLS temporarily (safe inside transaction)
ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2) Ensure demo admin profile exists (handle id + email conflicts safely)
INSERT INTO public.profiles (
  id, email, full_name, user_role, is_verified, is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'demo@topaffaireimmo.com',
  'TopAffaireImmo Demo',
  'admin',
  true,
  true
)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    user_role = EXCLUDED.user_role,
    is_verified = EXCLUDED.is_verified,
    is_active = EXCLUDED.is_active;

-- If your database has UNIQUE(email) and the email is already used by another id,
-- the insert above can still fail. In that case, run this once manually and fix it:
-- Either delete the conflicting profile or change the demo email here.

-- 3) Insert sample properties (avoid duplicates by deleting existing demo properties first)
DELETE FROM public.properties
WHERE owner_id = '00000000-0000-0000-0000-000000000001'::uuid;

INSERT INTO public.properties (
  owner_id, transaction_type, property_type, city_id,
  price, area, bedrooms, bathrooms,
  title_fr, title_ar, description_fr, description_ar,
  images, status, featured, advertiser_type,
  contact_phone, contact_whatsapp
) VALUES
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'sale', 'apartment', 1,
    2500000, 150, 3, 2,
    'Appartement de luxe avec vue mer à Anfa',
    'شقة فاخرة مع إطلالة على البحر في أنفا',
    'Magnifique appartement de 150m² situé dans le prestigieux quartier d''Anfa. Vue imprenable sur l''océan Atlantique. Finitions haut de gamme, parking sécurisé.',
    'شقة رائعة بمساحة 150 متر مربع في حي أنفا الراقي. إطلالة خلابة على المحيط الأطلسي. تشطيبات فاخرة، موقف سيارات آمن.',
    ARRAY[
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80'
    ],
    'approved', true, 'agency',
    '+212 6XX XX XX XX', '+212 6XX XX XX XX'
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'sale', 'villa', 3,
    8500000, 450, 5, 4,
    'Villa de prestige avec piscine à Palmeraie',
    'فيلا فاخرة مع مسبح في النخيل',
    'Superbe villa de 450m² dans la Palmeraie de Marrakech. Jardin paysager de 2000m², piscine chauffée, 5 chambres en suite. Architecture traditionnelle marocaine.',
    'فيلا رائعة بمساحة 450 متر مربع في نخيل مراكش. حديقة 2000 متر مربع، مسبح مدفأ، 5 غرف نوم مع حمامات خاصة. هندسة معمارية مغربية تقليدية.',
    ARRAY[
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'
    ],
    'approved', true, 'owner',
    '+212 6XX XX XX XX', NULL
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'rent', 'apartment', 2,
    12000, 120, 2, 1,
    'Appartement moderne meublé à Agdal',
    'شقة حديثة مفروشة في أكدال',
    'Bel appartement meublé de 120m² dans le quartier Agdal de Rabat. Proche de toutes commodités. Idéal pour expatriés ou professionnels.',
    'شقة مفروشة جميلة بمساحة 120 متر مربع في حي أكدال بالرباط. قريب من جميع المرافق. مثالي للمغتربين أو المهنيين.',
    ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80'],
    'approved', false, 'broker',
    '+212 6XX XX XX XX', NULL
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'rent', 'commercial', 5,
    25000, 200, 0, 2,
    'Local commercial centre-ville Tanger',
    'محل تجاري وسط مدينة طنجة',
    'Local commercial de 200m² idéalement situé en plein centre-ville de Tanger. Vitrine sur rue passante, accès facile.',
    'محل تجاري بمساحة 200 متر مربع في موقع مثالي بوسط مدينة طنجة. واجهة على شارع رئيسي، وصول سهل.',
    ARRAY['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80'],
    'approved', false, 'agency',
    '+212 6XX XX XX XX', NULL
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'sale', 'land', 6,
    3500000, 1000, 0, 0,
    'Terrain constructible à Agadir Bay',
    'أرض للبناء في خليج أكادير',
    'Terrain de 1000m² avec vue sur la baie d''Agadir. Permis de construire disponible. Zone résidentielle calme.',
    'أرض بمساحة 1000 متر مربع مع إطلالة على خليج أكادير. رخصة البناء متاحة. منطقة سكنية هادئة.',
    ARRAY['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80'],
    'approved', true, 'owner',
    '+212 6XX XX XX XX', NULL
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'sale', 'house', 4,
    1800000, 220, 4, 3,
    'Maison traditionnelle rénovée à Fès',
    'منزل تقليدي مجدد في فاس',
    'Authentique maison traditionnelle de 220m² entièrement rénovée. Patio central avec fontaine, terrasse sur le toit.',
    'منزل تقليدي أصيل بمساحة 220 متر مربع تم تجديده بالكامل. فناء مركزي مع نافورة، تراس على السطح.',
    ARRAY['https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&q=80'],
    'approved', false, 'owner',
    '+212 6XX XX XX XX', NULL
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'rent', 'apartment', 1,
    8500, 90, 2, 1,
    'Appartement lumineux à Maârif',
    'شقة مشرقة في المعاريف',
    'Appartement de 90m² très lumineux situé au cœur du Maârif. Proche du Twin Center et des transports.',
    'شقة بمساحة 90 متر مربع مشرقة جداً في قلب المعاريف. قريب من توين سنتر ووسائل النقل.',
    ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'],
    'approved', false, 'broker',
    '+212 6XX XX XX XX', NULL
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'sale', 'villa', 5,
    5500000, 350, 4, 3,
    'Villa vue mer à Malabata',
    'فيلا مع إطلالة على البحر في مالاباطا',
    'Magnifique villa de 350m² avec vue panoramique sur la mer. Jardin de 800m², garage double.',
    'فيلا رائعة بمساحة 350 متر مربع مع إطلالة بانورامية على البحر. حديقة 800 متر مربع، كراج مزدوج.',
    ARRAY['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80'],
    'approved', true, 'agency',
    '+212 6XX XX XX XX', NULL
  );

-- 4) Re-enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

COMMIT;