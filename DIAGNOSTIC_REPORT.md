# Supabase Diagnostic Report

**Generated:** 2026-02-15  
**Project:** TopAffaireImmo  
**Repository:** topimmo/topaffaireimmo

---

## Executive Summary

This report diagnoses issues with the Supabase project setup after recreating the Supabase instance. The primary issues identified are:

1. **Schema Mismatch**: `site_settings` table column inconsistency (`description` vs `description_fr`/`description_ar`)
2. **Migration Conflicts**: Potential gaps and duplicates in migration sequence
3. **Auth Permissions**: Ensuring no improper modifications to `auth.users` table
4. **Fresh Project Setup**: Remote Supabase instance may not have any migrations applied yet

---

## A) Local Migrations Inventory

### Overview

- **Total Migration Files**: 113 SQL files
- **First Migration**: `001_initial_schema.sql`
- **Last Migration**: `114_complete_backend_features.sql`
- **Version Range**: 001 to 114

### Migration Sequence

The migrations are numbered from 001 to 114, with some expected gaps due to consolidation and deprecated migrations.

#### All Migration Files (Sorted by Version)

```
001_initial_schema.sql
002_banner_advertising.sql
003_profile_trigger.sql
004_agency_fields.sql
005_advertiser_type.sql
010_full_rebuild.sql
011_storage_buckets.sql
020_full_rebuild.sql
021_storage_buckets.sql
022_sample_properties.sql (EMPTY - deprecated)
023_sample_properties.sql (EMPTY - deprecated)
024_sample_properties.sql (EMPTY - deprecated)
024_sample_properties_data.sql (deprecated)
025_update_user_trigger.sql
026_fix_cities_and_rls.sql
027_fix_rls_policies.sql
028_southern_cities_and_fixes.sql
029_admin_user_setup.sql
030_fix_roles_and_listings.sql
031_fix_policies_final.sql
032_final_cleanup.sql (EMPTY - cleanup completed)
033_advertising_inquiries.sql
033_final_fixes.sql
033_fix_profile_trigger_rls.sql
034_fix_schema_mismatches.sql
035_fix_signup_rls_policy.sql
036_facebook_posting_fields.sql
037_facebook_webhook_trigger.sql
038_fix_profile_creation_comprehensive.sql
039_fix_storage_and_property_policies.sql
040_comprehensive_profile_fix.sql
041_supabase_compatible_profile_fix.sql
042_fix_advertiser_type_default.sql
042_production_fixes_comprehensive.sql
043_fix_image_upload_permissions.sql
043_security_fix_definer_functions.sql
044_fix_announcer_type_and_user_role.sql
045_add_admin_whitelist_and_fix_signup.sql
046_fix_announcer_type_column.sql
047_fix_profile_trigger_not_null_defensive.sql
048_remove_profile_trigger_logic.sql
049_remove_profile_dependency_from_rls.sql
050_create_admins_table_and_rls.sql
051_create_admin_user_helper.sql
052_fix_storage_security.sql
053_create_admin_audit_logs.sql
054_create_admin_notifications.sql
055_create_site_pages_cms.sql
056_create_site_categories_cms.sql
057_fix_advertising_inquiries_admin_check.sql
058_fix_storage_policies_admin_check.sql
059_rename_announcer_to_advertiser_type.sql
060_add_advertiser_type_to_advertising_inquiries.sql
061_verify_and_enforce_fk_fix.sql
062_fix_duplicate_fk_admins.sql
063_add_role_to_admins.sql
064_add_rejected_fields.sql
065_verify_storage_buckets.sql
066_add_admins_update_policy.sql
067_property_status_workflow.sql
068_create_promo_banners.sql
069_fix_approved_listings_to_published.sql
070_update_facebook_webhook_trigger.sql
071_add_created_by_to_properties.sql
072_fix_properties_rls_policies.sql
073_add_sample_listing_fields.sql
074_fix_site_settings_contact_fields.sql
075_add_featured_properties_management.sql
076_create_push_subscriptions_table.sql
077_add_neighborhood_slug.sql
078_create_lead_tracking_tables.sql
079_rollback.sql
079_security_performance_remediation.sql
079_validation_queries.sql
080_add_contact_visibility.sql
081_restrict_properties_public_access.sql
082_verify_contact_privacy_setup.sql
083_consolidate_properties_rls_policies.sql
084_seed_seo_guides.sql
085_seed_seo_guides_part2.sql
086_otp_attempts_table.sql
087_add_google_oauth_support.sql
088_create_service_categories.sql
089_create_monetization_tables.sql
089_home_services_zones_categories.sql
090_create_monetization_rpc_functions.sql
091_fix_artisan_location_model.sql
092_validate_and_fix.sql
093_create_artisan_profile_neighborhoods_join_table.sql
093_migrate_to_artisan_profile_neighborhoods_join_table.sql
094_create_requests_table.sql
095_create_request_status_history.sql
096_create_reviews_table.sql
097_create_media_table.sql
098_comprehensive_security_hardening.sql
099_security_test_suite.sql
100_create_service_subcategories_and_artisan_services.sql
101_enhance_service_requests.sql
102_create_service_management_rpc_functions.sql
103_validate_services_module.sql
104_unify_account_logic.sql
105_public_phone_reveal_system.sql
106_add_artisan_avatar_support.sql
107_enhance_multi_service_support.sql
108_fix_property_images_security.sql
109_performance_hardening_indexes.sql
109_performance_verification_tests.sql
110_optimize_admin_rls.sql
111_complete_admin_rls_optimization.sql
112_add_missing_performance_indexes.sql
112_verify_performance_indexes.sql
113_create_monitoring_system.sql
114_complete_backend_features.sql
```

