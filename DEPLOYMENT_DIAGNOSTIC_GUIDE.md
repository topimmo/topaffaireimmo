# Deployment Diagnostic Guide

## Overview

This guide explains the diagnostic features added to help identify why changes are not visible on the live Vercel deployment despite successful builds.

## Diagnostic Features Added

### 1. Build Metadata Injection

**Location**: `index.html` (meta tags), `vite.config.ts` (plugin)

**What it does**: Injects build timestamp and deployment version into the HTML at build time.

**How to verify**:
1. Open the live website in your browser
2. View page source (Ctrl+U or Cmd+Option+U)
3. Look for these meta tags in the `<head>`:
   ```html
   <meta name="build-timestamp" content="2026-01-29T21:57:18.005Z" />
   <meta name="deployment-version" content="abc1234" />
   ```
4. **If the timestamp is old** → The old build is still being served (caching issue)
5. **If the version doesn't match the latest commit** → The wrong commit was deployed

### 2. Application Deployment Info Logging

**Location**: `src/main.tsx`

**What it does**: Logs deployment information to the browser console when the app loads.

**How to verify**:
1. Open the live website
2. Open browser DevTools (F12)
3. Go to the Console tab
4. Look for:
   ```
   🚀 Application Deployment Info
     Build Timestamp: 2026-01-29T21:57:18.005Z
     Deployment Version: abc1234
     Current URL: https://...
     Environment Mode: production
     Base URL: /
   ```

**What to check**:
- **Build Timestamp**: Should match the time of the latest deployment
- **Deployment Version**: Should match the latest commit SHA
- **Environment Mode**: Should be "production" on live site

### 3. Supabase Connection Logging

**Location**: `src/lib/supabase.ts`

**What it does**: Logs Supabase configuration status at app startup.

**How to verify**:
1. Open browser console
2. Look for:
   ```
   🔧 Supabase Client Initialization
     - Environment: production
     - URL configured: true (https://xxxxx.supabase.co...)
     - Anon Key configured: true (eyJhb...)
     - Is Configured: true
     - Session Storage: localStorage (cross-domain compatible)
     - Current Domain: https://...
   ```

**What to check**:
- **URL configured**: Must be `true`
- **Anon Key configured**: Must be `true`
- **Is Configured**: Must be `true`
- **If any are false** → Environment variables are missing in Vercel

### 4. Admin Dashboard Data Logging

**Location**: `src/pages/admin/AdminListings.tsx`

**What it does**: Logs detailed information about fetched property data, including contact fields.

**How to verify**:
1. Log into the admin dashboard
2. Navigate to the Listings page
3. Open browser console
4. Look for:
   ```
   📊 Admin Listings - Data Diagnostic
     Total properties fetched: 5
     Sample property data: {id: "...", contact_phone: "...", ...}
     Contact fields check:
       - contact_phone: +212...
       - contact_whatsapp: +212...
       - contact_email: user@example.com
       - advertiser_type: owner
     Build timestamp: 2026-01-29T21:57:18.005Z
     Environment: production
   ```

**What to check**:
- **contact_phone, contact_whatsapp, contact_email**: Should have values (not null)
- **If all are null** → Data is not in the database OR you're connected to the wrong Supabase project
- **If they have values** → Data is being fetched correctly

### 5. Visual Timestamp in Admin UI

**Location**: `src/pages/admin/AdminListings.tsx` (UI)

**What it does**: Shows "Last updated" timestamp in the Admin Listings page header.

**How to verify**:
1. Go to Admin Listings page
2. Look below the page title for:
   ```
   Last updated: 1/29/2026, 9:57:18 PM
   ```
3. Refresh the page and verify the timestamp updates

**What to check**:
- **If timestamp is very old** → Browser cache is preventing fresh data fetch
- **If timestamp updates on refresh** → Data fetching is working

## Diagnostic Workflow

Follow these steps to identify the root cause:

### Step 1: Verify Deployment Version

1. Open live website
2. Check browser console for "Application Deployment Info"
3. Compare "Deployment Version" with latest commit SHA in GitHub
4. **If they don't match** → Wrong commit deployed or deployment failed

### Step 2: Check Environment Variables

