# Production Environment Verification Guide

**Quick Reference for Diagnosing "relation public.listings does not exist" Error**

---

## ✅ Step 1: Verify Vercel Environment Variables

### Location:
Vercel Dashboard → Your Project → Settings → Environment Variables

### Required Variables:

```bash
# Production Environment
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SITE_URL=https://www.topaffaireimmo.com
VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.com
```

### ⚠️ Common Mistakes:

❌ **Wrong Supabase Project ID**
- Symptom: Environment points to old/test Supabase project
- Fix: Get correct project ID from Supabase Dashboard → Settings → General

❌ **Mismatched Keys**
- Symptom: URL from Project A, Key from Project B
- Fix: Ensure both URL and Key are from the SAME project

❌ **Development Keys in Production**
- Symptom: Points to local/dev Supabase instance
- Fix: Use production Supabase project credentials

---

## ✅ Step 2: Verify Production Supabase Schema

### A. Login to Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your **PRODUCTION** project
3. Navigate to: **SQL Editor**

### B. Run Schema Verification Queries

```sql
-- ========================================
-- QUERY 1: Verify 'properties' table exists
-- ========================================
-- Expected: Should return 1 row
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'properties';

-- Expected Output:
-- table_name  | table_schema
-- ------------|-------------
-- properties  | public


-- ========================================
-- QUERY 2: Verify 'listings' table does NOT exist
-- ========================================
-- Expected: Should return 0 rows
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'listings';

-- Expected Output: (empty)
-- If this returns rows, you have the WRONG database!


-- ========================================
-- QUERY 3: Check properties table structure
-- ========================================
-- Expected: Should show all columns
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'properties'
ORDER BY ordinal_position;


-- ========================================
-- QUERY 4: Verify 'properties_full' view exists
-- ========================================
-- Expected: Should return 1 row
SELECT 
  table_name,
  table_type
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name = 'properties_full';

-- Expected Output:
-- table_name      | table_type
-- ----------------|------------
-- properties_full | VIEW


-- ========================================
-- QUERY 5: Check migration status
-- ========================================
-- Expected: Should show migrations up to 121
SELECT 
  version,
  name,
  executed_at
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 10;

-- Expected: Latest version should be 121 or higher
```

### C. Interpretation

| Query | Expected Result | If Failed |
|-------|----------------|-----------|
| Query 1 | Returns 1 row | **CRITICAL:** Wrong database! Properties table missing. |
| Query 2 | Returns 0 rows | **CRITICAL:** Wrong database! Old schema with listings table. |
| Query 3 | Returns 50+ columns | Schema mismatch - contact admin. |
| Query 4 | Returns 1 row | View missing - run migration 034. |
| Query 5 | Latest ≥ 121 | Database out of date - apply migrations. |

---

## ✅ Step 3: Verify Deployed Code

### A. Check Production Deployment

1. Go to: https://www.topaffaireimmo.com (or your production URL)
2. Open DevTools (F12)
3. Navigate to: **Sources** tab
4. Find JavaScript bundles (e.g., `index-abc123.js`)

### B. Search for Old Code

In DevTools Sources, search for:
```javascript
".from('listings')"
```

**Expected Result:** ❌ Zero matches found

**If matches found:** 
- Old code is deployed
- Clear cache and redeploy

### C. Check Bundle Timestamp

In **Network** tab:
1. Refresh page
2. Find `index.html`
3. Check response headers:
   - `Date:` should be recent (within last deploy time)
   - `Cache-Control:` should be `no-cache` for HTML
   - `ETag:` should change with each deployment

---

## ✅ Step 4: Clear All Caches

### A. Clear Vercel Cache

1. Vercel Dashboard → Deployments
2. Click **"..."** menu on latest deployment
3. Select **"Redeploy"**
4. ⚠️ **UNCHECK** "Use existing Build Cache"
5. Click **"Redeploy"**

### B. Invalidate CDN Cache

If using custom CDN:
```bash
# Cloudflare
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -d '{"purge_everything":true}'

# Fastly
curl -X POST "https://api.fastly.com/service/{service_id}/purge_all" \
  -H "Fastly-Key: {api_key}"
```

### C. Clear Browser Cache

**Chrome/Edge:**
1. Open DevTools (F12)
2. Right-click **Refresh** button
3. Select **"Empty Cache and Hard Reload"**

**Firefox:**
1. Press `Ctrl+Shift+Delete`
2. Select "Cached Web Content"
3. Click "Clear Now"

