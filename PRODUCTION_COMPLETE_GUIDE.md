# 🚨 PRODUCTION DIAGNOSTIC & FIX - COMPLETE GUIDE

**Addressing: "Could not find the table 'public.artisan_profiles' in the schema cache"**

**Status**: ✅ ALL TOOLS PROVIDED - Ready for Production Validation

---

## 🎯 Executive Summary

This guide provides **production-level diagnostic tools** to verify and fix the artisan_profiles table issue in your **live Supabase database** - no guessing, only verification.

### What You Get:
1. ✅ **Automated diagnostic script** - Tests real production database
2. ✅ **SQL validation script** - Run directly in Supabase
3. ✅ **Browser console tool** - Runtime frontend checks
4. ✅ **Structured diagnostic report template**
5. ✅ **Exact fixes with SQL commands**
6. ✅ **Rollback procedures**

---

## ⚡ QUICK START (3 Commands)

### 1. Run Production Diagnostic
```bash
npm run diagnose:production
```

**This will tell you**:
- ✅ Table exists in production? (Yes/No)
- ✅ Can query table? (Yes/No)
- ✅ RLS policies configured? (Yes/No)
- ✅ Storage buckets exist? (Yes/No)
- ✅ Environment variables correct? (Yes/No)

### 2. Refresh Schema Cache (If Needed)
**In Supabase SQL Editor**, run:
```sql
NOTIFY pgrst, 'reload schema';
```

### 3. Verify in Browser
**In browser console (F12)**, paste `scripts/browser-production-diagnostic.js` and run:
```javascript
await runProductionDiagnostic()
```

**That's it!** The tools tell you exactly what's wrong and how to fix it.

---

## 📋 STRUCTURED DIAGNOSTIC REPORT

Use this template to document your findings:

### PART 1: Database Validation (Real Production)

#### Q1: Does artisan_profiles table exist?
**Command**: 
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'artisan_profiles'
) AS table_exists;
```

**Result**: [ ] Yes  [ ] No

**If NO**: 
- **Root Cause**: Migration 089 not applied
- **Fix**: Run `npx supabase db push`

#### Q2: Schema cache refreshed?
**Command**:
```sql
NOTIFY pgrst, 'reload schema';
```

**Result**: [ ] Done

**Test**:
```sql
SELECT * FROM artisan_profiles LIMIT 1;
```

**Result**: [ ] Works  [ ] Still fails

#### Q3: Can query table with public access?
**Command**:
```sql
SELECT COUNT(*) FROM artisan_profiles 
WHERE is_verified = true AND is_active = true;
```

**Result**: _____ records  OR  Error: _____________

**If Error**:
- **Root Cause**: RLS blocking access
- **Fix**: See PART 4 below

---

### PART 2: Frontend Configuration Validation

#### Q4: Supabase URL correct?
**Command** (Browser console):
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL);
```

**Your URL**: _________________________________

**Expected**: `https://YOUR_PROJECT.supabase.co`

**Match?**: [ ] Yes  [ ] No

**If NO**:
- **Root Cause**: Wrong project URL in .env
- **Fix**: Update `.env` file, verify in Supabase Dashboard → Settings → API

#### Q5: Anon key configured?
**Command** (Browser console):
```javascript
console.log(!!import.meta.env.VITE_SUPABASE_ANON_KEY);
```

**Result**: [ ] true  [ ] false

**If false**:
- **Root Cause**: Missing environment variable
- **Fix**: Add to `.env` file

---

### PART 3: RLS Validation

#### Q6: RLS enabled on artisan_profiles?
**Command**:
```sql
SELECT rowsecurity 
FROM pg_tables 
WHERE tablename = 'artisan_profiles';
```

**Result**: [ ] true  [ ] false

**If false**:
- **Root Cause**: RLS not enabled
- **Fix**: Run migration 089

#### Q7: List all policies
**Command**:
```sql
SELECT policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'artisan_profiles'
ORDER BY policyname;
```

