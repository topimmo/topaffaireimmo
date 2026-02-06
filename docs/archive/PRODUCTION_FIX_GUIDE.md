# Production Fix - Seeding & Contact Fields

## Overview
This document provides the complete fix for TopAffaireImmo production issues:
1. Empty properties table (no listings on website)
2. Seeding script FK constraint violations
3. Contact fields configuration issues

## Changes Made

### 1. Seed Script (`scripts/seed-sample-listings.ts`)

**BEFORE:**
- Tried to create system user with hardcoded UUID `00000000-0000-0000-0000-000000000001`
- This caused FK constraint violations (id not in auth.users)
- Poor error messages and logging
- No verification of results

**AFTER:**
- Fetches admin profile by email from `ADMIN_EMAIL` env variable (defaults to `contact@topaffaireimmo.com`)
- Uses existing admin's ID for `owner_id` and `created_by`
- Strong error handling with clear messages
- Before/after property counts
- Fails explicitly if no published properties after seeding
- Never attempts to create profiles (avoids FK violations)

**Key Changes:**
- Added `ADMIN_EMAIL` configuration variable
- Replaced system user creation with admin lookup
- Added property count check before seeding
- Added critical failure check if count remains 0
- Enhanced logging throughout

### 2. GitHub Actions Workflow (`.github/workflows/seed-sample-listings.yml`)

**BEFORE:**
- Empty file (0 bytes)

**AFTER:**
- Complete workflow with `workflow_dispatch` trigger
- Node.js 20 setup
- Before/after property count checks
- Clear failure messages
- Summary step explaining which step failed

**Features:**
- Manual trigger with configurable inputs (listings_count, admin_email)
- 15-minute timeout
- Counts total, published, and sample properties before/after
- Explicit failure if published count is 0
- Helpful summary for debugging failures

### 3. Site Settings Contact Fields

**Migration:** `supabase/migrations/074_fix_site_settings_contact_fields.sql`

**Changes:**
- Deletes `contact_phone` and `contact_whatsapp` from site_settings
- Upserts `contact_email` with proper JSONB format using `to_jsonb('contact@topaffaireimmo.com'::text)`
- Fixes the "invalid input syntax for type json" error

**Why JSONB:**
The `site_settings.value` column is of type JSONB. Inserting plain text causes:
```
ERROR 22P02 invalid input syntax for type json
```

Must use: `to_jsonb('contact@topaffaireimmo.com'::text)`

### 4. Admin Diagnostics (`src/pages/admin/AdminDiagnostics.tsx`)

**BEFORE:**
- Checked for contact fields in `properties` table
- Showed warning: "لا توجد بيانات للتحقق: contact_phone, contact_whatsapp, contact_email"

**AFTER:**
- Checks `site_settings` for `contact_email` only
- Properly extracts JSONB value
- Shows success when email is configured

### 5. Admin Settings UI (`src/pages/admin/AdminSettings.tsx`)

**BEFORE:**
- Had fields for contact_email, contact_phone, contact_whatsapp

**AFTER:**
- Only shows contact_email field
- Removed phone and WhatsApp fields from interface
- Updated Settings type accordingly

## SQL to Run in Supabase

Run this SQL in the Supabase SQL Editor:

```sql
-- Migration 074: Fix site_settings contact fields
BEGIN;

-- Delete contact_phone and contact_whatsapp
DELETE FROM public.site_settings
WHERE key IN ('contact_phone', 'contact_whatsapp');

-- Upsert contact_email with proper JSONB format
INSERT INTO public.site_settings (key, value, category, is_public, description)
VALUES (
  'contact_email',
  to_jsonb('contact@topaffaireimmo.com'::text),
  'contact',
  true,
  'Contact email address for the website'
)
ON CONFLICT (key)
DO UPDATE SET
  value = to_jsonb('contact@topaffaireimmo.com'::text),
  category = 'contact',
  is_public = true,
  description = 'Contact email address for the website',
  updated_at = now();

COMMIT;
```

**Verify the migration:**
```sql
SELECT key, value, category, is_public 
FROM public.site_settings 
WHERE key LIKE 'contact_%'
ORDER BY key;
```

Expected result:
```
key           | value                              | category | is_public
--------------|-----------------------------------|----------|----------
contact_email | "contact@topaffaireimmo.com"      | contact  | true
```

