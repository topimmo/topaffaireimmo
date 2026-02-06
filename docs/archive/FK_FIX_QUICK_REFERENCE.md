# FK Constraint Fix - Quick Reference Card

## 🚨 The Problem

```sql
INSERT INTO public.admins (user_id) VALUES ('5c10a187-ad0d-4e94-91f6-fa526a9e97a3');

ERROR: Key (user_id)=(5c10a187...) is not present in table "users"
```

But user EXISTS in `auth.users` ✅

**Cause:** Duplicate FK constraints, one references wrong table

---

## 🔍 Quick Diagnosis (30 seconds)

```sql
-- How many FK constraints exist?
SELECT COUNT(*) FROM pg_constraint 
WHERE conrelid = 'public.admins'::regclass AND contype = 'f';
-- Expected: 1, Actual: 2 (duplicate!)

-- What do they reference?
SELECT conname, confrelid::regclass 
FROM pg_constraint 
WHERE conrelid = 'public.admins'::regclass AND contype = 'f';
-- Expected: 1 row with auth.users
-- Actual: 2 rows, one might show wrong table
```

---

## ⚡ Quick Fix (2 minutes)

```sql
-- Drop duplicates
ALTER TABLE public.admins DROP CONSTRAINT IF EXISTS admins_user_id_fkey;
ALTER TABLE public.admins DROP CONSTRAINT IF EXISTS admins_user_id_fkey2;

-- Recreate correctly
ALTER TABLE public.admins 
  ADD CONSTRAINT admins_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

Or use migration: `supabase/migrations/062_fix_duplicate_fk_admins.sql`

---

## ✅ Quick Verify (1 minute)

```sql
-- 1. Only 1 FK exists
SELECT COUNT(*) FROM pg_constraint 
WHERE conrelid = 'public.admins'::regclass AND contype = 'f';
-- Must return: 1

-- 2. References auth.users
SELECT confrelid::regclass FROM pg_constraint 
WHERE conname = 'admins_user_id_fkey';
-- Must return: auth.users

-- 3. Test insert
INSERT INTO public.admins (user_id) 
VALUES ('5c10a187-ad0d-4e94-91f6-fa526a9e97a3')
ON CONFLICT DO NOTHING;
-- Must succeed ✅
```

---

## 📁 Complete Files

| What | File | Size |
|------|------|------|
| **Main Guide** | FK_CONSTRAINT_FIX_README.md | 10KB |
| **Diagnostic** | docs/FK_CONSTRAINT_DIAGNOSTIC.sql | 8.7KB |
| **Fix** | supabase/migrations/062_fix_duplicate_fk_admins.sql | 11KB |
| **Verify** | docs/FK_CONSTRAINT_VERIFICATION.sql | 10.6KB |
| **Design** | docs/FK_DESIGN_GUIDE_AUTH_VS_PROFILES.md | 10.3KB |
| **Summary** | FK_FIX_DELIVERY_SUMMARY.md | 10.8KB |

---

## 🎯 Success Checklist

After fix, all must be ✅:

- [ ] 1 FK constraint (not 2)
- [ ] FK → auth.users(id)
- [ ] ON DELETE CASCADE
- [ ] INSERT works for valid user
- [ ] INSERT fails for invalid user (but with clear error)
- [ ] No orphan rows

---

## 🆘 Troubleshooting

**Still failing?**
1. Check user exists: `SELECT * FROM auth.users WHERE id = 'your-uuid'`
2. Check FK: `SELECT confrelid::regclass FROM pg_constraint WHERE conname = 'admins_user_id_fkey'`
3. Look for orphans: `SELECT * FROM public.admins a WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = a.user_id)`

**Orphans found?**
```sql
DELETE FROM public.admins 
WHERE user_id NOT IN (SELECT id FROM auth.users);
```

---

## 💡 Key Insight

**Always reference auth.users for:**
- Identity (who the user is)
- Ownership (who owns this resource)
- Authorization (is this user an admin?)
- Audit trails (who did this action?)

**Why not profiles?**
- Profile creation might be delayed (trigger timing)
- Auth.users is single source of truth
- RLS policies use auth.uid() (from auth.users)
- Simpler, more reliable

---

## ⏱️ Time Estimates

- Diagnosis: 5 minutes
- Apply fix: 2 minutes
- Verification: 5 minutes
- Testing: 2 minutes
- **Total: 15 minutes**

---

## 📞 Need Help?

1. **Read:** FK_CONSTRAINT_FIX_README.md (complete guide)
2. **Run:** Diagnostic queries (FK_CONSTRAINT_DIAGNOSTIC.sql)
3. **Review:** Design guide (FK_DESIGN_GUIDE_AUTH_VS_PROFILES.md)
4. **Check:** Verification scripts (FK_CONSTRAINT_VERIFICATION.sql)

---

## 🔗 Related Issues

- Migration 061: Fixed same issue on properties.owner_id
- Migration 050: Created admins table (initial)
- RLS policies: Use auth.uid() (aligns with auth.users)

---

**Quick Start:** Run diagnostic → Apply 062 → Verify → Test ✅

**Status:** Production Ready | **Migration:** 062 | **Last Updated:** 2026-02-01
