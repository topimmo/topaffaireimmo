-- =====================================================
-- Migration: Final Fix for Roles & Policies
-- =====================================================

-- 1. Drop ALL existing property policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view approved properties" ON public.properties;
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON public.properties;
DROP POLICY IF EXISTS "Properties can be inserted by authenticated users" ON public.properties;
DROP POLICY IF EXISTS "Properties can be inserted by real estate advertisers" ON public.properties;
DROP POLICY IF EXISTS "Properties can be updated by owner" ON public.properties;
DROP POLICY IF EXISTS "Properties can be deleted by owner" ON public.properties;
DROP POLICY IF EXISTS "Admins can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can update all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can delete all properties" ON public.properties;
DROP POLICY IF EXISTS "Users can view own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON public.properties;
DROP POLICY IF EXISTS "Real estate advertisers can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Anyone can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can update properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can delete properties" ON public.properties;

-- 2. Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 3. Create clean policies for properties
-- Public can view all approved properties
CREATE POLICY "public_view_approved" ON public.properties
  FOR SELECT USING (status = 'approved');

-- Authenticated users can view their own properties (any status)
CREATE POLICY "owner_view_own" ON public.properties
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- Admins can view all properties
CREATE POLICY "admin_view_all" ON public.properties
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Real estate advertisers can insert properties
CREATE POLICY "realtor_insert" ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    (
      NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()) OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (user_role IS NULL OR user_role = 'real_estate_advertiser' OR user_role = 'admin' OR is_admin = true)
      )
    )
  );

-- Owners can update their properties
CREATE POLICY "owner_update" ON public.properties
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Admins can update all properties
CREATE POLICY "admin_update" ON public.properties
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Owners can delete their properties
CREATE POLICY "owner_delete" ON public.properties
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Admins can delete all properties
CREATE POLICY "admin_delete" ON public.properties
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 4. Fix profile policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- 5. Fix banner_requests policies
DROP POLICY IF EXISTS "Users can insert banner requests" ON public.banner_requests;
DROP POLICY IF EXISTS "Users can view own banner requests" ON public.banner_requests;
DROP POLICY IF EXISTS "Admins can update banner requests" ON public.banner_requests;
DROP POLICY IF EXISTS "Admins can view all banner requests" ON public.banner_requests;
DROP POLICY IF EXISTS "banner_insert" ON public.banner_requests;
DROP POLICY IF EXISTS "banner_select_own" ON public.banner_requests;
DROP POLICY IF EXISTS "banner_admin_update" ON public.banner_requests;

ALTER TABLE public.banner_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "banner_insert" ON public.banner_requests
  FOR INSERT TO authenticated
  WITH CHECK (advertiser_id = auth.uid());

CREATE POLICY "banner_select_own" ON public.banner_requests
  FOR SELECT TO authenticated
  USING (
    advertiser_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "banner_update_own" ON public.banner_requests
  FOR UPDATE TO authenticated
  USING (advertiser_id = auth.uid())
  WITH CHECK (advertiser_id = auth.uid());

CREATE POLICY "banner_admin_update" ON public.banner_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 6. Fix cities and reference data policies
DROP POLICY IF EXISTS "Cities are viewable by everyone" ON public.cities;
DROP POLICY IF EXISTS "Anyone can view cities" ON public.cities;
DROP POLICY IF EXISTS "cities_public_read" ON public.cities;

CREATE POLICY "cities_public_read" ON public.cities
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Property types are viewable by everyone" ON public.property_types;
DROP POLICY IF EXISTS "Anyone can view property types" ON public.property_types;
DROP POLICY IF EXISTS "property_types_public_read" ON public.property_types;

CREATE POLICY "property_types_public_read" ON public.property_types
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Neighborhoods are viewable by everyone" ON public.neighborhoods;
DROP POLICY IF EXISTS "Anyone can view neighborhoods" ON public.neighborhoods;
DROP POLICY IF EXISTS "neighborhoods_public_read" ON public.neighborhoods;

CREATE POLICY "neighborhoods_public_read" ON public.neighborhoods
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Banner slots are viewable by everyone" ON public.banner_slots;
DROP POLICY IF EXISTS "Anyone can view banner slots" ON public.banner_slots;
DROP POLICY IF EXISTS "banner_slots_public_read" ON public.banner_slots;

CREATE POLICY "banner_slots_public_read" ON public.banner_slots
  FOR SELECT USING (is_active = true);
