# 🚨 CRITICAL PRE-LAUNCH CONFIGURATION GUIDE

**⏱️ Estimated Time:** 30-60 minutes  
**❗ Status:** BLOCKING - Must complete before launch

---

## 🎯 OVERVIEW

TopAffaireImmo code is **production-ready**, but requires **3 critical configurations** in external services (Supabase Dashboard and Vercel). Without these, authentication will fail.

**What Works Now:**
✅ Build system  
✅ TypeScript compilation  
✅ Database schema & RLS  
✅ PWA configuration  
✅ SEO setup

**What's Broken Without Configuration:**
❌ Password reset emails  
❌ Email confirmation links  
❌ Auth callback redirects  
❌ User registration completion

---

## 📋 CONFIGURATION TASKS

### ✅ Task 1: Configure Supabase Redirect URLs (15 min)

**Why:** Supabase validates all redirect URLs for security. Without this, password reset and signup confirmation links will fail with "otp_expired" or "invalid_link" errors.

**Steps:**

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Select your TopAffaireImmo project

2. **Navigate to Authentication Settings**
   - Left sidebar → Authentication → URL Configuration

3. **Set Site URL**
   ```
   https://www.topaffaireimmo.com
   ```
   (Your primary production domain)

4. **Add ALL These Redirect URLs** (one per line):
   ```
   https://www.topaffaireimmo.com/**
   https://topaffaireimmo.com/**
   https://www.topaffaireimmo.com/auth/callback
   https://topaffaireimmo.com/auth/callback
   https://www.topaffaireimmo.com/reset-password
   https://topaffaireimmo.com/reset-password
   http://localhost:5173/**
   ```

5. **Click Save**

**Verification:**
- ✅ Site URL shows your production domain
- ✅ All 7 redirect URLs are listed
- ✅ Both `www` and non-`www` versions included

**Troubleshooting:**
- If you see "Invalid redirect URL" errors, make sure URLs match exactly (including `https://`)
- Wildcards (`**`) are supported for path matching

---

### ✅ Task 2: Configure Vercel Environment Variables (10 min)

**Why:** These variables tell the app what domain to use for auth redirects. Without them, emails will contain wrong URLs.

**Steps:**

1. **Go to Vercel Dashboard**
   - URL: https://vercel.com
   - Select TopAffaireImmo project

2. **Navigate to Settings → Environment Variables**

3. **Add These Variables:**

   **Variable 1: VITE_SITE_URL**
   ```
   Key: VITE_SITE_URL
   Value: https://www.topaffaireimmo.com
   Environments: ✅ Production ✅ Preview ✅ Development
   ```

   **Variable 2: VITE_PRODUCTION_DOMAIN**
   ```
   Key: VITE_PRODUCTION_DOMAIN  
   Value: https://topaffaireimmo.com
   Environments: ✅ Production
   ```

   **Variable 3: VITE_SUPABASE_URL** (if not set)
   ```
   Key: VITE_SUPABASE_URL
   Value: https://YOUR_PROJECT_ID.supabase.co
   Environments: ✅ Production ✅ Preview ✅ Development
   ```

   **Variable 4: VITE_SUPABASE_ANON_KEY** (if not set)
   ```
   Key: VITE_SUPABASE_ANON_KEY
   Value: your_anon_key
   Environments: ✅ Production ✅ Preview ✅ Development
   ```

4. **Click Save**

5. **Redeploy the Application**
   - Go to Deployments tab
   - Click on latest deployment
   - Click "..." → Redeploy
   - Wait for deployment to complete

**Verification:**
After redeployment, open browser console on production site:
```javascript
console.log(import.meta.env.VITE_SITE_URL)
// Should output: https://www.topaffaireimmo.com
```

**Troubleshooting:**
- If variables don't appear, make sure you clicked "Save" and redeployed
- Variables starting with `VITE_` are exposed to the browser
- Check deployment logs for any build errors

---

### ✅ Task 3: Configure SMTP Email (20 min)

**Why:** Supabase uses SMTP to send password reset and confirmation emails. Without this, emails won't be sent (silent failure).

**Steps:**

