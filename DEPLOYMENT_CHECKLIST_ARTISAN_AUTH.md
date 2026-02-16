# 🚀 Production Deployment Checklist - Artisan & Auth Fixes

## Pre-Deployment Checklist

### 1. Backup
- [ ] Create database backup via Supabase Dashboard
  - Go to Database → Backups
  - Click "Create Backup"
  - Wait for backup to complete
  - Note backup ID/timestamp

### 2. Review Migrations
- [ ] Review migration files in `supabase/migrations/`:
  - `115_diagnostic_artisan_relationship.sql`
  - `116_fix_artisan_profiles_services_relationship.sql`
  - `117_diagnostic_admin_authentication.sql`
  - `118_fix_admin_user_production_safe.sql`
  - `119_complete_verification.sql`
- [ ] Confirm no DROP TABLE or TRUNCATE statements
- [ ] Confirm all use IF NOT EXISTS patterns
- [ ] Confirm no data deletion

### 3. Verify Access
- [ ] Confirm Supabase Dashboard access
- [ ] Confirm database connection details
- [ ] Confirm admin email: `contact@topaffaireimmo.com`

---

## Deployment Steps

### Phase 1: Diagnostic (Read-only)

#### Step 1.1: Run Artisan Diagnostic
```bash
# Via Supabase SQL Editor
# Copy/paste: supabase/migrations/115_diagnostic_artisan_relationship.sql
```

**Expected output:**
```
✓ artisan_profiles table exists
✓ artisan_services table exists
✗ artisan_services.artisan_profile_id MISSING
```

- [ ] Diagnostic runs without errors
- [ ] Confirms artisan_profile_id is missing
- [ ] Note row counts: ___ profiles, ___ services

#### Step 1.2: Run Admin Diagnostic
```bash
# Via Supabase SQL Editor
# Copy/paste: supabase/migrations/117_diagnostic_admin_authentication.sql
```

**Check output for:**
- [ ] User exists OR user needs creation
- [ ] User in admins table OR needs to be added
- [ ] Email confirmed OR needs confirmation
- [ ] Password set OR needs reset

### Phase 2: Apply Fixes

#### Step 2.1: Fix Artisan Relationship
```bash
# Via Supabase SQL Editor
# Copy/paste: supabase/migrations/116_fix_artisan_profiles_services_relationship.sql
```

**Wait for completion, then verify:**
- [ ] Migration completes without errors
- [ ] See: "✓ Added artisan_profile_id column"
- [ ] See: "✓ Updated X records with profile_id"
- [ ] See: "✓ All services successfully linked"
- [ ] Note: ___ services linked, ___ orphaned

**If orphaned services exist:**
- [ ] Investigate orphaned records (optional)
- [ ] Document for later cleanup (optional)

#### Step 2.2: Fix Admin User
```bash
# Via Supabase SQL Editor
# Copy/paste: supabase/migrations/118_fix_admin_user_production_safe.sql
```

**Check output:**
- [ ] Migration completes without errors
- [ ] User added to admins table OR already exists
- [ ] Email confirmation status noted

**If user doesn't exist:**
- [ ] Go to Supabase Dashboard → Authentication → Users
- [ ] Click "Add User"
- [ ] Email: `contact@topaffaireimmo.com`
- [ ] Set secure password
- [ ] ✓ Auto-confirm email
- [ ] Click "Create User"
- [ ] Re-run migration 118

**If email not confirmed:**
- [ ] Go to Supabase Dashboard → Authentication → Users
- [ ] Find user
- [ ] Click "Confirm Email"

**If password needs reset:**
- [ ] Go to Supabase Dashboard → Authentication → Users
- [ ] Find user
- [ ] Click "Reset Password" OR set new password

### Phase 3: Verification

#### Step 3.1: Run Full Verification
```bash
# Via Supabase SQL Editor
# Copy/paste: supabase/migrations/119_complete_verification.sql
```

**Check all tests pass:**
- [ ] ✓ TEST 1: artisan_profile_id column exists
- [ ] ✓ TEST 2: Foreign key constraint exists
- [ ] ✓ TEST 3: Index exists
- [ ] ✓ TEST 4: All services linked (0 orphaned)
- [ ] ✓ TEST 5: JOIN query works
- [ ] ✓ TEST 6: Admin user exists
- [ ] ✓ TEST 7: User has admin role
- [ ] ✓ TEST 8: Email confirmed
- [ ] ✓ TEST 9: Password set
- [ ] ✓ TEST 10: User not banned

**If any test fails:**
- [ ] Review failure message
- [ ] Re-run appropriate fix migration
- [ ] Re-run verification

#### Step 3.2: Run Test Queries
```bash
# Via Supabase SQL Editor
# Copy/paste: supabase/PRODUCTION_TEST_QUERIES.sql
```

- [ ] All 10 tests complete successfully
- [ ] JOIN queries return data
- [ ] PostgREST-style query works
- [ ] Admin user shows "✓ IS ADMIN"

#### Step 3.3: Refresh PostgREST Cache
```sql
NOTIFY pgrst, 'reload schema';
```

- [ ] Command executed successfully
- [ ] Wait 5-10 seconds for cache refresh

