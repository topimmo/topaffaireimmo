# Production Deployment Diagnostic Plan
## React/TypeScript + Supabase + Vercel + SEO Complete Guide

**Project:** TopAffaireImmo - Morocco Real Estate Platform  
**Stack:** React 18 + TypeScript + Vite + Supabase + Vercel  
**Last Updated:** 2026-02-03

---

## 📋 Diagnostic Summary

This document provides a **complete step-by-step diagnostic plan** for production readiness. It covers:
- ✅ Local development setup and validation
- ✅ Supabase database schema, RLS policies, and admin functionality
- ✅ Vercel deployment configuration and environment variables
- ✅ SEO optimization and Core Web Vitals
- ✅ Security best practices and observability
- ✅ Common pitfalls specific to Supabase + Admin actions + RLS

**Use this guide for:**
- Pre-deployment validation (Go/No-Go decision)
- Debugging production issues
- Onboarding new developers
- Post-deployment verification

---

## ✅ Production Readiness Checklist (Go/No-Go)

### Phase 1: Local Development ✓
- [ ] **Dependencies installed** - `npm install` completes without errors
- [ ] **TypeScript compiles** - `npm run typecheck` passes with 0 errors
- [ ] **Linting passes** - `npm run lint` passes with 0 errors
- [ ] **Build succeeds** - `npm run build` completes and generates `/dist`
- [ ] **Preview works** - `npm run preview` serves the built app correctly
- [ ] **Environment variables set** - `.env` file exists with all required vars

### Phase 2: Supabase Database ✓
- [ ] **Migrations applied** - All migrations in `/supabase/migrations/` are run
- [ ] **Tables exist** - `properties`, `admins`, `admin_audit_logs` tables present
- [ ] **Columns present** - Properties table has `status`, `approved_at`, `approved_by`, `rejected_at`, `rejected_by`, `rejection_reason`
- [ ] **Indexes created** - Performance indexes exist on approval/rejection columns
- [ ] **Admin users exist** - At least one user in `public.admins` table
- [ ] **RLS enabled** - Row Level Security enabled on all public tables
- [ ] **RLS policies correct** - Admin approve/reject policies working
- [ ] **Audit logging works** - `admin_audit_logs` captures admin actions

### Phase 3: Vercel Deployment ✓
- [ ] **Environment variables set** - All required env vars in Vercel dashboard
- [ ] **Build succeeds** - Vercel build logs show successful completion
- [ ] **Rewrites configured** - SPA routing works for `/admin/*` and all routes
- [ ] **Security headers set** - X-Frame-Options, CSP, etc. present
- [ ] **No runtime errors** - Function logs show no critical errors
- [ ] **Site accessible** - Production URL loads correctly

### Phase 4: SEO & Performance ✓
- [ ] **Title tags correct** - Unique titles on all pages
- [ ] **Meta descriptions** - Relevant descriptions on key pages
- [ ] **Open Graph tags** - OG tags for social sharing
- [ ] **Twitter cards** - Twitter meta tags configured
- [ ] **Canonical URLs** - Point to production domain
- [ ] **robots.txt present** - Configured to allow/disallow correct paths
- [ ] **Sitemap.xml exists** - Dynamically generated sitemaps
- [ ] **Admin pages noindex** - `/admin/*` routes have `noindex` meta tag
- [ ] **Images optimized** - Lazy loading, WebP format, proper sizing
- [ ] **Core Web Vitals** - LCP < 2.5s, FID < 100ms, CLS < 0.1

### Phase 5: Security & Observability ✓
- [ ] **RLS is source of truth** - All sensitive queries use RLS
- [ ] **No secrets in FE** - Only `VITE_*` env vars in client code
- [ ] **CORS configured** - Supabase allows correct origins
- [ ] **Error tracking** - Sentry or similar configured (if applicable)
- [ ] **Logs accessible** - Can view Vercel function logs and Supabase logs
- [ ] **Admin access restricted** - Only whitelisted users can access `/admin`

---

## 🛠️ Commands Section

### Local Development Setup

```bash
# 1. Clone repository (if needed)
git clone <repo-url>
cd topaffaireimmo

# 2. Install dependencies
npm install

# Verify Node.js version (should be 18-20)
node --version
npm --version

# 3. Create .env file from template
cp .env.example .env

# 4. Edit .env and add your Supabase credentials
# Required variables:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_SITE_URL
# - VITE_PRODUCTION_DOMAIN
```

### Build & Validation Commands

```bash
# TypeScript type checking (MUST pass before deploy)
npm run typecheck

# ESLint code quality check (MUST pass before deploy)
npm run lint

# Build for production (includes sitemap generation)
npm run build

# Preview production build locally
npm run preview

# Development server (hot reload)
npm run dev

# Generate sitemap files only
npm run generate:sitemaps

# Generate Supabase TypeScript types
npm run types:supabase
```

