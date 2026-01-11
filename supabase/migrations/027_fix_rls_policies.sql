-- =====================================================
-- FIX: Enable RLS but ensure public access to reference data
-- =====================================================

-- Ensure RLS is enabled on cities but allow public SELECT
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Cities are viewable by everyone" ON public.cities;
DROP POLICY IF EXISTS "Anyone can view cities" ON public.cities;

-- Create policy for public read access
CREATE POLICY "Anyone can view cities" ON public.cities
  FOR SELECT 
  TO anon, authenticated
  USING (true);

-- Same for neighborhoods
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Neighborhoods are viewable by everyone" ON public.neighborhoods;
DROP POLICY IF EXISTS "Anyone can view neighborhoods" ON public.neighborhoods;

CREATE POLICY "Anyone can view neighborhoods" ON public.neighborhoods
  FOR SELECT 
  TO anon, authenticated
  USING (true);

-- Same for property_types
ALTER TABLE public.property_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Property types are viewable by everyone" ON public.property_types;
DROP POLICY IF EXISTS "Anyone can view property types" ON public.property_types;

CREATE POLICY "Anyone can view property types" ON public.property_types
  FOR SELECT 
  TO anon, authenticated
  USING (true);

-- Same for banner_slots (for commercial advertisers to see available slots)
ALTER TABLE public.banner_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Banner slots are viewable by everyone" ON public.banner_slots;
DROP POLICY IF EXISTS "Anyone can view banner slots" ON public.banner_slots;

CREATE POLICY "Anyone can view banner slots" ON public.banner_slots
  FOR SELECT 
  TO anon, authenticated
  USING (is_active = true);

-- Properties - ensure approved ones are publicly visible
DROP POLICY IF EXISTS "Approved properties are viewable by everyone" ON public.properties;
DROP POLICY IF EXISTS "Anyone can view approved properties" ON public.properties;

CREATE POLICY "Anyone can view approved properties" ON public.properties
  FOR SELECT 
  TO anon, authenticated
  USING (status = 'approved');

-- Users can view their own properties regardless of status
DROP POLICY IF EXISTS "Users can view their own properties" ON public.properties;

CREATE POLICY "Users can view their own properties" ON public.properties
  FOR SELECT 
  TO authenticated
  USING (owner_id = auth.uid());

-- Users can insert their own properties  
DROP POLICY IF EXISTS "Users can insert their own properties" ON public.properties;

CREATE POLICY "Users can insert their own properties" ON public.properties
  FOR INSERT 
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Users can update their own properties
DROP POLICY IF EXISTS "Users can update their own properties" ON public.properties;

CREATE POLICY "Users can update their own properties" ON public.properties
  FOR UPDATE 
  TO authenticated
  USING (owner_id = auth.uid());

-- Users can delete their own properties
DROP POLICY IF EXISTS "Users can delete their own properties" ON public.properties;

CREATE POLICY "Users can delete their own properties" ON public.properties
  FOR DELETE 
  TO authenticated
  USING (owner_id = auth.uid());

-- Banner requests - users can only see their own
ALTER TABLE public.banner_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own banner requests" ON public.banner_requests;
DROP POLICY IF EXISTS "Users can manage their own banner requests" ON public.banner_requests;

CREATE POLICY "Users can view their own banner requests" ON public.banner_requests
  FOR SELECT 
  TO authenticated
  USING (advertiser_id = auth.uid());

CREATE POLICY "Users can insert their own banner requests" ON public.banner_requests
  FOR INSERT 
  TO authenticated
  WITH CHECK (advertiser_id = auth.uid());

-- Profiles - users can view their own
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles of agencies are visible" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT 
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE 
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Public profiles of agencies are visible" ON public.profiles
  FOR SELECT 
  TO anon, authenticated
  USING (advertiser_type = 'agency' AND is_active = true);