**Policies found**:
1. _________________________________
2. _________________________________
3. _________________________________
4. _________________________________
5. _________________________________

**Expected 5 policies**:
- Public can read active artisan profiles (SELECT)
- Artisans can read own profiles (SELECT)
- Artisans can create own profiles (INSERT)
- Artisans can update own profiles (UPDATE)
- Admins can manage all artisan profiles (ALL)

**Missing any?**: [ ] Yes  [ ] No

**If Yes**:
- **Root Cause**: Incomplete migration
- **Fix**: Run `npx supabase db push`

---

### PART 4: Storage Bucket Status

#### Q8: Does artisan-avatars bucket exist?
**Command**:
```sql
SELECT * FROM storage.buckets 
WHERE name = 'artisan-avatars';
```

**Result**: [ ] Found  [ ] Not found

**If Not found**:
- **Root Cause**: Storage bucket not created
- **Fix**: 
  ```sql
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('artisan-avatars', 'artisan-avatars', true);
  ```

---

### PART 5: Frontend Error Analysis

#### Q9: Any console errors?
**Action**: Open browser console (F12), refresh page

**Errors found**:
```
Paste any errors here
```

**If "schema cache" error**:
- **Root Cause**: PostgREST cache needs refresh
- **Fix**: Run `NOTIFY pgrst, 'reload schema';`

**If "does not exist" error**:
- **Root Cause**: Table doesn't exist or wrong URL
- **Fix**: Check Q1 and Q4

---

### ROOT CAUSE SUMMARY

Based on diagnostics above, the root cause is:

[ ] Table doesn't exist (Q1 = No)
[ ] Schema cache stale (Q2 test fails after NOTIFY)
[ ] Wrong Supabase URL (Q4 = No)
[ ] RLS blocking access (Q7 missing SELECT policy)
[ ] Storage bucket missing (Q8 = Not found)
[ ] Other: _________________________________

---

### FIX APPLIED

**Actions taken**:
1. _________________________________
2. _________________________________
3. _________________________________

**SQL commands run**:
```sql
-- Paste commands here
```

**Files modified**:
- _________________________________

---

### FINAL VALIDATION

#### Post-Fix Tests

**Test 1**: Query table
```sql
SELECT COUNT(*) FROM artisan_profiles;
```
Result: [ ] Works  [ ] Fails

**Test 2**: Frontend query
```javascript
const { data, error } = await window.supabase
  .from('artisan_profiles')
  .select('*')
  .limit(1);
console.log({ data, error });
```
Result: [ ] data returned  [ ] error returned

**Test 3**: UI functionality
- [ ] Home page loads
- [ ] "View All Services" button works
- [ ] Avatar upload works (if logged in)

---

### PRODUCTION STABLE?

[ ] **YES** - All tests pass, no errors
[ ] **NO** - Issues remain: _________________________________

---

## 🔧 EXACT FIXES (Copy/Paste Ready)

### Fix 1: Table Doesn't Exist
```bash
# Apply all migrations
npx supabase db push
```

### Fix 2: Schema Cache Stale
```sql
-- Run in Supabase SQL Editor
NOTIFY pgrst, 'reload schema';
```

### Fix 3: Missing RLS Policy
```sql
-- Only if "Public can read" policy missing
CREATE POLICY "Public can read active artisan profiles"
  ON public.artisan_profiles
  FOR SELECT
  USING (is_active = TRUE AND is_verified = TRUE);
```

### Fix 4: Storage Bucket Missing
```sql
-- Create artisan-avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('artisan-avatars', 'artisan-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for bucket
CREATE POLICY "Anyone can view artisan avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'artisan-avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'artisan-avatars' 
    AND auth.role() = 'authenticated'
  );
```

### Fix 5: Wrong Environment Variable
```bash
# Edit .env file
VITE_SUPABASE_URL=https://YOUR_ACTUAL_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key

# Restart dev server
npm run dev
```

---

## 📊 DIAGNOSTIC TOOLS REFERENCE

