# Supabase Database Fixes

This directory contains SQL scripts to fix issues identified in the Supabase Audit Report.

## 🚨 CRITICAL FIXES (Execute First)

### Fix 005: Create First Admin User
**File:** `005_create_first_admin.sql`  
**Priority:** CRITICAL  
**Impact:** Without this, admin panel is inaccessible

**How to Execute:**
1. Open Supabase Dashboard → SQL Editor
2. Open `005_create_first_admin.sql`
3. Replace `'your-email@example.com'` with your email
4. Run the query
5. Verify admin was created

---

### Fix 001: Storage Policies - Remove Broken References
**File:** `001_fix_storage_policies.sql`  
**Priority:** CRITICAL  
**Impact:** Image uploads FAIL without this fix

**Issue:** Policies reference deleted columns (`user_role`, `advertiser_type`)

**How to Execute:**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `001_fix_storage_policies.sql`
3. Paste and run
4. Check output shows 3 new policies created

**Verify:**
- Try uploading property image in app
- Should succeed without database errors

---

### Fix 002: Storage Security - Remove Public Access
**File:** `002_fix_storage_security.sql`  
**Priority:** HIGH (Security Issue)  
**Impact:** Unapproved property images are publicly visible

**Options:**
- **Option A (Recommended):** Strict security - only approved property images are public
- **Option B:** Keep public access (temporary workaround)

**How to Execute:**
1. Open Supabase Dashboard → SQL Editor
2. Copy the desired option from `002_fix_storage_security.sql`
3. Paste and run
4. If using Option A, update frontend to populate `property_images` table

**Verify:**
- Try accessing unapproved property image URL in incognito
- Option A: Should fail (403)
- Option B: Should load

---

## 📋 RECOMMENDED FIXES

### Fix 003: Add RLS Policies for Banner Tables
**File:** `003_add_banner_rls_policies.sql`  
**Priority:** HIGH  
**Impact:** Security - banner data is unprotected

**How to Execute:**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `003_add_banner_rls_policies.sql`
3. Paste and run
4. Verify 11 new policies created

**Verify:**
```sql
SELECT COUNT(*) FROM pg_policies 
WHERE tablename IN ('banner_slots', 'banner_requests');
-- Should return 11
```

---

### Fix 004: Add Auto-Update Triggers for updated_at
**File:** `004_add_updated_at_triggers.sql`  
**Priority:** MEDIUM  
**Impact:** Inconsistent timestamps

**How to Execute:**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `004_add_updated_at_triggers.sql`
3. Paste and run
4. Verify 4 triggers created

**Verify:**
```sql
SELECT tgname FROM pg_trigger 
WHERE tgname LIKE '%updated_at%';
-- Should return 4 triggers
```

---

## 📖 Execution Order

Execute fixes in this order:

1. ✅ **Fix 005** - Create admin user (CRITICAL)
2. ✅ **Fix 001** - Fix storage policies (CRITICAL)
3. ✅ **Fix 002** - Fix storage security (HIGH)
4. ✅ **Fix 003** - Add banner RLS policies (HIGH)
5. ✅ **Fix 004** - Add updated_at triggers (MEDIUM)

---

## ⚠️ Important Notes

- Always backup your database before running SQL fixes
- Test in development/staging environment first
- Read the entire SQL file before executing
- Check the verification queries after each fix
- See `SUPABASE_AUDIT_REPORT.md` for complete details

---

## 🔍 Related Files

- `../SUPABASE_AUDIT_REPORT.md` - Complete audit report
- `../migrations/` - All database migrations
- `../config.toml` - Local Supabase configuration
- `../../.env.example` - Environment variables guide

---

## 📞 Support

If you encounter issues:
1. Check the verification queries in each SQL file
2. Review error messages in SQL Editor
3. Consult the audit report for context
4. Test fixes individually before moving to next

---

**Last Updated:** January 30, 2026  
**Audit Report Version:** 1.0
