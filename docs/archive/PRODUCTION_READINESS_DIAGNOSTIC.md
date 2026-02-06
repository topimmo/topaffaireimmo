# 🚀 Production Readiness Diagnostic - TopAffaireImmo

**Platform:** React/TypeScript + Supabase + Vercel  
**Focus:** Admin Listings Approval/Rejection + SEO + Production Deployment  
**Last Updated:** 2026-02-02

---

## 📋 Diagnostic Summary

This comprehensive guide provides **actionable, copy-paste ready commands and SQL queries** to verify production readiness for TopAffaireImmo, a Morocco-focused real estate platform with admin approval workflows.

**Key Components:**
- ✅ React 18 + TypeScript + Vite
- ✅ Supabase (Database + Auth + Storage + Edge Functions)
- ✅ Vercel (Hosting + CDN + SPA Routing)
- ✅ Admin Dashboard with Approve/Reject workflows
- ✅ SEO optimization (Meta tags, Sitemaps, Structured Data)
- ✅ Row-Level Security (RLS) for data protection

**What This Document Covers:**
1. **Go/No-Go Checklist** - Production readiness gates
2. **Commands** - Local dev, build, test, deploy verification
3. **Supabase SQL** - Database verification queries (copy-paste ready)
4. **Vercel** - Environment, routing, and deployment checks
5. **SEO** - Meta tags, Core Web Vitals, indexing rules
6. **Security** - RLS verification, no secrets in frontend
7. **Common Pitfalls** - Supabase + Admin + RLS gotchas

---

## ✅ Go/No-Go Checklist

### **Local Development** 
- [ ] `npm install` completes without errors
- [ ] `npm run typecheck` passes (zero TypeScript errors)
- [ ] `npm run lint` passes (zero ESLint errors or warnings)
- [ ] `npm run build` succeeds and generates `dist/` folder
- [ ] `.env` file configured with valid Supabase credentials
- [ ] Local server runs (`npm run dev`) and loads at `http://localhost:5173`

### **Supabase Database**
- [ ] `properties` table has all required columns (status, approved_at, approved_by, rejected_at, rejected_by, rejection_reason)
- [ ] `admins` table exists and has at least one admin user
- [ ] `admin_audit_logs` table exists for tracking admin actions
- [ ] All required indexes exist (status, approved_at, rejected_at)
- [ ] RLS policies allow admins to approve/reject listings
- [ ] RLS policies prevent non-admins from modifying status
- [ ] Storage bucket policies allow image uploads for authenticated users

### **Supabase Auth**
- [ ] Anonymous key (`VITE_SUPABASE_ANON_KEY`) is configured
- [ ] Site URL matches production domain in Supabase dashboard
- [ ] Redirect URLs include production domain + `/auth/callback`
- [ ] Email templates configured (welcome, password reset, magic link)
- [ ] SMTP settings configured (Hostinger or other provider)

### **Vercel Deployment**
- [ ] Environment variables set in Vercel dashboard
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `VITE_SITE_URL` (production domain)
  - [ ] `VITE_PRODUCTION_DOMAIN`
- [ ] SPA rewrites configured (`vercel.json` → all routes to `/index.html`)
- [ ] Security headers configured (X-Frame-Options, CSP, etc.)
- [ ] Build logs show successful build (no errors)
- [ ] Runtime logs accessible and show no critical errors
- [ ] Production domain DNS configured and SSL active

### **SEO & Indexing**
- [ ] `robots.txt` exists and disallows `/admin/*` paths
- [ ] `sitemap.xml` exists and is accessible
- [ ] Admin routes have `noindex` meta tag (verified in browser DevTools)
- [ ] Canonical URLs set correctly for all pages
- [ ] Open Graph tags present (title, description, image)
- [ ] Twitter Card tags present
- [ ] Structured Data (JSON-LD) for Organization and WebSite schemas

### **Performance (Core Web Vitals)**
- [ ] Images optimized (WebP format preferred, lazy loading)
- [ ] Bundle size < 500KB (check in Vercel build logs or `npm run build`)
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] FID (First Input Delay) < 100ms
- [ ] CLS (Cumulative Layout Shift) < 0.1

### **Security**
- [ ] RLS enabled on all sensitive tables (`properties`, `admins`, `admin_audit_logs`)
- [ ] No Supabase service role key in frontend code (`.env` or committed files)
- [ ] CORS configured in Supabase (if using Edge Functions)
- [ ] Admin routes protected by auth check (redirect to login if not admin)
- [ ] SQL injection prevented (using parameterized queries)

### **Observability (Optional but Recommended)**
- [ ] Error tracking configured (Sentry or similar)
- [ ] Console errors checked in production (Browser DevTools)
- [ ] Admin audit logs recording actions (verify inserts to `admin_audit_logs`)

