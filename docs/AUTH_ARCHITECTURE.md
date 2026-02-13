# Authentication Architecture Guide

## 🎯 Overview

This document provides a comprehensive guide to the authentication architecture in the TopAffaireImmo application. The system uses **Supabase Auth** with a clean, production-safe implementation that avoids common pitfalls.

## ✅ Key Principles

1. **Single Source of Truth**: One `AuthProvider`, one `AuthContext`, one `useAuth` hook
2. **Production Safety**: Never crash on missing config, network errors, or edge cases
3. **Clean Error States**: Show controlled UI states instead of silent fallbacks
4. **Type Safety**: Full TypeScript coverage for auth state
5. **No Provider Errors**: All components that use `useAuth` are properly wrapped

## 📁 File Structure

```
src/
├── lib/
│   └── supabase.ts              # Supabase client (SINGLE instance)
├── contexts/
│   └── AuthContext.tsx          # Auth state + provider (SINGLE implementation)
├── components/
│   ├── ProtectedRoute.tsx       # Role-based route protection
│   └── AdminProtectedRoute.tsx  # Admin-only route protection
├── hooks/
│   ├── useUserRole.ts          # Hook to get user's role
│   └── useAdmin.ts             # Hook to check admin status
└── main.tsx                     # App entry with provider wrapping
```

## 🔐 Authentication Flow

### 1. Application Startup

```
User opens app
     ↓
main.tsx validates environment variables
     ↓
AuthProvider mounts
     ↓
initializeAuth() called
     ↓
supabase.auth.getSession() checks for existing session
     ↓
If session exists → ensureProfileExists() verifies/creates profile
     ↓
onAuthStateChange() listener established for realtime updates
     ↓
loading = false (app ready)
```

### 2. User Sign Up

```
User submits signup form
     ↓
AuthContext.signUp(email, password)
     ↓
supabase.auth.signUp() creates user in auth.users
     ↓
Database trigger: handle_new_user() fires
     ↓
Profile created in public.profiles with default role
     ↓
Email confirmation sent (if enabled)
     ↓
onAuthStateChange fires with SIGNED_IN event
     ↓
AuthContext updates: user, session, profileReady
```

### 3. User Sign In

```
User submits login form
     ↓
AuthContext.signIn(email, password)
     ↓
supabase.auth.signInWithPassword()
     ↓
If successful → session established
     ↓
onAuthStateChange fires with SIGNED_IN event
     ↓
ensureProfileExists() verifies profile
     ↓
AuthContext updates: user, session, profileReady
```

### 4. Session Persistence

```
User closes/reopens browser
     ↓
Supabase client checks localStorage for token
     ↓
If valid token → auto-restores session
     ↓
initializeAuth() called on mount
     ↓
getSession() returns existing session
     ↓
User logged in automatically
```

### 5. Sign Out

```
User clicks logout
     ↓
AuthContext.signOut()
     ↓
supabase.auth.signOut() clears session
     ↓
onAuthStateChange fires with SIGNED_OUT event
     ↓
AuthContext updates: user = null, session = null
     ↓
User redirected to login page
```

## 🗄️ Database Schema

### Profiles Table

The `profiles` table is the **single source of truth** for user data. It's linked 1:1 with `auth.users`.

```sql
CREATE TABLE public.profiles (
  -- Primary Key (linked to Supabase Auth)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  
  -- PRIMARY ROLE: Controls system permissions
  -- Values: 'user' | 'agent' | 'merchant' | 'admin'
  -- - user: Regular user posting listings
  -- - agent: Real estate agent/broker
  -- - merchant: Business/commercial account
  -- - admin: System administrator
  user_role TEXT NOT NULL CHECK (user_role IN ('user', 'agent', 'merchant', 'admin')),
  
  -- SECONDARY TYPE: For real estate business categorization
  -- Values: 'proprietaire' | 'courtier' | 'agence' | NULL
  -- - proprietaire: Property owner
  -- - courtier: Real estate broker
  -- - agence: Real estate agency
  -- - NULL: For admins or non-real-estate users
  announcer_type TEXT CHECK (announcer_type IN ('proprietaire', 'courtier', 'agence')),
  
  -- Agency/Business Fields
  agency_name TEXT,
  agency_logo TEXT,
  agency_description_fr TEXT,
  agency_description_ar TEXT,
  company_name TEXT,
  
  -- Status Flags
  is_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  -- OAuth Integration
  google_id TEXT UNIQUE,
  
  -- User Preferences
  preferred_language TEXT DEFAULT 'fr' CHECK (preferred_language IN ('fr', 'ar', 'en')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Role vs Type Explanation

**When to use `user_role`:**
- For authorization checks (can user access this page?)
- For system permissions (can user delete this resource?)
- For dashboard routing (which dashboard to show?)

**When to use `announcer_type`:**
- For displaying business categorization on listings
- For filtering search results by advertiser type
- For user profile display (owner vs broker vs agency)

**Example Combinations:**
```
user_role: 'user'     + announcer_type: 'proprietaire' = Property owner
user_role: 'agent'    + announcer_type: 'courtier'     = Real estate broker
user_role: 'merchant' + announcer_type: 'agence'       = Real estate agency
user_role: 'admin'    + announcer_type: NULL           = System admin
```

### Admins Table

```sql
CREATE TABLE public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:** Separate admin identification for extra security.
- `user_role = 'admin'` in profiles table
- Entry in `admins` table for verification
- AdminProtectedRoute checks both

