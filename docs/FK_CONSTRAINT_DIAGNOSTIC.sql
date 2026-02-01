-- =====================================================
-- FOREIGN KEY CONSTRAINT DIAGNOSTIC SCRIPTS
-- For public.admins table FK issues
-- =====================================================
--
-- PROBLEM:
-- INSERT INTO public.admins fails with:
-- ERROR 23503: Key (user_id)=(xxx) is not present in table "users"
-- But user EXISTS in auth.users
--
-- SUSPECTED CAUSE:
-- - Duplicate FK constraints (admins_user_id_fkey and admins_user_id_fkey2)
-- - One FK might reference non-existent public.users instead of auth.users
-- - Schema search_path confusion
--
-- =====================================================

-- =====================================================
-- STEP 1: DIAGNOSTIC QUERIES
-- Copy/paste these queries to diagnose the issue
-- =====================================================

-- ------------------------------------------------
-- 1.1 List ALL Foreign Key Constraints on public.admins
-- ------------------------------------------------
-- This shows EXACT FK definitions including schema, table, column
SELECT 
  c.conname AS constraint_name,
  c.contype AS constraint_type,
  'public.admins' AS from_table,
  a.attname AS from_column,
  c.confrelid::regclass AS references_table,
  af.attname AS references_column,
  c.confupdtype AS on_update_action,
  c.confdeltype AS on_delete_action,
  c.condeferrable AS is_deferrable,
  c.condeferred AS is_deferred,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class cl ON c.conrelid = cl.oid
JOIN pg_namespace ns ON cl.relnamespace = ns.oid
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE ns.nspname = 'public'
  AND cl.relname = 'admins'
  AND c.contype = 'f'  -- Foreign key constraints only
ORDER BY c.conname;

-- EXPECTED OUTPUT:
-- Should show 1 FK constraint referencing auth.users(id)
-- If you see 2 rows (admins_user_id_fkey and admins_user_id_fkey2), that's the duplicate issue
-- Check the "references_table" column - one might show "users" or "public.users" instead of "auth.users"

-- ------------------------------------------------
-- 1.2 Check if public.users table exists
-- ------------------------------------------------
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'users'
ORDER BY schemaname, tablename;

-- EXPECTED: 0 rows (table should NOT exist)
-- If it returns rows, that's unexpected and could be causing confusion

-- ------------------------------------------------
-- 1.3 Verify User Exists in auth.users
-- ------------------------------------------------
-- Replace the email with your actual email
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'acherafe2017@gmail.com';

-- EXPECTED: 1 row with id = 5c10a187-ad0d-4e94-91f6-fa526a9e97a3
-- If no rows, the user doesn't exist in auth.users

-- ------------------------------------------------
-- 1.4 Check Data Type Match
-- ------------------------------------------------
-- Verify both columns are UUID type
SELECT 
  'public.admins.user_id' AS column_location,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'admins'
  AND column_name = 'user_id'

UNION ALL

SELECT 
  'auth.users.id' AS column_location,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'auth'
  AND table_name = 'users'
  AND column_name = 'id';

-- EXPECTED: Both should show data_type = 'uuid'

-- ------------------------------------------------
-- 1.5 Check Current Rows in public.admins
-- ------------------------------------------------
SELECT 
  a.user_id,
  u.email,
  a.created_at,
  CASE 
    WHEN u.id IS NOT NULL THEN '✅ Valid'
    ELSE '❌ Orphan (user not in auth.users)'
  END AS status
FROM public.admins a
LEFT JOIN auth.users u ON a.user_id = u.id
ORDER BY a.created_at DESC;

-- This will show:
-- - All admin rows
-- - Whether the referenced user exists in auth.users
-- - Any "orphan" rows (user_id not in auth.users)

-- ------------------------------------------------
-- 1.6 Detailed FK Constraint Information
-- ------------------------------------------------
-- More detailed view of FK constraints
SELECT 
  tc.constraint_name,
  tc.table_schema || '.' || tc.table_name AS from_table,
  kcu.column_name AS from_column,
  ccu.table_schema || '.' || ccu.table_name AS to_table,
  ccu.column_name AS to_column,
  rc.update_rule,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
  AND tc.table_schema = ccu.table_schema
JOIN information_schema.referential_constraints rc 
  ON tc.constraint_name = rc.constraint_name
  AND tc.table_schema = rc.constraint_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'admins'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.constraint_name;

-- This provides a clearer view of:
-- - Constraint name
-- - From table and column
-- - To table and column (with schema prefix)
-- - Update/delete rules

-- =====================================================
-- STEP 2: EXPLANATION OF THE ERROR
-- =====================================================

/*
WHY "Key is not present in table 'users'" when user exists in auth.users?

Possible reasons:

1. DUPLICATE FK WITH WRONG REFERENCE (Most Likely):
   - One FK constraint references "public.users" (non-existent table)
   - Another FK references "auth.users" (correct table)
   - PostgreSQL checks ALL FK constraints
   - If ANY constraint fails, the INSERT fails
   - Error message shows table name WITHOUT schema prefix

2. SCHEMA SEARCH_PATH CONFUSION:
   - FK defined as REFERENCES users(id) without schema prefix
   - PostgreSQL resolves "users" based on search_path
   - If search_path has public before auth, it looks for public.users first
   - Since public.users doesn't exist, constraint check fails

3. CONSTRAINT DEFINITION BUG:
   - FK might have been created with wrong table reference during migration
   - Migration 045 references auth.users (correct)
   - Migration 050 also references auth.users (correct)
   - But somehow a constraint referencing "users" or "public.users" exists

4. NOT RELATED TO RLS:
   - Row-Level Security (RLS) does NOT affect FK constraint checks
   - FK checks happen at the system level, before RLS
   - RLS only affects SELECT/INSERT/UPDATE/DELETE after FK validation

DIAGNOSIS:
Run query 1.1 above to see exact FK definitions. Look for:
- references_table showing "users" instead of "auth.users"
- Multiple FK constraints with same purpose
*/

-- =====================================================
-- STEP 3: CHECK FOR ORPHAN ROWS
-- =====================================================

-- Find admins rows where user doesn't exist in auth.users
SELECT 
  a.user_id,
  a.created_at,
  '❌ ORPHAN: User does not exist in auth.users' AS issue
FROM public.admins a
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = a.user_id
);

-- EXPECTED: 0 rows (no orphans)
-- If rows returned, those are invalid references that should be cleaned up

-- =====================================================
-- STEP 4: VERIFY TABLE STRUCTURE
-- =====================================================

-- Check admins table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'admins'
ORDER BY ordinal_position;

-- EXPECTED:
-- user_id   | uuid | NO  | NULL | NULL
-- created_at | timestamp with time zone | YES | now() | NULL

-- =====================================================
-- NOTES FOR RUNNING THESE QUERIES
-- =====================================================

/*
HOW TO RUN:
1. Copy each query individually
2. Run in Supabase SQL Editor (uses service role, bypasses RLS)
3. Note the results, especially:
   - Number of FK constraints (should be 1, not 2)
   - Which table each FK references
   - Whether user exists in auth.users

WHAT TO LOOK FOR:
✅ GOOD STATE:
   - 1 FK constraint
   - References auth.users(id)
   - ON DELETE CASCADE
   - User exists in auth.users
   - No orphan rows

❌ BAD STATE (Current):
   - 2 FK constraints (duplicates)
   - One or both reference wrong table
   - INSERT fails despite user existing

NEXT STEPS:
After running diagnostics, proceed to the FIX migration (062)
*/
