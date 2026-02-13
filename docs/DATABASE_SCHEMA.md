# Database Schema Documentation

## Overview

This document describes the database schema for the TopAffaireImmo application, with a focus on authentication and user management tables.

## Core Tables

### 1. `auth.users` (Managed by Supabase)

Built-in Supabase Auth table. We don't modify this directly.

**Key Fields:**
- `id` (UUID): Primary key
- `email` (TEXT): User email
- `encrypted_password` (TEXT): Hashed password
- `email_confirmed_at` (TIMESTAMPTZ): Email verification timestamp
- `raw_user_meta_data` (JSONB): Custom metadata (we use this for signup data)
- `created_at` (TIMESTAMPTZ): Account creation date

### 2. `public.profiles`

**Purpose:** User profile data and authorization information.

**Relationship:** 1:1 with `auth.users` (id → auth.users.id)

**Schema:**

```sql
CREATE TABLE public.profiles (
  -- Primary Key & Identity
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  
  -- Authorization & Roles
  user_role TEXT NOT NULL CHECK (user_role IN ('user', 'agent', 'merchant', 'admin')),
  announcer_type TEXT CHECK (announcer_type IN ('proprietaire', 'courtier', 'agence')),
  
  -- Business Information
  agency_name TEXT,
  agency_logo TEXT,
  agency_description_fr TEXT,
  agency_description_ar TEXT,
  company_name TEXT,
  
  -- Status & Verification
  is_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  -- OAuth Integration
  google_id TEXT UNIQUE,
  
  -- Preferences
  preferred_language TEXT DEFAULT 'fr' CHECK (preferred_language IN ('fr', 'ar', 'en')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_profiles_user_role ON public.profiles(user_role);
CREATE INDEX idx_profiles_announcer_type ON public.profiles(announcer_type);
CREATE INDEX idx_profiles_google_id ON public.profiles(google_id);
```

**Field Descriptions:**

#### Core Identity
- **id**: UUID matching auth.users.id - single source of truth for user identity
- **email**: User's email address (denormalized from auth.users for convenience)
- **full_name**: User's full name
- **phone**: Phone number for contact

#### Primary Role (`user_role`)
Controls system-wide permissions and access levels.

**Values:**
- `'user'`: Regular user - can post listings, view properties
- `'agent'`: Real estate agent - can post listings, access agent dashboard
- `'merchant'`: Business account - can advertise, access merchant features
- `'admin'`: System administrator - full access to admin panel

**Usage:** For authorization decisions throughout the application.

**Examples:**
```typescript
// Check if user can access admin panel
if (userRole === 'admin') { /* allow */ }

// Route protection
<ProtectedRoute allowedRoles={['agent', 'merchant']}>
```

#### Secondary Type (`announcer_type`)
Categorizes real estate business model (French terminology).

**Values:**
- `'proprietaire'`: Property owner posting their own property
- `'courtier'`: Real estate broker working with multiple properties
- `'agence'`: Real estate agency (company)
- `NULL`: For admins or non-real-estate users

**Usage:** For display, filtering, and business logic specific to real estate.

**Examples:**
```typescript
// Display on listing
"Annoncé par: {announcer_type === 'proprietaire' ? 'Propriétaire' : 'Agence'}"

// Filter listings
WHERE announcer_type = 'agence' AND city_id = 1
```

#### Role vs Type Combinations

| user_role | announcer_type | Description |
|-----------|----------------|-------------|
| `user` | `proprietaire` | Property owner posting own property |
| `agent` | `courtier` | Independent real estate broker |
| `merchant` | `agence` | Real estate agency (company) |
| `admin` | `NULL` | System administrator |
| `merchant` | `NULL` | Non-real-estate business (commercial advertiser) |

#### Business Fields
- **agency_name**: Name of the agency (for `announcer_type = 'agence'`)
- **agency_logo**: URL to agency logo image
- **agency_description_fr**: Agency description in French
- **agency_description_ar**: Agency description in Arabic
- **company_name**: Company name (for merchants)

#### Status Flags
- **is_admin**: Redundant flag for quick admin check (prefer checking admins table)
- **is_active**: Account active status (false = suspended)
- **is_verified**: Email/phone verification status
- **google_id**: Google OAuth ID if signed up via Google

#### Preferences
- **preferred_language**: User's preferred language ('fr', 'ar', 'en')

### 3. `public.admins`

**Purpose:** Separate admin user identification for extra security.

**Relationship:** 1:1 with auth.users (user_id → auth.users.id)

**Schema:**

