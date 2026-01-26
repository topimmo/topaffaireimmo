# Testing Guide: Migration 040 - Profile Loading Fix

## 🎯 Purpose

This guide provides step-by-step testing procedures to verify that Migration 040 successfully fixes the production profile loading issue.

**Error Being Fixed**: "Erreur de chargement du profil. Veuillez rafraîchir la page."

## 📋 Pre-Testing Setup

### Requirements
- [ ] Migration 040 has been applied to database
- [ ] Access to Supabase Dashboard or SQL Editor
- [ ] Test accounts prepared (see below)
- [ ] Browser developer tools knowledge
- [ ] Mobile device or browser emulation available

### Test Accounts

Create these test accounts for testing (or use existing):

1. **New User** (to be created during testing)
   - Email: `test-migration-040-new@example.com`
   - Password: `TestPass123!`

2. **Existing User** (create before testing)
   - Email: `test-migration-040-existing@example.com`
   - Password: `TestPass123!`
   - Full Name: `Test User Existing`

## 🧪 Test Suite

### Test 1: Database Migration Verification ✅

**Purpose**: Verify migration applied successfully

**Steps**:

1. Open Supabase Dashboard → Database → SQL Editor

2. Run diagnostic function:
```sql
SELECT * FROM public.diagnose_profile_sync();
```

**Expected Results**:
```
metric              | count | details
--------------------+-------+--------------------------------------------------
Total Auth Users    | X     | Users in auth.users table
Total Profiles      | X     | Profiles in public.profiles table
Missing Profiles    | 0     | Auth users without a profile (CRITICAL - should be 0)
Orphaned Profiles   | 0     | Profiles without an auth user
Active Profiles     | X     | Profiles with is_active = true
Admin Users         | X     | Profiles with admin privileges
Verified Users      | X     | Profiles with email verified
```

✅ **Pass Criteria**: `Missing Profiles` = 0

❌ **Fail Criteria**: `Missing Profiles` > 0

---

### Test 2: Schema Columns Exist ✅

**Purpose**: Verify all required columns exist

**Steps**:

1. Run schema check query:
```sql
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN (
    'id', 'email', 'full_name', 'phone', 
    'user_role', 'company_name', 
    'is_admin', 'is_active', 'is_verified',
    'created_at', 'updated_at'
  )
ORDER BY column_name;
```

**Expected Results**: All 11 columns returned

✅ **Pass Criteria**: All required columns exist

❌ **Fail Criteria**: Any column missing

---

### Test 3: Trigger Exists and Enabled ✅

**Purpose**: Verify auto-creation trigger is active

**Steps**:

1. Check trigger status:
```sql
SELECT 
  tgname as trigger_name,
  tgtype,
  tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

2. Check function definition:
```sql
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'handle_new_user';
```

**Expected Results**:
- Trigger exists: `tgname = 'on_auth_user_created'`
- Enabled: `tgenabled = 'O'`
- Function includes error handling and logging

✅ **Pass Criteria**: Trigger enabled, function has proper error handling

❌ **Fail Criteria**: Trigger missing or disabled

---

### Test 4: RLS Policies Correct ✅

**Purpose**: Verify Row-Level Security policies

**Steps**:

1. List all policies on profiles:
```sql
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
```

**Expected Results**: Exactly 3 policies
- `profiles_select_policy` (SELECT)
- `profiles_update_policy` (UPDATE)
- `profiles_insert_policy` (INSERT)

✅ **Pass Criteria**: All 3 policies exist

❌ **Fail Criteria**: Missing policies or conflicting policies

---

### Test 5: Existing User Login Flow ✅

**Purpose**: Verify existing users can login and load profile

**Steps**:

1. Open application in browser
2. Open Browser DevTools (F12) → Console tab
3. Navigate to login page
4. Login with existing test account:
   - Email: `test-migration-040-existing@example.com`
   - Password: `TestPass123!`
5. Monitor console logs

**Expected Console Logs**:
```
🔐 SIGNIN PROCESS STARTED
✅ SIGNIN SUCCESSFUL
✅ Profile loaded successfully
```

**Expected UI**:
- Redirected to dashboard or home
- User name displayed correctly
- No error messages
- No "Please refresh page" alert

✅ **Pass Criteria**: 
- Login successful
- Profile loads without errors
- User can access protected pages

❌ **Fail Criteria**:
- Login fails
- Profile loading error
- "Erreur de chargement du profil" shown

---

### Test 6: New User Signup Flow ✅

**Purpose**: Verify new users get profiles created automatically

**Steps**:

1. **Signup via UI**:
   - Navigate to signup page
   - Open Browser DevTools (F12) → Console tab
   - Enter test details:
     - Email: `test-migration-040-new@example.com`
     - Password: `TestPass123!`
     - Full Name: `Test Migration 040`
     - Phone: `+212600000000`
   - Submit form

2. **Monitor Console**:
   - Should see: `✅ SIGNUP API CALL SUCCESSFUL`
   - Should see user ID logged

3. **Verify in Database**:
```sql
-- Check auth user was created
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE email = 'test-migration-040-new@example.com';

