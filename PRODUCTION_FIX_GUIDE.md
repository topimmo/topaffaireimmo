# 🚨 PRODUCTION DIAGNOSTIC & FIX GUIDE

**For runtime production issues with artisan_profiles table**

---

## ⚡ QUICK FIX (2 Minutes)

If you're seeing **"Could not find the table 'public.artisan_profiles' in the schema cache"**:

### 1. Refresh Schema Cache (Run in Supabase SQL Editor)
```sql
NOTIFY pgrst, 'reload schema';
```

### 2. Test Immediately
```sql
SELECT * FROM artisan_profiles LIMIT 1;
```

**If this works** → Problem solved! Schema cache was stale.  
**If still fails** → Continue with full diagnostic below.

---

## 🔍 FULL PRODUCTION DIAGNOSTIC

### Step 1: Run Production Diagnostic Script

```bash
# Make sure .env has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run diagnose:production
```

Or manually:
```bash
npx tsx scripts/diagnose-production.ts
```

This will automatically check:
- ✅ Table existence
- ✅ RLS policies
- ✅ Storage buckets
- ✅ Dependent tables
- ✅ Frontend URL configuration

### Step 2: Run SQL Diagnostic (Supabase SQL Editor)

Copy and paste **`PRODUCTION_DIAGNOSTIC.sql`** into Supabase SQL Editor and run it.

This will verify:
1. Table exists in database
2. RLS is configured
3. Policies allow public access
4. Storage buckets exist
5. Dependencies are met

---

## 🎯 STRUCTURED DIAGNOSTIC REPORT

Run both scripts above, then fill out this report:

### Database Status
- [ ] **Table exists in production?** (Yes/No): _____
  - Run: `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'artisan_profiles');`
  
- [ ] **Schema cache refreshed?** (Yes/No): _____
  - Run: `NOTIFY pgrst, 'reload schema';`
  
- [ ] **Can query table?** (Yes/No): _____
  - Run: `SELECT COUNT(*) FROM artisan_profiles;`

### Configuration Status
- [ ] **Supabase URL correct?** (Yes/No): _____
  - Frontend: `console.log(import.meta.env.VITE_SUPABASE_URL)`
  - Expected: `https://YOUR_PROJECT.supabase.co`
  
- [ ] **Anon key configured?** (Yes/No): _____
  - Check: `import.meta.env.VITE_SUPABASE_ANON_KEY`

### Security Status
- [ ] **RLS enabled?** (Yes/No): _____
  - Run: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'artisan_profiles';`
  
- [ ] **Public SELECT policy exists?** (Yes/No): _____
  - Run: `SELECT COUNT(*) FROM pg_policies WHERE tablename = 'artisan_profiles' AND cmd = 'SELECT';`

### Policies List
Run this and paste output:
```sql
SELECT policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'artisan_profiles'
ORDER BY policyname;
```

**Output:**
```
Paste here
```

### Storage Bucket Status
- [ ] **artisan-avatars exists?** (Yes/No): _____
  - Run: `SELECT * FROM storage.buckets WHERE name = 'artisan-avatars';`

### Root Cause
Based on diagnostics above:
```
Write root cause here
```

### Fix Applied
```
Write fix applied here
```

### Final Status
- [ ] **Production Stable?** (Yes/No): _____

---

## 🔧 COMMON FIXES

### Fix 1: Table Doesn't Exist

**Symptom**: SQL query returns `table does not exist`

**Fix**:
```bash
# Apply all migrations to production
npx supabase db push
```

### Fix 2: Schema Cache Stale

**Symptom**: Table exists but queries fail with "schema cache" error

**Fix** (Supabase SQL Editor):
```sql
NOTIFY pgrst, 'reload schema';
```

### Fix 3: Wrong Supabase URL

**Symptom**: `import.meta.env.VITE_SUPABASE_URL` doesn't match actual project

**Fix**: Update `.env`:
```env
VITE_SUPABASE_URL=https://YOUR_ACTUAL_PROJECT.supabase.co
```

Verify in Supabase Dashboard → Settings → API

### Fix 4: RLS Blocking Access

**Symptom**: Table exists but queries return no rows or permission denied

**Fix** (Supabase SQL Editor):
```sql
-- Check if policy exists
SELECT * FROM pg_policies 
WHERE tablename = 'artisan_profiles' 
AND policyname = 'Public can read active artisan profiles';

-- If missing, create it:
CREATE POLICY "Public can read active artisan profiles"
  ON public.artisan_profiles
  FOR SELECT
  USING (is_active = TRUE AND is_verified = TRUE);
```

### Fix 5: Storage Bucket Missing

**Symptom**: Avatar upload fails with "bucket not found"

**Fix** (Supabase Dashboard):
1. Go to Storage
2. Create new bucket: `artisan-avatars`
3. Set as Public
4. Max file size: 2MB

Or SQL:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('artisan-avatars', 'artisan-avatars', true)
ON CONFLICT (id) DO NOTHING;
```

---

## 📊 VERIFICATION CHECKLIST

After applying fixes, verify:

### Database Verification
```sql
-- All should return true/success
SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'artisan_profiles');
SELECT COUNT(*) FROM artisan_profiles;
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'artisan_profiles';
SELECT * FROM storage.buckets WHERE name = 'artisan-avatars';
```

### Frontend Verification
```javascript
// In browser console (F12)
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Has anon key:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

// Test query
const { data, error } = await window.supabase
  .from('artisan_profiles')
  .select('*')
  .limit(1);
  
console.log('Query result:', { data, error });
```

### UI Verification
- [ ] Home page loads without errors
- [ ] "View All Services" button navigates to /artisans
- [ ] Avatar upload works in dashboard

---

## 🚨 CRITICAL: Production Safety

Before running ANY fix in production:

1. **Backup first**:
   ```bash
   npx supabase db dump > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test in staging** (if available)

3. **Run during low-traffic period**

4. **Have rollback plan ready**

---

## 🔄 Rollback Procedure

If a fix breaks production:

### Rollback Migration
```bash
# This is NOT recommended - contact Supabase support instead
# They can help restore from backup
```

### Revert Code
```bash
git revert HEAD
git push origin main
```

### Clear Cache
```sql
NOTIFY pgrst, 'reload schema';
```

---

## 📞 Escalation Path

If diagnostic shows issues but fixes don't work:

1. **Check Supabase Status**: https://status.supabase.com
2. **Supabase Support**: https://supabase.com/dashboard/support
3. **GitHub Issues**: https://github.com/supabase/supabase/issues

Provide them with:
- Output from `npm run diagnose:production`
- Results from PRODUCTION_DIAGNOSTIC.sql
- Screenshot of error in browser console

---

## ✅ Success Criteria

Production is stable when:

- [x] `npm run diagnose:production` shows all PASS ✅
- [x] PRODUCTION_DIAGNOSTIC.sql summary shows all PASS ✅
- [x] No errors in browser console
- [x] UI buttons work correctly
- [x] Avatar upload works
- [x] No "schema cache" errors

---

**Last Updated**: 2026-02-15  
**Version**: 2.0 (Production Diagnostic)