1. Check console for "Supabase Client Initialization"
2. Verify all config values are `true`
3. **If any are `false`** → Go to Vercel Dashboard → Project Settings → Environment Variables
4. Ensure these are set for Production:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Step 3: Verify Database Connection

1. Log into Admin Dashboard
2. Go to Listings page
3. Check console for "Admin Listings - Data Diagnostic"
4. Verify contact fields have values
5. **If fields are null**:
   - Check Supabase Dashboard → Database → properties table
   - Verify data exists and has contact fields populated
   - Verify you're connected to the PRODUCTION Supabase project (not staging)

### Step 4: Check for Caching Issues

**Browser Cache**:
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Or clear browser cache completely
3. Check if "Build Timestamp" in HTML changes

**Vercel Edge Cache**:
1. Go to Vercel Dashboard
2. Navigate to Deployments
3. Find latest deployment
4. Click "..." menu → "Redeploy"
5. Select "Redeploy with existing Build Cache cleared"

**CDN Cache**:
- Check `vercel.json` → HTML files should have `Cache-Control: no-cache`
- Static assets (.js, .css) can be cached for 1 year (they have hashed filenames)

### Step 5: Verify Correct Branch is Deployed

1. Go to Vercel Dashboard → Project Settings → Git
2. Check "Production Branch" setting
3. Ensure it matches the branch where your changes are merged
4. **Common issue**: Production points to `main` but changes are only in `develop`

## Common Root Causes

Based on the diagnostic information, here are the most likely issues:

### Issue 1: Environment Variables Not Set in Production

**Symptoms**:
- Console shows `URL configured: false` or `Anon Key configured: false`
- Error: "Missing Supabase environment variables"

**Fix**:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add:
   - `VITE_SUPABASE_URL` = your production Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your production Supabase anon key
3. **IMPORTANT**: Select "Production" environment
4. Redeploy

### Issue 2: Wrong Branch Deployed

**Symptoms**:
- Deployment Version doesn't match latest commit
- Changes visible in Preview deployments but not Production

**Fix**:
1. Verify changes are merged into the Production branch
2. Check Vercel Git settings point to correct branch
3. Manually trigger a new deployment from correct branch

### Issue 3: Browser/CDN Cache

**Symptoms**:
- Build Timestamp in HTML is old
- Hard refresh shows new content

**Fix**:
1. Users: Hard refresh browser (Ctrl+Shift+R)
2. Admin: Clear Vercel deployment cache and redeploy
3. Verify `vercel.json` has correct cache headers (already configured)

### Issue 4: Connected to Wrong Supabase Project

**Symptoms**:
- Data logging shows all null contact fields
- Other data fetches correctly but specific fields are missing

**Fix**:
1. Check Supabase URL in environment variables
2. Verify it matches your PRODUCTION Supabase project
3. Check Supabase dashboard to confirm data exists in production

### Issue 5: Database Schema Mismatch

**Symptoms**:
- Console errors about missing columns
- Data partially loads but contact fields are null

**Fix**:
1. Run latest migrations in production Supabase
2. Verify columns exist: `contact_phone`, `contact_whatsapp`, `contact_email`
3. Regenerate types: `npm run types:supabase`

## Verification Checklist

Use this checklist after making fixes:

- [ ] Build Timestamp in HTML matches current date/time
- [ ] Deployment Version matches latest commit SHA
- [ ] Supabase URL configured: `true`
- [ ] Supabase Anon Key configured: `true`
- [ ] Admin Dashboard logs show non-null contact fields
- [ ] Visual timestamp updates on page refresh
- [ ] No console errors
- [ ] Changes are visible in UI

## Next Steps After Diagnosis

Once you've identified the root cause using these diagnostics:

1. **Document the finding** in the PR or issue
2. **Apply the minimal fix** (don't refactor unrelated code)
3. **Verify the fix** using the same diagnostic features
4. **Keep the diagnostic logging** for future debugging (it's minimal overhead)

## Removing Diagnostic Features (Optional)

If you want to remove these features after diagnosis (not recommended):

1. Remove build metadata plugin from `vite.config.ts`
2. Remove meta tags from `index.html`
3. Remove console.group logging from `src/main.tsx`
4. Remove data diagnostic logging from `AdminListings.tsx`
5. Remove visual timestamp from Admin UI

**Recommendation**: Keep these features. They provide valuable debugging information with minimal overhead and will help with future deployments.
