# Supabase Runtime Errors Fix - Summary

## Problem Statement

The application was experiencing critical runtime errors in production:
- **PGRST116**: "Cannot coerce the result to a single JSON object (0 rows)"
- **406 Not Acceptable** errors on Supabase requests
- Storage bucket warnings (missing buckets)
- Incomplete approve/reject logic for admin actions

## Root Causes

### 1. PGRST116 Errors
The application used `.single()` throughout the codebase, which throws a PGRST116 error when no rows are returned. This caused crashes in:
- Admin listings page when verifying updates
- Property detail pages when properties don't exist
- CMS page editor when pages are deleted
- Various other query operations

### 2. Missing Null Checks
Even when queries succeeded, there were insufficient null checks before using the returned data, leading to potential crashes.

### 3. Incomplete Approval Logic
The `AdminListingDetail.tsx` component was missing the `rejected_at` and `rejected_by` fields when rejecting properties, while `AdminListings.tsx` had them. This inconsistency led to incomplete audit trails.

### 4. RLS Policy Gaps
The `admins` table was missing an UPDATE policy, which could cause permission issues when trying to modify admin records.

## Solutions Implemented

### 1. Replace `.single()` with `.maybeSingle()`

**Changed Files:**
- `src/pages/admin/AdminListings.tsx` (lines 299, 325)
- `src/pages/admin/AdminListingDetail.tsx` (lines 113, 205)
- `src/pages/admin/AdminContentPageEditor.tsx` (line 65)
- `src/pages/EditListing.tsx` (line 134)
- `src/pages/AddListing.tsx` (line 484 - kept `.single()` for INSERT but added null check)
- `src/hooks/useProperties.ts` (line 142)

**Why `.maybeSingle()` instead of `.single()`:**
- `.single()` - Expects EXACTLY 1 row, throws PGRST116 if 0 rows
- `.maybeSingle()` - Returns `null` if 0 rows, doesn't throw error
- Allows graceful handling of "not found" scenarios

**Files Already Correct:**
- `src/pages/AuthCallback.tsx` - Already handles PGRST116 error code
- `src/hooks/useCMSPage.ts` - Already handles PGRST116 error code
- `src/hooks/useReferenceData.ts` - Already handles PGRST116 error code

### 2. Add Comprehensive Null Checks

**Before:**
```typescript
const { data, error } = await supabase.from('properties').select().eq('id', id).single();
if (error) {
  toast.error('Error loading listing');
} else if (data) {
  setProperty(data);
}
```

**After:**
```typescript
const { data, error } = await supabase.from('properties').select().eq('id', id).maybeSingle();
if (error) {
  console.error('Error loading listing:', error);
  toast.error('Error loading listing');
  navigate('/admin/listings');
} else if (!data) {
  console.warn('Listing not found:', id);
  toast.error('Listing not found');
  navigate('/admin/listings');
} else {
  setProperty(data);
}
```

### 3. Complete Approve/Reject Logic

Added missing fields to `AdminListingDetail.tsx`:

```typescript
// If approving, set approval fields
if (newStatus === 'approved') {
  const now = new Date().toISOString();
  updateData.approved_at = now;
  updateData.approved_by = user?.id || null;
  updateData.published_at = now;
} else if (newStatus === 'rejected') {
  const now = new Date().toISOString();
  updateData.rejected_at = now;       // ✅ Added
  updateData.rejected_by = user?.id || null;  // ✅ Added
}
```

Also updated verification query to include `rejected_at` and `rejected_by` fields.

### 4. Database Migrations

#### Migration 065: Verify Storage Buckets
**File:** `supabase/migrations/065_verify_storage_buckets.sql`

Ensures all required storage buckets exist:
- `property-images` (5MB limit, image/jpeg, image/png, image/webp)
- `banner-images` (1MB limit, image/jpeg, image/png, image/gif, image/webp)
- `payment-receipts` (2MB limit, image/jpeg, image/png, application/pdf)
- `agency-logos` (512KB limit, public, image/jpeg, image/png, image/webp)

Uses `ON CONFLICT (id) DO UPDATE` to be idempotent (safe to run multiple times).

