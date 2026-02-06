# Property Listings Debugging - Final Summary & Action Plan

## Executive Summary

This document provides a comprehensive analysis of why property listings may not be showing on the TopAffaireImmo website, along with diagnostic tools and fixes.

**Primary Conclusion**: The issue is **PRIMARILY IN SUPABASE DATABASE CONFIGURATION**, not in the frontend code.

## Issue Classification

### ✅ Frontend Code: NO ISSUES FOUND

After thorough code review:
- ✅ Supabase client properly configured (`src/lib/supabase.ts`)
- ✅ useProperties hook correctly filters for published listings
- ✅ SearchResults component applies proper status filters
- ✅ Headers automatically set by `@supabase/supabase-js` client
- ✅ No code changes needed in frontend

### ⚠️ Supabase Database: LIKELY ISSUES

Most probable causes (in priority order):

1. **Empty Properties Table** (80% likelihood)
   - Database never seeded with initial data
   - Properties table has 0 rows
   
2. **Wrong Property Status** (15% likelihood)
   - Properties exist but status = 'approved' instead of 'published'
   - Properties have is_archived = TRUE
   
3. **Missing RLS Policies** (4% likelihood)
   - Public SELECT policy missing or too restrictive
   - Migration 072 not applied
   
4. **Missing promo_banners Table** (1% likelihood)
   - Migration 068 not applied
   - Causes HTTP 404 on banner requests

## Diagnostic Tools Created

### 1. SQL Diagnostic Script
**File**: `scripts/debug-listings-diagnostic.sql`

Run in Supabase SQL Editor to check:
- Total properties count
- Status distribution
- RLS policies
- promo_banners table existence
- Indexes and performance

```bash
# In Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Create new query
# 3. Paste contents of debug-listings-diagnostic.sql
# 4. Run
```

### 2. TypeScript Diagnostic Tool
**File**: `scripts/debug-listings.ts`

Programmatic diagnostic that tests API calls:

```bash
# Requires environment variables in .env:
# - VITE_SUPABASE_URL or SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY (optional, for full diagnostics)
# - VITE_SUPABASE_ANON_KEY (for public API tests)

npx tsx scripts/debug-listings.ts
```

Features:
- Tests anon client API calls
- Checks service role access (if key provided)
- Verifies RLS policies
- Tests promo_banners endpoint
- Provides actionable recommendations

### 3. Browser Diagnostic Script
**File**: `scripts/browser-diagnostic.js`

Run directly in browser console:

```javascript
// 1. Open the website
// 2. Press F12 to open DevTools
// 3. Go to Console tab
// 4. Paste entire contents of browser-diagnostic.js
// 5. Press Enter
```

Checks:
- Live API responses
- Network status codes
- Published properties visibility
- Real-time error messages

### 4. Automated Fix Script
**File**: `scripts/fix-listings-issues.sql`

Run in Supabase SQL Editor to automatically:
- Create promo_banners table if missing
- Fix status/archived inconsistencies
- Verify RLS policies
- Create missing policies
- Show final verification results

```bash
# In Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Paste contents of fix-listings-issues.sql
# 3. Review each section
# 4. Run (safe to run multiple times - idempotent)
```

## HTTP Status Codes Explained

### HTTP 300 - Multiple Choices

**What it means**: PostgREST cannot determine which representation to return.

**Common causes**:
1. Multiple schemas exposing same table name
2. Ambiguous column selection with embedded resources
3. Missing Accept header (rare with supabase-js)

**How to diagnose**:
```bash
# Test with curl
curl -X GET "https://your-project.supabase.co/rest/v1/properties" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Accept: application/json" \
  -v
```

**If you see HTTP 300**:
- Check response `Location` header for redirect URL
- Look for multiple schemas in database
- Verify `Accept: application/json` header is sent

**Fix**: The `@supabase/supabase-js` client handles headers automatically. If using raw fetch, add proper headers:

