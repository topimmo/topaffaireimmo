# START HERE: Fix Profile Loading and Image Upload Issues

## Overview

This document provides step-by-step instructions to configure and deploy fixes for production issues related to:
- **Error fetching profile (500)** after signup/login
- **Image upload failing** due to bucket or permission issues
- **Users not appearing in admin panel**

## Root Cause Summary

### 1. Profile Loading Errors (500)
**Root Cause**: Database trigger `handle_new_user` may fail silently, or RLS policies block profile access
**Impact**: Users can authenticate but cannot load their profile, causing app crashes

### 2. Image Upload Failures
**Root Cause**: Storage bucket RLS policies may block uploads, or bucket doesn't exist
**Impact**: Users cannot upload property images or other files

### 3. Missing Users in Admin
**Root Cause**: Admin user query lacks error handling and doesn't gracefully handle missing profiles
**Impact**: Admin panel may show incomplete user list or crash

## Solution Implemented

### Code Changes

#### 1. Enhanced Profile Management (`src/contexts/AuthContext.tsx`)
- **New `ensureProfile()` function**: Guarantees profile existence using upsert with `onConflict: 'id'`
- **Fault-tolerant `fetchProfile()`**: Handles missing profiles, RLS errors, and network issues
- **Minimal user object fallback**: App continues with basic user data if profile cannot be loaded
- **Called after signup AND login**: Ensures profile exists regardless of trigger reliability

#### 2. Admin Panel Error Handling (`src/pages/AdminPanel.tsx`)
- **Try-catch blocks** around all database operations
- **Detailed error logging** for diagnostics
- **Graceful degradation**: Admin panel shows empty list instead of crashing

#### 3. Startup Validation (`src/lib/startup-validation.ts`)
- **Environment variable validation**: Checks for required Supabase config
- **Database connectivity test**: Ensures connection to Supabase
- **Storage bucket validation**: Verifies all 4 required buckets exist
- **Runs on app initialization**: Catches configuration issues early

#### 4. Image Upload (Already Robust)
- **Retry logic**: 2 attempts with exponential backoff
- **Detailed error logging**: Shows permission, size, and type errors
- **Bucket configuration**: Validates max size and allowed file types

## Supabase Configuration Checklist

### A. Database Tables

#### 1. Verify `profiles` table exists
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';
```

**Required columns:**
- `id` (uuid, primary key, references auth.users)
- `email` (text)
- `full_name` (text)
- `phone` (text, nullable)
- `user_role` (text)
- `company_name` (text, nullable)
- `is_admin` (boolean)
- `is_active` (boolean)
- `is_verified` (boolean)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

#### 2. Verify RLS policies on `profiles`
Run migration `041_supabase_compatible_profile_fix.sql` if not already applied:

```bash
# In Supabase Dashboard → SQL Editor
# Paste contents of supabase/migrations/041_supabase_compatible_profile_fix.sql
```

**Expected policies:**
1. `Enable read access for users to their own profile` - SELECT
2. `Enable insert for users to create their own profile` - INSERT
3. `Enable update for users to their own profile` - UPDATE
4. `Enable delete for users to their own profile` - DELETE

**Verify policies:**
```sql
SELECT policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'profiles';
```

#### 3. Verify database trigger exists
```sql
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
  AND trigger_schema = 'auth';
```

**Expected trigger:** `on_auth_user_created` on `auth.users` AFTER INSERT

### B. Storage Buckets

#### 1. Create required buckets (if missing)

In **Supabase Dashboard → Storage**:
1. Click "New bucket"
2. Create each bucket:
   - `property-images` (Public: Yes)
   - `banner-images` (Public: Yes)
   - `payment-receipts` (Public: No)
   - `agency-logos` (Public: Yes)

#### 2. Configure RLS policies on buckets

For **property-images**:
```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-images');

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

Repeat similar policies for other buckets (adjust `bucket_id` and public access settings).

### C. Authentication Settings

In **Supabase Dashboard → Authentication → Settings**:

