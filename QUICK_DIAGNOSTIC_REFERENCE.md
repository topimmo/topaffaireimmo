# Quick Diagnostic Reference

## 🎯 Start Here

**Problem:** Changes not visible on live Vercel deployment despite successful builds.

**Finding:** Code is correct. Issue is in deployment configuration.

## 🔍 Quick Diagnostic (5 Minutes)

### Step 1: Check Browser Console

1. Open live website → Press F12 → Console tab
2. Look for these 3 sections:

#### A. Deployment Info
```
🚀 Application Deployment Info
  Build Timestamp: 2026-01-29T21:57:18.005Z  ← Should be recent
  Deployment Version: abc1234                ← Should match latest commit
  Environment Mode: production               ← Should say "production"
```

❌ **If timestamp is old:** Cache issue  
❌ **If version doesn't match:** Wrong commit deployed

#### B. Supabase Connection
```
🔧 Supabase Client Initialization
  - URL configured: true        ← Must be true
  - Anon Key configured: true   ← Must be true
  - Is Configured: true         ← Must be true
```

❌ **If any are false:** Missing environment variables

#### C. Admin Data (go to Admin → Listings first)
```
📊 Admin Listings - Data Diagnostic
  Contact fields check:
    - contact_phone: +212...      ← Should have value
    - contact_whatsapp: +212...   ← Should have value
    - contact_email: user@...     ← Should have value
```

❌ **If all null:** Database or connection issue

### Step 2: Identify & Fix

Match your console output to one of these:

## ⚠️ Issue 1: Missing Environment Variables (MOST COMMON)

**Symptom:** `URL configured: false` or `Anon Key configured: false`

**Fix:**
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these for **Production** (not just Preview):
   - `VITE_SUPABASE_URL` = `https://xxxxx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGc...`
3. Click "Redeploy" on latest deployment
4. Wait 2-3 minutes
5. Hard refresh browser (Ctrl+Shift+R)

---

## 🔄 Issue 2: Wrong Version Deployed

**Symptom:** Deployment Version doesn't match your latest commit

**Fix:**
1. Vercel Dashboard → Settings → Git
2. Check "Production Branch" (e.g., should be `main`)
3. GitHub → Verify latest commit is on that branch
4. If not: Merge your changes to production branch
5. Vercel will auto-deploy, or click "Redeploy"

---

## 📦 Issue 3: Build Cache

**Symptom:** Build Timestamp is old (days/weeks ago)

**Fix:**
1. Vercel Dashboard → Deployments
2. Click latest deployment → "..." menu
3. "Redeploy" → Check "Clear build cache"
4. Wait for deployment
5. Hard refresh browser (Ctrl+Shift+R)

---

## 🗄️ Issue 4: Wrong Supabase Project

**Symptom:** Console shows Supabase URL that doesn't match production

**Fix:**
1. Supabase Dashboard → Settings → API → Project URL
2. Copy the **production** project URL
3. Vercel → Environment Variables → Update `VITE_SUPABASE_URL`
4. Redeploy

---

## 💾 Issue 5: Database Missing Data

**Symptom:** Contact fields all show `null` in console

**Fix:**
1. Supabase Dashboard → Database → `properties` table
2. Check if rows have data in:
   - `contact_phone`
   - `contact_whatsapp`
   - `contact_email`
3. If empty: Update records or investigate why data isn't being saved

---

## 📚 Full Documentation

For detailed explanations, see:
- **DEPLOYMENT_INVESTIGATION_SUMMARY.md** - Executive summary
- **DEPLOYMENT_DIAGNOSTIC_GUIDE.md** - Step-by-step guide
- **DEPLOYMENT_FINAL_SUMMARY.md** - Complete investigation results

## 🆘 Still Not Working?

1. Clear browser cache completely
2. Try incognito/private browsing window
3. Check Vercel deployment logs for errors
4. Verify DNS points to correct Vercel deployment
5. Check if custom domain vs vercel.app shows different results

## ✅ Verification Checklist

After applying fix:

- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Check console: "Build Timestamp" is recent
- [ ] Check console: "Deployment Version" matches latest commit
- [ ] Check console: All Supabase config = `true`
- [ ] Check console: Contact fields have values (not null)
- [ ] Visual changes are visible on the page
- [ ] Admin Dashboard shows "Last updated" with current time

---

**Last Updated:** 2026-01-29  
**Status:** Ready for diagnosis