---

## 🖥️ Commands

### **1. Install Dependencies**
```bash
# From project root
cd /home/runner/work/topaffaireimmo/topaffaireimmo

# Install all dependencies (must use npm@10.8.2 or compatible)
npm install

# Expected: No errors, lockfile updated if needed
```

### **2. TypeScript Type Checking**
```bash
# Run TypeScript compiler in check mode (no output files)
npm run typecheck

# Expected output: "No errors found"
# If errors: Fix TypeScript issues in src/ before deploying
```

### **3. Linting**
```bash
# Run ESLint on all .ts/.tsx files
npm run lint

# Expected: 0 warnings, 0 errors
# If errors: Fix linting issues or adjust rules in eslint config
```

### **4. Build for Production**
```bash
# Generate production build (includes sitemap generation)
npm run build

# Expected output:
# - "build complete" message
# - dist/ folder created with index.html, assets/, etc.
# - Bundle size report (check that total < 500KB gzipped)

# Verify dist/ folder
ls -lh dist/
```

### **5. Preview Production Build Locally**
```bash
# Serve the production build locally
npm run preview

# Expected: Server starts at http://localhost:4173
# Test: Navigate to pages, check console for errors
```

### **6. Generate TypeScript Types from Supabase**
```bash
# Fetch latest database schema as TypeScript types
# Requires SUPABASE_PROJECT_ID environment variable
export SUPABASE_PROJECT_ID="your-project-id"
npm run types:supabase

# Expected: src/types/supabase.ts updated with latest schema
```

### **7. Run Tests (if configured)**
```bash
# Currently no test script in package.json
# If adding tests, use: npm test or npm run test
```

---

## 🗄️ Supabase SQL Verification

**How to Run These Queries:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy/paste each query below
3. Click "Run" and verify expected results

---

### **1. Verify `properties` Table Columns**

Check that all required columns exist for approval/rejection workflow:

```sql
-- Query: List all columns in properties table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'properties'
ORDER BY ordinal_position;
```

**Expected Columns to Find:**
- `status` (text) - 'pending', 'approved', 'rejected', 'inactive'
- `approved_at` (timestamptz) - when listing was approved
- `approved_by` (uuid) - admin user ID who approved
- `rejected_at` (timestamptz) - when listing was rejected
- `rejected_by` (uuid) - admin user ID who rejected
- `rejection_reason` (text) - reason for rejection

**⚠️ If Missing:** Run migrations 036, 050, 064 to add these columns.

---

### **2. Verify `admins` Table Exists**

```sql
-- Query: Check if admins table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'admins'
) AS admins_table_exists;
```

**Expected Result:** `admins_table_exists = true`

**If False:** Run migration 050 to create the admins table.

---

### **3. Check Admin Users**

```sql
-- Query: List all admin users
SELECT 
  a.user_id,
  u.email,
  a.created_at
FROM public.admins a
JOIN auth.users u ON a.user_id = u.id
ORDER BY a.created_at DESC;
```

**Expected Result:** At least 1 admin user listed.

**⚠️ If Empty:** Add an admin user:

```sql
-- Insert your user as admin (replace with your auth.users ID)
INSERT INTO public.admins (user_id)
VALUES ('YOUR-USER-UUID-HERE')
ON CONFLICT (user_id) DO NOTHING;
```

**How to Find Your User ID:**
```sql
-- Find user by email
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'your-email@example.com';
```

---

### **4. Verify Indexes on Properties**

Indexes improve query performance for filtering by status, approval date, etc.

```sql
-- Query: List all indexes on properties table
SELECT 
  i.relname AS index_name,
  a.attname AS column_name
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE t.relname = 'properties'
  AND t.relkind = 'r'
ORDER BY i.relname, a.attname;
```

**Expected Indexes:**
- `idx_properties_approved_at` (on `approved_at`)
- `idx_properties_rejected_at` (on `rejected_at`)
- `idx_properties_status` (on `status`) - if exists
- `idx_properties_facebook_posted` (on `facebook_posted`)

**⚠️ If Missing:** Create indexes for performance:

```sql
-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_approved_at ON public.properties(approved_at);
CREATE INDEX IF NOT EXISTS idx_properties_rejected_at ON public.properties(rejected_at);
```

---

### **5. Verify `admin_audit_logs` Table**

Admin actions should be logged for audit trail:

```sql
-- Query: Check if admin_audit_logs exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'admin_audit_logs'
) AS audit_logs_table_exists;
```

**Expected Result:** `audit_logs_table_exists = true`

**If False:** Run migration 053 to create admin_audit_logs.

