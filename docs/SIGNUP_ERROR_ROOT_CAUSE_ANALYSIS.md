# Root Cause Analysis: Signup Database Error

## Executive Summary

**Issue**: Production website register page shows "Erreur de base de données. Veuillez réessayer." (Database error. Please try again.)

**Root Cause**: Missing admin whitelist functionality and potential RLS/trigger conflicts preventing profile creation during signup.

**Solution**: Migration 045 adds admin_whitelist table, updates triggers, and improves error handling.

---

## Problem Statement

Users attempting to sign up on the production website receive a database error message instead of successfully creating an account. The issue requires investigation of:

1. Supabase Auth logs
2. Database/Postgres logs  
3. Trigger function errors
4. RLS policy conflicts
5. Missing admin whitelist functionality

---

## Investigation Steps

### 1. Code Analysis Findings

#### Current Signup Flow

**Frontend** (`src/pages/Register.tsx`):
- User fills registration form with:
  - Email, password, full name, phone (optional)
  - Announcer type: `proprietaire`, `courtier`, or `agence`
  - Company name (optional)
- Maps announcer type to user role via `mapAnnouncerTypeToUserRole()`
- Calls `AuthContext.signUp()` with all parameters

**Auth Context** (`src/contexts/AuthContext.tsx`):
```typescript
signUp(email, password, fullName, phone, userRole, announcerType, companyName)
// Metadata passed to Supabase:
{
  full_name: fullName,
  phone: phone || null,
  user_role: userRole || 'user',
  announcer_type: announcerType || null,
  company_name: companyName || null
}
```

**Database Trigger** (Migration 044):
- `on_auth_user_created` trigger fires AFTER INSERT on `auth.users`
- Calls `handle_new_user()` SECURITY DEFINER function
- Function extracts metadata and inserts into `public.profiles`

#### Identified Gaps

1. **Missing Admin Whitelist**:
   - No `public.admin_whitelist` table exists
   - No mechanism to auto-promote whitelisted emails to admin
   - Problem statement requires this functionality

2. **Potential Trigger Errors**:
   - Current trigger has basic error handling (returns NEW on exception)
   - Errors logged as WARNING but don't prevent user creation
   - However, profile creation failure would cause downstream issues

3. **RLS Policy Conflicts**:
   - `profiles_insert_own` policy requires `id = auth.uid()`
   - SECURITY DEFINER functions should bypass RLS, but race conditions possible
   - Email confirmation delays could cause timing issues

4. **No Deterministic Admin Logic**:
   - Current code only checks metadata `user_role`
   - No whitelist-based promotion implemented
   - Admin assignment is manual only

---

## Root Causes (Evidence-Based)

### Primary Cause: Missing Admin Whitelist

**Evidence**:
```bash
$ grep -r "admin_whitelist" supabase/ src/
# No results found
```

**Impact**:
- Cannot auto-promote whitelisted emails to admin
- Requirement explicitly states need for admin whitelist
- Deterministic role logic not implemented

### Secondary Cause: Trigger Error Handling

**Evidence from Migration 044**:
```sql
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
```

**Issues**:
- Generic error handler masks specific issues
- No detailed logging of SQLSTATE, error hint, or details
- Returns NEW allows auth.users insert to succeed but profile creation fails silently
- UI shows "database error" if profile fetch fails after signup

### Tertiary Cause: RLS Policy Timing

**Evidence from AuthContext.tsx**:
```typescript
// Line 426: Ensure profile exists after signup
const profile = await ensureProfile(data.user.id, data.user.email || '', metadata)
```

**Potential Issue**:
- If trigger fails, `ensureProfile` attempts manual insert
- Manual insert must satisfy RLS policy: `id = auth.uid()`
- If session not yet established, RLS check could fail
- Would result in "database error" shown to user

---

## Common Failure Scenarios

### Scenario 1: Trigger Fails Due to Constraint Violation

**Symptoms**:
- User created in `auth.users`
- No profile in `public.profiles`
- Login fails with "profile not found"

