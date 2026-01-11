ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agency_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agency_logo TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agency_description_fr TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agency_description_ar TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agency_cities TEXT[];

CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_agency ON public.profiles(user_type) WHERE user_type = 'agency';
