# Artisan Monetization System - Deployment Checklist

## DONE ✅ Components

### Database Migrations

**Migration 089: Monetization Tables** ✅
- Tables: platform_settings, artisan_profiles, wallets, wallet_transactions, contact_access_passes
- RLS policies for all tables
- Initial seed data (monetization OFF by default)

**Migration 090: Monetization RPC Functions** ✅
- ensure_wallet_exists(target_user_id)
- get_my_wallet_balance()
- admin_topup_wallet(user_id, amount, reason)
- toggle_artisan_boost(profile_id, enable_boost)
- check_contact_access(user_id, city_id, category_id) - OLD VERSION
- debit_wallet_for_contact(city_id, category_id) - OLD VERSION

**Migration 091: Location Model Fix + Updated RPCs** ✅
- Location model: cities[] → city_id + neighborhood_ids[]
- Data migration: city_id = cities_old[1]
- Indexes: city_id, GIN(neighborhood_ids), composite search
- Updated RLS policy: prevents artisan self-verification
- create_my_artisan_profile(city_id, neighborhood_ids, ...)
- check_contact_access(user_id, city_id, category_id, neighborhood_ids)
- debit_wallet_for_contact(city_id, category_id, neighborhood_ids)

**Migration 092: Validation Script** ✅
- Verifies all columns exist
- Verifies all functions exist
- Verifies RLS is enabled
- Verifies indexes are created

### RLS Policies Status

**artisan_profiles** (5 policies) ✅
1. Public SELECT (is_active=true AND is_verified=true) - Migration 089
2. Artisan SELECT own (even unverified) - Migration 089
3. Artisan INSERT own - Migration 089
4. Artisan UPDATE own (cannot change is_verified/is_active) - Migration 091 (UPDATED)
5. Admin ALL - Migration 089

**contact_access_passes** (2 policies) ✅
1. Users can read own passes - Migration 089
2. Admins can manage passes - Migration 089

**wallets** (2 policies) ✅
1. Users can read own wallet - Migration 089
2. Admins can manage wallets - Migration 089

**wallet_transactions** (2 policies) ✅
1. Users can read own transactions - Migration 089
2. Admins can manage transactions - Migration 089

### RPC Functions Status

| Function | Migration | Parameters | Security | Status |
|----------|-----------|------------|----------|--------|
| ensure_wallet_exists | 090 | target_user_id | DEFINER | ✅ |
| create_my_artisan_profile | 091 | city_id, neighborhood_ids[], ... | DEFINER | ✅ |
| toggle_artisan_boost | 090 | profile_id, enable_boost | DEFINER | ✅ |
| check_contact_access | 091 | user_id, city_id, category_id, neighborhood_ids[] | DEFINER | ✅ |
| debit_wallet_for_contact | 091 | city_id, category_id, neighborhood_ids[] | DEFINER | ✅ |
| get_my_wallet_balance | 090 | none | DEFINER | ✅ |
| admin_topup_wallet | 090 | user_id, amount, reason | DEFINER | ✅ |

### Frontend Components Status

| Component | File | Status |
|-----------|------|--------|
| Onboarding | src/pages/artisan/ArtisanOnboarding.tsx | ✅ |
| Dashboard | src/pages/artisan/ArtisanDashboard.tsx | ✅ |
| Wallet Display | src/components/monetization/WalletDisplay.tsx | ✅ |
| Boost Toggle | src/components/monetization/BoostToggle.tsx | ✅ |
| Reveal Phone | src/components/monetization/RevealPhoneButton.tsx | ✅ |
| Admin Wallet Topup | src/components/monetization/AdminWalletTopup.tsx | ✅ |

### Localization (AR/FR) Status

All components use exact AR/FR strings as specified ✅
- Wallet: "الرصيد" / "Solde"
- Boost: "الرفع فنتائج البحث" / "Boost de visibilité"
- Reveal phone: "كشف الرقم" / "Afficher le numéro"
- Helper text: "كتخلص غير مرة وحدة..." / "Vous payez une seule fois..."

## VALIDATION STEPS

### Step 1: Run Migrations in Order
```bash
# In Supabase SQL Editor, execute in order:
089_create_monetization_tables.sql
090_create_monetization_rpc_functions.sql
091_fix_artisan_location_model.sql
092_validate_and_fix.sql  # Validation
```

### Step 2: Run Validation Query
```bash
# Run supabase/TEST_VALIDATION.sql in SQL Editor
# Should return all expected columns, functions, policies
```

### Step 3: Test RPC Functions
```sql
-- Test ensure_wallet_exists
SELECT public.ensure_wallet_exists(auth.uid());

-- Test create_my_artisan_profile
SELECT * FROM public.create_my_artisan_profile(
  p_service_category_id := 'uuid-here',
  p_business_name := 'Test Business',
  p_city_id := 1,
  p_neighborhood_ids := ARRAY[1,2],
  p_phone := '0612345678'
);

-- Test check_contact_access
SELECT * FROM public.check_contact_access(
  p_user_id := auth.uid(),
  p_city_id := 1,
  p_service_category_id := 'uuid-here',
  p_neighborhood_ids := ARRAY[1,2]
);
```

### Step 4: Test Frontend
1. Navigate to /artisan/onboarding
2. Select city → neighborhoods should filter
3. Submit form → should create profile
4. Navigate to /dashboard/artisan
5. If monetization ON → wallet and boost should show
6. If monetization OFF → wallet and boost hidden

## SAFETY CHECKLIST

- [x] No table recreation (only ALTER TABLE)
- [x] Data preserved (cities_old kept for rollback)
- [x] RLS enabled on all tables
- [x] All wallet operations via RPC only
- [x] Negative balance prevented (CHECK constraint)
- [x] Monetization defaults to OFF
- [x] No markdown/emojis in SQL files
- [x] All functions use SECURITY DEFINER
- [x] All functions validate inputs
- [x] Atomic wallet operations (FOR UPDATE)

## KNOWN LIMITATIONS

1. **neighborhoods table must exist** - Migration assumes public.neighborhoods table exists
2. **admins table must exist** - RLS policies reference public.admins
3. **cities_old column** - Not dropped in migration 091 for safety (can be dropped later)
4. **Artisan list page** - Not yet implemented (TODO: ranking by boost + neighborhood)

## ROLLBACK PLAN

If migration 091 needs to be rolled back:
```sql
-- Restore old location model
ALTER TABLE public.artisan_profiles RENAME COLUMN cities_old TO cities;
ALTER TABLE public.artisan_profiles DROP COLUMN city_id;
ALTER TABLE public.artisan_profiles DROP COLUMN neighborhood_ids;

-- Drop updated functions
DROP FUNCTION IF EXISTS public.create_my_artisan_profile;
DROP FUNCTION IF EXISTS public.check_contact_access;
DROP FUNCTION IF EXISTS public.debit_wallet_for_contact;

-- Restore old policy
DROP POLICY IF EXISTS "Artisans can update own profiles" ON public.artisan_profiles;
CREATE POLICY "Artisans can update own profiles"
  ON public.artisan_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## DEPLOYMENT NOTES

1. Run migrations sequentially (089 → 090 → 091 → 092)
2. Verify each migration completes without errors
3. Run TEST_VALIDATION.sql to confirm
4. Test frontend in both monetization ON and OFF states
5. Monitor for any RLS policy denials in logs

## SUPPORT

For issues or questions:
- Check docs/ARTISAN_MONETIZATION_GUIDE.md
- Check docs/ARTISAN_MONETIZATION_TECH_REF.md
- Review Supabase logs for RLS denials
- Check browser console for RPC errors
