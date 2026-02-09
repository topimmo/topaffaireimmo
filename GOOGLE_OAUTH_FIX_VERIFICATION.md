# Google OAuth Login Fix - Verification Guide

## Problem Fixed
Google OAuth users could authenticate successfully but experienced "user_id = null" errors when trying to perform protected actions like posting properties.

## Root Causes Addressed

1. **Schema Mismatch in Google OAuth Callback**
   - **Issue**: Callback was trying to insert `user_type: 'advertiser'` which doesn't exist in the profiles table
   - **Fix**: Changed to use correct schema columns:
     - `user_role: 'real_estate_advertiser'`
     - `advertiser_type: 'owner'`
   - **File**: `api/auth/google/callback.ts`

2. **Missing Profile Auto-Creation**
   - **Issue**: Profile trigger was removed in migration 048, so auth users could exist without profiles
   - **Fix**: Added `ensureProfileExists()` function in AuthContext that:
     - Checks if profile exists after session initialization
     - Creates profile if missing using auth user metadata
     - Runs on SIGNED_IN events to catch Google OAuth logins
   - **File**: `src/contexts/AuthContext.tsx`

3. **No Defensive Checks in Protected Actions**
   - **Issue**: Property creation didn't verify profile existence before database operations
   - **Fix**: Added profile verification in AddListing before allowing submission
   - **File**: `src/pages/AddListing.tsx`

## How to Verify the Fix

### Test Scenario 1: New Google User (Never Logged In Before)
1. Use a Gmail account that has never logged into the app
2. Click "Login with Google" button
3. Complete Google OAuth flow
4. **Expected Results**:
   - User is redirected to home page
   - User shows as logged in
   - Console shows: `✅ User and profile verified` in DevTools
   - Check Supabase profiles table - new profile should exist with:
     - `user_role = 'real_estate_advertiser'`
     - `advertiser_type = 'owner'`
     - `google_id = <google user id>`

### Test Scenario 2: Existing Google User (Logged In Before)
1. Use a Gmail account that has logged in before (profile exists)
2. Log out and log back in with Google
3. **Expected Results**:
   - User is logged in successfully
   - Profile is loaded and verified
   - Console shows: `Profile exists for user` in DevTools

### Test Scenario 3: Google User Creating Property
1. Log in with Google OAuth
2. Navigate to "Add Listing" page
3. Fill in property details
4. Click "Submit"
5. **Expected Results**:
   - Console shows: `✅ User and profile verified` before submission
   - Property is created successfully with `owner_id = <user.id>`
   - **NO** `user_id = null` errors in console
   - **NO** UUID syntax errors

### Test Scenario 4: Edge Case - User Without Profile
1. This tests the defensive check in AddListing
2. Manually delete a user's profile from Supabase (for testing only!)
3. Try to create a property
4. **Expected Results**:
   - Console shows: `❌ CRITICAL: User authenticated but profile missing!`
   - Error toast shown: "Your profile doesn't exist. Please logout and login again."
   - User is prevented from creating property

## Monitoring & Debugging

### Key Log Messages to Look For

**Success Path**:
```
[AuthContext:init] Auth initialized successfully { hasSession: true, userId: '...' }
[AuthContext:init] Profile exists for user { userId: '...' }
[AddListing] ✅ User and profile verified: { userId: '...', userRole: 'real_estate_advertiser', advertiserType: 'owner' }
```

**Profile Creation Path** (for new Google users):
```
[AuthContext:init] Profile missing for authenticated user, creating... { userId: '...' }
[AuthContext:init] Successfully created missing profile { userId: '...' }
```

**Error Path** (should not occur after fix):
```
[AddListing] ❌ CRITICAL: User authenticated but profile missing!
```

### Database Queries to Verify

```sql
-- Check if profile exists for a specific Google user
SELECT id, email, user_role, advertiser_type, google_id 
FROM profiles 
WHERE google_id = '<google_user_id>';

-- Check for any authenticated users without profiles (should be 0)
SELECT au.id, au.email 
FROM auth.users au 
LEFT JOIN profiles p ON p.id = au.id 
WHERE p.id IS NULL;

-- Check for any properties with null owner_id (should be 0)
SELECT id, title_fr, created_at 
FROM properties 
WHERE owner_id IS NULL;
```

## Expected Behavior After Fix

✅ Google OAuth users can log in successfully  
✅ Profile is automatically created for new Google users  
✅ Profile is verified for existing Google users  
✅ Google users can post properties without errors  
✅ No `user_id = null` queries in console  
✅ No UUID syntax errors  
✅ Auth state persists across page refreshes  

## Rollback Plan

If issues occur, the changes can be reverted:
```bash
git revert e636155  # Address code review feedback
git revert 6303327  # Fix Google OAuth profile creation and sync
```

This will restore the previous behavior but will reintroduce the original bug.
