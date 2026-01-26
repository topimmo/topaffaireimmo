# Supabase Dashboard Configuration - Required Settings

## ⚠️ CRITICAL: Apply These Settings Immediately

This document contains the **exact configuration** you need to apply in your Supabase Dashboard to fix the signup/email issue.

---

## 1. Authentication → URL Configuration

**Location**: Supabase Dashboard → Authentication → URL Configuration

### Site URL
```
https://topaffaireimmo.com
```
**OR** your actual production domain (not localhost, not preview URLs)

### Redirect URLs (Add ALL of these)
```
https://topaffaireimmo.com/**
https://topaffaireimmo.com/login
https://www.topaffaireimmo.com/**
```

**Why**: The `redirect_not_allowed` error occurs when the frontend sends a redirect URL that's not in this list.

---

## 2. Authentication → Settings → User Signups

**Location**: Supabase Dashboard → Authentication → Settings

### Enable Email Signups
- [x] **ON** (Enabled)

### Confirm Email
**Option A - For Testing** (Recommended First):
- [ ] **OFF** (Disabled) 
- Users can login immediately without clicking email
- Use this to test if signup works without email dependency

**Option B - For Production**:
- [x] **ON** (Enabled)
- Users must click confirmation email before login
- Only enable after SMTP is verified working

**Current Status**: Check what yours is set to and note it: ______________

---

## 3. Authentication → Settings → SMTP Settings

**Location**: Supabase Dashboard → Authentication → Settings → SMTP Settings

### For Hostinger SMTP:

| Setting | Value |
|---------|-------|
| **Enable Custom SMTP** | ✓ ON |
| **Sender Name** | TopAffaireImmo |
| **Sender Email** | noreply@topaffaireimmo.com *(or your email)* |
| **Host** | smtp.hostinger.com |
| **Port Number** | 465 *(for SSL)* or 587 *(for TLS)* |
| **Username** | noreply@topaffaireimmo.com *(full email address)* |
| **Password** | *(Your Hostinger email password or app password)* |

### After Configuring:
1. Scroll down to **"Send test email"**
2. Enter your personal email
3. Click **"Send test email"**
4. Check inbox (and spam folder)

**If test email fails**: 
- Double-check SMTP credentials with Hostinger
- Verify email account exists in Hostinger cPanel
- Check if 2FA is enabled (may need app password)

**If test email succeeds**: 
- ✓ SMTP is working correctly
- Signup emails should now be delivered

---

## 4. Authentication → Email Templates → Confirm signup

**Location**: Supabase Dashboard → Authentication → Email Templates → Confirm signup

### Template Verification:
- [ ] Template is **enabled** (not disabled)
- [ ] Contains `{{ .ConfirmationURL }}` variable
- [ ] Subject line is clear (e.g., "Confirmez votre inscription")
- [ ] Sender name is set to "TopAffaireImmo"

### Sample Template (French):
```html
<h2>Confirmez votre inscription</h2>
<p>Merci de vous être inscrit sur TopAffaireImmo !</p>
<p>Cliquez sur le lien ci-dessous pour confirmer votre adresse email :</p>
<p><a href="{{ .ConfirmationURL }}">Confirmer mon email</a></p>
<p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
```

**The {{ .ConfirmationURL }} variable is CRITICAL** - it's replaced with the actual confirmation link.

---

## 5. Verify Database Migrations Applied

**Location**: Supabase Dashboard → SQL Editor

### Run This Query:
```sql
-- Check if profile creation trigger exists
SELECT 
  tgname AS trigger_name,
  tgenabled AS enabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

**Expected Result**: 1 row with `enabled = 'O'`

**If no result**: 
1. Go to SQL Editor
2. Open `/supabase/migrations/035_fix_signup_rls_policy.sql` from your repo
3. Copy entire content
4. Paste in SQL Editor and run
5. Then open `/supabase/migrations/041_supabase_compatible_profile_fix.sql`
6. Copy and run that too

### Verify RLS Policies:
```sql
-- Check RLS policies on profiles table
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
```

**Expected Result**: At least 4 policies
- Enable delete for users to their own profile (DELETE)
- Enable insert for users to create their own profile (INSERT)
- Enable read access for users to their own profile (SELECT)
- Enable update for users to their own profile (UPDATE)

---

## 6. Quick Verification After Setup

After applying all settings above:

### Test A: SMTP Works
1. Supabase → Auth → SMTP Settings
2. Send test email to yourself
3. Email should arrive within 1 minute

**Result**: ____________ (Pass/Fail)

### Test B: Trigger Exists
1. SQL Editor → Run trigger query (from section 5)
2. Should return 1 row

**Result**: ____________ (Pass/Fail)

### Test C: URLs Whitelisted
1. Authentication → URL Configuration
2. Redirect URLs includes your production domain

**Result**: ____________ (Pass/Fail)

---

## Summary Checklist

Before testing signup, verify:

- [ ] Site URL = Your production domain
- [ ] Redirect URLs include production domain + `/**`
- [ ] Enable email signups = ON
- [ ] SMTP configured (Host, Port, Username, Password)
- [ ] SMTP test email succeeds
- [ ] Email confirmation = OFF (for testing) or ON (for production)
- [ ] Email template enabled and contains `{{ .ConfirmationURL }}`
- [ ] Database migrations applied (trigger and RLS policies exist)

---

## Common Mistakes to Avoid

❌ **Wrong Site URL**: Using `http://localhost:3000` in production  
✅ **Correct**: `https://topaffaireimmo.com`

❌ **Missing Redirect URL**: Not adding production domain  
✅ **Correct**: Add `https://topaffaireimmo.com/**`

❌ **Wrong SMTP Port**: Using port 25 or 465 when provider needs 587  
✅ **Correct**: Check with Hostinger which port to use

❌ **Testing with same email**: Using an email that already signed up  
✅ **Correct**: Use fresh email for each test (e.g., `test1@example.com`, `test2@example.com`)

❌ **Applying migrations to wrong project**: Running SQL in wrong Supabase project  
✅ **Correct**: Verify project ID matches your production project

---

## After Configuration is Complete

1. **Deploy to Vercel** (if you haven't yet):
   - Set environment variable `VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.com`
   - Trigger clean redeploy

2. **Test Signup Flow**:
   - Use fresh email (never used before)
   - Open browser console (F12)
   - Fill form and submit
   - Watch console for logs
   - Check Supabase Dashboard → Auth → Users for new user

3. **Verify Email Delivery**:
   - Check inbox for confirmation email
   - Check spam folder if not in inbox
   - Email should arrive within 1-2 minutes

4. **Test Login**:
   - If email confirmation OFF: Login immediately
   - If email confirmation ON: Click link in email first, then login

---

## Support

If signup still fails after applying all settings:

1. Check browser console for actual error message
2. Check Supabase Auth logs for detailed errors
3. Review `/QUICK_DIAGNOSIS_SIGNUP.md` for step-by-step troubleshooting
4. Review `/PRODUCTION_AUTH_DEPLOYMENT_CHECKLIST.md` for comprehensive guide

**Remember**: The most common issues are:
- SMTP not configured → No emails sent
- Redirect URL not whitelisted → `redirect_not_allowed` error
- Email confirmation ON but email not delivered → Can't login

Fix these first before looking elsewhere.

---

**Last Updated**: 2026-01-26  
**Version**: 1.0  
**Purpose**: Quick reference for Supabase Dashboard configuration
