# Testing Guide: Role & Announcer Type Signup Flow

## Overview

This document provides comprehensive testing procedures for the role & announcer_type signup flow implementation.

## Prerequisites

1. Supabase instance running
2. Migration 044 applied to database
3. Application running locally or on staging

## Manual Testing Procedures

### Test 1: New User Signup as Propriétaire (Owner)

**Steps:**
1. Navigate to `/register`
2. Fill in the form:
   - Full Name: "Test Proprietaire"
   - Email: "proprietaire@test.com"
   - Phone: "+212 600000001" (optional)
   - Select "Propriétaire" from Type d'annonceur
   - Company Name: (leave empty)
   - Password: "test123456"
   - Confirm Password: "test123456"
3. Click "S'inscrire" (Register)
4. Verify success message appears
5. Check email for confirmation link
6. Click confirmation link
7. Verify redirect to home page `/`

**Expected Database State:**
```sql
SELECT id, email, role, announcer_type, user_role
FROM profiles
WHERE email = 'proprietaire@test.com';
```
Expected: `role='user', announcer_type='proprietaire', user_role='real_estate_advertiser'`

**Console Logs to Check:**
- "📋 REGISTER FORM SUBMITTED"
- "Announcer Type: proprietaire"
- "Mapped role: user"
- "✅ SIGNUP API CALL SUCCESSFUL"
- "✅ Profile ensured successfully"

---

### Test 2: New User Signup as Courtier (Broker/Agent)

**Steps:**
1. Navigate to `/register`
2. Fill in the form:
   - Full Name: "Test Courtier"
   - Email: "courtier@test.com"
   - Phone: "+212 600000002" (optional)
   - Select "Courtier" from Type d'annonceur
   - Company Name: "Courtier Services" (optional)
   - Password: "test123456"
   - Confirm Password: "test123456"
3. Click "S'inscrire" (Register)
4. Verify success message appears
5. Check email for confirmation link
6. Click confirmation link
7. Verify redirect to `/agent` page

**Expected Database State:**
```sql
SELECT id, email, role, announcer_type, user_role
FROM profiles
WHERE email = 'courtier@test.com';
```
Expected: `role='agent', announcer_type='courtier', user_role='real_estate_advertiser'`

**Console Logs to Check:**
- "Announcer Type: courtier"
- "Mapped role: agent"
- "Redirecting to: /agent"

---

### Test 3: New User Signup as Agence (Agency)

**Steps:**
1. Navigate to `/register`
2. Fill in the form:
   - Full Name: "Test Agence"
   - Email: "agence@test.com"
   - Phone: "+212 600000003"
   - Select "Agence" from Type d'annonceur
   - Company Name: "Agence Immobiliere Test"
   - Password: "test123456"
   - Confirm Password: "test123456"
3. Click "S'inscrire" (Register)
4. Verify success message appears
5. Check email for confirmation link
6. Click confirmation link
7. Verify redirect to `/merchant` page

**Expected Database State:**
```sql
SELECT id, email, role, announcer_type, user_role
FROM profiles
WHERE email = 'agence@test.com';
```
Expected: `role='merchant', announcer_type='agence', user_role='real_estate_advertiser'`

**Console Logs to Check:**
- "Announcer Type: agence"
- "Mapped role: merchant"
- "Redirecting to: /merchant"

---

### Test 4: Existing User Login (Propriétaire)

**Steps:**
1. Navigate to `/login`
2. Enter credentials:
   - Email: "proprietaire@test.com"
   - Password: "test123456"
3. Click "Se connecter" (Login)
4. Verify redirect to home page `/`

**Console Logs to Check:**
- "✅ Login successful, redirecting to: /"

---

### Test 5: Existing User Login (Courtier)

**Steps:**
1. Navigate to `/login`
2. Enter credentials for courtier account
3. Click "Se connecter" (Login)
4. Verify redirect to `/agent`

---

### Test 6: Existing User Login (Agence)

**Steps:**
1. Navigate to `/login`
2. Enter credentials for agence account
3. Click "Se connecter" (Login)
4. Verify redirect to `/merchant`

---

### Test 7: Admin Login

**Steps:**
1. Navigate to `/login`
2. Enter admin credentials
3. Click "Se connecter" (Login)
4. Verify redirect to `/admin`

**Expected Database State:**
Admin should have: `role='admin', announcer_type=NULL, user_role='admin'`

---

### Test 8: Protected Routes Access

**Test 8.1: User (Proprietaire) Access**
- ✅ Can access: `/`, `/dashboard`, `/add-listing`, `/edit-listing/:id`
- ❌ Cannot access: `/admin`, `/merchant`, `/advertising`

**Test 8.2: Agent (Courtier) Access**
- ✅ Can access: `/`, `/agent`, `/add-listing`, `/edit-listing/:id`
- ❌ Cannot access: `/admin`, `/advertising`

**Test 8.3: Merchant (Agence) Access**
- ✅ Can access: `/`, `/merchant`, `/add-listing`, `/edit-listing/:id`
- ❌ Cannot access: `/admin`

**Test 8.4: Admin Access**
- ✅ Can access: All routes including `/admin`

---

### Test 9: UI Element Visibility

**Check Registration Form:**
1. Navigate to `/register`
2. Verify "Type d'annonceur" selector is visible
3. Verify three buttons: "Propriétaire", "Courtier", "Agence"
4. Click each button and verify it becomes highlighted (primary color)
5. Verify default selection is "Propriétaire"

---

### Test 10: Backward Compatibility

