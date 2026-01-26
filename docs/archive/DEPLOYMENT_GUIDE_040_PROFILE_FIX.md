# Deployment Guide: Migration 040 - Comprehensive Profile Fix

## 🎯 Purpose

This migration comprehensively fixes the production issue where users receive:
> "Erreur de chargement du profil. Veuillez rafraîchir la page."

After successful authentication, users cannot load their profile, blocking access to core features.

## 🔍 What This Migration Fixes

### Root Causes Addressed
1. **Missing Schema Columns**: Adds `is_admin`, `is_verified`, `is_active` columns
2. **Incomplete Trigger**: Recreates trigger with comprehensive error handling
3. **RLS Policy Conflicts**: Cleans up and recreates clear RLS policies
4. **Missing Profiles**: Backfills profiles for existing auth users
5. **No Diagnostics**: Adds troubleshooting function

### Files Changed
- **New Migration**: `supabase/migrations/040_comprehensive_profile_fix.sql`

## 📋 Pre-Deployment Checklist

### Prerequisites
- [ ] Supabase project access (Dashboard or CLI)
- [ ] Admin/Owner privileges
- [ ] Backup created (automatic in Supabase, but verify)

### Verification Steps

#### 1. Check Current Database State
```sql
-- Run in Supabase SQL Editor
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;
```

**Expected**: You may be missing some columns like `is_admin`, `is_verified`, `is_active`

#### 2. Count Missing Profiles
```sql
-- Check how many auth users don't have profiles
SELECT 
  COUNT(*) as missing_profiles
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;
```

**Expected**: May be > 0, will be fixed by backfill

#### 3. Check Existing Trigger
```sql
-- View current trigger function
SELECT 
  proname as function_name,
  prosecdef as security_definer,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'handle_new_user';
```

**Expected**: Function exists but may not have comprehensive error handling

## 🚀 Deployment Steps

### Option 1: Supabase Dashboard (Recommended)

