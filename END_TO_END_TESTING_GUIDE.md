# End-to-End User Journey Testing Guide

**Project:** TopAffaireImmo  
**Purpose:** Manual testing guide for complete user journeys  
**Date:** 2026-01-25

---

## Overview

This guide provides step-by-step instructions to manually test all critical user journeys in the TopAffaireImmo application. These tests should be performed before deploying to production and after any major changes.

---

## Prerequisites

### Required Setup
- [ ] Supabase project configured and migrations applied
- [ ] Vercel environment variables set correctly
- [ ] Application deployed to Vercel (or running locally)
- [ ] Test email account available for signup/login
- [ ] Browser DevTools open (Console tab) to monitor for errors

### Testing Environments

**Production:** `https://topaffaireimmo.vercel.app` (or custom domain)  
**Preview:** Vercel preview deployment URLs  
**Local:** `http://localhost:5173`

---

## Test Suite 1: User Registration & Profile Creation

### Test 1.1: New User Signup (Real Estate Advertiser)

**Objective:** Verify new users can sign up and profiles are auto-created.

**Steps:**
1. Navigate to `/register`
2. Fill out registration form:
   - Email: `test-realtor-[timestamp]@example.com`
   - Password: Strong password (min 6 chars)
   - Full Name: `Test Realtor`
   - Phone: `+212600000000`
   - User Role: Select "Annonceur Immobilier"
   - Company Name: Leave empty or enter "Test Agency"
3. Click "S'inscrire" (Register)
4. **Expected Results:**
   - ✅ Success message appears
   - ✅ Email confirmation sent (check inbox)
   - ✅ Console logs show:
     - "✅ SIGNUP API CALL SUCCESSFUL"
     - "User created in Supabase Auth"
     - "Profile will be created automatically by database trigger"
   - ✅ No error messages in console
5. Confirm email (if email confirmation is enabled)
6. Log in with the new account
7. Navigate to `/dashboard`
8. **Expected Results:**
   - ✅ Dashboard loads successfully
   - ✅ User name appears in header
   - ✅ Console shows "✅ Profile loaded successfully"

**Database Verification:**
```sql
-- Run in Supabase SQL Editor
SELECT 
  au.id,
  au.email,
  au.created_at,
  p.id as profile_id,
  p.full_name,
  p.user_role,
  p.is_active
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'test-realtor-[timestamp]@example.com';
```

Expected: Both `au.id` and `p.id` should be populated (profile exists).

---

### Test 1.2: Profile Missing - Fallback Creation

**Objective:** Verify fallback profile creation works if trigger fails.

**Setup:**
1. Manually create a user in Supabase Dashboard without a profile (or temporarily disable the trigger)

**Steps:**
1. Log in with the user that has no profile
2. **Expected Results:**
   - ✅ Console shows: "⚠️ Profile not found for authenticated user"
   - ✅ Console shows: "✅ Fallback profile created successfully"
   - ✅ User can access dashboard
   - ✅ Profile appears in database

---

### Test 1.3: Commercial Advertiser Signup

**Objective:** Verify commercial advertisers are created correctly.

**Steps:**
1. Navigate to `/register`
2. Fill form with User Role: "Annonceur Commercial"
3. Sign up
4. Log in
5. **Expected Results:**
   - ✅ Redirected to `/commercial-dashboard` (not `/dashboard`)
   - ✅ Cannot access `/add-listing` (should redirect)
   - ✅ Can access `/advertising`

---

## Test Suite 2: Authentication & Session Persistence

### Test 2.1: Login & Logout

**Objective:** Verify login/logout flow works correctly.

**Steps:**
1. Navigate to `/login`
2. Enter valid credentials
3. Click "Se connecter"
4. **Expected Results:**
   - ✅ Console shows: "✅ SIGNIN SUCCESSFUL"
   - ✅ Redirected to dashboard
   - ✅ User name appears in header
5. Click logout button
6. **Expected Results:**
   - ✅ Redirected to home page
   - ✅ User name disappears from header
   - ✅ Accessing `/dashboard` redirects to `/login`

---

### Test 2.2: Session Persistence Across Page Refresh

**Objective:** Verify session persists after refreshing the page.

**Steps:**
1. Log in as a real estate advertiser
2. Navigate to `/dashboard`
3. **Hard refresh the page** (Ctrl+F5 or Cmd+Shift+R)
4. **Expected Results:**
   - ✅ Session persists
   - ✅ User remains logged in
   - ✅ Dashboard loads successfully
   - ✅ Console shows: "📦 Session retrieved: Active session found"
   - ✅ Console shows: "✅ Profile loaded successfully"
   - ❌ NO redirect to login page
   - ❌ NO "Veuillez vous connecter" errors

**Verification in DevTools:**
- Open DevTools → Application → Local Storage
- Check for key: `topaffaireimmo-auth-token`
- Should contain session data (token, user info)

---

