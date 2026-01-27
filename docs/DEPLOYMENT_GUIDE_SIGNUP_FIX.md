# Deployment Guide: Signup Fix & Admin Whitelist

## Overview

This guide walks through deploying Migration 045 which fixes the "database error" on signup and adds admin whitelist functionality.

**Timeline**: ~30 minutes  
**Complexity**: Medium  
**Risk**: Low (migration is idempotent and includes rollback plan)  

---

## Prerequisites

- [ ] Access to Supabase Dashboard
- [ ] Access to Vercel Dashboard
- [ ] Admin privileges in Supabase project
- [ ] Backup of current database (recommended)

---

## Step 1: Review Changes

### Files Modified/Created

1. **New Migration**: `supabase/migrations/045_add_admin_whitelist_and_fix_signup.sql`
2. **New Documentation**: `docs/SIGNUP_ERROR_ROOT_CAUSE_ANALYSIS.md`
3. **New Guide**: `docs/DEPLOYMENT_GUIDE_SIGNUP_FIX.md` (this file)

### What Migration 045 Does

✅ Creates `public.admin_whitelist` table  
✅ Updates `handle_new_user()` trigger function with:
  - Admin whitelist check
  - Better error logging
  - Input validation
✅ Adds `check_and_promote_admin()` trigger for retroactive promotion  
✅ Sets proper RLS policies on new table  
✅ Improves error handling throughout  

### Breaking Changes

❌ **None** - Migration is backward compatible

---

## Step 2: Backup Database (Recommended)

### Option A: Supabase Dashboard

1. Go to **Database** → **Backups**
2. Click **"Create Backup"**
3. Wait for backup to complete
4. Note backup ID for potential restore

### Option B: pg_dump (if you have direct access)

```bash
# Only if you have database credentials
pg_dump -h db.YOUR_PROJECT.supabase.co \
  -U postgres \
  -d postgres \
  --clean \
  --if-exists \
  > backup_before_045_$(date +%Y%m%d).sql
```

---

## Step 3: Deploy Migration 045

### Option A: Supabase CLI (Recommended)

```bash
# 1. Ensure you're in the project root
cd /path/to/topaffaireimmo

# 2. Login to Supabase (if not already)
supabase login

# 3. Link to your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_ID

# 4. Review migration before applying
cat supabase/migrations/045_add_admin_whitelist_and_fix_signup.sql

# 5. Apply migration
supabase db push

# 6. Verify migration applied
supabase db remote list
# Should show: 045_add_admin_whitelist_and_fix_signup.sql
```

### Option B: Supabase Dashboard

1. Go to **Database** → **SQL Editor**
2. Create new query
3. Copy entire contents of `supabase/migrations/045_add_admin_whitelist_and_fix_signup.sql`
4. Paste into SQL editor
5. Click **"Run"**
6. Check for success message (no errors)

**Expected Output**:
```
Success
Migration completed successfully
```

---

## Step 4: Verify Migration

### 4.1: Check Tables Exist

```sql
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'admin_whitelist')
ORDER BY table_name;
```

**Expected Result**:
| table_name | table_type |
|------------|------------|
| admin_whitelist | BASE TABLE |
| profiles | BASE TABLE |

### 4.2: Check Triggers Installed

```sql
SELECT 
  t.tgname AS trigger_name,
  t.tgrelid::regclass AS table_name,
  p.proname AS function_name,
  CASE t.tgenabled
    WHEN 'O' THEN 'enabled'
    WHEN 'D' THEN 'disabled'
    ELSE 'unknown'
  END AS status
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid IN ('auth.users'::regclass, 'public.profiles'::regclass)
AND t.tgname IN ('on_auth_user_created', 'on_profile_check_admin_whitelist')
ORDER BY table_name, trigger_name;
```

**Expected Result**:
| trigger_name | table_name | function_name | status |
|-------------|------------|---------------|---------|
| on_auth_user_created | auth.users | handle_new_user | enabled |
| on_profile_check_admin_whitelist | public.profiles | check_and_promote_admin | enabled |

