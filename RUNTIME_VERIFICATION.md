# Runtime Verification Checklist

This document provides a step-by-step checklist to verify that the clean architecture refactoring is working correctly in production or development environments.

## Prerequisites

Before testing:
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Application built successfully (`npm run build`)
- [ ] Supabase connection working

## 1. Signup Flow Verification

### Test: New User Registration

**Goal:** Verify that new users are created with default `'user'` role only.

**Steps:**
1. [ ] Navigate to `/register`
2. [ ] Sign up with new email/password
3. [ ] Wait for redirect (should go to `/dashboard` or callback)
4. [ ] Check profile in Supabase Dashboard
   - [ ] `profiles.user_role` should be `'user'`
   - [ ] `profiles.advertiser_type` should be `null`
   - [ ] No entry in `admins` table
   - [ ] No entry in `artisan_profiles` table

**Expected:**
✅ User created with role `'user'`  
✅ No automatic merchant/advertiser assignment  
✅ No automatic artisan profile creation

**Actual Result:**
```
[ ] PASS
[ ] FAIL - Describe issue: _____________
```

---

## 2. Authentication & Profile Loading

### Test: Login and Profile Ready

**Goal:** Verify profile loads correctly and `profileReady` flag works.

**Steps:**
1. [ ] Log out if logged in
2. [ ] Navigate to `/login`
3. [ ] Log in with valid credentials
4. [ ] Open browser DevTools → Console
5. [ ] Look for log: `[AuthContext] Profile loaded successfully`
6. [ ] Check that profile data appears in console

**Expected:**
✅ Log shows `[AuthContext] Loading profile for user: [id]`  
✅ Log shows `[AuthContext] Profile loaded successfully`  
✅ No infinite spinner  
✅ No errors in console

**Actual Result:**
```
[ ] PASS
[ ] FAIL - Describe issue: _____________
```

### Test: Page Refresh Behavior

**Goal:** Verify profile persists across page refresh.

**Steps:**
1. [ ] While logged in, refresh the page
2. [ ] Wait for page to load
3. [ ] User should still be logged in
4. [ ] Check console for profile loading logs

**Expected:**
✅ Session restored from localStorage  
✅ Profile reloaded from DB  
✅ No redirect to login  
✅ Same dashboard shown

**Actual Result:**
```
[ ] PASS
[ ] FAIL - Describe issue: _____________
```

---

## 3. Artisan Onboarding Flow

### Test: Start Onboarding

**Goal:** Verify onboarding flow and DB persistence.

**Steps:**
1. [ ] Log in as regular user (not admin, not artisan)
2. [ ] Navigate to `/artisan/onboarding`
3. [ ] Verify page loads with form
4. [ ] Select a service category
5. [ ] Fill in business name
6. [ ] Select a city
7. [ ] Select at least one neighborhood
8. [ ] Fill in phone number
9. [ ] Click "Soumettre la demande"

**Expected:**
✅ Form submits successfully  
✅ Toast notification: "Votre demande a été soumise avec succès"  
✅ Redirected to `/artisan/pending`  
✅ New entry in `artisan_profiles` table with `is_verified = false`

**Actual Result:**
```
[ ] PASS
[ ] FAIL - Describe issue: _____________
```

### Test: Onboarding State Persistence

**Goal:** Verify onboarding state survives page refresh.

**Steps:**
1. [ ] Complete onboarding (reach pending page)
2. [ ] Refresh the page at `/artisan/pending`
3. [ ] Should still show pending status
4. [ ] Navigate to `/artisan/onboarding` manually
5. [ ] Should redirect back to `/artisan/pending`

**Expected:**
✅ Pending status persists after refresh  
✅ Cannot re-enter onboarding after submission  
✅ State loaded from DB, not local storage

**Actual Result:**
```
[ ] PASS
[ ] FAIL - Describe issue: _____________
```

### Test: Back Navigation

**Goal:** Verify back button doesn't break flow.

**Steps:**
1. [ ] At `/artisan/pending` page
2. [ ] Click browser back button
3. [ ] Should stay at pending or redirect back to pending
4. [ ] Should NOT see onboarding form again

**Expected:**
✅ No access to onboarding form after submission  
✅ User cannot accidentally re-submit

**Actual Result:**
```
[ ] PASS
[ ] FAIL - Describe issue: _____________
```

---

## 4. Artisan Verification Flow

### Test: Admin Verifies Artisan

**Goal:** Verify admin can approve artisan and user gets access.

**Steps:**
1. [ ] Log in as admin
2. [ ] Navigate to `/admin/artisans` (or appropriate admin page)
3. [ ] Find pending artisan
4. [ ] Verify/approve the artisan
5. [ ] Log out admin
6. [ ] Log in as the artisan user
7. [ ] Refresh page if needed

**Expected:**
✅ Artisan status updated to `is_verified = true` in DB  
✅ Artisan user redirected to `/dashboard/artisan` or accessible  
✅ Artisan can access artisan features

**Actual Result:**
```
[ ] PASS
[ ] FAIL - Describe issue: _____________
```

### Test: Verified Artisan Access

**Goal:** Verify verified artisan has correct capabilities.

