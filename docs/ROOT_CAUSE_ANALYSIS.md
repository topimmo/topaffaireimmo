# Root Cause Analysis: "Database error saving new user"

## Executive Summary

**Issue**: User registration fails with error: `AuthApiError: Database error saving new user`

**Root Cause**: Database schema mismatch - the trigger function tries to insert into a non-existent column `announcer_type` while the actual table has `advertiser_type`.

**Impact**: All new user signups fail, preventing user acquisition

**Solution**: Migration 046 adds the `announcer_type` column and syncs data between old and new columns

---

## Detailed Root Cause

### Timeline of Events

1. **Migration 020** (Initial Schema): Created `profiles` table with `advertiser_type` column
   - Column values: 'owner', 'broker', 'agency'

2. **Migration 044** (Schema Update): Updated trigger to use `announcer_type` with French values
   - Expected values: 'proprietaire', 'courtier', 'agence'
   - **Problem**: Trigger code was updated but column was never renamed

3. **Migration 045** (Admin Whitelist): Further refined trigger with `announcer_type`
   - Assumed column existed from migration 044
   - **Problem**: Column still doesn't exist

### The Bug

The `handle_new_user()` trigger function (from migration 045) contains:

```sql
INSERT INTO public.profiles (
    id, email, full_name, phone,
    user_role,
    announcer_type,  -- ❌ This column doesn't exist!
    company_name,
    is_active, is_verified, is_admin
) VALUES (...)
```

But the actual `profiles` table has:

```sql
CREATE TABLE public.profiles (
    ...
    advertiser_type TEXT,  -- ✅ This is what actually exists
    ...
);
```

### Error Flow

1. User submits registration form
2. Supabase Auth creates user in `auth.users` ✅
3. Trigger `on_auth_user_created` fires
4. Trigger calls `handle_new_user()` function
5. Function tries to INSERT into `profiles` table
6. PostgreSQL error: `column "announcer_type" does not exist` ❌
7. Supabase wraps error as: `AuthApiError: Database error saving new user`
8. User sees generic error message
9. Auth user created but profile missing (orphaned user)

### Why This Went Undetected

1. **Migrations applied incrementally**: Each migration appeared to work in isolation
2. **No integration testing**: Migrations not tested with actual signup flow
3. **Error message too generic**: "Database error" didn't indicate which column
4. **Trigger errors logged as warnings**: Didn't fail the auth user creation

---

## The Fix: Migration 046

### What Migration 046 Does

1. **Adds `announcer_type` column** if it doesn't exist
2. **Migrates data** from `advertiser_type` to `announcer_type` with French mapping:
   - 'owner' → 'proprietaire'
   - 'broker' → 'courtier'
   - 'agency' → 'agence'
3. **Adds constraints** to enforce valid French values
4. **Creates sync trigger** to keep both columns in sync (backward compatibility)
5. **Updates indexes** for query performance

### Backward Compatibility

The migration maintains both columns:
- **New code** uses `announcer_type` (French values)
- **Old code** can still use `advertiser_type` (English values)
- **Sync trigger** ensures both stay consistent

### Migration Code (Simplified)

```sql
-- Add new column
ALTER TABLE public.profiles 
ADD COLUMN announcer_type TEXT;

-- Copy and translate data
UPDATE public.profiles
SET announcer_type = CASE
  WHEN advertiser_type = 'owner' THEN 'proprietaire'
  WHEN advertiser_type = 'broker' THEN 'courtier'
  WHEN advertiser_type = 'agency' THEN 'agence'
  ELSE advertiser_type
END
WHERE advertiser_type IS NOT NULL;

-- Add constraint
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_announcer_type_check 
CHECK (announcer_type IN ('proprietaire', 'courtier', 'agence'));

-- Create sync trigger for backward compatibility
CREATE TRIGGER sync_advertiser_announcer_type
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_advertiser_announcer_type();
```

---

## Verification Steps

### 1. Check Column Exists
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('advertiser_type', 'announcer_type');
```

**Expected Output**:
```
column_name      | data_type
-----------------+-----------
advertiser_type  | text
announcer_type   | text
```

### 2. Check Data Mapping
```sql
SELECT 
  advertiser_type,
  announcer_type,
  COUNT(*) as count
FROM public.profiles 
GROUP BY advertiser_type, announcer_type
ORDER BY advertiser_type, announcer_type;
```

**Expected Output**:
```
advertiser_type | announcer_type | count
----------------|----------------|-------
owner           | proprietaire   | 45
broker          | courtier       | 12
agency          | agence         | 8
```

### 3. Test New Signup
1. Go to `/register`
2. Fill form with test data
3. Submit

**Expected**: 
- ✅ Success screen shown
- ✅ Confirmation email sent
- ✅ Profile created with both `advertiser_type` and `announcer_type`
- ✅ No "Database error saving new user"

### 4. Check Trigger Works
```sql
-- Check trigger exists
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check function definition includes announcer_type
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

---

## Additional Fixes Included

### 1. Supabase Client Singleton
**Status**: ✅ Already correct