### Test 2.3: Session Persistence Across Browser Tabs

**Objective:** Verify session works across multiple tabs.

**Steps:**
1. Log in in Tab 1
2. Open new tab (Tab 2)
3. Navigate to `/dashboard` in Tab 2
4. **Expected Results:**
   - ✅ Automatically logged in
   - ✅ Dashboard loads successfully
5. Log out in Tab 1
6. Refresh Tab 2
7. **Expected Results:**
   - ✅ Redirected to login (session cleared across tabs)

---

### Test 2.4: Session Persistence Across Domain Change

**Objective:** Verify session persists when switching from Vercel domain to custom domain.

**Prerequisites:** Custom domain configured in Vercel and Supabase

**Steps:**
1. Log in on `https://topaffaireimmo.vercel.app`
2. Navigate to custom domain `https://topaffaireimmo.ma` (in same browser)
3. **Expected Results:**
   - ❌ Session likely NOT persisted (different domains)
   - User needs to log in again
   - **Note:** This is expected behavior unless using shared cookie domain

**Fix:** Ensure users always use one canonical domain. Use redirects to enforce this.

---

## Test Suite 3: Property Listing Creation

### Test 3.1: Add New Listing (Complete Flow)

**Objective:** Verify real estate advertisers can create listings with images.

**Prerequisites:**
- Logged in as real estate advertiser
- Have 1-6 test images ready (JPG/PNG, < 5MB each)

**Steps:**
1. Navigate to `/add-listing`
2. **Expected Results:**
   - ✅ Page loads (no redirect to login)
   - ✅ Form is displayed
3. Fill out form:
   - Transaction Type: Vente
   - Property Type: Appartement
   - Advertiser Type: Agence
   - City: Casablanca
   - Neighborhood: Select from dropdown
   - Address: "123 Boulevard Mohammed V"
   - Price: 1500000
   - Area: 120
   - Bedrooms: 3
   - Bathrooms: 2
   - Title (FR): "Bel appartement à Casablanca"
   - Title (AR): "شقة جميلة في الدار البيضاء"
   - Description (FR): "Appartement moderne avec vue mer..."
   - Description (AR): "شقة حديثة مع إطلالة على البحر..."
   - Phone: "+212600000000"
4. **Upload Images:**
   - Click "Télécharger des images"
   - Select 3-6 images
   - **Expected Results:**
     - ✅ Image thumbnails appear
     - ❌ NO "Veuillez vous connecter d'abord" error
     - ❌ NO "Profile not loaded" error
     - ✅ Upload counter shows "3/6" (or however many uploaded)
5. Click "Publier l'annonce"
6. **Expected Results:**
   - ✅ Loading spinner appears
   - ✅ Images upload successfully
   - ✅ Listing created in database
   - ✅ Success message appears
   - ✅ Redirected to dashboard or listing detail page
   - ✅ No errors in console

**Database Verification:**
```sql
-- Check listing was created
SELECT * FROM public.properties 
WHERE title_fr LIKE '%Bel appartement%'
ORDER BY created_at DESC LIMIT 1;

-- Check images were uploaded
SELECT * FROM public.properties 
WHERE title_fr LIKE '%Bel appartement%' 
AND images IS NOT NULL 
AND array_length(images, 1) >= 3;
```

**Supabase Storage Verification:**
- Go to Supabase Dashboard → Storage → property-images bucket
- Navigate to folder with your user ID
- Verify images exist

---

### Test 3.2: Add Listing - Image Upload Validation

**Objective:** Verify image upload validation works correctly.

**Steps:**
1. Navigate to `/add-listing`
2. Try uploading 7 images (exceeds limit of 6)
3. **Expected Results:**
   - ✅ Error message: "Maximum 6 images autorisées"
   - ✅ Only first 6 images uploaded
4. Try uploading a very large file (> 5MB)
5. **Expected Results:**
   - ✅ Error message about file size
   - ✅ File rejected
6. Try uploading a non-image file (PDF, TXT)
7. **Expected Results:**
   - ✅ Error message about file type
   - ✅ File rejected

---

### Test 3.3: Edit Existing Listing

**Objective:** Verify users can edit their own listings.

**Steps:**
1. Log in as real estate advertiser
2. Navigate to `/dashboard`
3. Click "Modifier" on one of your listings
4. **Expected Results:**
   - ✅ Redirected to `/edit-listing/:id`
   - ✅ Form pre-populated with existing data
   - ✅ Existing images shown
5. Change title and price
6. Upload 1 new image
7. Delete 1 existing image
8. Click "Mettre à jour"
9. **Expected Results:**
   - ✅ Listing updated successfully
   - ✅ Changes reflected in database
   - ✅ New image uploaded
   - ✅ Deleted image removed from storage

---

## Test Suite 4: Admin Panel Access

### Test 4.1: Admin Login & Dashboard Access

**Objective:** Verify admins can access admin panel.