**Steps:**
1. [ ] As verified artisan, navigate to `/dashboard/artisan`
2. [ ] Should have access (no redirect)
3. [ ] Check capabilities:
   - [ ] Can view artisan requests
   - [ ] Can manage services
   - [ ] No admin access

**Expected:**
✅ Artisan dashboard accessible  
✅ Artisan features enabled  
✅ Cannot access admin pages  
✅ Capability `can_access_artisan_dashboard` = true

**Actual Result:**
```
[ ] PASS
[ ] FAIL - Describe issue: _____________
```

---

## 5. Admin Access Control

### Test: Admin Pages Protected

**Goal:** Verify only admins can access admin pages.

**Steps:**
1. [ ] Log in as regular user (not admin)
2. [ ] Try to navigate to `/admin`
3. [ ] Should be redirected to `/dashboard`
4. [ ] Log out
5. [ ] Log in as admin
6. [ ] Navigate to `/admin`
7. [ ] Should have access

**Expected:**
✅ Non-admin redirected away from `/admin/*`  
✅ Admin can access `/admin/*`  
✅ Access based on DB `admins` table

**Actual Result:**
```
[ ] PASS
[ ] FAIL - Describe issue: _____________
```

### Test: Admin Service Management

**Goal:** Verify admin can manage service categories.

**Steps:**
1. [ ] As admin, navigate to `/admin/services/categories`
2. [ ] Create a new category
3. [ ] Toggle category active/inactive
4. [ ] Edit category details
5. [ ] (Optional) Delete category

**Expected:**
✅ Admin can create categories  
✅ Admin can toggle active status  
✅ Admin can edit categories  
✅ Changes reflected in DB  
✅ Public sees only active categories

**Actual Result:**
```
[ ] PASS
[ ] FAIL - Describe issue: _____________
```

---

## 6. Capability-Based Access

### Test: User Capabilities

**Goal:** Verify regular users have correct capabilities.

**Steps:**
1. [ ] Log in as regular user
2. [ ] Can access:
   - [ ] `/dashboard` ✅
   - [ ] `/add-listing` ✅
   - [ ] Own listings ✅
3. [ ] Cannot access:
   - [ ] `/admin` ❌
   - [ ] `/dashboard/artisan` ❌ (if not artisan)

**Expected:**
✅ User has `can_create_listing`  
✅ User has `can_view_own_listings`  
✅ User does NOT have `can_access_admin`  
✅ User does NOT have `can_access_artisan_dashboard` (unless artisan)

**Actual Result:**
```
[ ] PASS
[ ] FAIL - Describe issue: _____________
```

### Test: Artisan Capabilities

**Goal:** Verify artisan users have artisan capabilities.

**Steps:**
1. [ ] Log in as verified artisan
2. [ ] Can access:
   - [ ] `/dashboard/artisan` ✅
   - [ ] `/artisan/services` ✅
   - [ ] `/artisan/requests` ✅
3. [ ] Cannot access:
   - [ ] `/admin` ❌

**Expected:**
✅ Artisan has `can_access_artisan_dashboard`  
✅ Artisan has `can_create_artisan_service`  
✅ Artisan has `can_view_artisan_requests`  
✅ Artisan does NOT have `can_access_admin` (unless also admin)

**Actual Result:**
```
[ ] PASS
[ ] FAIL - Describe issue: _____________
```

### Test: Admin Capabilities

**Goal:** Verify admin has all capabilities.

**Steps:**
1. [ ] Log in as admin
2. [ ] Can access:
   - [ ] `/admin` ✅
   - [ ] `/admin/services/categories` ✅
   - [ ] `/admin/services/subcategories` ✅
   - [ ] `/admin/services/requests` ✅
   - [ ] `/admin/artisans` ✅
   - [ ] All user pages ✅

**Expected:**
✅ Admin has `can_access_admin`  
✅ Admin has `can_manage_service_categories`  
✅ Admin has `can_manage_artisans`  
✅ Admin has all user capabilities

**Actual Result:**
```
[ ] PASS
[ ] FAIL - Describe issue: _____________
```

---

## 7. Race Condition Prevention

### Test: Fast Refresh During Load

**Goal:** Verify no race conditions during auth/profile load.

**Steps:**
1. [ ] Log in
2. [ ] Immediately refresh page multiple times quickly
3. [ ] Should not see:
   - Flash of wrong dashboard
   - Redirect loops
   - Multiple profile fetches
4. [ ] Should see loading spinner until ready

**Expected:**
✅ No flash of unauthorized content  
✅ No redirect loops  
✅ Clean loading state  
✅ Correct dashboard after loading

**Actual Result:**
```
[ ] PASS
[ ] FAIL - Describe issue: _____________
```

### Test: No Auto Role Assignment

**Goal:** Verify visiting pages doesn't auto-assign roles.

**Steps:**
1. [ ] Create new user
2. [ ] Navigate to various pages:
   - `/services`
   - `/add-listing`
   - `/dashboard`
3. [ ] Check DB `profiles` table
4. [ ] `user_role` should still be `'user'`
5. [ ] `advertiser_type` should still be `null`