```sql
CREATE TABLE public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Why Separate Table?**

Having a separate `admins` table provides:
1. **Extra Security Layer**: Admin status requires both `user_role = 'admin'` AND entry in admins table
2. **Audit Trail**: Clear record of when admin access was granted
3. **Easy Revocation**: Remove from admins table without changing profile
4. **RLS Protection**: Can set strict RLS policies on admins table

**Usage:**
```typescript
// Check admin status
const { data: adminRecord } = await supabase
  .from('admins')
  .select('user_id')
  .eq('user_id', userId)
  .maybeSingle();

const isAdmin = !!adminRecord;
```

## Triggers

### `handle_new_user()` Trigger

**Purpose:** Automatically create a profile when a new user signs up.

**Trigger Event:** AFTER INSERT on `auth.users`

**Function:**

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_role_value TEXT;
  announcer_type_value TEXT;
BEGIN
  -- Get and validate user_role from signup metadata
  user_role_value := COALESCE(NEW.raw_user_meta_data->>'user_role', 'user');
  
  IF user_role_value NOT IN ('user', 'agent', 'merchant', 'admin') THEN
    user_role_value := 'user';
  END IF;
  
  -- Get and validate announcer_type from signup metadata
  announcer_type_value := NEW.raw_user_meta_data->>'announcer_type';
  
  IF announcer_type_value IS NOT NULL 
     AND announcer_type_value NOT IN ('proprietaire', 'courtier', 'agence') THEN
    announcer_type_value := NULL;
  END IF;
  
  -- Default announcer_type for non-admin users
  IF announcer_type_value IS NULL AND user_role_value != 'admin' THEN
    announcer_type_value := 'proprietaire';
  END IF;
  
  -- Admin users should not have announcer_type
  IF user_role_value = 'admin' THEN
    announcer_type_value := NULL;
  END IF;

  -- Insert profile with validated data
  INSERT INTO public.profiles (
    id, email, full_name, phone,
    user_role, announcer_type, company_name,
    is_active, is_verified, is_admin
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    user_role_value,
    announcer_type_value,
    COALESCE(NEW.raw_user_meta_data->>'company_name', NULL),
    true,  -- is_active
    false, -- is_verified
    CASE WHEN user_role_value = 'admin' THEN true ELSE false END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    user_role = EXCLUDED.user_role,
    announcer_type = EXCLUDED.announcer_type;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;
```

**How It Works:**

1. Triggered when new user inserted into `auth.users`
2. Reads metadata from `raw_user_meta_data` field
3. Validates `user_role` and `announcer_type` values
4. Sets safe defaults if invalid values provided
5. Inserts profile with validated data
6. Uses `ON CONFLICT` to handle rare race conditions
7. Never fails - catches exceptions and logs warnings

**Signup Example:**

```typescript
// Frontend: Pass metadata during signup
const { error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      full_name: 'John Doe',
      user_role: 'agent',
      announcer_type: 'courtier',
      phone: '+212612345678'
    }
  }
});

// Backend: Trigger automatically creates profile with these values
```

## Row Level Security (RLS)

### Profiles Table RLS

```sql
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile OR admins can view all
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Users can update only their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users can insert their own profile (trigger handles this)
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
```

### Admins Table RLS

```sql
-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Only admins can view admins table
CREATE POLICY "admins_select_admin_only" ON public.admins
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Only admins can insert new admins
CREATE POLICY "admins_insert_admin_only" ON public.admins
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Only admins can delete admins
CREATE POLICY "admins_delete_admin_only" ON public.admins
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );
```

## Common Queries

### Get User Profile with Role

```sql
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.user_role,
  p.announcer_type,
  p.is_admin,
  p.is_active,
  a.user_id IS NOT NULL as is_in_admins_table
FROM public.profiles p
LEFT JOIN public.admins a ON a.user_id = p.id
WHERE p.id = auth.uid();
```

### Check if User is Admin

```sql
SELECT EXISTS (
  SELECT 1 FROM public.admins
  WHERE user_id = auth.uid()
) as is_admin;
```

### Get All Admins (Admin Only)

```sql
SELECT 
  p.id,
  p.email,
  p.full_name,
  a.created_at as admin_since
FROM public.admins a
JOIN public.profiles p ON p.id = a.user_id
ORDER BY a.created_at DESC;
```

### Update User Profile

```sql
UPDATE public.profiles
SET 
  full_name = 'New Name',
  phone = '+212612345678',
  updated_at = NOW()
WHERE id = auth.uid();
```

### Create First Admin (Service Role Only)