### Duplicate Versions

The following version numbers have multiple files:

- **Version 033**: 3 files
  - `033_advertising_inquiries.sql`
  - `033_final_fixes.sql`
  - `033_fix_profile_trigger_rls.sql`

- **Version 042**: 2 files
  - `042_fix_advertiser_type_default.sql`
  - `042_production_fixes_comprehensive.sql`

- **Version 043**: 2 files
  - `043_fix_image_upload_permissions.sql`
  - `043_security_fix_definer_functions.sql`

- **Version 079**: 3 files
  - `079_rollback.sql`
  - `079_security_performance_remediation.sql`
  - `079_validation_queries.sql`

- **Version 089**: 2 files
  - `089_create_monetization_tables.sql`
  - `089_home_services_zones_categories.sql`

- **Version 093**: 2 files
  - `093_create_artisan_profile_neighborhoods_join_table.sql`
  - `093_migrate_to_artisan_profile_neighborhoods_join_table.sql`

- **Version 109**: 2 files
  - `109_performance_hardening_indexes.sql`
  - `109_performance_verification_tests.sql`

- **Version 112**: 2 files
  - `112_add_missing_performance_indexes.sql`
  - `112_verify_performance_indexes.sql`

**Note**: Duplicate versions are generally safe if migrations are idempotent and handle existing objects. However, Supabase CLI may have issues with duplicate version numbers.

### Version Gaps

Expected gaps in the sequence (6-9, 12-19):

```
Missing: 006, 007, 008, 009, 012, 013, 014, 015, 016, 017, 018, 019
```

**Note**: These gaps are normal and expected, likely from migration consolidation (e.g., migrations 001-009 were consolidated into 010_full_rebuild.sql).

### Empty/Deprecated Migrations

The following migrations are empty or contain only comments:

- `022_sample_properties.sql` - Empty (data moved to seed)
- `023_sample_properties.sql` - Empty (data moved to seed)
- `024_sample_properties.sql` - Empty (data moved to seed)
- `032_final_cleanup.sql` - Empty (cleanup completed)

These are kept for sequence continuity and should **NOT** be deleted.

---

## B) Remote Migration History

### SQL Query to Check Remote State

Run this in **Supabase Dashboard → SQL Editor**:

```sql
-- List all applied migrations
SELECT version, name, executed_at
FROM supabase_migrations.schema_migrations
ORDER BY version;

-- Count applied migrations
SELECT COUNT(*) as applied_count
FROM supabase_migrations.schema_migrations;

-- Get latest applied migration
SELECT version, name, executed_at
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 1;
```

### Expected Results

**For a FRESH project** (newly created):
- Applied count: 0 (or very few default migrations)
- All local migrations need to be applied

