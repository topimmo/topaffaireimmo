# Property Listings Debugging Guide

## Problem Statement

Property listings ("annonces") are not showing on TopAffaireImmo website that uses Supabase (Postgres + PostgREST).

### Symptoms

1. **HTTP 300 responses**: `GET /rest/v1/properties` returning HTTP 300 (Multiple Choices)
2. **HTTP 404 responses**: `GET /rest/v1/promo_banners` returning 404 (Not Found)
3. **Empty database**: `SELECT COUNT(*) FROM properties` returns 0
4. **SQL syntax errors**: UPDATE queries with LIMIT clause failing

## Root Cause Analysis

### Issue 1: HTTP 300 - Multiple Representations

**What causes PostgREST/Supabase to return HTTP 300?**

PostgREST returns HTTP 300 (Multiple Choices) when:
- The request is ambiguous and could return multiple different representations
- Multiple views or schemas expose the same table name
- The `Accept` header specifies multiple content types with equal preference
- The API cannot determine which representation to return

**Common causes in Supabase:**
1. **Multiple schemas**: The same table exists in multiple schemas (e.g., `public.properties` and `api.properties`)
2. **Ambiguous column selection**: Using `select=*` with embedded resources that have naming conflicts
3. **Missing Accept header**: Not specifying `Accept: application/json` explicitly
4. **Missing Prefer header**: For singular resources without `Prefer: return=representation`

**How to reproduce with curl:**

```bash
# Basic request (may return 300 if ambiguous)
curl -X GET "https://your-project.supabase.co/rest/v1/properties" \
  -H "apikey: YOUR_ANON_KEY"

# Proper request with headers
curl -X GET "https://your-project.supabase.co/rest/v1/properties" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json"

# Request with filters
curl -X GET "https://your-project.supabase.co/rest/v1/properties?status=eq.published&is_archived=is.false" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Accept: application/json"
```

**Fix in code:**

The `@supabase/supabase-js` library automatically sets proper headers. If using raw fetch:

```typescript
// Incorrect (may cause 300)
fetch(`${supabaseUrl}/rest/v1/properties`)

// Correct
fetch(`${supabaseUrl}/rest/v1/properties`, {
  headers: {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
})
```

### Issue 2: HTTP 404 - promo_banners Not Found

**Root cause**: The `promo_banners` table may not exist in the database.

**Why it happens:**
- Migration `068_create_promo_banners.sql` not applied to production database
- Table was created locally but not deployed to Supabase project
- Wrong schema or database selected

**Verification:**

```sql
-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'promo_banners';
```

**Fix:**

Run the migration in `/supabase/migrations/068_create_promo_banners.sql` on your Supabase project:

1. Via Supabase Dashboard: SQL Editor → Run migration file
2. Via CLI: `supabase db push` (if using local development)
3. Via script: Apply the SQL directly to production database

### Issue 3: Empty Properties Table

**Root cause**: No data seeded into the database.

**Why it happens:**
- Fresh database without initial data
- Seed scripts not run after deployment
- Data deleted or cleared during testing

**Verification:**

```sql
SELECT COUNT(*) as total FROM public.properties;
SELECT status, COUNT(*) FROM public.properties GROUP BY status;
```

**Fix:**

Option A: Use the seed script:
```bash
FORCE_SEED=true npm run seed:sample-listings
```

Option B: Manually insert a test property:
```sql
INSERT INTO public.properties (
  title_fr,
  title_ar,
  description_fr,
  transaction_type,
  property_type,
  price,
  area,
  bedrooms,
  bathrooms,
  city_id,
  status,
  is_archived,
  owner_id
) VALUES (
  'Appartement moderne à Casablanca',
  'شقة عصرية في الدار البيضاء',
  'Bel appartement 3 chambres avec terrasse',
  'sale',
  'apartment',
  1500000,
  120,
  3,
  2,
  (SELECT id FROM cities WHERE name_fr = 'Casablanca' LIMIT 1),
  'published',
  FALSE,
  auth.uid() -- or specific user UUID
);
```

### Issue 4: RLS Policies Too Restrictive

**Root cause**: Row Level Security (RLS) policies prevent anonymous users from viewing properties.

**Why it happens:**
- Missing `properties_select_public` policy
- Policy conditions too strict (e.g., requires authentication)
- Status/archived filters excluding all rows

**Verification:**

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'properties';

-- Check policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'properties';
```

**Fix:**

Ensure this policy exists (from migration 072):

```sql
CREATE POLICY "properties_select_public" ON public.properties
  FOR SELECT USING (
    status = 'published' AND (is_archived = FALSE OR is_archived IS NULL)
  );
```

### Issue 5: Status/Archived Inconsistencies

**Root cause**: Properties have `status='approved'` instead of `'published'`, or `is_archived=TRUE`.

**Why it happens:**
- Old workflow used `'approved'` status before migration to `'published'`
- Properties were approved but not published
- Archived flag set incorrectly

**Verification:**

```sql
SELECT status, is_archived, COUNT(*) 
FROM public.properties 
GROUP BY status, is_archived;
```

**Fix:**

```sql
-- Publish approved properties
UPDATE public.properties 
SET status = 'published', is_archived = FALSE
WHERE status = 'approved';