1. **Navigate to SQL Editor**
   - Login to [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Go to "SQL Editor" in left sidebar

2. **Create New Query**
   - Click "New query"
   - Copy entire contents of `supabase/migrations/040_comprehensive_profile_fix.sql`
   - Paste into editor

3. **Review Before Running**
   - Check the file is complete (should be ~520 lines)
   - Verify you're in the correct project
   - Ensure you have backup (automatic in Supabase)

4. **Execute Migration**
   - Click "Run" or press Ctrl+Enter
   - Wait for completion (should take 5-30 seconds)

5. **Check Results**
   - Look for success messages in output
   - Should see "MIGRATION COMPLETE"
   - Should see diagnostic report showing sync status

### Option 2: Supabase CLI

```bash
# Ensure you're in project root
cd /path/to/topaffaireimmo

# Login to Supabase (if not already)
npx supabase login

# Link to your project (if not already)
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply migration
npx supabase db push

# Or apply specific migration
psql $DATABASE_URL -f supabase/migrations/040_comprehensive_profile_fix.sql
```

## ✅ Post-Deployment Verification

### 1. Run Diagnostic Function

```sql
-- Check sync status
SELECT * FROM public.diagnose_profile_sync();
```

**Expected Output**:
| metric | count | details |
|--------|-------|---------|
| Total Auth Users | 5 | Users in auth.users table |
| Total Profiles | 5 | Profiles in public.profiles table |
| **Missing Profiles** | **0** | Auth users without a profile (CRITICAL - should be 0) |
| Orphaned Profiles | 0 | Profiles without an auth user |
| Active Profiles | 5 | Profiles with is_active = true |
| Admin Users | 1 | Profiles with admin privileges |
| Verified Users | 3 | Profiles with email verified |

**CRITICAL**: `Missing Profiles` MUST be 0. If not, migration backfill may have failed.

### 2. Verify Schema Columns

```sql
-- Confirm all required columns exist
SELECT 
  column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('is_admin', 'is_verified', 'is_active', 'user_role', 'company_name')
ORDER BY column_name;
```

**Expected**: All 5 columns returned

### 3. Check Trigger Function

```sql
-- Verify trigger exists and is correct
SELECT 
  tgname,
  tgtype,
  tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

**Expected**: 1 row, `tgenabled = 'O'` (enabled)

### 4. Test RLS Policies

```sql
-- List all policies on profiles table
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';
```

**Expected**: 3 policies:
- `profiles_select_policy` (FOR SELECT)
- `profiles_update_policy` (FOR UPDATE)
- `profiles_insert_policy` (FOR INSERT)

### 5. Check Postgres Logs

**Supabase Dashboard**:
1. Go to "Database" → "Logs"
2. Filter for "Postgres Logs"
3. Search for "Profile backfill"
4. Should see messages like:
   - `Profile backfill completed. Created X profiles.`
   - No ERROR or WARNING messages

## 🧪 Testing

### Test 1: Existing User Login

1. **Login with existing account**
   - Should succeed without errors
   - Profile should load immediately
   - No "Erreur de chargement du profil" error

2. **Check browser console**
   - Should see: `✅ Profile loaded successfully`
   - No errors or warnings

### Test 2: New User Signup

1. **Create new test account**
   - Email: `test-040-fix@example.com`
   - Password: `TestPassword123!`
   - Fill required fields

2. **After signup**
   - User should be created in `auth.users`
   - Profile should be created automatically

3. **Verify in database**
```sql
-- Check new user's profile was created
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.user_role,
  p.is_active,
  p.is_verified,
  p.created_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'test-040-fix@example.com';
```

**Expected**: 1 row returned with all fields populated

### Test 3: Image Upload (Critical Feature)

1. **Login and navigate to "Add Listing"**
2. **Try to upload an image**
   - Should work without errors
   - Should NOT show "Erreur de chargement du profil"

### Test 4: Mobile Testing

1. **Open on mobile device** (or Chrome DevTools mobile emulation)
2. **Login with test account**
3. **Navigate to dashboard**
   - Profile should load correctly
   - No errors

## 📊 Monitoring

### What to Monitor (First 48 Hours)

#### 1. Postgres Logs
- Filter for "handle_new_user"
- Should see successful profile creations
- No ERROR or WARNING entries

#### 2. Application Errors
- Monitor browser console for profile loading errors
- Check Sentry/error tracking (if configured)

#### 3. User Reports
- Ask support team to watch for profile loading issues
- Any reports should be investigated immediately

#### 4. Database Health
```sql
-- Run daily
SELECT * FROM public.diagnose_profile_sync();
```
**Rule**: `missing_profiles` must ALWAYS be 0

## 🔧 Troubleshooting

### Issue: Missing Profiles Count > 0 After Migration

**Cause**: Backfill may have failed for some users

**Fix**:
```sql
-- Manually run backfill again
DO $$
DECLARE
  v_user RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_user IN 
    SELECT au.id, au.email, au.created_at, au.email_confirmed_at, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL
  LOOP
    INSERT INTO public.profiles (id, email, is_active, created_at, updated_at)
    VALUES (v_user.id, v_user.email, true, v_user.created_at, NOW())
    ON CONFLICT (id) DO NOTHING;
    v_count := v_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Created % missing profiles', v_count;
END;
$$;
```

### Issue: Trigger Not Firing for New Users

**Diagnosis**:
```sql
-- Check if trigger exists and is enabled
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

**Fix**:
```sql
-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Issue: RLS Blocking Profile Reads

**Diagnosis**:
```sql
-- Check policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';
```

**Fix**: Re-run Step 3 of migration (RLS policies section)

### Issue: Migration Fails Midway

**Recovery**:
1. Check which step failed (look at error message)
2. Migration is designed to be idempotent - safe to re-run
3. Re-run entire migration from scratch
4. If specific step fails repeatedly, contact support

## 🎯 Success Criteria

Migration is successful when:

- [x] `diagnose_profile_sync()` shows 0 missing profiles
- [x] All required columns exist in profiles table
- [x] Trigger `on_auth_user_created` exists and is enabled
- [x] 3 RLS policies exist on profiles table
- [x] Existing users can login without profile errors
- [x] New users get profiles created automatically
- [x] Image upload works without "profile not loaded" error
- [x] No errors in Postgres logs

## 🔄 Rollback Plan (Emergency Only)

**If critical issues occur** (unlikely, but prepared):

### Rollback Steps

1. **Disable Trigger** (stop auto-creation)
```sql
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
```

2. **Revert to Previous Policies** (if needed)
```sql
-- This would require backup of previous policies
-- Document current policies before migration
```

3. **Restore from Backup** (nuclear option)
```sql
-- Supabase automatic backups available
-- Contact Supabase support for point-in-time recovery
```

**Estimated Rollback Time**: 15-30 minutes  
**Risk**: Very low (migration is additive, no destructive changes)

## 📞 Support

### Internal Escalation
1. Check this guide's troubleshooting section
2. Review Postgres logs for specific errors
3. Run `diagnose_profile_sync()` and share results
4. Contact database team with:
   - Migration file used
   - Error messages (if any)
   - Diagnostic output
   - Postgres log excerpts

### Supabase Support
- Dashboard: Help & Support section
- Email: support@supabase.io
- Discord: [Supabase Community](https://discord.supabase.com)

## 📝 Notes

- Migration is **idempotent** - safe to run multiple times
- Migration is **additive** - no data is deleted
- Migration includes **automatic backfill** - no manual work needed
- Migration adds **diagnostic tools** - easier troubleshooting
- **Zero downtime** - can be applied to live production

## ✅ Final Checklist

Before marking as complete:

- [ ] Migration executed successfully
- [ ] No errors in execution output
- [ ] `diagnose_profile_sync()` shows 0 missing profiles
- [ ] All 5 required columns exist
- [ ] Trigger exists and is enabled
- [ ] 3 RLS policies exist
- [ ] Test login successful
- [ ] Test signup successful
- [ ] Image upload works
- [ ] No profile loading errors
- [ ] Postgres logs clean (no errors)
- [ ] Mobile testing passed
- [ ] Support team notified to monitor

---

**Migration**: `040_comprehensive_profile_fix.sql`  
**Version**: 1.0  
**Date**: 2026-01-26  
**Status**: ✅ Ready for Production