**Check Audit Log Structure:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'admin_audit_logs'
ORDER BY ordinal_position;
```

**Expected Columns:**
- `id`, `created_at`, `admin_id`, `action`, `entity_type`, `entity_id`, `metadata`

---

### **6. Verify RLS Policies on Properties**

**⚠️ CRITICAL:** RLS must allow admins to approve/reject, but prevent non-admins from changing status.

```sql
-- Query: List all RLS policies on properties table
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

**Expected Policies:**
- **SELECT:** Public can view approved properties (`status = 'approved'`)
- **INSERT:** Authenticated users can create listings (default status = 'pending')
- **UPDATE (Owner):** Owners can update their own listings (but NOT change status)
- **UPDATE (Admin):** Admins can update ANY listing and change status
- **DELETE:** Only admins or owners can delete

**Key RLS Rule to Verify:**
```sql
-- Check if there's a policy allowing admins to update status
-- Look for policy with:
-- - cmd = 'UPDATE'
-- - qual or with_check contains: auth.uid() IN (SELECT user_id FROM public.admins)
```

**⚠️ If Admin Update Policy Missing:** Users cannot approve/reject listings!

---

### **7. Test Admin Permissions (Simulation)**

Simulate admin approval action to verify RLS allows it:

```sql
-- Set session to simulate admin user
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "YOUR-ADMIN-USER-UUID"}';

-- Try to approve a listing (replace property-id)
UPDATE public.properties
SET 
  status = 'approved',
  approved_at = NOW(),
  approved_by = 'YOUR-ADMIN-USER-UUID'
WHERE id = 'some-property-id';

-- Expected: Update succeeds (1 row affected)
-- If Error: RLS policy blocking admin updates
```

**⚠️ Reset Session:**
```sql
RESET role;
RESET request.jwt.claims;
```

---

### **8. Verify Audit Logs Are Being Written**

After an admin action (approve/reject), check if audit log was created:

```sql
-- Query: Get recent audit logs
SELECT 
  al.created_at,
  al.action,
  al.entity_type,
  al.entity_id,
  al.metadata,
  u.email AS admin_email
FROM public.admin_audit_logs al
JOIN auth.users u ON al.admin_id = u.id
ORDER BY al.created_at DESC
LIMIT 20;
```

**Expected Result:** Recent admin actions listed (approve, reject, delete, etc.)

**⚠️ If Empty:** 
- Frontend code may not be inserting audit logs
- Check RLS policy on `admin_audit_logs` (admins can insert)

---

### **9. Verify Storage Bucket Policies**

Images must be uploadable by authenticated users:

```sql
-- Query: List storage bucket policies
SELECT 
  name,
  definition
FROM storage.policies
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'property-images')
ORDER BY name;
```

**Expected Policies:**
- **Upload:** Authenticated users can upload
- **Select:** Public can view images (for approved listings)
- **Delete:** Only owner or admin can delete images

**⚠️ If Missing:** Run migration 052 to fix storage security.

---

## ☁️ Vercel Verification

### **1. Environment Variables**

**Where to Check:**
Vercel Dashboard → Your Project → Settings → Environment Variables

**Required Variables:**

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `VITE_SUPABASE_URL` | `https://abc123.supabase.co` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase anonymous/public key |
| `VITE_SITE_URL` | `https://www.topaffaireimmo.com` | Production domain (for auth redirects) |
| `VITE_PRODUCTION_DOMAIN` | `https://topaffaireimmo.com` | Canonical domain (for SEO) |

**How to Verify:**

1. Go to Vercel Dashboard
2. Navigate to: Settings → Environment Variables
3. Confirm all 4 variables are set for **Production** environment
4. Click "Redeploy" after adding/changing variables

**⚠️ Common Mistake:**
- Setting variables for "Preview" but not "Production"
- Using `http://` instead of `https://` for production domains

---

### **2. Routing & Rewrites**

**File to Check:** `vercel.json` in project root

**Required Rewrite for SPA:**
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

**What This Does:**
- All routes (including `/admin/*`, `/property/*`) are handled by React Router
- Without this: Direct navigation to `/admin/listings` would return 404

**How to Verify:**
1. Deploy to Vercel
2. Navigate directly to: `https://yoursite.com/admin/listings`
3. Expected: Page loads (React Router handles route)
4. If 404: Rewrite missing or misconfigured

---

### **3. Security Headers**

**File to Check:** `vercel.json` → `headers` section

**Current Headers (from vercel.json):**
- `X-Frame-Options: SAMEORIGIN` (prevents clickjacking)
- `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
- `X-XSS-Protection: 1; mode=block` (XSS protection)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(self), microphone=(), camera=()`

