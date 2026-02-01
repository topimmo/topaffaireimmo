-- =====================================================
-- Migration 062: Fix Duplicate FK Constraints on public.admins
-- =====================================================
--
-- PROBLEM:
-- - Duplicate FK constraints on public.admins.user_id
-- - INSERT fails with: Key (user_id)=(xxx) is not present in table "users"
-- - User DOES exist in auth.users
--
-- ROOT CAUSE:
-- - Two FK constraints exist: admins_user_id_fkey and admins_user_id_fkey2
-- - One likely references non-existent public.users or unqualified "users"
-- - Schema search_path confusion or leftover from previous migrations
--
-- SOLUTION:
-- - Drop ALL existing FK constraints on public.admins.user_id
-- - Create single, clean FK constraint with explicit schema
-- - Ensure referential integrity to auth.users(id) with ON DELETE CASCADE
--
-- =====================================================

-- =====================================================
-- STEP 1: Display Current State (for logging)
-- =====================================================

DO $$
DECLARE
  fk_count INTEGER;
  fk_record RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'BEFORE FIX: Current FK Constraints';
  RAISE NOTICE '========================================';
  
  -- Count FK constraints
  SELECT COUNT(*) INTO fk_count
  FROM pg_constraint c
  JOIN pg_class cl ON c.conrelid = cl.oid
  JOIN pg_namespace ns ON cl.relnamespace = ns.oid
  WHERE ns.nspname = 'public'
    AND cl.relname = 'admins'
    AND c.contype = 'f';
  
  RAISE NOTICE 'Total FK constraints found: %', fk_count;
  
  -- List each FK constraint
  FOR fk_record IN
    SELECT 
      c.conname AS constraint_name,
      c.confrelid::regclass AS references_table,
      pg_get_constraintdef(c.oid) AS definition
    FROM pg_constraint c
    JOIN pg_class cl ON c.conrelid = cl.oid
    JOIN pg_namespace ns ON cl.relnamespace = ns.oid
    WHERE ns.nspname = 'public'
      AND cl.relname = 'admins'
      AND c.contype = 'f'
  LOOP
    RAISE NOTICE 'FK: % -> % : %', 
      fk_record.constraint_name, 
      fk_record.references_table,
      fk_record.definition;
  END LOOP;
  
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- STEP 2: Drop ALL Existing FK Constraints (Safe)
-- =====================================================

-- Drop admins_user_id_fkey (from migration 050)
ALTER TABLE public.admins 
  DROP CONSTRAINT IF EXISTS admins_user_id_fkey;

-- Drop admins_user_id_fkey2 (duplicate, unknown origin)
ALTER TABLE public.admins 
  DROP CONSTRAINT IF EXISTS admins_user_id_fkey2;

-- Drop any other possible FK constraint names (paranoid safety)
-- These might exist if migrations were run multiple times
ALTER TABLE public.admins 
  DROP CONSTRAINT IF EXISTS admins_user_id_fkey1;

ALTER TABLE public.admins 
  DROP CONSTRAINT IF EXISTS fk_admins_user_id;

-- Verify all FK constraints are dropped
DO $$
DECLARE
  remaining_fk_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_fk_count
  FROM pg_constraint c
  JOIN pg_class cl ON c.conrelid = cl.oid
  JOIN pg_namespace ns ON cl.relnamespace = ns.oid
  WHERE ns.nspname = 'public'
    AND cl.relname = 'admins'
    AND c.contype = 'f';
  
  IF remaining_fk_count = 0 THEN
    RAISE NOTICE '✅ SUCCESS: All FK constraints dropped';
  ELSE
    RAISE WARNING '⚠️  WARNING: % FK constraint(s) still remain', remaining_fk_count;
  END IF;
END $$;

-- =====================================================
-- STEP 3: Verify No Orphan Rows (Safety Check)
-- =====================================================

-- Check for any rows in admins where user doesn't exist in auth.users
-- This would prevent creating the new FK constraint
DO $$
DECLARE
  orphan_count INTEGER;
  orphan_record RECORD;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM public.admins a
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = a.user_id
  );
  
  IF orphan_count > 0 THEN
    RAISE WARNING '⚠️  WARNING: Found % orphan row(s) in public.admins', orphan_count;
    RAISE WARNING 'These rows reference non-existent users in auth.users:';
    
    FOR orphan_record IN
      SELECT a.user_id, a.created_at
      FROM public.admins a
      WHERE NOT EXISTS (
        SELECT 1 FROM auth.users u WHERE u.id = a.user_id
      )
    LOOP
      RAISE WARNING '  - user_id: %, created_at: %', 
        orphan_record.user_id, 
        orphan_record.created_at;
    END LOOP;
    
    RAISE WARNING 'Consider deleting orphan rows before proceeding:';
    RAISE WARNING '  DELETE FROM public.admins WHERE user_id = ''orphan-uuid'';';
  ELSE
    RAISE NOTICE '✅ SUCCESS: No orphan rows found';
  END IF;
END $$;

-- =====================================================
-- STEP 4: Create Single, Clean FK Constraint
-- =====================================================

-- Create new FK constraint with explicit schema reference
-- This is the canonical, correct FK constraint
ALTER TABLE public.admins 
  ADD CONSTRAINT admins_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Verify the constraint was created
DO $$
DECLARE
  fk_exists BOOLEAN;
  fk_target regclass;
