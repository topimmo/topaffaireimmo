# Future Improvements for Role & Announcer Type Flow

This document tracks potential improvements identified during code review that can be addressed in future iterations.

## Code Quality Improvements

### 1. Remove Redundant Condition in Migration (Low Priority)
**File:** `supabase/migrations/044_fix_role_announcer_type_mapping.sql`
**Line:** 71-73
**Issue:** The condition `OR role IN ('admin')` is redundant since admins are already covered by `user_role IN ('admin', 'commercial_advertiser')`
**Fix:** Simplify the condition to avoid duplicate logic
```sql
-- Current (redundant):
WHERE user_role IN ('admin', 'commercial_advertiser')
  OR role IN ('admin');

-- Better:
WHERE user_role IN ('admin', 'commercial_advertiser');
```

### 2. Improve signUp Function Parameter Handling (Medium Priority)
**File:** `src/pages/Register.tsx`
**Line:** 81-82
**Issue:** Function has 7 parameters which can be error-prone
**Fix:** Consider using an options object pattern
```typescript
// Current:
await signUp(email, password, fullName, phone, role, announcerType, companyName);

// Better (options object):
await signUp({
  email,
  password,
  fullName,
  phone,
  role,
  announcerType,
  companyName
});
```

### 3. Extract Role Mapping Logic to Utility (Medium Priority)
**File:** `src/components/ProtectedRoute.tsx`
**Line:** 52-63
**Issue:** Complex role mapping logic is duplicated from `lib/permissions.ts`
**Fix:** Move to `roleMapping.ts` utility
```typescript
// Create in roleMapping.ts:
export function isRoleAllowed(
  userRole: Role | string,
  allowedRoles: string[],
  profile: { announcer_type?: string, advertiser_type?: string }
): boolean {
  // Move mapping logic here
}

// Use in ProtectedRoute:
if (!isRoleAllowed(effectiveRole, allowedRoles, profile)) {
  return <Navigate to="/" replace />;
}
```

### 4. Simplify Null Checks (Low Priority)
**File:** `src/lib/permissions.ts`
**Line:** 95-97
**Issue:** Can use simpler null check
**Fix:**
```typescript
// Current:
if (profile.announcer_type !== null && profile.announcer_type !== undefined)

// Better:
if (profile.announcer_type != null)
```

### 5. Use Constants for Default Values (Low Priority)
**File:** `src/contexts/AuthContext.tsx`
**Line:** 338
**Issue:** Hardcoded 'user' default should use constant
**Fix:**
```typescript
// Add to roleMapping.ts:
export const DEFAULT_ROLE: Role = 'user';
export const DEFAULT_ANNOUNCER_TYPE: AnnouncerType = 'proprietaire';

// Use in AuthContext:
import { DEFAULT_ROLE, mapRoleToUserRole } from '@/lib/roleMapping';
const metadata = {
  role: role || DEFAULT_ROLE,
  announcer_type: announcerType || null,
  ...
}
```

## Feature Enhancements

### 6. Add Role Change Validation (Medium Priority)
When users update their profile, validate that role changes are allowed and consistent with announcer_type.

### 7. Add Migration Verification Script (Low Priority)
Create a script to verify migration 044 was applied correctly:
```typescript
// scripts/verify-role-migration.ts
// Check all users have valid role
// Check announcer_type is consistent with role
// Report any inconsistencies
```

### 8. Add Announcer Type Display in UI (Low Priority)
Show user's announcer type in profile/dashboard for clarity.

### 9. Consider Role-Based Feature Flags (Future)
Instead of hardcoding permissions, use a feature flag system:
```typescript
const features = {
  user: ['view_listings', 'create_listing'],
  agent: ['view_listings', 'create_listing', 'manage_clients'],
  merchant: ['view_listings', 'create_listing', 'agency_dashboard'],
  admin: ['*']
};
```

## Documentation Improvements

### 10. Add JSDoc Comments (Low Priority)
Add comprehensive JSDoc comments to:
- `roleMapping.ts` functions
- `permissions.ts` functions
- Auth context methods

### 11. Create Migration Guide (Low Priority)
Document how to migrate from old role system to new system for other projects.

## Performance Optimizations

### 12. Cache Role Mapping Results (Low Priority)
If role mapping is called frequently, consider memoization:
```typescript
import { memoize } from 'lodash';

export const mapAnnouncerTypeToRole = memoize((announcerType: AnnouncerType): Role => {
  // ... existing logic
});
```

### 13. Optimize Profile Queries (Medium Priority)
When fetching profile, only select needed fields:
```typescript
// Instead of:
.select('*')

// Use:
.select('id, email, role, announcer_type, is_admin')
```

## Testing Improvements

### 14. Add Unit Tests (High Priority)
Create unit tests for:
- `roleMapping.ts` functions
- Permission checking functions
- Protected route logic

### 15. Add E2E Tests (Medium Priority)
Create Playwright/Cypress tests for:
- Complete signup flow for each announcer type
- Login and redirect flow
- Protected route access

### 16. Add Database Migration Tests (Medium Priority)
Test migration 044 with various data scenarios:
- Empty database
- Database with existing users
- Mixed role types

## Security Enhancements

### 17. Add Role Change Audit Log (Future)
Track when user roles change:
```sql
CREATE TABLE role_change_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  old_role TEXT,
  new_role TEXT,
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 18. Add Rate Limiting on Role Changes (Future)
Prevent abuse by limiting how often users can change their announcer type.

## Priority Legend
- **High Priority:** Should be done soon, impacts functionality or security
- **Medium Priority:** Would improve code quality or user experience
- **Low Priority:** Nice to have, minor improvements
- **Future:** Ideas for later consideration

## Next Steps

1. Review this list with team
2. Create GitHub issues for High Priority items
3. Plan Medium Priority items for next sprint
4. Keep Low Priority and Future items in backlog

---

**Note:** These improvements do not block the current PR. The implementation is complete and functional. These are suggestions for future iterations to enhance code quality, maintainability, and user experience.
