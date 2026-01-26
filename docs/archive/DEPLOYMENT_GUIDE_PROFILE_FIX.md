# User Profile Creation Fix - Deployment Guide

## Issue Summary
Users could not publish listings or appear in the Admin Dashboard because profiles were not being created in the `public.profiles` table after signup.

## Root Cause
The database trigger `handle_new_user()` that should create profiles was either:
1. Not executing properly
2. Failing silently due to RLS policies
3. Missing error handling and logging

## Solution Overview

### 1. Database Layer (Migration 038)
- ✅ **Comprehensive Trigger**: Recreated `handle_new_user()` with extensive error handling
- ✅ **Logging**: Added RAISE LOG statements for debugging in Postgres logs
- ✅ **SECURITY DEFINER**: Ensures trigger bypasses RLS policies
- ✅ **Conflict Handling**: ON CONFLICT DO UPDATE to handle all edge cases
- ✅ **Backfill**: Automatically creates profiles for existing auth users
- ✅ **Diagnostics**: Added `check_profile_sync_status()` function

### 2. Storage & RLS Policies (Migration 039)
- ✅ **Storage Policies**: Removed strict profile checks to allow uploads even if profile sync is delayed
- ✅ **Property Policies**: Improved to allow inserts when profile doesn't exist yet
- ✅ **Security**: Maintained via folder structure (users can only upload to their own folder)

### 3. Frontend Fallback (AuthContext.tsx)
- ✅ **Auto-detect**: Detects missing profiles (PGRST116 error)
- ✅ **Auto-create**: Creates fallback profile if database trigger fails
- ✅ **Retry Logic**: Waits 2 seconds and retries profile fetch
- ✅ **Logging**: Comprehensive console logs for debugging

## Deployment Steps

### Step 1: Backup Production Database
```bash
# In Supabase Dashboard:
# Database → Backups → Create Backup
# Or via CLI:
supabase db dump -f backup-before-profile-fix.sql
```

### Step 2: Apply Migrations to Production

#### Option A: Via Supabase Dashboard (Recommended)
1. Go to Supabase Dashboard → SQL Editor
2. Copy content of `supabase/migrations/038_fix_profile_creation_comprehensive.sql`
3. Paste and run the migration
4. Wait for success confirmation
5. Copy content of `supabase/migrations/039_fix_storage_and_property_policies.sql`
6. Paste and run the migration
7. Verify no errors

#### Option B: Via Supabase CLI
```bash
# Make sure you're connected to production
supabase link --project-ref <your-project-ref>

# Apply migrations
supabase db push
```

### Step 3: Verify Migration Success

#### Check Sync Status
Run this in Supabase SQL Editor:
```sql
SELECT * FROM public.check_profile_sync_status();
```

Expected result:
```
total_auth_users | total_profiles | missing_profiles | orphaned_profiles
-----------------|----------------|------------------|------------------
       10        |       10       |        0         |        0
```

If `missing_profiles > 0`, run the backfill manually:
```sql
-- This was already in migration 038, but can be run again if needed
-- See migration file for backfill code
```

#### Check Trigger Exists
```sql
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

Should return the trigger information.

#### Check Policies
```sql
-- Check profiles policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Check storage policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%property_images%';
```

### Step 4: Deploy Frontend Changes

```bash
# Build and deploy to Vercel/Hostinger
npm run build
# Deploy via your CI/CD or manual upload
```

### Step 5: Test the Fix

#### Test 1: New User Signup
1. Open browser in incognito mode
2. Navigate to `/register`
3. Sign up with a new email (e.g., `test-user-001@example.com`)
4. After signup, check Supabase Dashboard:
   - Go to Authentication → Users → verify user exists
   - Go to Table Editor → profiles → verify profile exists with same ID
5. Log in with the new user
6. Try to navigate to `/add-listing`
7. Try to upload an image
8. ✅ Should work without "Please login first" error

#### Test 2: Admin Dashboard
1. Log in as admin
2. Navigate to `/admin-panel`
3. Click "Users" section
4. ✅ Verify newly created user appears in the list

#### Test 3: Profile Creation Logs
In Supabase Dashboard:
1. Go to Database → Logs → Postgres Logs
2. Filter for "handle_new_user"
3. ✅ Should see log entries like:
   - "handle_new_user triggered for user ID: xxx"
   - "Profile created/updated successfully for user ID: xxx"

#### Test 4: Frontend Fallback
To test the frontend fallback (simulate trigger failure):
1. Temporarily disable the trigger in dev environment
2. Sign up a new user
3. Check browser console logs
4. ✅ Should see:
   - "⚠️ Profile not found for authenticated user"
   - "Creating fallback profile..."
   - "✅ Fallback profile created successfully"

## Monitoring

### Check Profile Sync Status Regularly
```sql
-- Run this weekly to ensure no drift
SELECT * FROM public.check_profile_sync_status();
```

### Monitor Postgres Logs
In Supabase Dashboard → Database → Logs:
- Filter for "handle_new_user" to see trigger executions
- Filter for "WARNING" to see any profile creation failures

### Monitor Browser Console
New users should see these logs on signup:
```
✅ SIGNUP API CALL SUCCESSFUL
✅ User created in Supabase Auth
ℹ️ Profile creation:
   - Profile will be created automatically by database trigger
