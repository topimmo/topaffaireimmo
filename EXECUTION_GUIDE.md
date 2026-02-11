# EXECUTION GUIDE - Artisan Monetization System

## Prerequisites

Before running migrations, verify:
- [ ] Supabase project is accessible
- [ ] SQL Editor is available
- [ ] You have admin access
- [ ] Existing tables: cities, neighborhoods, service_categories, admins

## Migration Execution Order

Execute these files **IN ORDER** in the Supabase SQL Editor:

### Step 1: Migration 089 (Monetization Tables)
**File**: `supabase/migrations/089_create_monetization_tables.sql`

**Creates**:
- platform_settings (with monetization config)
- artisan_profiles (with cities[] - OLD MODEL)
- wallets
- wallet_transactions
- contact_access_passes (without neighborhood_ids)

**Expected**: ~255 lines, should complete in 1-2 seconds

**Verify**: Run this query:
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('platform_settings', 'artisan_profiles', 'wallets', 'wallet_transactions', 'contact_access_passes')
ORDER BY tablename;
```
**Expected output**: 5 rows

---

### Step 2: Migration 090 (Monetization RPCs)
**File**: `supabase/migrations/090_create_monetization_rpc_functions.sql`

**Creates**:
- ensure_wallet_exists()
- check_contact_access() - OLD VERSION (city + category only)
- debit_wallet_for_contact() - OLD VERSION
- admin_topup_wallet()
- get_my_wallet_balance()
- toggle_artisan_boost()

**Expected**: ~427 lines, should complete in 1-2 seconds

**Verify**: Run this query:
```sql
SELECT proname FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname LIKE '%wallet%' OR proname LIKE '%artisan%' OR proname LIKE '%contact%'
ORDER BY proname;
```
**Expected**: Should see all 6 functions

---

### Step 3: Migration 091 (Location Model Fix)
**File**: `supabase/migrations/091_fix_artisan_location_model.sql`

**Changes**:
1. Renames artisan_profiles.cities to cities_old
2. Adds artisan_profiles.city_id (INTEGER)
3. Adds artisan_profiles.neighborhood_ids (INTEGER[])
4. Migrates data: city_id = cities_old[1]
5. Adds contact_access_passes.neighborhood_ids
6. Updates RLS policy (prevents self-verification)
7. Creates create_my_artisan_profile()
8. Updates check_contact_access() with neighborhood support
9. Updates debit_wallet_for_contact() with neighborhood support

**Expected**: ~467 lines, should complete in 2-3 seconds

**Verify**: Run this query:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'artisan_profiles' 
AND column_name IN ('city_id', 'neighborhood_ids', 'cities_old')
ORDER BY column_name;
```
**Expected output**: 3 rows (city_id integer, neighborhood_ids integer[], cities_old integer[])

---

### Step 4: Validation (Optional but Recommended)
**File**: `supabase/migrations/092_validate_and_fix.sql`

**Purpose**: Validates all components are in place

**Expected**: Multiple NOTICE messages saying validations passed

**Alternative**: Run `supabase/TEST_SUITE.sql` for detailed test results

---

## Post-Migration Verification

### Quick Check
```sql
-- Should return all PASS results
\i supabase/TEST_SUITE.sql
```

### Detailed Inspection
```sql
-- Should return comprehensive info
\i supabase/TEST_VALIDATION.sql
```

### Manual Smoke Test

1. **Test wallet creation**:
```sql
SELECT public.ensure_wallet_exists(auth.uid());
SELECT * FROM public.wallets WHERE user_id = auth.uid();
```

2. **Test settings**:
```sql
SELECT value FROM public.platform_settings WHERE key = 'monetization';
```

3. **Test RLS**:
```sql
-- As non-admin user
SELECT * FROM public.artisan_profiles WHERE is_verified = false;
-- Should return 0 rows (public can't see unverified)

-- As artisan user
SELECT * FROM public.artisan_profiles WHERE user_id = auth.uid();
-- Should return their own profile even if unverified
```