-- Check profile was created
SELECT id, email, full_name, user_role, is_active, is_verified, created_at
FROM public.profiles
WHERE email = 'test-migration-040-new@example.com';
```

**Expected Results**:
- User exists in `auth.users`
- Profile exists in `public.profiles` with matching ID
- `user_role` = 'real_estate_advertiser'
- `is_active` = true
- All metadata fields populated

✅ **Pass Criteria**: 
- Signup successful
- Profile created automatically
- All fields populated correctly

❌ **Fail Criteria**:
- Signup fails
- Profile not created
- Missing fields

---

### Test 7: Postgres Logs Check ✅

**Purpose**: Verify trigger is executing and logging properly

**Steps**:

1. Navigate to Supabase Dashboard → Database → Logs

2. Filter for "Postgres Logs"

3. Search for recent entries containing:
   - `handle_new_user triggered`
   - `Profile created/updated successfully`

4. Look for test user's email in logs

**Expected Logs**:
```
Profile creation trigger fired for user ID: [UUID], email: test-migration-040-new@example.com
Metadata extracted - Role: real_estate_advertiser, Name: Test Migration 040
Profile created/updated successfully for user ID: [UUID]
```

✅ **Pass Criteria**: 
- Trigger logs appear for new signups
- Success messages logged
- No ERROR or WARNING entries

❌ **Fail Criteria**:
- No trigger logs
- ERROR or WARNING messages
- Trigger not executing

---

### Test 8: Profile Loading After Login ✅

**Purpose**: Verify profile loads correctly after authentication

**Steps**:

1. **Login with New User**:
   - Email: `test-migration-040-new@example.com`
   - Password: `TestPass123!`

2. **Monitor Console Logs**:
   - Should see profile fetch
   - Should see profile loaded successfully

3. **Verify in UI**:
   - User name displayed
   - Dashboard/profile page accessible
   - No loading errors

4. **Check Network Tab**:
   - Find request to `/rest/v1/profiles?id=eq.[UUID]`
   - Status should be `200 OK`
   - Response should contain profile data

**Expected Network Response**:
```json
[
  {
    "id": "uuid-here",
    "email": "test-migration-040-new@example.com",
    "full_name": "Test Migration 040",
    "user_role": "real_estate_advertiser",
    "is_active": true,
    "is_verified": false,
    ...
  }
]
```

✅ **Pass Criteria**:
- Profile loads immediately after login
- All fields present in response
- No errors in console or network tab

❌ **Fail Criteria**:
- Profile fetch fails (403, 404, 500)
- Missing fields in response
- Console errors

---

### Test 9: Image Upload Functionality ✅

**Purpose**: Verify critical feature that was broken - image upload

**Steps**:

1. **Login as Test User**

2. **Navigate to "Add Listing" or "Edit Listing"**

3. **Try to Upload Image**:
   - Click on image upload field
   - Select a test image (JPG/PNG)
   - Submit

**Expected Behavior**:
- Image upload field accepts file
- No "Erreur de chargement du profil" alert
- No "Profile not loaded" console error
- Upload progresses successfully

✅ **Pass Criteria**:
- Image upload works
- No profile-related errors
- Upload completes successfully

❌ **Fail Criteria**:
- "Erreur de chargement du profil" alert appears
- Upload fails due to profile check
- Console shows "Profile not loaded despite protected route"

---

### Test 10: Mobile Experience ✅

**Purpose**: Verify fix works on mobile (where issue was most common)

**Steps**:

**Option A: Real Mobile Device**
1. Open site on mobile browser (iOS Safari or Android Chrome)
2. Login with test account
3. Navigate to dashboard
4. Try to upload image
5. Check for any errors

**Option B: Browser Emulation**
1. Open Chrome DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select mobile device (iPhone, Pixel, etc.)
4. Perform login and navigation tests
5. Try image upload

**Expected Results**:
- Login successful on mobile
- Profile loads correctly
- Dashboard accessible
- Image upload works
- No error alerts
- Responsive layout works

✅ **Pass Criteria**:
- All features work on mobile
- No profile loading errors
- Smooth user experience

❌ **Fail Criteria**:
- Profile fails to load on mobile
- "Erreur de chargement du profil" appears
- Features blocked on mobile

---

### Test 11: Admin Dashboard Visibility ✅

**Purpose**: Verify users appear in admin dashboard

**Steps**:

1. **Login as Admin User**

2. **Navigate to Admin Dashboard** (if exists)

3. **Check User List**:
   - Look for test users created
   - Verify all user data visible

4. **Verify in Database**:
```sql
-- Check all profiles are visible to admin
SELECT 
  id,
  email,
  full_name,
  user_role,
  is_active,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Results**:
