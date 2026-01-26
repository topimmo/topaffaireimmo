# Manual Testing Guide for Profile Creation Fix

## Overview
This guide provides step-by-step manual testing procedures to verify the profile creation fix works correctly.

## Prerequisites
- Access to Supabase Dashboard
- Admin account for testing
- Clean browser (or incognito mode) for new user signup tests
- Development environment or production environment

## Test Suite

### Test 1: Verify Database Migration Applied

**Objective**: Confirm migrations 038 and 039 are applied successfully

**Steps**:
1. Go to Supabase Dashboard → SQL Editor
2. Run the following query:
   ```sql
   -- Check if trigger exists
   SELECT trigger_name, event_manipulation, action_statement 
   FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```
3. Run diagnostic query:
   ```sql
   SELECT * FROM public.check_profile_sync_status();
   ```

**Expected Results**:
- ✅ Trigger `on_auth_user_created` exists with `AFTER INSERT` event
- ✅ Diagnostic function returns: `missing_profiles = 0`
- ✅ No errors in query execution

**Failure Action**:
- If trigger doesn't exist: Re-apply migration 038
- If missing_profiles > 0: Run backfill from migration 038

---

### Test 2: New User Signup Flow

**Objective**: Verify profile is created automatically on signup

**Steps**:
1. Open browser in **incognito mode**
2. Navigate to: `https://topaffaireimmo.com/register`
3. Fill in registration form:
   - Full Name: Test User 001
   - Email: test-profile-fix-001@example.com
   - Phone: +212 600000001 (optional)
   - Company: Test Agency (optional)
   - Password: TestPass123!
   - Confirm Password: TestPass123!
4. Click "Register"
5. Note the user ID from browser console or Supabase Dashboard

**Verification in Supabase Dashboard**:
1. Go to **Authentication → Users**
2. Search for `test-profile-fix-001@example.com`
3. Copy the User ID
4. Go to **Table Editor → profiles**
5. Search for the same User ID

**Expected Results**:
- ✅ User appears in Authentication → Users
- ✅ User appears in Table Editor → profiles with same ID
- ✅ Profile has correct email, name, phone, company
- ✅ `user_role` = 'real_estate_advertiser'
- ✅ `is_active` = true
- ✅ No errors in browser console

**Failure Action**:
- If profile missing: Check Postgres logs for trigger execution
- If errors: Review migration 038 trigger code

---

### Test 3: Check Postgres Logs for Trigger Execution

**Objective**: Verify trigger is executing and logging correctly

**Steps**:
1. Sign up a new user (as in Test 2)
2. Go to Supabase Dashboard → **Database → Logs → Postgres Logs**
3. Filter for keyword: `handle_new_user`
4. Look for recent log entries (within last 5 minutes)

**Expected Results**:
- ✅ Log entry: "handle_new_user triggered for user ID: <uuid>"
- ✅ Log entry: "Extracted metadata - Role: real_estate_advertiser"
- ✅ Log entry: "Profile created/updated successfully for user ID: <uuid>"
- ✅ No WARNING or ERROR log entries

**Failure Action**:
- If no logs: Trigger may not be firing - check if trigger is enabled
- If WARNING/ERROR logs: Review error message and check RLS policies

---

### Test 4: User Login and Profile Fetch

**Objective**: Verify profile is fetched correctly after login

**Steps**:
1. Log out (if logged in)
2. Navigate to: `/login`
3. Log in with test user credentials from Test 2
4. Open browser **Developer Console** (F12)
5. Check console logs

**Expected Results in Console**:
- ✅ "✅ SIGNIN SUCCESSFUL"
- ✅ "✅ Profile loaded successfully"
- ✅ No errors about missing profile

**Failure Action**:
- If profile not found: Frontend fallback should create it
- Look for: "⚠️ Profile not found" followed by "✅ Fallback profile created"

---

### Test 5: Image Upload Test

**Objective**: Verify users can upload images after signup

**Steps**:
1. Log in as test user from Test 2
2. Navigate to: `/add-listing`
3. Scroll to "Upload Photos" section
4. Click "Upload" button
5. Select a valid image file (JPG/PNG, < 5MB)
6. Wait for upload to complete

**Expected Results**:
- ✅ File upload succeeds without errors
- ✅ Image preview appears
- ✅ No "Please login first" alert
- ✅ No "Permission denied" errors

**Failure Action**:
- If "Please login first": Profile may not exist - check Table Editor
- If "Permission denied": Check storage policies from migration 039
- Check browser console for detailed error

---

### Test 6: Property Listing Creation

**Objective**: Verify users can create property listings

**Steps**:
1. Log in as test user
2. Navigate to: `/add-listing`
3. Fill in all required fields:
   - Transaction Type: Sale
   - Property Type: Apartment
   - City: Select any city
   - Neighborhood: Select or enter custom
   - Price: 1000000
   - Area: 100
   - Bedrooms: 3
   - Bathrooms: 2
   - Title (FR): Test Property
   - Description (FR): Test description
4. Upload at least one image
5. Click "Submit Listing"

