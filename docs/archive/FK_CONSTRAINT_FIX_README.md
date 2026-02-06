# Fix: Duplicate FK Constraints on public.admins

## Problem Statement

**Error when inserting into `public.admins`:**
```sql
INSERT INTO public.admins (user_id) VALUES ('5c10a187-ad0d-4e94-91f6-fa526a9e97a3');

ERROR: 23503: insert or update on table "admins" violates foreign key constraint "admins_user_id_fkey"
DETAIL: Key (user_id)=(5c10a187-ad0d-4e94-91f6-fa526a9e97a3) is not present in table "users".
```

**But the user DOES exist:**
```sql
SELECT id, email FROM auth.users WHERE email = 'acherafe2017@gmail.com';

id = 5c10a187-ad0d-4e94-91f6-fa526a9e97a3
email = acherafe2017@gmail.com
```

**Discovery:** Duplicate FK constraints found:
- `admins_user_id_fkey` → references auth.users
- `admins_user_id_fkey2` → references ??? (suspected: public.users or wrong table)

---

## Root Cause

1. **Duplicate FK Constraints:** Two FK constraints exist on `public.admins.user_id`
2. **Wrong Reference:** One FK likely references non-existent `public.users` or has schema confusion
3. **PostgreSQL Behavior:** ALL FK constraints must pass for INSERT to succeed
4. **Error Message:** Shows table name without schema prefix ("users" instead of "auth.users")

---

## Solution Overview

**Migration 062** fixes this by:
1. Dropping ALL existing FK constraints on `public.admins.user_id`
2. Recreating a single, clean FK constraint with explicit schema
3. Verifying data integrity (no orphan rows)
4. Testing the fix

---

## Files Included

### 1. Diagnostic Scripts
**File:** `docs/FK_CONSTRAINT_DIAGNOSTIC.sql`

**Purpose:** Diagnose the current state before applying fix

**Key Queries:**
- List all FK constraints with exact definitions
- Check if `public.users` table exists
- Verify user exists in `auth.users`
- Check for orphan rows
- Verify data type match (UUID)

**Usage:**
```bash
# Run each query individually in Supabase SQL Editor
# Copy from FK_CONSTRAINT_DIAGNOSTIC.sql
```

---

### 2. Fix Migration
**File:** `supabase/migrations/062_fix_duplicate_fk_admins.sql`

**Purpose:** Fix the duplicate FK constraint issue

**What it does:**
1. Shows current state (for logging)
2. Drops ALL FK constraints safely:
   - `admins_user_id_fkey`
   - `admins_user_id_fkey2`
   - `admins_user_id_fkey1` (paranoid safety)
   - `fk_admins_user_id` (alternative naming)
3. Checks for orphan rows (warns if found)
4. Creates single, canonical FK constraint:
   ```sql
   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
   ```
5. Verifies the fix
6. Shows final state

**Usage:**
```bash
# Apply via Supabase dashboard or CLI
supabase db push
```

---

### 3. Verification Scripts
**File:** `docs/FK_CONSTRAINT_VERIFICATION.sql`

**Purpose:** Verify the fix worked correctly

**Key Checks:**
1. Only 1 FK constraint exists
2. FK references `auth.users(id)` correctly
3. User exists in `auth.users`
4. INSERT works correctly
5. No orphan rows
6. FK properly enforces referential integrity

**Usage:**
```bash
# Run after migration 062
# Copy from FK_CONSTRAINT_VERIFICATION.sql
```

---

### 4. Design Guide
**File:** `docs/FK_DESIGN_GUIDE_AUTH_VS_PROFILES.md`

**Purpose:** Explain when to use `auth.users` vs `public.profiles`

**Topics:**
- Quick decision chart
- Case studies from TopAffaireImmo
- Common patterns
- Troubleshooting guide
- Recommendations

---

## Step-by-Step Instructions

### Step 1: Diagnose Current State

```sql
-- Run this query from FK_CONSTRAINT_DIAGNOSTIC.sql
SELECT 
  c.conname AS constraint_name,
  c.confrelid::regclass AS references_table,
  pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
WHERE c.conrelid = 'public.admins'::regclass
  AND c.contype = 'f';
```

**Expected Issues:**
- 2 rows (duplicate constraints)
- One references wrong table

---

### Step 2: Check User Exists

```sql
-- Verify user exists in auth.users
SELECT id, email FROM auth.users 
WHERE id = '5c10a187-ad0d-4e94-91f6-fa526a9e97a3';
```

**Expected:** 1 row with the user details

---

### Step 3: Apply Migration 062

**Option A: Supabase CLI**
```bash
supabase db push
```

**Option B: Supabase Dashboard**
1. Go to SQL Editor
2. Copy entire content of `062_fix_duplicate_fk_admins.sql`
3. Execute
4. Review NOTICE messages for status

**Option C: Manual Application**
```sql
-- Copy from 062_fix_duplicate_fk_admins.sql
-- Run in SQL Editor
```

---

### Step 4: Verify Fix

```sql
-- From FK_CONSTRAINT_VERIFICATION.sql
-- Check only 1 FK exists
SELECT 
  c.conname AS constraint_name,
  c.confrelid::regclass AS references_table
FROM pg_constraint c
WHERE c.conrelid = 'public.admins'::regclass
  AND c.contype = 'f';
```

**Expected:** 1 row, `references_table = 'auth.users'`

---

### Step 5: Test Insert

```sql
-- This should now work
INSERT INTO public.admins (user_id) 
VALUES ('5c10a187-ad0d-4e94-91f6-fa526a9e97a3')
ON CONFLICT (user_id) DO NOTHING;
```