#### 1. Email Configuration
- **Enable email confirmations**: Optional (works with or without)
- **Site URL**: Set to your production domain (e.g., `https://topaffaireimmo.com`)
- **Redirect URLs**: Add allowed redirect URLs:
  - `https://topaffaireimmo.com/**` (production)
  - `http://localhost:5173/**` (development)
  - Your Vercel preview URLs (if needed)

#### 2. SMTP Settings (Optional but recommended)
Configure custom SMTP for better email deliverability:
- See `docs/SUPABASE_DASHBOARD_EMAIL_CONFIG.md` for detailed setup

## Vercel Environment Variables

In **Vercel Dashboard → Project → Settings → Environment Variables**:

### Required Variables
| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://[PROJECT_ID].supabase.co` | All (Production, Preview, Development) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | All |
| `VITE_PRODUCTION_DOMAIN` | `https://topaffaireimmo.com` | Production only |

### How to Set
1. Go to Vercel Dashboard
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Add each variable:
   - Variable Name: `VITE_SUPABASE_URL`
   - Value: `https://[YOUR_PROJECT_ID].supabase.co`
   - Environment: Check all (Production, Preview, Development)
   - Click "Save"
5. Repeat for other variables
6. **Redeploy** your application after adding variables

### Finding Your Supabase Values
1. Go to **Supabase Dashboard** → Your Project
2. Click **Settings** (gear icon) → **API**
3. Copy:
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **anon/public key** → Use as `VITE_SUPABASE_ANON_KEY`

## Testing Checklist

### 1. Test New User Signup
- [ ] Go to `/register`
- [ ] Fill in all fields (email, password, full name, phone)
- [ ] Click "Sign Up"
- [ ] Check browser console for:
  - ✅ "SIGNUP API CALL SUCCESSFUL"
  - ✅ "Profile ensured successfully"
  - ⚠️ Any errors logged
- [ ] Verify in Supabase Dashboard:
  - **Authentication → Users**: User exists
  - **Database → profiles**: Profile row created with correct data
- [ ] If email confirmation enabled:
  - [ ] Check email inbox for confirmation link
  - [ ] Click link and verify redirect to `/login`
  - [ ] Log in and verify profile loads

### 2. Test Existing User Login
- [ ] Go to `/login`
- [ ] Enter existing user credentials
- [ ] Click "Sign In"
- [ ] Check browser console for:
  - ✅ "SIGNIN SUCCESSFUL"
  - ✅ "Profile ensured successfully after login"
  - ✅ "Profile loaded successfully"
- [ ] Verify app loads without errors
- [ ] Check that user role displays correctly

### 3. Test Profile Recovery (Missing Profile Scenario)
To simulate a missing profile:
1. In Supabase Dashboard, delete a user's profile row (keep auth.users row)
2. Try to log in as that user
3. Expected behavior:
   - Login succeeds
   - `ensureProfile()` creates new profile
   - App continues with minimal user data if creation fails
   - No hard crash or 500 error

### 4. Test Image Upload
- [ ] Log in as advertiser
- [ ] Go to "Add Property" page
- [ ] Select property images (test with 2-3 images)
- [ ] Click upload
- [ ] Check browser console for:
  - ✅ "[Storage] Upload successful" for each file
  - ✅ Public URL returned
  - ⚠️ Any permission errors
- [ ] Verify images appear in property preview
- [ ] Check Supabase Storage bucket for uploaded files

### 5. Test Admin Panel
- [ ] Log in as admin user
- [ ] Go to `/admin` or admin panel route
- [ ] Verify:
  - [ ] Users list loads (no crash)
  - [ ] All users from profiles table displayed
  - [ ] Can toggle user status (active/inactive)
  - [ ] Can change user role
  - [ ] Error handling works (check console for any fetch errors)

### 6. Test Startup Validation
- [ ] Open browser console before app loads
- [ ] Look for startup validation logs:
  - ✅ "Running startup validation..."
  - ✅ "Validating environment variables..."
  - ✅ "Testing database connectivity..."
  - ✅ "Validating storage buckets..."
  - ✅ "STARTUP VALIDATION PASSED"
- [ ] Verify warnings are logged if any config is missing
- [ ] Test with missing env var (temporarily remove one):
  - [ ] App should log error but still attempt to start
  - [ ] In production, consider blocking app start on critical errors

