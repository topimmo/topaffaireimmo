# Migration 048: Simplified Supabase Auth Signup

## Overview
This migration removes all automatic profile creation, role logic, and admin whitelist features to simplify the signup flow to plain Supabase Auth (email + password only).

## Problem
The previous signup flow was failing with `AuthApiError 500 "Database error saving new user"` due to complex database trigger logic that automatically created profiles with roles, announcer types, and whitelist checks.

## Solution
Simplified the entire authentication flow:
1. **Database**: Removed all triggers and functions that run on auth.users insert
2. **Frontend**: Removed role selection UI and metadata collection
3. **Auth Flow**: Plain email + password signup only

## Changes Made

### Database (Migration 048)
**File**: `supabase/migrations/048_remove_profile_trigger_logic.sql`

Removed:
- ✅ `on_auth_user_created` trigger on `auth.users`
- ✅ `handle_new_user()` function
- ✅ `on_profile_check_admin_whitelist` trigger on `public.profiles`
- ✅ `check_and_promote_admin()` function
- ✅ `admin_whitelist` table

**Impact**: 
- New users are only created in `auth.users` table
- No automatic profile creation in `public.profiles`
- Application can function with auth-only users (no profiles required)

### Frontend

#### Register.tsx
**File**: `src/pages/Register.tsx`

Removed:
- ✅ Full name field
- ✅ Phone field
- ✅ Company name field
- ✅ Announcer type selection (Propriétaire/Courtier/Agence)
- ✅ All metadata collection

Kept:
- ✅ Email field
- ✅ Password field
- ✅ Confirm password field

#### AuthContext.tsx
**File**: `src/contexts/AuthContext.tsx`

Simplified:
- ✅ `signUp()` now only accepts `email` and `password` (removed all other parameters)
- ✅ Removed `ensureProfile()` function (no automatic profile creation)
- ✅ Removed profile creation logic from `signUp()`
- ✅ Removed profile creation logic from `signIn()`
- ✅ Simplified `fetchProfile()` to just fetch (no retry/fallback logic)
- ✅ Removed console logging throughout

**New Signature**:
```typescript
// Before
signUp(email, password, fullName, phone?, userRole?, announcerType?, companyName?)

// After
signUp(email, password)
```

## How to Apply

### Production Database
Apply the migration using Supabase CLI:
```bash
supabase db push
```

Or manually run the SQL from:
`supabase/migrations/048_remove_profile_trigger_logic.sql`

### Frontend
Deploy the updated frontend code. No environment variable changes needed.

## Testing

### Test Signup Flow
1. Navigate to `/register`
2. Enter email and password
3. Confirm password
4. Click "S'inscrire" (Register)
5. Verify success message appears
6. Check email for confirmation link
7. Confirm email and login

### Verify in Database
```sql
-- Check that new users are created in auth.users
SELECT id, email, created_at FROM auth.users 
ORDER BY created_at DESC LIMIT 5;

-- Verify no triggers on auth.users
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgname IN ('on_auth_user_created', 'on_profile_check_admin_whitelist');
-- Expected: 0 rows

-- Verify functions are removed
SELECT proname FROM pg_proc 
WHERE proname IN ('handle_new_user', 'check_and_promote_admin');
-- Expected: 0 rows
```

## Rollback Procedure

If you need to restore the previous behavior:

### Database Rollback
1. Drop migration 048 changes (triggers/functions are already dropped)
2. Re-apply migration 047:
   ```sql
   \i supabase/migrations/047_fix_profile_trigger_not_null_defensive.sql
   ```
3. Re-apply migration 045:
   ```sql
   \i supabase/migrations/045_add_admin_whitelist_and_fix_signup.sql
   ```

### Frontend Rollback
Revert the following files to their previous versions:
- `src/pages/Register.tsx`
- `src/contexts/AuthContext.tsx`

Use git to restore:
```bash
git checkout HEAD~1 -- src/pages/Register.tsx
git checkout HEAD~1 -- src/contexts/AuthContext.tsx
```

## Important Notes

### Profile Management
- **Profiles are no longer auto-created on signup**
- If your application requires profiles, you'll need to:
  1. Create them manually through admin interface, or
  2. Create them on first login via frontend logic, or
  3. Create them lazily when needed

### User Experience
- Simpler registration form (just email + password)
- Faster signup (no database trigger overhead)
- No role/announcer type selection needed
- Users can be upgraded to specific roles via admin panel later if needed

### Security
- Auth is handled entirely by Supabase Auth (trusted system)
- No custom trigger logic that could fail
- No complex role/whitelist checks on signup
- RLS policies on other tables remain intact

## Questions?

If you encounter issues:
1. Check Supabase logs for auth errors
2. Verify migration 048 was applied successfully
3. Test signup with a new email address
4. Check that email confirmation is working

## References
- Previous migrations: 045, 047
- Related files: `src/lib/roleMapping.ts` (can be removed if not used elsewhere)