-- Fix archived flag inconsistencies
UPDATE public.properties 
SET is_archived = FALSE
WHERE status IN ('draft', 'pending', 'published', 'rejected') 
  AND is_archived = TRUE;
```

### Issue 6: UPDATE...LIMIT Not Supported

**Root cause**: PostgreSQL doesn't support `LIMIT` in UPDATE statements.

**Why it happens:**
- Trying to use MySQL/MariaDB syntax in Postgres
- Batch updating without CTE

**Incorrect:**

```sql
-- This fails in PostgreSQL
UPDATE properties 
SET status = 'published' 
WHERE status = 'approved' 
LIMIT 200;
```

**Correct (using CTE):**

```sql
-- PostgreSQL-compatible batch update
WITH properties_to_update AS (
  SELECT id
  FROM public.properties
  WHERE status = 'approved'
  ORDER BY created_at ASC
  LIMIT 200
)
UPDATE public.properties
SET status = 'published', is_archived = FALSE
WHERE id IN (SELECT id FROM properties_to_update);
```

## Frontend Code Review

### useProperties Hook (/src/hooks/useProperties.ts)

**Default filtering (lines 97-100):**

```typescript
// Only published properties for public viewing
if (!filters?.owner_id && !filters?.status) {
  query = query.eq('status', 'published')
    .or('is_archived.is.null,is_archived.eq.false');
}
```

**Issue**: The filter `or('is_archived.is.null,is_archived.eq.false')` is APPENDED to the query, not combined with status filter.

**Correct approach:**

```typescript
// Combine filters properly
if (!filters?.owner_id && !filters?.status) {
  query = query
    .eq('status', 'published')
    .or('is_archived.is.null,is_archived.eq.false');
}
```

Actually, the current code is correct. PostgREST interprets this as:
```
status='published' AND (is_archived IS NULL OR is_archived=false)
```

### Supabase Client Configuration (/src/lib/supabase.ts)

The configuration looks correct:
- ✅ Uses `localStorage` for session persistence
- ✅ Enables PKCE flow
- ✅ Auto-refreshes tokens
- ✅ Proper fallback for missing env vars

## Diagnosis Checklist

Use this checklist to systematically debug the issue:

- [ ] **A) Database has data**
  - [ ] Run: `SELECT COUNT(*) FROM public.properties;`
  - [ ] Verify count > 0
  - [ ] If 0, run seed script: `FORCE_SEED=true npm run seed:sample-listings`

- [ ] **B) Properties have correct status**
  - [ ] Run: `SELECT status, COUNT(*) FROM public.properties GROUP BY status;`
  - [ ] Verify properties with `status='published'` exist
  - [ ] If all are `'approved'`, run: `UPDATE properties SET status='published' WHERE status='approved';`

- [ ] **C) Properties are not archived**
  - [ ] Run: `SELECT is_archived, COUNT(*) FROM public.properties GROUP BY is_archived;`
  - [ ] Verify properties with `is_archived=FALSE` exist
  - [ ] If all TRUE, run: `UPDATE properties SET is_archived=FALSE WHERE status='published';`

- [ ] **D) RLS policies allow public access**
  - [ ] Run: `SELECT * FROM pg_policies WHERE tablename='properties';`
  - [ ] Verify `properties_select_public` policy exists
  - [ ] If missing, run migration `072_fix_properties_rls_policies.sql`

- [ ] **E) promo_banners table exists**
  - [ ] Run: `SELECT * FROM information_schema.tables WHERE table_name='promo_banners';`
  - [ ] If missing, run migration `068_create_promo_banners.sql`

- [ ] **F) Supabase env vars configured**
  - [ ] Check `.env` has `VITE_SUPABASE_URL`
  - [ ] Check `.env` has `VITE_SUPABASE_ANON_KEY`
  - [ ] Restart dev server after adding vars

- [ ] **G) API requests work**
  - [ ] Test with: `npx tsx scripts/debug-listings.ts`
  - [ ] Or test with curl (see examples above)
  - [ ] Check for HTTP 200, not 300/404

## Conclusion

**Primary Issue**: Likely **SUPABASE DATABASE CONFIGURATION**

Most common causes (in order of likelihood):
1. ✅ **Empty database** → Need to run seed script
2. ✅ **Wrong status** → Properties are `'approved'` not `'published'`
3. ✅ **RLS policies missing** → Need to run migration 072
4. ✅ **promo_banners missing** → Need to run migration 068
5. ⚠️  **HTTP 300** → Less likely with supabase-js client (handles headers)

**Secondary Issue**: Frontend code looks correct, no changes needed.

## Quick Fix Commands

```bash
# 1. Run diagnostics
npx tsx scripts/debug-listings.ts

# 2. Seed sample data (if empty)
FORCE_SEED=true npm run seed:sample-listings

# 3. Apply fixes via SQL (if data exists but wrong status)
# Connect to Supabase and run: scripts/fix-listings-issues.sql
```

## Batch Update Examples (PostgreSQL-Compatible)

```sql
-- Update first 200 draft properties to pending
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

-- Publish first 200 approved properties
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

-- Archive first 200 oldest properties
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

## Additional Resources

- PostgREST Documentation: https://postgrest.org/
- Supabase RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
- PostgreSQL UPDATE with CTE: https://www.postgresql.org/docs/current/queries-with.html
