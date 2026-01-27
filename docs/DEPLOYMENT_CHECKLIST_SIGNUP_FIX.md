# Deployment Checklist: Signup Fix & Admin Whitelist

**Migration**: 045_add_admin_whitelist_and_fix_signup.sql  
**Date**: _____________  
**Deployed By**: _____________  

---

## Pre-Deployment Checklist

### Documentation Review
- [ ] Read `docs/EXECUTIVE_SUMMARY_SIGNUP_FIX.md`
- [ ] Review `docs/DEPLOYMENT_GUIDE_SIGNUP_FIX.md`
- [ ] Understand rollback procedure

### Environment Preparation
- [ ] Verify Supabase CLI installed (`supabase --version`)
- [ ] Verify connected to correct project (`supabase status`)
- [ ] Backup current database (Supabase Dashboard → Database → Backups)
- [ ] Prepare list of admin emails to whitelist

### Team Notification
- [ ] Notify team of upcoming deployment
- [ ] Schedule deployment during low-traffic period
- [ ] Prepare monitoring plan

---

## Deployment Steps

### Step 1: Apply Migration ⏱️ 5 minutes

**Via Supabase CLI** (recommended):
```bash
cd /path/to/topaffaireimmo
supabase db push
```
- [ ] Migration executed successfully
- [ ] No errors in output
- [ ] Screenshot taken of success message

**OR Via Supabase Dashboard**:
1. Go to Database → SQL Editor
2. Copy/paste entire migration file
3. Click "Run"
- [ ] Migration executed successfully
- [ ] Success message displayed
- [ ] Screenshot taken

### Step 2: Verify Installation ⏱️ 5 minutes

**Run verification script**:
```bash
./scripts/verify-signup-fix.sh
```
- [ ] All checks passed (green ✓)
- [ ] No failed checks (red ✗)
- [ ] Warnings reviewed (yellow ⚠️)
- [ ] Output saved/screenshot taken

**Manual verification**:
```sql
-- Check admin_whitelist exists
SELECT * FROM public.admin_whitelist LIMIT 1;

-- Check triggers installed
SELECT tgname FROM pg_trigger 
WHERE tgname IN ('on_auth_user_created', 'on_profile_check_admin_whitelist');
```
- [ ] admin_whitelist table exists
- [ ] Both triggers found
- [ ] RLS enabled on both tables

### Step 3: Add Admin Emails ⏱️ 2 minutes

**Prepare SQL**:
```sql
INSERT INTO public.admin_whitelist (email, notes)
VALUES 
  ('admin@topaffaireimmo.com', 'Primary platform administrator'),
  ('owner@topaffaireimmo.com', 'Business owner')
  -- Add more as needed
ON CONFLICT (email) DO NOTHING;
```
- [ ] Admin emails inserted
- [ ] Verification query run
- [ ] Count matches expected number

**Verify**:
```sql
SELECT email, notes, created_at 
FROM public.admin_whitelist 
ORDER BY created_at;
```

### Step 4: Test Normal User Signup ⏱️ 3 minutes

**Open incognito window**:
1. Navigate to: https://topaffaireimmo.com/register
2. Fill form with test data:
   - Email: `test-normal-YYYYMMDD@example.com`
   - Password: Strong password
   - Name, phone, etc.
   - Announcer Type: Propriétaire
3. Submit

**Expected**:
- [ ] Success message: "Compte créé avec succès!"
- [ ] Confirmation email message shown
- [ ] No database error
- [ ] Screenshot taken

**Verify in database**:
```sql
SELECT u.email, p.user_role, p.announcer_type, p.is_admin
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'test-normal-YYYYMMDD@example.com';
```
- [ ] user_role = 'user'
- [ ] announcer_type = 'proprietaire'
- [ ] is_admin = false

### Step 5: Test Whitelisted Admin Signup ⏱️ 3 minutes

**Add test email to whitelist**:
```sql
INSERT INTO public.admin_whitelist (email, notes)
VALUES ('test-admin-YYYYMMDD@example.com', 'Test admin account');
```