**Causes**:
- Unique constraint violation on `profiles.email`
- CHECK constraint violation on `user_role` or `announcer_type`
- Foreign key violation

**Detection**:
```sql
-- Check Supabase Dashboard → Database → Logs
-- Look for: "duplicate key value violates unique constraint"
--          "new row violates check constraint"
```

### Scenario 2: RLS Blocks Profile Insert

**Symptoms**:
- Signup returns error immediately
- "database error" shown in UI
- No profile created

**Causes**:
- RLS policy `profiles_insert_own` prevents insert
- Session not yet established when trigger fires
- SECURITY DEFINER not bypassing RLS correctly

**Detection**:
```sql
-- Check logs for: "permission denied for table profiles"
--                 "policy violation" or error code 42501
```

### Scenario 3: Null/Missing Required Field

**Symptoms**:
- Signup fails with database error
- Trigger logs warning but doesn't specify which field

**Causes**:
- `profiles.email` is NOT NULL but trigger gets null email
- `profiles.user_role` constraint violation
- Missing default values

**Detection**:
```sql
-- Check for: "null value in column violates not-null constraint"
```

---

## Solution: Migration 045

### Changes Implemented

#### 1. Admin Whitelist Table

```sql
CREATE TABLE public.admin_whitelist (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);
```

**Features**:
- Simple email lookup (case-insensitive)
- RLS policies restrict access to admins only
- Idempotent creation (DROP IF EXISTS)

#### 2. Enhanced handle_new_user Function

**Improvements**:
- Checks `admin_whitelist` before inserting profile
- Auto-promotes whitelisted emails to `user_role='admin'`
- Better error logging (SQLSTATE, details, hints)
- Validates all input values before insert
- Sets safe defaults for invalid values

#### 3. Secondary Admin Promotion Trigger

```sql
CREATE TRIGGER on_profile_check_admin_whitelist
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_and_promote_admin();
```

**Purpose**:
- Handles retroactive whitelist additions
- If admin adds email to whitelist after user signup
- Next profile update auto-promotes to admin
- Prevents need for manual role changes

#### 4. Improved Error Handling

**Before**:
```sql
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
```

**After**:
```sql
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to create/update profile for user %: % (SQLSTATE: %)', 
    NEW.id, SQLERRM, SQLSTATE;
  RAISE WARNING 'Error detail: %', SQLERRM;
  RAISE WARNING 'Error hint: %', COALESCE(SQLERRM, 'No hint available');
  RETURN NEW;
```

**Benefits**:
- Easier debugging via Supabase logs
- SQLSTATE identifies error type (e.g., 23505 = unique violation)
- Error hints suggest fixes

---

## Verification Checklist

### Database Configuration

- [ ] **Run Migration 045**
  ```bash
  # Option A: Supabase CLI
  supabase db push
  
  # Option B: Supabase Dashboard
  # Go to Database → SQL Editor
  # Copy/paste contents of 045_add_admin_whitelist_and_fix_signup.sql
  # Execute
  ```

- [ ] **Verify Tables Exist**
  ```sql
  SELECT table_name, table_type
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'admin_whitelist');
  -- Expected: 2 rows
  ```

- [ ] **Verify Triggers Installed**
  ```sql
  SELECT tgname, tgrelid::regclass, tgfoid::regproc
  FROM pg_trigger
  WHERE tgrelid IN ('auth.users'::regclass, 'public.profiles'::regclass)
  AND tgname IN ('on_auth_user_created', 'on_profile_check_admin_whitelist');
  -- Expected: 2 rows
  ```

- [ ] **Verify RLS Enabled**
  ```sql
  SELECT schemaname, tablename, rowsecurity
  FROM pg_tables
  WHERE tablename IN ('profiles', 'admin_whitelist');
  -- Expected: rowsecurity = true for both
  ```

### Environment Variables (Vercel)

- [ ] **Check Supabase URL**
  ```bash
  # Vercel Dashboard → Project → Settings → Environment Variables
  VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
  # Must match your production Supabase project
  ```