1. **Choose an SMTP Provider** (if you don't have one):
   - **SendGrid** (Recommended) - Free tier: 100 emails/day
   - **Mailgun** - Free tier: 5,000 emails/month
   - **Gmail SMTP** - Simple but has limits

2. **Get SMTP Credentials** from your provider:
   - SMTP Host (e.g., `smtp.sendgrid.net`)
   - SMTP Port (usually `587` for TLS)
   - SMTP Username
   - SMTP Password

3. **Go to Supabase Dashboard**
   - Left sidebar → Settings → Auth

4. **Scroll to SMTP Settings Section**

5. **Enable Custom SMTP** and fill in:
   ```
   SMTP Host: smtp.sendgrid.net (or your provider)
   SMTP Port: 587
   SMTP User: apikey (for SendGrid) or your username
   SMTP Pass: YOUR_SENDGRID_API_KEY or password
   Sender Email: noreply@topaffaireimmo.com
   Sender Name: TopAffaireImmo
   ```

6. **Click Save**

7. **Test Email Sending:**
   - Go to Authentication → Users
   - Click "Invite User" 
   - Enter a test email
   - Check if email arrives

**Verification:**
- ✅ SMTP settings saved successfully
- ✅ Test email received in inbox (or spam folder)
- ✅ Email contains correct production domain in links

**Troubleshooting:**
- **Email not arriving:** Check spam folder, verify SMTP credentials
- **Wrong domain in email:** Make sure Task 1 (Site URL) is set correctly
- **"Authentication failed" error:** Verify SMTP password is correct

---

## 🧪 POST-CONFIGURATION TESTING

After completing all 3 tasks, test these flows:

### Test 1: Password Reset Flow (5 min)

1. Go to https://www.topaffaireimmo.com/login
2. Click "Mot de passe oublié" (Forgot Password)
3. Enter a real email address
4. Click "Envoyer le lien"
5. **Expected:** Success message appears
6. Check email inbox (and spam folder)
7. **Expected:** Email arrives with subject about password reset
8. Click the link in the email
9. **Expected:** Opens https://www.topaffaireimmo.com/reset-password
10. Enter new password (minimum 8 characters)
11. Click "Reset Password"
12. **Expected:** Success message, redirects to login

**If any step fails, see troubleshooting below.**

---

### Test 2: Signup Flow (5 min)

1. Go to https://www.topaffaireimmo.com/register
2. Fill in registration form:
   - Email: Use a real email you can access
   - Password: Minimum 8 characters
   - Full Name: Test User
3. Click "S'inscrire" (Register)
4. **Expected:** Success message about confirming email
5. Check email inbox (and spam folder)
6. **Expected:** Email arrives with confirmation link
7. Click the link in the email
8. **Expected:** Opens https://www.topaffaireimmo.com/auth/callback
9. **Expected:** Briefly shows "Confirmation en cours..." then redirects
10. **Expected:** Lands on dashboard or home page (logged in)

**If any step fails, see troubleshooting below.**

---

### Test 3: Direct Login (2 min)

1. Go to https://www.topaffaireimmo.com/login
2. Enter credentials from Test 2
3. Click "Se connecter"
4. **Expected:** Redirects to dashboard
5. **Expected:** User menu shows your name in top right

---

## 🔧 TROUBLESHOOTING

### Problem: "Invalid redirect URL" or "otp_expired"

**Cause:** Supabase redirect URLs not configured correctly

**Fix:**
1. Verify Task 1 completed correctly
2. Check URLs in Supabase Dashboard → Auth → URL Configuration
3. Make sure both `www` and non-`www` versions are listed
4. Try adding `/auth/callback` as both:
   - `https://www.topaffaireimmo.com/auth/callback`
   - `https://www.topaffaireimmo.com/auth/callback?*` (with wildcard)

---

### Problem: Password reset email not arriving

**Possible Causes:**
1. SMTP not configured (Task 3)
2. Wrong SMTP credentials
3. Email in spam folder
4. Email provider blocking

**Fix:**
1. Check Supabase Dashboard → Logs → Auth Logs for errors
2. Verify SMTP settings in Task 3
3. Test SMTP with "Invite User" feature first
4. Check spam folder
5. Try different email provider (Gmail vs Outlook)

---

### Problem: Reset link goes to wrong domain

**Cause:** VITE_SITE_URL not set correctly

**Fix:**
1. Verify Task 2 completed correctly
2. Check Vercel → Settings → Environment Variables
3. Make sure `VITE_SITE_URL` = `https://www.topaffaireimmo.com`
4. Redeploy application after changing variables
5. Clear browser cache and test again

---

### Problem: Blank page after clicking email link

**Possible Causes:**
1. Service worker cache issue
2. Browser blocking cookies
3. Auth callback error

**Fix:**
1. Open browser DevTools (F12) → Console tab
2. Look for errors (red text)
3. Clear browser cache: Ctrl+Shift+Delete
4. Try incognito/private browsing mode
5. Check browser allows third-party cookies
6. Disable browser extensions temporarily

---

## 📞 STILL STUCK?

**Check These Logs:**

1. **Supabase Auth Logs**
   - Dashboard → Logs → Auth Logs
   - Look for recent failed auth attempts
   - Check error messages

2. **Vercel Function Logs**
   - Dashboard → Deployments → Click latest
   - Click "Functions" tab
   - Look for runtime errors

3. **Browser Console**
   - F12 → Console tab
   - Look for red errors
   - Search for "auth" or "callback"

**Review Documentation:**
- `/docs/AUTH_PWA_TROUBLESHOOTING.md` - Comprehensive auth troubleshooting
- `/docs/SUPABASE_AUTH_REDIRECT_URLS.md` - Redirect URL configuration
- `/.env.example` - All environment variables explained

---

## ✅ CONFIGURATION COMPLETE CHECKLIST

Before declaring "READY TO LAUNCH," verify:

- [ ] Task 1: Supabase redirect URLs configured
- [ ] Task 2: Vercel environment variables set
- [ ] Task 3: SMTP email configured
- [ ] Test 1: Password reset works end-to-end
- [ ] Test 2: Signup works end-to-end
- [ ] Test 3: Direct login works
- [ ] Browser console shows no auth errors
- [ ] Supabase logs show successful auth events
- [ ] Password reset email arrives within 1 minute
- [ ] Signup confirmation email arrives within 1 minute
- [ ] All email links redirect to correct production domain

**When all boxes are checked: 🎉 READY TO LAUNCH!**

---

**Last Updated:** 2026-02-07  
**Configuration Version:** Production v1.0
