# Profile Dependency Removal - Summary & Testing Guide

## 🎯 Objective
Remove all dependencies on the `profiles` table from the application, making it work solely with `auth.users` session data. This fixes the "Erreur de chargement du profil" error and enables photo upload functionality.

## 📝 Changes Made

### 1. Authentication Context (`src/contexts/AuthContext.tsx`)
**Before:**
- Fetched profile data from `profiles` table on login
- Provided `profile`, `profileLoading` to consuming components
- Created user identity from profile data

**After:**
- No profile fetch
- Only provides `user`, `session`, `loading` from Supabase auth
- User identity comes from `session.user.id` and `session.user.email`

### 2. Registration (`src/pages/Register.tsx`)
**Status:** ✅ Already simplified
- Only requires: email, password, confirmPassword
- No additional metadata collection
- No profile creation trigger (removed in migration 048)

### 3. Login (`src/pages/Login.tsx`)
**Before:**
- Fetched profile after login
- Redirected based on `user_role` from profile
- Complex role-based routing

**After:**
- Simple redirect to home or `from` location
- No profile fetch
- No role-based logic

### 4. Protected Routes (`src/components/ProtectedRoute.tsx`)
**Before:**
- Checked user role from profile
- Enforced role-based access control
- Required profile to be loaded

**After:**
- Only checks if user is authenticated
- No role enforcement
- All authenticated users can access protected routes

### 5. Add Listing Page (`src/pages/AddListing.tsx`)
**Critical Changes:**
- ✅ Removed profile dependency from auth context
- ✅ Removed `profileLoading` checks
- ✅ Removed permission validation based on profile
- ✅ **Announcer Type** now stored on listing, not user:
  - Field: `formData.advertiserType` (owner/broker/agency)
  - Stored in: `properties.advertiser_type` column
  - Default: 'owner'
  - User selects when creating listing

**Photo Upload:**
- Uses `user.id` directly from auth session
- No profile required
- Storage path: `property-images/{userId}/{folder}/{filename}`
- Validation: max 6 images, 5MB each, JPEG/PNG/WebP
- Creates blob preview URLs for UI

### 6. Dashboard (`src/pages/Dashboard.tsx`)
**Before:**
- Showed profile name
- Checked profile role for redirects

**After:**
- Shows `user.email` in greeting
- No role-based redirects
- Fetches properties by `owner_id = user.id`

### 7. Header Navigation (`src/components/layout/Header.tsx`)
**Before:**
- Different menus for different user roles
- Admin/merchant/agent specific items
- Profile-based display name

**After:**
- Same menu for all authenticated users
- Shows Dashboard + Add Listing links
- Display name from `user.email`

### 8. Edit Listing (`src/pages/EditListing.tsx`)
**Changes:**
- Removed profile validation
- Removed role-based permission checks
- Any authenticated user can edit their own listings

### 9. Auth Callback (`src/pages/AuthCallback.tsx`)
**Changes:**
- Removed role-based redirect after email confirmation
- All users redirect to home page
- No profile dependency

## 🗄️ Database Changes

### Migration 049: `supabase/migrations/049_remove_profile_dependency_from_rls.sql`

**Properties Table:**
```sql
-- Foreign key now references auth.users instead of profiles
ALTER TABLE properties 
  DROP CONSTRAINT properties_owner_id_fkey;
  
ALTER TABLE properties 
  ADD CONSTRAINT properties_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Default owner_id to current user
ALTER TABLE properties 
  ALTER COLUMN owner_id SET DEFAULT auth.uid();
```

**RLS Policies Updated:**
```sql
-- Old: Required profile with specific user_role
-- New: Any authenticated user can insert
CREATE POLICY "properties_insert_authenticated" ON properties
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    owner_id = auth.uid()
  );

-- Users can view approved properties or their own
CREATE POLICY "properties_select_public" ON properties
  FOR SELECT USING (
    status = 'approved' OR 
    owner_id = auth.uid()
  );

-- Users can update/delete their own properties
CREATE POLICY "properties_update_own" ON properties
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "properties_delete_own" ON properties
  FOR DELETE USING (owner_id = auth.uid());
```

