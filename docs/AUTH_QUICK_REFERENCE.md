# Authentication Quick Reference

> **TL;DR:** Authentication is production-ready. Single AuthProvider, clean architecture, comprehensive docs. Jump to [Common Tasks](#common-tasks) for recipes.

## 📁 File Locations

```
src/
├── lib/supabase.ts                    # Supabase client ⭐
├── contexts/AuthContext.tsx           # Auth provider + useAuth hook ⭐
├── types/auth.ts                      # Type definitions ⭐
├── components/
│   ├── ProtectedRoute.tsx            # Role-based protection
│   └── AdminProtectedRoute.tsx       # Admin-only protection
├── core/routing/guards/
│   ├── RequireAuth.tsx               # Basic auth guard
│   └── RequireProfileReady.tsx       # Wait for DB profile
└── hooks/
    ├── useUserRole.ts                # Get user's role
    └── useAdmin.ts                   # Check admin status

docs/
├── AUTH_ARCHITECTURE.md              # Complete guide (15KB)
└── DATABASE_SCHEMA.md                # Schema docs (15KB)
```

## 🚀 Common Tasks

### 1. Get Current User

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!user) return <LoginPrompt />;

  return <div>Hello, {user.email}!</div>;
}
```

### 2. Protect a Route

```tsx
import ProtectedRoute from '@/components/ProtectedRoute';

// Any authenticated user
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>

// Specific roles only
<Route 
  path="/agent" 
  element={
    <ProtectedRoute allowedRoles={['agent']}>
      <AgentDashboard />
    </ProtectedRoute>
  } 
/>

// Admin only
<Route 
  path="/admin" 
  element={
    <AdminProtectedRoute>
      <AdminPanel />
    </AdminProtectedRoute>
  } 
/>
```

### 3. Check User Role

```typescript
import { useUserRole } from '@/hooks/useUserRole';

function MyComponent() {
  const { role, loading } = useUserRole();

  if (loading) return <Spinner />;

  return role === 'admin' ? <AdminButton /> : <UserButton />;
}
```

### 4. Sign In/Out

```typescript
import { useAuth } from '@/contexts/AuthContext';

function LoginForm() {
  const { signIn, signOut } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error.message);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // ... render form
}
```

### 5. Create New User

```typescript
import { useAuth } from '@/contexts/AuthContext';

function SignupForm() {
  const { signUp } = useAuth();

  const handleSignup = async (email: string, password: string) => {
    const { error } = await signUp(email, password);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check your email for confirmation!');
    }
  };

  // ... render form
}
```

### 6. Get User Profile from Database

```typescript
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/auth';

async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}
```

### 7. Update User Profile

```typescript
import { supabase } from '@/lib/supabase';
import type { ProfileUpdateInput } from '@/types/auth';

async function updateProfile(userId: string, updates: ProfileUpdateInput) {
  const { error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    throw error;
  }
}

// Usage
await updateProfile(user.id, {
  full_name: 'John Doe',
  phone: '+212612345678',
  preferred_language: 'fr'
});
```

### 8. Check Admin Status

```typescript
import { useAdmin } from '@/hooks/useAdmin';

function MyComponent() {
  const { isAdmin, loading } = useAdmin();

  if (loading) return <Spinner />;

  return isAdmin ? <AdminFeature /> : <AccessDenied />;
}
```

### 9. Conditionally Render Based on Role

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

function Dashboard() {
  const { user } = useAuth();
  const { role } = useUserRole();

  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Show for all users */}
      <MyListings userId={user!.id} />
      
      {/* Show only for agents */}
      {role === 'agent' && <AgentTools />}
      
      {/* Show only for merchants */}
      {role === 'merchant' && <MerchantStats />}
      
      {/* Show only for admins */}
      {role === 'admin' && <AdminPanel />}
    </div>
  );
}
```

### 10. Type-Safe Profile Updates

```typescript
import type { Profile, ProfileUpdateInput, UserRole } from '@/types/auth';
import { isValidUserRole } from '@/types/auth';

function ProfileForm({ profile }: { profile: Profile }) {
  const handleSubmit = (formData: any) => {
    // Validate role before updating
    if (formData.user_role && !isValidUserRole(formData.user_role)) {
      toast.error('Invalid role');
      return;
    }

    const updates: ProfileUpdateInput = {
      full_name: formData.full_name,
      phone: formData.phone,
      preferred_language: formData.language
    };

    updateProfile(profile.id, updates);
  };

  // ... render form
}
```

## 🎭 Role Types

### UserRole

**Values:** `'user' | 'agent' | 'merchant' | 'admin'`