## Common Issues & Solutions

### Issue 1: "relation already exists"
**Cause**: Migration 089 already ran
**Solution**: Skip to migration 090 or 091

### Issue 2: "column already exists"
**Cause**: Migration 091 already ran partially
**Solution**: Migration uses IF NOT EXISTS, safe to re-run

### Issue 3: "function already exists"
**Cause**: RPC already created
**Solution**: All functions use CREATE OR REPLACE, safe to re-run

### Issue 4: "cities_old does not exist"
**Cause**: artisan_profiles doesn't have old cities column
**Solution**: Table might be fresh - migration will still work (UPDATE will affect 0 rows)

### Issue 5: "policy already exists"
**Cause**: Policy from migration 089 exists
**Solution**: Migration 091 uses DROP POLICY IF EXISTS first, safe to re-run

## Rollback Instructions

If you need to rollback migration 091:

```sql
-- Restore old structure
ALTER TABLE public.artisan_profiles RENAME COLUMN cities_old TO cities;
ALTER TABLE public.artisan_profiles DROP COLUMN IF EXISTS city_id;
ALTER TABLE public.artisan_profiles DROP COLUMN IF EXISTS neighborhood_ids;
ALTER TABLE public.contact_access_passes DROP COLUMN IF EXISTS neighborhood_ids;

-- Drop new functions (old versions from migration 090 will remain)
DROP FUNCTION IF EXISTS public.create_my_artisan_profile;

-- Restore old policy
DROP POLICY IF EXISTS "Artisans can update own profiles" ON public.artisan_profiles;
CREATE POLICY "Artisans can update own profiles"
  ON public.artisan_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## Expected Final State

After all migrations:

**Tables**: 11 total
- platform_settings
- artisan_profiles (with city_id, neighborhood_ids, cities_old)
- wallets
- wallet_transactions  
- contact_access_passes (with neighborhood_ids)
- service_categories
- cities
- neighborhoods
- admins
- profiles
- properties

**RPC Functions**: 7 total
- ensure_wallet_exists
- create_my_artisan_profile
- toggle_artisan_boost
- check_contact_access (with neighborhood support)
- debit_wallet_for_contact (with neighborhood support)
- get_my_wallet_balance
- admin_topup_wallet

**RLS Policies**: 15+ total
- 5 on artisan_profiles
- 2 on contact_access_passes
- 2 on wallets
- 2 on wallet_transactions
- 3 on platform_settings
- Others on existing tables

**Indexes**: 10+ total
- idx_artisan_profiles_city_id
- idx_artisan_profiles_neighborhoods (GIN)
- idx_artisan_profiles_search (composite)
- idx_artisan_profiles_user_id
- idx_artisan_profiles_service_category
- idx_artisan_profiles_active
- idx_artisan_profiles_boosted
- idx_contact_passes_lookup
- idx_contact_passes_neighborhoods (GIN)
- Others

## Production Deployment Timeline

1. **Pre-deployment** (5 min)
   - Review migrations
   - Backup database
   - Test in staging

2. **Deployment** (5 min)
   - Execute migration 089
   - Execute migration 090
   - Execute migration 091
   - Run validation

3. **Post-deployment** (10 min)
   - Run TEST_SUITE.sql
   - Test frontend flows
   - Monitor logs for RLS denials
   - Verify monetization is OFF by default

**Total time**: ~20 minutes

## Support Checklist

Before asking for help:
- [ ] Did all migrations complete without errors?
- [ ] Did TEST_SUITE.sql pass all tests?
- [ ] Are there any errors in Supabase logs?
- [ ] Did you check browser console for errors?
- [ ] Is monetization_enabled set correctly in platform_settings?

## Documentation References

- Full guide: `docs/ARTISAN_MONETIZATION_GUIDE.md`
- Technical reference: `docs/ARTISAN_MONETIZATION_TECH_REF.md`
- Deployment checklist: `DEPLOYMENT_CHECKLIST.md`