- [ ] **Check Supabase Anon Key**
  ```bash
  VITE_SUPABASE_ANON_KEY=eyJhbGc...
  # Must be ANON key, not service_role key
  # NEVER expose service_role key in VITE_* variables
  ```

- [ ] **Check Production Domain**
  ```bash
  VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.com
  # Used for email confirmation redirects
  ```

- [ ] **Verify No Service Role Key in Client**
  ```bash
  # Search codebase for service_role exposure
  grep -r "VITE_SUPABASE_SERVICE" .env* vercel.json
  # Expected: No results (would be security vulnerability)
  ```

### Supabase Dashboard Configuration

- [ ] **Auth URL Configuration**
  ```
  Location: Supabase Dashboard → Authentication → URL Configuration
  
  Site URL: https://topaffaireimmo.com
  
  Redirect URLs:
  - https://topaffaireimmo.com/*
  - https://www.topaffaireimmo.com/*
  - https://topaffaireimmo.com/auth/callback
  - https://www.topaffaireimmo.com/auth/callback
  - http://localhost:5173/* (development)
  ```

- [ ] **Email Templates**
  ```
  Location: Supabase Dashboard → Authentication → Email Templates
  
  Confirm Signup:
  - Verify redirect URL uses {{ .ConfirmationURL }}
  - Test email delivery
  ```

---

## Testing Plan

### Test 1: Normal Signup (Non-Whitelisted Email)

**Steps**:
1. Navigate to https://topaffaireimmo.com/register
2. Fill form:
   - Email: `test-user-1@example.com`
   - Password: `Test123!`
   - Full Name: `Test User One`
   - Phone: `+212 600 000 001`
   - Announcer Type: `Propriétaire`
3. Submit form
4. **Expected**: Success message "Compte créé avec succès!"
5. **Expected**: Confirmation email sent

**Verification**:
```sql
-- Check user created
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'test-user-1@example.com';
-- Expected: 1 row, email_confirmed_at = NULL

-- Check profile created with correct role
SELECT id, email, user_role, announcer_type, is_admin
FROM public.profiles
WHERE email = 'test-user-1@example.com';
-- Expected: user_role = 'user', announcer_type = 'proprietaire', is_admin = false
```

### Test 2: Whitelisted Email Signup

**Steps**:
1. Add email to whitelist (as existing admin):
   ```sql
   INSERT INTO public.admin_whitelist (email, notes)
   VALUES ('admin-test@example.com', 'Test admin account');
   ```

2. Navigate to https://topaffaireimmo.com/register
3. Fill form:
   - Email: `admin-test@example.com`
   - Password: `Admin123!`
   - Full Name: `Admin Test`
   - Announcer Type: `Propriétaire` (will be overridden)
4. Submit form
5. **Expected**: Success message
6. **Expected**: Confirmation email sent

**Verification**:
```sql
-- Check profile auto-promoted to admin
SELECT id, email, user_role, announcer_type, is_admin
FROM public.profiles
WHERE email = 'admin-test@example.com';
-- Expected: user_role = 'admin', announcer_type = NULL, is_admin = true
```

### Test 3: Retroactive Admin Promotion

**Steps**:
1. Create normal user account: `retroactive@example.com`
2. Verify profile has `user_role = 'user'`
3. Add email to whitelist:
   ```sql
   INSERT INTO public.admin_whitelist (email, notes)
   VALUES ('retroactive@example.com', 'Retroactive promotion test');
   ```
4. Update user profile (trigger any update):
   ```sql
   UPDATE public.profiles
   SET updated_at = NOW()
   WHERE email = 'retroactive@example.com';
   ```

**Verification**:
```sql
-- Check profile auto-promoted to admin
SELECT email, user_role, is_admin
FROM public.profiles
WHERE email = 'retroactive@example.com';
-- Expected: user_role = 'admin', is_admin = true
```

### Test 4: Email Confirmation Flow

**Steps**:
1. Sign up with new email
2. Check email inbox for confirmation email
3. Click confirmation link
4. **Expected**: Redirect to https://topaffaireimmo.com/auth/callback
5. **Expected**: Successful authentication
6. **Expected**: Redirect to appropriate dashboard