- All test users visible
- Profile data complete
- No missing records

✅ **Pass Criteria**:
- New users appear in admin dashboard
- All profile fields visible
- Admin can view all users

❌ **Fail Criteria**:
- Users missing from admin view
- Incomplete profile data
- Access denied errors

---

### Test 12: Concurrent Signups ✅

**Purpose**: Verify trigger handles concurrent user creation

**Steps**:

1. **Simulate Multiple Signups**:
   - Open 3 browser tabs
   - Create 3 test accounts simultaneously:
     - `test-concurrent-1@example.com`
     - `test-concurrent-2@example.com`
     - `test-concurrent-3@example.com`

2. **Verify All Profiles Created**:
```sql
SELECT 
  u.id,
  u.email,
  p.id IS NOT NULL as has_profile
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email LIKE 'test-concurrent-%@example.com';
```

**Expected Results**: All 3 users have `has_profile = true`

✅ **Pass Criteria**: All profiles created successfully

❌ **Fail Criteria**: Any user missing profile

---

## 📊 Test Results Summary

### Recording Results

Use this template to record test results:

```
Test Suite: Migration 040 Profile Fix
Date: _______________
Tester: _______________

Test 1: Database Migration Verification    [ ] PASS  [ ] FAIL
Test 2: Schema Columns Exist                [ ] PASS  [ ] FAIL
Test 3: Trigger Exists and Enabled          [ ] PASS  [ ] FAIL
Test 4: RLS Policies Correct                [ ] PASS  [ ] FAIL
Test 5: Existing User Login Flow            [ ] PASS  [ ] FAIL
Test 6: New User Signup Flow                [ ] PASS  [ ] FAIL
Test 7: Postgres Logs Check                 [ ] PASS  [ ] FAIL
Test 8: Profile Loading After Login         [ ] PASS  [ ] FAIL
Test 9: Image Upload Functionality          [ ] PASS  [ ] FAIL
Test 10: Mobile Experience                  [ ] PASS  [ ] FAIL
Test 11: Admin Dashboard Visibility         [ ] PASS  [ ] FAIL
Test 12: Concurrent Signups                 [ ] PASS  [ ] FAIL

Total Tests: 12
Passed: ___
Failed: ___

Overall Result: [ ] PASS (all tests)  [ ] FAIL (any test failed)

Notes:
_________________________________________________________________
_________________________________________________________________
```

### Success Criteria

**Migration is successful when**:
- ✅ ALL 12 tests pass
- ✅ No profile loading errors occur
- ✅ Image upload works correctly
- ✅ Mobile experience is smooth
- ✅ No errors in Postgres logs

### Failure Actions

**If any test fails**:
1. Document the failure in detail
2. Check Postgres logs for errors
3. Run diagnostic function: `SELECT * FROM diagnose_profile_sync();`
4. Review troubleshooting section in deployment guide
5. Contact engineering team if unresolved

## 🔧 Troubleshooting Failed Tests

### Test 1 Failure: Missing Profiles > 0

**Action**: Run manual backfill
```sql
-- See DEPLOYMENT_GUIDE_040_PROFILE_FIX.md for backfill script
```

### Test 3 Failure: Trigger Not Enabled

**Action**: Enable trigger
```sql
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
```

### Test 5/8 Failure: Profile Not Loading

**Check**:
1. Browser console for specific error
2. Network tab for request status (403? 404?)
3. RLS policies with query from Test 4

### Test 9 Failure: Image Upload Error

**Verify**:
1. Profile exists in database
2. User is authenticated (check console)
3. Profile has `user_role` set correctly

## ✅ Sign-Off

**Tester Signature**: ___________________  
**Date**: ___________________  
**Status**: [ ] Approved  [ ] Rejected  
**Comments**: _________________________________________________________________

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-26  
**Migration**: 040_comprehensive_profile_fix.sql
