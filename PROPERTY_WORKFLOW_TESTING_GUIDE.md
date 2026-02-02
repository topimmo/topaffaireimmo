# Property Workflow Testing Guide

This document provides testing scenarios to validate the property listing security and workflow implementation.

## Testing Checklist

### 1. Database Migration Testing

**Test Migration Execution:**
```sql
-- Check status constraint
SELECT 
  conname,
  pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'properties'::regclass 
AND conname LIKE '%status%';

-- Verify is_archived column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name = 'is_archived';

-- Check data migration
SELECT status, is_archived, COUNT(*) 
FROM properties 
GROUP BY status, is_archived 
ORDER BY status;

-- Verify RLS policies
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'properties' 
ORDER BY policyname;

-- Check trigger exists
SELECT tgname, tgenabled, tgtype 
FROM pg_trigger 
WHERE tgrelid = 'properties'::regclass 
AND tgname = 'protect_property_status_trigger';
```

### 2. Advertiser Workflow Testing

**Scenario A: Create Draft Listing**
1. Navigate to `/add-listing`
2. Fill in all required fields
3. Click "Enregistrer comme brouillon" (Save Draft)
4. Expected: Listing created with `status = 'draft'`
5. Expected: Can edit the listing from dashboard

**Scenario B: Submit for Review**
1. Navigate to `/add-listing`
2. Fill in all required fields
3. Click "Soumettre pour révision" (Submit for Review)
4. Expected: Listing created with `status = 'pending'`
5. Expected: Cannot edit the listing from dashboard

**Scenario C: Edit Draft Listing**
1. From dashboard, click Edit on a draft listing
2. Expected: Edit form loads without locked message
3. Change some fields and save
4. Expected: Changes saved successfully

**Scenario D: Try to Edit Pending Listing**
1. From dashboard, locate a pending listing
2. Expected: Edit button is disabled/grayed out
3. Try to navigate to `/edit-listing/{id}` directly
4. Expected: See locked message banner
5. Expected: All form inputs are disabled
6. Expected: Submit button is disabled and shows "Annonce verrouillée"

**Scenario E: Edit Rejected Listing**
1. Admin rejects a listing with reason
2. Advertiser sees "rejected" status in dashboard
3. Click Edit button
4. Expected: Edit form loads without locked message
5. Make changes and save
6. Expected: Changes saved, status remains "rejected"

**Scenario F: Try to Change Status**
1. Edit a draft listing
2. Try to manually change status via browser console:
   ```javascript
   await supabase.from('properties').update({ status: 'approved' }).eq('id', 'listing-id')
   ```
3. Expected: Trigger blocks the change or RLS policy prevents it
4. Expected: Error message about admin-only permission

**Scenario G: Try to Delete Locked Listing**
1. From dashboard, locate a pending/published listing
2. Expected: Delete button is disabled
3. Try to delete via API:
   ```javascript
   await supabase.from('properties').delete().eq('id', 'listing-id')
   ```
4. Expected: RLS policy blocks the deletion

### 3. Admin Workflow Testing

**Scenario H: Approve and Publish Listing**
1. Navigate to Admin → Listings
2. Click on a pending listing
3. Click "Approuver et publier" (Approve and Publish)
4. Expected: Status changes to `published`
5. Expected: `approved_at`, `approved_by`, `published_at` fields are set
6. Expected: `is_archived = false`
7. Verify public can see the listing on home page

**Scenario I: Reject Listing**
1. Navigate to Admin → Listings
2. Click on a pending listing
3. Click "Rejeter" (Reject)
4. Expected: Status changes to `rejected`
5. Expected: `rejected_at`, `rejected_by` fields are set
6. Expected: Advertiser can now edit the listing

**Scenario J: Archive/Unpublish Listing**
1. Navigate to Admin → Listings
2. Click on a published listing
3. Click "Archiver / Dépublier" (Archive/Unpublish)
4. Expected: Status changes to `archived`
5. Expected: `is_archived = true`
6. Verify public cannot see the listing
7. Verify advertiser can still see it in dashboard but cannot edit

**Scenario K: Republish Archived Listing**
1. Navigate to Admin → Listings
2. Click on an archived listing
3. Click "Republier" (Republish)
4. Expected: Status changes to `published`
5. Expected: `is_archived = false`
6. Verify public can see the listing again

