-- =====================================================
-- FK CONSTRAINT VERIFICATION SCRIPTS
-- After running migration 062
-- =====================================================
--
-- Run these queries to verify the fix worked correctly
-- =====================================================

-- =====================================================
-- VERIFICATION 1: Confirm Only ONE FK Exists
-- =====================================================

SELECT 
  c.conname AS constraint_name,
  'public.admins' AS from_table,
  a.attname AS from_column,
  c.confrelid::regclass AS references_table,
  af.attname AS references_column,
  CASE c.confupdtype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
  END AS on_update_action,
  CASE c.confdeltype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
  END AS on_delete_action,
  pg_get_constraintdef(c.oid) AS full_definition
FROM pg_constraint c
JOIN pg_class cl ON c.conrelid = cl.oid
JOIN pg_namespace ns ON cl.relnamespace = ns.oid
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE ns.nspname = 'public'
  AND cl.relname = 'admins'
  AND c.contype = 'f';

-- ✅ EXPECTED RESULT:
-- Should show exactly 1 row with:
-- constraint_name: admins_user_id_fkey
-- references_table: auth.users
-- references_column: id
-- on_delete_action: CASCADE

-- ❌ PROBLEM IF:
-- - More than 1 row (duplicates still exist)
-- - references_table is not 'auth.users'
-- - 0 rows (FK constraint missing entirely)

-- =====================================================
-- VERIFICATION 2: Confirm User Exists in auth.users
-- =====================================================

-- Replace with your actual user UUID or email
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  'User exists in auth.users ✅' AS status
FROM auth.users
WHERE email = 'acherafe2017@gmail.com';

-- Or by UUID:
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  'User exists in auth.users ✅' AS status
FROM auth.users
WHERE id = '5c10a187-ad0d-4e94-91f6-fa526a9e97a3';

-- ✅ EXPECTED: 1 row returned with the user details
-- ❌ PROBLEM: 0 rows = user doesn't exist

-- =====================================================
-- VERIFICATION 3: Test INSERT into public.admins
-- =====================================================

-- IMPORTANT: Only run this if you want to actually insert the admin
-- Replace with your actual user UUID
INSERT INTO public.admins (user_id) 
VALUES ('5c10a187-ad0d-4e94-91f6-fa526a9e97a3')
ON CONFLICT (user_id) DO NOTHING
RETURNING user_id, created_at;

-- ✅ EXPECTED: 
-- - INSERT succeeds
-- - Returns the user_id and created_at
-- - If already exists, returns nothing due to ON CONFLICT

-- ❌ PROBLEM IF:
-- - ERROR 23503: FK constraint violation
--   -> User doesn't exist in auth.users
-- - ERROR 23505: Duplicate key violation
--   -> User already exists in admins (this is OK)

-- =====================================================
-- VERIFICATION 4: Check for Orphan Rows
-- =====================================================

-- Find any admin rows where user doesn't exist in auth.users
SELECT 
  a.user_id,
  a.created_at,
  '❌ ORPHAN: User does not exist in auth.users' AS issue
FROM public.admins a
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = a.user_id
);

-- ✅ EXPECTED: 0 rows (no orphans)
-- ❌ PROBLEM: Any rows returned are invalid references
-- To fix orphans:
-- DELETE FROM public.admins WHERE user_id = 'orphan-uuid-here';

-- =====================================================
-- VERIFICATION 5: List All Current Admins
-- =====================================================

-- Show all admin users with their details
SELECT 
  a.user_id,
  u.email,
  u.created_at AS user_created,
  a.created_at AS admin_added,
  u.email_confirmed_at IS NOT NULL AS email_confirmed,
  u.last_sign_in_at
FROM public.admins a
JOIN auth.users u ON a.user_id = u.id
ORDER BY a.created_at DESC;

-- This shows:
-- - All admins
-- - Their email addresses
-- - When they were created
-- - When they were added as admin
-- - If they confirmed their email
-- - Last sign in time

-- =====================================================
-- VERIFICATION 6: Test FK Constraint Enforcement
-- =====================================================

-- Try to insert a non-existent user (this SHOULD fail)
-- Use a random UUID that doesn't exist
DO $$
DECLARE
  fake_uuid UUID := '00000000-0000-0000-0000-000000000000';
  user_exists BOOLEAN;
BEGIN
  -- Check if this UUID exists (it shouldn't)
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = fake_uuid
  ) INTO user_exists;
  
  IF user_exists THEN
    RAISE NOTICE 'UUID % exists, using different UUID for test', fake_uuid;
    fake_uuid := gen_random_uuid();
  END IF;
  
  -- Try to insert (this should fail with FK violation)
  BEGIN
    INSERT INTO public.admins (user_id) VALUES (fake_uuid);
    RAISE WARNING '❌ PROBLEM: FK constraint NOT enforced - invalid insert succeeded!';
  EXCEPTION
    WHEN foreign_key_violation THEN
      RAISE NOTICE '✅ SUCCESS: FK constraint properly enforced - rejected invalid user_id';
      RAISE NOTICE 'Error message: %', SQLERRM;
  END;
END $$;

-- ✅ EXPECTED: 
-- "FK constraint properly enforced" message
-- Error should mention "auth.users"

