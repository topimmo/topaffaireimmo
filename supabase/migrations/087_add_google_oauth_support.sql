-- Migration: Add google_id field to profiles table for Google OAuth
-- Created: 2026-02-08
-- Purpose: Support Google OAuth authentication by storing Google user ID

-- Add google_id column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS google_id TEXT;

-- Create index on google_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_google_id ON public.profiles(google_id);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.google_id IS 'Google OAuth user ID (sub claim from Google)';
