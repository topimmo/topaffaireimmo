# Production Fix Guide: Artisan Relationship & Admin Authentication

## Executive Summary

This guide provides step-by-step instructions to fix two critical production issues:
1. **Missing relationship between `artisan_profiles` and `artisan_services` tables**
2. **Admin login and password reset failures**

All fixes are **production-safe** and follow strict constraints:
- ✅ No data loss
- ✅ No table drops
- ✅ No database resets
- ✅ Uses only existing migrations
- ✅ Incremental, reversible changes

---

## Issue 1: Artisan Relationship Fix

### Problem
```
Error: Could not find a relationship between 'artisan_profiles' and 'artisan_services' in the schema cache
```

### Root Cause
The `artisan_services` table has `artisan_id` (references `auth.users`) but no direct foreign key to `artisan_profiles` table. PostgREST requires a direct FK relationship to support embedded queries like:

```javascript
.from('artisan_services')
.select('*, artisan_profiles(*)')
```

### Solution Overview
Add `artisan_profile_id` column to `artisan_services` with proper FK constraint.

### Step-by-Step Fix

#### Step 1: Run Diagnostic
```bash
# Connect to Supabase SQL Editor and run:
psql -f supabase/migrations/115_diagnostic_artisan_relationship.sql
```

Expected output:
- ✓ Both tables exist
- ✗ `artisan_profile_id` column missing
- Shows current FK relationships
- Shows row counts

#### Step 2: Apply Fix Migration
```bash
# Run the fix migration
psql -f supabase/migrations/116_fix_artisan_profiles_services_relationship.sql
```

This migration will:
1. Add `artisan_profile_id UUID` column to `artisan_services`
2. Populate it by matching `artisan_id` and `category_id`
3. Add FK constraint: `artisan_services.artisan_profile_id → artisan_profiles.id`
4. Create index on the new column
5. Update unique constraints for data integrity
6. Refresh PostgREST schema cache

Expected output:
```
✓ Added artisan_profile_id column to artisan_services
✓ Updated X artisan_services records with profile_id
✓ Added foreign key constraint
✓ Created new unique constraint
✓ All services successfully linked to profiles!
```

#### Step 3: Verify the Fix
```bash
# Run verification queries
psql -f supabase/migrations/119_complete_verification.sql
```

Look for:
- ✓ TEST 1-5 PASSED
- All services linked to profiles (0 orphaned)
- Sample JOIN query works

#### Step 4: Test in Frontend
```javascript
// This query should now work:
const { data, error } = await supabase
  .from('artisan_services')
  .select(`
    *,
    artisan_profiles(
      business_name,
      description_fr,
      phone
    )
  `)
  .eq('city', 'casablanca');

// Should return services with nested profile data
```

---

## Issue 2: Admin Authentication Fix

### Problem
```
Admin login fails: "Email or password incorrect"
Password reset fails: "An error occurred. Please try again."
Admin email: contact@topaffaireimmo.com
```

### Root Cause (Multiple Possible Causes)
1. User doesn't exist in `auth.users`
2. User exists but not in `public.admins` table
3. Email not confirmed
4. Password not set or incorrect
5. User is banned/blocked
6. SMTP not configured for password reset

### Solution Overview
Diagnose and fix admin user setup, ensure proper role assignment.

### Step-by-Step Fix

#### Step 1: Run Diagnostic
```bash
# Run admin diagnostic
psql -f supabase/migrations/117_diagnostic_admin_authentication.sql
```

This will check:
- User existence in `auth.users`
- Admin role in `public.admins`
- Email confirmation status
- Password hash existence
- Account ban status

#### Step 2: Apply Fix Migration
```bash
# Run admin fix (production safe)
psql -f supabase/migrations/118_fix_admin_user_production_safe.sql
```

This migration will:
1. Add user to `admins` table (if user exists)
2. Verify email confirmation
3. Provide instructions for manual steps if needed
4. List all current admins

**If user doesn't exist**, you'll see:
```
⚠ User contact@topaffaireimmo.com does not exist in auth.users
⚠ Admin user must be created via Supabase Auth dashboard
```

#### Step 3: Create User (If Needed)

**Option A: Via Supabase Dashboard (RECOMMENDED)**
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" or "Invite User"
3. Enter:
   - Email: `contact@topaffaireimmo.com`
   - Password: Choose a secure password
   - ✓ Check "Auto-confirm user"
4. Click "Create User"
5. Re-run migration 118 to add admin role

**Option B: Via SQL (if user self-signed up)**
```sql
-- User already exists but needs admin role
INSERT INTO public.admins (user_id)
SELECT id FROM auth.users WHERE email = 'contact@topaffaireimmo.com'
ON CONFLICT (user_id) DO NOTHING;
```

#### Step 4: Confirm Email (If Needed)
If email is not confirmed:

**Via Dashboard:**
1. Go to Authentication → Users
2. Find `contact@topaffaireimmo.com`
3. Click the user
4. Click "Confirm Email"

