-- Migration: Add featured properties management
-- Description: Add featured_rank for ordering and dummy_properties table for fallback listings

-- Add featured_rank to properties table for custom ordering
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS featured_rank INTEGER DEFAULT 0;

-- Create index on featured_rank for efficient ordering
CREATE INDEX IF NOT EXISTS idx_properties_featured_rank 
ON public.properties(featured_rank DESC) 
WHERE featured = true;

-- Create dummy_properties table for fallback listings when real featured properties are insufficient
CREATE TABLE IF NOT EXISTS public.dummy_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'rent')),
  property_type TEXT NOT NULL CHECK (property_type IN ('apartment', 'house', 'villa', 'commercial', 'land')),
  city_id INTEGER NOT NULL REFERENCES public.cities(id),
  neighborhood_id INTEGER REFERENCES public.neighborhoods(id),
  title_fr TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_fr TEXT,
  description_ar TEXT,
  price DECIMAL(15,2) NOT NULL,
  area DECIMAL(10,2),
  bedrooms INTEGER,
  bathrooms INTEGER,
  images TEXT[] DEFAULT '{}',
  featured_rank INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for efficient querying of active dummy properties
CREATE INDEX IF NOT EXISTS idx_dummy_properties_active_rank 
ON public.dummy_properties(featured_rank DESC) 
WHERE is_active = true;

-- Add RLS policies for dummy_properties
ALTER TABLE public.dummy_properties ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active dummy properties
CREATE POLICY "Public can view active dummy properties"
ON public.dummy_properties
FOR SELECT
USING (is_active = true);

-- Allow admins full access to dummy properties
CREATE POLICY "Admins can manage dummy properties"
ON public.dummy_properties
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE admins.user_id = auth.uid()
    AND admins.is_active = true
  )
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_dummy_properties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dummy_properties_updated_at_trigger
BEFORE UPDATE ON public.dummy_properties
FOR EACH ROW
EXECUTE FUNCTION public.update_dummy_properties_updated_at();

-- Insert some sample dummy properties for initial setup
INSERT INTO public.dummy_properties (
  transaction_type, property_type, city_id, neighborhood_id,
  title_fr, title_ar, description_fr, description_ar,
  price, area, bedrooms, bathrooms, featured_rank, is_active
) VALUES
  -- Luxury Apartment in Casablanca
  (
    'sale', 'apartment', 1, 1,
    'Appartement de Luxe à Maârif',
    'شقة فاخرة في المعاريف',
    'Magnifique appartement moderne avec vue panoramique, finitions haut de gamme',
    'شقة رائعة حديثة مع إطلالة بانورامية، تشطيبات راقية',
    2500000, 120, 3, 2, 100, true
  ),
  -- Villa in Rabat
  (
    'sale', 'villa', 2, 7,
    'Villa Moderne à Agdal',
    'فيلا حديثة في أكدال',
    'Villa spacieuse avec jardin et piscine, quartier résidentiel calme',
    'فيلا واسعة مع حديقة ومسبح، حي سكني هادئ',
    4500000, 300, 5, 3, 90, true
  ),
  -- Apartment for Rent in Marrakech
  (
    'rent', 'apartment', 3, 11,
    'Appartement Meublé à Guéliz',
    'شقة مفروشة في جليز',
    'Appartement entièrement meublé, proche des commodités',
    'شقة مفروشة بالكامل، قريبة من المرافق',
    8000, 80, 2, 1, 80, true
  ),
  -- Commercial Space in Casablanca
  (
    'rent', 'commercial', 1, 2,
    'Local Commercial à Anfa',
    'محل تجاري في أنفا',
    'Espace commercial premium, emplacement stratégique',
    'مساحة تجارية راقية، موقع استراتيجي',
    15000, 150, NULL, NULL, 70, true
  ),
  -- Land in Tangier
  (
    'sale', 'land', 5, 17,
    'Terrain à Malabata',
    'أرض في مالاباطا',
    'Terrain constructible avec vue mer, proche des plages',
    'أرض قابلة للبناء مع إطلالة على البحر، قريبة من الشواطئ',
    1200000, 500, NULL, NULL, 60, true
  ),
  -- House in Fes
  (
    'sale', 'house', 4, 15,
    'Maison Traditionnelle - Ville Nouvelle',
    'منزل تقليدي - المدينة الجديدة',
    'Maison marocaine authentique, architecture traditionnelle',
    'منزل مغربي أصيل، هندسة معمارية تقليدية',
    1800000, 200, 4, 2, 50, true
  );

-- Add comment explaining the schema
COMMENT ON TABLE public.dummy_properties IS 'Fallback listings displayed when real featured properties are insufficient. Managed by admins.';
COMMENT ON COLUMN public.properties.featured_rank IS 'Custom ordering for featured properties (higher number = higher priority)';
COMMENT ON COLUMN public.dummy_properties.featured_rank IS 'Custom ordering for dummy properties (higher number = higher priority)';