**How to Verify:**
1. Deploy to Vercel
2. Open browser DevTools → Network tab
3. Load homepage, inspect response headers
4. Confirm headers are present

**Command Line Check:**
```bash
curl -I https://yoursite.com | grep -i "x-frame-options\|x-content-type"
```

---

### **4. Build Logs**

**Where to Check:**
Vercel Dashboard → Deployments → [Latest Deployment] → Build Logs

**What to Look For:**

✅ **Success Indicators:**
```
✓ Collecting build output...
✓ Build completed (XX seconds)
✓ Deployment ready
```

❌ **Error Indicators:**
```
✘ Build failed
✘ Command "npm run build" exited with 1
✘ Module not found
✘ Type error
```

**Common Build Errors:**
1. **TypeScript errors:** Run `npm run typecheck` locally first
2. **Missing env vars:** Build-time vars must be set in Vercel
3. **Dependency issues:** Delete `node_modules`, re-run `npm install`

---

### **5. Runtime Logs**

**Where to Check:**
Vercel Dashboard → Deployments → [Deployment] → Functions (Runtime Logs)

**What to Look For:**

✅ **Healthy Logs:**
- No errors
- Only INFO or DEBUG messages

❌ **Problem Logs:**
- `ERROR` level messages
- `CORS` errors (if using Edge Functions)
- `Unauthorized` or `403` errors (RLS blocking requests)

**How to Debug Runtime Issues:**
1. Open production site in browser
2. Open DevTools Console
3. Reproduce the issue (e.g., click "Approve" button)
4. Check for errors in console
5. Cross-reference with Vercel runtime logs

---

### **6. Domain & SSL**

**Where to Check:**
Vercel Dashboard → Settings → Domains

**Required Setup:**
1. **Production domain added** (e.g., `topaffaireimmo.com`)
2. **www redirect configured** (if using `www.topaffaireimmo.com`)
3. **SSL certificate active** (green checkmark)

**How to Verify SSL:**
```bash
# Check SSL certificate
curl -vI https://yoursite.com 2>&1 | grep -i "SSL connection\|subject\|issuer"
```

**Expected:** Valid SSL from Let's Encrypt or similar CA

---

## 🔍 SEO Verification

### **1. Title & Meta Tags**

**Where to Check:**
1. Open production site in browser
2. Right-click → "View Page Source"
3. Search for `<title>` and `<meta name="description">`

**Required Tags (from `index.html`):**

```html
<title>TopAffaireImmo - Trouvez votre propriété parfaite au Maroc</title>
<meta name="description" content="TopAffaireImmo est la plateforme immobilière de référence au Maroc..." />
<meta name="keywords" content="immobilier Maroc, propriété Maroc, appartements Maroc..." />
<meta name="robots" content="index, follow, max-image-preview:large..." />
```

**Dynamic Pages:** Verify SEO component (`src/components/SEO.tsx`) updates tags per page.

**How to Test:**
1. Navigate to a property detail page
2. Check if title changes to property title
3. Check if description changes to property description

---

### **2. Open Graph (Facebook/LinkedIn) Tags**

**Required Tags:**
```html
<meta property="og:type" content="website" />
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="https://yoursite.com/og-image.jpg" />
<meta property="og:url" content="https://yoursite.com" />
```

