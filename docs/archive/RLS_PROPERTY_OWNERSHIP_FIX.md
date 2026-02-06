# RLS Property Ownership Fix - Deployment Guide

## Overview

This fix ensures users can always see/update/delete their own property listings even if they change `advertiser_type` over time (owner/broker/agency). The `advertiser_type` field will NOT affect ownership/visibility logic.

## Key Changes

### 1. Database Schema
- Added `created_by` column to `properties` table
- Immutable field that tracks the original creator
- Backfilled from existing `owner_id` values
- Set to `auth.uid()` by default for new records

### 2. RLS Policies
Updated to check **both** `created_by` and `owner_id`:
- **SELECT**: User can view if `created_by = auth.uid() OR owner_id = auth.uid()`
- **INSERT**: User can create if `created_by = auth.uid()`
- **UPDATE**: User can modify if `created_by = auth.uid() OR owner_id = auth.uid()`
- **DELETE**: User can remove if `created_by = auth.uid() OR owner_id = auth.uid()`

### 3. Frontend
- Dashboard queries use `.or()` filter for both fields
- Delete operations log detailed error information
- AddListing explicitly sets `created_by`
- EditListing queries both fields

## Migration Files

1. `supabase/migrations/071_add_created_by_to_properties.sql`
2. `supabase/migrations/072_fix_properties_rls_policies.sql`

## Deployment Steps

### 1. Backup Database (Recommended)
```sql
-- Create backup of properties table
CREATE TABLE properties_backup AS SELECT * FROM properties;
```

### 2. Apply Migrations
Run the migrations in order:
```bash
# In Supabase Dashboard > SQL Editor
-- Or using Supabase CLI:
supabase db push
```

### 3. Verify Migration Success
```sql
-- Check created_by column exists
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'properties' AND column_name = 'created_by';

-- Verify all properties have created_by set
SELECT 
  COUNT(*) as total,
  COUNT(created_by) as with_created_by,
  COUNT(*) - COUNT(created_by) as missing_created_by
FROM public.properties;

-- Check RLS policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE tablename = 'properties'
ORDER BY cmd, policyname;
```

### 4. Deploy Frontend
Deploy the updated frontend code with the new query logic.

## Testing Checklist

### Test Scenario 1: Existing User with Listings
1. Login as existing user with properties
2. Go to "My Listings" dashboard
3. ✅ Verify all previous listings are visible
4. ✅ Verify can edit draft/rejected listings
5. ✅ Verify can delete allowed listings
6. Change user's `advertiser_type` (owner → broker → agency)
7. Refresh "My Listings"
8. ✅ Verify all listings still visible
9. ✅ Verify can still edit/delete as before

### Test Scenario 2: New User Creating Listings
1. Create new user account
2. Create property with `advertiser_type = 'owner'`
3. ✅ Verify listing appears in "My Listings"
4. Change to `advertiser_type = 'broker'`
5. Create another property
6. ✅ Verify BOTH listings appear (owner + broker)
7. Change to `advertiser_type = 'agency'`
8. Create third property
9. ✅ Verify ALL THREE listings appear
10. ✅ Verify can edit/delete any of them

### Test Scenario 3: Delete Operations
1. Login as user with listings
2. Attempt to delete a property
3. ✅ If delete fails, check browser console for detailed error
4. ✅ Error should include: code, message, details, hint
5. ✅ Verify error message is user-friendly in UI

### Test Scenario 4: RLS Security
1. Create User A with property
2. Note property ID
3. Login as User B
4. Attempt to access User A's property URL directly
5. ✅ Public listings should be visible
6. ✅ Draft/pending listings should NOT be visible
7. Attempt API call to delete User A's property
8. ✅ Should fail with RLS error

### Test Scenario 5: Admin Access
1. Login as admin user
2. Go to Admin Listings panel
3. ✅ Verify can see ALL listings (all users, all statuses)
4. ✅ Verify can edit any listing
5. ✅ Verify can delete any listing
6. ✅ Verify can approve/reject listings