**Expected:** Success (or conflict if already exists)

---

### Step 6: Run Full Verification

```sql
-- From FK_CONSTRAINT_VERIFICATION.sql
-- Run the summary check
DO $$
DECLARE
  fk_count INTEGER;
  fk_target regclass;
BEGIN
  SELECT COUNT(*) INTO fk_count
  FROM pg_constraint
  WHERE conrelid = 'public.admins'::regclass AND contype = 'f';
  
  SELECT confrelid::regclass INTO fk_target
  FROM pg_constraint
  WHERE conrelid = 'public.admins'::regclass AND contype = 'f'
  LIMIT 1;
  
  IF fk_count = 1 AND fk_target = 'auth.users'::regclass THEN
    RAISE NOTICE '✅ ALL CHECKS PASSED';
  ELSE
    RAISE NOTICE '⚠️  ISSUES DETECTED';
  END IF;
END $$;
```

---

## Success Criteria

✅ **Fix is successful when:**

1. **Only 1 FK constraint exists**
   ```sql
   SELECT COUNT(*) FROM pg_constraint 
   WHERE conrelid = 'public.admins'::regclass AND contype = 'f';
   -- Result: 1
   ```

2. **FK references auth.users(id)**
   ```sql
   SELECT confrelid::regclass FROM pg_constraint 
   WHERE conname = 'admins_user_id_fkey';
   -- Result: auth.users
   ```

3. **INSERT succeeds for existing users**
   ```sql
   INSERT INTO public.admins (user_id) VALUES ('existing-user-uuid');
   -- Result: Success
   ```

4. **INSERT fails for non-existent users**
   ```sql
   INSERT INTO public.admins (user_id) VALUES ('00000000-0000-0000-0000-000000000000');
   -- Result: FK constraint violation (expected)
   ```

5. **No orphan rows**
   ```sql
   SELECT COUNT(*) FROM public.admins a
   WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = a.user_id);
   -- Result: 0
   ```

6. **ON DELETE CASCADE works**
   - If user deleted from auth.users, admin row is deleted too

---

## Troubleshooting

### Issue 1: Migration Fails

**Error:** FK constraint can't be created

**Cause:** Orphan rows exist (user_id not in auth.users)

**Solution:**
```sql
-- Find orphans
SELECT * FROM public.admins a
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = a.user_id);

-- Delete orphans
DELETE FROM public.admins 
WHERE user_id = 'orphan-uuid-here';

-- Re-run migration
```

---

### Issue 2: Still Getting Duplicate FK Errors

**Cause:** Migration didn't drop all constraints

**Solution:**
```sql
-- List all constraints
SELECT conname FROM pg_constraint 
WHERE conrelid = 'public.admins'::regclass AND contype = 'f';

-- Drop each manually
ALTER TABLE public.admins DROP CONSTRAINT constraint_name_here;

-- Recreate correct one
ALTER TABLE public.admins 
  ADD CONSTRAINT admins_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

---

### Issue 3: INSERT Still Fails

**Error:** FK constraint violation

**Diagnosis:**
```sql
-- Check user exists
SELECT * FROM auth.users WHERE id = 'your-uuid';

-- Check FK definition
SELECT pg_get_constraintdef(oid) FROM pg_constraint 
WHERE conname = 'admins_user_id_fkey';
```

**Possible causes:**
- User actually doesn't exist in auth.users
- UUID typo
- Wrong database/project

---

## Why This Happens

### Historical Context

1. **Migration 045** created `admin_whitelist` with FK to auth.users
2. **Migration 050** created `admins` table with FK to auth.users
3. **Unknown migration** or manual change created duplicate FK
4. One FK references wrong table or has schema confusion

### How PostgreSQL FK Constraints Work

- PostgreSQL allows multiple FK constraints on same column
- ALL constraints must pass for INSERT to succeed
- If ANY constraint fails, INSERT is rejected
- Error messages don't always show schema prefix

### Why auth.users vs profiles

- `auth.users` is single source of truth for user identity
- Always exists when user is authenticated
- `profiles` might not exist yet (created by trigger)
- RLS policies use `auth.uid()` from auth.users
- FK should match RLS source for consistency

See `FK_DESIGN_GUIDE_AUTH_VS_PROFILES.md` for detailed explanation.

---

## Related Issues

This fix relates to:
- **Migration 061:** Fixed properties.owner_id FK (same issue, different table)
- **RLS Policies:** Ensure FK and RLS use same source (auth.users)
- **Profile Creation:** Decouples admin access from profile timing

---

## Testing Checklist

After applying migration 062:

- [ ] Run diagnostic queries (FK_CONSTRAINT_DIAGNOSTIC.sql)
- [ ] Verify only 1 FK constraint exists
- [ ] Verify FK references auth.users(id)
- [ ] Test INSERT with existing user (should succeed)
- [ ] Test INSERT with non-existent user (should fail with clear error)
- [ ] Check no orphan rows exist
- [ ] Verify RLS policies still work
- [ ] Test admin functionality in application

---

## Summary

**Problem:** Duplicate FK constraints causing INSERT failures

**Fix:** Migration 062 removes duplicates and creates clean FK

**Result:** 
- Single FK constraint
- References auth.users(id) correctly
- ON DELETE CASCADE behavior
- Clear error messages
- Aligns with RLS policies
- No timing dependencies

---

## Contact

For questions or issues:
- Review `FK_DESIGN_GUIDE_AUTH_VS_PROFILES.md`
- Check migration 050 and 061 for context
- Run verification scripts after any changes

---

**Last Updated:** 2026-02-01  
**Migration Version:** 062  
**Status:** Ready for production deployment
