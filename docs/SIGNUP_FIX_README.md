# Signup Database Error Fix - Quick Reference

## Problem

Production website signup page shows: **"Erreur de base de données. Veuillez réessayer."**

## Solution

Migration 045 adds admin whitelist functionality and fixes signup errors.

---

## Quick Start

### 1. Apply Migration

**Via Supabase CLI**:
```bash
cd /path/to/topaffaireimmo
supabase db push
```

**Via Supabase Dashboard**:
1. Go to Database → SQL Editor
2. Copy/paste `supabase/migrations/045_add_admin_whitelist_and_fix_signup.sql`
3. Click "Run"

### 2. Verify Installation

```bash
./scripts/verify-signup-fix.sh
```

### 3. Add Admin Emails

```sql
INSERT INTO public.admin_whitelist (email, notes)
VALUES 
  ('admin@topaffaireimmo.com', 'Primary admin'),
  ('owner@topaffaireimmo.com', 'Business owner')
ON CONFLICT (email) DO NOTHING;
```

### 4. Test Signup

1. **Normal user**: https://topaffaireimmo.com/register
   - Should create `user_role='user'`
   
2. **Whitelisted email**: Use email from whitelist
   - Should create `user_role='admin'`

### 5. Monitor

Check Supabase Dashboard → Database → Logs for any errors.

---

## What This Fixes

✅ **Database error on signup**  
✅ **Missing admin whitelist functionality**  
✅ **Poor error logging in triggers**  
✅ **No deterministic admin role assignment**  

---

## Files Created/Modified

| File | Description |
|------|-------------|
| `supabase/migrations/045_add_admin_whitelist_and_fix_signup.sql` | Main migration script |
| `docs/SIGNUP_ERROR_ROOT_CAUSE_ANALYSIS.md` | Detailed root cause analysis |
| `docs/DEPLOYMENT_GUIDE_SIGNUP_FIX.md` | Step-by-step deployment guide |
| `scripts/verify-signup-fix.sh` | Automated verification script |
| `docs/SIGNUP_FIX_README.md` | This quick reference |

---

## Migration Details

### New Database Objects

1. **Table**: `public.admin_whitelist`
   - Stores whitelisted admin emails
   - RLS enabled (admin-only access)

2. **Function**: `handle_new_user()` (updated)
   - Checks admin whitelist on signup
   - Auto-promotes whitelisted emails to admin
   - Better error logging

3. **Function**: `check_and_promote_admin()` (new)
   - Handles retroactive admin promotion
   - Runs on profile INSERT/UPDATE

4. **Triggers**:
   - `on_auth_user_created` (updated)
   - `on_profile_check_admin_whitelist` (new)

### Role Assignment Logic

```
Non-whitelisted email → user_role = 'user' (or agent/merchant based on announcer_type)
Whitelisted email     → user_role = 'admin', is_admin = true
```

---

## Verification Queries

### Check admin_whitelist exists
```sql
SELECT * FROM public.admin_whitelist;
```

### Check triggers installed
```sql
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgname IN ('on_auth_user_created', 'on_profile_check_admin_whitelist');
```

### Check recent signups
```sql
SELECT u.email, p.user_role, p.is_admin, u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;
```

### Check for orphaned users (no profile)
```sql
SELECT u.id, u.email, u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
```

---

## Troubleshooting

### Issue: Migration fails to apply

**Solution**: Check for syntax errors or existing objects
```sql
-- Check if objects already exist
SELECT * FROM public.admin_whitelist LIMIT 1;

-- Drop and retry if needed
DROP TABLE IF EXISTS public.admin_whitelist CASCADE;
-- Then re-run migration
```

### Issue: Signup still shows database error

**Debug**:
1. Check Supabase Dashboard → Database → Logs
2. Look for trigger errors (NOTICE/WARNING messages)
3. Verify triggers are enabled:
   ```sql
   SELECT tgname, tgenabled FROM pg_trigger 
   WHERE tgrelid IN ('auth.users'::regclass, 'public.profiles'::regclass);
   ```

### Issue: Whitelisted email not promoted to admin

**Debug**:
1. Verify email in whitelist (case-insensitive):
   ```sql
   SELECT * FROM public.admin_whitelist 
   WHERE LOWER(email) = LOWER('admin@example.com');
   ```

2. Check database logs for NOTICE message:
   ```
   "Email admin@example.com is whitelisted, promoting to admin"
   ```

3. Manually update if needed:
   ```sql
   UPDATE public.profiles
   SET user_role = 'admin', is_admin = true, announcer_type = NULL
   WHERE email = 'admin@example.com';
   ```

---

## Environment Variables Checklist

### Required in Vercel

- [ ] `VITE_SUPABASE_URL` - Production Supabase URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Anon key (NOT service_role)
- [ ] `VITE_PRODUCTION_DOMAIN` - https://topaffaireimmo.com

### Security Check

❌ **NEVER** expose service_role key in `VITE_*` variables  
✅ Service role key should only be in Edge Functions secrets

---

## Rollback

If migration causes issues:

```sql
-- 1. Drop new objects
DROP TRIGGER IF EXISTS on_profile_check_admin_whitelist ON public.profiles;
DROP FUNCTION IF EXISTS public.check_and_promote_admin() CASCADE;
DROP TABLE IF EXISTS public.admin_whitelist CASCADE;

-- 2. Restore previous handle_new_user from migration 044
-- (Copy from migration 044 and execute)
```

---

## Success Criteria

After deployment, verify:

- [ ] No "database error" on signup
- [ ] Success message shown: "Compte créé avec succès!"
- [ ] Non-whitelisted emails → `user_role='user'`
- [ ] Whitelisted emails → `user_role='admin'`
- [ ] All new users have profile in `public.profiles`
- [ ] Email confirmation works
- [ ] No errors in Supabase logs

---

## Support

| Issue Type | Resource |
|------------|----------|
| Root cause details | `docs/SIGNUP_ERROR_ROOT_CAUSE_ANALYSIS.md` |
| Deployment steps | `docs/DEPLOYMENT_GUIDE_SIGNUP_FIX.md` |
| Verification | Run `./scripts/verify-signup-fix.sh` |
| Database logs | Supabase Dashboard → Database → Logs |
| Auth logs | Supabase Dashboard → Authentication → Logs |

---

## Timeline

**Migration Date**: [To be filled during deployment]  
**Status**: Ready for deployment  
**Risk Level**: Low (idempotent, includes rollback)  
**Estimated Downtime**: None (hot deployment)  

---

## Next Steps

1. ✅ Review migration script
2. ✅ Read deployment guide
3. ⬜ Apply migration (run `supabase db push`)
4. ⬜ Run verification script
5. ⬜ Add admin emails to whitelist
6. ⬜ Test signup (normal + whitelisted)
7. ⬜ Monitor logs for 24 hours
8. ⬜ Mark as complete

---

**Questions?** Refer to detailed documentation in `/docs/` directory.
