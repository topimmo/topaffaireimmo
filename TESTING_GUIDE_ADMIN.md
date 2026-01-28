# Testing Guide for Admin/User Listing Management System

## Quick Start Testing

This guide helps you test the newly implemented admin/user listing management system.

## Prerequisites

1. Supabase project configured
2. Migrations applied (especially migration 050)
3. At least one test user account

## Step-by-Step Testing

### 1. Apply Database Migrations

```bash
# If using Supabase CLI
npx supabase db push

# Or apply migration 050 manually via Supabase SQL Editor
```

### 2. Create Your First Admin User

**Option A: Via Supabase SQL Editor (Recommended)**

```sql
-- 1. Find your user UUID
SELECT id, email FROM auth.users WHERE email = 'your-admin-email@example.com';

-- 2. Copy the UUID from step 1 and insert into admins table
INSERT INTO public.admins (user_id) 
VALUES ('paste-uuid-here');

-- 3. Verify
SELECT a.user_id, u.email, a.created_at
FROM public.admins a
JOIN auth.users u ON u.id = a.user_id;
```

**Option B: Programmatically (if you have service role key)**

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service role, not anon key!
)

const { data, error } = await supabaseAdmin
  .from('admins')
  .insert({ user_id: 'user-uuid-here' })
```

### 3. Test Normal User Flow

#### 3.1. Sign Up as Normal User

1. Navigate to `/register`
2. Create a new account with a different email
3. Confirm email if required
4. Should redirect to `/` (homepage)

#### 3.2. Create a Listing

1. Log in as the normal user
2. Click "Publier gratuitement" or navigate to `/add-listing`
3. Fill out the form:
   - Select property type
   - Select announcer type (Propriétaire/Courtier/Agence)
   - Fill required fields
   - Upload images (max 6)
4. Submit the form
5. **Expected**: Listing created with status "pending"
6. Redirects to `/dashboard`

#### 3.3. View Dashboard

1. Should see only your own listings
2. Listing should show status badge: "En attente" (Pending)
3. Should be able to edit and delete your listings
4. **Should NOT** see admin link in header

#### 3.4. Try to Access Admin Area

1. Navigate to `/admin` directly
2. **Expected**: Redirected to `/` (home page)
3. No admin link should appear in the header dropdown

### 4. Test Admin Flow

#### 4.1. Log In as Admin

1. Log out from normal user account
2. Log in with the admin email you configured
3. **Expected**: Admin link appears in header dropdown menu
4. Header should show "Administration" option

#### 4.2. Access Admin Dashboard

1. Click "Administration" link in header or navigate to `/admin`
2. **Expected**: See admin dashboard with stats:
   - Pending Listings
   - Approved Listings
   - Rejected Listings
   - Total Listings

#### 4.3. View All Listings

1. Click "View Listings" or navigate to `/admin/listings`
2. **Expected**: See ALL listings (from all users)
3. Can filter by status: pending/approved/rejected/all
4. Should see listings from the normal user you created

#### 4.4. Approve a Listing

1. Find a pending listing
2. Click "View" or listing title
3. Click "Approve" button
4. **Expected**: 
   - Status changes to "approved"
   - Success message appears
   - Listing now visible on public pages

#### 4.5. Test Status Protection

1. Log out from admin account
2. Log in as normal user
3. Go to your dashboard
4. Try to edit your listing
5. **Expected**: Can edit content BUT status remains the same
6. Status change is blocked by database trigger

### 5. Test Image Upload

#### 5.1. Normal User Upload

1. Log in as normal user
2. Create a new listing
3. Upload images (JPG, PNG, or WebP, max 5MB each)
4. **Expected**: Images upload to `property-images/{user-id}/...`
5. Can upload max 6 images
6. Images show in preview

#### 5.2. Admin Image Management

1. Log in as admin
2. View any user's listing details
3. Should be able to see all images
4. Can delete images if needed

### 6. Test RLS Policies

#### 6.1. Properties Visibility

**As Normal User:**
```sql
-- This query should return only your listings
SELECT * FROM properties WHERE owner_id = auth.uid();
```

**As Admin:**
```sql
-- This query should return ALL listings
SELECT * FROM properties;
```

#### 6.2. Storage Access

**Test user folder isolation:**
1. Upload image as User A
2. Log in as User B
3. User B should NOT be able to delete User A's images via UI
4. RLS prevents unauthorized access

**Test admin access:**
1. Log in as admin
2. Should be able to view all images in admin panel
3. Can delete any user's images

### 7. Verification Checklist

- [ ] Normal users can sign up and create listings
- [ ] Normal users see ONLY their own listings in dashboard
- [ ] Normal users CANNOT access /admin
- [ ] Admin link appears ONLY for admin users
- [ ] Admin can see ALL listings in admin panel
- [ ] Admin can approve/reject listings
- [ ] Status changes are blocked for normal users (enforced by trigger)
- [ ] Image uploads work for authenticated users
- [ ] Users can only upload to their own folder
- [ ] Admin can access all images
- [ ] No TypeScript or build errors
- [ ] No console errors in browser

### 8. Common Issues and Solutions

#### Issue: "Cannot read property 'id' of null"
**Solution**: User not authenticated. Make sure you're logged in.

#### Issue: Admin link doesn't appear
**Solution**: 
- Verify user is in admins table: `SELECT * FROM admins WHERE user_id = 'your-user-id'`
- Clear browser cache and hard reload
- Check browser console for errors

#### Issue: "Permission denied" on listing creation
**Solution**: 
- Verify RLS policies are applied
- Check if `owner_id` defaults to `auth.uid()` in properties table
- Ensure user is authenticated

#### Issue: Status changes not blocked
**Solution**: 
- Verify trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'protect_property_status_trigger'`
- Check trigger function exists: `SELECT * FROM pg_proc WHERE proname = 'protect_property_status'`

#### Issue: Image upload fails
**Solution**: 
- Check file size (max 5MB)
- Check file type (JPG, PNG, WebP only)
- Verify storage bucket `property-images` exists
- Check storage RLS policies

### 9. Performance Testing

1. Create 50+ listings as different users
2. Test admin panel pagination
3. Verify query performance on listings page
4. Check image loading times

### 10. Security Testing

1. Try to access another user's listing edit page
2. Try to change status via browser developer tools
3. Try to upload images to another user's folder
4. Verify all attempts are blocked by RLS

## Success Criteria

✅ All tests pass without errors
✅ Normal users isolated to their own data
✅ Admin has full visibility and control
✅ No security bypasses possible
✅ Clean UI with no console errors
✅ Good performance even with many listings

## Reporting Issues

If you encounter any issues during testing:

1. Check browser console for errors
2. Check Supabase logs for database errors
3. Verify migrations were applied correctly
4. Document the exact steps to reproduce
5. Include error messages and screenshots

## Next Steps After Testing

Once testing is complete and successful:

1. Create production admin users
2. Configure email notifications (optional)
3. Set up monitoring for RLS policy violations
4. Document any custom workflows
5. Train team members on admin panel usage

---

For detailed system documentation, see [ADMIN_SYSTEM_GUIDE.md](./ADMIN_SYSTEM_GUIDE.md)