```sql
-- First, ensure user exists and has admin role
UPDATE public.profiles
SET user_role = 'admin', is_admin = true
WHERE email = 'admin@example.com';

-- Then add to admins table
INSERT INTO public.admins (user_id)
SELECT id FROM auth.users WHERE email = 'admin@example.com';
```

## Migration History

Key migrations related to profiles:

- **001_initial_schema.sql**: Created initial profiles table
- **044_fix_announcer_type_and_user_role.sql**: Migrated to user_role + announcer_type system
- **050_create_admins_table_and_rls.sql**: Created admins table with RLS
- **087_add_google_oauth_support.sql**: Added google_id for OAuth

## Best Practices

### 1. Always Use `user_role` for Authorization

```typescript
// ✅ CORRECT: Use user_role for permissions
if (profile.user_role === 'admin') {
  // Allow admin action
}

// ❌ WRONG: Don't rely on is_admin flag alone
if (profile.is_admin) {
  // Less secure - flag can be modified
}
```

### 2. Validate Role Transitions

```typescript
// Don't allow users to escalate their own privileges
const preventSelfEscalation = (userId: string, newRole: string) => {
  // Only admins can change user_role
  // Validate this server-side with RLS
};
```

### 3. Use Both Checks for Admin Access

```typescript
// ✅ CORRECT: Check both profile and admins table
const isAdmin = profile.user_role === 'admin' && adminRecord !== null;

// ❌ WRONG: Only checking one source
const isAdmin = profile.is_admin; // Can be stale
```

### 4. Denormalize Carefully

- `email` is denormalized from auth.users for convenience
- Keep it in sync via triggers or application code
- Always prefer auth.users.email as source of truth

### 5. Handle Missing Profiles Gracefully

```typescript
// Handle edge case where profile doesn't exist
const profile = await getProfile(userId);
if (!profile) {
  // Trigger profile creation
  await ensureProfileExists(user);
}
```

## Type Definitions (TypeScript)

```typescript
export type UserRole = 'user' | 'agent' | 'merchant' | 'admin';
export type AnnouncerType = 'proprietaire' | 'courtier' | 'agence';
export type Language = 'fr' | 'ar' | 'en';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  user_role: UserRole;
  announcer_type: AnnouncerType | null;
  agency_name: string | null;
  agency_logo: string | null;
  agency_description_fr: string | null;
  agency_description_ar: string | null;
  company_name: string | null;
  is_admin: boolean;
  is_active: boolean;
  is_verified: boolean;
  google_id: string | null;
  preferred_language: Language;
  created_at: string;
  updated_at: string;
}

export interface AdminRecord {
  user_id: string;
  created_at: string;
}
```

## Troubleshooting

### Profile Not Created After Signup

**Symptoms:** User can login but has no profile in database.

**Causes:**
1. Trigger not installed
2. Trigger failed silently
3. RLS blocked insert

**Solutions:**
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check trigger function
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';

-- Manually create profile
INSERT INTO public.profiles (id, email, user_role)
VALUES ('user-uuid', 'user@example.com', 'user');
```

### Cannot Update Profile

**Symptoms:** Profile update query returns 0 rows affected.

**Causes:**
1. RLS blocking update
2. User not authenticated
3. Trying to update another user's profile

**Solutions:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Verify auth.uid()
SELECT auth.uid();

-- Use service role to bypass RLS (admin only)
```

### Admin Access Not Working

**Symptoms:** User with is_admin=true cannot access admin panel.

**Causes:**
1. Not in admins table
2. user_role not set to 'admin'
3. RLS blocking admins table query

**Solutions:**
```sql
-- Verify admin status
SELECT 
  p.user_role, 
  p.is_admin,
  a.user_id IS NOT NULL as in_admins_table
FROM public.profiles p
LEFT JOIN public.admins a ON a.user_id = p.id
WHERE p.id = 'user-uuid';

-- Add to admins table (service role)
INSERT INTO public.admins (user_id) VALUES ('user-uuid');

-- Update user_role
UPDATE public.profiles 
SET user_role = 'admin', is_admin = true 
WHERE id = 'user-uuid';
```

## Summary

**Key Points:**

1. ✅ `profiles` table is the single source of truth for user data
2. ✅ `user_role` controls system permissions (use for authorization)
3. ✅ `announcer_type` categorizes business model (use for display/filtering)
4. ✅ `admins` table provides extra security layer for admin users
5. ✅ Trigger auto-creates profiles on signup with validated data
6. ✅ RLS policies enforce data access rules
7. ✅ All tables have proper indexes for performance

**Related Documentation:**
- See [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md) for authentication flow
- See [Supabase Auth Docs](https://supabase.com/docs/guides/auth) for auth.users table
