# Deployment Guide: Auth Fix

This guide walks through deploying the auth registration/login fix to production.

---

## Pre-Deployment Checklist

- [ ] Review migration 046 code
- [ ] Backup production database
- [ ] Test migration on staging environment (if available)
- [ ] Notify team about upcoming deployment
- [ ] Have rollback plan ready

---

## Step 1: Backup Database

### Option A: Via Supabase Dashboard
1. Go to Supabase Dashboard
2. Select your project
3. Navigate to **Database** → **Backups**
4. Click **Create Backup**
5. Name it: `pre-auth-fix-{date}`
6. Wait for completion

### Option B: Via SQL
```sql
-- Export profiles table
COPY (SELECT * FROM public.profiles) TO '/tmp/profiles_backup.csv' CSV HEADER;
```

---

## Step 2: Apply Migration 046

### Option A: Via Supabase Dashboard (Recommended)

1. Go to **SQL Editor** in Supabase Dashboard
2. Create new query
3. Copy contents of `/supabase/migrations/046_fix_announcer_type_column.sql`
4. Paste into SQL editor
5. Review the SQL
6. Click **Run**
7. Verify success message

**Expected Output**:
```
NOTICE: Added announcer_type column
NOTICE: Migrated data from advertiser_type to announcer_type
...
Success: Rows returned
```

### Option B: Via Supabase CLI

```bash
# From project root
supabase db push

# Or apply specific migration
supabase migration up --db-url "postgresql://..."
```

### Verify Migration Applied

Run this query in SQL Editor:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('advertiser_type', 'announcer_type')
ORDER BY column_name;
```

**Expected Output**:
```
column_name      | data_type | is_nullable
----------------|-----------|-------------
advertiser_type | text      | YES
announcer_type  | text      | YES
```

---

## Step 3: Configure Redirect URLs

### Navigate to Auth Settings
1. Open Supabase Dashboard
2. Select your project
3. Go to **Authentication** → **URL Configuration**

### Set Site URL
Enter your primary production domain:
```
https://topaffaireimmo.com
```

### Add Redirect URLs
Add each URL on a separate line:

```
https://topaffaireimmo.com/**
https://www.topaffaireimmo.com/**
https://topaffaireimmo.com/auth/callback
https://www.topaffaireimmo.com/auth/callback
https://topaffaireimmo.com/reset-password
https://www.topaffaireimmo.com/reset-password
https://*.vercel.app/**
http://localhost:5173/**
http://localhost:5173/auth/callback
http://localhost:5173/reset-password
```

### Save Changes
Click **Save** at the bottom

---

## Step 4: Verify Environment Variables

### Check Vercel Environment Variables

1. Go to Vercel Dashboard
2. Select `topaffaireimmo` project
3. Go to **Settings** → **Environment Variables**
4. Verify these exist for **Production**:

```bash
VITE_SUPABASE_URL=https://[your-project].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.com
```

### Add Missing Variables
If `VITE_PRODUCTION_DOMAIN` is missing:
1. Click **Add New**
2. Key: `VITE_PRODUCTION_DOMAIN`
3. Value: `https://topaffaireimmo.com`
4. Environment: **Production**
5. Click **Save**

---

## Step 5: Deploy Application

### Option A: Via Vercel (Automatic)

If you merged the PR to main branch:
1. Vercel automatically deploys
2. Monitor deployment in Vercel Dashboard
3. Wait for "Deployment Ready" status

### Option B: Manual Trigger

```bash
# From project root
vercel --prod

# Or via Vercel CLI
vercel deploy --prod
```

### Monitor Deployment
1. Go to Vercel Dashboard → Deployments
2. Click on latest deployment
3. Check **Build Logs** for errors
4. Wait for "Deployment Ready"

---

## Step 6: Smoke Test (Production)

### Test 1: New User Signup

1. Open incognito/private browser window
2. Go to `https://topaffaireimmo.com/register`
3. Fill in form:
   - Email: `test+{timestamp}@yourdomain.com`
   - Password: `TestPassword123!`
   - Full Name: `Test User`
   - Announcer Type: Propriétaire
4. Click "S'inscrire"

**Expected**: 
- ✅ Success screen appears
- ✅ "Compte créé avec succès!" message
- ✅ No error in browser console

### Test 2: Email Confirmation

1. Check email inbox for confirmation
2. Click confirmation link
3. Verify redirect to `/auth/callback`
4. Verify redirect to home page

**Expected**:
- ✅ Email received within 2 minutes
- ✅ Confirmation successful
- ✅ Redirected to home page

### Test 3: Login

1. Go to `https://topaffaireimmo.com/login`
2. Enter email from Test 1
3. Enter password from Test 1
4. Click "Se connecter"

**Expected**:
- ✅ Login successful
- ✅ Redirected to appropriate page based on role
- ✅ User name shown in header

### Test 4: Logout

1. Click "Se déconnecter" in header
2. Verify logged out
3. Verify redirect to home page

**Expected**:
- ✅ User logged out
- ✅ Session cleared

---

## Step 7: Database Verification

### Check Profile Created Correctly