BEGIN
  -- Check if constraint exists
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'admins_user_id_fkey'
      AND conrelid = 'public.admins'::regclass
  ) INTO fk_exists;
  
  IF fk_exists THEN
    -- Get the target table
    SELECT confrelid::regclass INTO fk_target
    FROM pg_constraint
    WHERE conname = 'admins_user_id_fkey'
      AND conrelid = 'public.admins'::regclass;
    
    IF fk_target = 'auth.users'::regclass THEN
      RAISE NOTICE '✅ SUCCESS: FK constraint created and references auth.users';
    ELSE
      RAISE WARNING '⚠️  WARNING: FK constraint created but references: %', fk_target;
    END IF;
  ELSE
    RAISE WARNING '❌ ERROR: FK constraint was not created';
  END IF;
END $$;

-- =====================================================
-- STEP 5: Verify Data Type Match
-- =====================================================

DO $$
DECLARE
  admins_type text;
  users_type text;
BEGIN
  -- Get data type of public.admins.user_id
  SELECT udt_name INTO admins_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'admins'
    AND column_name = 'user_id';
  
  -- Get data type of auth.users.id
  SELECT udt_name INTO users_type
  FROM information_schema.columns
  WHERE table_schema = 'auth'
    AND table_name = 'users'
    AND column_name = 'id';
  
  IF admins_type = users_type AND admins_type = 'uuid' THEN
    RAISE NOTICE '✅ SUCCESS: Both columns are UUID type';
  ELSE
    RAISE WARNING '⚠️  WARNING: Type mismatch - admins.user_id: %, auth.users.id: %', 
      admins_type, users_type;
  END IF;
END $$;

-- =====================================================
-- STEP 6: Test Insert (Verification)
-- =====================================================

-- This will be run in the verification script, not here
-- But we document the expected behavior:
/*
INSERT INTO public.admins (user_id) 
VALUES ('5c10a187-ad0d-4e94-91f6-fa526a9e97a3');

EXPECTED:
- If user exists in auth.users: ✅ SUCCESS
- If user doesn't exist in auth.users: ❌ FK constraint violation
- No more "table users" confusion - clear error referencing auth.users
*/

-- =====================================================
-- STEP 7: Display Final State
-- =====================================================

DO $$
DECLARE
  fk_record RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'AFTER FIX: Final FK Constraints';
  RAISE NOTICE '========================================';
  
  FOR fk_record IN
    SELECT 
      c.conname AS constraint_name,
      c.confrelid::regclass AS references_table,
      c.confupdtype AS on_update,
      c.confdeltype AS on_delete,
      pg_get_constraintdef(c.oid) AS definition
    FROM pg_constraint c
    JOIN pg_class cl ON c.conrelid = cl.oid
    JOIN pg_namespace ns ON cl.relnamespace = ns.oid
    WHERE ns.nspname = 'public'
      AND cl.relname = 'admins'
      AND c.contype = 'f'
  LOOP
    RAISE NOTICE 'FK: % -> %', 
      fk_record.constraint_name, 
      fk_record.references_table;
    RAISE NOTICE '  ON UPDATE: %, ON DELETE: %',
      fk_record.on_update,
      fk_record.on_delete;
    RAISE NOTICE '  Definition: %', fk_record.definition;
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 062 completed successfully';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- VERIFICATION QUERIES (Run these after migration)
-- =====================================================

-- See docs/FK_CONSTRAINT_VERIFICATION.sql for complete verification scripts

-- Quick verification:
-- SELECT 
--   c.conname AS constraint_name,
--   c.confrelid::regclass AS references_table,
--   pg_get_constraintdef(c.oid) AS definition
-- FROM pg_constraint c
-- WHERE c.conrelid = 'public.admins'::regclass
--   AND c.contype = 'f';

-- Expected: 1 row, references_table = 'auth.users'

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================

-- To rollback this migration:
-- ALTER TABLE public.admins DROP CONSTRAINT IF EXISTS admins_user_id_fkey;
-- Then restore from backup or re-run migration 050

-- =====================================================
-- NOTES
-- =====================================================

/*
WHAT THIS MIGRATION FIXES:

1. DUPLICATE CONSTRAINTS:
   - Removes both admins_user_id_fkey and admins_user_id_fkey2
   - Ensures only ONE FK constraint exists

2. SCHEMA CLARITY:
   - Uses explicit schema reference: auth.users(id)
   - No ambiguity about which "users" table

3. REFERENTIAL INTEGRITY:
   - ON DELETE CASCADE: If user deleted from auth.users, admin row deleted too
   - Proper cascading behavior

4. ERROR MESSAGES:
   - Clear error messages referencing auth.users
   - No more confusion about "table users"

WHY THIS WORKS:

The error "Key is not present in table 'users'" occurred because:
- One FK constraint referenced a non-existent or wrong table
- PostgreSQL checks ALL FK constraints before allowing INSERT
- If ANY constraint fails, INSERT is rejected

By removing duplicates and creating a single, correctly-defined FK:
- Only one constraint to check
- Constraint correctly references auth.users
- Clear error messages if user doesn't exist

DESIGN DECISION: auth.users vs profiles

We reference auth.users(id) directly because:
- auth.users is the single source of truth for user identity
- Guaranteed to exist when user is authenticated
- No dependency on profile creation timing
- Consistent with RLS policies using auth.uid()

Profiles table is for additional user metadata, not core identity.
*/

-- =====================================================
-- END OF MIGRATION
-- =====================================================