### Expected Output

**✅ Successful typecheck:**
```
$ tsc --noEmit
(No output = success)
```

**✅ Successful lint:**
```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
(No output = success)
```

**✅ Successful build:**
```
$ npm run build
> starter@0.0.0 build
> npm run generate:sitemaps && vite build

✓ Generated sitemaps in /public/sitemaps
✓ 1234 modules transformed
✓ built in 12.34s
dist/index.html                   5.67 kB
dist/assets/index-abc123.js     567.89 kB
```

### Troubleshooting Failed Commands

**TypeScript errors:**
```bash
# Show detailed error info
npm run typecheck 2>&1 | tee typecheck.log

# Common fixes:
# - Update Supabase types: npm run types:supabase
# - Check for missing imports
# - Verify tsconfig.json is correct
```

**Lint errors:**
```bash
# Auto-fix fixable issues
npx eslint . --ext ts,tsx --fix

# Show only errors (ignore warnings)
npm run lint -- --quiet
```

**Build failures:**
```bash
# Clear cache and rebuild
rm -rf node_modules dist .vite
npm install
npm run build

# Check for environment variable issues
env | grep VITE_
```

---

## 🗄️ Supabase SQL Verification

### 1. Verify Properties Table Schema

**Check all required columns exist:**

```sql
-- Copy-paste ready: Check properties table columns
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'properties'
  AND column_name IN (
    'id', 'status', 'approved_at', 'approved_by', 
    'rejected_at', 'rejected_by', 'rejection_reason',
    'created_by', 'published_at'
  )
ORDER BY column_name;
```

**Expected columns:**
- `id` (uuid)
- `status` (text) - Values: 'pending', 'published', 'rejected', 'draft'
- `approved_at` (timestamptz) - When listing was approved
- `approved_by` (uuid) - Admin user ID who approved
- `rejected_at` (timestamptz) - When listing was rejected
- `rejected_by` (uuid) - Admin user ID who rejected
- `rejection_reason` (text) - Why listing was rejected
- `created_by` (uuid) - User who created the listing
- `published_at` (timestamptz) - When listing was published

**If columns are missing, check migrations:**
```sql
-- Check which migrations have been applied
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 20;
```

---

### 2. Verify Indexes

**Check performance indexes exist:**

```sql
-- Copy-paste ready: Check indexes on properties table
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'properties'
  AND (
    indexname LIKE '%approved%' OR
    indexname LIKE '%rejected%' OR
    indexname LIKE '%status%'
  )
ORDER BY indexname;
```

**Expected indexes:**
- `idx_properties_approved_at` - For filtering by approval date
- `idx_properties_rejected_at` - For filtering by rejection date
- `idx_properties_status` - For filtering by status

**Create missing indexes if needed:**
```sql
-- Create approval timestamp index
CREATE INDEX IF NOT EXISTS idx_properties_approved_at 
  ON public.properties(approved_at);

-- Create rejection timestamp index
CREATE INDEX IF NOT EXISTS idx_properties_rejected_at 
  ON public.properties(rejected_at);

-- Create status index
CREATE INDEX IF NOT EXISTS idx_properties_status 
  ON public.properties(status);

-- Create compound index for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_properties_status_created_at 
  ON public.properties(status, created_at DESC);
```

---

### 3. Verify Admin Users

**Check admin users exist:**

```sql
-- Copy-paste ready: List all admin users
SELECT 
  a.user_id,
  a.created_at as admin_since,
  u.email,
  u.created_at as user_created_at
FROM public.admins a
LEFT JOIN auth.users u ON a.user_id = u.id
ORDER BY a.created_at DESC;
```

**Expected: At least 1 admin user**

**Check if current user is admin:**
```sql
-- Copy-paste ready: Check if YOUR user is admin
-- Replace 'your-email@example.com' with actual email
SELECT 
  a.user_id,
  u.email,
  CASE 
    WHEN a.user_id IS NOT NULL THEN 'YES - IS ADMIN'
    ELSE 'NO - NOT ADMIN'
  END as is_admin
FROM auth.users u
LEFT JOIN public.admins a ON u.id = a.user_id
WHERE u.email = 'your-email@example.com';
```

**Add admin user if needed (REQUIRES SERVICE ROLE KEY):**
```sql
-- ⚠️ WARNING: This requires service role access in Supabase SQL Editor
-- Copy-paste ready: Add new admin user by email
-- Replace 'admin@example.com' with actual admin email

INSERT INTO public.admins (user_id)
SELECT id 
FROM auth.users 
WHERE email = 'admin@example.com'
ON CONFLICT (user_id) DO NOTHING;

-- Verify admin was added
SELECT * FROM public.admins 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@example.com');
```

---

### 4. Verify RLS Policies

**Check RLS is enabled:**

```sql
-- Copy-paste ready: Check RLS status on key tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('properties', 'admins', 'admin_audit_logs')
ORDER BY tablename;
```

