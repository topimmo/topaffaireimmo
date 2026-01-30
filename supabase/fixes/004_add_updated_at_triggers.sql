-- =====================================================
-- FIX 004: Add Auto-Update Triggers for updated_at
-- =====================================================
-- 
-- PROBLEM: Tables have updated_at columns but no triggers
-- to automatically update them on row changes
--
-- IMPACT: Inconsistent updated_at timestamps
--
-- SOLUTION: Add generic trigger function and apply to all tables
-- =====================================================

-- =====================================================
-- STEP 1: Create Generic Trigger Function
-- =====================================================

-- Drop if exists to avoid duplicates
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Create function that sets updated_at to NOW()
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 2: Add Trigger to Properties Table
-- =====================================================

DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- STEP 3: Add Trigger to Profiles Table
-- =====================================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- STEP 4: Add Trigger to Banner Requests Table
-- =====================================================

DROP TRIGGER IF EXISTS update_banner_requests_updated_at ON public.banner_requests;

CREATE TRIGGER update_banner_requests_updated_at
  BEFORE UPDATE ON public.banner_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- STEP 5: Add Trigger to Advertising Inquiries Table
-- =====================================================

DROP TRIGGER IF EXISTS update_advertising_inquiries_updated_at ON public.advertising_inquiries;

CREATE TRIGGER update_advertising_inquiries_updated_at
  BEFORE UPDATE ON public.advertising_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- VERIFICATION
-- =====================================================

-- List all triggers
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname LIKE '%updated_at%'
ORDER BY table_name;

-- Expected output:
-- update_properties_updated_at → properties
-- update_profiles_updated_at → profiles
-- update_banner_requests_updated_at → banner_requests
-- update_advertising_inquiries_updated_at → advertising_inquiries

-- =====================================================
-- TESTING
-- =====================================================

-- Test trigger by updating a property
-- UPDATE public.properties 
-- SET title_fr = 'Test Update' 
-- WHERE id = 'some-uuid';
-- 
-- Then check updated_at was automatically set:
-- SELECT id, title_fr, updated_at 
-- FROM public.properties 
-- WHERE id = 'some-uuid';

-- =====================================================
-- END OF FIX 004
-- =====================================================