```sql
SELECT 
  id, 
  email, 
  user_role, 
  announcer_type, 
  advertiser_type,
  is_active,
  is_verified,
  created_at
FROM public.profiles
WHERE email = 'test+{timestamp}@yourdomain.com';
```

**Expected Output**:
```
user_role: user
announcer_type: proprietaire
advertiser_type: owner
is_active: true
is_verified: false (until email confirmed)
```

### Check for Orphaned Users

```sql
SELECT COUNT(*) as orphaned_users
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
```

**Expected**: `0`

### Check Trigger Still Works

```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created'
AND tgrelid = 'auth.users'::regclass;
```

**Expected**:
```
tgname: on_auth_user_created
tgenabled: O (enabled)
```

---

## Step 8: Monitor Production

### First Hour
Check every 15 minutes for:
- [ ] New signups successful
- [ ] No errors in Supabase Auth logs
- [ ] No errors in Vercel function logs
- [ ] Email delivery working

### First Day
Check every 4 hours for:
- [ ] Signup success rate normal (>95%)
- [ ] No spike in support tickets
- [ ] Database performance normal
- [ ] No RLS policy errors

### Monitoring Queries

**Signup rate today**:
```sql
SELECT COUNT(*) as signups_today
FROM auth.users
WHERE created_at > CURRENT_DATE;
```

**Profile creation success rate**:
```sql
SELECT 
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT p.id) as users_with_profiles,
  (COUNT(DISTINCT p.id)::float / COUNT(DISTINCT u.id) * 100) as success_rate
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.created_at > CURRENT_DATE;
```

**Expected**: `success_rate = 100.0`

---

## Step 9: Documentation Update

### Update README
Add note about recent auth fix:

```markdown
## Recent Updates

### Auth Fix (January 2026)
- Fixed "Database error saving new user" issue
- Added `announcer_type` column to profiles table
- Updated redirect URLs for email confirmation
- Improved error logging and user feedback

See `docs/ROOT_CAUSE_ANALYSIS.md` for details.
```

### Update Environment Setup Guide
Ensure `.env.example` is up to date:
```bash
VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.com
```

---

## Step 10: Cleanup

### Remove Test Account
```sql
-- Get test user ID
SELECT id FROM auth.users WHERE email = 'test+{timestamp}@yourdomain.com';

-- Delete profile (cascade will remove user)
DELETE FROM public.profiles WHERE id = '{user-id}';
```

### Archive Logs
Save deployment logs and monitoring data for reference

### Team Notification
Send update to team:

```
Subject: ✅ Auth Fix Deployed Successfully

The auth registration/login fix has been deployed to production.

Changes:
- Fixed "Database error saving new user" 
- Added announcer_type column
- Updated redirect URLs
- Enhanced error logging

Testing:
- Signup flow: ✅ Working
- Email confirmation: ✅ Working
- Login flow: ✅ Working
- Session persistence: ✅ Working

Monitoring:
- Check Supabase Auth logs for any issues
- Support team alerted for potential user questions

Documentation:
- Root Cause: docs/ROOT_CAUSE_ANALYSIS.md
- Test Plan: docs/AUTH_TEST_PLAN.md
- Redirect URLs: docs/SUPABASE_AUTH_REDIRECT_URLS.md
```

---

## Rollback Procedure

### If Critical Issues Found

**Stop new signups** (temporary):
```sql
-- Disable signup
UPDATE auth.config 
SET enable_signup = false;
```

**Revert migration**:
```sql
-- Drop new column
ALTER TABLE public.profiles DROP COLUMN announcer_type CASCADE;

-- Restore old trigger
-- (Copy from backup or migration 042)
```

**Restore old code**:
```bash
# Revert to previous deployment
vercel rollback

# Or redeploy previous commit
git revert HEAD
git push
```

**Re-enable signups**:
```sql
UPDATE auth.config 
SET enable_signup = true;
```

---

## Success Criteria

Deployment is considered **successful** when:

- [ ] Migration 046 applied without errors
- [ ] Redirect URLs configured in Supabase
- [ ] Environment variables set in Vercel
- [ ] Application deployed to production
- [ ] Smoke tests pass (signup, confirm, login, logout)
- [ ] Database queries show correct data
- [ ] No orphaned users
- [ ] Zero errors in first hour
- [ ] Signup success rate >99% in first day
- [ ] No increase in support tickets

---

## Support

### Common Issues

**Issue**: "Invalid redirect URL"
**Solution**: Verify URL is in Supabase redirect list with wildcards

**Issue**: Email not received
**Solution**: Check Supabase SMTP settings, verify sender email

**Issue**: "Database error" still occurring
**Solution**: Check migration applied, verify column exists

### Emergency Contacts
- Tech Lead: [contact]
- DevOps: [contact]
- Supabase Support: support@supabase.com

---

## Post-Deployment

### Week 1
- [ ] Monitor signup rates
- [ ] Review error logs
- [ ] Check support tickets
- [ ] Collect user feedback

### Week 2
- [ ] Analyze performance metrics
- [ ] Review security logs
- [ ] Update documentation if needed
- [ ] Plan next improvements

### Month 1
- [ ] Full retrospective
- [ ] Update monitoring dashboard
- [ ] Improve error handling based on data
- [ ] Document lessons learned