**For an EXISTING project**:
- Compare the `version` column with local migration filenames
- Check for missing or extra migrations

### How to Compare

1. Run the query above in Supabase SQL Editor
2. Save the results
3. Compare with local migrations list (section A)
4. Identify:
   - **Missing on remote**: Local migrations not yet applied
   - **Extra on remote**: Migrations in DB but not in local files
   - **Mismatch**: Different content for same version

---

## C) Schema Drift Checks

### Key Tables and Columns

Run these queries in **Supabase SQL Editor** to verify schema:

#### 1. site_settings Table

```sql
-- Check site_settings structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'site_settings'
ORDER BY ordinal_position;
```

**Expected columns** (from `020_full_rebuild.sql`):
- `id` - SERIAL PRIMARY KEY
- `key` - TEXT UNIQUE NOT NULL
- `value` - JSONB NOT NULL
- `value_type` - TEXT
- `category` - TEXT
- `description_fr` - TEXT ⚠️
- `description_ar` - TEXT ⚠️
- `is_public` - BOOLEAN
- `updated_by` - UUID
- `created_at` - TIMESTAMPTZ
- `updated_at` - TIMESTAMPTZ

**⚠️ CRITICAL ISSUE**: Migration `074_fix_site_settings_contact_fields.sql` references a `description` column, but the table has `description_fr` and `description_ar` columns instead.

**Created by**: Migration `020_full_rebuild.sql`

**Modified by**:
- `074_fix_site_settings_contact_fields.sql` (attempts to use `description` column - **WILL FAIL**)

#### 2. profiles Table

```sql
-- Check profiles structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;
```

**Expected key columns**:
- `id` - UUID (references auth.users)
- `email` - TEXT
- `full_name` - TEXT
- `phone` - TEXT
- `user_role` - TEXT (admin, real_estate_advertiser, commercial_advertiser)
- `advertiser_type` - TEXT (owner, agency)
- `agency_name` - TEXT
- `is_verified` - BOOLEAN
- `is_active` - BOOLEAN

**Created by**: Migration `020_full_rebuild.sql`

**Modified by**: Multiple migrations (profile fixes, role changes, etc.)

#### 3. properties Table

```sql
-- Check properties structure
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'properties'
ORDER BY ordinal_position;
```

**Created by**: Migration `020_full_rebuild.sql`

**Modified by**: Multiple migrations (status workflow, featured properties, privacy settings, etc.)

#### 4. admins Table

```sql
-- Check admins structure
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'admins'
ORDER BY ordinal_position;
```

**Created by**: Migration `050_create_admins_table_and_rls.sql`

#### 5. List All Public Tables

```sql
-- List all tables in public schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected tables** (core):
- `admins`
- `advertising_inquiries`
- `artisan_profiles` (services module)
- `banner_requests`
- `banner_slots`
- `cities`
- `lead_tracking_events` (lead tracking)
- `neighborhoods`
- `payments`
- `profiles`
- `properties`
- `property_images`
- `property_types`
- `promo_banners`
- `push_subscriptions`
- `requests` (services module)
- `reviews` (services module)
- `service_categories`
- `seo_guides`
- `site_pages`
- `site_settings`
- And more...

---

## D) RLS/Auth/Permissions Checks

### 1. Auth.users Table

**⚠️ CRITICAL**: Never try to `ALTER`, `UPDATE`, or directly modify the `auth.users` table. This table is managed by Supabase Auth and is protected.

**Correct approach**:
- Use triggers on `auth.users` (AFTER INSERT only)
- Create profiles in `public.profiles` table
- Reference `auth.users(id)` with foreign keys

**Verification Query**:

```sql
-- Check for auth.users modifications (should be none)
-- This checks pg_catalog for any custom triggers/constraints
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';
```

**Expected triggers**:
- `on_auth_user_created` - AFTER INSERT trigger to create profile

### 2. RLS Status Check

```sql
-- Check which tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**All public tables should have RLS enabled** (`rls_enabled = true`)

### 3. RLS Policies Inventory

```sql
-- List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Key policies to verify**:
- **properties**: Public can read approved, users can manage own, admins have full access
- **profiles**: Users can read own, admins can read all
- **admins**: Only accessible to admins
- **site_settings**: Public can read `is_public=true`, admins can manage

### 4. SECURITY DEFINER Functions

```sql
-- List functions with SECURITY DEFINER
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  CASE 
    WHEN p.prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY function_name;