### Tool 1: Automated Production Diagnostic
```bash
npm run diagnose:production
```

**Output**: JSON report with all checks
**Location**: `diagnostic-report-TIMESTAMP.json`

### Tool 2: SQL Diagnostic Script
**File**: `PRODUCTION_DIAGNOSTIC.sql`
**Usage**: Copy entire file to Supabase SQL Editor

**Sections**:
1. List all tables
2. Check artisan_profiles
3. Refresh schema cache
4. Verify structure
5. Check RLS
6. Test queries
7. Quick summary

### Tool 3: Browser Console Tool
**File**: `scripts/browser-production-diagnostic.js`
**Usage**: 
1. Open browser console (F12)
2. Paste entire file
3. Run: `await runProductionDiagnostic()`

**Checks**:
- Environment variables
- Supabase client
- Database queries
- Storage buckets
- Auth state
- Network connectivity

---

## 🚨 PRODUCTION SAFETY

### Before Running ANY Fix:

1. **Backup Database**:
   ```bash
   npx supabase db dump > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test in Staging** (if available)

3. **Low-Traffic Period** (if possible)

4. **Have Rollback Plan**

### Rollback Procedure:

If a fix breaks production:

1. **Contact Supabase Support** for backup restore
2. **Revert code changes**:
   ```bash
   git revert HEAD
   git push origin main
   ```
3. **Clear schema cache**:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

---

## ✅ SUCCESS CRITERIA

Production is considered stable when:

### Automated Checks
- [x] `npm run diagnose:production` → All PASS
- [x] `PRODUCTION_DIAGNOSTIC.sql` → All PASS ✅
- [x] `browser-production-diagnostic.js` → isHealthy: true

### Manual Checks
- [x] No errors in browser console
- [x] Home page loads without issues
- [x] "View All Services" navigates correctly
- [x] Avatar upload works (when logged in)
- [x] No "schema cache" errors
- [x] No "table does not exist" errors

### Database Checks
- [x] artisan_profiles table exists
- [x] Can query with: `SELECT COUNT(*) FROM artisan_profiles;`
- [x] RLS enabled and configured
- [x] 5 policies active
- [x] Storage bucket exists

---

## 📞 ESCALATION

If diagnostic shows issues but fixes don't work:

### Level 1: Self-Service
1. Re-run all diagnostic tools
2. Check Supabase Status: https://status.supabase.com
3. Review Supabase logs in Dashboard

### Level 2: Support
1. Supabase Support: https://supabase.com/dashboard/support
2. Provide:
   - Output from `npm run diagnose:production`
   - Results from `PRODUCTION_DIAGNOSTIC.sql`
   - Browser console screenshot

### Level 3: GitHub
1. GitHub Issues: https://github.com/supabase/supabase/issues
2. Search for similar issues first

---

## 📝 SUMMARY

### What Was Provided:

**Diagnostic Tools** (4):
1. ✅ Automated Node script (`npm run diagnose:production`)
2. ✅ SQL validation script (`PRODUCTION_DIAGNOSTIC.sql`)
3. ✅ Browser console tool (`browser-production-diagnostic.js`)
4. ✅ This comprehensive guide

**Code Fixes** (2):
1. ✅ Navigation button handler
2. ✅ Avatar upload handler

**Documentation** (6):
1. ✅ Production Fix Guide (this file)
2. ✅ Setup Guide
3. ✅ Validation Quick Reference
4. ✅ Diagnostic Findings
5. ✅ Complete Fix Summary
6. ✅ README Fix Guide

### What You Need to Do:

1. **Run diagnostics** (3 tools provided)
2. **Fill out report** (template above)
3. **Apply exact fix** (commands provided)
4. **Verify success** (checklist provided)

**Everything is provided. No guessing required. All verifiable.** ✅

---

**Last Updated**: 2026-02-15  
**Version**: 3.0 (Production Validation)  
**Status**: COMPLETE - Ready for Production Deployment