## Troubleshooting

### Issue: "Profile loading failed" after login
**Possible causes:**
1. RLS policies not applied
2. Migration 041 not run
3. Database connection issue

**Solutions:**
1. Run migration 041 in Supabase Dashboard
2. Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'profiles'`
3. Verify database connectivity in browser console startup logs
4. Check user role in profiles table matches expected value

### Issue: Image upload fails with "Permission denied"
**Possible causes:**
1. Storage bucket doesn't exist
2. RLS policy blocks upload
3. User profile missing or has wrong role

**Solutions:**
1. Verify bucket exists in Supabase Dashboard → Storage
2. Check bucket RLS policies (see Section B.2 above)
3. Verify user has profile with `is_active: true`
4. Check browser console for detailed error message

### Issue: Users not appearing in admin panel
**Possible causes:**
1. Admin user doesn't have `is_admin: true`
2. Fetch query fails silently
3. RLS policy blocks admin from viewing profiles

**Solutions:**
1. Set admin user in Supabase: `UPDATE profiles SET is_admin = true WHERE email = 'admin@example.com'`
2. Check browser console for error logs from fetchUsers()
3. Verify admin RLS policy allows reading all profiles (see migration 041)

### Issue: Startup validation shows warnings
**Common warnings:**
- "VITE_PRODUCTION_DOMAIN is not set" - Set this env var for production
- "Storage bucket not found" - Create missing buckets in Supabase
- "VITE_SUPABASE_URL should use HTTPS" - Use HTTPS URL from Supabase

**Action:** Address warnings by updating configuration as described in sections above

## Production Deployment

### Before Deploying
- [ ] All environment variables set in Vercel
- [ ] Migration 041 applied in Supabase production database
- [ ] Storage buckets created with correct RLS policies
- [ ] At least one admin user created (`is_admin: true`)
- [ ] Site URL configured in Supabase Auth settings
- [ ] SMTP configured for email delivery (optional)

### After Deploying
- [ ] Run all tests from Testing Checklist
- [ ] Monitor browser console for errors
- [ ] Check Supabase logs for any database errors
- [ ] Verify image uploads work in production
- [ ] Test signup flow end-to-end
- [ ] Test login flow end-to-end
- [ ] Verify admin panel loads and functions

## Quick Commands

### Check Database Status
```sql
-- Count users without profiles
SELECT count(*) FROM auth.users u 
LEFT JOIN public.profiles p ON p.id = u.id 
WHERE p.id IS NULL;

-- List all profiles
SELECT id, email, user_role, is_admin, is_active 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- List RLS policies
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'profiles';
```

### Create Admin User
```sql
-- Set existing user as admin
UPDATE profiles 
SET is_admin = true, user_role = 'admin' 
WHERE email = 'your-admin@example.com';
```

### Test Profile Creation
```sql
-- Manually create a profile (if needed for testing)
INSERT INTO profiles (id, email, full_name, user_role, is_active, is_admin)
VALUES (
  'USER_ID_FROM_AUTH_USERS',
  'test@example.com',
  'Test User',
  'real_estate_advertiser',
  true,
  false
);
```

## Support

If you encounter issues not covered in this guide:

1. **Check browser console** for detailed error messages
2. **Check Supabase logs** in Dashboard → Logs
3. **Verify RLS policies** are correctly configured
4. **Test with a fresh user** to isolate existing data issues
5. **Contact support** with console logs and Supabase error messages

## Summary of Changes

### Files Modified
- `src/contexts/AuthContext.tsx` - Enhanced profile management
- `src/pages/AdminPanel.tsx` - Added error handling
- `src/App.tsx` - Integrated startup validation

### Files Added
- `src/lib/startup-validation.ts` - Configuration validation utility
- `START_HERE_FIX_PROFILE_AND_UPLOAD.md` - This documentation

### Database Changes Required
- Migration 041 must be applied (RLS policies)
- Storage buckets must be created with RLS policies
- Admin user must be designated in profiles table

### Environment Variables Required
- `VITE_SUPABASE_URL` (required)
- `VITE_SUPABASE_ANON_KEY` (required)
- `VITE_PRODUCTION_DOMAIN` (recommended for production)
