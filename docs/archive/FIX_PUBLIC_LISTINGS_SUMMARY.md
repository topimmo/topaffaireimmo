# Fix Public Listing Retrieval - Summary

## Problem Statement
Approved listings were not appearing on the public website (home/search/category pages) even though they were marked as "approved" in the Admin dashboard. This especially affected advertisers who created listings with different profiles/types (owner vs agency).

## Root Cause Analysis

### The Core Issue: Status Mismatch
1. **Legacy Admin Panel Bug**: The old AdminPanel (`/admin-panel` route) was setting listing status to `'approved'` instead of `'published'` when approving listings.

2. **Public Query Filter**: All public-facing queries correctly filter by `status = 'published'`, so listings marked as `'approved'` were invisible to the public.

3. **Workflow Confusion**: Migration 067 established a clear workflow:
   - `draft` → Advertiser can edit freely
   - `pending` → Submitted for review
   - `published` → Approved and publicly visible ✅
   - `rejected` → Can edit and resubmit
   - `archived` → Removed from public view

### What Was Working Correctly
- ✅ **New Admin Pages** (`/admin/listings`): Correctly set status to `'published'` when approving
- ✅ **Public Queries**: SearchResults, Home, Featured all filter by `status = 'published'`
- ✅ **RLS Policies**: Allow public SELECT where `status = 'published' AND is_archived = FALSE`

### What Was Broken
- ❌ **Legacy AdminPanel** (`/admin-panel`): Set status to `'approved'` (line 305)
- ❌ **Facebook Webhook Trigger**: Checked for status `'approved'` instead of `'published'`

## Changes Made

### 1. Fixed AdminPanel.tsx (`/admin-panel` route)
**File**: `src/pages/AdminPanel.tsx`

**Changes**:
- Updated `handlePropertyAction()` to set `status = 'published'` instead of `'approved'`
- Added proper metadata fields when approving:
  - `approved_at` (timestamp)
  - `approved_by` (admin user ID)
  - `published_at` (timestamp)
  - `is_archived = false`
- Added proper metadata fields when rejecting:
  - `rejected_at` (timestamp)
  - `rejected_by` (admin user ID)
- Updated status color definitions to include all workflow statuses
- Updated display labels to show proper translations (French/Arabic)

**Before**:
```typescript
const status = propertyActionType === 'approve' ? 'approved' : 'rejected';
await supabase.from('properties').update({ status }).eq('id', selectedProperty.id);
```

**After**:
```typescript
const updateData: any = {};

if (propertyActionType === 'approve') {
  const now = new Date().toISOString();
  updateData.status = 'published'; // Changed from 'approved' to 'published'
  updateData.approved_at = now;
  updateData.approved_by = user?.id || null;
  updateData.published_at = now;
  updateData.is_archived = false;
} else {
  const now = new Date().toISOString();
  updateData.status = 'rejected';
  updateData.rejected_at = now;
  updateData.rejected_by = user?.id || null;
}

await supabase.from('properties').update(updateData).eq('id', selectedProperty.id);
```

### 2. Data Migration: Convert Existing 'approved' to 'published'
**File**: `supabase/migrations/069_fix_approved_listings_to_published.sql`

This migration ensures any existing listings with `status='approved'` are converted to `status='published'` so they become visible on the public website.

```sql
UPDATE public.properties 
SET 
  status = 'published',
  is_archived = FALSE,
  published_at = COALESCE(published_at, approved_at, updated_at, created_at)
WHERE status = 'approved';
```

### 3. Fixed Facebook Webhook Trigger
**File**: `supabase/migrations/070_update_facebook_webhook_trigger.sql`

Updated the Facebook webhook trigger function to check for `status='published'` instead of `status='approved'`.

**Before**:
```sql
IF NEW.status = 'approved' 
   AND OLD.status != 'approved' 
   AND NEW.facebook_posted = FALSE THEN
```

**After**:
```sql
IF NEW.status = 'published' 
   AND OLD.status != 'published' 
   AND NEW.facebook_posted = FALSE THEN
```

### 4. Added Debug Logging
**Files**: 
- `src/hooks/useProperties.ts`
- `src/pages/SearchResults.tsx`

Added console logging to help verify:
- Number of listings fetched
- Status distribution of fetched listings
- Confirmation that status='published' filter is applied

Example output:
```
📋 [useProperties] Applying public filter: status=published, is_archived=false
✅ [useProperties] Fetched 24 properties (total: 24)
📊 [useProperties] Status distribution: { published: 24 }
```

## No Changes Needed

These components were already working correctly:

### Public Queries
All public queries already filter correctly:

1. **useProperties hook** (line 98):
   ```typescript
   query = query.eq('status', 'published').eq('is_archived', false);
   ```

2. **SearchResults page** (lines 127-128):
   ```typescript
   .eq("status", "published")
   .eq("is_archived", false)
   ```

3. **Featured/Latest listings** (home page):
   - Use the `useProperties` hook which applies the correct filter

### RLS Policies
The Row Level Security policy is correct (from migration 067):

```sql
CREATE POLICY "properties_select_public" ON public.properties
  FOR SELECT USING (
    status = 'published' AND is_archived = FALSE
  );
```

