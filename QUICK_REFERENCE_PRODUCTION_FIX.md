# 🚀 Quick Reference: Production Fixes

## ⚡ TL;DR - Run These in Order

```bash
# 1. Diagnose artisan relationship
psql -f supabase/migrations/115_diagnostic_artisan_relationship.sql

# 2. Fix artisan relationship
psql -f supabase/migrations/116_fix_artisan_profiles_services_relationship.sql

# 3. Diagnose admin auth
psql -f supabase/migrations/117_diagnostic_admin_authentication.sql

# 4. Fix admin auth
psql -f supabase/migrations/118_fix_admin_user_production_safe.sql

# 5. Verify everything
psql -f supabase/migrations/119_complete_verification.sql
```

## 📋 Migration Files Summary

| File | Purpose | Safe? | Required? |
|------|---------|-------|-----------|
| `115_diagnostic_artisan_relationship.sql` | Check relationship status | ✅ Read-only | Yes |
| `116_fix_artisan_profiles_services_relationship.sql` | Add FK between tables | ✅ No data loss | Yes |
| `117_diagnostic_admin_authentication.sql` | Check admin user status | ✅ Read-only | Yes |
| `118_fix_admin_user_production_safe.sql` | Add admin role | ✅ No deletion | Yes |
| `119_complete_verification.sql` | Verify all fixes | ✅ Read-only | Recommended |

## 🎯 Issue 1: Artisan Relationship

### Problem
```
Error: Could not find a relationship between 'artisan_profiles' and 'artisan_services'
```

### What Migration 116 Does
1. ✅ Adds `artisan_profile_id` column
2. ✅ Populates it from existing data
3. ✅ Creates FK constraint
4. ✅ Creates index
5. ✅ Refreshes PostgREST cache

### Expected Outcome
```
✓ artisan_services.artisan_profile_id → artisan_profiles.id
✓ All services linked (0 orphaned)
✓ JOIN queries work
✓ Frontend queries with profiles work
```

### Test Query
```sql
-- This should work after fix:
SELECT 
  s.id,
  s.city,
  p.business_name,
  p.phone
FROM artisan_services s
JOIN artisan_profiles p ON p.id = s.artisan_profile_id
LIMIT 5;
```

## 🔐 Issue 2: Admin Authentication

### Problem
```
Login fails: "Email or password incorrect"
Reset fails: "An error occurred"
Email: contact@topaffaireimmo.com
```

### What Migration 118 Does
1. ✅ Adds user to `admins` table (if exists)
2. ✅ Verifies email confirmation
3. ✅ Lists all admins
4. ℹ️ Provides manual steps if user doesn't exist

### If User Doesn't Exist
**Quick Fix via Supabase Dashboard:**
1. Authentication → Users → Add User
2. Email: `contact@topaffaireimmo.com`
3. Set password
4. ✓ Auto-confirm user
5. Re-run migration 118

### Expected Outcome
```
✓ User exists in auth.users
✓ User in public.admins
✓ Email confirmed
✓ Password set
✓ Not banned
```

### Test
```bash
# Login at /login with:
Email: contact@topaffaireimmo.com
Password: (your password)

# Then visit /admin
Should see: Admin Dashboard ✓
Should NOT see: 403 Forbidden ✗
```

## ✅ Success Indicators

### Artisan Relationship
```
Migration 116 output:
✓ Added artisan_profile_id column to artisan_services
✓ Updated X artisan_services records with profile_id
✓ All services successfully linked to profiles!
✓ PostgREST cache refreshed
```

### Admin Auth
```
Migration 118 output:
✓ Added user to admins table
✓ Admin user email is confirmed

Migration 119 verification:
✓ TEST 6 PASSED: Admin user exists
✓ TEST 7 PASSED: User has admin role
✓ TEST 8 PASSED: Email is confirmed
✓ TEST 9 PASSED: User has password set
✓ TEST 10 PASSED: User is not banned
```

## 🔧 Quick Fixes

### Manually Add Admin Role
```sql
INSERT INTO public.admins (user_id)
SELECT id FROM auth.users WHERE email = 'contact@topaffaireimmo.com'
ON CONFLICT (user_id) DO NOTHING;
```

### Manually Confirm Email
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'contact@topaffaireimmo.com';
```

### Refresh PostgREST Cache
```sql
NOTIFY pgrst, 'reload schema';
```

### Check Applied Migrations
```sql
SELECT version, name 
FROM supabase_migrations.schema_migrations
WHERE version IN ('115', '116', '117', '118', '119')
ORDER BY version;
```

## ⚠️ Common Issues

| Issue | Quick Fix |
|-------|-----------|
| "artisan_profile_id is NULL" | Run migration 116 again |
| "User not found" | Create user via Dashboard first |
| "Email not confirmed" | Confirm via Dashboard or SQL |
| "Password incorrect" | Reset via Dashboard |
| "Still can't login" | Check browser console errors |
| "Password reset email not sent" | Check SMTP settings in Dashboard |

## 🚫 NEVER DO

- ❌ DROP TABLE
- ❌ TRUNCATE
- ❌ DELETE FROM ... (without WHERE)
- ❌ ALTER ... DROP COLUMN
- ❌ Database reset/rebuild
- ❌ Remove RLS policies

## 📞 Need Help?

1. Run verification: `119_complete_verification.sql`
2. Check all tests pass (✓)
3. Check Supabase Dashboard → Logs
4. Check browser console (F12)
5. See full guide: `PRODUCTION_FIX_GUIDE_ARTISAN_AND_AUTH.md`

## 🎉 After Success

- [ ] Artisan services visible in frontend
- [ ] Can query services with profiles
- [ ] Admin can login
- [ ] Admin can access /admin
- [ ] Admin can approve listings
- [ ] Password reset works
- [ ] No errors in console
- [ ] All verification tests pass

---

**Estimated Time:** 5-10 minutes  
**Downtime Required:** None (zero-downtime migrations)  
**Rollback Available:** Yes (safe to revert)
