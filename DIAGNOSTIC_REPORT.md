# Diagnostic Report: Role & Announcer Type Signup Flow Fix

## Executive Summary

Fixed the role and announcer_type signup flow by separating technical roles from business types, implementing consistent mapping, and ensuring proper redirects after authentication.

## Root Cause Analysis

### Problem
The application was mixing technical roles with business types in the `user_role` field, causing:
1. **Wrong role assignment**: Users were assigned `real_estate_advertiser` instead of proper technical roles
2. **Broken redirects**: Auth callback redirected to `/dashboard` or `/commercial-dashboard` instead of role-specific routes
3. **Inconsistent data model**: No separation between technical role (what permissions user has) and business type (what kind of announcer they are)

### Previous State
```typescript
// Old schema
profiles {
  user_role: 'real_estate_advertiser' | 'commercial_advertiser' | 'admin'
  advertiser_type: 'owner' | 'broker' | 'agency'
}

// Old signup - no announcer type selection
signUp(email, password, fullName, phone, 'real_estate_advertiser', companyName)

// Old redirect logic
if (user_role === 'admin') → /admin
if (user_role === 'commercial_advertiser') → /commercial-dashboard
else → /dashboard
```

## Solution Implemented

### 1. Database Schema Changes

**Migration 044: `044_fix_role_announcer_type_mapping.sql`**

Added new `role` column with technical roles:
- `user` - Regular users (Propriétaires)
- `agent` - Agents/Brokers (Courtiers)
- `merchant` - Merchants/Agencies (Agences)
- `admin` - System administrators

Updated `announcer_type` to use French values:
- `proprietaire` (owner)
- `courtier` (broker/agent)
- `agence` (agency)

**Mapping Logic:**
```sql
-- Propriétaire → role=user, announcer_type=proprietaire
-- Courtier → role=agent, announcer_type=courtier
-- Agence → role=merchant, announcer_type=agence
-- Admin → role=admin, announcer_type=null
```

**Data Migration:**
- Migrated existing `user_role` + `advertiser_type` → new `role` + `announcer_type`
- Added CHECK constraints for valid values
- Kept `user_role` field for backward compatibility

### 2. Auth Trigger Update

Updated `handle_new_user()` function to:
- Read both `role` and `announcer_type` from raw_user_meta_data
- Validate values (fallback to `role=user`, `announcer_type=proprietaire`)
- Set `user_role` for backward compatibility
- Use SECURITY DEFINER to bypass RLS

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  role_value := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  announcer_type_value := NEW.raw_user_meta_data->>'announcer_type';
  
  -- Validation and defaults
  IF role_value NOT IN ('user', 'agent', 'merchant', 'admin') THEN
    role_value := 'user';
  END IF;
  
  -- Insert with both role and announcer_type
  INSERT INTO public.profiles (...);
END;
$$;
```

### 3. Frontend Changes

#### Register.tsx
- Added "Type d'annonceur" selector UI with three options:
  - Propriétaire (Owner)
  - Courtier (Broker/Agent)
  - Agence (Agency)
- Maps French labels to technical values before sending:
  ```typescript
  const role = announcerType === 'proprietaire' ? 'user' :
               announcerType === 'courtier' ? 'agent' :
               announcerType === 'agence' ? 'merchant' : 'user';
  
  signUp(email, password, fullName, phone, role, announcerType, companyName)
  ```
- Default selection: `proprietaire`

#### AuthContext.tsx
- Updated Profile interface:
  ```typescript
  interface Profile {
    role?: 'user' | 'agent' | 'merchant' | 'admin'
    announcer_type?: 'proprietaire' | 'courtier' | 'agence' | null
    // Kept for backward compatibility:
    user_role?: 'real_estate_advertiser' | 'commercial_advertiser' | 'admin'
    advertiser_type?: 'owner' | 'broker' | 'agency' | null
  }
  ```
- Updated signUp signature:
  ```typescript
  signUp(
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    role?: string,
    announcerType?: string,
    companyName?: string
  )
  ```
- Sends both values in metadata:
  ```typescript
  const metadata = {
    role: role || 'user',
    announcer_type: announcerType || null,
    user_role: role === 'admin' ? 'admin' : 
               (role === 'merchant' ? 'commercial_advertiser' : 'real_estate_advertiser')
  }
  ```

#### AuthCallback.tsx
- Updated redirect logic to use `profile.role`:
  ```typescript
  function getRedirectPath(role?: string): string {
    if (role === 'admin') return '/admin';
    if (role === 'merchant') return '/merchant';
    if (role === 'agent') return '/agent';
    return '/';
  }
  
  // Use profile.role instead of profile.user_role
  const redirectPath = getRedirectPath(profile?.role);
  ```

### 4. Type Definitions

Updated `src/types/supabase.ts`:
```typescript
profiles: {
  Row: {
    role: string
    announcer_type: string | null
    // ... other fields
  }
}
```

## Testing Checklist

### Quick Test Procedure

1. **Test Propriétaire Signup**
   ```
   - Go to /register
   - Select "Propriétaire"
   - Fill form and submit
   - Check email for confirmation
   - Click confirmation link
   - Verify redirect to / (home)
   - Check profiles table: role='user', announcer_type='proprietaire'
   ```

2. **Test Courtier Signup**
   ```
   - Go to /register
   - Select "Courtier"
   - Fill form and submit
   - Check email for confirmation
   - Click confirmation link
   - Verify redirect to /agent
   - Check profiles table: role='agent', announcer_type='courtier'
   ```

3. **Test Agence Signup**
   ```
   - Go to /register
   - Select "Agence"
   - Fill form and submit
   - Check email for confirmation
   - Click confirmation link
   - Verify redirect to /merchant
   - Check profiles table: role='merchant', announcer_type='agence'
   ```

4. **Test Admin Login**
   ```
   - Login with admin credentials
   - Verify redirect to /admin
   - Check profile: role='admin', announcer_type=null
   ```

### Verification Queries

Run these SQL queries to verify data integrity:

```sql
-- 1. Check all users have valid role
SELECT id, email, role, announcer_type, user_role 
FROM public.profiles 
WHERE role IS NULL OR role NOT IN ('user', 'agent', 'merchant', 'admin');
-- Expected: 0 rows