**Expected:**
✅ Role remains `'user'`  
✅ No automatic merchant assignment  
✅ No automatic advertiser assignment

**Actual Result:**
```
[ ] PASS
[ ] FAIL - Describe issue: _____________
```

---

## 8. Error Handling

### Test: Network Error Handling

**Goal:** Verify graceful handling of network errors.

**Steps:**
1. [ ] Disconnect internet
2. [ ] Try to log in
3. [ ] Should see error message
4. [ ] Reconnect internet
5. [ ] Try again - should work

**Expected:**
✅ Network error detected  
✅ User-friendly error message  
✅ Can retry after reconnect  
✅ No crash or blank page

**Actual Result:**
```
[ ] PASS
[ ] FAIL - Describe issue: _____________
```

### Test: Invalid Credentials

**Goal:** Verify proper error for wrong credentials.

**Steps:**
1. [ ] Try to log in with wrong password
2. [ ] Should see error message
3. [ ] Form should remain functional
4. [ ] Can try again

**Expected:**
✅ Error message shown  
✅ Form not broken  
✅ No redirect  
✅ Can retry

**Actual Result:**
```
[ ] PASS
[ ] FAIL - Describe issue: _____________
```

---

## 9. Database Consistency

### Test: Profile Data Integrity

**Goal:** Verify profile data matches expectations.

**Steps:**
1. [ ] Check Supabase Dashboard → `profiles` table
2. [ ] For test user, verify:
   - [ ] `id` matches auth user ID
   - [ ] `user_role` is one of: `'user'`, `'real_estate_advertiser'`, `'commercial_advertiser'`
   - [ ] `advertiser_type` is one of: `null`, `'broker'`, `'agency'`
   - [ ] `created_at` populated
3. [ ] Check `admins` table
   - [ ] Only authorized users have entries
4. [ ] Check `artisan_profiles` table
   - [ ] `user_id` references valid profile
   - [ ] `service_category_id` references valid category
   - [ ] `is_verified` is boolean

**Expected:**
✅ All foreign keys valid  
✅ No orphaned records  
✅ Timestamps populated  
✅ Boolean fields are true/false (not null)

**Actual Result:**
```
[ ] PASS
[ ] FAIL - Describe issue: _____________
```

---

## 10. Performance

### Test: Initial Load Time

**Goal:** Verify app loads in reasonable time.

**Steps:**
1. [ ] Clear browser cache
2. [ ] Navigate to home page
3. [ ] Measure time to interactive
4. [ ] Should be < 3 seconds on good connection

**Expected:**
✅ Page loads in < 3 seconds  
✅ No long blocking tasks  
✅ Images lazy loaded

**Actual Result:**
```
Time: _____ seconds
[ ] PASS (< 3s)
[ ] NEEDS IMPROVEMENT (3-5s)
[ ] FAIL (> 5s)
```

### Test: Profile Load Time

**Goal:** Verify profile loads quickly.

**Steps:**
1. [ ] Log in
2. [ ] Check console for timing
3. [ ] `profileReady` should be true in < 2 seconds

**Expected:**
✅ Profile loads in < 2 seconds  
✅ Parallel queries used (profile + admin + artisan)  
✅ No sequential waterfall

**Actual Result:**
```
Time: _____ seconds
[ ] PASS
[ ] FAIL - Describe issue: _____________
```

---

## Summary

### Test Results

Total Tests: 23

```
Passed: _____ / 23
Failed: _____ / 23
Skipped: _____ / 23
```

### Critical Issues

List any critical issues found:

```
1. _______________________________________
2. _______________________________________
3. _______________________________________
```

### Deployment Readiness

Based on test results:

```
[ ] READY - All critical tests passed
[ ] NEEDS WORK - Some issues found but non-critical
[ ] NOT READY - Critical issues must be fixed
```

### Tested By

```
Name: _______________________
Date: _______________________
Environment: [ ] Dev [ ] Staging [ ] Production
```

---

## Troubleshooting Guide

### Issue: Infinite Loading Spinner

**Check:**
- Browser console for errors
- Network tab for failed requests
- `profileReady` value in React DevTools

**Fix:**
- Clear localStorage
- Check Supabase RLS policies
- Verify profile exists in DB

### Issue: Redirect Loop

**Check:**
- Guard configuration in routes
- Capability checks
- Fallback paths

**Fix:**
- Review guard order
- Check capability mapping
- Verify profile data

### Issue: Wrong Dashboard Shown

**Check:**
- Profile data in auth context
- DB admin/artisan status
- Capability check results

**Fix:**
- Call `refreshProfile()`
- Verify DB data
- Check RLS policies

### Issue: Onboarding Not Persisting

**Check:**
- Network tab - was insert successful?
- DB `artisan_profiles` table
- Console errors

**Fix:**
- Check RLS policies
- Verify user_id is correct
- Check required fields

---

## Automated Testing (Future)

This checklist can be automated with Playwright:

```typescript
test('signup creates user with default role', async ({ page }) => {
  // Navigate to signup
  // Fill form
  // Submit
  // Check DB
  // Assert user_role === 'user'
});
```

**To be implemented in future PR.**