```

**Expected SECURITY DEFINER functions**:
- `handle_new_user()` - Profile creation trigger
- `check_user_role()` - Role checking helper
- Other admin/system functions

**⚠️ Security Note**: SECURITY DEFINER functions bypass RLS. Ensure they:
1. Have proper permission checks
2. Don't leak sensitive data
3. Are only used when necessary

### 5. Table Ownership

```sql
-- Check table ownership
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**All tables should be owned by**: `postgres` (or your service role)

---

## E) Storage Checks

### 1. Storage Buckets

```sql
-- List all storage buckets
SELECT id, name, public, created_at
FROM storage.buckets
ORDER BY name;
```

**Expected buckets**:

| Bucket ID | Public | Purpose |
|-----------|--------|---------|
| `property-images` | ✓ | Property listing photos |
| `avatars` | ✓ | User profile avatars |
| `banner-images` | ✓ | Advertisement banners |
| `agency-logos` | ✓ | Real estate agency logos |
| `payment-receipts` | ✗ | Private payment proofs |

**Created by**: Migrations `011_storage_buckets.sql`, `021_storage_buckets.sql`, and others

### 2. Storage Policies

```sql
-- List storage policies
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;
```

**Expected policies**:

**property-images** (public bucket):
- Public can SELECT (read)
- Authenticated users can INSERT (upload)
- Users can DELETE own files

**payment-receipts** (private bucket):
- Users can SELECT own files only
- Users can INSERT own files only
- Admins have full access

### 3. Setup Script

If buckets are missing, run:

```bash
node scripts/setup-storage-buckets.js
```

Or create manually in **Supabase Dashboard → Storage → New bucket**

---

## F) Environment & API Checks

### 1. Environment Files

**Check for**:
- `.env` (active environment - git-ignored)
- `.env.example` (template - committed)

**Verification**:
```bash
ls -la .env .env.example
```

### 2. Required Environment Variables

From `.env.example`, the following are **REQUIRED**:

#### Supabase Configuration
```bash
# Your Supabase project URL
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co

# Your Supabase anonymous/public key
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Where to find these**:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Settings → API
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

#### Site URL (Critical for Auth)
```bash
# Primary domain for auth redirects
VITE_SITE_URL=https://www.topaffaireimmo.com

# Production domain for emails
VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.com
```

**⚠️ IMPORTANT**: After setting these, configure in Supabase Dashboard:
1. **Authentication → URL Configuration**
2. Set "Site URL" to your production domain
3. Add Redirect URLs:
   - Production: `https://www.topaffaireimmo.com/**`
   - Development: `http://localhost:5173/**`

