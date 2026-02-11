# Testing SQL Functions in Supabase SQL Editor

## Problem: auth.uid() Returns NULL

When testing RPC functions in the Supabase SQL Editor as the postgres user, `auth.uid()` returns `NULL` because there's no authenticated session. This causes functions that rely on `auth.uid()` to fail.

## Solution: Use Testing Helper Functions

Migration 092 includes helper functions to simulate an authenticated user for testing purposes.

### Quick Start

```sql
-- 1. Set a test user UUID
SELECT public.set_test_user('00000000-0000-0000-0000-000000000001');

-- 2. Verify it works
SELECT auth.uid();
-- Returns: 00000000-0000-0000-0000-000000000001

-- 3. Test your function
SELECT * FROM public.create_my_artisan_profile(
  p_service_category_id := 'your-category-uuid',
  p_business_name := 'Test Business',
  p_city_id := 1,
  p_neighborhood_ids := ARRAY[1,2],
  p_phone := '0612345678'
);

-- 4. Clear test user when done
SELECT public.clear_test_user();
```

### Manual Method (Without Helper Functions)

If the helper functions are not available:

```sql
-- Set test user
SELECT set_config('request.jwt.claim.sub', 'your-user-uuid-here', false);

-- Verify
SELECT auth.uid();

-- Clear
SELECT set_config('request.jwt.claim.sub', '', false);
```

### Complete Test Scenario

```sql
-- Step 1: Setup test user
SELECT public.set_test_user('00000000-0000-0000-0000-000000000001');

-- Step 2: Test ensure_wallet_exists
SELECT public.ensure_wallet_exists('00000000-0000-0000-0000-000000000001');

-- Step 3: Verify wallet created
SELECT * FROM public.wallets WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Step 4: Get a service category UUID (use actual one from your database)
SELECT id FROM public.service_categories WHERE is_active = true LIMIT 1;

-- Step 5: Test create artisan profile
SELECT * FROM public.create_my_artisan_profile(
  p_service_category_id := 'paste-uuid-from-step-4',
  p_business_name := 'Test Plumbing Services',
  p_description_fr := 'Service de plomberie professionnel',
  p_description_ar := NULL,
  p_city_id := 1,
  p_neighborhood_ids := ARRAY[1,2,3],
  p_phone := '0612345678',
  p_whatsapp := '0612345678',
  p_email := 'test@example.com'
);

-- Step 6: Verify profile created
SELECT * FROM public.artisan_profiles WHERE user_id = auth.uid();

-- Step 7: Test toggle boost
SELECT * FROM public.toggle_artisan_boost(
  p_artisan_profile_id := 'profile-uuid-from-step-5',
  p_enable_boost := true
);

-- Step 8: Test access pass (requires wallet balance)
-- First, add some balance as admin
SELECT public.admin_topup_wallet(
  p_target_user_id := '00000000-0000-0000-0000-000000000001',
  p_amount_mad := 100,
  p_reason := 'test_credit'
);

-- Step 9: Test debit for contact
SELECT * FROM public.debit_wallet_for_contact(
  p_city_id := 1,
  p_service_category_id := 'your-category-uuid',
  p_neighborhood_ids := ARRAY[1,2]
);

-- Step 10: Check access pass created
SELECT * FROM public.contact_access_passes WHERE user_id = auth.uid();

-- Step 11: Test check access
SELECT * FROM public.check_contact_access(
  p_user_id := auth.uid(),
  p_city_id := 1,
  p_service_category_id := 'your-category-uuid',
  p_neighborhood_ids := ARRAY[1,2]
);

-- Step 12: Cleanup - clear test user
SELECT public.clear_test_user();
```

### Important Notes

1. **These helper functions are for development/testing only**
   - Do NOT use in production code
   - In production, Supabase Auth automatically sets auth.uid()

2. **Admin Functions**
   - To test admin functions, set test user to an actual admin UUID:
   ```sql
   SELECT id FROM public.admins LIMIT 1;
   SELECT public.set_test_user('admin-uuid-from-above');
   ```

3. **RLS Policies**
   - When testing as a test user, RLS policies will apply
   - You can only see data that the test user is authorized to see
   - To bypass RLS for inspection, switch back to postgres user:
   ```sql
   SELECT public.clear_test_user();
   -- Now you're back to postgres user and can see all data
   ```

4. **Real User Testing**
   - For testing with real users, use their actual UUIDs from auth.users table:
   ```sql
   SELECT id, email FROM auth.users LIMIT 5;
   SELECT public.set_test_user('real-user-uuid');
   ```

### Troubleshooting

**Problem:** Function still fails with "Not authenticated"
```sql
-- Verify auth.uid() is set
SELECT auth.uid();
-- Should NOT be NULL
```

**Problem:** RLS denies access
```sql
-- Check if test user has necessary permissions
-- Example: Check if user is admin
SELECT EXISTS(SELECT 1 FROM public.admins WHERE user_id = auth.uid());
```

**Problem:** Function returns "Unauthorized" or "Not your profile"
```sql
-- Make sure you're testing with the correct user
-- The user_id in the data must match auth.uid()
```

### Best Practices

1. **Always clear test user when done** to avoid confusion
2. **Use consistent test UUIDs** for easier debugging
3. **Document which UUIDs you're using** for tests
4. **Test with both admin and non-admin users** to verify RLS
5. **Clean up test data** after testing

### Example Test Data Setup

```sql
-- Create test user UUID (reusable)
DO $$
DECLARE
  test_user_uuid UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- This UUID doesn't need to exist in auth.users for testing
  -- Just use it consistently in your tests
  RAISE NOTICE 'Test user UUID: %', test_user_uuid;
END $$;
```
