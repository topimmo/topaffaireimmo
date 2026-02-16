# Unified Authorization System - Executive Summary

## Overview
Implemented a comprehensive, unified authorization system for admin access and moderation across both **properties** and **artisan services** listings in the Supabase/Postgres + React application.

## What Was Changed

### Database Layer (Migration 121)

#### 1. Permission RPC Functions
Created standardized permission checking functions:
- `can_approve_properties()` - Check if user can moderate properties
- `can_approve_services()` - Check if user can moderate services  
- `has_permission(permission_key)` - Generic permission checker for future extensibility

#### 2. Artisan Services Moderation Fields
Added complete moderation workflow to `artisan_services` table:
- `status` - Workflow states: `pending` → `approved`/`rejected`/`inactive`
- `approved_at`, `approved_by` - Approval timestamp and admin reference
- `rejected_at`, `rejected_by` - Rejection timestamp and admin reference
- `moderated_at`, `moderated_by` - Last moderation action tracking
- `rejection_reason` - Text explanation for rejections

#### 3. Enhanced RLS Policies for Services
Updated Row Level Security policies to match properties pattern:
- Public: Read approved services only
- Owners: Full CRUD on own services, cannot approve own services
- Admins: Full access to all services and moderation operations

#### 4. Moderation RPC Functions for Services
Created admin-only functions matching properties workflow:
- `approve_artisan_service(service_id)` - Approve a service
- `reject_artisan_service(service_id, reason)` - Reject with explanation (min 10 chars)
- `submit_artisan_service_for_review(service_id)` - Owner submits for approval

#### 5. Protection Triggers
Implemented trigger function to prevent non-admins from:
- Changing status to 'approved'
- Modifying any moderation fields (approved_at, approved_by, etc.)

#### 6. Performance Indexes
Added indexes for efficient queries:
- `idx_artisan_services_status` - Status filtering
- `idx_artisan_services_approved_at` - Approved listings sorting
- `idx_artisan_services_status_city` - Approved services by location
- `idx_artisan_services_pending` - Admin moderation queue

### Frontend Layer
**No changes required** - existing infrastructure already supports the unified pattern:
- ✅ `useAdmin()` hook already implemented and working
- ✅ `RequireAdmin` component protecting admin routes
- ✅ Error handling for forbidden responses in place
- ✅ Frontend ready to call new RPC functions

## Authorization Pattern (Unified)

### Single Source of Truth
- Admin status determined **exclusively** by `public.admins` table with `is_active = TRUE`
- Frontend and backend **never** use `profiles.user_role` or `profiles.is_admin`
- All authorization checks use `is_admin()` RPC function

### Consistent Workflow for Both Resources

#### Properties Table (Already Existed)
```
draft → pending → approved/rejected → published/archived
```

#### Artisan Services Table (NEW)
```
pending → approved/rejected → inactive
```

### Permission Enforcement

#### Owners (Regular Users)
- ✅ INSERT own records (default status: `pending`)
- ✅ UPDATE/DELETE own records (non-moderation fields)
- ❌ Cannot approve own listings
- ❌ Cannot modify moderation fields
- ❌ Cannot access admin routes

#### Admins (in public.admins with is_active=TRUE)
- ✅ Full access to all properties and services
- ✅ Can approve/reject any listing
- ✅ Can update all moderation fields
- ✅ Can access /dashboard/admin routes
- ✅ Actions logged in audit table (if exists)

#### Inactive Admins (is_active=FALSE)
- ❌ Treated as regular users
- ❌ Cannot approve/reject
- ❌ Cannot access admin routes

## Status Workflow Details

### On Approval
```sql
status = 'approved'
approved_at = NOW()
approved_by = admin_user_id
moderated_at = NOW()
moderated_by = admin_user_id
-- Clear rejection fields
rejected_at = NULL
rejected_by = NULL
rejection_reason = NULL
```

### On Rejection
```sql
status = 'rejected'
rejected_at = NOW()
rejected_by = admin_user_id
rejection_reason = 'admin provided reason'
moderated_at = NOW()
moderated_by = admin_user_id
-- Clear approval fields
approved_at = NULL
approved_by = NULL
```