#### Optional but Recommended
```bash
# Error monitoring
VITE_SENTRY_DSN=https://YOUR_SENTRY_DSN@sentry.io/YOUR_PROJECT_ID

# Service Role (server-side only - KEEP SECRET)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Hardcoded References

**Check for old project IDs** in:
- `src/lib/supabase.ts` or similar
- Vercel deployment settings
- GitHub Actions workflows (`.github/workflows/`)
- Any config files

**Search command**:
```bash
grep -r "supabase.co" --include="*.ts" --include="*.tsx" --include="*.js" src/
```

All Supabase URLs should come from `import.meta.env.VITE_SUPABASE_URL`, not hardcoded.

### 4. API Key Visibility

**Frontend** (safe to expose):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Backend only** (NEVER expose in frontend):
- `SUPABASE_SERVICE_ROLE_KEY`
- JWT secrets
- Private API keys

---

## G) Supabase UI Checklist

Verify these in **Supabase Dashboard**:

### Database → Tables
- [ ] All expected tables exist (see section C.5)
- [ ] Tables have correct columns (run schema checks)
- [ ] RLS is enabled on all public tables (green shield icon)

### Database → Indexes
- [ ] Performance indexes exist (check migrations 109, 112)
- [ ] Key indexes on frequently queried columns

### Database → Triggers
- [ ] `on_auth_user_created` trigger exists on `auth.users`
- [ ] Trigger calls `public.handle_new_user()` function

### Database → Functions
- [ ] `handle_new_user()` exists
- [ ] `check_user_role()` exists
- [ ] Other RPC functions for app features

### Authentication → Providers
- [ ] Email provider enabled
- [ ] Google OAuth configured (if used)
- [ ] Phone/SMS configured (if used)

### Authentication → URL Configuration
- [ ] Site URL set correctly
- [ ] Redirect URLs include all domains
- [ ] Password reset redirects configured

### Authentication → Policies (RLS)
- [ ] Review policies for all tables
- [ ] Test with "View as anonymous" and "View as authenticated"

### Storage → Buckets
- [ ] All required buckets exist (see section E.1)
- [ ] Public/private settings correct
- [ ] File size limits configured

### Storage → Policies
- [ ] Each bucket has appropriate policies
- [ ] Test upload/download as different users

### SQL Editor
- [ ] Run remote migration check (section B)
- [ ] Run schema drift checks (section C)
- [ ] Run RLS/permissions checks (section D)

### Settings → API
- [ ] Copy Project URL to `.env`
- [ ] Copy anon key to `.env`
- [ ] Note Service Role key (for server-side only)

### Settings → Database
- [ ] Connection pooling configured (if needed)
- [ ] Database size monitored

### Logs → Postgres Logs
- [ ] Check for recent errors
- [ ] Look for permission denied errors
- [ ] Check for missing column errors

---

## Known Issues and Fixes

### Issue 1: site_settings "description" Column

**Problem**: Migration `074_fix_site_settings_contact_fields.sql` references a `description` column, but the table (created in migration `020_full_rebuild.sql`) has `description_fr` and `description_ar` columns.

**Error**: `ERROR: column "description" does not exist in table "site_settings"`

**Root cause**: 
- Migration 020 creates table with `description_fr` and `description_ar`
- Migration 074 tries to use `description` column
- No migration in between adds or renames the column

**Solution Options**:

**Option A**: Fix migration 074 to use `description_fr`
```sql
-- Edit migration 074
INSERT INTO public.site_settings (key, value, category, is_public, description_fr)
VALUES (
  'contact_email',
  to_jsonb('contact@topaffaireimmo.com'::text),
  'contact',
  true,
  'Contact email address for the website'
);
```

**Option B**: Add a migration to create `description` column
```sql
-- New migration: 073.5_add_site_settings_description.sql
ALTER TABLE public.site_settings
ADD COLUMN description TEXT;

-- Optionally migrate data
UPDATE public.site_settings
SET description = COALESCE(description_fr, description_ar);
```

**Recommended**: **Option A** - Fix migration 074 to use the correct column names.

### Issue 2: auth.users Permissions

**Problem**: Error "must be owner of relation users" when trying to modify `auth.users`

**Cause**: Migrations should NEVER directly alter `auth.users`. It's managed by Supabase.

**Solution**: 
- Remove any `ALTER TABLE auth.users` statements
- Use triggers instead: `CREATE TRIGGER ... AFTER INSERT ON auth.users`
- Migrations 020, 030, 033, 035 all correctly use triggers

**Verification**: No migrations should contain:
- `ALTER TABLE auth.users`
- `UPDATE auth.users`
- `INSERT INTO auth.users`

### Issue 3: Duplicate Migration Versions

**Problem**: Multiple migrations with same version number (033, 042, 043, 079, 089, 093, 109, 112)

**Impact**: Supabase CLI may only apply one of them, or fail

**Solutions**:

**Option A**: Rename duplicates with sub-versions
```bash
033_advertising_inquiries.sql → 033a_advertising_inquiries.sql
033_final_fixes.sql → 033b_final_fixes.sql
033_fix_profile_trigger_rls.sql → 033c_fix_profile_trigger_rls.sql
```

**Option B**: Consolidate duplicate migrations into one file (if safe)

**Option C**: Keep as-is if migrations are idempotent and you're using `supabase db push` (it applies all files)

**Recommended**: **Option C** for now, but be aware of potential issues.

---

## Action Plan

### For a FRESH Supabase Project (Recommended)

This is the **safest and cleanest** approach:

```bash
# 1. Login to Supabase
npx supabase login