**Open new incognito window**:
1. Navigate to: https://topaffaireimmo.com/register
2. Fill form:
   - Email: `test-admin-YYYYMMDD@example.com`
   - Other fields as before
3. Submit

**Expected**:
- [ ] Success message shown
- [ ] No database error
- [ ] Screenshot taken

**Verify in database**:
```sql
SELECT u.email, p.user_role, p.announcer_type, p.is_admin
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'test-admin-YYYYMMDD@example.com';
```
- [ ] user_role = 'admin'
- [ ] announcer_type = NULL
- [ ] is_admin = true

### Step 6: Test Email Confirmation ⏱️ 5 minutes

**Check email**:
- [ ] Confirmation email received for test accounts
- [ ] Email from address correct
- [ ] Links point to correct domain

**Click confirmation link**:
- [ ] Redirects to https://topaffaireimmo.com/auth/callback
- [ ] No 404 or 502 error
- [ ] Successful authentication
- [ ] Redirected to dashboard

**Verify in database**:
```sql
SELECT email, email_confirmed_at, is_verified
FROM auth.users
WHERE email LIKE 'test-%YYYYMMDD@example.com';
```
- [ ] email_confirmed_at is NOT NULL
- [ ] Timestamp is recent

### Step 7: Monitor Logs ⏱️ 5 minutes

**Supabase Dashboard → Database → Logs**:
- [ ] Filter by: Last 30 minutes
- [ ] Look for: NOTICE, WARNING, ERROR
- [ ] Review any warnings
- [ ] Verify NOTICE messages about profile creation

**Expected NOTICE messages**:
- "Profile created/updated for user ... with role ..."
- "Email ... is whitelisted, promoting to admin" (for admin test)

**Check for errors**:
- [ ] No RLS permission denied errors
- [ ] No constraint violation errors
- [ ] No trigger execution errors

### Step 8: Cleanup Test Data ⏱️ 2 minutes

**Remove test accounts**:
```sql
-- Delete test users (profiles auto-deleted via CASCADE)
DELETE FROM auth.users 
WHERE email IN (
  'test-normal-YYYYMMDD@example.com',
  'test-admin-YYYYMMDD@example.com'
);

-- Remove test email from whitelist
DELETE FROM public.admin_whitelist
WHERE email = 'test-admin-YYYYMMDD@example.com';

-- Verify cleanup
SELECT COUNT(*) FROM auth.users 
WHERE email LIKE 'test-%YYYYMMDD@example.com';
-- Expected: 0
```
- [ ] Test users deleted
- [ ] Test whitelist entry removed
- [ ] Verification query confirms cleanup

---

## Post-Deployment Monitoring

### First Hour
- [ ] Check signup activity in logs
- [ ] Monitor for any error spikes
- [ ] Verify real user signups working

### First 24 Hours
- [ ] Review database logs twice daily
- [ ] Check signup completion rate
- [ ] Gather user feedback (if any issues)

### First Week
- [ ] Daily log review
- [ ] Track success metrics
- [ ] Document any edge cases

---

## Environment Variables Verification

### Vercel Dashboard
**Settings → Environment Variables**:

- [ ] `VITE_SUPABASE_URL` present and correct
- [ ] `VITE_SUPABASE_ANON_KEY` present and correct
- [ ] `VITE_PRODUCTION_DOMAIN` set to production domain
- [ ] NO `VITE_SUPABASE_SERVICE_ROLE_KEY` (security check)

### Supabase Dashboard
**Authentication → URL Configuration**:

- [ ] Site URL: `https://topaffaireimmo.com`
- [ ] Redirect URLs include:
  - [ ] `https://topaffaireimmo.com/*`
  - [ ] `https://www.topaffaireimmo.com/*`
  - [ ] `https://topaffaireimmo.com/auth/callback`
  - [ ] `http://localhost:5173/*` (for development)

---

## Success Metrics

### Technical Metrics (Day 1)
- [ ] Zero "database error" incidents
- [ ] 100% of signups create profiles
- [ ] All whitelisted emails promoted to admin
- [ ] Email confirmation delivery rate > 95%

