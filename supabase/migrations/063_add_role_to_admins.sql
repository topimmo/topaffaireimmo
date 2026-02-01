-- =====================================================
-- Migration 063: Add role column to admins table
-- =====================================================
--
-- OBJECTIVE:
-- Add role column to admins table to support different admin roles
-- Default role is 'admin' for all existing and new admin users
--
-- =====================================================

-- Add role column to admins table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'admins' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.admins 
      ADD COLUMN role TEXT DEFAULT 'admin' NOT NULL;
  END IF;
END $$;

-- Update existing admins to have 'admin' role if role is NULL
UPDATE public.admins 
SET role = 'admin' 
WHERE role IS NULL;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify role column exists:
-- SELECT user_id, role, created_at FROM public.admins;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
