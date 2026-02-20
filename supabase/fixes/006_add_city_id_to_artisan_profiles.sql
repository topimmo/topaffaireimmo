-- =====================================================
-- Migration: Add city_id to artisan_profiles
-- =====================================================
-- This migration adds a city_id foreign key to artisan_profiles
-- to properly reference the cities table.
-- The cities INTEGER[] array will remain for backward compatibility
-- but city_id should be the primary city reference.
-- =====================================================

-- Add city_id column as nullable first (to allow existing data)
ALTER TABLE public.artisan_profiles 
ADD COLUMN IF NOT EXISTS city_id INTEGER REFERENCES public.cities(id) ON DELETE RESTRICT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_artisan_profiles_city_id ON public.artisan_profiles(city_id);

-- Add comment
COMMENT ON COLUMN public.artisan_profiles.city_id IS 'Primary city where the artisan operates (FK to cities)';

-- Note: We keep the cities INTEGER[] column for backward compatibility
-- and for artisans who operate in multiple cities. The city_id represents
-- their primary/main city of operation.