# 2. Link to your project
npx supabase link --project-ref YOUR_PROJECT_ID

# 3. Check remote status (before making changes)
# Run the SQL queries in Section B in Supabase SQL Editor

# 4. Apply all migrations to remote
npx supabase db push

# 5. Verify migrations applied
# Run the SQL query again to see all applied migrations

# 6. Setup storage buckets (if needed)
node scripts/setup-storage-buckets.js

# 7. Update environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 8. Configure Supabase Dashboard
# - Set Auth redirect URLs
# - Enable auth providers
# - Verify RLS policies

# 9. Test the application
npm install
npm run dev
```

### For PRODUCTION with Existing Data

**⚠️ WARNING**: DO NOT use `npx supabase db reset` - it will delete all data!

```bash
# 1. Backup your database first!
npx supabase db dump -f backup-$(date +%Y%m%d).sql

# 2. Check what migrations are already applied
# Run SQL queries from Section B

# 3. For migrations already applied, mark them as such
npx supabase migration repair <version> --status applied

# Example for deprecated migrations:
npx supabase migration repair 024_sample_properties_data --status applied

# 4. Apply remaining migrations
npx supabase db push

# 5. Verify
# Run SQL queries to check schema
```

### Fixing the site_settings Issue

**Before pushing migrations**, fix migration 074:

```bash
# Edit the file
nano supabase/migrations/074_fix_site_settings_contact_fields.sql

# Replace all instances of "description" with "description_fr"
# Save and close

# Then push
npx supabase db push
```

---

## Testing Checklist

After applying migrations, test these:

### Database
- [ ] All tables exist
- [ ] All columns have correct types
- [ ] RLS is enabled on all public tables
- [ ] Triggers are active

### Authentication
- [ ] User signup works
- [ ] Email confirmation works
- [ ] Login works
- [ ] Password reset works
- [ ] Profile is created automatically after signup

### Authorization
- [ ] Regular users can create properties
- [ ] Regular users can ONLY edit their own properties
- [ ] Admins can edit any property
- [ ] Anonymous users can view published properties
- [ ] Anonymous users CANNOT create/edit properties

### Storage
- [ ] Users can upload property images
- [ ] Users can upload avatars
- [ ] Users can delete their own uploads
- [ ] Users CANNOT delete others' uploads
- [ ] Public images are accessible via URL

### API
- [ ] Frontend can connect to Supabase
- [ ] No CORS errors
- [ ] No authentication errors
- [ ] API keys are correct

---

## Monitoring

After deployment, monitor:

### Supabase Dashboard → Logs
- **Postgres Logs**: Look for SQL errors
- **API Logs**: Check for failed requests
- **Auth Logs**: Monitor login failures

### Common Error Patterns

**"new row violates row-level security policy"**
- → RLS policy too restrictive, review policies

**"column does not exist"**
- → Schema drift, run schema checks

**"permission denied for table"**
- → RLS not configured correctly

**"relation does not exist"**
- → Migration not applied, run `db push`

---

## Resources

### Official Documentation
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)

### Project Documentation
- `supabase/README.md` - Database setup guide
- `supabase/BACKEND_DOCUMENTATION.md` - API reference
- `supabase/SECURITY_POLICIES.md` - RLS policies
- `supabase/DEPLOYMENT_GUIDE.md` - Production deployment

### Support
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub Discussions](https://github.com/supabase/supabase/discussions)

---

## Appendix: Quick Reference

### Essential Commands

```bash
# Login
npx supabase login

# Link project
npx supabase link --project-ref YOUR_PROJECT_ID

# Check local status
npx supabase status

# Apply migrations
npx supabase db push

# Pull remote schema
npx supabase db pull

# Reset local database (development only)
npx supabase db reset

# Dump database
npx supabase db dump -f backup.sql

# Generate TypeScript types
npm run types:supabase
```

### Environment Variables Template

```bash
# .env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_SITE_URL=https://www.topaffaireimmo.com
VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.com
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Server-side only
```

### Quick Diagnostic Script

Run: `npx tsx scripts/diagnose-supabase.ts`

This will:
- List all local migrations
- Check for duplicates and gaps
- Search for known issues
- Generate SQL queries to check remote state
- Provide actionable next steps

---

**Report End**