```

After login, should see:
```
✅ Profile loaded successfully: user@example.com
```

If profile is missing:
```
⚠️ Profile not found for authenticated user. Attempting to create fallback profile...
✅ Fallback profile created successfully
```

## Rollback Plan

If issues occur, rollback procedure:

### 1. Revert Frontend
```bash
git revert <commit-hash>
# Redeploy
```

### 2. Revert Database (if needed)
```sql
-- Drop new trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Restore from migration 035 or earlier
-- (Copy trigger code from previous migration)
```

### 3. Restore from Backup
```bash
# Via Supabase CLI
supabase db reset --linked
# Then restore from backup file
```

## Verification Checklist

Before marking as complete, verify:

- [ ] Migration 038 applied successfully
- [ ] Migration 039 applied successfully  
- [ ] `check_profile_sync_status()` shows 0 missing profiles
- [ ] Trigger exists and is enabled
- [ ] New user signup creates profile immediately
- [ ] Users can upload images after signup
- [ ] Users can create listings after signup
- [ ] Users appear in Admin Dashboard
- [ ] No errors in Postgres logs
- [ ] No errors in browser console
- [ ] Frontend fallback works if trigger fails

## Troubleshooting

### Problem: User still can't upload images

**Check:**
1. Is user authenticated? `user` should not be null
2. Does profile exist? Check `public.profiles` table
3. Check browser console for errors
4. Check storage bucket policies

**Solution:**
- Log out and log back in (triggers profile fetch/creation)
- Check RLS policies are applied correctly
- Verify storage bucket exists

### Problem: Profile not created after signup

**Check:**
1. Supabase Postgres Logs for trigger execution
2. Look for WARNING messages about profile creation failures
3. Check RLS policies on profiles table

**Solution:**
- Frontend fallback should handle this automatically
- If not, manually create profile:
```sql
INSERT INTO public.profiles (id, email, is_active)
SELECT id, email, true
FROM auth.users
WHERE id = '<user_id>'
ON CONFLICT (id) DO NOTHING;
```

### Problem: Users don't appear in Admin Dashboard

**Check:**
1. Are profiles being created? Check `public.profiles` table
2. Is admin using correct user role filter?

**Solution:**
- Run backfill query from migration 038
- Verify profiles table has data

## Success Criteria

✅ **Fix is successful when:**
1. New users can sign up and immediately appear in Admin Dashboard
2. New users can upload images without "Please login first" error
3. New users can create property listings
4. `check_profile_sync_status()` shows 0 missing profiles
5. No errors in Postgres logs related to profile creation
6. Frontend fallback creates profiles if trigger fails

## Additional Resources

- Migration files:
  - `supabase/migrations/038_fix_profile_creation_comprehensive.sql`
  - `supabase/migrations/039_fix_storage_and_property_policies.sql`
- Frontend changes: `src/contexts/AuthContext.tsx`
- Diagnostic function: `public.check_profile_sync_status()`

## Support

If issues persist after deployment:
1. Check all verification steps above
2. Review Supabase Postgres logs for errors
3. Review browser console logs for errors
4. Contact Supabase support if RLS/trigger issues persist