## Security Features

1. **RLS Enforcement**: All tables have Row Level Security enabled
2. **Trigger Protection**: Prevents unauthorized moderation field changes
3. **SECURITY DEFINER**: All admin RPC functions run with elevated privileges but validate caller
4. **Audit Logging**: Admin actions logged to `admin_audit_logs` (if table exists)
5. **Notifications**: Users notified of status changes (if notifications table exists)

## Verification

Use the provided `ADMIN_ACCESS_VERIFICATION.sql` script to test:
1. Admin status checking
2. Permission function responses
3. RLS policy enforcement
4. RPC function access control
5. Moderation workflow integrity

### Quick Test
```sql
-- As admin user
SELECT public.is_admin(); -- Should return TRUE
SELECT public.can_approve_services(); -- Should return TRUE

-- As regular user  
SELECT public.is_admin(); -- Should return FALSE
SELECT public.approve_artisan_service('some-uuid'); -- Should fail with error
```

## Database Configuration

### Services Table Name
The system uses `public.artisan_services` as the services table. This table was identified from existing migrations and serves as the services listing equivalent to `public.properties`.

**Note**: If a different services table name is needed, update the migration file by replacing `artisan_services` with your table name before running the migration.

## Migration Instructions

1. **Backup your database** before applying changes
2. Run migration: `121_unified_authorization_properties_services.sql`
3. Verify with: `ADMIN_ACCESS_VERIFICATION.sql`
4. Test admin access in frontend `/dashboard/admin`

## Grant/Revoke Admin Access

### Grant Admin
```sql
INSERT INTO public.admins (user_id, is_active, role)
VALUES ('user-uuid-here', TRUE, 'admin');
```

### Revoke Admin
```sql
UPDATE public.admins 
SET is_active = FALSE 
WHERE user_id = 'user-uuid-here';
```

## Frontend Usage

### Check Admin Status
```typescript
import { useAdmin } from '@/hooks/useAdmin';

function MyComponent() {
  const { loading, isAdmin, role } = useAdmin();
  
  if (loading) return <Loader />;
  if (!isAdmin) return <AccessDenied />;
  
  return <AdminPanel />;
}
```

### Protect Admin Routes
```typescript
import { RequireAdmin } from '@/auth/RequireAdmin';

<Route path="/dashboard/admin" element={
  <RequireAdmin>
    <AdminDashboard />
  </RequireAdmin>
} />
```

### Call Moderation RPC
```typescript
// Approve service
const { error } = await supabase
  .rpc('approve_artisan_service', { service_id: 'uuid' });

// Reject service
const { error } = await supabase
  .rpc('reject_artisan_service', { 
    service_id: 'uuid',
    reason: 'Missing required certifications'
  });
```

## Benefits

1. **Consistency**: Same authorization pattern for all moderated resources
2. **Security**: Single source of truth eliminates authorization bypass vulnerabilities
3. **Maintainability**: Centralized permission logic, easy to extend
4. **Auditability**: All moderation actions tracked with timestamps and admin references
5. **Scalability**: Pattern can be extended to additional resource types
6. **User Experience**: Clear feedback via notifications, rejection reasons

## Future Enhancements

The `has_permission(permission_key)` function is designed for future role-based access control:
- Could support granular permissions (e.g., "approve_properties" but not "approve_services")
- Could integrate with a permissions table for complex role hierarchies
- Currently defaults all permissions to admin-only

## Summary

✅ **Complete** unified authorization system implemented  
✅ **Properties** - Already had full moderation workflow  
✅ **Services** - Now has identical moderation workflow  
✅ **Frontend** - Already compatible, no changes needed  
✅ **Security** - Single source of truth enforced everywhere  
✅ **Testing** - Comprehensive verification script provided  
✅ **Documentation** - Complete implementation guide included  

The system is **production-ready** and maintains backward compatibility with existing code while adding robust moderation capabilities for artisan services.
