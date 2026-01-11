ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS advertiser_type TEXT DEFAULT 'owner' CHECK (advertiser_type IN ('owner', 'broker', 'agency'));
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
UPDATE public.properties SET advertiser_type = 'owner' WHERE advertiser_type IS NULL;