**Scenario L: Admin Edit Any Listing**
1. Navigate to Admin → Listings
2. Click on any listing (draft/pending/published/rejected/archived)
3. Modify fields directly in admin interface (if available)
4. Expected: Admin can modify any field including status
5. Verify RLS policy allows admin updates

### 4. RLS Policy Testing

**Test SELECT Policies:**
```sql
-- As anonymous user (should only see published, not archived)
SELECT id, status, is_archived FROM properties;

-- As advertiser (should see own listings)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub = '<advertiser-user-id>';
SELECT id, status, is_archived FROM properties;

-- As admin (should see all listings)
SET LOCAL request.jwt.claims.sub = '<admin-user-id>';
SELECT id, status, is_archived FROM properties;
```

**Test INSERT Policies:**
```sql
-- As advertiser, try to insert with owner_id != auth.uid()
-- Expected: FAIL
INSERT INTO properties (owner_id, status, ...) 
VALUES ('<different-user-id>', 'draft', ...);

-- As advertiser, try to insert with status = 'published'
-- Expected: FAIL
INSERT INTO properties (owner_id, status, ...) 
VALUES (auth.uid(), 'published', ...);

-- As advertiser, insert with status = 'draft'
-- Expected: SUCCESS
INSERT INTO properties (owner_id, status, ...) 
VALUES (auth.uid(), 'draft', ...);
```

**Test UPDATE Policies:**
```sql
-- As advertiser, try to update own listing with status = 'pending'
-- Expected: FAIL (blocked by RLS)
UPDATE properties 
SET title_fr = 'New title' 
WHERE id = '<listing-id>' AND status = 'pending';

-- As advertiser, update own listing with status = 'draft'
-- Expected: SUCCESS
UPDATE properties 
SET title_fr = 'New title' 
WHERE id = '<listing-id>' AND status = 'draft';

-- As advertiser, try to change status to 'approved'
-- Expected: FAIL (WITH CHECK constraint)
UPDATE properties 
SET status = 'approved' 
WHERE id = '<listing-id>';

-- As admin, update any listing
-- Expected: SUCCESS
UPDATE properties 
SET status = 'published' 
WHERE id = '<any-listing-id>';
```

**Test DELETE Policies:**
```sql
-- As advertiser, try to delete own listing with status = 'pending'
-- Expected: FAIL
DELETE FROM properties WHERE id = '<pending-listing-id>';

-- As advertiser, delete own listing with status = 'draft'
-- Expected: SUCCESS
DELETE FROM properties WHERE id = '<draft-listing-id>';

-- As admin, delete any listing
-- Expected: SUCCESS
DELETE FROM properties WHERE id = '<any-listing-id>';
```

### 5. Frontend UI Testing

**Dashboard Page:**
- [ ] Status badges show correct colors for all statuses
- [ ] Edit button enabled for draft/rejected listings
- [ ] Edit button disabled for pending/approved/published/archived listings
- [ ] Delete button enabled for draft/rejected listings
- [ ] Delete button disabled for other statuses
- [ ] Tooltips show on disabled buttons
- [ ] Status labels translated correctly (FR/AR)

**EditListing Page:**
- [ ] Locked banner appears for pending/approved/published/archived listings
- [ ] All form inputs disabled when locked
- [ ] Submit button disabled and shows lock icon when locked
- [ ] Transaction type buttons disabled when locked
- [ ] Property type buttons disabled when locked
- [ ] No console errors when loading locked listing
- [ ] maybeSingle() used, handles null responses gracefully
- [ ] Toast notifications show appropriate messages

**AddListing Page:**
- [ ] Two buttons visible: "Save Draft" and "Submit for Review"
- [ ] "Save Draft" creates listing with status = 'draft'
- [ ] "Submit for Review" creates listing with status = 'pending'
- [ ] Both buttons work correctly
- [ ] Status field sent correctly to database

**AdminListingDetail Page:**
- [ ] "Approuver et publier" button visible for pending listings
- [ ] "Rejeter" button visible for pending listings
- [ ] "Archiver / Dépublier" button visible for published listings
- [ ] "Republier" button visible for archived listings
- [ ] Status changes update approved_at/approved_by fields
- [ ] Status changes update is_archived field
- [ ] No console errors on admin pages
- [ ] Delete button works for all statuses