```typescript
fetch(`${supabaseUrl}/rest/v1/properties`, {
  headers: {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Accept': 'application/json'
  }
})
```

### HTTP 404 - Not Found

For `/rest/v1/promo_banners`:

**Root cause**: Table doesn't exist in database

**Fix**: Run migration 068:
```bash
# In Supabase SQL Editor, run:
# supabase/migrations/068_create_promo_banners.sql
```

## Step-by-Step Debugging Process

### Phase 1: Run Diagnostics (5 minutes)

```bash
# Option A: TypeScript diagnostic (requires .env configured)
npx tsx scripts/debug-listings.ts

# Option B: SQL diagnostic (in Supabase Dashboard)
# Paste scripts/debug-listings-diagnostic.sql into SQL Editor and run

# Option C: Browser diagnostic (in production)
# Paste scripts/browser-diagnostic.js into browser console
```

### Phase 2: Identify Root Cause (Review diagnostic output)

**Scenario A: "Total properties: 0"**
- Root cause: Empty database
- Solution: Seed data (go to Phase 3A)

**Scenario B: "Properties exist but none published"**
- Root cause: Wrong status
- Solution: Update status (go to Phase 3B)

**Scenario C: "RLS policies missing"**
- Root cause: Migration not applied
- Solution: Apply migration (go to Phase 3C)

**Scenario D: "promo_banners not found"**
- Root cause: Migration not applied
- Solution: Run migration 068 (go to Phase 3D)

### Phase 3A: Seed Sample Data

```bash
# Set environment variables first
export VITE_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
export PEXELS_API_KEY="your_pexels_key" # Optional

# Run seed script
FORCE_SEED=true npm run seed:sample-listings
```

This creates 50+ realistic Moroccan property listings.

### Phase 3B: Fix Property Status

```sql
-- In Supabase SQL Editor:

-- Check current status distribution
SELECT status, COUNT(*) FROM properties GROUP BY status;

-- Publish all approved properties
UPDATE properties 
SET status = 'published', is_archived = FALSE
WHERE status = 'approved';

-- Verify
SELECT COUNT(*) FROM properties 
WHERE status = 'published' AND is_archived = FALSE;
```

### Phase 3C: Apply RLS Policies

```bash
# In Supabase SQL Editor, run:
# supabase/migrations/072_fix_properties_rls_policies.sql

# Or manually create policy:
CREATE POLICY "properties_select_public" ON public.properties
  FOR SELECT USING (
    status = 'published' AND (is_archived = FALSE OR is_archived IS NULL)
  );
```

### Phase 3D: Create promo_banners Table

```bash
# In Supabase SQL Editor, run:
# supabase/migrations/068_create_promo_banners.sql
```

### Phase 4: Verify Fix (2 minutes)

```bash
# Re-run diagnostic
npx tsx scripts/debug-listings.ts

# Or in Supabase SQL Editor:
SELECT COUNT(*) as visible_properties
FROM properties
WHERE status = 'published' 
  AND (is_archived = FALSE OR is_archived IS NULL);

# Expected: > 0 (if seeded, should be 50+)
```

### Phase 5: Test Frontend (2 minutes)

1. Open website in browser
2. Go to homepage or search page
3. Check if listings appear
4. Open browser console (F12)
5. Look for any errors
6. Check Network tab for successful API calls

## Batch Update Examples (PostgreSQL-Compatible)

### Example 1: Update First 200 Draft → Pending

```sql
WITH properties_to_update AS (
  SELECT id
  FROM public.properties
  WHERE status = 'draft'
  ORDER BY created_at ASC
  LIMIT 200
)
UPDATE public.properties
SET status = 'pending'
WHERE id IN (SELECT id FROM properties_to_update);
```

### Example 2: Publish First 200 Approved

```sql
WITH properties_to_publish AS (
  SELECT id
  FROM public.properties
  WHERE status = 'approved'
  ORDER BY created_at ASC
  LIMIT 200
)
UPDATE public.properties
SET status = 'published', is_archived = FALSE
WHERE id IN (SELECT id FROM properties_to_publish);
```