### 4.3: Check RLS Policies

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END AS using_clause,
  CASE
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END AS with_check_clause
FROM pg_policies
WHERE tablename IN ('profiles', 'admin_whitelist')
ORDER BY tablename, policyname;
```

**Expected Result**: Should show policies for both tables with appropriate clauses.

### 4.4: Check Function Definitions

```sql
-- Check handle_new_user function
SELECT 
  p.proname AS function_name,
  pg_get_functiondef(p.oid) LIKE '%admin_whitelist%' AS checks_whitelist,
  p.prosecdef AS is_security_definer
FROM pg_proc p
WHERE p.proname = 'handle_new_user';
```

**Expected Result**:
| function_name | checks_whitelist | is_security_definer |
|--------------|------------------|---------------------|
| handle_new_user | true | true |

---

## Step 5: Add Admin Emails to Whitelist

### Identify Admin Emails

List emails that should have admin access:
- Platform owner/administrator
- Customer support leads
- Technical administrators

### Add to Whitelist

```sql
-- Replace with your actual admin emails
INSERT INTO public.admin_whitelist (email, notes)
VALUES 
  ('admin@topaffaireimmo.com', 'Primary platform administrator'),
  ('owner@topaffaireimmo.com', 'Business owner'),
  ('support@topaffaireimmo.com', 'Customer support lead')
ON CONFLICT (email) DO NOTHING;

-- Verify inserted
SELECT email, notes, created_at
FROM public.admin_whitelist
ORDER BY created_at;
```

**Important**: 
- Use lowercase emails (whitelist check is case-insensitive)
- Add notes for documentation
- Only add trusted emails (admins have full platform access)

---

## Step 6: Verify Environment Variables

### Vercel Environment Variables

1. Go to **Vercel Dashboard** → **Project** → **Settings** → **Environment Variables**

2. Verify these exist and are correct:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.com
```

3. **Critical Security Check**:

```bash
# Search for service_role key (should NOT exist in VITE_* vars)
# If found, REMOVE IMMEDIATELY - this is a security vulnerability

❌ WRONG:
VITE_SUPABASE_SERVICE_ROLE_KEY=...

✅ CORRECT:
# Service role key should ONLY be in Edge Functions secrets
# Never exposed to client via VITE_* prefix
```

### Supabase Auth URLs

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**

2. Verify settings:

```
Site URL:
https://topaffaireimmo.com

Redirect URLs:
https://topaffaireimmo.com/*
https://www.topaffaireimmo.com/*
https://topaffaireimmo.com/auth/callback
https://www.topaffaireimmo.com/auth/callback
http://localhost:5173/*
http://localhost:5173/auth/callback
```

3. Click **"Save"**

---

## Step 7: Test Signup Flow

### Test 1: Normal User Signup

**Objective**: Verify non-whitelisted email creates user role

1. Open incognito/private browser window
2. Navigate to: https://topaffaireimmo.com/register
3. Fill form:
   ```
   Email: test-normal-user@example.com
   Password: TestPassword123!
   Full Name: Test Normal User
   Phone: +212 600 000 001
   Announcer Type: Propriétaire
   ```
4. Click **"S'inscrire"**

**Expected Result**:
- ✅ Success message: "Compte créé avec succès!"
- ✅ Message: "Vérifiez votre email pour le lien de confirmation"
- ✅ No database error

**Verification**:
```sql
-- Check user and profile created
SELECT 
  u.id,
  u.email,
  u.created_at AS user_created,
  p.user_role,
  p.announcer_type,
  p.is_admin
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'test-normal-user@example.com';
```

**Expected Database State**:
- user_role = 'user'
- announcer_type = 'proprietaire'
- is_admin = false

### Test 2: Whitelisted Admin Signup

**Objective**: Verify whitelisted email auto-promotes to admin

1. First, add test email to whitelist:
   ```sql
   INSERT INTO public.admin_whitelist (email, notes)
   VALUES ('test-admin@example.com', 'Test admin account');
   ```