### 6. Error Handling Testing

**Test Error Messages:**
- [ ] Graceful handling when listing not found
- [ ] Clear error message when permission denied
- [ ] Toast notifications for all state changes
- [ ] No crashes on null/undefined data
- [ ] Proper redirect when unauthorized

**Test Edge Cases:**
- [ ] Concurrent updates (two admins editing same listing)
- [ ] Rapid status changes
- [ ] Invalid status values
- [ ] Missing required fields
- [ ] Large number of images
- [ ] Network errors during status change

## Success Criteria

✅ All RLS policies prevent unauthorized access
✅ Advertisers cannot edit listings after submission
✅ Advertisers can edit draft and rejected listings
✅ Admins can manage all listings and all statuses
✅ Status workflow enforced at database level (trigger)
✅ Frontend UI reflects status correctly
✅ No console errors in any page
✅ Proper error messages and user feedback
✅ Defensive null checks prevent crashes
✅ Status transitions logged with timestamps and user IDs

## Common Issues & Solutions

### Issue: Advertiser can still edit pending listing
**Solution:** Check RLS policy is enabled and trigger is active:
```sql
SELECT tablename, relrowsecurity 
FROM pg_tables t 
JOIN pg_class c ON t.tablename = c.relname 
WHERE tablename = 'properties';
```

### Issue: Admin cannot approve listing
**Solution:** Verify user is in admins table:
```sql
SELECT * FROM admins WHERE user_id = '<admin-user-id>';
```

### Issue: Status badge shows wrong color
**Solution:** Check statusColors mapping in Dashboard.tsx includes all status values

### Issue: Migration fails
**Solution:** Check existing status values don't conflict with new constraint:
```sql
SELECT DISTINCT status FROM properties WHERE status NOT IN ('draft', 'pending', 'approved', 'published', 'rejected', 'archived');
```

## Test Data Setup

To create test data for different scenarios:

```sql
-- Create draft listing
INSERT INTO properties (owner_id, status, title_fr, title_ar, city_id, transaction_type, property_type, price)
VALUES (auth.uid(), 'draft', 'Test Draft', 'اختبار مسودة', 1, 'sale', 'apartment', 100000);

-- Create pending listing
INSERT INTO properties (owner_id, status, title_fr, title_ar, city_id, transaction_type, property_type, price)
VALUES (auth.uid(), 'pending', 'Test Pending', 'اختبار معلق', 1, 'sale', 'apartment', 100000);

-- Create published listing (as admin)
INSERT INTO properties (owner_id, status, title_fr, title_ar, city_id, transaction_type, property_type, price, approved_at, published_at, is_archived)
VALUES (auth.uid(), 'published', 'Test Published', 'اختبار منشور', 1, 'sale', 'apartment', 100000, NOW(), NOW(), false);

-- Create rejected listing (as admin)
INSERT INTO properties (owner_id, status, title_fr, title_ar, city_id, transaction_type, property_type, price, rejected_at, rejection_reason)
VALUES (auth.uid(), 'rejected', 'Test Rejected', 'اختبار مرفوض', 1, 'sale', 'apartment', 100000, NOW(), 'Incomplete information');

-- Create archived listing (as admin)
INSERT INTO properties (owner_id, status, title_fr, title_ar, city_id, transaction_type, property_type, price, is_archived)
VALUES (auth.uid(), 'archived', 'Test Archived', 'اختبار مؤرشف', 1, 'sale', 'apartment', 100000, true);
```

## Automated Test Script

Here's a basic test script to verify RLS policies:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRLS() {
  // Test 1: Public can only see published
  const { data: publicData } = await supabase
    .from('properties')
    .select('id, status');
  
  console.assert(
    publicData.every(p => p.status === 'published'),
    'Public should only see published listings'
  );

  // Test 2: Advertiser cannot update pending listing
  await supabase.auth.signInWithPassword({ email, password });
  
  const { error } = await supabase
    .from('properties')
    .update({ title_fr: 'New Title' })
    .eq('status', 'pending');
  
  console.assert(
    error !== null,
    'Advertiser should not be able to update pending listing'
  );

  // Add more tests...
}

testRLS();
```