### Phase 4: Frontend Testing

#### Step 4.1: Test Admin Login
1. Navigate to: `https://your-domain.com/login`
2. Enter:
   - Email: `contact@topaffaireimmo.com`
   - Password: (password you set)
3. Click "Login"

- [ ] Login succeeds (no errors)
- [ ] Redirected to dashboard
- [ ] No console errors (F12)

#### Step 4.2: Test Admin Panel Access
1. Navigate to: `https://your-domain.com/admin`

- [ ] Admin panel loads (not 403)
- [ ] Can see admin features
- [ ] Can view all properties
- [ ] No console errors

#### Step 4.3: Test Admin Actions
- [ ] Can approve a listing
- [ ] Can reject a listing
- [ ] Can view admin notifications
- [ ] All admin features work

#### Step 4.4: Test Password Reset (Optional)
1. Logout
2. Navigate to: `https://your-domain.com/forgot-password`
3. Enter: `contact@topaffaireimmo.com`
4. Click "Reset Password"

- [ ] No errors shown
- [ ] Check email inbox (may take a few minutes)
- [ ] Reset email received
- [ ] Can reset password successfully

#### Step 4.5: Test Artisan Services
1. Navigate to: `https://your-domain.com/services` (or wherever artisans are shown)

- [ ] Artisan profiles load
- [ ] Services display correctly
- [ ] No console errors about relationships
- [ ] Can filter by category
- [ ] Can view artisan details

---

## Post-Deployment Checklist

### 1. Monitor for Errors
- [ ] Check Supabase Dashboard → Logs for errors (15 minutes)
- [ ] Check frontend Sentry/error logs (if configured)
- [ ] Check browser console on key pages
- [ ] Monitor for user reports

### 2. Verify Data Integrity
```sql
-- Run in SQL Editor
SELECT 
  (SELECT COUNT(*) FROM artisan_profiles) as profiles,
  (SELECT COUNT(*) FROM artisan_services) as services,
  (SELECT COUNT(*) FROM artisan_services WHERE artisan_profile_id IS NOT NULL) as linked,
  (SELECT COUNT(*) FROM admins) as admin_count;
```

- [ ] Row counts match pre-deployment counts
- [ ] No unexpected data loss
- [ ] All services linked to profiles

### 3. Document Results
- [ ] Note deployment timestamp: _______________
- [ ] Note any issues encountered: _______________
- [ ] Note any orphaned records: _______________
- [ ] Note admin user creation method: _______________

### 4. Update Types (If Frontend Needs)
If frontend TypeScript types need updating:

```bash
# Locally, after migrations applied to production
npm run types:supabase
```

- [ ] Types regenerated (if needed)
- [ ] Types committed and pushed
- [ ] Frontend redeployed (if needed)

---

## Rollback Plan (If Needed)

### If Something Goes Wrong

#### Option 1: Restore from Backup
1. Go to Supabase Dashboard → Database → Backups
2. Select backup from pre-deployment
3. Click "Restore"
4. Wait for restore to complete
5. Test application

#### Option 2: Manual Rollback (Partial)

**Rollback artisan relationship:**
```sql
-- Remove FK constraint
ALTER TABLE artisan_services 
DROP CONSTRAINT IF EXISTS artisan_services_profile_id_fkey;

-- Drop index
DROP INDEX IF EXISTS idx_artisan_services_profile_id;

-- Drop column (data will be lost!)
ALTER TABLE artisan_services 
DROP COLUMN IF EXISTS artisan_profile_id;
```

**Rollback admin user:**
```sql
-- Remove from admins table
DELETE FROM public.admins 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'contact@topaffaireimmo.com'
);
```

**Note:** Manual rollback is NOT recommended. Use backup restore instead.

---

## Success Criteria

Deployment is successful when:

- ✅ All migrations applied without errors
- ✅ All verification tests pass
- ✅ Admin can login successfully
- ✅ Admin panel accessible
- ✅ Artisan services display correctly
- ✅ No console errors
- ✅ No data loss
- ✅ All features working as before

---

## Common Issues & Solutions

### Issue: "Migration already applied"
**Solution:** Migration includes IF NOT EXISTS checks, safe to re-run.

### Issue: "artisan_profile_id still NULL"
**Solution:** 
- Check if profiles exist for those services
- These are orphaned records
- Can be cleaned up later

### Issue: "User still can't login"
**Solution:**
- Verify password is correct
- Reset password via Dashboard
- Check user is not banned
- Verify email is confirmed

### Issue: "PostgREST not detecting relationship"
**Solution:**
```sql
NOTIFY pgrst, 'reload schema';
```
Wait 10 seconds and try again.

---

## Contact Information

**Supabase Support:** https://supabase.com/support  
**Project Dashboard:** [Your Supabase Dashboard URL]  
**Documentation:** See `PRODUCTION_FIX_GUIDE_ARTISAN_AND_AUTH.md`

---

## Sign-off

- [ ] Deployment completed successfully
- [ ] All tests passed
- [ ] No errors in production
- [ ] Users can login and use admin panel
- [ ] Artisan services working correctly

**Deployed by:** _______________  
**Date:** _______________  
**Time:** _______________  
**Notes:** _______________