**Expected Results**:
- ✅ Form submission succeeds
- ✅ Success message appears
- ✅ No "Permission denied" errors
- ✅ Listing appears in database (check Table Editor → properties)

**Failure Action**:
- If RLS error: Check properties INSERT policy from migration 039
- If ownership error: Check that owner_id matches auth.uid()

---

### Test 7: Admin Dashboard - User Visibility

**Objective**: Verify new users appear in Admin Dashboard

**Steps**:
1. Log out
2. Log in with **admin account**
3. Navigate to: `/admin-panel`
4. Click on **"Users"** tab
5. Search for test user email: `test-profile-fix-001@example.com`

**Expected Results**:
- ✅ Test user appears in user list
- ✅ Shows correct email, name, role
- ✅ `is_active` = true
- ✅ User can be managed (toggle status, change role)

**Failure Action**:
- If user not visible: Check if profile exists in Table Editor
- If missing: Trigger may have failed - check Postgres logs

---

### Test 8: Frontend Fallback Mechanism

**Objective**: Test that frontend creates profile if trigger fails

**Setup** (This test requires temporarily disabling the trigger):
1. In Supabase SQL Editor, run:
   ```sql
   -- TEMPORARILY disable trigger for testing
   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   ```

**Steps**:
1. Sign up a new user with email: `test-fallback-001@example.com`
2. After signup, log in with this user
3. Open browser Developer Console
4. Check console logs

**Expected Results in Console**:
- ⚠️ "Error fetching profile: ..." (PGRST116 error)
- ⚠️ "Profile not found for authenticated user. Attempting to create fallback profile..."
- ✅ "Creating fallback profile for user ID: ..."
- ✅ "✅ Fallback profile created successfully"

**Verification**:
1. Check Table Editor → profiles
2. Profile should exist for the new user

**Cleanup** (IMPORTANT - Re-enable trigger):
```sql
-- Re-enable trigger after test
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Failure Action**:
- If fallback doesn't create profile: Check RLS policies on profiles table
- Review AuthContext.tsx code

---

### Test 9: Backfill Existing Users

**Objective**: Verify existing auth users without profiles get profiles created

**Steps**:
1. Check sync status before backfill:
   ```sql
   SELECT * FROM public.check_profile_sync_status();
   ```
2. If `missing_profiles > 0`, migration 038 should have already run backfill
3. Re-check sync status:
   ```sql
   SELECT * FROM public.check_profile_sync_status();
   ```

**Expected Results**:
- ✅ `missing_profiles = 0` after migration 038
- ✅ All auth users have corresponding profiles

**Failure Action**:
- If still missing: Manually run backfill code from migration 038

---

### Test 10: Performance & Concurrency

**Objective**: Verify trigger doesn't cause delays or conflicts

**Steps**:
1. Create 3-5 users in quick succession (< 1 minute apart)
2. Check that all profiles are created
3. Verify no duplicate profiles

**Expected Results**:
- ✅ All users have profiles
- ✅ No duplicate profiles (ON CONFLICT handles this)
- ✅ Signup completes within 2-3 seconds

**Failure Action**:
- If duplicates: Check ON CONFLICT clause in migration 038
- If slow: Check database performance, indexes

---

## Test Results Summary

After completing all tests, fill in this checklist:

### Critical Tests (Must Pass)
- [ ] Test 1: Database migration applied ✅
- [ ] Test 2: New user signup creates profile ✅
- [ ] Test 5: Image upload works ✅
- [ ] Test 6: Property listing creation works ✅
- [ ] Test 7: Users appear in Admin Dashboard ✅

### Important Tests (Should Pass)
- [ ] Test 3: Postgres logs show trigger execution ✅
- [ ] Test 4: Profile fetch after login ✅
- [ ] Test 8: Frontend fallback works ✅
- [ ] Test 9: Backfill completes successfully ✅

### Optional Tests (Nice to Have)
- [ ] Test 10: Performance acceptable ✅

## Rollback Procedure

If any critical test fails and cannot be fixed:

1. **Revert Frontend**:
   ```bash
   git revert <commit-hash>
   npm run build
   # Redeploy
   ```

2. **Revert Database**:
   ```sql
   -- Drop new trigger
   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
   
   -- Restore from migration 035 or backup
   ```

3. **Restore policies**:
   ```sql
   -- Restore storage policies from migration 021
   -- See file: supabase/migrations/021_storage_buckets.sql
   ```

## Success Criteria

**Fix is considered successful when**:
- ✅ All critical tests pass
- ✅ At least 7 out of 10 tests pass
- ✅ No security vulnerabilities introduced
- ✅ No data loss or corruption
- ✅ Users can signup and immediately use the platform

## Support & Troubleshooting

If tests fail:
1. Check Supabase Postgres Logs for errors
2. Check browser console for errors
3. Verify migrations were applied in correct order
4. Review RLS policies
5. Check that Supabase is not in maintenance mode

## Contact

For issues or questions about this test guide:
- Review: `DEPLOYMENT_GUIDE_PROFILE_FIX.md`
- Check migration files: `supabase/migrations/038_*.sql` and `039_*.sql`
- Review code: `src/contexts/AuthContext.tsx`
