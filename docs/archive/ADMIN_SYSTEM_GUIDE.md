# Admin/User Listing Management System

## Overview

This document describes the clean, secure Admin/User listing management system implemented with Supabase Row Level Security (RLS).

## ✅ Core Principles

1. **NO profile table dependency** - All authorization uses `auth.users` and `admins` table only
2. **RLS-first security** - All permissions enforced server-side via Supabase RLS policies
3. **Simple frontend** - No role checks in frontend code, just authentication status
4. **Clean data model** - `announcer_type` is per-listing, not per-user

## 📊 Database Schema

### Tables

#### `admins` Table
```sql
CREATE TABLE public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
- Used ONLY to identify admin users
- No other user metadata
- Simple boolean: user is in table = admin

#### `properties` Table
Key fields:
- `owner_id` UUID - References `auth.users(id)`, defaults to `auth.uid()`
- `status` TEXT - `pending` | `approved` | `rejected` | `inactive`
- `announcer_type` TEXT - `proprietaire` | `courtier` | `agence` (per listing, NOT per user)

## 🔒 Security (RLS Policies)

### Properties Table Policies

#### SELECT (Read)
1. **Users see their own listings**
   ```sql
   owner_id = auth.uid()
   ```

2. **Admins see ALL listings**
   ```sql
   auth.uid() IN (SELECT user_id FROM public.admins)
   ```

3. **Public sees approved listings**
   ```sql
   status = 'approved'
   ```

#### INSERT (Create)
- **Any authenticated user can create**
  ```sql
  auth.uid() IS NOT NULL AND owner_id = auth.uid()
  ```

#### UPDATE (Edit)
1. **Users update their own listings**
   ```sql
   owner_id = auth.uid()
   ```

2. **Admins update ALL listings**
   ```sql
   auth.uid() IN (SELECT user_id FROM public.admins)
   ```

#### DELETE
- Same logic as UPDATE

### Status Protection Trigger

**CRITICAL**: Only admins can change `status` field

```sql
CREATE TRIGGER protect_property_status_trigger
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION protect_property_status();
```

This trigger prevents non-admin users from changing the status even if they own the property.

### Storage Bucket Policies

#### `property-images` Bucket

**INSERT** (Upload):
```sql
auth.uid() IS NOT NULL AND
(storage.foldername(name))[1] = auth.uid()::text
```

**SELECT** (Read):
- Users read their own images
- Admins read all images
- Public reads all images (for approved property display)

**DELETE**:
- Users delete their own images
- Admins delete all images

## 🎨 Frontend Implementation

### Admin Detection

Use the `useAdmin` hook:

```typescript
import { useAdmin } from '@/hooks/useAdmin';

function MyComponent() {
  const { isAdmin, loading } = useAdmin();
  
  if (loading) return <Loading />;
  
  return (
    <>
      {isAdmin && <AdminLink />}
    </>
  );
}
```

### Permissions (Simplified)

All permissions are now enforced by RLS. Frontend checks are minimal:

```typescript
// Old way (REMOVED):
// if (!canUploadPropertyImages(profile)) { ... }

// New way:
if (!user) {
  alert('You must be logged in');
  return;
}

// RLS will handle the rest!
```

### Protected Routes

**For authenticated users:**
```typescript
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

**For admin-only pages:**
```typescript
<AdminProtectedRoute>
  <AdminDashboard />
</AdminProtectedRoute>
```

## 👥 User Roles Explained

### Normal User
**Can:**
- Create listings (status: pending)
- View their own listings
- Edit their own listings (except status)
- Upload images to their listings
- Delete their own listings

**Cannot:**
- See other users' listings (unless approved)
- Approve/reject listings
- Change status field
- Access admin dashboard

### Admin User
**Can:**
- Everything a normal user can do, PLUS:
- View ALL listings (any status, any owner)
- Approve/reject any listing
- Edit any listing
- Delete any listing
- Access `/admin` dashboard
- Change status field on any property

## 🚀 Setup Instructions

### 1. Run Migrations

```bash
# Apply migration 050 (creates admins table and RLS policies)
npx supabase db push
```