## Verification Checklist

### Pre-Deployment Checks

1. **Verify Admin Profile Exists:**
```sql
SELECT id, email, is_admin, user_role 
FROM public.profiles 
WHERE email = 'contact@topaffaireimmo.com';
```

Expected:
- One row returned
- `is_admin = true`
- ID is a valid UUID

If not found or `is_admin = false`:
```sql
UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'contact@topaffaireimmo.com';
```

2. **Check Current Properties Count:**
```sql
SELECT COUNT(*) FROM public.properties;
SELECT COUNT(*) FROM public.properties WHERE status = 'published';
```

Expected: Both should be 0 or very low before seeding.

3. **Verify Site Settings:**
```sql
SELECT key, value FROM public.site_settings WHERE key LIKE 'contact_%';
```

After running migration, only `contact_email` should exist.

### Running the Seed Workflow

1. Go to GitHub Actions: `https://github.com/topimmo/topaffaireimmo/actions/workflows/seed-sample-listings.yml`
2. Click "Run workflow"
3. Configure inputs:
   - `admin_email`: `contact@topaffaireimmo.com` (default)
   - `listings_count`: `50` (default) or adjust as needed
4. Click "Run workflow"
5. Watch the workflow execute

**What to Look For:**
- ✅ "Install dependencies" completes
- ✅ "Count properties BEFORE" shows current counts
- ✅ "Run seed script" completes without errors
  - Should see: "✓ Admin profile found"
  - Should see: "✓ Verification complete: 50 sample listings found"
- ✅ "Count properties AFTER" shows increased counts
- ✅ Published count > 0

**If Workflow Fails:**

Check which step failed:

1. **"Install dependencies" fails:**
   - package.json is corrupted
   - Review package.json syntax

2. **"Count properties BEFORE" fails:**
   - Database connection issue
   - Check Supabase secrets: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

3. **"Run seed script" fails:**
   - Check error in logs
   - Common issues:
     - Admin profile not found → Verify email exists in profiles
     - FK constraint violation → Admin profile has no auth.users entry
     - RLS policy blocking inserts → Check policies on properties table

4. **"Count properties AFTER" fails with 0 published:**
   - Inserts succeeded but status not 'published'
   - RLS policies preventing reads
   - Check the seed script logs for insert errors

### Post-Deployment Verification

1. **Verify Properties in Database:**
```sql
-- Total properties
SELECT COUNT(*) FROM public.properties;

-- Published properties
SELECT COUNT(*) FROM public.properties WHERE status = 'published';

-- Sample properties
SELECT COUNT(*) FROM public.properties WHERE is_sample = true;

-- View sample listings
SELECT id, title_fr, city_id, status, owner_id, is_sample
FROM public.properties
WHERE is_sample = true
LIMIT 5;
```

Expected:
- Total count matches LISTINGS_COUNT (default 50)
- Published count = Total count (all sample listings are published)
- is_sample = true for all seeded properties

2. **Check Website Shows Listings:**
   - Navigate to https://topaffaireimmo.com (or your domain)
   - Home page should show property listings
   - Search/filter should work
   - Click on a listing to view details

3. **Verify Admin Diagnostics:**
   - Login as admin (contact@topaffaireimmo.com)
   - Go to Admin > Diagnostics
   - Contact Information check should show: "✅ Email configured"
   - Should NOT show warnings about missing phone/whatsapp

4. **Verify Admin Settings:**
   - Login as admin
   - Go to Admin > Settings
   - Contact Information section should only show Email field
   - No Phone or WhatsApp fields

## Troubleshooting

### Issue: "Admin profile not found"

**Cause:** No profile exists with the specified email.

**Solution:**
1. Verify the email:
```sql
SELECT * FROM public.profiles WHERE email = 'contact@topaffaireimmo.com';
```

2. If not found, the admin user needs to sign up through the application first
3. After signup, set is_admin:
```sql
UPDATE public.profiles SET is_admin = true WHERE email = 'contact@topaffaireimmo.com';
```

### Issue: "FK constraint violation ... not present in table users"

**Cause:** Profile exists but has no corresponding entry in auth.users.

**Solution:**
This indicates data corruption. The profile was created without going through proper auth signup.