-- ❌ PROBLEM IF:
-- - Insert succeeds (FK not enforcing)
-- - Error mentions wrong table name

-- =====================================================
-- VERIFICATION 7: Verify Data Types Match
-- =====================================================

SELECT 
  'public.admins.user_id' AS column_location,
  data_type,
  udt_name,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'admins'
  AND column_name = 'user_id'

UNION ALL

SELECT 
  'auth.users.id' AS column_location,
  data_type,
  udt_name,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'auth'
  AND table_name = 'users'
  AND column_name = 'id';

-- ✅ EXPECTED: 
-- Both rows show:
-- data_type: uuid
-- udt_name: uuid
-- is_nullable: NO

-- =====================================================
-- VERIFICATION 8: Check RLS Policies on admins
-- =====================================================

-- Verify RLS policies are still in place
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'admins'
ORDER BY cmd, policyname;

-- ✅ EXPECTED: 3 policies
-- - admins_select_admin_only (SELECT)
-- - admins_insert_admin_only (INSERT)
-- - admins_delete_admin_only (DELETE)

-- All should check: auth.uid() IN (SELECT user_id FROM public.admins)

-- =====================================================
-- VERIFICATION 9: Summary Status Check
-- =====================================================

DO $$
DECLARE
  fk_count INTEGER;
  fk_target regclass;
  orphan_count INTEGER;
  admin_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FINAL VERIFICATION SUMMARY';
  RAISE NOTICE '========================================';
  
  -- Count FK constraints
  SELECT COUNT(*) INTO fk_count
  FROM pg_constraint
  WHERE conrelid = 'public.admins'::regclass
    AND contype = 'f';
  
  RAISE NOTICE '1. FK Constraints: %', fk_count;
  
  IF fk_count = 1 THEN
    -- Get FK target
    SELECT confrelid::regclass INTO fk_target
    FROM pg_constraint
    WHERE conrelid = 'public.admins'::regclass
      AND contype = 'f'
    LIMIT 1;
    
    RAISE NOTICE '   Target: %', fk_target;
    
    IF fk_target = 'auth.users'::regclass THEN
      RAISE NOTICE '   Status: ✅ CORRECT';
    ELSE
      RAISE NOTICE '   Status: ❌ WRONG TARGET';
    END IF;
  ELSIF fk_count = 0 THEN
    RAISE NOTICE '   Status: ❌ NO FK CONSTRAINT';
  ELSE
    RAISE NOTICE '   Status: ⚠️  DUPLICATES EXIST';
  END IF;
  
  -- Count orphan rows
  SELECT COUNT(*) INTO orphan_count
  FROM public.admins a
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = a.user_id
  );
  
  RAISE NOTICE '2. Orphan Rows: %', orphan_count;
  IF orphan_count = 0 THEN
    RAISE NOTICE '   Status: ✅ NO ORPHANS';
  ELSE
    RAISE NOTICE '   Status: ❌ ORPHANS FOUND';
  END IF;
  
  -- Count total admins
  SELECT COUNT(*) INTO admin_count
  FROM public.admins;
  
  RAISE NOTICE '3. Total Admins: %', admin_count;
  
  RAISE NOTICE '========================================';
  
  IF fk_count = 1 AND fk_target = 'auth.users'::regclass AND orphan_count = 0 THEN
    RAISE NOTICE 'OVERALL STATUS: ✅ ALL CHECKS PASSED';
  ELSE
    RAISE NOTICE 'OVERALL STATUS: ⚠️  ISSUES DETECTED';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- CLEANUP (if needed)
-- =====================================================

-- If you find orphan rows, clean them up:
-- DELETE FROM public.admins 
-- WHERE user_id NOT IN (SELECT id FROM auth.users);

-- =====================================================
-- NOTES
-- =====================================================

/*
WHAT TO DO IF VERIFICATION FAILS:

1. FK COUNT != 1:
   - Run diagnostic queries from FK_CONSTRAINT_DIAGNOSTIC.sql
   - Manually drop extra constraints
   - Re-run migration 062

2. FK REFERENCES WRONG TABLE:
   - Drop existing FK: 
     ALTER TABLE public.admins DROP CONSTRAINT admins_user_id_fkey;
   - Recreate correctly:
     ALTER TABLE public.admins 
       ADD CONSTRAINT admins_user_id_fkey 
       FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

3. ORPHAN ROWS EXIST:
   - Identify: SELECT * FROM public.admins WHERE user_id NOT IN (SELECT id FROM auth.users);
   - Delete: DELETE FROM public.admins WHERE user_id = 'orphan-uuid';
   - Or: Recreate missing users in auth.users (not recommended)

4. INSERT STILL FAILS:
   - Check user exists: SELECT * FROM auth.users WHERE id = 'your-uuid';
   - Check FK definition: See VERIFICATION 1 query
   - Check error message - should now mention auth.users, not just "users"

SUCCESS CRITERIA:
✅ Exactly 1 FK constraint
✅ FK references auth.users(id)
✅ ON DELETE CASCADE
✅ No orphan rows
✅ INSERT works for existing users
✅ INSERT fails for non-existent users with clear error
*/
