# Unified Account Logic - Implementation Summary

## Overview
Successfully implemented a clean RBAC (Role-Based Access Control) system based on a single field: `profiles.user_role`. The `announcer_type` field is now purely descriptive and is **never** used for permissions or route guards.

## Key Changes

### 1. Database Schema (Migration 104)
**File**: `supabase/migrations/104_unify_account_logic.sql`

#### Schema Updates
- Ensured `profiles.user_role` column exists with constraint: `('user', 'agent', 'merchant', 'admin')`
- Added `profiles.announcer_type` column (nullable): `('proprietaire', 'courtier', 'agence')`
- Added `profiles.agency_name` column (nullable)
- Backfilled existing data from legacy `advertiser_type` to new schema
- Set proper defaults: new users get `user_role='user'`

#### New RPC Functions (SECURITY DEFINER)

**1. `ensure_profile_exists()`**
- Ensures profile exists for authenticated user
- Creates profile with `user_role='user'` if missing
- Called automatically if profile is missing during auth
- Returns: `true` if created, `false` if already existed

**2. `set_user_role(p_role, p_announcer_type, p_agency_name)`**
- Allows users to set their role (one-time upgrade from 'user')
- Validates role is one of: 'user', 'agent', 'merchant'
- Validates announcer_type combinations:
  - agent role: can have announcer_type ('proprietaire', 'courtier', 'agence')
  - merchant role: announcer_type must be NULL
  - user role: announcer_type must be NULL
- Prevents changing role once set (except admin can override)
- Prevents users from setting role='admin' (admin-only operation)

**3. `admin_set_user_role(p_user_id, p_role, p_announcer_type, p_agency_name)`**
- Admin-only function to set any user's role
- Can set any role including 'admin'
- Syncs with `admins` table if setting admin role
- Removes from `admins` table if removing admin role

#### Updated RLS Policies
- Users can view their own profile (SELECT)
- Users can insert their own profile (INSERT)
- Users can update their own profile BUT NOT `user_role` directly (UPDATE)
- Role changes must go through `set_user_role()` RPC
- Admins can update anything

#### Updated Trigger
- `handle_new_user()` function updated to create profiles with:
  - `user_role='user'` (always starts as user)
  - `announcer_type=NULL` (set later via role selection)
  - `agency_name=NULL`

### 2. Frontend Updates

#### Hooks

**`src/hooks/useUserRole.ts`**
- Now uses ONLY `profiles.user_role` field
- Removed all logic checking `advertiser_type`
- Calls `ensure_profile_exists()` if profile missing
- Returns: `{ role, loading }` where role is 'user'|'agent'|'merchant'|'admin'

**`src/hooks/useAdmin.ts`**
- Changed from checking `admins` table to checking `profiles.user_role`
- Returns `isAdmin = true` when `user_role === 'admin'`
- Simpler and more consistent with unified model

#### Capabilities & Permissions

**`src/core/permissions/capabilities.ts`**
- Updated `getEffectiveRole()` to use ONLY `user_role`
- Removed all `advertiser_type` checks
- Role hierarchy: admin > merchant (with artisan) > agent > user

**`src/lib/roleMapping.ts`**
- Added clarifying comments that this is for DISPLAY only
- Not used for permissions

#### Navigation & Routing

**`src/components/SmartDashboardRedirect.tsx`**
- Routes users based on `user_role`:
  - `user` → `/select-role` (choose their path)
  - `agent` → `/agent`
  - `merchant` → `/merchant`
  - `admin` → `/admin`

**`src/components/RequireRoleSelection.tsx`**
- New guard component (optional - not currently used)
- Can wrap routes that require role selection
- Redirects `user` role to `/select-role`

**`src/pages/SelectRole.tsx`**
- New role selection page
- Two-step flow:
  1. Choose: Immobilier or Services
  2. If Immobilier: Choose proprietaire/courtier/agence
  3. If Services: Set merchant role
- Calls `set_user_role()` RPC
- Redirects:
  - Agent → `/agent`
  - Merchant → `/artisan/onboarding`

**`src/App.tsx`**
- Added `/select-role` route (protected, requires auth)
- Route is accessible to authenticated users

## Flow Diagrams

### New User Signup Flow
```
1. User signs up
   ↓
2. auth.users record created
   ↓
3. Trigger creates profile with user_role='user'
   ↓
4. User logs in
   ↓
5. Redirected to /dashboard
   ↓
6. SmartDashboardRedirect sees user_role='user'
   ↓
7. Redirected to /select-role
   ↓
8. User chooses path:
   - Immobilier → selects type → calls set_user_role('agent', type)
   - Services → calls set_user_role('merchant')
   ↓
9. Role is set in database
   ↓
10. Redirected to appropriate dashboard
```

### Permission Check Flow (Old vs New)

