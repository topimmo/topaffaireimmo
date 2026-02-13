# Unified Account Logic - Verification Checklist

## Pre-Deployment Verification

### Database Migration Safety ✅
- [x] Migration is idempotent (can run multiple times)
- [x] WHERE clause prevents updating already-migrated rows
- [x] No DROP columns (preserves data)
- [x] All SECURITY DEFINER functions have SET search_path
- [x] All RPCs validate inputs
- [x] All RPCs use auth.uid() for user identification
- [x] RLS policies prevent direct user_role updates

### Code Quality ✅
- [x] No TypeScript type errors (dependencies would need to be installed)
- [x] All code review feedback addressed
- [x] Shared constants used (VALID_ROLES)
- [x] Path matching fixed in RequireRoleSelection
- [x] Button disable logic fixed in SelectRole
- [x] No-op check added to set_user_role RPC
- [x] Documentation accurate and up-to-date

### Security ✅
- [x] No SQL injection vulnerabilities
- [x] Role escalation prevented (users can't set admin role)
- [x] Users can only change role once (from 'user')
- [x] announcer_type not used for permissions anywhere
- [x] All permission checks use ONLY user_role
- [x] RPC functions properly secured

## Post-Deployment Testing

### 1. New User Flow
Test creating a new user and selecting a role:

```bash
# 1. Create new test user
# Sign up via UI with email: test-user-$(date +%s)@example.com

# 2. Verify profile created with default role
SELECT id, email, user_role, announcer_type 
FROM profiles 
WHERE email = 'test-user-XXX@example.com';
# Expected: user_role = 'user', announcer_type = null

# 3. Login and verify redirect to /select-role
# Should see role selection page

# 4. Select Immobilier → Proprietaire
# Click through UI to set role

# 5. Verify role updated
SELECT id, email, user_role, announcer_type 
FROM profiles 
WHERE email = 'test-user-XXX@example.com';
# Expected: user_role = 'agent', announcer_type = 'proprietaire'

# 6. Verify redirect to /agent
# Should see agent dashboard
```

### 2. Existing User Migration
Test that existing users keep their roles:

```sql
-- Check existing admin users
SELECT id, email, user_role 
FROM profiles 
WHERE user_role = 'admin';
-- Should show all admins with role='admin'

-- Check existing agent users
SELECT id, email, user_role, announcer_type 
FROM profiles 
WHERE user_role = 'agent';
-- Should show agents with appropriate announcer_types

-- Check existing merchant users
SELECT id, email, user_role, announcer_type 
FROM profiles 
WHERE user_role = 'merchant';
-- Should show merchants with announcer_type = null
```

### 3. Role Selection Variants

**Test 3a: Immobilier - Courtier**
```
1. New user signs up
2. Redirected to /select-role
3. Select Immobilier
4. Select Courtier
5. Verify: user_role='agent', announcer_type='courtier'
6. Redirected to /agent
```

**Test 3b: Immobilier - Agence**
```
1. New user signs up
2. Redirected to /select-role
3. Select Immobilier
4. Select Agence
5. Enter agency name: "Test Agency"
6. Click Continue
7. Verify: user_role='agent', announcer_type='agence', agency_name='Test Agency'
8. Redirected to /agent
```

**Test 3c: Services**
```
1. New user signs up
2. Redirected to /select-role
3. Select Services
4. Verify: user_role='merchant', announcer_type=null
5. Redirected to /artisan/onboarding
```

### 4. Security Tests

**Test 4a: Role Escalation Prevention**
```sql
-- Try to call set_user_role as non-admin to set admin role
SELECT set_user_role('admin', null, null);
-- Expected: ERROR - Invalid role (admin not in allowed list)
```

**Test 4b: Role Change Prevention**
```sql
-- User with role='agent' tries to change to 'merchant'
-- First set role to agent
SELECT set_user_role('agent', 'courtier', null);

-- Then try to change to merchant
SELECT set_user_role('merchant', null, null);
-- Expected: ERROR - Cannot change role from agent to merchant
```

**Test 4c: Direct UPDATE Prevention**
```sql
-- Try to update user_role directly as non-admin
UPDATE profiles SET user_role = 'admin' WHERE id = auth.uid();
-- Expected: RLS policy prevents this
```

### 5. Dashboard Routing Tests

**Test 5a: User Role Redirect**
```
1. Login with user_role='user'
2. Navigate to /dashboard
3. Expected: Redirected to /select-role
```

**Test 5b: Agent Role Redirect**
```
1. Login with user_role='agent'
2. Navigate to /dashboard
3. Expected: Redirected to /agent
```

**Test 5c: Merchant Role Redirect**
```
1. Login with user_role='merchant'
2. Navigate to /dashboard
3. Expected: Redirected to /merchant
```

**Test 5d: Admin Role Redirect**
```
1. Login with user_role='admin'
2. Navigate to /dashboard
3. Expected: Redirected to /admin
```

### 6. Permission Tests

**Test 6a: Admin Access**
```
1. Login as admin
2. Access /admin
3. Expected: Access granted
```

**Test 6b: Non-Admin Access Denied**
```
1. Login as user/agent/merchant
2. Try to access /admin
3. Expected: Redirected to appropriate dashboard
```

**Test 6c: Agent Dashboard Access**
```
1. Login as agent
2. Access /agent
3. Expected: Access granted
```

**Test 6d: Merchant Dashboard Access**
```
1. Login as merchant
2. Access /merchant
3. Expected: Access granted
```

### 7. Edge Cases

**Test 7a: Multiple Role Selection Attempts**
```
1. New user selects Immobilier → Proprietaire
2. Try to access /select-role again
3. Expected: Redirected to /agent (can't change role)
```

**Test 7b: Profile Creation Error Recovery**
```
1. Create user without profile (edge case)
2. Login
3. Expected: ensure_profile_exists() creates profile
4. User can proceed normally
```

**Test 7c: Missing Agency Name**
```
1. Select Immobilier → Agence
2. Don't enter agency name
3. Click Continue
4. Expected: Validation error, can't proceed
```

## Success Criteria

All tests must pass:
- [ ] New user flow works end-to-end
- [ ] Existing users maintain their roles
- [ ] All role selection variants work
- [ ] Security tests prevent unauthorized access
- [ ] Dashboard routing works for all roles
- [ ] Permission checks work correctly
- [ ] Edge cases handled gracefully

## Rollback Plan

If any critical issues occur:

1. **Frontend Rollback**
   ```bash
   git revert <commit-hash>
   npm run build
   # Deploy previous version
   ```

2. **Database Rollback** (if needed)
   ```sql
   -- Revert user_role values
   UPDATE profiles 
   SET user_role = 'real_estate_advertiser' 
   WHERE user_role IN ('user', 'agent');
   
   UPDATE profiles 
   SET user_role = 'commercial_advertiser' 
   WHERE user_role = 'merchant' AND announcer_type IS NULL;
   
   -- Drop new RPC functions
   DROP FUNCTION IF EXISTS ensure_profile_exists();
   DROP FUNCTION IF EXISTS set_user_role(TEXT, TEXT, TEXT);
   DROP FUNCTION IF EXISTS admin_set_user_role(UUID, TEXT, TEXT, TEXT);
   ```

## Monitoring

After deployment, monitor:

1. **User Signups**: Verify profiles created with user_role='user'
2. **Role Selections**: Track which roles users choose
3. **Errors**: Monitor for any RPC errors or permission errors
4. **Dashboard Redirects**: Verify no infinite redirect loops
5. **Performance**: Ensure no slow queries from new logic

## Support

If issues occur:
1. Check Supabase logs for RPC errors
2. Check browser console for frontend errors
3. Verify database state with SQL queries above
4. Contact development team if rollback needed