#### Migration 066: Add Admins UPDATE Policy
**File:** `supabase/migrations/066_add_admins_update_policy.sql`

Adds missing UPDATE policy for the `admins` table:

```sql
CREATE POLICY "admins_update_admin_only" ON public.admins
  FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.admins))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));
```

Ensures both `USING` (who can update) and `WITH CHECK` (what can be updated to) clauses are present.

### 5. Improved Error Logging

**Enhanced logging throughout:**
```typescript
console.group('🔍 [STEP C] Supabase Response');
if (error) {
  console.error('❌ Error Object:', error);
  console.error('Error Code:', error.code);
  console.error('Error Message:', error.message);
  console.error('Error Details:', error.details);
  console.error('Error Hint:', error.hint);
} else if (!data) {
  console.warn('⚠️ No data returned (may not exist)');
} else {
  console.log('✅ Success - Data:', data);
}
console.groupEnd();
```

## Verification

### Build Status
✅ Application builds successfully
✅ No TypeScript errors
✅ No ESBuild errors

### Security Scan
✅ CodeQL scan passed with 0 alerts

### Code Review
✅ Automated code review found no issues

## Expected Impact

### Before (Production Issues)
- ❌ PGRST116 errors when viewing non-existent properties
- ❌ AdminListings page crashes when verifying updates
- ❌ CMS editor crashes when editing deleted pages
- ❌ Incomplete audit trail for rejections
- ❌ 406 errors from improper error handling
- ⚠️ Potential storage bucket missing warnings

### After (Fixed)
- ✅ Graceful "Property not found" messages
- ✅ AdminListings page handles all scenarios
- ✅ CMS editor handles deleted pages gracefully
- ✅ Complete audit trail with rejected_at/rejected_by
- ✅ Clear error logging without crashes
- ✅ Storage buckets verified/created via migration

## Files Changed

**Source Code (6 files):**
1. `src/pages/admin/AdminListings.tsx` - Fixed approve/reject queries
2. `src/pages/admin/AdminListingDetail.tsx` - Fixed fetch query and added reject fields
3. `src/pages/admin/AdminContentPageEditor.tsx` - Fixed CMS page fetch
4. `src/pages/EditListing.tsx` - Fixed property fetch
5. `src/pages/AddListing.tsx` - Added null check
6. `src/hooks/useProperties.ts` - Fixed property detail fetch

**Database Migrations (2 files):**
1. `supabase/migrations/065_verify_storage_buckets.sql` - Storage bucket verification
2. `supabase/migrations/066_add_admins_update_policy.sql` - Admins UPDATE policy

## Deployment Notes

### Database Migrations
Run migrations 065 and 066 in your Supabase project:
```bash
# Via Supabase CLI
supabase db push

# Or manually in SQL Editor
-- Run 065_verify_storage_buckets.sql
-- Run 066_add_admins_update_policy.sql
```

Both migrations are **idempotent** (safe to run multiple times).

### Testing Checklist
After deployment, verify:
- [ ] AdminListings page loads without errors
- [ ] Approve button works and sets approved_at, approved_by, published_at
- [ ] Reject button works and sets rejected_at, rejected_by, rejection_reason
- [ ] Viewing non-existent property shows "Property not found" (not PGRST116)
- [ ] CMS editor handles missing pages gracefully
- [ ] Console shows clear error logs (not uncaught exceptions)
- [ ] Storage uploads work for all 4 buckets

## Related Documentation

- Supabase `.single()` vs `.maybeSingle()`: https://supabase.com/docs/reference/javascript/single
- RLS Policies Best Practices: https://supabase.com/docs/guides/auth/row-level-security
- Error Code PGRST116: https://postgrest.org/en/stable/references/errors.html

## Conclusion

This PR eliminates the root causes of PGRST116 and 406 errors by:
1. Using `.maybeSingle()` instead of `.single()` for queries that may return 0 rows
2. Adding comprehensive null checks and error handling
3. Completing the approve/reject audit trail
4. Ensuring all RLS policies are complete
5. Verifying storage buckets exist

All changes are **minimal**, **surgical**, and **defensive** - designed to prevent crashes while maintaining existing functionality.
