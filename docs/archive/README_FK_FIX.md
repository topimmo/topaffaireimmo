# FK ↔ RLS Mismatch Fix - Quick Reference

## Problem Fixed ✅

Production INSERT failures in AddListing due to FK vs RLS contradiction.

## Root Cause

- **RLS**: `owner_id = auth.uid()` ✅ (user authenticated)
- **Old FK**: `owner_id REFERENCES profiles(id)` ❌ (profile may not exist yet)
- **Result**: FK violation despite valid authentication

## Solution

Changed FK to reference `auth.users(id)` instead of `profiles(id)`:

```sql
ALTER TABLE public.properties 
  DROP CONSTRAINT IF EXISTS properties_owner_id_fkey;
  
ALTER TABLE public.properties 
  ADD CONSTRAINT properties_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

## Why This Works

Both RLS and FK now use the same identity source (`auth.users`), eliminating timing dependencies.

## Deploy

```bash
# Apply migrations
supabase db push

# Verify fix
./scripts/verify-fk-fix.sh
```

## Documentation

| File | Purpose |
|------|---------|
| **FINAL_SUMMARY_FK_FIX.md** | Complete overview & executive summary |
| **FK_RLS_MISMATCH_FIX.md** | Root cause analysis & technical details |
| **DEPLOYMENT_GUIDE_FK_FIX.md** | Step-by-step deployment instructions |
| **scripts/verify-fk-fix.sh** | Automated verification script |
| **061_verify_and_enforce_fk_fix.sql** | Idempotent migration |

## Quick Verification

```sql
-- Check FK references auth.users
SELECT confrelid::regclass 
FROM pg_constraint 
WHERE conname = 'properties_owner_id_fkey';
-- Expected: auth.users

-- Test INSERT
INSERT INTO properties (
  owner_id, transaction_type, property_type,
  city_id, price, title_fr, title_ar
) VALUES (
  auth.uid(), 'sale', 'apartment',
  1, 100000, 'Test', 'Test'
);
-- Should succeed even without profile
```

## Status

✅ **COMPLETE** - Ready for production deployment

---

**For full details, see FINAL_SUMMARY_FK_FIX.md**
