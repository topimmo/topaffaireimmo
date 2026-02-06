# Deployment Guide: FK → RLS Mismatch Fix

## Overview

This guide explains how to deploy the FK → RLS mismatch fix to production.

## Problem Being Fixed

Production INSERT failures when creating properties due to a mismatch between:
- RLS policy requiring `owner_id = auth.uid()` 
- FK constraint requiring `owner_id` to exist in `profiles(id)`
- Profile creation may be delayed, causing FK violations even when user is authenticated

## Solution

Change the foreign key to reference `auth.users(id)` instead of `profiles(id)`, aligning with RLS policies.

## Migration Files

1. **Migration 049**: `049_remove_profile_dependency_from_rls.sql` (Initial fix)
2. **Migration 061**: `061_verify_and_enforce_fk_fix.sql` (Verification and enforcement)

Both migrations are **idempotent** and safe to run multiple times.

## Deployment Steps

### Step 1: Verify Current State

Before deploying, check if migration 049 has already been applied:

```bash
# Using Supabase CLI
supabase db execute --file - <<'SQL'
SELECT 
  conname,
  confrelid::regclass AS references_table
FROM pg_constraint
WHERE conname = 'properties_owner_id_fkey';
SQL
```

**Expected output if NOT fixed:**
```
references_table: public.profiles
```

**Expected output if ALREADY fixed:**
```
references_table: auth.users
```

### Step 2: Deploy Migrations

#### Option A: Using Supabase CLI (Recommended)

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations to production
supabase db push
```

This will apply all pending migrations including 049 and 061.

#### Option B: Using Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/049_remove_profile_dependency_from_rls.sql`
3. Run the migration
4. Copy the contents of `supabase/migrations/061_verify_and_enforce_fk_fix.sql`
5. Run the verification migration

#### Option C: Manual SQL Execution

If migrations have already been applied but you want to verify/enforce:

```sql
-- Run only the enforcement part from migration 061
ALTER TABLE public.properties 
  DROP CONSTRAINT IF EXISTS properties_owner_id_fkey;

ALTER TABLE public.properties 
  ADD CONSTRAINT properties_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

### Step 3: Verify Deployment

Run the verification script:

```bash
./scripts/verify-fk-fix.sh
```

Or manually verify:

```sql
-- 1. Check FK constraint
SELECT 
  conname AS constraint_name,
  confrelid::regclass AS references_table
FROM pg_constraint
WHERE conname = 'properties_owner_id_fkey'
  AND conrelid = 'public.properties'::regclass;
-- Expected: references_table = 'auth.users'

-- 2. Check RLS policies
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'properties'
ORDER BY policyname;
-- Should see policies using auth.uid()

-- 3. Verify profiles structure (should still be 1:1)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'id';
-- Should be: UUID with FK to auth.users
```

### Step 4: Test Property Creation

Create a test property to verify the fix works:

1. **Create a new test user** (or use existing)
2. **Immediately try to create a property** (don't wait for profile)
3. **Expected result**: INSERT succeeds

Example test query:

```sql
-- As authenticated user, this should now succeed
-- even if profile row doesn't exist yet
INSERT INTO properties (
  owner_id,
  transaction_type,
  property_type,
  city_id,
  price,
  title_fr,
  title_ar
)
VALUES (
  auth.uid(),
  'sale',
  'apartment',
  1,
  100000,
  'Test Property',
  'عقار تجريبي'
);
```

### Step 5: Monitor Production

After deployment, monitor for:

1. **Property creation success rate** - Should be 100%
2. **No FK violation errors** - Check logs for `foreign key constraint`
3. **Profile creation** - Should still work normally (async is OK)

## Rollback Plan

If you need to rollback (not recommended):

```sql
-- Restore old FK (will break properties without profiles)
ALTER TABLE public.properties 
  DROP CONSTRAINT IF EXISTS properties_owner_id_fkey;

ALTER TABLE public.properties 
  ADD CONSTRAINT properties_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
```

**Warning**: This may cause issues for properties created after the fix.

## Troubleshooting

### Issue: Migration fails with "constraint already exists"

**Solution**: Migrations are idempotent. This is expected behavior. Check the output - it should show "already correct, no action needed".

### Issue: Properties still fail to insert

**Possible causes**:
1. Migration not applied yet - verify with Step 3
2. Different error (not FK related) - check error message
3. RLS policies not updated - verify policies use `auth.uid()`

**Debug** (requires psql or Supabase Studio SQL Editor):
```sql
-- In psql interactive session, enable verbose errors:
\set VERBOSITY verbose
INSERT INTO properties (...) VALUES (...);

-- OR using Supabase CLI/Dashboard (no backslash commands):
-- Check the exact error message in the response
-- Look for: "violates foreign key constraint" or "violates row-level security"
```

### Issue: Existing properties broken

**Solution**: Should not happen. Migration only changes FK target, not data. All existing `owner_id` values should still be valid in `auth.users`.

## Success Criteria

✅ FK constraint references `auth.users(id)`  
✅ RLS policies use `auth.uid()`  
✅ Property creation succeeds immediately after user signup  
✅ No FK violation errors in logs  
✅ Profile creation still works (async is OK)  

## Support

If issues persist:
1. Check Supabase logs for specific errors
2. Verify migrations list: `supabase migration list`
3. Review FK_RLS_MISMATCH_FIX.md for detailed explanation
4. Contact support with error details

## Related Files

- `FK_RLS_MISMATCH_FIX.md` - Root cause analysis and technical details
- `supabase/migrations/049_remove_profile_dependency_from_rls.sql` - Initial fix
- `supabase/migrations/061_verify_and_enforce_fk_fix.sql` - Verification migration
- `scripts/verify-fk-fix.sh` - Automated verification script