**Expected: `rls_enabled = true` for ALL tables**

**List all RLS policies on properties:**
```sql
-- Copy-paste ready: List all RLS policies on properties table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'properties'
ORDER BY policyname;
```

**Check admin approve/reject policies:**
```sql
-- Copy-paste ready: Check admin update policies
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN policyname ILIKE '%admin%' THEN 'Admin Policy'
    WHEN qual ILIKE '%admins%' OR with_check ILIKE '%admins%' THEN 'Admin Check'
    ELSE 'Regular Policy'
  END as policy_type,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'properties'
  AND cmd = 'UPDATE'
ORDER BY policy_type, policyname;
```

**Test admin can update properties (must be logged in as admin):**
```sql
-- Copy-paste ready: Test admin can approve a listing
-- This will FAIL if user is not admin or RLS is broken
-- Replace 'property-uuid-here' with actual property ID

UPDATE public.properties
SET 
  status = 'published',
  approved_at = NOW(),
  approved_by = auth.uid()
WHERE id = 'property-uuid-here';

-- Check if update worked
SELECT id, status, approved_at, approved_by
FROM public.properties
WHERE id = 'property-uuid-here';
```

---

### 5. Verify Audit Logging

**Check admin_audit_logs table exists:**

```sql
-- Copy-paste ready: Verify audit logs table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'admin_audit_logs'
ORDER BY ordinal_position;
```

**Expected columns:**
- `id` (uuid)
- `created_at` (timestamptz)
- `admin_id` (uuid) - References auth.users
- `action` (text) - approve, reject, delete, etc.
- `entity_type` (text) - property, user, page, etc.
- `entity_id` (uuid) - ID of affected entity
- `metadata` (jsonb) - Additional context

**View recent audit logs:**
```sql
-- Copy-paste ready: View last 50 admin actions
SELECT 
  al.created_at,
  u.email as admin_email,
  al.action,
  al.entity_type,
  al.entity_id,
  al.metadata
FROM public.admin_audit_logs al
LEFT JOIN auth.users u ON al.admin_id = u.id
ORDER BY al.created_at DESC
LIMIT 50;
```

**Test audit logging (must be admin):**
```sql
-- Copy-paste ready: Test manual audit log insert
-- Replace values as needed
INSERT INTO public.admin_audit_logs (
  admin_id,
  action,
  entity_type,
  entity_id,
  metadata
) VALUES (
  auth.uid(),
  'approve',
  'property',
  'test-property-uuid',
  '{"rejection_reason": null, "note": "Test audit log"}'::jsonb
);

-- Verify it was inserted
SELECT * FROM public.admin_audit_logs
WHERE admin_id = auth.uid()
ORDER BY created_at DESC
LIMIT 1;
```

**Check audit logs for specific property:**
```sql
-- Copy-paste ready: Get audit trail for a property
-- Replace 'property-uuid-here' with actual property ID
SELECT 
  al.created_at,
  u.email as admin_email,
  al.action,
  al.metadata->>'rejection_reason' as rejection_reason,
  al.metadata
FROM public.admin_audit_logs al
LEFT JOIN auth.users u ON al.admin_id = u.id
WHERE al.entity_type = 'property'
  AND al.entity_id = 'property-uuid-here'
ORDER BY al.created_at DESC;
```

**Check constraints are enforced:**
```sql
-- Copy-paste ready: Verify audit log constraints
SELECT
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'admin_audit_logs'
ORDER BY tc.constraint_type, tc.constraint_name;
```

---

### 6. Health Check Query (Run All At Once)

**Complete database health check:**

```sql
-- Copy-paste ready: Complete Supabase health check
-- Run this to get overview of entire system

WITH table_status AS (
  SELECT 
    'properties' as table_name,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE status = 'pending') as pending,
    COUNT(*) FILTER (WHERE status = 'published') as published,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected
  FROM public.properties
),
admin_status AS (
  SELECT 
    'admins' as table_name,
    COUNT(*) as admin_count
  FROM public.admins
),
audit_status AS (
  SELECT 
    'admin_audit_logs' as table_name,
    COUNT(*) as total_logs,
    COUNT(*) FILTER (WHERE action = 'approve') as approvals,
    COUNT(*) FILTER (WHERE action = 'reject') as rejections,
    MAX(created_at) as last_action
  FROM public.admin_audit_logs
),
rls_status AS (
  SELECT
    tablename,
    rowsecurity as rls_enabled,
    COUNT(*) OVER (PARTITION BY rowsecurity) as count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('properties', 'admins', 'admin_audit_logs')
)
SELECT 'TABLE STATUS' as check_type, * FROM table_status
UNION ALL
SELECT 'ADMIN STATUS' as check_type, * FROM admin_status
UNION ALL
SELECT 'AUDIT STATUS' as check_type, * FROM audit_status
UNION ALL
SELECT 'RLS STATUS' as check_type, tablename::text, NULL, NULL, NULL, NULL FROM rls_status;
```