**How to Test:**
1. Use [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
2. Enter your site URL
3. Click "Scrape Again"
4. Verify image, title, description appear correctly

**⚠️ Common Issue:** `og:image` must be **absolute URL** (https://...), not relative (/og-image.jpg)

---

### **3. Twitter Card Tags**

**Required Tags:**
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="..." />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="..." />
```

**How to Test:**
1. Use [Twitter Card Validator](https://cards-dev.twitter.com/validator)
2. Enter your site URL
3. Verify preview looks correct

---

### **4. Canonical URLs**

**Purpose:** Avoid duplicate content penalties from search engines.

**How to Check:**
```html
<!-- View page source, look for: -->
<link rel="canonical" href="https://topaffaireimmo.com/current-page" />
```

**⚠️ Critical Rules:**
- **Production:** Canonical should be production domain (not `vercel.app`)
- **Dynamic Pages:** Canonical should match current URL (no trailing slash inconsistencies)

**How SEO Component Handles This:**
- Uses `getCanonicalUrl()` helper from `lib/seo.ts`
- Falls back to `VITE_PRODUCTION_DOMAIN` + current path

---

### **5. robots.txt**

**File Location:** `public/robots.txt`

**How to Verify:**
1. Navigate to: `https://yoursite.com/robots.txt`
2. Confirm file loads (not 404)

**Key Rules to Check:**
```txt
User-agent: *
Allow: /
Disallow: /admin
Disallow: /dashboard
Disallow: /account
Sitemap: https://yoursite.com/sitemap.xml
```

**⚠️ Admin Routes Must Be Disallowed:**
- `/admin` - Admin panel
- `/dashboard` - User dashboard
- `/login`, `/register` - Auth pages

---

### **6. Sitemap.xml**

**File Locations:**
- `public/sitemap.xml` (main sitemap index)
- `public/sitemaps/static.xml` (static pages)
- `public/sitemaps/cities.xml` (city landing pages)
- `public/sitemaps/neighborhoods.xml` (neighborhood pages)

**How to Verify:**
1. Navigate to: `https://yoursite.com/sitemap.xml`
2. Confirm XML loads and lists child sitemaps
3. Click into child sitemaps, verify URLs are correct

**Submission to Google:**
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Submit sitemap: `https://yoursite.com/sitemap.xml`
3. Monitor indexing status

**How Sitemaps Are Generated:**
- Script: `scripts/generate-sitemaps.ts`
- Run automatically during build: `npm run build`

---

### **7. Admin Routes - Noindex**

**Purpose:** Prevent admin pages from appearing in search results.

**How to Verify:**
1. Open: `https://yoursite.com/admin/listings`
2. View page source
3. Look for: `<meta name="robots" content="noindex, nofollow" />`

**How SEO Component Handles This:**
- Checks `shouldAllowIndexing()` helper (from `lib/seo.ts`)
- If on `/admin/*` route → sets `noindex`
- If on Vercel preview domain → sets `noindex`

**Manual Test:**
```html
<!-- Expected on /admin/* pages: -->
<meta name="robots" content="noindex, nofollow" />

<!-- Expected on public pages: -->
<meta name="robots" content="index, follow, max-image-preview:large..." />
```

---

### **8. Structured Data (JSON-LD)**

**Location:** `index.html` → `<script type="application/ld+json">`

**Schemas Implemented:**
1. **Organization Schema** - Business info for Knowledge Graph
2. **WebSite Schema** - Search box integration

**How to Verify:**
1. Use [Google Rich Results Test](https://search.google.com/test/rich-results)
2. Enter your site URL
3. Confirm schemas are valid (green checkmarks)

**Expected Schemas:**
- `@type: "Organization"` with `name`, `url`, `logo`, `areaServed`
- `@type: "WebSite"` with `potentialAction` (SearchAction)

---

## ⚡ Core Web Vitals & Performance

### **1. Quick Checks**

**Use Lighthouse in Chrome DevTools:**
1. Open site in Chrome
2. Open DevTools (F12)
3. Go to "Lighthouse" tab
4. Click "Generate Report"

**Target Scores:**
- Performance: **>90**
- Accessibility: **>95**
- Best Practices: **>90**
- SEO: **>95**

---

### **2. Key Metrics**

| Metric | Target | Description |
|--------|--------|-------------|
| **LCP** (Largest Contentful Paint) | <2.5s | Time until main content loads |
| **FID** (First Input Delay) | <100ms | Time until page is interactive |
| **CLS** (Cumulative Layout Shift) | <0.1 | Visual stability (no layout jumps) |
| **FCP** (First Contentful Paint) | <1.8s | Time to first visible content |
| **TTI** (Time to Interactive) | <3.8s | Time until fully interactive |

**How to Measure:**
- Use [PageSpeed Insights](https://pagespeed.web.dev/)
- Enter production URL
- Review "Core Web Vitals Assessment"

---

### **3. Image Optimization**

**Current Setup:**
- Images stored in Supabase Storage
- Frontend: React components lazy-load images

**Improvements:**

✅ **Use WebP Format:**
```typescript
// In image upload handler, convert to WebP before uploading
// Use libraries like: sharp, imagemagick, or browser API
```

✅ **Lazy Loading:**
```tsx
// Already implemented in property cards
<img 
  src={imageUrl} 
  loading="lazy" 
  alt={property.title} 
/>
```

✅ **Responsive Images:**
```tsx
// Use srcset for different screen sizes
<img 
  src={imageUrl} 
  srcSet={`${imageUrl}?width=400 400w, ${imageUrl}?width=800 800w`}
  sizes="(max-width: 600px) 400px, 800px"
/>
```

**⚠️ Supabase Storage Transformations:**
Supabase supports image transformations via URL params:
```
https://your-project.supabase.co/storage/v1/object/public/property-images/image.jpg?width=400&height=300
```

---

### **4. Bundle Size Optimization**

**Check Current Size:**
```bash
npm run build

# Look for output like:
# dist/assets/index-abc123.js  250.00 kB
# dist/assets/vendor-xyz789.js 180.00 kB
# Total: ~430 kB
```

**Target:** <500 kB total (gzipped)

**Optimization Strategies:**

1. **Code Splitting (already implemented via Vite):**
   - Each route is a separate chunk
   - Loaded on-demand

2. **Tree Shaking:**
   - Import only what you need:
   ```typescript
   // ✅ Good
   import { Button } from '@radix-ui/react-button';
   
   // ❌ Bad
   import * as Radix from '@radix-ui/react-button';
   ```

3. **Analyze Bundle:**
   ```bash
   npm install --save-dev rollup-plugin-visualizer
   # Add to vite.config.ts, rebuild, open stats.html
   ```

---

### **5. Font Loading Optimization**

**Current Setup (from `index.html`):**
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

**Improvement:** Reduce flash of unstyled text (FOUT)

```html
<!-- Add font-display: swap to Google Fonts URL -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

---

### **6. Caching Headers**

**Current Setup (from `vercel.json`):**
```json
{
  "headers": [
    {
      "source": "/(.*)\\.(js|css|woff|woff2|ttf|otf|eot|svg|png|jpg|jpeg|gif|webp|ico)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**What This Does:**
- Static assets cached for 1 year
- Reduces repeat load times
- Improves LCP/FCP on return visits

**⚠️ Index.html Should NOT Be Cached:**
```json
{
  "source": "/index.html",
  "headers": [
    {
      "key": "Cache-Control",
      "value": "no-cache, no-store, must-revalidate"
    }
  ]
}
```

**Verify in DevTools:**
1. Load site
2. Network tab → Click on `.js` file
3. Headers → `Cache-Control: public, max-age=31536000, immutable`

---

## 🔒 Observability & Security

### **1. Error Tracking (Sentry - Optional)**

**Check if Sentry is Configured:**
```bash
# Search for Sentry in codebase
grep -r "@sentry/react" src/ package.json
```

**If Sentry Exists:**

1. **Verify DSN is Set:**
   ```typescript
   // Look for in src/main.tsx or similar:
   Sentry.init({
     dsn: import.meta.env.VITE_SENTRY_DSN,
     // ...
   });
   ```

2. **Check Sentry Dashboard:**
   - Go to Sentry.io → Your Project
   - Verify events are being captured
   - Set up alerts for critical errors

**If Sentry NOT Configured:**
- Use browser console to check for errors
- Monitor Vercel runtime logs for backend errors

---

### **2. Security - RLS Is Source of Truth**

**⚠️ CRITICAL PRINCIPLE:**
> **Never trust frontend validation alone. RLS is the final gatekeeper.**

**Why This Matters:**
- Malicious users can bypass frontend checks (DevTools, API calls)
- RLS ensures database-level protection
- Even if frontend has a bug, RLS prevents unauthorized access

**How to Verify RLS Is Working:**

1. **Test as Non-Admin User:**
   ```sql
   -- In Supabase SQL Editor, simulate non-admin user
   SET LOCAL role TO authenticated;
   SET LOCAL request.jwt.claims TO '{"sub": "non-admin-user-uuid"}';
   
   -- Try to approve a listing (should fail)
   UPDATE public.properties
   SET status = 'approved'
   WHERE id = 'some-property-id';
   
   -- Expected: Permission denied or 0 rows updated
   ```

2. **Test as Admin User:**
   ```sql
   -- Simulate admin user
   SET LOCAL request.jwt.claims TO '{"sub": "admin-user-uuid"}';
   
   -- Try to approve a listing (should succeed)
   UPDATE public.properties
   SET status = 'approved'
   WHERE id = 'some-property-id';
   
   -- Expected: 1 row updated
   ```

---

### **3. No Secrets in Frontend Code**

**⚠️ NEVER COMMIT:**
- Supabase **service role key** (only anon key is safe)
- API keys for third-party services
- Database passwords
- Admin passwords

**How to Check:**
```bash
# Search for common secret patterns in codebase
grep -r "service_role" src/ .env* || echo "Not found (good!)"
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" src/ || echo "Not found (good!)"
```

**Safe to Commit:**
- `VITE_SUPABASE_ANON_KEY` (public key)
- `VITE_SUPABASE_URL`
- `VITE_SITE_URL`

**How to Store Secrets:**
- Vercel: Environment Variables (encrypted at rest)
- Supabase Edge Functions: Use `supabase secrets set KEY=value`

---

### **4. CORS Notes (Edge Functions)**

**If Using Supabase Edge Functions:**

1. **Check Function Code:**
   ```typescript
   // Edge function must return CORS headers
   return new Response(JSON.stringify(data), {
     headers: {
       'Content-Type': 'application/json',
       'Access-Control-Allow-Origin': '*', // Or specific domain
       'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
     },
   });
   ```

2. **Test CORS:**
   ```bash
   curl -H "Origin: https://yoursite.com" \
        -H "Access-Control-Request-Method: POST" \
        -X OPTIONS \
        https://your-project.supabase.co/functions/v1/your-function
   
   # Expected: Access-Control-Allow-Origin header in response
   ```

---

### **5. Admin Route Protection**

**Verify Admin Auth Check:**

1. **Open `src/pages/AdminPanel.tsx` (or similar)**
2. **Look for auth guard:**
   ```typescript
   // Should have something like:
   const { user } = useAuth();
   const { isAdmin, loading } = useAdmin(user?.id);
   
   if (loading) return <LoadingSpinner />;
   if (!isAdmin) {
     navigate('/login');
     return null;
   }
   ```

3. **Test Protection:**
   - Log out (or use incognito mode)
   - Navigate to: `/admin/listings`
   - Expected: Redirected to login page
   - If NOT redirected: Auth guard missing or broken

---

### **6. SQL Injection Prevention**

**✅ Using Supabase Client (Safe):**
```typescript
// Parameterized query - safe from SQL injection
const { data } = await supabase
  .from('properties')
  .update({ status: 'approved' })
  .eq('id', propertyId);
```

**❌ Raw SQL (Dangerous):**
```typescript
// NEVER DO THIS - vulnerable to SQL injection
const query = `UPDATE properties SET status = 'approved' WHERE id = '${propertyId}'`;
await supabase.rpc('execute_raw_sql', { query });
```

**How to Verify:**
- Search codebase for `.rpc(` calls
- Ensure all user inputs are parameterized

---

## ⚠️ Common Pitfalls (Supabase + Admin + RLS)

### **1. Infinite Redirect Loop (Admin Check)**

**Symptom:** Page keeps redirecting between `/admin` and `/login`

**Root Cause:**
- Admin check runs, but `isAdmin` is `false` due to:
  - User not in `public.admins` table
  - RLS policy blocking read access to `admins` table
  - JWT token missing `sub` claim

**Fix:**
```sql
-- Verify user is in admins table
SELECT * FROM public.admins WHERE user_id = 'your-user-id';

-- If not found:
INSERT INTO public.admins (user_id) VALUES ('your-user-id');
```

---

### **2. Approval Button Does Nothing**

**Symptom:** Click "Approve" button, no error, but status doesn't change

**Root Cause:**
- RLS policy blocking UPDATE on properties
- Admin user not in `public.admins` table
- Frontend not sending correct payload

**Debugging Steps:**
1. **Open Browser DevTools Console**
2. **Click "Approve" button**
3. **Check for errors:**
   ```
   Supabase error: new row violates row-level security policy
   ```

4. **Check Network Tab:**
   - Look for POST/PATCH request to Supabase
   - Inspect payload and response

5. **Verify RLS Policy:**
   ```sql
   -- Run this as admin user in SQL Editor
   UPDATE public.properties
   SET status = 'approved'
   WHERE id = 'test-property-id';
   
   -- Expected: Success
   -- If fails: RLS policy issue
   ```

---

### **3. Images Not Loading After Upload**

**Symptom:** Image upload succeeds, but image doesn't display on frontend

**Root Cause:**
- Storage bucket RLS policy blocks public read access
- Image URL incorrect (missing `/public/` in path)
- CORS not configured for storage bucket

**Fix:**
```sql
-- Verify storage bucket policies
SELECT * FROM storage.policies 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'property-images');

-- If no SELECT policy exists, create one:
CREATE POLICY "Public can view images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'property-images');
```

**Check Image URL Format:**
```typescript
// ✅ Correct public URL
const url = `${supabaseUrl}/storage/v1/object/public/property-images/${filename}`;

// ❌ Wrong (missing /public/)
const url = `${supabaseUrl}/storage/v1/object/property-images/${filename}`;
```

---

### **4. Admin Can't See Pending Listings**

**Symptom:** Admin panel shows "No pending listings" even though there are pending properties

**Root Cause:**
- RLS policy on properties only allows viewing `status = 'approved'`
- Admin SELECT policy missing or misconfigured

**Fix:**
```sql
-- Verify admin can select all listings
-- Expected policy:
CREATE POLICY "admins_select_all" ON public.properties
FOR SELECT
USING (
  auth.uid() IN (SELECT user_id FROM public.admins)
);
```

**Test:**
```sql
-- As admin, this should return all listings
SELECT id, status, title_en FROM public.properties;
```

---

### **5. Vercel Preview Domains Indexed by Google**

**Symptom:** Google Search results show `your-app-xyz123.vercel.app` instead of production domain

**Root Cause:**
- `robots.txt` allows indexing on all domains
- SEO component doesn't check for preview domains

**Fix (already implemented):**
```typescript
// In lib/seo.ts
export function shouldAllowIndexing(): boolean {
  const currentUrl = window.location.href;
  
  // Block Vercel preview deployments
  if (currentUrl.includes('.vercel.app') && !currentUrl.includes('your-production.vercel.app')) {
    return false;
  }
  
  return true;
}
```

**Additional:** Add `X-Robots-Tag` header for preview deployments in `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Robots-Tag",
          "value": "noindex, nofollow"
        }
      ],
      "has": [
        {
          "type": "host",
          "value": "(?!www\\.topaffaireimmo\\.com).*\\.vercel\\.app$"
        }
      ]
    }
  ]
}
```

---

### **6. Password Reset Emails Redirect to Wrong Domain**

**Symptom:** User clicks "Reset Password" email link, redirected to `localhost` or wrong domain

**Root Cause:**
- `VITE_SITE_URL` not set in Vercel
- Supabase Site URL not configured in dashboard

**Fix:**
1. **Set Vercel Env Var:**
   ```
   VITE_SITE_URL=https://www.topaffaireimmo.com
   ```

2. **Configure Supabase Dashboard:**
   - Go to: Authentication → URL Configuration
   - Set "Site URL": `https://www.topaffaireimmo.com`
   - Add redirect URL: `https://www.topaffaireimmo.com/auth/callback`

3. **Redeploy Vercel** after env var change

---

### **7. Audit Logs Not Being Created**

**Symptom:** Admin actions (approve/reject) don't appear in `admin_audit_logs`

**Root Cause:**
- Frontend code not inserting into `admin_audit_logs`
- RLS policy blocking INSERT
- Error thrown but not visible to user

**Fix:**

1. **Check Frontend Code:**
   ```typescript
   // Should have something like this after approve/reject:
   await supabase.from('admin_audit_logs').insert({
     admin_id: user.id,
     action: 'approve',
     entity_type: 'property',
     entity_id: propertyId,
     metadata: { /* optional */ }
   });
   ```

2. **Verify RLS Policy:**
   ```sql
   -- Admin should be able to insert their own logs
   CREATE POLICY "admins_insert_own_logs" ON public.admin_audit_logs
   FOR INSERT
   WITH CHECK (
     auth.uid() IN (SELECT user_id FROM public.admins)
     AND admin_id = auth.uid()
   );
   ```

---

### **8. Foreign Key Constraint Errors**

**Symptom:** Error when approving: `violates foreign key constraint "properties_approved_by_fkey"`

**Root Cause:**
- `approved_by` references `public.profiles(id)`, but user profile doesn't exist
- Migration changed FK target (was `auth.users`, now `public.profiles`)

**Fix:**
```sql
-- Check if FK references correct table
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE conname LIKE '%approved_by%';

-- Expected: references public.profiles(id) OR auth.users(id)
-- If wrong, drop and recreate FK:
ALTER TABLE public.properties 
DROP CONSTRAINT IF EXISTS properties_approved_by_fkey;

ALTER TABLE public.properties
ADD CONSTRAINT properties_approved_by_fkey
FOREIGN KEY (approved_by) REFERENCES auth.users(id);
```

---

## 🚦 Final Go/No-Go Decision

### **GREEN LIGHT (Ready for Production):**
✅ All checklist items checked  
✅ Build succeeds locally and on Vercel  
✅ Admin can approve/reject listings  
✅ Audit logs are being created  
✅ SEO tags present and correct  
✅ No console errors on production  
✅ Core Web Vitals in green zone  

### **YELLOW LIGHT (Deploy with Caution):**
⚠️ Minor issues (e.g., bundle size slightly over target)  
⚠️ Non-critical SEO warnings (missing alt tags on some images)  
⚠️ Performance score 80-90 (acceptable, but can improve)  

### **RED LIGHT (Do NOT Deploy):**
❌ Build fails  
❌ TypeScript errors  
❌ RLS allows non-admins to approve listings  
❌ Admin login doesn't work  
❌ Images not loading  
❌ Critical security issues (secrets exposed, no RLS)  

---

## 📞 Support Contacts

**Supabase Issues:**
- Dashboard: https://app.supabase.com
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com

**Vercel Issues:**
- Dashboard: https://vercel.com/dashboard
- Docs: https://vercel.com/docs
- Support: help@vercel.com

**Project-Specific:**
- GitHub Issues: https://github.com/topimmo/topaffaireimmo/issues

---

## 📝 Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-02 | 1.0 | Initial comprehensive diagnostic guide created |

---

**End of Diagnostic Guide** ✅