2. Open new incognito window
3. Navigate to: https://topaffaireimmo.com/register
4. Fill form:
   ```
   Email: test-admin@example.com
   Password: AdminPassword123!
   Full Name: Test Admin User
   Announcer Type: Propriétaire
   ```
5. Click **"S'inscrire"**

**Expected Result**:
- ✅ Success message shown
- ✅ No database error

**Verification**:
```sql
SELECT 
  u.id,
  u.email,
  p.user_role,
  p.announcer_type,
  p.is_admin
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'test-admin@example.com';
```

**Expected Database State**:
- user_role = 'admin'
- announcer_type = NULL (admins don't have announcer type)
- is_admin = true

### Test 3: Email Confirmation Flow

**Objective**: Verify email confirmation works end-to-end

1. Use email from Test 1 or Test 2
2. Check email inbox for confirmation email
3. Click confirmation link
4. **Expected**: Redirect to https://topaffaireimmo.com/auth/callback
5. **Expected**: Successful login
6. **Expected**: Redirect to appropriate dashboard

**If Email Not Received**:
- Check spam folder
- Verify SMTP configured in Supabase Dashboard → Settings → Auth
- Check Supabase logs for email send errors

### Test 4: Error Handling

**Objective**: Verify error messages are clear and specific

1. Try signup with existing email
2. **Expected**: Clear error message (not generic "database error")
3. Error should specify: "Email already registered" or similar

**Verification in Logs**:
```
Supabase Dashboard → Database → Logs

Look for:
- NOTICE: Profile created/updated for user...
- WARNING: (if any errors occurred)
- Detailed error with SQLSTATE code
```

---

## Step 8: Monitor Logs

### Initial Monitoring (First 24 Hours)

Check logs frequently for any issues:

1. **Auth Logs**: Supabase Dashboard → Authentication → Logs
   - Look for failed signup attempts
   - Check error messages

2. **Database Logs**: Supabase Dashboard → Database → Logs
   - Look for trigger errors
   - Check for WARNING messages
   - Verify NOTICE messages for successful profile creation

3. **Vercel Logs**: Vercel Dashboard → Project → Logs
   - Check for frontend errors
   - Look for failed API calls

### Key Success Indicators

✅ **No "database error" messages in UI**  
✅ **All signups show success message**  
✅ **Profiles created for all new users**  
✅ **Whitelisted emails auto-promoted to admin**  
✅ **Email confirmations delivered**  

### Red Flags

🚨 Users report "database error"  
🚨 Profiles not created after signup  
🚨 Trigger errors in database logs  
🚨 RLS permission denied errors  
🚨 Email confirmations not delivered  

---

## Step 9: Cleanup Test Data

After successful testing, remove test accounts:

```sql
-- Delete test users
DELETE FROM auth.users 
WHERE email IN (
  'test-normal-user@example.com',
  'test-admin@example.com'
);

-- Profiles will be deleted via CASCADE

-- Remove test email from whitelist
DELETE FROM public.admin_whitelist
WHERE email = 'test-admin@example.com';

-- Verify cleanup
SELECT COUNT(*) FROM auth.users WHERE email LIKE 'test-%@example.com';
-- Expected: 0
```

---

## Troubleshooting

### Issue: Migration Fails to Apply

**Symptoms**: Error when running migration

**Solutions**:

1. Check for syntax errors:
   ```sql
   -- Run migration in SQL editor and look for specific error
   ```

2. Check for conflicting objects:
   ```sql
   -- See if table already exists
   SELECT * FROM public.admin_whitelist LIMIT 1;
   ```

3. Check permissions:
   ```sql
   -- Verify you have necessary privileges
   SELECT current_user, current_database();
   ```

### Issue: Signup Still Shows Database Error

**Symptoms**: Users still see "Erreur de base de données"

**Debug Steps**:

1. Check trigger is installed:
   ```sql
   SELECT * FROM pg_trigger 
   WHERE tgname = 'on_auth_user_created';
   ```

2. Check logs for specific error:
   ```
   Supabase Dashboard → Database → Logs
   Filter by: WARNING or ERROR
   ```

3. Test trigger manually:
   ```sql
   -- Create test user in auth.users and check if profile created
   -- (Use Supabase Auth UI or auth.admin.createUser)
   ```

4. Check RLS policies:
   ```sql
   -- Temporarily disable RLS for testing
   ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
   -- Try signup again
   -- Re-enable RLS after testing
   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
   ```

### Issue: Admin Promotion Not Working

**Symptoms**: Whitelisted emails still get user role

**Debug Steps**:

1. Verify email in whitelist:
   ```sql
   SELECT * FROM public.admin_whitelist 
   WHERE LOWER(email) = LOWER('admin@example.com');
   ```

2. Check trigger logs:
   ```
   Database Logs → Look for NOTICE: "Email ... is whitelisted"
   ```

3. Verify trigger function updated:
   ```sql
   SELECT pg_get_functiondef(oid)
   FROM pg_proc
   WHERE proname = 'handle_new_user';
   -- Should contain: admin_whitelist check
   ```

### Issue: Email Confirmation Not Working

**Symptoms**: Users don't receive confirmation emails

**Solutions**:

1. Check SMTP configuration:
   ```
   Supabase Dashboard → Settings → Auth → SMTP Settings
   ```

2. Check email template:
   ```
   Supabase Dashboard → Authentication → Email Templates
   Verify "Confirm signup" template exists
   ```

3. Check Supabase logs:
   ```
   Logs → Filter: "email"
   Look for: "Failed to send email"
   ```

4. Verify redirect URLs:
   ```
   Auth → URL Configuration
   Ensure production domain in Redirect URLs
   ```

---

## Rollback Procedure

If migration causes critical issues:

### Step 1: Execute Rollback SQL

```sql
-- 1. Drop new objects
DROP TRIGGER IF EXISTS on_profile_check_admin_whitelist ON public.profiles;
DROP FUNCTION IF EXISTS public.check_and_promote_admin() CASCADE;
DROP TABLE IF EXISTS public.admin_whitelist CASCADE;

-- 2. Restore previous handle_new_user from migration 044
-- (Copy from migration 044 file and execute)
```

### Step 2: Verify Rollback

```sql
-- Check triggers
SELECT tgname FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass;
-- Should only show: on_auth_user_created

-- Check tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'admin_whitelist';
-- Should return: 0 rows
```

### Step 3: Test Signup

- Try normal signup
- Should work as before migration

### Step 4: Report Issue

If rollback needed, report:
- Error messages from logs
- Steps to reproduce issue
- Database state before/after migration

---

## Post-Deployment Checklist

- [ ] Migration 045 applied successfully
- [ ] Admin emails added to whitelist
- [ ] Test signup (normal user) works
- [ ] Test signup (whitelisted admin) works
- [ ] Email confirmation flow works
- [ ] No database errors in UI
- [ ] Logs show successful profile creation
- [ ] Environment variables verified
- [ ] Test data cleaned up
- [ ] Team notified of changes

---

## Next Steps

After successful deployment:

1. **Monitor Signup Activity**
   - Check logs daily for first week
   - Watch for any error patterns

2. **Document Admin Emails**
   - Keep list of whitelisted emails in secure location
   - Update whitelist as team changes

3. **User Communication**
   - Notify users if signup flow has improved
   - Update any help documentation

4. **Performance Monitoring**
   - Monitor trigger execution time
   - Watch for any database performance impact

---

## Support & Contact

For issues or questions:

1. Check this deployment guide
2. Review root cause analysis: `docs/SIGNUP_ERROR_ROOT_CAUSE_ANALYSIS.md`
3. Check Supabase logs for error details
4. Contact development team with:
   - Error messages
   - Steps to reproduce
   - Database logs
   - User impact assessment

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Verified By**: _______________  
**Status**: ⬜ Success ⬜ Partial ⬜ Rollback Required  

---

## Conclusion

This deployment fixes the signup database error by:
- ✅ Adding admin whitelist functionality
- ✅ Improving error handling and logging
- ✅ Ensuring deterministic role assignment
- ✅ Making signup reliable and robust

Expected outcome: Zero signup errors, working admin whitelist, clear error messages.