## 🛡️ Row Level Security (RLS)

### Profiles RLS Policies

```sql
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

### Admins RLS Policies

```sql
-- Only admins can view the admins table
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

## 🔧 Code Examples

### Using the Auth Hook

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, session, loading, profileReady } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginPrompt />;
  }

  return <div>Welcome, {user.email}!</div>;
}
```

### Protected Routes

```tsx
import ProtectedRoute from '@/components/ProtectedRoute';

// Basic protection (any authenticated user)
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>

// Role-based protection
<Route 
  path="/agent-dashboard" 
  element={
    <ProtectedRoute allowedRoles={['agent']}>
      <AgentDashboard />
    </ProtectedRoute>
  } 
/>

// Admin-only protection
<Route 
  path="/admin" 
  element={
    <AdminProtectedRoute>
      <AdminPanel />
    </AdminProtectedRoute>
  } 
/>
```

### Checking User Role

```tsx
import { useUserRole } from '@/hooks/useUserRole';

function MyComponent() {
  const { role, loading } = useUserRole();

  if (loading) return <Spinner />;

  if (role === 'admin') {
    return <AdminControls />;
  }

  if (role === 'agent') {
    return <AgentControls />;
  }

  return <UserControls />;
}
```

### Checking Admin Status

```tsx
import { useAdmin } from '@/hooks/useAdmin';

function MyComponent() {
  const { isAdmin, loading } = useAdmin();

  if (loading) return <Spinner />;

  return isAdmin ? <AdminFeature /> : <AccessDenied />;
}
```

## 🚨 Common Patterns & Best Practices

### ✅ DO

1. **Always check loading state first:**
   ```tsx
   if (loading) return <LoadingSpinner />;
   ```

2. **Use ProtectedRoute for route-level protection:**
   ```tsx
   <Route element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
   ```

3. **Check user exists before accessing properties:**
   ```tsx
   const userEmail = user?.email || 'Guest';
   ```

4. **Use profileReady for operations that need database data:**
   ```tsx
   if (profileReady) {
     // Safe to query user's data from database
   }
   ```

### ❌ DON'T

1. **Don't use useAuth outside AuthProvider:**
   ```tsx
   // ❌ WRONG - will throw error
   function App() {
     const { user } = useAuth(); // Not wrapped in AuthProvider
     return <div>{user?.email}</div>;
   }
   ```

2. **Don't trust user.email without checking user exists:**
   ```tsx
   // ❌ WRONG - will crash if user is null
   const email = user.email;
   
   // ✅ CORRECT
   const email = user?.email || 'Guest';
   ```

3. **Don't make auth decisions based on client-side checks alone:**
   ```tsx
   // ❌ WRONG - client checks can be bypassed
   if (user?.role === 'admin') {
     deleteUser(); // Dangerous!
   }
   
   // ✅ CORRECT - use RLS + server-side checks
   // RLS policy prevents unauthorized deletes
   ```

## 🔒 Security Best Practices

### 1. Never Trust Client-Side Checks

Client-side auth checks are for **UX only**, not security. Always enforce permissions server-side:

```tsx
// ✅ Client-side (UX): Hide delete button from non-admins
{isAdmin && <DeleteButton onClick={handleDelete} />}

// ✅ Server-side (Security): RLS policy prevents non-admins from deleting
CREATE POLICY "delete_admin_only" ON table_name
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM admins)
  );
```

### 2. Use RLS for All Tables

Every table with user-owned data should have RLS enabled:

```sql
-- Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "users_select_own" ON my_table
  FOR SELECT USING (owner_id = auth.uid());
```

### 3. Validate User Input

Never trust user input, even from authenticated users:

```tsx
// ❌ WRONG
const userRole = formData.role; // User could submit 'admin'!

