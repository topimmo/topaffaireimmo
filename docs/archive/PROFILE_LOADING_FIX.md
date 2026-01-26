# Profile Loading Fix - Supabase Compatible

## Problem Summary

Users were experiencing "Erreur de chargement du profil" (Profile loading error) after successful authentication. The verification query confirmed that no profiles were missing:

```sql
SELECT count(*) 
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
-- Result: 0 (no missing profiles)
```

However, when attempting to run comprehensive migration scripts, Supabase threw:
```
ERROR: 42501: must be owner of relation users
```

This occurred because previous migration attempts tried to modify the `auth.users` table or perform owner-level operations, which are not allowed in Supabase's managed environment.

## Root Causes Identified

1. **RLS Policy Issues**: Row-Level Security policies on `public.profiles` may have been blocking legitimate profile reads after authentication
2. **Permission Errors**: Profile fetch requests were returning 401/403 errors due to RLS policy violations
3. **Supabase Restrictions**: Previous migrations attempted operations on `auth.users` that are not permitted in Supabase
4. **Missing Fallback Logic**: Client-side code needed better error handling for RLS policy violations and missing profiles

## Solution Implemented

### 1. New Supabase-Compatible Migration (041)

Created `supabase/migrations/041_supabase_compatible_profile_fix.sql` that:

✅ **Does NOT touch `auth.users`** - No ALTER TABLE, OWNER changes, or restricted operations
✅ **Focuses solely on `public.profiles`** - All changes are scoped to the public schema
✅ **Fixes RLS policies** - Clear, simple policies that allow:
   - Users to SELECT their own profile (`id = auth.uid()`)
   - Users to INSERT their own profile (for fallback creation)
   - Users to UPDATE their own profile
   - Admin users to view all profiles

#### Key RLS Policies

```sql
-- Users can read their own profile
CREATE POLICY "Enable read access for users to their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (
  id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR user_role = 'admin'))
);

-- Users can insert their own profile (for fallback)
CREATE POLICY "Enable insert for users to create their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Enable update for users to their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());
```

### 2. Enhanced Client-Side Error Handling

Updated `src/contexts/AuthContext.tsx` with:

#### Improved `fetchProfile()` function:
- **Detailed error logging** - Logs error code, message, details, and hint
- **RLS policy detection** - Specifically handles error code `42501` (permission denied)
- **Retry logic** - Retries up to 2 times with 2-second delays for transient errors
- **Better diagnostics** - Logs helpful troubleshooting steps when RLS errors occur

#### Enhanced `createFallbackProfile()` function:
- **Detailed logging** - Shows user ID, email, and metadata being used
- **Explicit is_admin field** - Sets `is_admin: false` explicitly (security)
- **Duplicate key handling** - If profile already exists (error 23505), fetches existing profile instead
- **RLS error detection** - Provides specific guidance when INSERT is blocked by RLS

## What Was NOT Changed

To maintain minimal changes and avoid breaking existing functionality:

❌ **Did NOT modify trigger on `auth.users`** - The existing trigger (`handle_new_user()`) remains unchanged and continues to create profiles automatically on signup
❌ **Did NOT change auth flow** - Login, signup, and signout logic remains the same
❌ **Did NOT modify database schema** - No new columns or tables were added
❌ **Did NOT remove existing migrations** - All previous migrations remain in place

## Testing Checklist

After applying this fix, verify:

- [ ] **New user signup**
  1. Sign up a new user
  2. Check that profile is created in `public.profiles`
  3. Verify user can log in immediately after signup
  4. Confirm no "Erreur de chargement du profil" error

- [ ] **Existing user login**
  1. Log in with an existing account
  2. Verify profile loads without error
  3. Check browser console for success logs
  4. Test on both desktop and mobile

- [ ] **RLS policies**
  1. As regular user, verify can read own profile
  2. As regular user, verify cannot read other profiles
  3. As admin user, verify can read all profiles

- [ ] **Fallback profile creation**
  1. Manually delete a user's profile (in Supabase dashboard)
  2. Have that user log in
  3. Verify fallback profile is created automatically
  4. Check console logs for fallback creation messages

## Verification Queries

Run these in Supabase SQL Editor to verify the fix:

```sql
-- 1. Verify no missing profiles
SELECT count(*) as missing_profiles
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
-- Expected: 0

-- 2. Check RLS policies are active
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;
-- Expected: Should show 4 policies (SELECT, INSERT, UPDATE, DELETE)

-- 3. Verify table has RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';
-- Expected: rowsecurity = true
```

## Environment Variables

Ensure these are properly set in your production environment:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Use `VITE_` prefix for Vite applications (not `NEXT_PUBLIC_` which is for Next.js).

## Troubleshooting

### Issue: User sees "Erreur de chargement du profil"

**Check:**
1. Open browser console (F12) and look for detailed error logs
2. Check if error code is `PGRST116` (profile not found) or `42501` (RLS policy violation)
3. Verify migration 041 has been applied: `SELECT * FROM supabase_migrations.schema_migrations WHERE version = '041';`
4. Confirm RLS policies exist: Run verification query #2 above

**Solution:**
- If `PGRST116`: Fallback profile creation should trigger automatically. If not, verify INSERT policy allows `id = auth.uid()`
- If `42501`: RLS policy is blocking access. Reapply migration 041 or manually create the policies

### Issue: "must be owner of relation users"

**Cause:** Attempting to run old migrations that modify `auth.users`

**Solution:** 
- Only run migration 041, which is Supabase-compatible
- Do NOT run migrations that contain:
  - `ALTER TABLE auth.users`
  - `OWNER TO postgres`
  - `CREATE TRIGGER ... ON auth.users` (trigger creation is fine, but ALTER on the trigger is not)

### Issue: Profile created but can't be read

**Check:**
1. Verify user is authenticated: `supabase.auth.getSession()`
2. Check that `auth.uid()` returns the user's ID
3. Verify RLS SELECT policy exists and uses `id = auth.uid()`

**Solution:**
- Reapply migration 041 to recreate SELECT policy
- Check that user's session is valid and not expired

## Files Changed

1. **supabase/migrations/041_supabase_compatible_profile_fix.sql** (new)
   - Supabase-compatible migration that fixes RLS policies
   - Does not touch auth.users or auth schema

2. **src/contexts/AuthContext.tsx** (modified)
   - Enhanced `fetchProfile()` with better error handling
   - Enhanced `createFallbackProfile()` with RLS error detection
   - Added detailed console logging for debugging

3. **PROFILE_LOADING_FIX.md** (new)
   - This documentation file

## Security Notes

- All RLS policies enforce `id = auth.uid()` to ensure users can only access their own data
- Admin access requires both `is_admin = true` OR `user_role = 'admin'`
- Fallback profile creation explicitly sets `is_admin: false` for security
- DELETE policy allows users to delete their own profile (GDPR compliance)

## Migration Timeline

This fix should be applied:
1. **After** all existing migrations (001-040)
2. **Before** any future migrations that depend on profile RLS policies

## Support

If issues persist after applying this fix:
1. Check Supabase logs: Dashboard → Database → Logs → Postgres Logs
2. Look for trigger execution logs: "Profile creation trigger fired for user ID"
3. Check for RLS policy violations in application logs
4. Verify environment variables are correct in production

## Success Criteria

✅ Users can sign up and profile is created automatically
✅ Users can log in and profile loads without error
✅ No "Erreur de chargement du profil" errors
✅ RLS policies protect user data while allowing necessary access
✅ Fallback profile creation works if profile is somehow missing
✅ No Supabase permission errors (42501) when running migrations