**Via SQL:**
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'contact@topaffaireimmo.com'
AND email_confirmed_at IS NULL;
```

#### Step 5: Reset Password (If Needed)

**Via Dashboard:**
1. Go to Authentication → Users
2. Find `contact@topaffaireimmo.com`
3. Click "Reset Password"
4. User will receive reset email (if SMTP is configured)

**Or set password directly:**
1. Click "Edit User"
2. Enter new password
3. Save

#### Step 6: Verify Admin Setup
```bash
# Run complete verification
psql -f supabase/migrations/119_complete_verification.sql
```

Look for:
- ✓ TEST 6: Admin user exists
- ✓ TEST 7: User has admin role
- ✓ TEST 8: Email is confirmed
- ✓ TEST 9: User has password set
- ✓ TEST 10: User is not banned

#### Step 7: Test Login
```bash
# Frontend test:
1. Navigate to /login
2. Email: contact@topaffaireimmo.com
3. Password: (the password you set)
4. Click Login
5. Should redirect to dashboard
6. Navigate to /admin
7. Should see admin panel (not 403)
```

---

## Password Reset Configuration

### Check SMTP Settings

**Via Supabase Dashboard:**
1. Go to Settings → Authentication → Email
2. Verify SMTP settings:
   - SMTP Host
   - SMTP Port
   - SMTP Username
   - SMTP Password
   - From Email Address
3. Test by sending a test email

**Check Email Templates:**
1. Go to Authentication → Email Templates
2. Verify "Confirm Email" is enabled
3. Verify "Reset Password" is enabled
4. Check redirect URLs match your frontend

### Check Auth Configuration

**Site URL:**
```
Settings → Authentication → Site URL
Should be: https://your-production-domain.com
```

**Redirect URLs:**
```
Settings → Authentication → Redirect URLs
Should include:
- https://your-production-domain.com/*
- https://your-production-domain.com/reset-password
- https://your-production-domain.com/auth/callback
```

### Frontend Environment Variables

Verify your frontend has:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Verification Checklist

### Artisan Relationship ✓
- [ ] Migration 115 diagnostic runs successfully
- [ ] Migration 116 fix runs successfully
- [ ] All artisan_services linked to profiles (0 orphaned)
- [ ] JOIN queries work in SQL
- [ ] Frontend queries with embedded profiles work
- [ ] PostgREST cache refreshed

### Admin Authentication ✓
- [ ] Migration 117 diagnostic runs successfully
- [ ] Admin user exists in `auth.users`
- [ ] Admin user exists in `public.admins`
- [ ] Email is confirmed
- [ ] Password is set
- [ ] User is not banned
- [ ] Login works in frontend
- [ ] Admin panel accessible at /admin
- [ ] Admin actions work (approve listings, etc.)

---

## Troubleshooting

### Q: "artisan_profile_id still NULL for some records"
**A:** These are orphaned services with no matching profile. Options:
1. Delete orphaned records (if they're invalid)
2. Create matching profiles for them
3. Leave them (they won't break anything, just won't show in joins)

### Q: "Admin login still fails after fix"
**A:** Check in order:
1. Confirm email is verified (migration 117 output)
2. Reset password via Supabase Dashboard
3. Check for typos in email/password
4. Check browser console for errors
5. Verify RLS policies allow admin access

### Q: "Password reset email not received"
**A:** 
1. Check SMTP settings in Supabase Dashboard
2. Check spam folder
3. Verify email templates are enabled
4. Test SMTP with Supabase "Send Test Email"
5. Check redirect URLs match your domain

### Q: "Can I rollback these changes?"
**A:** Yes, all changes are safe:
- Artisan relationship: Just drop the FK constraint and column
- Admin role: Just delete from `admins` table
- No data is modified or deleted

---

## SQL Quick Reference

### Check Relationship Status
```sql
SELECT 
  COUNT(*) as total_services,
  COUNT(artisan_profile_id) as linked_services,
  COUNT(*) - COUNT(artisan_profile_id) as orphaned
FROM public.artisan_services;
```

### Check Admin Status
```sql
SELECT 
  u.email,
  u.email_confirmed_at IS NOT NULL as confirmed,
  a.user_id IS NOT NULL as is_admin
FROM auth.users u
LEFT JOIN public.admins a ON a.user_id = u.id
WHERE u.email = 'contact@topaffaireimmo.com';
```

### Manually Refresh PostgREST Cache
```sql
NOTIFY pgrst, 'reload schema';
```

### List All Applied Migrations
```sql
SELECT version, name 
FROM supabase_migrations.schema_migrations
WHERE version >= '115'
ORDER BY version;
```

---

## Security Notes

✅ **Safe Operations:**
- Adding columns with NULL allowed
- Adding FK constraints to existing data
- Adding users to admins table
- Confirming emails
- Resetting passwords

🚫 **NEVER DO (Production):**
- DROP TABLE
- TRUNCATE
- DELETE without WHERE clause
- ALTER COLUMN with data type changes
- DISABLE RLS policies
- Reset entire database

---

## Support Contacts

If issues persist after following this guide:
1. Check Supabase Dashboard → Logs
2. Check browser console for errors
3. Review PostgREST logs
4. Contact Supabase support with error details

---

## Summary

These migrations provide:
1. **Diagnostic tools** to identify exact issues
2. **Automated fixes** that are production-safe
3. **Verification queries** to confirm success
4. **Manual instructions** for steps requiring Supabase Dashboard
5. **Rollback procedures** if needed

All changes are:
- Non-destructive
- Incremental
- Verifiable
- Reversible

Follow the steps in order, verify each step, and both issues will be resolved.