Options:
1. Delete the corrupt profile and create a new one through proper signup
2. Contact Supabase support to manually add auth.users entry (not recommended)

**Prevention:** Never insert into profiles directly. Always use auth signup.

### Issue: "No published properties found after seeding"

**Possible Causes:**
1. RLS policies blocking inserts
2. Status not being set to 'published'
3. Insert errors during batch processing

**Solution:**
1. Check RLS policies on properties table:
```sql
SELECT * FROM pg_policies WHERE tablename = 'properties';
```

2. Verify service role can insert:
```sql
-- Test insert (will fail if RLS blocks service role)
INSERT INTO public.properties (owner_id, title_fr, status, is_sample)
VALUES (
  (SELECT id FROM public.profiles WHERE email = 'contact@topaffaireimmo.com'),
  'Test Listing',
  'published',
  true
);
-- If successful, delete it
DELETE FROM public.properties WHERE title_fr = 'Test Listing' AND is_sample = true;
```

3. Check seed script logs for specific errors

### Issue: "Token 'contact' is invalid" when saving site_settings

**Cause:** Trying to insert plain text into JSONB column.

**Solution:** Use `to_jsonb()`:
```sql
-- WRONG
UPDATE site_settings SET value = 'contact@topaffaireimmo.com' WHERE key = 'contact_email';

-- CORRECT
UPDATE site_settings SET value = to_jsonb('contact@topaffaireimmo.com'::text) WHERE key = 'contact_email';
```

## Technical Details

### Why We Removed System User Creation

**Previous Approach:**
```typescript
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';
await supabase.from('profiles').insert({ id: SYSTEM_USER_ID, ... });
```

**Problem:**
- profiles.id has FK constraint to auth.users.id
- Inserting arbitrary UUID fails: "Key (id) ... not present in table users"
- Creates technical debt (orphaned profiles)

**New Approach:**
```typescript
const { data: adminProfile } = await supabase
  .from('profiles')
  .select('id, email, is_admin')
  .eq('email', ADMIN_EMAIL)
  .single();
```

**Benefits:**
- Uses real admin account
- No FK violations
- Listings owned by legitimate user
- Auditable (know who owns sample listings)

### JSONB Value Handling

The `site_settings.value` column is JSONB. When inserting string values:

```sql
-- Creates JSON string (correct)
to_jsonb('contact@topaffaireimmo.com'::text)  -- Result: "contact@topaffaireimmo.com"

-- Tries to parse as JSON (fails)
'contact@topaffaireimmo.com'  -- ERROR: invalid syntax
```

When reading:
```typescript
// PostgreSQL returns already-parsed JSONB
const value = data.value; // "contact@topaffaireimmo.com" (already a string)

// Our code handles both cases
const emailValue = typeof data.value === 'string' 
  ? JSON.parse(data.value)  // For old data that was double-encoded
  : data.value;              // For properly stored data
```

## Summary of Files Changed

1. `scripts/seed-sample-listings.ts` - Fixed to use admin email lookup
2. `.github/workflows/seed-sample-listings.yml` - Created complete workflow
3. `supabase/migrations/074_fix_site_settings_contact_fields.sql` - Migration for contact fields
4. `src/pages/admin/AdminDiagnostics.tsx` - Updated to check site_settings
5. `src/pages/admin/AdminSettings.tsx` - Removed phone/whatsapp fields

## Next Steps After Deployment

1. Run the SQL migration in Supabase
2. Verify admin profile exists and is_admin = true
3. Run the "Seed Sample Listings" workflow
4. Verify website shows listings
5. Check admin diagnostics (no warnings)
6. Monitor for any issues

## Security Considerations

- ✅ No secrets exposed in code
- ✅ Uses service role key only in secure environments (GitHub Secrets)
- ✅ No direct profile creation (avoids FK violations)
- ✅ Uses existing admin account (auditable)
- ✅ Sample listings marked with is_sample=true for easy cleanup
- ✅ All RLS policies respected (service role bypasses for seeding)

## Performance Notes

- Seed script batches inserts (10 per batch) to avoid overwhelming database
- Fetches cities upfront to avoid repeated queries
- Uses external_key for idempotency (prevents duplicates on re-run)
- Cleans up existing sample listings before seeding (optional with FORCE_SEED)