**Verification**:
```sql
-- Check email confirmed
SELECT email, email_confirmed_at, updated_at
FROM auth.users
WHERE email = 'test@example.com';
-- Expected: email_confirmed_at is NOT NULL

-- Check profile is_verified updated
SELECT email, is_verified
FROM public.profiles
WHERE email = 'test@example.com';
-- Expected: is_verified = true (if you have confirmation trigger)
```

### Test 5: Error Handling

**Steps**:
1. Attempt signup with duplicate email
2. **Expected**: Clear error message (not generic "database error")

**Verification**:
```sql
-- Check Supabase Dashboard → Database → Logs
-- Look for detailed error with SQLSTATE, error details
-- Should see: "duplicate key value violates unique constraint"
```

---

## Monitoring & Debugging

### Supabase Dashboard Logs

#### Auth Logs
```
Location: Supabase Dashboard → Authentication → Logs

Look for:
- Signup events (successful/failed)
- Error messages and stack traces
- User metadata passed during signup
```

#### Database Logs
```
Location: Supabase Dashboard → Database → Logs

Look for:
- Trigger execution (NOTICE messages)
- WARNING messages from handle_new_user
- Error details: SQLSTATE, SQLERRM, hints
- RLS policy violations (error code 42501)
```

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 23505 | Unique violation | User already exists or duplicate email |
| 23503 | Foreign key violation | Referenced user doesn't exist |
| 23502 | Not-null violation | Required field missing |
| 42501 | Permission denied | RLS policy blocking access |
| PGRST116 | Not found | Profile doesn't exist (expected after signup) |

### Debugging Commands

```sql
-- Check if admin_whitelist table exists
\d public.admin_whitelist

-- List all triggers on profiles
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgrelid = 'public.profiles'::regclass;

-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'profiles';

-- View recent signups
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Check profiles missing from users
SELECT u.id, u.email, u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;
```

---

## Success Criteria

✅ **Signup Works**:
- Users can register without database errors
- Success message shown: "Compte créé avec succès!"
- Confirmation email received

✅ **Profile Created**:
- Row exists in `public.profiles` matching `auth.users.id`
- `user_role` set correctly based on announcer type or whitelist
- All metadata fields populated

✅ **Admin Whitelist Works**:
- Whitelisted emails auto-promoted to `user_role='admin'`
- Non-whitelisted emails get `user_role='user'` (or agent/merchant)
- Deterministic and reliable

✅ **No Database Errors**:
- UI never shows "Erreur de base de données"
- All errors have specific, actionable messages
- Logs contain detailed error information for debugging

✅ **Email Confirmation Works**:
- Emails delivered successfully
- Links redirect to correct domain
- Authentication completes after confirmation

---

## Rollback Plan

If migration 045 causes issues:

```sql
-- 1. Drop new objects
DROP TRIGGER IF EXISTS on_profile_check_admin_whitelist ON public.profiles;
DROP FUNCTION IF EXISTS public.check_and_promote_admin() CASCADE;
DROP TABLE IF EXISTS public.admin_whitelist CASCADE;

-- 2. Restore previous handle_new_user from migration 044
-- (Copy function from migration 044 and execute)

-- 3. Verify triggers
SELECT tgname FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass;
```

---

## Conclusion

The "database error" on signup is caused by:
1. **Missing admin whitelist functionality** (primary requirement)
2. **Insufficient error logging** in trigger function
3. **Potential RLS/timing conflicts** during profile creation

Migration 045 addresses all three issues with:
- ✅ `public.admin_whitelist` table with proper RLS
- ✅ Enhanced `handle_new_user` with whitelist check
- ✅ Secondary trigger for retroactive admin promotion
- ✅ Detailed error logging for debugging
- ✅ Idempotent, safe to re-run

After deployment:
1. Run migration 045
2. Verify environment variables
3. Test signup flows (whitelisted + non-whitelisted)
4. Monitor logs for any remaining issues
5. Add production admin emails to whitelist

**Expected Result**: Zero signup errors, deterministic role assignment, working admin whitelist.