**Test with Old Data:**
1. Find or create a user with old schema: `user_role='real_estate_advertiser', advertiser_type='owner'`
2. Login with this user
3. Verify they can still access the application
4. Verify redirect works correctly
5. Check that permissions work correctly

**Expected Behavior:**
- Old users should still be able to login
- Permissions should work based on old fields
- ProtectedRoute should allow access based on old role values

---

## Automated Verification Queries

Run these SQL queries after each test to verify data integrity:

### Query 1: Check All Users Have Valid Role
```sql
SELECT id, email, role, announcer_type, user_role 
FROM public.profiles 
WHERE role IS NULL OR role NOT IN ('user', 'agent', 'merchant', 'admin');
```
**Expected:** 0 rows

### Query 2: Check Announcer Type Values
```sql
SELECT DISTINCT role, announcer_type 
FROM public.profiles 
ORDER BY role, announcer_type;
```
**Expected Combinations:**
- user, proprietaire
- agent, courtier
- merchant, agence
- merchant, NULL (commercial advertisers)
- admin, NULL

### Query 3: Check Backward Compatibility Mapping
```sql
SELECT role, user_role, COUNT(*) as count
FROM public.profiles 
GROUP BY role, user_role
ORDER BY role, user_role;
```
**Expected Mappings:**
- user → real_estate_advertiser
- agent → real_estate_advertiser
- merchant (with announcer_type) → real_estate_advertiser
- merchant (without announcer_type) → commercial_advertiser
- admin → admin

### Query 4: Check No Admins Have Announcer Type
```sql
SELECT id, email, role, announcer_type 
FROM public.profiles 
WHERE role = 'admin' AND announcer_type IS NOT NULL;
```
**Expected:** 0 rows

---

## Error Scenarios to Test

### Test E1: Invalid Password
1. Try to register with password less than 6 characters
2. Verify error message appears
3. Verify form doesn't submit

### Test E2: Password Mismatch
1. Enter different passwords in password and confirm password fields
2. Verify error message appears
3. Verify form doesn't submit

### Test E3: Invalid Email
1. Try to register with invalid email format
2. Verify browser validation or error message appears

### Test E4: Duplicate Email
1. Try to register with an email that already exists
2. Verify appropriate error message appears

### Test E5: Missing Required Fields
1. Try to submit form with empty required fields
2. Verify validation errors appear

---

## Performance Checks

### Check 1: Profile Creation Speed
- Time from signup to profile creation should be < 2 seconds
- Check server logs for any delays

### Check 2: Login Redirect Speed
- Time from login to redirect should be < 1 second
- Check for any unnecessary API calls

### Check 3: Auth Callback Processing
- Email confirmation callback should complete in < 3 seconds
- Check for timeout errors

---

## RLS Policy Verification

### Test RLS1: User Can Read Own Profile
```sql
-- As authenticated user
SELECT * FROM profiles WHERE id = auth.uid();
```
**Expected:** User can read their own profile

### Test RLS2: User Cannot Read Other Profiles
```sql
-- As authenticated user
SELECT * FROM profiles WHERE id != auth.uid();
```
**Expected:** Empty result set (unless admin)

### Test RLS3: User Can Update Own Profile
```sql
-- As authenticated user
UPDATE profiles SET phone = '+212 999999999' WHERE id = auth.uid();
```
**Expected:** Update succeeds

### Test RLS4: User Cannot Update Other Profiles
```sql
-- As authenticated user
UPDATE profiles SET phone = '+212 999999999' WHERE id != auth.uid();
```
**Expected:** Update fails or affects 0 rows

### Test RLS5: Admin Can Read All Profiles
```sql
-- As admin user
SELECT * FROM profiles;
```
**Expected:** Admin can see all profiles

---

## Browser Console Checks

### On Signup:
- No JavaScript errors
- Clear logging of signup process
- Profile creation confirmation

### On Login:
- No JavaScript errors
- Role-based redirect logging
- Session creation confirmation

### On Protected Route Access:
- No authentication errors
- Proper role checking
- No RLS policy errors

---

## Known Issues / Limitations

1. **Backward Compatibility:** Old code still using `user_role` will work but should be migrated to use `role`
2. **Commercial Merchants:** Pure commercial merchants (without announcer_type) can access `/merchant` but not real estate features
3. **Migration Timing:** Database migration must be applied before deploying frontend changes

---

## Success Criteria

✅ All 10 manual tests pass
✅ All automated verification queries return expected results
✅ All error scenarios are handled gracefully
✅ RLS policies work correctly
✅ No console errors during normal flow
✅ Backward compatibility maintained
✅ Performance targets met

---

## Rollback Procedure

If issues are found:

1. **Frontend Rollback:**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Database Rollback:**
   ```sql
   -- Drop new column
   ALTER TABLE public.profiles DROP COLUMN role;
   
   -- Restore old advertiser_type values
   UPDATE public.profiles
   SET advertiser_type = CASE
     WHEN announcer_type = 'proprietaire' THEN 'owner'
     WHEN announcer_type = 'courtier' THEN 'broker'
     WHEN announcer_type = 'agence' THEN 'agency'
     ELSE advertiser_type
   END;
   
   -- Restore previous trigger
   -- (Use backup or migration 042)
   ```

3. **Verify rollback:**
   - Test login with existing users
   - Test signup flow
   - Verify protected routes work

---

## Contact

For issues or questions:
- Check DIAGNOSTIC_REPORT.md for technical details
- Review console logs for errors
- Check Supabase dashboard for RLS policy issues
