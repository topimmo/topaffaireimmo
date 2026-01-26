# Supabase Auth Diagnostic Guide

## Quick Diagnosis: Why Signup Isn't Working

Run through this checklist step by step to identify the exact issue.

---

## Step 1: Check Browser Console (2 minutes)

1. Open your production site: `https://topaffaireimmo.com/register`
2. Press `F12` to open DevTools → Console tab
3. Look for Supabase initialization logs

### ✅ What Success Looks Like:
```
🔧 Supabase Client Initialization
  - Environment: production
  - URL configured: true (https://xxxxx.supabase.co...)
  - Anon Key configured: true (eyJhbGciOiJIUzI1...)
  - Is Configured: true
  - Current Domain: https://topaffaireimmo.com
```

### ❌ Problem Signs:
- `Is Configured: false` → Environment variables missing in Vercel
- `URL configured: false` → VITE_SUPABASE_URL not set
- `Anon Key configured: false` → VITE_SUPABASE_ANON_KEY not set

**If you see false, STOP HERE and fix environment variables first.**

---

## Step 2: Test Signup (5 minutes)

1. Stay on `/register` page with console open
2. Use a NEW email (never used before): `test-[your-name]@gmail.com`
3. Fill form and click "S'inscrire"
4. **Watch console logs carefully**

### ✅ Success Log Sequence:
```
📋 REGISTER FORM SUBMITTED
✅ Form validation passed
🔐 SIGNUP PROCESS STARTED
✅ Supabase is configured
Step 4: Email redirect URL configuration
  - Production domain (env): https://topaffaireimmo.com
  - Final emailRedirectTo: https://topaffaireimmo.com/login
✅ SIGNUP API CALL SUCCESSFUL
✅ User created in Supabase Auth
```

### ❌ Error Scenarios:

#### Error A: "redirect_not_allowed"
```
❌ SIGNUP FAILED
Error message: redirect_not_allowed
```
**Cause**: Your production URL is not in Supabase allowed redirect URLs  
**Fix**: 
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add to Redirect URLs: `https://topaffaireimmo.com/**`

#### Error B: "User already registered"
```
❌ SIGNUP FAILED
Error message: User already registered
```
**Cause**: Email already exists in database  
**Fix**: Use a different email OR try logging in with that email

#### Error C: "Email provider error" or "SMTP error"
```
❌ SIGNUP FAILED
Error message: Error sending email
```
**Cause**: SMTP not configured or credentials wrong  
**Fix**: Check Supabase → Authentication → SMTP Settings

#### Error D: "Database error" or "permission denied"
```
❌ SIGNUP FAILED
Error message: Database error
```
**Cause**: RLS policy or database trigger issue  
**Fix**: Check migrations applied (see Step 4)

#### Error E: Generic "Une erreur inattendue"
**Cause**: Real error is being hidden  
**Fix**: Look earlier in console for the ACTUAL error message

---

## Step 3: Check Supabase Dashboard (3 minutes)

### A. Verify User Was Created

1. Go to: **Supabase Dashboard → Authentication → Users**
2. Search for the email you just used
3. Check if user appears in list

**If YES**: User creation works ✓ → Issue is with email delivery  
**If NO**: User creation failed → Check error logs and database

### B. Check Profile Was Created

1. Go to: **Supabase Dashboard → Database → Table Editor → profiles**
2. Search for the email you just used
3. Check if profile exists with same user ID

**If YES**: Profile creation works ✓  
**If NO**: Database trigger not working → Apply migrations (see Step 4)

### C. Check Email Confirmation Status

In **Authentication → Users**, look at your test user:
- `Confirmed At`: Has timestamp → Email confirmed ✓
- `Confirmed At`: Empty → Email not confirmed yet

If email confirmation is REQUIRED (check Auth Settings):
- User cannot login until they click email confirmation link
- Check if email was sent (Step 3D)

### D. Check Email Logs

1. Go to: **Supabase Dashboard → Logs**
2. Select: **Auth Logs** or **Postgres Logs**
3. Search for your test email
4. Look for email sending events or errors

Common email errors:
- SMTP authentication failed → Wrong SMTP credentials
- Connection timeout → Wrong SMTP host/port
- Sender not verified → Email domain not verified with SMTP provider

---

## Step 4: Verify Database Setup (5 minutes)

Go to: **Supabase Dashboard → SQL Editor**