## Verification SQL Queries

### Check User's Listings
```sql
-- Replace USER_UUID with actual user ID
SELECT id, title_fr, status, advertiser_type, created_by, owner_id, created_at
FROM properties
WHERE created_by = 'USER_UUID' OR owner_id = 'USER_UUID'
ORDER BY created_at DESC;
```

### Verify created_by is Immutable
```sql
-- This should fail with error
UPDATE properties 
SET created_by = 'some-other-uuid' 
WHERE id = 'PROPERTY_ID';
-- Expected: ERROR: created_by cannot be changed after property creation
```

### Check RLS Enforcement
```sql
-- As specific user (replace USER_UUID)
SET LOCAL role authenticated;
SET LOCAL request.jwt.claim.sub = 'USER_UUID';

-- Should only see own properties + public published
SELECT COUNT(*) FROM properties;
```

## Rollback Plan (if needed)

If issues arise, rollback using:

```sql
-- 1. Drop new policies
DROP POLICY IF EXISTS "properties_select_own" ON public.properties;
DROP POLICY IF EXISTS "properties_select_public" ON public.properties;
DROP POLICY IF EXISTS "properties_select_admin" ON public.properties;
DROP POLICY IF EXISTS "properties_insert_own" ON public.properties;
DROP POLICY IF EXISTS "properties_update_own" ON public.properties;
DROP POLICY IF EXISTS "properties_update_admin" ON public.properties;
DROP POLICY IF EXISTS "properties_delete_own" ON public.properties;
DROP POLICY IF EXISTS "properties_delete_admin" ON public.properties;

-- 2. Drop created_by column and trigger
DROP TRIGGER IF EXISTS prevent_created_by_change_trigger ON public.properties;
DROP FUNCTION IF EXISTS public.prevent_created_by_change();
DROP INDEX IF EXISTS idx_properties_created_by;
ALTER TABLE public.properties DROP COLUMN IF EXISTS created_by;

-- 3. Restore from backup (if created)
-- Truncate and restore from properties_backup

-- 4. Recreate old policies from migration 067
-- (See supabase/migrations/067_property_status_workflow.sql)
```

## Common Issues and Solutions

### Issue: "created_by cannot be NULL"
**Cause**: Migration 071 failed during backfill
**Solution**: 
```sql
UPDATE properties SET created_by = owner_id WHERE created_by IS NULL;
```

### Issue: User can't see their old listings
**Cause**: Incorrect RLS policy or missing created_by
**Solution**: Verify policy and backfill:
```sql
-- Check if created_by is set
SELECT COUNT(*) FROM properties WHERE created_by IS NULL;
-- If any nulls, run backfill
UPDATE properties SET created_by = owner_id WHERE created_by IS NULL;
```

### Issue: Delete operation fails silently
**Cause**: RLS blocking delete or status workflow trigger
**Solution**: Check browser console for detailed error, verify property status allows deletion

### Issue: Frontend shows "created_by.eq is not a function"
**Cause**: Old version of Supabase client
**Solution**: Update @supabase/supabase-js to latest version

## Success Criteria

✅ Users can create listings with any advertiser_type
✅ Users see ALL their listings regardless of advertiser_type changes
✅ Users can update/delete their own listings (subject to status workflow)
✅ created_by field is immutable
✅ RLS policies enforce ownership correctly
✅ Error messages are informative and logged
✅ No security vulnerabilities introduced
✅ Admin access remains unrestricted

## Support

For issues or questions:
1. Check browser console for detailed error messages
2. Verify RLS policies with verification queries above
3. Check Supabase logs for backend errors
4. Review migration files for exact policy definitions

## Security Note

This fix follows defense-in-depth principles:
- **Database Level**: RLS policies enforce ownership
- **Application Level**: Frontend filters queries
- **Immutability**: created_by cannot be changed via trigger
- **Audit Trail**: Both created_by and owner_id tracked

The RLS policies are the primary security mechanism, with frontend filtering providing UX optimization.
