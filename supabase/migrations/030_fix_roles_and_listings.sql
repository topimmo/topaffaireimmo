-- =====================================================
-- Migration: Fix Roles & Listing Creation Issues
-- =====================================================

-- 1. Make title columns nullable for flexible listing creation
-- Check which columns exist and alter them
DO $$
BEGIN
  -- Check if title_en exists
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'title_en') THEN
    EXECUTE 'ALTER TABLE public.properties ALTER COLUMN title_en DROP NOT NULL';
    EXECUTE 'ALTER TABLE public.properties ALTER COLUMN title_en SET DEFAULT ''''';
  END IF;
  
  -- Check if title_fr exists
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'title_fr') THEN
    EXECUTE 'ALTER TABLE public.properties ALTER COLUMN title_fr DROP NOT NULL';
    EXECUTE 'ALTER TABLE public.properties ALTER COLUMN title_fr SET DEFAULT ''''';
  END IF;
  
  -- Check if title_ar exists
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'title_ar') THEN
    EXECUTE 'ALTER TABLE public.properties ALTER COLUMN title_ar DROP NOT NULL';
    EXECUTE 'ALTER TABLE public.properties ALTER COLUMN title_ar SET DEFAULT ''''';
  END IF;
  
  -- Check if price exists
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'price') THEN
    EXECUTE 'ALTER TABLE public.properties ALTER COLUMN price DROP NOT NULL';
    EXECUTE 'ALTER TABLE public.properties ALTER COLUMN price SET DEFAULT 0';
  END IF;
END $$;

-- 3. Add advertiser_type column if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'properties' 
    AND column_name = 'advertiser_type') THEN
    ALTER TABLE public.properties ADD COLUMN advertiser_type TEXT DEFAULT 'owner' 
      CHECK (advertiser_type IN ('owner', 'broker', 'agency'));
  END IF;
END $$;

-- 4. Update profiles table for role separation
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'user_role') THEN
    ALTER TABLE public.profiles ADD COLUMN user_role TEXT DEFAULT 'real_estate_advertiser' 
      CHECK (user_role IN ('admin', 'real_estate_advertiser', 'commercial_advertiser'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_admin') THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_active') THEN
    ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_verified') THEN
    ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'company_name') THEN
    ALTER TABLE public.profiles ADD COLUMN company_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'preferred_language') THEN
    ALTER TABLE public.profiles ADD COLUMN preferred_language TEXT DEFAULT 'fr';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'advertiser_type') THEN
    ALTER TABLE public.profiles ADD COLUMN advertiser_type TEXT DEFAULT 'owner' 
      CHECK (advertiser_type IN ('owner', 'agency'));
  END IF;
END $$;

-- 5. Enable RLS on properties table
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies
DROP POLICY IF EXISTS "Anyone can view approved properties" ON public.properties;
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON public.properties;
DROP POLICY IF EXISTS "Properties can be inserted by authenticated users" ON public.properties;
DROP POLICY IF EXISTS "Properties can be inserted by real estate advertisers" ON public.properties;
DROP POLICY IF EXISTS "Properties can be updated by owner" ON public.properties;
DROP POLICY IF EXISTS "Properties can be deleted by owner" ON public.properties;
DROP POLICY IF EXISTS "Admins can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can update all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can delete all properties" ON public.properties;

-- 7. Create proper RLS policies for properties
-- Anyone can view approved properties
CREATE POLICY "Anyone can view approved properties" ON public.properties
  FOR SELECT USING (status = 'approved');

-- Users can view their own properties (any status)
CREATE POLICY "Users can view own properties" ON public.properties
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- Only real estate advertisers can create properties
CREATE POLICY "Real estate advertisers can insert properties" ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (user_role = 'real_estate_advertiser' OR user_role = 'admin' OR is_admin = true)
    )
  );

-- Users can update their own properties
CREATE POLICY "Users can update own properties" ON public.properties
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Users can delete their own properties  
CREATE POLICY "Users can delete own properties" ON public.properties
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Admins can do anything with properties
CREATE POLICY "Admins full access to properties" ON public.properties
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR user_role = 'admin'))
  );

-- 8. RLS for banner_requests (commercial advertisers only)
ALTER TABLE public.banner_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Commercial advertisers can insert banner requests" ON public.banner_requests;
DROP POLICY IF EXISTS "Users can view own banner requests" ON public.banner_requests;
DROP POLICY IF EXISTS "Admins can view all banner requests" ON public.banner_requests;
DROP POLICY IF EXISTS "Admins can update banner requests" ON public.banner_requests;

-- Commercial advertisers can create banner requests
CREATE POLICY "Commercial advertisers can insert banner requests" ON public.banner_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    advertiser_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (user_role = 'commercial_advertiser' OR user_role = 'admin' OR is_admin = true)
    )
  );

-- Users can view their own banner requests
CREATE POLICY "Users can view own banner requests" ON public.banner_requests
  FOR SELECT TO authenticated
  USING (advertiser_id = auth.uid());

-- Admins can view all banner requests
CREATE POLICY "Admins can view all banner requests" ON public.banner_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR user_role = 'admin'))
  );

-- Admins can update banner requests
CREATE POLICY "Admins can update banner requests" ON public.banner_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR user_role = 'admin'))
  );

-- 9. RLS for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR user_role = 'admin'))
  );

-- 10. Ensure trigger exists for new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    phone, 
    user_role,
    company_name,
    is_admin,
    is_active,
    is_verified
  )
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'user_role', 'real_estate_advertiser'),
    NEW.raw_user_meta_data->>'company_name',
    false,
    true,
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    user_role = COALESCE(EXCLUDED.user_role, public.profiles.user_role),
    company_name = COALESCE(EXCLUDED.company_name, public.profiles.company_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Grant proper permissions
GRANT ALL ON public.properties TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.banner_requests TO authenticated;
GRANT SELECT ON public.cities TO anon, authenticated;
GRANT SELECT ON public.neighborhoods TO anon, authenticated;
GRANT SELECT ON public.banner_slots TO anon, authenticated;