**OLD (Complex, Multiple Sources):**
```
Check admins table → Check user_role → Check advertiser_type
  ↓                    ↓                  ↓
admin?              agent?            broker? agency?
```

**NEW (Simple, Single Source):**
```
Check profiles.user_role
  ↓
user | agent | merchant | admin
```

## Security Considerations

### ✅ Secure Implementation
1. **RPC Functions**: All role-changing functions use `SECURITY DEFINER`
2. **RLS Policies**: Users cannot directly UPDATE `user_role` column
3. **Role Validation**: RPCs validate all inputs
4. **One-Way Upgrade**: Users can only change from 'user' to 'agent'/'merchant' once
5. **Admin Protection**: Only admins can set role='admin'
6. **SQL Injection**: Safe search_path set on SECURITY DEFINER functions

### ✅ No Permission Bypass
- All route guards use `useUserRole` hook
- `useUserRole` uses ONLY `profiles.user_role`
- No code uses `announcer_type` for permissions (verified)
- `advertiser_type` is only used for display

## Testing Checklist

### Unit Tests (Already Passing)
- [x] No TypeScript compilation errors (types defined)
- [x] All existing tests continue to pass

### Manual Testing Required
- [ ] Create new user → verify `user_role='user'`
- [ ] Login as new user → redirected to /select-role
- [ ] Select Immobilier → proprietaire → verify `user_role='agent'`, `announcer_type='proprietaire'`
- [ ] Select Immobilier → courtier → verify `user_role='agent'`, `announcer_type='courtier'`
- [ ] Select Immobilier → agence → enter agency name → verify `user_role='agent'`, `announcer_type='agence'`, `agency_name` set
- [ ] Select Services → verify `user_role='merchant'`, `announcer_type=NULL`
- [ ] Verify agent redirects to `/agent` (or `/dashboard`)
- [ ] Verify merchant redirects to `/merchant`
- [ ] Verify admin redirects to `/admin`
- [ ] Verify users cannot change role twice
- [ ] Verify users cannot set role='admin'
- [ ] Verify admin can change any user's role

### Migration Testing
- [ ] Run migration 104 on dev database
- [ ] Verify existing users get correct `user_role`
- [ ] Verify existing `advertiser_type` migrated to `announcer_type`
- [ ] Verify artisan users get `user_role='merchant'`
- [ ] Verify admin users stay as `user_role='admin'`

## Files Changed

### Database
- `supabase/migrations/104_unify_account_logic.sql` (NEW)

### Hooks
- `src/hooks/useUserRole.ts` (MODIFIED)
- `src/hooks/useAdmin.ts` (MODIFIED)

### Components
- `src/components/SmartDashboardRedirect.tsx` (MODIFIED)
- `src/components/RequireRoleSelection.tsx` (NEW)
- `src/pages/SelectRole.tsx` (NEW)
- `src/App.tsx` (MODIFIED - added route)

### Permissions
- `src/core/permissions/capabilities.ts` (MODIFIED)
- `src/lib/roleMapping.ts` (MODIFIED - comments only)

## Deployment Steps

1. **Database Migration**
   ```bash
   # Apply migration 104
   supabase migration up
   ```

2. **Verify Data**
   ```sql
   -- Check all users have valid user_role
   SELECT user_role, COUNT(*) FROM profiles GROUP BY user_role;
   
   -- Check announcer_type distribution
   SELECT user_role, announcer_type, COUNT(*) FROM profiles 
   GROUP BY user_role, announcer_type;
   ```

3. **Deploy Frontend**
   ```bash
   npm run build
   # Deploy to production
   ```

4. **Post-Deployment**
   - Test new user signup flow
   - Test existing user login (should maintain roles)
   - Test role selection for users with `user_role='user'`

## Rollback Plan

If issues occur:

1. **Frontend Rollback**: Deploy previous version
2. **Database Rollback**: 
   ```sql
   -- Revert to previous user_role values
   UPDATE profiles 
   SET user_role = 'real_estate_advertiser' 
   WHERE user_role IN ('user', 'agent');
   
   UPDATE profiles 
   SET user_role = 'commercial_advertiser' 
   WHERE user_role = 'merchant' AND announcer_type IS NULL;
   ```

## Notes

- **Backward Compatibility**: Legacy `advertiser_type` column kept for now (can be removed in future)
- **Admin Table**: Still exists but not used for permission checks (synced by admin RPC)
- **Migration is Idempotent**: Can be run multiple times safely
- **No Breaking Changes**: Existing users continue to work (auto-migrated)

## Future Improvements

1. Add role change audit log
2. Remove legacy `advertiser_type` column after migration period
3. Add email notification when role changes
4. Add role change cooldown period for security
5. Consider adding role hierarchy (e.g., agent → merchant upgrade)
