# Property Listings Diagnostic Tools

This directory contains diagnostic and fix tools for troubleshooting property listing issues on TopAffaireImmo.

## Quick Start

### 🚀 Automated Quick Fix

Run this first to automatically fix common issues:

```bash
npm run fix:listings
```

This will:
- ✅ Check if database has properties
- ✅ Fix approved → published status
- ✅ Fix archived flag inconsistencies
- ✅ Verify public visibility
- ✅ Check promo_banners table

### 🔍 Run Diagnostics

If quick fix doesn't solve the issue, run full diagnostics:

```bash
npm run debug:listings
```

Or directly:

```bash
npx tsx scripts/debug-listings.ts
```

## Available Tools

### 1. Quick Fix (Recommended First Step)
**File**: `scripts/quick-fix-listings.ts`  
**Command**: `npm run fix:listings`

Automatically fixes the most common issues:
- Empty database detection
- Status fixes (approved → published)
- Archived flag synchronization
- Public visibility verification

**Requirements**:
- `VITE_SUPABASE_URL` or `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 2. Full Diagnostic
**File**: `scripts/debug-listings.ts`  
**Command**: `npm run debug:listings`

Comprehensive diagnostic that tests:
- Database connectivity
- Property counts and status distribution
- Anonymous user API access
- RLS policies (if service key provided)
- Promo banners table existence
- Public visibility

**Requirements**:
- `VITE_SUPABASE_URL` or `SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (for public API tests)
- `SUPABASE_SERVICE_ROLE_KEY` (optional, for full diagnostics)

### 3. SQL Diagnostic Script
**File**: `scripts/debug-listings-diagnostic.sql`

Run in Supabase Dashboard → SQL Editor:
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Paste contents of file
4. Run

Provides:
- 17 diagnostic queries
- Properties count and distribution
- RLS policies inspection
- Promo banners verification
- Index checks

### 4. Browser Diagnostic
**File**: `scripts/browser-diagnostic.js`

Run directly in browser console:
1. Open website
2. Press F12 (Developer Tools)
3. Go to Console tab
4. Paste entire file contents
5. Press Enter

Tests:
- Live API responses
- Network status codes
- Real-time errors
- Published properties visibility

### 5. SQL Fix Script
**File**: `scripts/fix-listings-issues.sql`

Run in Supabase Dashboard → SQL Editor

Automatically:
- Creates promo_banners table if missing
- Fixes status/archived inconsistencies
- Verifies RLS policies
- Creates missing policies
- Shows verification results

**Safe to run multiple times** (idempotent)

## Typical Workflow

### Scenario 1: Listings Not Showing (Unknown Cause)

```bash
# Step 1: Try quick fix
npm run fix:listings

# Step 2: Verify in browser
# Open website and check if listings appear

# Step 3: If still not showing, run diagnostics
npm run debug:listings

# Step 4: Based on output, apply specific fix
```

### Scenario 2: Empty Database

```bash
# Seed sample data
FORCE_SEED=true npm run seed:sample-listings

# This creates 50+ realistic Moroccan properties
```

### Scenario 3: Wrong Status (Properties Exist but Not Visible)

Option A - Quick Fix:
```bash
npm run fix:listings
```

Option B - Manual SQL:
```sql
-- In Supabase SQL Editor
UPDATE properties 
SET status = 'published', is_archived = FALSE
WHERE status = 'approved';
```

### Scenario 4: RLS Policies Missing

Run in Supabase SQL Editor:
```bash
# Apply migration
# Paste contents of: supabase/migrations/072_fix_properties_rls_policies.sql
```

### Scenario 5: Promo Banners 404

Run in Supabase SQL Editor:
```bash
# Apply migration
# Paste contents of: supabase/migrations/068_create_promo_banners.sql
```

Or use fix script:
```bash
# Paste contents of: scripts/fix-listings-issues.sql
```

## Environment Variables Required

Create `.env` file with:

```bash
# Required for all tools
VITE_SUPABASE_URL=https://xxxxx.supabase.co

# Required for full diagnostics and quick fix
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Required for public API testing
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: For seeding realistic images
PEXELS_API_KEY=your_pexels_api_key
```

Get these from:
1. Supabase Dashboard → Settings → API
2. Copy Project URL
3. Copy anon key
4. Copy service_role key (⚠️ NEVER commit to git)

## NPM Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run fix:listings` | Quick automated fix for common issues |
| `npm run debug:listings` | Full diagnostic with detailed output |
| `npm run seed:sample-listings` | Seed 50+ sample properties (requires `FORCE_SEED=true`) |

## Troubleshooting

### Error: "Missing environment variables"

**Solution**: Create `.env` file with required variables (see above)

### Error: "Cannot access properties table"

**Possible causes**:
1. Wrong Supabase URL
2. Wrong service key
3. Table doesn't exist (unlikely)

**Solution**: 
1. Verify credentials in Supabase Dashboard
2. Check URL and keys in `.env`
3. Ensure you're using the correct project

### Quick fix says "0 properties visible"

**Possible causes**:
1. All properties have wrong status
2. All properties are archived
3. RLS policies too restrictive

**Solution**:
1. Run full diagnostic: `npm run debug:listings`
2. Check status distribution in output
3. Apply manual SQL fixes if needed
4. Verify RLS policies in Supabase

### Promo banners table missing

**Solution**:
```bash
# In Supabase SQL Editor, run:
# supabase/migrations/068_create_promo_banners.sql
```

## Documentation Reference

- **Executive Summary**: `/DIAGNOSTIC_SUMMARY.md` - Quick overview and action plan
- **Detailed Guide**: `/DEBUGGING_GUIDE_LISTINGS.md` - Comprehensive debugging guide
- **Main README**: `/README.md` - Project setup and overview

## Common SQL Queries

### Check properties count
```sql
SELECT COUNT(*) FROM properties;
```

### Check status distribution
```sql
SELECT status, COUNT(*) 
FROM properties 
GROUP BY status;
```

### Check publicly visible count
```sql
SELECT COUNT(*) 
FROM properties 
WHERE status = 'published' 
  AND (is_archived = FALSE OR is_archived IS NULL);
```

### Publish approved properties
```sql
UPDATE properties 
SET status = 'published', is_archived = FALSE
WHERE status = 'approved';
```

### Check RLS policies
```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'properties';
```

## Support

If issues persist:
1. Review diagnostic output carefully
2. Check Supabase Dashboard → Logs
3. Verify migrations applied
4. Test API directly with curl
5. Check browser console for errors

## Files Overview

```
scripts/
├── debug-listings-diagnostic.sql   # SQL diagnostic queries (17 tests)
├── debug-listings.ts               # TypeScript diagnostic tool
├── quick-fix-listings.ts          # Automated quick fix (NEW!)
├── fix-listings-issues.sql        # SQL fix script
├── browser-diagnostic.js          # Browser console diagnostic
└── seed-sample-listings.ts        # Sample data seeding
```

---

**Last updated**: 2026-02-03  
**Version**: 1.0
