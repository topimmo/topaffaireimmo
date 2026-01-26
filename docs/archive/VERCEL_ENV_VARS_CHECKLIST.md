# Vercel Environment Variables Verification Checklist

**Project:** TopAffaireImmo  
**Purpose:** Verify and configure Vercel environment variables  
**Date:** 2026-01-25

---

## ⚠️ CRITICAL REQUIREMENT

**Environment variables MUST be configured in Vercel Dashboard, NOT in code.**

✅ **CORRECT:** Vercel Dashboard → Project Settings → Environment Variables  
❌ **WRONG:** Committed in `.env`, migrations, or source files

---

## Required Environment Variables

### 1. Supabase Connection (REQUIRED)

#### `VITE_SUPABASE_URL`
- **Value:** `https://ghzdehknuzrtmfrimzdw.supabase.co`
- **Source:** Supabase Dashboard → Settings → API → Project URL
- **Required for:** Production, Preview, Development
- **Exposed to browser:** Yes (prefixed with `VITE_`)

**Configuration:**
- [ ] Set in **Production** environment
- [ ] Set in **Preview** environment  
- [ ] Set in **Development** environment
- [ ] Value is identical across all environments

#### `VITE_SUPABASE_ANON_KEY`
- **Value:** Your Supabase anonymous/public key
- **Source:** Supabase Dashboard → Settings → API → Project API keys → `anon` `public`
- **Required for:** Production, Preview, Development
- **Exposed to browser:** Yes (this is safe - it's a public key protected by RLS)

**⚠️ SECURITY NOTICE:** The old key `sb_publishable_f7YmehIEBak5rFcPtK8HxA_p6Vbvq_w` was exposed in git history. **STRONGLY RECOMMEND** rotating this key. See `SECURITY_NOTICE_CREDENTIALS.md`.

**Configuration:**
- [ ] Set in **Production** environment
- [ ] Set in **Preview** environment
- [ ] Set in **Development** environment
- [ ] Value is identical across all environments
- [ ] **ROTATED** if old key was compromised

---

### 2. Production Domain (REQUIRED)

#### `VITE_PRODUCTION_DOMAIN`
- **Value:** Your canonical production domain
- **Examples:**
  - Vercel domain: `https://topaffaireimmo.vercel.app`
  - Custom domain: `https://topaffaireimmo.ma`
  - Custom domain with www: `https://www.topaffaireimmo.ma`
- **Used for:** SEO, sitemaps, canonical URLs, Facebook webhooks
- **Required for:** Production, Preview, Development

**Configuration:**
- [ ] Set in **Production** environment
  - Value: Production domain (e.g., `https://topaffaireimmo.ma`)
- [ ] Set in **Preview** environment
  - Value: Can be same as production or preview-specific
- [ ] Set in **Development** environment
  - Value: `http://localhost:5173` or same as production

**Important:** This should match:
- Supabase Site URL configuration
- Supabase Redirect URLs
- Domain in Vercel project settings

---

### 3. Make.com Webhook (OPTIONAL)

#### `MAKE_WEBHOOK_URL`
- **Value:** Webhook URL from Make.com scenario
- **Example:** `https://hook.eu1.make.com/xxxxxxxxxxxxx`
- **Used for:** Facebook auto-posting integration
- **Required for:** Production only (if feature is enabled)

**Configuration:**
- [ ] Set in **Production** environment (if using Facebook posting)
- [ ] Not required in Preview/Development
- [ ] Keep empty if not using this feature

**Note:** This is used by the Supabase Edge Function `send-facebook-webhook`. It may also need to be configured in Supabase Edge Function secrets.

---

## Verification Steps

### Step 1: Access Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **topaffaireimmo** (or exact project name)
3. Navigate to: **Settings → Environment Variables**

### Step 2: Verify Each Environment

#### Production Environment
- [ ] `VITE_SUPABASE_URL` is set
- [ ] `VITE_SUPABASE_ANON_KEY` is set (and rotated if needed)
- [ ] `VITE_PRODUCTION_DOMAIN` is set to production domain
- [ ] `MAKE_WEBHOOK_URL` is set (if using)
- [ ] No other environment variables are set that shouldn't be

#### Preview Environment  
- [ ] `VITE_SUPABASE_URL` is set (same as production)
- [ ] `VITE_SUPABASE_ANON_KEY` is set (same as production)
- [ ] `VITE_PRODUCTION_DOMAIN` is set (production or preview-specific)
- [ ] `MAKE_WEBHOOK_URL` not required

#### Development Environment
- [ ] `VITE_SUPABASE_URL` is set (same as production)
- [ ] `VITE_SUPABASE_ANON_KEY` is set (same as production)
- [ ] `VITE_PRODUCTION_DOMAIN` is set (localhost or production)
- [ ] `MAKE_WEBHOOK_URL` not required

### Step 3: Verify Values Are Not Hardcoded

Search the codebase to ensure variables are not hardcoded:

```bash
# Run these commands to verify
cd /path/to/topaffaireimmo

# Check for hardcoded URLs
grep -r "ghzdehknuzrtmfrimzdw" --exclude-dir=node_modules --exclude-dir=dist --exclude="*.md"

# Check for hardcoded keys  
grep -r "sb_publishable_" --exclude-dir=node_modules --exclude-dir=dist --exclude="*.md"

# Check for environment variable usage
grep -r "VITE_SUPABASE_URL" src/
grep -r "import.meta.env" src/
```

Expected results:
- ✅ `import.meta.env.VITE_SUPABASE_URL` in code ← CORRECT
- ✅ `import.meta.env.VITE_SUPABASE_ANON_KEY` in code ← CORRECT
- ❌ Hardcoded URLs or keys in code ← WRONG, must fix

### Step 4: Test Environment Variable Loading

After deployment, verify variables are loaded correctly:

1. Open browser DevTools → Console
2. Navigate to: `https://topaffaireimmo.vercel.app`
3. Check console logs for Supabase initialization
4. Look for:
   ```
   🔧 Supabase Client Initialization
     - Environment: production
     - URL configured: true
     - Anon Key configured: true
     - Is Configured: true
   ```

Expected:
- [ ] All values show as `true`
- [ ] No "missing environment variables" errors
- [ ] No hardcoded credentials visible in logs

---

## Common Issues & Fixes

### Issue 1: "Missing Supabase environment variables"

**Symptoms:**
- Console error: "❌ CRITICAL: Missing Supabase environment variables!"
- App shows configuration error

**Fix:**
1. Verify environment variables are set in Vercel
2. Ensure variable names start with `VITE_` prefix
3. Redeploy the application (environment variables only apply to new builds)

### Issue 2: Environment variables not updating

**Symptoms:**
- Changed environment variables in Vercel
- App still uses old values

**Fix:**
1. Environment variables are baked into the build at build time
2. Must redeploy the application for changes to take effect
3. Go to Vercel Dashboard → Deployments → Redeploy

**Steps:**
```bash
# Option 1: Trigger redeploy from Vercel Dashboard
# Deployments → ... → Redeploy

# Option 2: Push a new commit
git commit --allow-empty -m "Trigger redeploy for env var update"
git push origin main
```

### Issue 3: Different values across environments

**Symptoms:**
- Works in production but not in preview deployments
- Inconsistent behavior

**Fix:**
1. Ensure all three environments (Production, Preview, Development) have the same values
2. Supabase URL and keys should be identical across all environments (unless using separate Supabase projects)

### Issue 4: Vercel preview domain vs production domain

**Symptoms:**
- Session persistence issues
- Redirect URL mismatches
- Cookie domain problems

**Fix:**
1. Add all Vercel domains to Supabase redirect URLs:
   - `https://topaffaireimmo.vercel.app/**`
   - `https://*.vercel.app/**` (wildcard for preview deployments)
2. Ensure `VITE_PRODUCTION_DOMAIN` is set correctly for each environment

---

## Security Best Practices

### ✅ DO:
- Store environment variables in Vercel Dashboard only
- Use `VITE_` prefix for variables that need to be exposed to the browser
- Keep `.env.example` updated with placeholder values
- Add `.env*` to `.gitignore`
- Rotate keys if they are ever exposed publicly
- Use different Supabase projects for staging/production (optional)

### ❌ DON'T:
- Commit `.env` file to git
- Hardcode URLs or keys in source code
- Share `.env` file in chat or email
- Store credentials in migration files
- Use production keys in development (unless same project)
- Expose `service_role` key to frontend (use `anon` key only)

---

## Deployment Checklist

Before deploying to production:

- [ ] All required environment variables set in Vercel
- [ ] Values verified and tested
- [ ] No hardcoded credentials in code
- [ ] `.env` is in `.gitignore`
- [ ] `.env.example` has placeholder values only
- [ ] Supabase redirect URLs match Vercel domains
- [ ] Build succeeds locally with env vars
- [ ] Build succeeds in Vercel
- [ ] Application loads without configuration errors
- [ ] Session persistence works
- [ ] Authentication flow works end-to-end

---

## Verification Summary

**Date Verified:** _______________  
**Verified By:** _______________

**Environment Variable Status:**

| Variable | Production | Preview | Development | Notes |
|----------|-----------|---------|-------------|-------|
| `VITE_SUPABASE_URL` | ⬜ | ⬜ | ⬜ | |
| `VITE_SUPABASE_ANON_KEY` | ⬜ | ⬜ | ⬜ | Rotated? Y/N |
| `VITE_PRODUCTION_DOMAIN` | ⬜ | ⬜ | ⬜ | |
| `MAKE_WEBHOOK_URL` | ⬜ | N/A | N/A | Optional |

**Issues Found:** _______________  
**Issues Resolved:** _______________

---

## Next Steps

1. ✅ Set all required environment variables in Vercel
2. ✅ Redeploy application
3. ✅ Test in browser (check console logs)
4. ✅ Verify authentication flow works
5. ✅ Complete Supabase verification (see SUPABASE_VERIFICATION_CHECKLIST.md)
6. ✅ Test end-to-end user journey

---

## Additional Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- Project deployment guide: `/DEPLOYMENT_GUIDE.md`
- Security notice: `/SECURITY_NOTICE_CREDENTIALS.md`