**Prerequisites:** User with `is_admin = true` in profiles table

**Steps:**
1. Log in as admin user
2. Navigate to `/admin`
3. **Expected Results:**
   - ✅ Admin dashboard loads
   - ✅ Can see all listings (not just own)
   - ✅ Can see all users
4. Try accessing as non-admin:
   - Navigate to `/admin`
   - **Expected Results:**
     - ✅ Redirected to home page (not authorized)

---

### Test 4.2: Admin - Approve/Reject Listings

**Objective:** Verify admins can moderate listings.

**Steps:**
1. Log in as admin
2. Navigate to `/admin/listings`
3. Find a pending listing
4. Click "Approve"
5. **Expected Results:**
   - ✅ Listing status changes to "approved"
   - ✅ Listing appears in public search
6. Click "Reject"
7. **Expected Results:**
   - ✅ Listing status changes to "rejected"
   - ✅ Listing hidden from public

---

## Test Suite 5: Error Handling & Edge Cases

### Test 5.1: Protected Route Access (Not Logged In)

**Objective:** Verify protected routes redirect to login.

**Steps:**
1. Log out (or use incognito window)
2. Navigate to `/add-listing`
3. **Expected Results:**
   - ✅ Redirected to `/login`
   - ✅ After login, redirected back to `/add-listing`

---

### Test 5.2: Wrong User Role Access

**Objective:** Verify role-based access control works.

**Steps:**
1. Log in as commercial advertiser
2. Try to navigate to `/add-listing`
3. **Expected Results:**
   - ✅ Redirected to `/` (not authorized)
4. Navigate to `/commercial-dashboard`
5. **Expected Results:**
   - ✅ Page loads successfully (correct role)

---

### Test 5.3: Network Error Handling

**Objective:** Verify app handles network errors gracefully.

**Steps:**
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Try to create a listing
4. **Expected Results:**
   - ✅ Error message shown
   - ✅ No infinite loading spinner
   - ✅ User can retry
5. Restore network
6. Retry operation
7. **Expected Results:**
   - ✅ Operation succeeds

---

## Test Suite 6: Console Error Monitoring

### Test 6.1: No Console Errors on Normal Operation

**Objective:** Verify no errors appear in console during normal use.

**Steps:**
1. Open browser DevTools → Console
2. Clear console
3. Perform any of the above tests
4. **Expected Results:**
   - ✅ No red error messages
   - ✅ Only info/log messages (blue/gray)
   - ✅ Warnings (yellow) are acceptable if documented

**Common Acceptable Warnings:**
- React DevTools extension messages
- Third-party library deprecation warnings
- Non-critical API warnings

**Unacceptable Errors:**
- "Missing environment variables"
- "Undefined is not a function"
- "Cannot read property of null"
- Any authentication/database errors

---

## Testing Checklist Summary

Use this checklist to track testing progress:

### User Registration & Profiles
- [ ] Test 1.1: New user signup (real estate)
- [ ] Test 1.2: Fallback profile creation
- [ ] Test 1.3: Commercial advertiser signup

### Authentication & Sessions
- [ ] Test 2.1: Login & logout
- [ ] Test 2.2: Session persists after refresh
- [ ] Test 2.3: Session across browser tabs
- [ ] Test 2.4: Session across domain change

### Property Listings
- [ ] Test 3.1: Add new listing with images
- [ ] Test 3.2: Image upload validation
- [ ] Test 3.3: Edit existing listing

### Admin Panel
- [ ] Test 4.1: Admin login & access
- [ ] Test 4.2: Approve/reject listings

### Error Handling
- [ ] Test 5.1: Protected route redirect
- [ ] Test 5.2: Role-based access control
- [ ] Test 5.3: Network error handling

### Console Monitoring
- [ ] Test 6.1: No console errors

---

## Post-Testing Actions

After completing all tests:

1. **Document Issues Found:**
   - Create GitHub issues for any bugs
   - Note severity (Critical, High, Medium, Low)
   - Assign to appropriate developer

2. **Verify Fixes:**
   - Re-test failed scenarios after fixes
   - Mark tests as passed

3. **Sign Off:**
   - All tests passed: ✅ Ready for production
   - Some tests failed: ⚠️ Address critical issues before deploy

---

## Testing Notes

**Date Tested:** _______________  
**Tested By:** _______________  
**Environment:** Production / Preview / Local  
**Browser:** Chrome / Firefox / Safari  
**Device:** Desktop / Mobile  

**Issues Found:**

| Test | Status | Issue Description | Severity |
|------|--------|------------------|----------|
|      | ⬜     |                  |          |

**Sign-Off:**

- [ ] All critical tests passed
- [ ] No blocking issues found
- [ ] Ready for production deployment

---

## Additional Resources

- SUPABASE_VERIFICATION_CHECKLIST.md
- VERCEL_ENV_VARS_CHECKLIST.md
- DEPLOYMENT_GUIDE.md
