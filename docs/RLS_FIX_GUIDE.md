# RLS (Row Level Security) Fix Guide

This guide helps you diagnose and fix Row Level Security policies in TopAffaireImmo Supabase project.

## Table of Contents
1. [Understanding RLS](#understanding-rls)
2. [Quick Diagnosis](#quick-diagnosis)
3. [Common RLS Issues](#common-rls-issues)
4. [Applying Fixes](#applying-fixes)
5. [Verification](#verification)
6. [Role-Based Access](#role-based-access)

## Understanding RLS

### What is RLS?

Row Level Security (RLS) is PostgreSQL's mechanism to control data access at the row level. In Supabase:

- **Enabled by default**: New tables have RLS enabled
- **Policies required**: Without policies, no access is allowed
- **Role-based**: Different rules for `anon`, `authenticated`, and custom roles
- **SQL-based**: Policies use SQL expressions for fine-grained control

### Why RLS is Critical

RLS is your **primary security layer**:
- ✓ Prevents unauthorized data access
- ✓ Enforces business logic at database level
- ✓ Works even if frontend code is compromised
- ✓ Consistent across all access methods (API, SDK, SQL)

### RLS in TopAffaireImmo

Our application uses a **three-tier access model**:

1. **Public (anon)**: Unauthenticated users
   - Can read published properties
   - Can read site settings
   - Can view public artisan profiles
   - Cannot modify anything

2. **Authenticated**: Logged-in users
   - Can create/edit their own content
   - Can read all public data
   - Can manage their profile
   - Cannot access others' private data

3. **Admin**: Users with `user_role = 'admin'`
   - Full access to all tables
   - Can approve/reject content
   - Can modify any record
   - Access verified via `public.is_admin()` function

## Quick Diagnosis

### Step 1: Run Frontend Diagnostic

```bash
npm run diagnose:frontend
```

This checks table access from frontend perspective and identifies RLS issues.

### Step 2: Run SQL Inspection

Copy and run `supabase/RLS_INSPECTION.sql` in Supabase SQL Editor.

This comprehensive script shows:
- Which tables have RLS enabled
- All policies per table
- Missing policies
- Role permissions
- Admin function status
- Common issues

### Step 3: Review Output

Look for these indicators:

**✓ Good**:
```
✓ ENABLED | properties
SELECT | properties_select_published_anon
```

**✗ Problem**:
```
✗ DISABLED | properties
RLS enabled but no policies found | users
```

## Common RLS Issues

### Issue 1: Table Has RLS But No Policies

**Symptom**: All queries return empty results or permission denied

**Diagnosis**:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Check for policies
SELECT tablename, COUNT(*) 
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename;
```

**Fix**: Apply minimum policies from `supabase/RLS_MINIMUM_POLICIES.sql`

### Issue 2: Anon Cannot Read Published Content

**Symptom**: Frontend shows "No properties found" even though data exists

**Expected Behavior**: 
- Anon users should read `status = 'published'` properties
- Published properties are public data

**Check Policy**:
```sql
SELECT policyname, qual 
FROM pg_policies 
WHERE tablename = 'properties' 
  AND cmd = 'SELECT' 
  AND 'anon' = ANY(roles);
```

**Fix**:
```sql
CREATE POLICY "properties_select_published_anon" 
ON public.properties FOR SELECT
TO anon
USING (status = 'published');
```

### Issue 3: Users Cannot Update Own Records

**Symptom**: "Permission denied" when user tries to edit their own property

**Check Policy**:
```sql
SELECT policyname, qual 
FROM pg_policies 
WHERE tablename = 'properties' 
  AND cmd = 'UPDATE'
  AND 'authenticated' = ANY(roles);
```

**Fix**:
```sql
CREATE POLICY "properties_update_own" 
ON public.properties FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### Issue 4: Admin Cannot Access Data

**Symptom**: Admin user gets permission denied

**Check is_admin() Function**:
```sql
SELECT public.is_admin();  -- Should return true for admin users
```

**Check Function Exists**:
```sql
SELECT proname 
FROM pg_proc 
WHERE proname = 'is_admin';
```

**Fix**: If function missing, apply from `supabase/RLS_MINIMUM_POLICIES.sql`

### Issue 5: Storage Access Denied

**Symptom**: Cannot upload images, 403 errors

**Check Bucket Policies**:
```sql
SELECT policyname, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';
```

**Fix**: Ensure storage policies exist for each bucket (see RLS_MINIMUM_POLICIES.sql)

### Issue 6: Security Definer Function Leaking Data

**Symptom**: Unexpected data access through RPC functions

**Check SECURITY DEFINER Functions**:
```sql
SELECT proname, prosecdef 
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND prosecdef = true;
```

**Review**: Each SECURITY DEFINER function should:
- Have explicit RLS checks
- Validate parameters
- Be documented and reviewed

## Applying Fixes

### Option 1: Apply All Minimum Policies (Recommended for New Projects)

**When to use**: 
- Fresh Supabase project
- Starting from scratch
- Major RLS refactor

**How**:
1. Review `supabase/RLS_MINIMUM_POLICIES.sql`
2. Run in Supabase SQL Editor
3. Verify with `npm run diagnose:frontend`

### Option 2: Add Individual Policies (Recommended for Existing Projects)

**When to use**:
- Production database with data
- Incremental fixes
- Specific table issues

**How**:
1. Identify missing policy from diagnostic
2. Extract relevant policy from RLS_MINIMUM_POLICIES.sql
3. Test in staging first
4. Apply to production

### Option 3: Create Migration

**When to use**:
- Need version control
- Want repeatable deployment
- Team collaboration

**How**:
```bash
# Create new migration
npx supabase migration new fix_rls_policies

# Edit migration file
# Add policies from RLS_MINIMUM_POLICIES.sql

# Apply migration
npx supabase db push
```

## Policy Patterns

### Pattern 1: Public Read, Admin Write

For reference data (cities, categories, settings):

```sql
-- Enable RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "cities_select_all" 
ON public.cities FOR SELECT
TO anon, authenticated
USING (true);

-- Admin write
CREATE POLICY "cities_modify_admin" 
ON public.cities FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
```

### Pattern 2: Own Records Only

For user-generated content:

```sql
-- Users can select all
CREATE POLICY "properties_select_all" 
ON public.properties FOR SELECT
TO authenticated
USING (true);

-- Users can insert their own
CREATE POLICY "properties_insert_own" 
ON public.properties FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own
CREATE POLICY "properties_update_own" 
ON public.properties FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### Pattern 3: Conditional Public Access

For published vs draft content:

```sql
-- Anon can read published only
CREATE POLICY "properties_select_published_anon" 
ON public.properties FOR SELECT
TO anon
USING (status = 'published');

-- Authenticated can read all
CREATE POLICY "properties_select_authenticated" 
ON public.properties FOR SELECT
TO authenticated
USING (true);
```

### Pattern 4: Admin Override

Admin access to everything:

```sql
-- Regular users update their own
CREATE POLICY "reviews_update_own" 
ON public.reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins update any (for moderation)
CREATE POLICY "reviews_update_admin" 
ON public.reviews FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
```

### Pattern 5: Related Record Access

Access based on relationship:

```sql
-- Users can add images to their properties
CREATE POLICY "property_images_insert_owner" 
ON public.property_images FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_images.property_id
      AND properties.user_id = auth.uid()
  )
);
```

## Role-Based Access

### The is_admin() Function

TopAffaireImmo uses a centralized admin check function:

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND user_role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

**Why This Approach?**
- ✓ Single source of truth for admin status
- ✓ Consistent across all policies
- ✓ Easy to modify permission logic
- ✓ Better performance (function is STABLE)

### User Roles in profiles Table

The `profiles.user_role` field determines permissions:

- `'user'`: Regular user (default)
- `'agent'`: Real estate agent
- `'merchant'`: Business/agency account
- `'admin'`: Administrator

**Important**: 
- Only `user_role` is used for permissions
- `announcer_type` is display-only
- Changing `user_role` requires admin privileges

### Creating an Admin User

**Via SQL**:
```sql
UPDATE public.profiles
SET user_role = 'admin'
WHERE email = 'admin@example.com';
```

**Via Migration**:
See `supabase/fixes/005_create_first_admin.sql`

## Storage Bucket Policies

Storage uses the same RLS system on `storage.objects` table:

### Public Read, Authenticated Write to Own Folder

```sql
-- Anyone can read
CREATE POLICY "property_images_select_public"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'property-images');

-- Authenticated can upload to their folder
CREATE POLICY "property_images_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Admin-Only Bucket

```sql
CREATE POLICY "banner_images_modify_admin"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'banner-images' AND public.is_admin())
WITH CHECK (bucket_id = 'banner-images' AND public.is_admin());
```

## Verification

### After Applying Fixes

1. **Run Frontend Diagnostic**:
   ```bash
   npm run diagnose:frontend
   ```

2. **Run RLS Inspection SQL**:
   ```sql
   -- Copy from supabase/RLS_INSPECTION.sql
   ```

3. **Test in UI**:
   - [ ] Unauthenticated user can view properties
   - [ ] User can signup and login
   - [ ] User can create property
   - [ ] User can edit their property
   - [ ] User cannot edit others' properties
   - [ ] Admin can edit any property
   - [ ] Image upload works

4. **Test Edge Cases**:
   - [ ] Private browsing mode
   - [ ] Expired session
   - [ ] Invalid token
   - [ ] RLS blocks unauthorized access

### Policy Count Per Table

Expected minimum policies:

| Table | Min Policies | Rationale |
|-------|--------------|-----------|
| profiles | 6 | SELECT (anon + auth), INSERT, UPDATE (own + admin), DELETE (admin) |
| properties | 7 | SELECT (anon + auth), INSERT, UPDATE (own + admin), DELETE (own + admin) |
| site_settings | 4 | SELECT (all), INSERT/UPDATE/DELETE (admin) |
| property_images | 4 | SELECT (public), INSERT/UPDATE/DELETE (owner) |

Run this query to check:
```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

## Troubleshooting

### Still Getting Permission Denied

1. **Check RLS is enabled**:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'properties';
   ```

2. **Check policy matches request**:
   ```sql
   -- For SELECT as authenticated
   SELECT * FROM pg_policies 
   WHERE tablename = 'properties' 
     AND cmd = 'SELECT'
     AND 'authenticated' = ANY(roles);
   ```

3. **Test policy in SQL Editor**:
   ```sql
   SET ROLE authenticated;
   SET request.jwt.claim.sub = 'user-uuid-here';
   SELECT * FROM properties LIMIT 1;
   ```

4. **Check auth.uid()**:
   ```sql
   SELECT auth.uid();  -- Should return your user ID
   ```

### Policy Not Working

1. **Check USING vs WITH CHECK**:
   - `USING`: Controls which rows can be seen/modified
   - `WITH CHECK`: Controls which values can be inserted/updated

2. **Check policy order**:
   - Policies are OR'd together
   - If one matches, access is granted
   - More permissive policies override restrictive ones

3. **Check for typos**:
   - Table name case-sensitive
   - Column names must match exactly
   - Function names must exist

## Best Practices

### Do's ✓

1. **Always enable RLS** on new tables
2. **Test policies** before production
3. **Use is_admin()** for admin checks
4. **Document custom policies** in migration
5. **Review SECURITY DEFINER** functions carefully
6. **Grant minimum permissions** needed

### Don'ts ✗

1. **Don't disable RLS** in production
2. **Don't use blanket `USING (true)`** without reason
3. **Don't bypass RLS** with service role in frontend
4. **Don't modify auth schema** tables directly
5. **Don't create conflicting policies**
6. **Don't forget storage policies**

## Summary

RLS Policy Checklist:
- [ ] All tables have RLS enabled
- [ ] All tables have appropriate policies
- [ ] Anon can read public data
- [ ] Authenticated can manage own data
- [ ] Admin can access all data
- [ ] Storage buckets have policies
- [ ] is_admin() function exists and works
- [ ] Diagnostics pass all tests
- [ ] UI functionality tested
- [ ] Edge cases handled

## Related Documentation

- [Frontend Supabase Setup](./FRONTEND_SUPABASE_SETUP.md)
- [Supabase Diagnostic](./SUPABASE_DIAGNOSTIC_README.md)
- [Security Best Practices](../SECURITY_HARDENING_README.md)

## Quick Reference

**Diagnostic Commands**:
```bash
npm run diagnose:frontend     # Frontend tests
npm run diagnose:supabase     # Migration analysis
```

**SQL Scripts**:
- `supabase/RLS_INSPECTION.sql` - Inspect current policies
- `supabase/RLS_MINIMUM_POLICIES.sql` - Apply standard policies

**Key Functions**:
- `public.is_admin()` - Check if current user is admin
- `auth.uid()` - Get current user ID
- `auth.role()` - Get current role (anon/authenticated)

Run the diagnostic tools to identify and fix RLS issues!
