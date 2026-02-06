# Admin Authorization Implementation Summary

## Overview
This implementation provides reliable admin authorization for the Vite React application using Supabase's `public.admins` table. The solution ensures admin checks survive page refreshes, handle session changes properly, and avoid false negatives.

## Files Created/Modified

### 1. Database Migration
**File**: `supabase/migrations/063_add_role_to_admins.sql`
- Adds `role` column to `public.admins` table
- Default value: 'admin'
- Updates existing admin records

### 2. Core Hook Implementation
**File**: `src/hooks/useAdmin.ts`
- Main implementation of admin check logic
- Returns: `{ loading, isAdmin, role, error }`
- Features:
  - Uses `.maybeSingle()` to avoid PGRST116 errors
  - Subscribes to auth state changes
  - Prevents state updates after unmount
  - Handles session changes (login/logout/token refresh)

### 3. Structure Compatibility Files
**File**: `src/auth/useAdmin.ts`
- Re-exports the main hook from `src/hooks/useAdmin.ts`
- Maintains clean project structure

**File**: `src/lib/supabaseClient.ts`
- Re-exports the configured Supabase client
- Provides clean import path

### 4. Route Guard Component
**File**: `src/auth/RequireAdmin.tsx`
- Protects admin routes
- Shows loader while checking
- Redirects to /login if no session
- Redirects to / if not admin (with error toast)
- Renders children if admin

## How It Works

### Admin Check Flow
1. Component mounts → `useAdmin` hook initializes
2. Hook calls `supabase.auth.getSession()`
3. If session exists:
   - Query `public.admins` table with `.maybeSingle()`
   - Set `isAdmin = !!data`
   - Store `role` from data
4. Subscribe to `onAuthStateChange`
5. Re-run check on login/logout/token refresh
6. Cleanup subscription on unmount

### Session Management
- Initial check: `supabase.auth.getSession()`
- Continuous monitoring: `onAuthStateChange` subscription
- Survives page refresh via Supabase's session persistence
- No false negatives from race conditions

### Error Handling
- Uses `.maybeSingle()` instead of `.single()`
  - `.single()` throws PGRST116 error when no row found
  - `.maybeSingle()` returns null when no row found
- Gracefully handles network errors
- Prevents granting admin access on error

## Usage

### Using the Hook Directly
\`\`\`typescript
import { useAdmin } from '@/hooks/useAdmin';
// or
import { useAdmin } from '@/auth/useAdmin';

function MyComponent() {
  const { loading, isAdmin, role, error } = useAdmin();
  
  if (loading) return <Loader />;
  if (error) return <Error message={error.message} />;
  
  return isAdmin ? <AdminPanel /> : <AccessDenied />;
}
\`\`\`

### Using the Route Guard
\`\`\`typescript
import { RequireAdmin } from '@/auth/RequireAdmin';

<Route 
  path="/admin/dashboard" 
  element={
    <RequireAdmin>
      <AdminDashboard />
    </RequireAdmin>
  } 
/>
\`\`\`

### Existing Integration
The existing `AdminProtectedRoute` component already uses the updated hook:
\`\`\`typescript
// src/components/AdminProtectedRoute.tsx
const { isAdmin, loading: adminLoading } = useAdmin();
\`\`\`

## Testing the Implementation

### 1. Apply the Migration
Run the migration in Supabase SQL editor or via CLI:
\`\`\`bash
npx supabase db push
\`\`\`

### 2. Create an Admin User
In Supabase SQL editor:
\`\`\`sql
-- Get user ID (after creating/logging in as a user)
SELECT id FROM auth.users WHERE email = 'admin@example.com';

-- Add to admins table
INSERT INTO public.admins (user_id, role) 
VALUES ('your-user-id-here', 'admin');
\`\`\`

### 3. Test Admin Access
1. Log in as admin user
2. Navigate to `/admin` or any admin route
3. Should see admin dashboard
4. Refresh page → should remain on admin page (survives refresh)
5. Log out → should redirect to login
6. Log in as non-admin → should redirect to home with error

### 4. Test RLS Policies
Verify that the RLS policies work correctly:
\`\`\`sql
-- As admin user (in Supabase client)
SELECT * FROM public.admins;  -- Should see all admins

-- As non-admin user
SELECT * FROM public.admins;  -- Should see nothing (RLS blocks)
\`\`\`

## Security Considerations

### RLS Policies
The `public.admins` table has RLS enabled with these policies:
- SELECT: Only admins can view admin list
- INSERT: Only admins can add new admins
- DELETE: Only admins can remove admins

### Admin Check Logic
- Never grants admin access on error (fail-safe)
- Uses authenticated user ID from session
- Queries server-side table (can't be spoofed client-side)
- Respects RLS policies

### Best Practices
1. First admin must be created via service role or before RLS enabled
2. Admin role changes require database update (not client-side)
3. Session validation happens server-side via Supabase
4. Client receives only boolean admin status

## Troubleshooting

### Issue: "User not admin" but user is in admins table
- Check RLS policies are enabled
- Verify user_id in admins table matches auth.users.id
- Check browser console for errors

### Issue: PGRST116 error
- Should not occur with `.maybeSingle()`
- If occurs, check query syntax

### Issue: Admin status not updating after login
- Check `onAuthStateChange` subscription
- Verify session persistence in browser storage
- Check for unmount issues (should be fixed with `isMountedRef`)

### Issue: Infinite redirect loop
- Check for circular dependencies
- Verify `RequireAdmin` vs `AdminProtectedRoute` usage
- Ensure only one guard per route

## Files Summary

| File | Purpose | Type |
|------|---------|------|
| `supabase/migrations/063_add_role_to_admins.sql` | Database schema | Migration |
| `src/hooks/useAdmin.ts` | Core admin check logic | Hook |
| `src/auth/useAdmin.ts` | Re-export for structure | Re-export |
| `src/auth/RequireAdmin.tsx` | Route protection | Component |
| `src/lib/supabaseClient.ts` | Supabase client export | Re-export |

## Next Steps

1. Apply the database migration
2. Create your first admin user
3. Test admin access
4. Update any existing admin checks to use new hook (if needed)
5. Consider adding additional roles (e.g., 'super_admin', 'moderator')

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Supabase configuration
3. Test RLS policies in Supabase dashboard
4. Review migration application status