// ✅ CORRECT
const userRole = validateRole(formData.role) || 'user';
```

### 4. Use SECURITY DEFINER Carefully

Database triggers with `SECURITY DEFINER` bypass RLS. Only use when necessary and validate inputs:

```sql
CREATE FUNCTION handle_new_user()
SECURITY DEFINER -- Bypasses RLS!
AS $$
BEGIN
  -- ALWAYS validate inputs
  IF NEW.raw_user_meta_data->>'user_role' NOT IN ('user', 'agent', 'merchant', 'admin') THEN
    NEW.raw_user_meta_data = jsonb_set(NEW.raw_user_meta_data, '{user_role}', '"user"');
  END IF;
  -- ...
END;
$$;
```

## 🐛 Troubleshooting

### "useAuth must be used within AuthProvider"

**Problem:** Component using `useAuth` is not wrapped by `AuthProvider`.

**Solution:** Check `main.tsx` - ensure `AuthProvider` wraps the entire app:

```tsx
<AuthProvider>
  <App />
</AuthProvider>
```

### Session not persisting after page reload

**Problem:** LocalStorage not accessible (private browsing, blocked storage).

**Solution:** The app already handles this gracefully. In `supabase.ts`:
- Detects if localStorage is accessible
- Falls back to in-memory session if not
- User must login each time (expected in private mode)

### Profile not created after signup

**Problem:** Database trigger failed or RLS blocked insert.

**Solution:** 
1. Check Supabase logs for trigger errors
2. Verify trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
3. Check RLS policies allow profile insert

### Admin access denied despite being admin

**Problem:** User has `is_admin = true` but not in `admins` table.

**Solution:** Add user to admins table:
```sql
INSERT INTO public.admins (user_id) VALUES ('user-uuid');
```

## 📊 Testing Auth Flow

### Manual Testing Checklist

- [ ] Sign up new user → Profile created automatically
- [ ] Sign in existing user → Session restored
- [ ] Sign out → Session cleared, redirected to login
- [ ] Close/reopen browser → Session persisted (if localStorage available)
- [ ] Access protected route without login → Redirected to login
- [ ] Access admin route as regular user → Access denied
- [ ] Network error during login → Graceful error message shown
- [ ] Invalid credentials → Clear error message

### Test Scenarios

**Test 1: New User Signup**
```
1. Go to /register
2. Enter email + password
3. Submit form
4. Check: User created in auth.users
5. Check: Profile created in public.profiles with user_role='user'
6. Check: Redirected to dashboard or email confirmation page
```

**Test 2: Existing User Login**
```
1. Go to /login
2. Enter credentials
3. Submit form
4. Check: Session established
5. Check: User object populated in AuthContext
6. Check: Redirected to dashboard
```

**Test 3: Protected Route Access**
```
1. Log out if logged in
2. Try to access /dashboard
3. Check: Redirected to /login
4. Log in
5. Check: Now can access /dashboard
```

**Test 4: Role-Based Access**
```
1. Log in as regular user (user_role='user')
2. Try to access /admin
3. Check: Access denied, redirected to /dashboard
4. Log in as admin
5. Check: Can access /admin
```

## 🔄 Migration Path

If you're updating an existing authentication system:

### Step 1: Audit Current Implementation

```bash
# Find all AuthProvider/AuthContext files
grep -r "AuthProvider\|AuthContext" src/

# Find all useAuth calls
grep -r "useAuth" src/

# Check for duplicates
find src/ -name "*Auth*" -type f
```

### Step 2: Consolidate to Single Provider

1. Identify the canonical AuthProvider (usually in `src/contexts/AuthContext.tsx`)
2. Update all imports to use the canonical path
3. Remove duplicate implementations
4. Test each page after migration

### Step 3: Update Database Schema

Run migrations to add `user_role` and `announcer_type` fields if not present.

### Step 4: Update RLS Policies

Ensure RLS policies work with new role fields.

### Step 5: Test Thoroughly

Run through all test scenarios above.

## 📚 Additional Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [React Context Best Practices](https://react.dev/learn/passing-data-deeply-with-context)

## 🎓 Summary

**Key Takeaways:**

1. ✅ **Single Source of Truth**: One AuthProvider, one AuthContext, one useAuth
2. ✅ **Clean Separation**: Auth state (AuthContext) vs User data (database)
3. ✅ **Production Safe**: Never crashes, always shows controlled states
4. ✅ **Security First**: RLS + server-side validation for all operations
5. ✅ **Type Safe**: Full TypeScript coverage
6. ✅ **Well Tested**: Manual + automated tests for all flows

**The authentication system is production-ready and follows industry best practices!**