-- 2. Check announcer_type values
SELECT DISTINCT role, announcer_type 
FROM public.profiles 
ORDER BY role, announcer_type;
-- Expected: Valid combinations only

-- 3. Count by role
SELECT role, COUNT(*) as count
FROM public.profiles 
GROUP BY role
ORDER BY role;

-- 4. Check backward compatibility
SELECT role, user_role, COUNT(*) 
FROM public.profiles 
GROUP BY role, user_role;
-- Expected: Consistent mappings
```

### RLS Verification

Test that users can:
- ✅ Read their own profile
- ✅ Update their own profile
- ✅ Insert their profile (via trigger)
- ✅ Admins can read all profiles

```sql
-- Test as authenticated user
SELECT * FROM profiles WHERE id = auth.uid();

-- Test admin access
SELECT * FROM profiles WHERE id = auth.uid() AND is_admin = true;
```

## Changes Summary

### Files Modified
1. `supabase/migrations/044_fix_role_announcer_type_mapping.sql` - Database migration
2. `src/types/supabase.ts` - Type definitions
3. `src/contexts/AuthContext.tsx` - Profile interface and signup logic
4. `src/pages/Register.tsx` - UI for announcer type selection
5. `src/pages/AuthCallback.tsx` - Redirect based on role

### Files Created
1. `DIAGNOSTIC_REPORT.md` - This document

## Rollback Procedure

If needed, rollback by:

```sql
-- 1. Drop new column
ALTER TABLE public.profiles DROP COLUMN role;

-- 2. Restore old advertiser_type values
UPDATE public.profiles
SET advertiser_type = CASE
  WHEN announcer_type = 'proprietaire' THEN 'owner'
  WHEN announcer_type = 'courtier' THEN 'broker'
  WHEN announcer_type = 'agence' THEN 'agency'
  ELSE advertiser_type
END;

-- 3. Restore previous trigger from migration 042
```

Then revert frontend changes via git.

## Notes

- **Backward Compatibility**: Kept `user_role` and old `advertiser_type` for existing code that may reference them
- **RLS Safety**: Trigger uses SECURITY DEFINER with safe search_path
- **Validation**: Both frontend and backend validate role/announcer_type values
- **Defaults**: Missing values default to `role=user`, `announcer_type=proprietaire`
- **Admin Users**: Admin role has no announcer_type (set to null)

## Production Deployment

1. Apply migration 044 to production database
2. Deploy frontend changes
3. Monitor auth callback logs for redirect errors
4. Verify new signups create correct profile data
5. Test existing user logins still work

## Success Criteria

- ✅ New signups can select announcer type
- ✅ Profile stores both role and announcer_type
- ✅ Auth callback redirects based on role
- ✅ No RLS errors during profile creation
- ✅ Backward compatibility maintained
- ✅ All existing users migrated to new schema