**Purpose:** System-wide permissions

| Role | Access |
|------|--------|
| `user` | Post listings, view properties |
| `agent` | Agent dashboard, post listings |
| `merchant` | Merchant features, advertise |
| `admin` | Full admin panel access |

### AnnouncerType

**Values:** `'proprietaire' | 'courtier' | 'agence'`

**Purpose:** Real estate business categorization

| Type | Meaning |
|------|---------|
| `proprietaire` | Property owner |
| `courtier` | Real estate broker |
| `agence` | Real estate agency |

## 🔒 Security Checklist

- ✅ Never trust client-side auth checks for security
- ✅ Always use RLS policies on database tables
- ✅ Validate user input on server-side
- ✅ Check both `user_role` and `admins` table for admin access
- ✅ Use HTTPS in production
- ✅ Never log sensitive data (passwords, tokens)
- ✅ Handle errors gracefully without exposing internals

## 🐛 Common Issues

### "useAuth must be used within AuthProvider"

**Fix:** Ensure AuthProvider wraps your component in `main.tsx`:

```tsx
<AuthProvider>
  <App />
</AuthProvider>
```

### Profile not created after signup

**Check:**
1. Trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
2. Function exists: `SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';`
3. RLS allows insert: Check policies on `profiles` table

**Fix:** Manually create profile or re-run migration 044

### Session not persisting

**Cause:** LocalStorage blocked (private browsing)

**Expected:** User must login each time (by design)

### Admin access denied

**Check:**
1. `user_role = 'admin'` in profiles table
2. Entry exists in `admins` table

**Fix:**
```sql
-- Add to admins table
INSERT INTO public.admins (user_id) VALUES ('user-uuid');

-- Update role
UPDATE public.profiles 
SET user_role = 'admin', is_admin = true 
WHERE id = 'user-uuid';
```

## 📊 Database Queries

### Get Current User Profile

```sql
SELECT * FROM public.profiles
WHERE id = auth.uid();
```

### Check if Current User is Admin

```sql
SELECT EXISTS (
  SELECT 1 FROM public.admins
  WHERE user_id = auth.uid()
) as is_admin;
```

### List All Admins (Admin Only)

```sql
SELECT 
  p.id, p.email, p.full_name,
  a.created_at as admin_since
FROM public.admins a
JOIN public.profiles p ON p.id = a.user_id
ORDER BY a.created_at DESC;
```

### Update Profile

```sql
UPDATE public.profiles
SET 
  full_name = 'New Name',
  phone = '+212612345678',
  updated_at = NOW()
WHERE id = auth.uid();
```

## 🧪 Testing

### Manual Test Checklist

```bash
# 1. Sign up new user
# 2. Check email confirmation (if enabled)
# 3. Sign in
# 4. Access dashboard
# 5. Update profile
# 6. Sign out
# 7. Try accessing protected route (should redirect)
# 8. Sign in again (session should persist)
```

### Test Admin Access

```bash
# 1. Create admin user in DB
INSERT INTO public.admins (user_id) 
VALUES ('user-uuid-from-auth-users');

# 2. Update user_role
UPDATE public.profiles 
SET user_role = 'admin', is_admin = true 
WHERE id = 'user-uuid-from-auth-users';

# 3. Sign in as that user
# 4. Access /admin route (should work)
```

## 📚 Further Reading

- **[AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md)** - Complete auth flow guide (15KB)
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Full schema documentation (15KB)
- **[Supabase Auth Docs](https://supabase.com/docs/guides/auth)** - Official Supabase docs
- **[React Context Docs](https://react.dev/learn/passing-data-deeply-with-context)** - React context best practices

## 🎯 Best Practices Summary

1. **Always check loading state first**
   ```typescript
   if (loading) return <Spinner />;
   ```

2. **Use optional chaining for user properties**
   ```typescript
   const email = user?.email || 'Guest';
   ```

3. **Prefer ProtectedRoute over manual checks**
   ```tsx
   <Route element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
   ```

4. **Use TypeScript types from `/src/types/auth.ts`**
   ```typescript
   import type { Profile, UserRole } from '@/types/auth';
   ```

5. **Never skip RLS policies**
   ```sql
   ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
   ```

6. **Handle errors gracefully**
   ```typescript
   if (error) {
     toast.error('Something went wrong. Please try again.');
     console.error('Auth error:', error);
   }
   ```

---

**Questions?** Check the full documentation in:
- `/docs/AUTH_ARCHITECTURE.md` for auth flow
- `/docs/DATABASE_SCHEMA.md` for database schema