**Storage Bucket Policies:**
```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "property_images_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-images' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read for property images
CREATE POLICY "property_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');

-- Users can delete their own images
CREATE POLICY "property_images_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-images' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

**Announcer Type Column:**
- Already exists in `properties` table from migration 020
- Type: `TEXT`
- Constraint: `CHECK (advertiser_type IN ('owner', 'broker', 'agency'))`
- Default: `'owner'`

## 🧪 Manual Testing Checklist

### Test 1: User Registration
1. Navigate to `/register`
2. Fill in:
   - Email: `test@example.com`
   - Password: `test123456`
   - Confirm Password: `test123456`
3. Submit form
4. ✅ Expected: "Compte créé avec succès!" message
5. ✅ Expected: Email confirmation prompt
6. Check Supabase dashboard:
   - ✅ User exists in `auth.users` table
   - ✅ NO row in `profiles` table (this is correct!)

### Test 2: Email Confirmation
1. Click confirmation link from email
2. ✅ Expected: Redirect to `/auth/callback`
3. ✅ Expected: "Email confirmed successfully!" message
4. ✅ Expected: Redirect to home page (`/`)
5. ✅ Expected: User is logged in

### Test 3: User Login
1. Navigate to `/login`
2. Enter credentials
3. Submit form
4. ✅ Expected: Redirect to home page or previous `from` location
5. ✅ Expected: No "Erreur de chargement du profil" error
6. ✅ Expected: Header shows user email

### Test 4: Access Add Listing Page
1. While logged in, navigate to `/add-listing`
2. ✅ Expected: Page loads without errors
3. ✅ Expected: NO "Erreur de chargement du profil" message
4. ✅ Expected: Form displays with all fields
5. ✅ Expected: "Type d'annonceur" dropdown shows:
   - Propriétaire (owner)
   - Courtier (broker)
   - Agence (agency)

### Test 5: Photo Upload
1. On add-listing page, click "Upload Images" button
2. Select 1 image (< 5MB, JPEG/PNG/WebP)
3. ✅ Expected: Image preview appears
4. ✅ Expected: No permission errors
5. Try uploading 6 more images (total 7)
6. ✅ Expected: Error message "Maximum 6 images autorisées"
7. Try uploading a file > 5MB
8. ✅ Expected: Error message about file size
9. Try uploading a .txt file
10. ✅ Expected: Error message about file type

### Test 6: Create Listing
1. Fill in all required fields:
   - Transaction type: Sale/Rent
   - Property type: Apartment/House/Villa/Commercial/Land
   - **Announcer Type: Select "Propriétaire"** (this is new!)
   - City: Select from dropdown
   - Neighborhood: Select from dropdown
   - Price: Enter amount
   - Title (FR): Enter title
   - Title (AR): Enter title
   - Description (FR): Enter description
   - Phone: Enter phone (optional)
2. Upload 2-3 images
3. Submit form
4. ✅ Expected: "Annonce créée avec succès!" message
5. Check Supabase dashboard:
   ```sql
   SELECT id, owner_id, advertiser_type, images, status 
   FROM properties 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
   - ✅ `owner_id` matches current `auth.uid()`
   - ✅ `advertiser_type` = 'owner' (what you selected)
   - ✅ `images` array contains Supabase storage URLs
   - ✅ `status` = 'pending'
6. Check Supabase Storage:
   - Navigate to `property-images` bucket
   - ✅ Folder exists for user: `{userId}/`
   - ✅ Images uploaded to correct path

### Test 7: Dashboard Access
1. Navigate to `/dashboard`
2. ✅ Expected: Page loads without errors
3. ✅ Expected: Greeting shows email: "Bienvenue, {email}"
4. ✅ Expected: Listings display (if any created)
5. ✅ Expected: "Add New" button works

### Test 8: Edit Listing
1. From dashboard, click "Edit" on a listing
2. ✅ Expected: Edit page loads without errors
3. Change title and upload 1 more image
4. Submit
5. ✅ Expected: Updates saved successfully
6. ✅ Expected: No permission errors

### Test 9: Logout and Login Again
1. Logout using header dropdown
2. Login again with same credentials
3. ✅ Expected: Login successful
4. ✅ Expected: Dashboard shows previous listings
5. ✅ Expected: Can edit/delete own listings

## 🐛 Known Issues (Non-Critical)

### Admin Pages Still Reference Profile
The following pages still use profile but are NOT part of the main user flow:
- `src/components/layout/AdminLayout.tsx`
- `src/pages/AdminPanel.tsx`
- `src/pages/Advertising.tsx`
- `src/pages/CommercialDashboard.tsx`
- `src/pages/NewAdRequest.tsx`

**Impact:** Low - These are admin/commercial features
**Action:** Can be fixed in follow-up if admin panel is needed

## 📊 Database Verification Queries

### Check Auth Users (should have users)
```sql
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
```

### Check Profiles (should be empty or optional)
```sql
SELECT id, email, user_role, announcer_type 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;
```

### Check Properties
```sql
SELECT 
  p.id, 
  p.owner_id,
  p.advertiser_type,  -- NEW: stored per listing
  p.property_type,
  p.price,
  p.status,
  array_length(p.images, 1) as image_count,
  p.created_at
FROM properties p
ORDER BY p.created_at DESC 
LIMIT 5;
```

### Check RLS Policies
```sql
-- Properties policies
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies 
WHERE tablename = 'properties'
ORDER BY policyname;

-- Storage policies
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
```

### Check Foreign Keys
```sql
-- Should reference auth.users, not profiles
SELECT 
  conname,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table,
  a.attname AS column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE conname LIKE '%owner_id%'
  AND conrelid::regclass::text = 'properties';
```

## 🔄 Rollback Plan

If issues are found and rollback is needed:

1. **Code Rollback:**
   ```bash
   git revert e2d7a1f 7f0e2d2 bd2563a
   ```

2. **Database Rollback:**
   - Restore foreign key to profiles:
     ```sql
     ALTER TABLE properties DROP CONSTRAINT properties_owner_id_fkey;
     ALTER TABLE properties ADD CONSTRAINT properties_owner_id_fkey 
       FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;
     ```
   - Restore old RLS policies (see migration 020)
   - Re-enable profile trigger if needed

3. **Re-deploy previous version**

## ✅ Success Criteria

The implementation is successful if:
- [x] Build completes without TypeScript errors
- [ ] User can register with email + password only
- [ ] User can login without profile errors
- [ ] User can access add-listing page
- [ ] User can upload 1-6 photos (max 5MB each)
- [ ] User can create listing with announcer_type selection
- [ ] Listing is saved with correct owner_id, advertiser_type, and image URLs
- [ ] Photos are stored in correct storage path
- [ ] User can view their listings in dashboard
- [ ] User can edit their own listings

## 📞 Support

For issues or questions about this implementation:
1. Check error messages in browser console
2. Check Supabase logs for database/storage errors
3. Verify RLS policies are applied correctly
4. Check that migration 049 was run successfully

---

**Implementation Date:** 2026-01-28
**Migration Version:** 049
**Status:** ✅ Ready for Testing