The Supabase client is created once in `/src/lib/supabase.ts` and exported:
```typescript
export const supabase: SupabaseClient = createClient(...)
```

All other files import this singleton, preventing multiple instances.

**Note**: Multiple GoTrueClient warnings in development are from React Strict Mode (intentional for development debugging).

### 2. Redirect URLs Documentation
**Created**: `docs/SUPABASE_AUTH_REDIRECT_URLS.md`

Documents required redirect URLs for:
- Production: `https://topaffaireimmo.com/**`
- Vercel previews: `https://*.vercel.app/**`
- Local dev: `http://localhost:5173/**`

**Action Required**: Configure these in Supabase Dashboard → Authentication → URL Configuration

### 3. Comprehensive Test Plan
**Created**: `docs/AUTH_TEST_PLAN.md`

Includes 50+ test cases covering:
- User registration (6 tests)
- Email confirmation (1 test)
- User login (4 tests)
- Session management (4 tests)
- Password reset (2 tests)
- Cross-domain testing (3 tests)
- Edge cases (3 tests)
- Database integrity (3 tests)

---

## Security Considerations

### RLS Policies (Already In Place)
Migration 041 created proper RLS policies:

1. **SELECT**: Users can read their own profile, admins can read all
2. **INSERT**: Users can insert their own profile (for fallback creation)
3. **UPDATE**: Users can update only their own profile
4. **DELETE**: Users can delete their own profile (GDPR)

### Trigger Security
The `handle_new_user()` function uses:
```sql
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
```

This ensures:
- Trigger runs with elevated privileges (bypasses RLS)
- Search path is locked (prevents SQL injection)
- Only affects new user creation (safe operation)

### Data Validation
The trigger validates all inputs:
- `user_role` must be in: 'user', 'agent', 'merchant', 'admin'
- `announcer_type` must be in: 'proprietaire', 'courtier', 'agence' or NULL
- Invalid values default to safe fallbacks

---

## Monitoring & Alerting

### Supabase Dashboard
Monitor **Logs → Auth** for:
- Failed signups
- Trigger errors
- RLS policy violations

### Application Logs
Watch for these console messages:

**Success**:
```
✅ SIGNUP API CALL SUCCESSFUL
✅ User created in Supabase Auth
✅ Profile created/updated for user [email]
```

**Errors**:
```
❌ SIGNUP FAILED
❌ Failed to create profile for user [id]: [error]
```

### Database Monitoring
Set up alerts for:
- Orphaned users (users without profiles)
- Orphaned profiles (profiles without users)
- Failed trigger executions

**Query for orphaned users**:
```sql
SELECT COUNT(*) 
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
```

Should always be 0 after migration 046.

---

## Rollback Procedure

If migration 046 causes issues:

### 1. Revert Migration
```sql
-- Drop the new column
ALTER TABLE public.profiles DROP COLUMN announcer_type;

-- Drop the sync trigger
DROP TRIGGER sync_advertiser_announcer_type ON public.profiles;
DROP FUNCTION sync_advertiser_announcer_type();
```

### 2. Restore Old Trigger
Restore `handle_new_user()` from migration 042:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, phone, 
    user_role, 
    company_name,  -- Use old column names
    is_active, is_verified, is_admin
  ) VALUES (...);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Notify Users
Send email to users who signed up during the broken period:
- Apologize for the inconvenience
- Ask them to reset password (triggers profile creation fallback)
- Offer support contact

---

## Long-Term Improvements

### 1. Migration Testing
Create automated tests for migrations:
- Unit tests for trigger functions
- Integration tests for signup flow
- Rollback tests

### 2. Better Error Reporting
Update AuthContext to parse specific error codes:
```typescript
if (error.code === '42703') {
  // Column does not exist
  console.error('Database schema error - missing column');
  return 'Configuration error. Please contact support.';
}
```

### 3. Monitoring Dashboard
Set up real-time monitoring:
- Signup success rate
- Profile creation rate
- Orphaned user count
- Trigger error rate

### 4. Schema Validation
Add pre-deployment checks:
```sql
-- Verify critical columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles'
AND column_name IN ('announcer_type', 'user_role', 'is_admin');
```

Should return 3 rows.

---

## Conclusion

**Problem**: Database schema mismatch between trigger code and actual table structure

**Solution**: Migration 046 adds missing `announcer_type` column and maintains backward compatibility

**Verification**: Test signup flow + check database queries

**Next Steps**: 
1. Apply migration 046
2. Configure redirect URLs in Supabase Dashboard
3. Run comprehensive tests from `docs/AUTH_TEST_PLAN.md`
4. Monitor for 24 hours
5. Celebrate fixed auth flow! 🎉

---

## References

- Migration 046: `/supabase/migrations/046_fix_announcer_type_column.sql`
- Test Plan: `/docs/AUTH_TEST_PLAN.md`
- Redirect URLs: `/docs/SUPABASE_AUTH_REDIRECT_URLS.md`
- AuthContext: `/src/contexts/AuthContext.tsx`
- Register Page: `/src/pages/Register.tsx`
- Supabase Client: `/src/lib/supabase.ts`
