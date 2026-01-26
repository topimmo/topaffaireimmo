# 🚀 FINAL DEPLOYMENT GUIDE - Quick Reference

## ✅ What This PR Fixes

1. ❌ **"Erreur de chargement du profil"** → ✅ Profile loads correctly
2. ❌ **HTTP 500 on image upload** → ✅ Upload works immediately after signup
3. ❌ **Password reset fails** → ✅ Reset emails work and redirect correctly
4. ❌ **Emails not branded** → ✅ All emails show TopAffaireImmo

---

## 🎯 5-Step Deployment (Do in Order!)

### Step 1: Apply Database Migration ⚙️

**Where:** Supabase Dashboard → SQL Editor

**What to run:**
```sql
-- Copy and paste entire contents of:
-- supabase/migrations/042_production_fixes_comprehensive.sql
```

**Verify it worked:**
```sql
-- Run this - should show 4 buckets
SELECT id FROM storage.buckets ORDER BY id;

-- Run this - should NOT contain "EXISTS (SELECT 1 FROM profiles"
SELECT with_check::text FROM pg_policies 
WHERE policyname = 'property_images_auth_insert';
```

---

### Step 2: Set Environment Variables 🔧

**Where:** Vercel Dashboard → Project Settings → Environment Variables

**Add/Update these for Production:**

| Variable | Value |
|----------|-------|
| `VITE_PRODUCTION_DOMAIN` | `https://topaffaireimmo.com` |
| `VITE_SUPABASE_URL` | (your Supabase URL) |
| `VITE_SUPABASE_ANON_KEY` | (your Supabase anon key) |

**⚠️ CRITICAL:** After saving, click **"Redeploy"** in Deployments tab!

---

### Step 3: Configure Supabase Auth 🔐

**Where:** Supabase Dashboard → Authentication → URL Configuration

**Set these:**

**Site URL:**
```
https://topaffaireimmo.com
```

**Redirect URLs (add all three):**
```
https://topaffaireimmo.com/**
https://*.vercel.app/**
http://localhost:3000/**
```

---

### Step 4: Configure Email Branding 📧

**Where:** Supabase Dashboard → Authentication → Email Templates

**For "Reset Password" template:**

**Subject:**
```
Réinitialiser votre mot de passe – TopAffaireImmo
```

**See full email templates in:** `docs/SUPABASE_DASHBOARD_EMAIL_CONFIG.md`

**Quick check:**
- [ ] Subject includes "TopAffaireImmo"
- [ ] Sender name is "TopAffaireImmo"
- [ ] Email body has branding/logo

---

### Step 5: Deploy Code 🚢

**Merge this PR:**
```bash
git checkout main
git merge copilot/fix-profile-loading-errors
git push origin main
```

**Or in GitHub:**
- Click "Merge pull request"
- Vercel will auto-deploy

---

## 🧪 Test After Deployment (5 minutes)

### Test 1: New User Signup
```
1. Go to https://topaffaireimmo.com/register
2. Create new account
3. ✅ Should receive confirmation email from "TopAffaireImmo"
4. ✅ Click link, should redirect to topaffaireimmo.com
5. ✅ Login should work without "Erreur de chargement du profil"
```

### Test 2: Image Upload
```
1. Login as real estate advertiser
2. Go to "Ajouter une annonce"
3. Upload 1-2 images
4. ✅ Should upload without HTTP 500 errors
5. ✅ Images should appear in preview
```

### Test 3: Password Reset
```
1. Go to login page
2. Click "Mot de passe oublié?"
3. Enter email
4. ✅ Should receive email from "TopAffaireImmo"
5. ✅ Click reset link → should go to topaffaireimmo.com/reset-password
6. ✅ Reset password successfully
```

---

## ❌ If Tests Fail - Quick Fixes

### "Erreur de chargement du profil" still appears
```sql
-- Check migration was applied:
SELECT COUNT(*) FROM pg_policies 
WHERE tablename = 'profiles' 
AND policyname = 'Enable insert for users to create their own profile';
-- Should return: 1

-- If returns 0, re-run migration 042
```

### Image upload still shows 500 error
```sql
-- Check storage policy:
SELECT with_check::text FROM pg_policies 
WHERE policyname = 'property_images_auth_insert';

-- Should NOT contain: "EXISTS (SELECT 1 FROM profiles"
-- If it does, re-run migration 042
```

### Password reset link goes to wrong domain
```
1. Verify VITE_PRODUCTION_DOMAIN is set in Vercel
2. Verify you clicked "Redeploy" after setting env var
3. Clear browser cache
4. Try again
```

### Email not branded
```
1. Go to Supabase Dashboard → Auth → Email Templates
2. Update subject and body for each template
3. Set sender name to "TopAffaireImmo"
4. Save changes
5. Wait 2-3 minutes
6. Test again
```

---

## 📋 Deployment Checklist

Before marking complete, verify:

- [ ] Migration 042 applied in Supabase
- [ ] VITE_PRODUCTION_DOMAIN set in Vercel
- [ ] Redeployed after setting env vars
- [ ] Site URL set to topaffaireimmo.com
- [ ] Redirect URLs configured
- [ ] Email templates updated
- [ ] Sender name is "TopAffaireImmo"
- [ ] Code merged and deployed
- [ ] New user signup tested ✅
- [ ] Image upload tested ✅
- [ ] Password reset tested ✅
- [ ] No errors in browser console ✅
- [ ] No 500 errors in Supabase logs ✅

---

## 📚 Full Documentation

- **Detailed Email Setup:** `docs/SUPABASE_DASHBOARD_EMAIL_CONFIG.md`
- **Complete Deployment Guide:** `docs/PRODUCTION_DEPLOYMENT_CHECKLIST_FIX.md`
- **Technical Summary:** `PRODUCTION_FIXES_SUMMARY.md`

---

## 🆘 Still Having Issues?

1. **Check Browser Console:** F12 → Console tab
2. **Check Supabase Logs:** Dashboard → Logs → Auth Logs
3. **Check Vercel Logs:** Dashboard → Deployments → View Function Logs
4. **Verify all steps above** were completed

---

## 🎉 Success Criteria

You'll know it's working when:
- ✅ No "Erreur de chargement du profil" errors
- ✅ Images upload without HTTP 500 errors
- ✅ Password reset emails arrive and work
- ✅ All emails show "TopAffaireImmo" as sender
- ✅ Browser console shows no errors
- ✅ Supabase logs show no 500 errors

---

**Estimated Time:** 15-20 minutes  
**Difficulty:** Easy (mostly configuration)  
**Risk:** Low (non-breaking changes)  
**Rollback:** Revert migration if needed

---

**Good luck! 🚀**