### 2. Create First Admin User

```sql
-- 1. Find user UUID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- 2. Add to admins table
INSERT INTO public.admins (user_id) VALUES ('user-uuid-here');

-- 3. Verify
SELECT a.user_id, u.email 
FROM public.admins a 
JOIN auth.users u ON u.id = a.user_id;
```

### 3. Test the System

1. **As Normal User:**
   - Sign up with a new account
   - Create a listing (should be pending)
   - Check dashboard - should only see own listings
   - Try to access `/admin` - should redirect to home

2. **As Admin:**
   - Sign in with admin account
   - Check header - should see "Administration" link
   - Access `/admin/listings` - should see ALL listings
   - Approve a pending listing
   - Verify normal user can now see it on public pages

## 📝 Common Tasks

### Add More Admins

```sql
-- Get user UUID from their email
SELECT id FROM auth.users WHERE email = 'newadmin@example.com';

-- Add to admins
INSERT INTO public.admins (user_id) VALUES ('uuid-here');
```

### Remove Admin Access

```sql
DELETE FROM public.admins WHERE user_id = 'uuid-here';
```

### Check Who Are Admins

```sql
SELECT u.email, u.created_at, a.created_at as admin_since
FROM public.admins a
JOIN auth.users u ON u.id = a.user_id
ORDER BY a.created_at DESC;
```

### Manually Approve a Listing

```sql
UPDATE public.properties
SET status = 'approved', moderated_by = 'admin-user-id'
WHERE id = 'listing-id';
```

## 🐛 Troubleshooting

### "I can't create a listing"
- Ensure you're logged in
- Check browser console for errors
- Verify RLS policies are applied: `SELECT * FROM pg_policies WHERE tablename = 'properties';`

### "Admin link doesn't appear"
- Verify user is in admins table: `SELECT * FROM public.admins WHERE user_id = 'your-user-id';`
- Clear browser cache and hard reload
- Check browser console for errors in `useAdmin` hook

### "Image upload fails"
- Ensure storage bucket `property-images` exists
- Verify storage policies are correct: `SELECT * FROM pg_policies WHERE tablename = 'objects';`
- Check file size (max 5MB) and type (jpg, png, webp only)

### "Status changes aren't blocked for normal users"
- Verify trigger exists: `SELECT tgname FROM pg_trigger WHERE tgname = 'protect_property_status_trigger';`
- Check if trigger function is correct: `\df protect_property_status`
- Normal users updating their listing should NOT be able to change status field

## 📚 File Reference

### Database
- `supabase/migrations/050_create_admins_table_and_rls.sql` - Main migration
- `supabase/migrations/051_create_admin_user_helper.sql` - Helper script

### Frontend
- `src/hooks/useAdmin.ts` - Admin detection hook
- `src/components/AdminProtectedRoute.tsx` - Admin route protection
- `src/components/ProtectedRoute.tsx` - User route protection
- `src/lib/permissions.ts` - Simplified permissions (mostly removed)
- `src/pages/admin/` - Admin dashboard pages

## ✨ Benefits of This Approach

1. **Security**: Authorization enforced server-side, can't be bypassed
2. **Simplicity**: Frontend doesn't need to know about roles
3. **Flexibility**: Easy to add new admin users without code changes
4. **Performance**: No need to fetch profile data for permission checks
5. **Maintainability**: Clear separation between auth and authorization
6. **Scalability**: RLS policies are evaluated by PostgreSQL, very efficient

## 🔄 Migration from Old System

If you're migrating from the old profile-based system:

1. **Identify existing admins** from profiles table
2. **Insert them into admins table**
3. **Remove profile-based permission checks** from frontend
4. **Update components** to use `useAdmin` hook
5. **Test thoroughly** before deploying

## 🎯 Next Steps

Consider implementing:
- Email notifications when listing is approved/rejected
- Activity log for admin actions
- Bulk operations (approve/reject multiple listings)
- Advanced filtering and search in admin panel
- User management page (view all users, not modify)

---

For questions or issues, check the RLS policies and trigger implementation in migration 050.