### User Experience Metrics (Week 1)
- [ ] Signup completion rate baseline established
- [ ] Zero support tickets for signup errors
- [ ] User feedback positive (if collected)

---

## Issue Response Plan

### If Database Error Occurs

1. **Check Logs**:
   ```
   Supabase Dashboard → Database → Logs
   Look for: Trigger errors, RLS errors, constraint violations
   ```

2. **Check Specific User**:
   ```sql
   -- Find user by email
   SELECT * FROM auth.users WHERE email = 'user@example.com';
   
   -- Check if profile exists
   SELECT * FROM public.profiles WHERE email = 'user@example.com';
   
   -- Check for orphaned users
   SELECT u.email FROM auth.users u
   LEFT JOIN public.profiles p ON u.id = p.id
   WHERE p.id IS NULL;
   ```

3. **Review Error Details**:
   - SQLSTATE code (e.g., 23505 = unique violation)
   - Error message and context
   - Check if trigger executed

### If Admin Promotion Fails

1. **Verify whitelist entry**:
   ```sql
   SELECT * FROM public.admin_whitelist 
   WHERE LOWER(email) = LOWER('admin@example.com');
   ```

2. **Check logs for NOTICE**:
   ```
   Should see: "Email ... is whitelisted, promoting to admin"
   ```

3. **Manual promotion if needed**:
   ```sql
   UPDATE public.profiles
   SET user_role = 'admin', is_admin = true, announcer_type = NULL
   WHERE email = 'admin@example.com';
   ```

### If Email Confirmation Broken

1. **Check SMTP settings**:
   ```
   Supabase Dashboard → Settings → Auth → SMTP Settings
   ```

2. **Check email template**:
   ```
   Dashboard → Authentication → Email Templates
   Verify "Confirm signup" template exists
   ```

3. **Test email delivery**:
   ```
   Dashboard → Authentication → Users
   Send test confirmation email
   ```

---

## Rollback Procedure

**Only if critical issues arise**

### Execute Rollback SQL

```sql
-- 1. Drop new objects
DROP TRIGGER IF EXISTS on_profile_check_admin_whitelist ON public.profiles;
DROP FUNCTION IF EXISTS public.check_and_promote_admin() CASCADE;
DROP TABLE IF EXISTS public.admin_whitelist CASCADE;

-- 2. Restore previous handle_new_user from migration 044
-- (Copy function from migration 044 and execute)
```

### Verify Rollback
```sql
-- Check triggers
SELECT tgname FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass;
-- Should only show: on_auth_user_created

-- Check tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'admin_whitelist';
-- Should return: 0 rows
```

### Test After Rollback
- [ ] Signup works (reverts to previous behavior)
- [ ] No new errors introduced
- [ ] Team notified of rollback

---

## Sign-Off

### Deployment
- **Date**: _____________
- **Time**: _____________
- **Deployed By**: _____________
- **Verification By**: _____________

### Testing
- **Normal Signup Test**: ☐ Pass ☐ Fail
- **Admin Signup Test**: ☐ Pass ☐ Fail
- **Email Confirmation**: ☐ Pass ☐ Fail
- **Logs Review**: ☐ Clean ☐ Issues Found

### Status
- ☐ ✅ Deployment Successful
- ☐ ⚠️ Partial Success (with notes)
- ☐ ❌ Rollback Required

### Notes
```
[Add any observations, issues encountered, or deviations from plan]




```

---

## Quick Reference

| Task | Command/Location |
|------|-----------------|
| Apply migration | `supabase db push` |
| Verify installation | `./scripts/verify-signup-fix.sh` |
| Add admin email | INSERT INTO admin_whitelist... |
| Check logs | Dashboard → Database → Logs |
| Test signup | https://topaffaireimmo.com/register |
| Rollback | Execute rollback SQL (see above) |

---

**Deployment Guide**: `docs/DEPLOYMENT_GUIDE_SIGNUP_FIX.md`  
**Root Cause Analysis**: `docs/SIGNUP_ERROR_ROOT_CAUSE_ANALYSIS.md`  
**Quick Reference**: `docs/SIGNUP_FIX_README.md`  

---

**Good luck with the deployment! 🚀**