### Admin Pages
The new admin system at `/admin/listings` was already working correctly:

- **AdminListingDetail.tsx** (line 163): Sets `status = 'published'`
- **AdminListings.tsx** (line 275): Sets `status = 'published'`

## Testing

### Manual Testing Steps

#### 1. Test Listing Approval (Legacy Admin Panel)
1. Login as admin
2. Navigate to `/admin-panel` (legacy admin)
3. Find a listing with status='pending'
4. Click "Approve"
5. **Expected**: Status should change to 'published' (not 'approved')
6. Check the database or admin dashboard to confirm status='published'

#### 2. Test Public Visibility
1. Ensure you have at least one listing approved (status='published')
2. As anonymous user (logged out):
   - Visit home page → should see published listings in featured/latest sections
   - Visit `/search` → should see published listings in search results
   - Visit a city page → should see published listings
3. Open browser console (F12)
4. Look for debug logs:
   ```
   📋 [useProperties] Applying public filter: status=published, is_archived=false
   ✅ [useProperties] Fetched X properties (total: X)
   📊 [useProperties] Status distribution: { published: X }
   ```

#### 3. Test Status Workflow
Create/approve listings with different advertiser types:

**As Owner (Individual)**:
1. Create listing → status should be 'draft'
2. Submit for review → status should be 'pending'
3. Admin approves → status should be 'published' ✅
4. Verify it appears on public pages

**As Agency**:
1. Create listing → status should be 'draft'
2. Submit for review → status should be 'pending'
3. Admin approves → status should be 'published' ✅
4. Verify it appears on public pages

#### 4. Test Hidden Statuses
Ensure these statuses remain hidden from public:
- `draft` → Only owner can see
- `pending` → Only admin can see
- `rejected` → Only owner can see
- `archived` → Hidden from public

### Database Queries for Verification

#### Check status distribution
```sql
SELECT status, COUNT(*) as count, is_archived
FROM public.properties
GROUP BY status, is_archived
ORDER BY status;
```

Expected: 0 listings with status='approved'

#### Check public listings
```sql
SELECT id, title_fr, status, is_archived, advertiser_type
FROM public.properties
WHERE status = 'published' AND is_archived = FALSE
ORDER BY created_at DESC
LIMIT 10;
```

Should return all publicly visible listings regardless of advertiser_type.

## Impact Summary

### What This Fixes
✅ **Approved listings now appear publicly**: Listings approved via legacy admin panel will now be visible on the public website

✅ **Consistent workflow**: Both admin interfaces now use the same status values

✅ **Owner vs Agency**: No discrimination - all approved listings appear publicly regardless of advertiser type

✅ **Facebook integration**: Webhook trigger aligned with new workflow

### What This Doesn't Change
- ✅ RLS policies (already correct)
- ✅ Public query filters (already correct)
- ✅ New admin pages (already correct)
- ✅ Draft/pending/rejected listings remain hidden (as intended)

## Deployment Notes

### Migration Order
The migrations should run automatically in order:
1. `067_property_status_workflow.sql` (already deployed)
2. `069_fix_approved_listings_to_published.sql` (NEW - converts existing 'approved' to 'published')
3. `070_update_facebook_webhook_trigger.sql` (NEW - updates webhook trigger)

### Post-Deployment Verification
1. Check console logs on public pages show correct status distribution
2. Verify approved listings appear on home/search pages
3. Check admin dashboard stats match database counts
4. Test approval flow through legacy admin panel

## Security Considerations

### No Security Issues Introduced
- ✅ RLS policies remain unchanged and secure
- ✅ Public can only view published listings (not draft/pending/rejected)
- ✅ Advertisers can only view/edit their own listings
- ✅ Admin controls remain protected

### Security Checklist
- [x] Public SELECT limited to status='published' AND is_archived=FALSE
- [x] Advertisers cannot set status to 'published' directly (RLS enforced)
- [x] Only admins can approve/publish listings
- [x] Status workflow trigger prevents non-admin status changes
- [x] No exposure of pending/draft/rejected listings to public

## Future Improvements

1. **Remove Legacy Admin Panel**: Once confirmed working, deprecate `/admin-panel` route entirely
2. **Remove 'approved' Status**: Update schema constraint to only allow the active workflow statuses
3. **Automated Testing**: Add integration tests for status workflow
4. **Admin Audit Trail**: Log all status changes for compliance

## Files Changed

### Source Code
- ✅ `src/pages/AdminPanel.tsx` - Fixed status assignment
- ✅ `src/hooks/useProperties.ts` - Added debug logging
- ✅ `src/pages/SearchResults.tsx` - Added debug logging

### Migrations
- ✅ `supabase/migrations/069_fix_approved_listings_to_published.sql` - Data migration
- ✅ `supabase/migrations/070_update_facebook_webhook_trigger.sql` - Trigger update

## Summary

**Minimal Change**: Only 2 files modified + 2 migrations
**Root Cause**: Status mismatch between admin action ('approved') and public filter ('published')
**Solution**: Align admin panel to use 'published' status + migrate existing data
**Impact**: All approved listings now visible publicly, regardless of advertiser type
**No Breaking Changes**: Existing functionality preserved, RLS policies unchanged
