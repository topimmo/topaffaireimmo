# Properties RLS Policies - Final Documentation

## Overview

This document describes the final, consolidated Row Level Security (RLS) policies for the `properties` table after migration 083. All redundant and conflicting policies from previous migrations have been removed.

## Architecture

### Role Separation

The RLS policies implement three distinct access levels:

1. **Anonymous (anon)** - No direct access
2. **Authenticated (property owners)** - CRUD on own properties
3. **Authenticated (admins)** - Full CRUD on all properties

### Design Principles

- **Minimal policy set**: Only 7 policies total (no redundancy)
- **Clear role separation**: Each policy has a specific purpose
- **Single source of truth**: Admin checks use only the `admins` table
- **Backward compatibility**: Uses `created_by OR owner_id` for legacy data
- **Security first**: Anonymous users forced to use secure view

## Final Policy Set

### SELECT Policies (2)

#### 1. `properties_select_own`
- **Role**: authenticated
- **Purpose**: Users can view their own properties
- **Condition**: `created_by = auth.uid() OR owner_id = auth.uid()`
- **Rationale**: Handles both new properties (with created_by) and legacy properties (owner_id only)

#### 2. `properties_select_admin`
- **Role**: authenticated
- **Purpose**: Admins can view all properties
- **Condition**: `auth.uid() IN (SELECT user_id FROM public.admins)`
- **Rationale**: Single source of truth for admin status

### INSERT Policies (1)

#### 3. `properties_insert_own`
- **Role**: authenticated
- **Purpose**: Users can create new properties
- **Conditions**:
  - `auth.uid() IS NOT NULL`
  - `created_by = auth.uid()`
  - `owner_id = auth.uid()`
  - `status IN ('draft', 'pending') OR status IS NULL`
- **Rationale**: Ensures both ownership fields are set correctly, prevents privilege escalation

### UPDATE Policies (2)

#### 4. `properties_update_own`
- **Role**: authenticated
- **Purpose**: Users can update their own properties
- **USING Clause**:
  - `(created_by = auth.uid() OR owner_id = auth.uid())`
  - `status IN ('draft', 'rejected')`
- **WITH CHECK Clause**:
  - `(created_by = auth.uid() OR owner_id = auth.uid())`
  - `status IN ('draft', 'pending', 'rejected') OR status IS NULL`
- **Rationale**: Status workflow enforced (users can only edit drafts/rejected listings)

#### 5. `properties_update_admin`
- **Role**: authenticated
- **Purpose**: Admins can update any property
- **Conditions**: `auth.uid() IN (SELECT user_id FROM public.admins)`
- **Rationale**: Admins bypass status restrictions, can approve/publish/archive

### DELETE Policies (2)

#### 6. `properties_delete_own`
- **Role**: authenticated
- **Purpose**: Users can delete their own properties
- **Conditions**:
  - `(created_by = auth.uid() OR owner_id = auth.uid())`
  - `status IN ('draft', 'rejected')`
- **Rationale**: Prevents deletion of submitted/published listings

#### 7. `properties_delete_admin`
- **Role**: authenticated
- **Purpose**: Admins can delete any property
- **Condition**: `auth.uid() IN (SELECT user_id FROM public.admins)`
- **Rationale**: Full admin control for content moderation

## Anonymous Access

### No Direct Access
Anonymous users have **NO** policies allowing direct access to the `properties` table.

### Access via properties_public View
- Created in migration 080
- Shows only `status = 'published'` properties
- Respects contact visibility flags (`show_phone_public`, etc.)
- Granted to both `anon` and `authenticated` roles
- Ensures privacy and data protection

```sql
-- Anonymous users must query this view instead
SELECT * FROM properties_public WHERE city_id = 'some-city';
```

## Status Workflow Integration

The RLS policies work in conjunction with the `protect_property_status` trigger (from migration 067):

### User Restrictions
- **Draft**: Full edit access
- **Pending**: No edit access (submitted for review)
- **Published**: No edit access (live)
- **Rejected**: Full edit access (can resubmit)
- **Archived**: No access

### Admin Permissions
- Can modify properties in **any** status
- Can change status to any value
- Bypass all workflow restrictions

## Migration History

### Issues Resolved

Migration 083 resolved the following issues from previous migrations:

1. **Duplicate Policies**: Migrations 067 and 072 both created policies with same names
2. **Conflicting Conditions**: 067 used `owner_id` only, 072 added `created_by OR owner_id`
3. **Inconsistent Admin Checks**: Some used `profiles.is_admin`, others used `admins` table
4. **Public Access Confusion**: 081 dropped public policy but didn't document view requirement
5. **Naming Inconsistency**: Multiple naming conventions across migrations (010-081)

### Policies Dropped

The following legacy policies were explicitly dropped:

From Migration 067:
- `properties_insert_authenticated`
- `properties_select_own`
- `properties_select_admin`
- `properties_select_public`
- `properties_update_own`
- `properties_update_admin`
- `properties_delete_own`
- `properties_delete_admin`

From Migration 072:
- `properties_insert_own`

From Migration 031:
- `public_view_approved`
- `owner_view_own`
- `admin_view_all`
- `realtor_insert`
- `owner_update`
- `admin_update`
- `owner_delete`
- `admin_delete`

And many more from migrations 010-030.

## Verification

### Check Policy Count
```sql
SELECT COUNT(*) 
FROM pg_policies 
WHERE tablename = 'properties';
-- Expected: 7
```

### Check for Duplicates
```sql
SELECT policyname, COUNT(*) 
FROM pg_policies 
WHERE tablename = 'properties'
GROUP BY policyname
HAVING COUNT(*) > 1;
-- Expected: 0 rows
```

### List All Policies
```sql
SELECT 
  policyname, 
  cmd, 
  roles,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies 
WHERE tablename = 'properties'
ORDER BY cmd, policyname;
```

## Testing Scenarios

### Test 1: Anonymous User
```sql
SET ROLE anon;

-- This should return 0 rows or permission denied
SELECT * FROM public.properties LIMIT 1;

-- This should work
SELECT * FROM public.properties_public LIMIT 10;
```

### Test 2: Property Owner
```sql
SET LOCAL role authenticated;
SET LOCAL request.jwt.claim.sub = '<user-uuid>';

-- Should see only their own properties
SELECT id, title_fr, status 
FROM public.properties 
WHERE created_by = '<user-uuid>' OR owner_id = '<user-uuid>';

-- Should be able to update draft/rejected properties
UPDATE public.properties 
SET title_fr = 'Updated Title'
WHERE id = '<property-id>' AND status = 'draft';
```

### Test 3: Admin User
```sql
SET LOCAL role authenticated;
SET LOCAL request.jwt.claim.sub = '<admin-uuid>';

-- Should see all properties
SELECT COUNT(*) FROM public.properties;

-- Should be able to update any property
UPDATE public.properties 
SET status = 'published'
WHERE id = '<any-property-id>';
```

## Security Guarantees

1. ✅ **No public data leakage**: Anonymous users cannot access unpublished listings
2. ✅ **Contact privacy**: Contact details filtered by visibility flags in public view
3. ✅ **Ownership enforcement**: Users can only modify their own properties
4. ✅ **Admin oversight**: Admins have full control for moderation
5. ✅ **Status workflow**: Users cannot self-approve or publish listings
6. ✅ **No policy conflicts**: All redundant policies removed
7. ✅ **Clear role separation**: Three distinct access levels with no overlap

## Maintenance

### Adding New Policies
When adding new policies in the future:
1. Use descriptive names with `properties_` prefix
2. Follow the pattern: `properties_{action}_{role}`
3. Update this documentation
4. Test all three roles (anon, authenticated, admin)

### Modifying Existing Policies
Never modify policies in old migrations. Always:
1. Create a new migration
2. Drop old policy
3. Create new policy
4. Update this documentation

### Checking for Redundancy
Regularly audit policies:
```sql
SELECT 
  policyname,
  cmd,
  COUNT(*) OVER (PARTITION BY cmd, roles) as policies_per_role
FROM pg_policies 
WHERE tablename = 'properties';
```

## Related Documentation

- Migration 067: Property status workflow
- Migration 072: Created_by column addition
- Migration 080: Contact visibility and properties_public view
- Migration 081: Removed public SELECT policy
- Migration 083: **This consolidation** (final state)

## Summary

After migration 083, the `properties` table has:
- **7 total policies** (minimal set)
- **Clear role separation** (anon/authenticated/admin)
- **No redundant policies**
- **No conflicting conditions**
- **Secure by default** (deny-by-default for anonymous users)
- **Maintainable** (single source of truth for all checks)

This is the final, production-ready RLS configuration for the properties table.