**Safari:**
1. Develop menu → Empty Caches
2. Or: `Cmd+Option+E`

---

## ✅ Step 5: Monitor Production Logs

### A. Vercel Logs

1. Vercel Dashboard → Your Project → **Logs**
2. Filter by:
   - Time: Last 1 hour
   - Type: Errors only
3. Search for: `"listings"`

### B. Supabase Logs

1. Supabase Dashboard → **Logs**
2. Select: **API Logs** or **Postgres Logs**
3. Filter:
   - Level: Error
   - Time: Last 1 hour
4. Search for: `"relation public.listings does not exist"`

### C. Identify Error Source

Look for:
```
ERROR: 42P01: relation "public.listings" does not exist
```

Check the context:
- **What query was executed?**
- **From which IP address?**
- **Which endpoint was called?**
- **Is it frontend or backend request?**

---

## ✅ Step 6: Test Database Connection

### Create Test Script

Save as `test-production-db.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

// Use PRODUCTION credentials
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co'
const SUPABASE_ANON_KEY = 'your_anon_key_here'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testConnection() {
  console.log('Testing connection to:', SUPABASE_URL)
  
  // Test 1: Check if properties table exists
  const { data: properties, error: propsError } = await supabase
    .from('properties')
    .select('id')
    .limit(1)
  
  if (propsError) {
    console.error('❌ Error querying properties:', propsError.message)
  } else {
    console.log('✅ Properties table accessible')
  }
  
  // Test 2: Check if properties_full view exists
  const { data: fullProps, error: viewError } = await supabase
    .from('properties_full')
    .select('id')
    .limit(1)
  
  if (viewError) {
    console.error('❌ Error querying properties_full:', viewError.message)
  } else {
    console.log('✅ properties_full view accessible')
  }
  
  // Test 3: Try querying listings (should fail)
  const { data: listings, error: listingsError } = await supabase
    .from('listings')
    .select('id')
    .limit(1)
  
  if (listingsError) {
    console.log('✅ listings table does NOT exist (as expected)')
    console.log('   Error:', listingsError.message)
  } else {
    console.error('❌ WARNING: listings table exists (should not!)')
  }
}

testConnection()
```

Run:
```bash
npx tsx test-production-db.ts
```

**Expected Output:**
```
Testing connection to: https://xxxxx.supabase.co
✅ Properties table accessible
✅ properties_full view accessible
✅ listings table does NOT exist (as expected)
   Error: relation "public.listings" does not exist
```

---

## 🔍 Troubleshooting Matrix

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| Error mentions "listings" but code is clean | Environment mismatch | Verify VITE_SUPABASE_URL points to correct project |
| Properties table not found in production DB | Wrong database | Double-check Supabase project in Vercel env vars |
| Listings table exists in production DB | Old schema/different project | Verify you're connected to the RIGHT production project |
| Error only on first load, then works | Cache issue | Clear browser cache and CDN cache |
| Error intermittent | Multiple Supabase projects | Check if preview/staging URLs use different env vars |
| Error from edge function | Function env vars separate | Update edge function secrets with correct Supabase URL |

---

## ⚠️ Critical Checklist

Before declaring "fixed", verify ALL of these:

- [ ] `VITE_SUPABASE_URL` in Vercel points to correct production project
- [ ] `VITE_SUPABASE_ANON_KEY` matches the project from VITE_SUPABASE_URL
- [ ] Production Supabase has `properties` table (NOT `listings`)
- [ ] Production Supabase has `properties_full` view
- [ ] Production Supabase migration version ≥ 121
- [ ] Deployed code contains NO references to `.from('listings')`
- [ ] Browser cache cleared (hard refresh)
- [ ] Vercel cache cleared (redeployed without cache)
- [ ] Production logs show NO "listings" errors after fixes
- [ ] Test script confirms properties table accessible

---

## 📞 Support Checklist

If issue persists after all checks, provide:

1. **Environment Variables** (redacted):
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ... (first 20 chars)
   ```

2. **Schema Verification Results:**
   - Screenshot of Query 1 result (properties table)
   - Screenshot of Query 2 result (listings table - should be empty)

3. **Error Context:**
   - Full error message from logs
   - Timestamp of error
   - URL/endpoint where error occurred

4. **Migration Status:**
   - Latest migration version in production
   - Missing migrations (if any)

5. **Cache Status:**
   - Last deployment timestamp
   - Cache cleared? (Yes/No)

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-16  
**Related:** PRODUCTION_LISTINGS_ERROR_DIAGNOSTIC.md