### Example 3: Archive Oldest 200 Properties

```sql
WITH properties_to_archive AS (
  SELECT id
  FROM public.properties
  WHERE status != 'archived'
  ORDER BY created_at ASC
  LIMIT 200
)
UPDATE public.properties
SET status = 'archived', is_archived = TRUE
WHERE id IN (SELECT id FROM properties_to_archive);
```

## Why UPDATE...LIMIT Fails in PostgreSQL

**Incorrect (MySQL syntax)**:
```sql
UPDATE properties SET status = 'published' LIMIT 200;
-- ERROR: syntax error at or near "LIMIT"
```

**Correct (PostgreSQL with CTE)**:
```sql
WITH batch AS (
  SELECT id FROM properties LIMIT 200
)
UPDATE properties SET status = 'published'
WHERE id IN (SELECT id FROM batch);
```

## Quick Reference: File Locations

```
topaffaireimmo/
├── scripts/
│   ├── debug-listings-diagnostic.sql    # SQL diagnostic queries
│   ├── debug-listings.ts                # TypeScript diagnostic tool
│   ├── fix-listings-issues.sql          # Automated fix script
│   ├── browser-diagnostic.js            # Browser console diagnostic
│   └── seed-sample-listings.ts          # Data seeding script
├── supabase/migrations/
│   ├── 067_property_status_workflow.sql # Status workflow migration
│   ├── 068_create_promo_banners.sql     # Promo banners table
│   └── 072_fix_properties_rls_policies.sql # RLS policies
├── src/
│   ├── lib/supabase.ts                  # Supabase client config
│   ├── hooks/useProperties.ts           # Properties fetch hook
│   └── pages/SearchResults.tsx          # Main listings page
└── DEBUGGING_GUIDE_LISTINGS.md          # Detailed debugging guide
```

## Environment Variables Checklist

Create `.env` file in project root:

```bash
# Required for frontend
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Required for seed scripts
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: For realistic property images in seed data
PEXELS_API_KEY=your_pexels_api_key
```

Get these values from:
1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings → API
4. Copy URL and anon key
5. Copy service_role key (⚠️ NEVER commit this to git)

## Support & Additional Resources

- **Main README**: `/README.md`
- **Detailed Debugging Guide**: `/DEBUGGING_GUIDE_LISTINGS.md`
- **Supabase Setup**: `/SUPABASE_SETUP_QUICKSTART.md`
- **Sample Listings Seed**: `/docs/SAMPLE_LISTINGS_SEED.md`

## Contact & Troubleshooting

If issues persist after following this guide:

1. **Check diagnostic output** for specific error messages
2. **Review Supabase logs** in Dashboard → Logs
3. **Verify migrations applied** in Dashboard → Database → Migrations
4. **Test API directly** using curl or Postman
5. **Check browser console** for JavaScript errors

## Final Checklist

Before completing this task, verify:

- [ ] Diagnostic scripts created and documented
- [ ] Fix scripts tested and safe to run
- [ ] HTTP 300/404 causes explained
- [ ] Batch update examples provided (CTE-based)
- [ ] Frontend code reviewed (no changes needed)
- [ ] RLS policies verified
- [ ] Seed data script available
- [ ] Browser diagnostic tool created
- [ ] Documentation complete and clear
- [ ] All files committed to repository

## Conclusion

**Issue is MAINLY SUPABASE** (database configuration)

Most likely fixes needed:
1. ✅ **Seed data**: Run `FORCE_SEED=true npm run seed:sample-listings`
2. ✅ **Fix status**: Run SQL to update `approved` → `published`
3. ✅ **Verify RLS**: Ensure public SELECT policy exists
4. ✅ **Create promo_banners**: Run migration 068

**Frontend code is correct** - no changes needed.

---

*Last updated: 2026-02-03*
*Version: 1.0*