### Query 1: Check if trigger exists
```sql
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

**Expected**: 1 row returned  
**If empty**: Trigger missing → Apply migration `035_fix_signup_rls_policy.sql`

### Query 2: Check RLS policies
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
```

**Expected**: At least 4 policies (SELECT, INSERT, UPDATE, DELETE)  
**If missing**: Policies not created → Apply migration `041_supabase_compatible_profile_fix.sql`

### Query 3: Check for orphaned users
```sql
SELECT u.email, u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
LIMIT 5;
```

**Expected**: 0 rows  
**If users found**: Profile creation failed for these users → Trigger or RLS issue

---

## Step 5: Check Vercel Deployment (3 minutes)

### A. Verify Production Environment Variables

1. Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. Check these exist for **Production** environment:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_PRODUCTION_DOMAIN` (should be `https://topaffaireimmo.com`)

### B. Check You're on Production Deployment

1. Go to: **Vercel → Deployments**
2. Find the deployment with "Production" badge
3. Verify it's using your production domain (not a preview URL)

### C. Trigger Clean Redeploy (if env vars changed)

If you just added/changed environment variables:
1. Go to latest deployment
2. Click "Redeploy"
3. **UNCHECK** "Use existing build cache"
4. Wait for deploy to complete
5. Re-test signup on production URL

---

## Step 6: Check SMTP Configuration (5 minutes)

Go to: **Supabase Dashboard → Authentication → Settings → SMTP Settings**

### Required Fields:
- **SMTP Host**: Should be set (e.g., `smtp.hostinger.com`)
- **SMTP Port**: Should be `465` (SSL) or `587` (TLS)
- **SMTP User**: Your email address
- **SMTP Password**: App password (not your login password)
- **Sender Email**: Must match SMTP user
- **Sender Name**: Your app name (e.g., "TopAffaireImmo")

### Test SMTP:
1. Scroll down to "Send test email"
2. Enter your email address
3. Click "Send test email"
4. Check your inbox (and spam folder)

**If test email fails**: SMTP credentials are wrong  
**If test email succeeds**: SMTP works → Issue might be with redirect URL or rate limiting

---

## Step 7: Check Auth Settings (2 minutes)

Go to: **Supabase Dashboard → Authentication → Settings**

### Important Settings:
- **Enable email signups**: Should be ON ✓
- **Confirm email**: Can be ON or OFF
  - If ON: Users must click email link before login
  - If OFF: Users can login immediately
- **Site URL**: Should be your production domain (`https://topaffaireimmo.com`)
- **Redirect URLs**: Should include:
  - `https://topaffaireimmo.com/login`
  - `https://topaffaireimmo.com/**`

---

## Quick Reference: Common Issues & Fixes

| Problem | Quick Fix |
|---------|-----------|
| `Is Configured: false` | Add env vars in Vercel, redeploy |
| `redirect_not_allowed` | Add production URL to Supabase Redirect URLs |
| User created but no profile | Apply migrations 035 and 041 |
| No confirmation email | Check SMTP settings, send test email |
| Can't login after signup | Check if email confirmation required |
| Generic error message | Check browser console for real error |
| SMTP test fails | Verify SMTP credentials with email provider |

---

## Decision Tree: Is It Working?

```
Start: Can you see Supabase logs in browser?
├─ No → Environment variables not loaded → Fix Vercel env vars
└─ Yes → Is signup creating user in Supabase?
    ├─ No → Database or RLS issue → Check migrations
    └─ Yes → Is profile created?
        ├─ No → Trigger not working → Apply migration 035
        └─ Yes → Is confirmation email sent?
            ├─ No → SMTP issue → Check SMTP settings
            └─ Yes → Can user login?
                ├─ No → Email not confirmed → Check email
                └─ Yes → ✅ Everything works!
```

---

## Get Help

If you're still stuck after going through this checklist:

1. **Gather Diagnostics**:
   - Screenshot of browser console during signup
   - Screenshot of Supabase Auth logs
   - List which steps passed and which failed

2. **Check Detailed Guide**:
   - See `/PRODUCTION_AUTH_DEPLOYMENT_CHECKLIST.md` for comprehensive troubleshooting

3. **Verify Configuration**:
   - All environment variables set in Vercel
   - SMTP configured in Supabase
   - Migrations applied to database
   - Production URL in allowed redirects

---

**Remember**: Most signup issues are caused by:
1. Missing environment variables (40%)
2. SMTP not configured (30%)
3. Redirect URL not whitelisted (20%)
4. Database migrations not applied (10%)

Follow this guide step by step and you'll find the issue!