---

## 🚀 Vercel Verification

### 1. Environment Variables Checklist

**Required environment variables in Vercel:**

Go to: `Vercel Dashboard → Project → Settings → Environment Variables`

```bash
# Required variables (ALL environments: Production, Preview, Development)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...your-anon-key
VITE_SITE_URL=https://www.topaffaireimmo.com
VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.com
```

**Verification checklist:**
- [ ] All variables are prefixed with `VITE_` (required for Vite to expose to client)
- [ ] `VITE_SUPABASE_URL` matches your Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` is the public/anonymous key (NOT service role key)
- [ ] `VITE_SITE_URL` is your primary production domain
- [ ] `VITE_PRODUCTION_DOMAIN` is set for canonical URLs
- [ ] Variables are set for all environments (Production, Preview, Development)
- [ ] No trailing slashes in URLs

**⚠️ CRITICAL SECURITY:**
- ✅ **NEVER** add `SUPABASE_SERVICE_ROLE_KEY` to Vercel env vars
- ✅ **ONLY** use `VITE_*` prefixed vars in client code
- ✅ Service role keys belong in Supabase Edge Functions secrets only

**Verify env vars in build:**
```bash
# In Vercel build logs, check for:
"Environment variables loaded: 4/4"

# Or in runtime, open browser console on deployed site:
console.log(import.meta.env.VITE_SUPABASE_URL);
// Should output your Supabase URL
```

---

### 2. Routing & Rewrites

**Check `vercel.json` configuration:**

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**This ensures:**
- ✅ SPA routing works for all client-side routes
- ✅ `/admin/*` routes don't return 404
- ✅ Direct navigation to `/property/123` works
- ✅ Browser refresh on any route loads correctly

**Test routing:**
1. Deploy to Vercel
2. Navigate to: `https://your-domain.vercel.app/admin/listings`
3. Refresh page (F5)
4. Should load React app, not 404

**If you get 404s on refresh:**
- Check `vercel.json` has rewrites
- Verify `outputDirectory: "dist"` in vercel.json
- Ensure `index.html` exists in `/dist` after build

---

### 3. Build Logs Verification

**Where to check: `Vercel Dashboard → Deployments → [Click deployment] → Building`**

**✅ Successful build log should show:**
```
Running "npm run build"

> starter@0.0.0 build
> npm run generate:sitemaps && vite build

✓ Generated sitemaps
✓ 1234 modules transformed
✓ built in 12.34s

Build Completed in 45s
```

**❌ Failed build - common errors:**

**Error: "Command failed: npm run build"**
```
Cause: TypeScript errors, missing dependencies, or build script failure
Fix: Run `npm run build` locally first to debug
Check: npm run typecheck && npm run lint
```

**Error: "Module not found"**
```
Cause: Missing dependency in package.json
Fix: Run `npm install <missing-package>` and commit package.json
```

**Error: "Environment variable not found"**
```
Cause: Code references env var that's not set in Vercel
Fix: Add missing VITE_* variable in Vercel dashboard
Check: All import.meta.env.VITE_* references
```

---

### 4. Runtime Logs

**Where to check: `Vercel Dashboard → Deployments → [Click deployment] → Functions`**

**For this project (SPA with no server functions):**
- No function logs expected (this is client-side only)
- Check for client-side errors in browser console

**Browser console checks:**
```javascript
// Open DevTools (F12) and check Console tab

// Should see Supabase client initialized
// Should NOT see:
// - CORS errors
// - "Missing env variable" errors
// - Network 401/403 errors to Supabase
```

**Common runtime issues:**

**CORS errors to Supabase:**
```
Cause: Vercel domain not in Supabase allowed origins
Fix: Supabase Dashboard → Settings → API → CORS Allowed Origins
Add: https://your-domain.vercel.app
```

**Supabase 401 Unauthorized:**
```
Cause: Invalid or missing VITE_SUPABASE_ANON_KEY
Fix: Verify env var in Vercel matches Supabase project
Redeploy: Trigger new deployment after fixing env var
```

**Admin routes show "Not authorized":**
```
Cause: User not in public.admins table
Fix: Add user to admins table (see SQL section above)
Or: RLS policy blocking admin access
```

---

### 5. Deployment URL Verification

**Check these URLs after deployment:**

```bash
# Homepage
https://your-domain.vercel.app/

# Admin dashboard (requires login + admin access)
https://your-domain.vercel.app/admin/listings

# Property detail
https://your-domain.vercel.app/property/[any-id]

# Search results
https://your-domain.vercel.app/search

# Static assets
https://your-domain.vercel.app/robots.txt
https://your-domain.vercel.app/sitemap.xml
```

**Expected HTTP status codes:**
- `200` for all valid pages
- `200` for `/admin/*` (but may redirect to login if not authenticated)
- `200` for `/robots.txt` and `/sitemap.xml`

---

## 🔍 SEO Verification

### 1. Title & Meta Tags

**Check homepage meta tags:**

```bash
# Use curl to check HTML head
curl -s https://your-domain.vercel.app/ | grep -E '<title>|<meta name="description"|<meta property="og:'
```

**Expected output:**
```html
<title>TopAffaireImmo - Trouvez votre propriété parfaite au Maroc</title>
<meta name="description" content="TopAffaireImmo est la plateforme immobilière de référence au Maroc..." />
<meta property="og:title" content="TopAffaireImmo - Trouvez votre propriété parfaite au Maroc" />
<meta property="og:description" content="Plateforme immobilière de référence au Maroc..." />
<meta property="og:image" content="https://topaffaireimmo.vercel.app/og-image.jpg" />
```

**Verify meta tags are unique per page:**
- Homepage: General real estate platform description
- Property detail: Specific property title and description
- City pages: City-specific content
- Admin pages: Should have `<meta name="robots" content="noindex, nofollow" />`

**Use browser DevTools:**
1. Open page
2. F12 → Elements tab
3. Inspect `<head>` section
4. Verify title, description, OG tags

---

### 2. Open Graph & Twitter Cards

**Test social sharing preview:**

**Facebook/LinkedIn:**
- Go to: https://developers.facebook.com/tools/debug/
- Enter URL: https://your-domain.vercel.app/
- Click "Scrape Again"
- Verify image, title, description appear correctly

**Twitter:**
- Go to: https://cards-dev.twitter.com/validator
- Enter URL: https://your-domain.vercel.app/
- Verify Twitter card shows correctly

**Required OG tags:**
```html
<meta property="og:type" content="website" />
<meta property="og:url" content="https://topaffaireimmo.vercel.app/" />
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="https://topaffaireimmo.vercel.app/og-image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

**Required Twitter tags:**
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="..." />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="https://topaffaireimmo.vercel.app/og-image.jpg" />
```

---

### 3. Canonical URLs & Sitemaps

**Check canonical URLs:**

```bash
# Homepage
curl -s https://your-domain.vercel.app/ | grep canonical

# Expected:
<link rel="canonical" href="https://topaffaireimmo.vercel.app/" />
```

**Verify canonical points to production domain, not preview:**
- ✅ `https://topaffaireimmo.vercel.app/`
- ❌ NOT `https://topaffaireimmo-git-branch.vercel.app/`

**Check robots.txt:**

```bash
curl https://your-domain.vercel.app/robots.txt
```

**Expected content:**
```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /dashboard
Disallow: /login
Sitemap: https://topaffaireimmo.vercel.app/sitemap.xml
```

**Check sitemap.xml:**

```bash
curl https://your-domain.vercel.app/sitemap.xml
```

**Expected:** Valid XML with URLs to:
- Homepage
- Main category pages (buy, rent, cities)
- Recent property listings
- City pages

**Verify dynamic sitemaps exist:**
```bash
curl https://your-domain.vercel.app/sitemaps/static.xml
curl https://your-domain.vercel.app/sitemaps/cities.xml
curl https://your-domain.vercel.app/sitemaps/neighborhoods.xml
```

---

### 4. Admin Pages - Noindex Verification

**Admin pages MUST have noindex to prevent search engine indexing:**

```bash
# Check admin listings page
curl -s https://your-domain.vercel.app/admin/listings | grep -i robots

# Expected:
<meta name="robots" content="noindex, nofollow" />
```

**Verify in browser:**
1. Open `/admin/listings` in browser
2. View Page Source
3. Search for `<meta name="robots"`
4. Should see: `content="noindex, nofollow"`

**All admin routes that need noindex:**
- `/admin/*` (all admin pages)
- `/dashboard` (user dashboard)
- `/login` (login page)
- `/register` (registration page)
- `/reset-password` (password reset)

---

### 5. Core Web Vitals & Performance

**Quick performance checks:**

**Use Lighthouse (Chrome DevTools):**
1. Open site in Chrome
2. F12 → Lighthouse tab
3. Select "Performance" + "SEO"
4. Click "Generate report"

**Target scores:**
- ✅ Performance: > 90
- ✅ SEO: > 95
- ✅ Best Practices: > 90
- ✅ Accessibility: > 90

**Core Web Vitals targets:**
- **LCP (Largest Contentful Paint):** < 2.5 seconds
- **FID (First Input Delay):** < 100 milliseconds
- **CLS (Cumulative Layout Shift):** < 0.1

**Common improvements:**

**Images:**
- ✅ Use WebP format
- ✅ Add width/height attributes to prevent CLS
- ✅ Lazy load images below fold: `loading="lazy"`
- ✅ Use appropriate image sizes (srcset for responsive)

```tsx
// Example: Optimized image component
<img 
  src="/images/property.webp"
  alt="Apartment in Casablanca"
  width="800"
  height="600"
  loading="lazy"
  decoding="async"
/>
```

**Bundle size:**
```bash
# Check bundle size after build
npm run build

# Look for large chunks in output:
dist/assets/index-abc123.js  567.89 kB

# If > 1MB, consider code splitting
```

**Code splitting example:**
```tsx
// Lazy load admin routes (reduces initial bundle)
const AdminListings = lazy(() => import('./pages/admin/AdminListings'));

<Route path="/admin/listings" element={
  <Suspense fallback={<Loading />}>
    <AdminListings />
  </Suspense>
} />
```

**Fonts optimization:**
```html
<!-- Preconnect to font providers -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

<!-- Use font-display: swap to avoid FOIT -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
```

---

## 🔒 Security & Observability

### 1. Row Level Security (RLS) is Source of Truth

**✅ Good practices:**

```typescript
// ✅ GOOD: Let RLS handle permissions
const { data } = await supabase
  .from('properties')
  .update({ status: 'published' })
  .eq('id', propertyId);
// RLS will block if user is not admin
```

```typescript
// ❌ BAD: Never rely on client-side checks only
if (isAdmin) {
  // User can manipulate this in browser
  await supabase.from('properties').update({ ... });
}
```

**RLS principles:**
- **Server is source of truth** - RLS policies run on Supabase, can't be bypassed
- **Client checks are UX only** - Hide UI elements, but RLS does real security
- **Test RLS directly** - Use SQL queries to verify policies work

**Test RLS bypassing client:**
```sql
-- Login as regular user (not admin)
-- Try to approve a listing
UPDATE public.properties 
SET status = 'published', approved_by = auth.uid()
WHERE id = 'some-property-id';

-- Should fail with: "new row violates row-level security policy"
```

---

### 2. No Secrets in Frontend

**✅ Safe to expose (VITE_ prefix):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (public/anonymous key)
- `VITE_SITE_URL`
- `VITE_PRODUCTION_DOMAIN`

**❌ NEVER expose in frontend:**
- `SUPABASE_SERVICE_ROLE_KEY`
- Database passwords
- API keys for payment processors
- OAuth client secrets

**Verify no secrets in build:**
```bash
# Build the app
npm run build

# Search for sensitive patterns in built files
grep -r "service_role" dist/
# Should return nothing

grep -r "sk_live" dist/  # Stripe keys
# Should return nothing
```

**Where secrets belong:**
- **Supabase Edge Functions:** Use `supabase secrets set KEY=value`
- **Vercel Serverless Functions:** Add to Vercel env vars WITHOUT `VITE_` prefix
- **Backend services:** Never in React code

---

### 3. CORS Configuration

**Supabase CORS settings:**

Go to: `Supabase Dashboard → Settings → API → CORS Allowed Origins`

**Add these origins:**
```
https://topaffaireimmo.vercel.app
https://www.topaffaireimmo.com
http://localhost:5173
http://localhost:4173
```

**Wildcard for Vercel previews (optional):**
```
https://*.vercel.app
```

**⚠️ Security consideration:**
- Allowing `https://*.vercel.app` permits all Vercel deployments
- More secure: List specific preview URLs
- For production: Only allow production domain

**Test CORS:**
```javascript
// In browser console on deployed site
fetch('https://your-project.supabase.co/rest/v1/properties', {
  headers: {
    'apikey': 'your-anon-key',
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);

// Should NOT see CORS error
```

---

### 4. Error Tracking (Sentry - If Configured)

**If Sentry is set up, verify:**

```bash
# Check if Sentry is in dependencies
grep "@sentry" package.json
```

**Verify Sentry initialization:**
```typescript
// Should be in src/main.tsx or src/App.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://your-sentry-dsn",
  environment: import.meta.env.MODE,
  // ...
});
```

**Test error tracking:**
1. Add temporary error button:
```tsx
<button onClick={() => { throw new Error("Test Sentry"); }}>
  Test Error
</button>
```
2. Click button in deployed app
3. Check Sentry dashboard for error

**If Sentry is NOT configured:**
- Use browser console for client errors
- Use Vercel logs for server errors (if any)
- Consider adding Sentry for production error tracking

---

### 5. Security Headers

**Verify security headers are set:**

```bash
# Check headers on deployed site
curl -I https://your-domain.vercel.app/

# Expected headers:
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

**These are configured in vercel.json:**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

**Use security checker:**
- https://securityheaders.com/
- Enter your deployed URL
- Should score "A" or "B"

---

## ⚠️ Common Pitfalls (Supabase + Admin + RLS)

### Pitfall 1: Admin Actions Fail Silently

**Symptom:**
- Admin clicks "Approve" button
- No error shown
- Listing status doesn't change

**Root cause:**
- RLS policy blocks admin UPDATE
- Or admin user not in `public.admins` table

**Debug:**
```sql
-- Check if user is admin
SELECT * FROM public.admins WHERE user_id = auth.uid();

-- Check RLS policies on properties
SELECT * FROM pg_policies 
WHERE tablename = 'properties' AND cmd = 'UPDATE';

-- Try update directly in SQL editor
UPDATE public.properties 
SET status = 'published' 
WHERE id = 'test-id';
-- If this fails, RLS policy is blocking
```

**Fix:**
1. Ensure user is in `public.admins` table
2. Verify RLS policy allows admins to UPDATE
3. Check for foreign key issues (approved_by references profiles)

---

### Pitfall 2: Audit Logs Not Created

**Symptom:**
- Admin approves/rejects listings
- No records appear in `admin_audit_logs`

**Root cause:**
- Frontend not inserting audit logs
- RLS policy blocking INSERT
- Constraint violation (invalid action/entity_type)

**Debug:**
```sql
-- Check if audit logs table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'admin_audit_logs';

-- Try manual insert
INSERT INTO public.admin_audit_logs (
  admin_id, action, entity_type, entity_id, metadata
) VALUES (
  auth.uid(), 'approve', 'property', 'test-uuid', '{}'::jsonb
);
-- If this fails, check error message
```

**Fix:**
1. Ensure frontend inserts audit log on every admin action
2. Verify RLS policy allows admins to INSERT
3. Check action and entity_type are valid (see constraints)
4. Ensure admin_id = auth.uid() in INSERT

---

### Pitfall 3: Profile Foreign Key Issues

**Symptom:**
- Error: "violates foreign key constraint"
- When setting `approved_by` or `rejected_by`

**Root cause:**
- `approved_by` references `public.profiles(id)`
- Profile might not exist for admin user

**Debug:**
```sql
-- Check if admin has profile
SELECT p.id, u.email
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.id = auth.uid();

-- If profile is NULL, profile doesn't exist
```

**Fix:**
```sql
-- Create profile for admin user if missing
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
WHERE id = auth.uid()
ON CONFLICT (id) DO NOTHING;
```

**Or update schema to reference `auth.users` directly:**
```sql
-- Change foreign key to auth.users instead of profiles
ALTER TABLE public.properties
DROP CONSTRAINT IF EXISTS properties_approved_by_fkey;

ALTER TABLE public.properties
ADD CONSTRAINT properties_approved_by_fkey
FOREIGN KEY (approved_by) REFERENCES auth.users(id);
```

---

### Pitfall 4: Status Workflow Violations

**Symptom:**
- Status changes to invalid state
- Can't approve already approved listing

**Root cause:**
- Missing status validation
- No trigger to enforce workflow

**Correct workflow:**
```
draft → pending (user submits)
pending → published (admin approves)
pending → rejected (admin rejects)
published → pending (admin reverts)
rejected → pending (admin reconsiders)
```

**Add trigger to enforce:**
```sql
-- Create function to validate status transitions
CREATE OR REPLACE FUNCTION validate_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow valid transitions
  IF OLD.status = 'published' AND NEW.status = 'pending' THEN
    -- Allow admin to un-approve
    IF NOT (auth.uid() IN (SELECT user_id FROM public.admins)) THEN
      RAISE EXCEPTION 'Only admins can change published status';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS validate_status_transition_trigger ON public.properties;
CREATE TRIGGER validate_status_transition_trigger
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION validate_status_transition();
```

---

### Pitfall 5: Vercel Preview SEO Pollution

**Symptom:**
- Vercel preview URLs (`*.vercel.app`) getting indexed by Google
- Duplicate content issues

**Root cause:**
- Vercel auto-deploys every PR
- Each preview has unique URL
- Google indexes all of them

**Fix:**

**1. Add X-Robots-Tag header for previews:**
```typescript
// In src/App.tsx or main.tsx
import { isVercelPreview } from './lib/seo';

// Add meta tag for preview deployments
if (isVercelPreview()) {
  const meta = document.createElement('meta');
  meta.name = 'robots';
  meta.content = 'noindex, nofollow';
  document.head.appendChild(meta);
}
```

**2. Use canonical URL pointing to production:**
```typescript
// Always set canonical to production domain
const canonicalUrl = getCanonicalUrl(window.location.pathname);
const link = document.createElement('link');
link.rel = 'canonical';
link.href = canonicalUrl;
document.head.appendChild(link);
```

**3. Verify in browser:**
- Open preview URL: `https://topaffaireimmo-git-pr123.vercel.app/`
- View page source
- Should see: `<meta name="robots" content="noindex, nofollow" />`
- Should see: `<link rel="canonical" href="https://topaffaireimmo.vercel.app/..." />`

---

### Pitfall 6: Build Works Locally, Fails on Vercel

**Symptom:**
- `npm run build` works fine locally
- Vercel deployment fails during build

**Common causes:**

**A. Different Node versions:**
```json
// package.json - lock Node version
{
  "engines": {
    "node": ">=18 <=20",
    "npm": ">=9"
  }
}
```

**B. Environment variables missing:**
```typescript
// Code references VITE_SOME_VAR
const apiUrl = import.meta.env.VITE_SOME_VAR;
// But VITE_SOME_VAR not set in Vercel
```

**Fix:** Add all `VITE_*` vars to Vercel env vars

**C. Build command different:**
Check Vercel uses correct command:
- Vercel Dashboard → Settings → Build & Development
- Build Command: `npm run build`
- Output Directory: `dist`

**D. Dependencies in devDependencies:**
```json
// ❌ BAD: Build-time deps in devDependencies
"devDependencies": {
  "typescript": "^5.8.2"  // Needed for build
}

// ✅ GOOD: Move to dependencies if needed at build time
"dependencies": {
  "typescript": "^5.8.2"
}
```

**Debug Vercel build:**
1. Check Vercel build logs
2. Look for first error (often misleading errors follow)
3. Reproduce locally: `rm -rf node_modules dist && npm install && npm run build`
4. If still works locally, check Vercel settings

---

### Pitfall 7: Admin Dashboard Shows "Not Authorized"

**Symptom:**
- Admin logs in successfully
- Navigates to `/admin/listings`
- Sees "Not authorized" or "Access denied"

**Root cause checklist:**

**A. User not in admins table:**
```sql
-- Check if logged-in user is admin
SELECT * FROM public.admins 
WHERE user_id = auth.uid();
```

**B. RLS policy too strict:**
```sql
-- Check admin check function
SELECT is_admin(auth.uid());
-- Should return true
```

**C. Frontend not checking admin status:**
```typescript
// Ensure admin check uses RLS, not local state
const checkIsAdmin = async () => {
  const { data } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .single();
  
  return !!data;
};
```

**D. Stale session:**
```typescript
// Force refresh session
await supabase.auth.refreshSession();
```

**Fix:**
1. Add user to `public.admins` table (see SQL section)
2. Clear browser cache and re-login
3. Check browser console for RLS errors

---

## 📊 Quick Reference Card

### Essential Commands
```bash
npm install              # Install deps
npm run typecheck        # Type check
npm run lint            # Lint code
npm run build           # Build for prod
npm run preview         # Preview build
```

### Essential SQL Queries
```sql
-- Check admin status
SELECT * FROM public.admins WHERE user_id = auth.uid();

-- View audit logs
SELECT * FROM public.admin_audit_logs ORDER BY created_at DESC LIMIT 20;

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';
```

### Essential URLs
```
Supabase Dashboard: https://app.supabase.com/project/[project-id]
Vercel Dashboard: https://vercel.com/[team]/[project]
Deployed Site: https://topaffaireimmo.vercel.app/
```

### Emergency Fixes
```sql
-- Add admin user
INSERT INTO public.admins (user_id)
SELECT id FROM auth.users WHERE email = 'admin@example.com';

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Clear rejected listings
UPDATE public.properties 
SET status = 'pending', rejected_at = NULL, rejection_reason = NULL
WHERE status = 'rejected';
```

---

## 🎯 Final Checklist Before Going Live

- [ ] All local builds pass (typecheck, lint, build)
- [ ] Supabase migrations applied
- [ ] Admin users added to `public.admins`
- [ ] RLS policies enabled and tested
- [ ] Audit logging working
- [ ] Vercel env vars set correctly
- [ ] Production deployment successful
- [ ] All routes accessible (including `/admin/*`)
- [ ] SEO meta tags correct
- [ ] robots.txt and sitemap.xml accessible
- [ ] Admin pages have noindex
- [ ] Core Web Vitals acceptable (LCP < 2.5s)
- [ ] Security headers present
- [ ] CORS configured
- [ ] No secrets in frontend bundle
- [ ] Error tracking configured (if using Sentry)
- [ ] Tested approve/reject workflow end-to-end
- [ ] Verified audit logs capture admin actions

---

## 📝 Notes

- This guide assumes React 18 + TypeScript + Vite + Supabase + Vercel stack
- All SQL queries are copy-paste ready and tested
- Security is paramount: RLS is source of truth, not frontend checks
- Performance matters: Optimize images, lazy load routes, minimize bundle size
- SEO is critical: Proper meta tags, canonical URLs, sitemaps
- Admin functionality requires careful RLS policy design
- Always test in production-like environment before going live

**Questions or Issues?**
- Check Supabase logs: Dashboard → Logs
- Check Vercel deployment logs: Deployments → [Click deployment]
- Use browser DevTools console for client-side errors
- Test RLS policies directly in SQL editor

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-03  
**Maintained By:** Development Team
