# Supabase Diagnostic Pack - Quick Start Guide

**Complete diagnostic materials for the Approve/Reject functionality**

---

## 📦 What's Included

This diagnostic pack contains everything you need to analyze, verify, and fix the Supabase Approve/Reject flow:

### 1. Main Diagnostic Report
**File:** `SUPABASE_APPROVE_REJECT_DIAGNOSTIC.md`

Complete analysis including:
- All database tables and columns
- RLS policies (SELECT, UPDATE, INSERT, DELETE)
- Admin table structure
- Triggers and functions
- Common issues and solutions
- Verification queries

**Use this:** As your primary reference document

---

### 2. SQL Diagnostic Scripts
**File:** `docs/SUPABASE_DIAGNOSTIC_SCRIPTS.sql`

Ready-to-run SQL scripts organized in 6 parts:
- **Part 1:** Verification scripts (check current state)
- **Part 2:** Setup scripts (create first admin)
- **Part 3:** Fix/Repair scripts (if something is broken)
- **Part 4:** Testing scripts (test approve/reject flow)
- **Part 5:** Cleanup scripts (remove test data)
- **Part 6:** Diagnostic queries (debug issues)

**Use this:** In Supabase SQL Editor to verify and fix database

---

### 3. Console Logs Guide
**File:** `docs/CONSOLE_LOGS_GUIDE.md`

Step-by-step guide for the 4-step logging system (Steps A-D):
- What each step checks
- Expected console output
- Troubleshooting for each step
- How to save console logs
- Quick diagnostic checklist

**Use this:** To interpret browser console logs during approve/reject

---

### 4. Network Logs Guide
**File:** `docs/NETWORK_LOGS_GUIDE.md`

Complete HTTP traffic documentation:
- Request/response formats
- All error codes and meanings
- How to capture network logs
- JWT token analysis
- Troubleshooting network issues

**Use this:** To analyze network traffic in DevTools

---

## 🚀 Quick Start - 5 Minute Setup

### Step 1: Verify You're Admin (2 min)

**Run in Supabase SQL Editor:**
```sql
-- Check if you're admin
SELECT 
  u.id as user_id,
  u.email,
  CASE 
    WHEN a.user_id IS NOT NULL THEN '✅ YES'
    ELSE '❌ NO'
  END as is_admin
FROM auth.users u
LEFT JOIN public.admins a ON u.id = a.user_id
WHERE u.id = auth.uid();
```

**If result shows ❌ NO:**
```sql
-- Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Make yourself admin (replace USER_UUID)
INSERT INTO public.admins (user_id) VALUES ('USER_UUID_HERE');
```

---

### Step 2: Test Approve Flow (3 min)

**In Admin Dashboard:**
1. Navigate to Admin Listings page
2. Open browser DevTools (F12) → Console tab
3. Click Approve on a pending property
4. Check console for Steps A-D logs

**Expected in Console:**
```
🔍 [STEP A] Approve/Reject onClick Triggered
🔍 [STEP B] Sending Supabase Update Request
🔍 [STEP C] Supabase Response ✅ Success
🔍 [STEP D] Verifying DB Update ✅ Status Match: YES
```

**If you see errors:** Refer to troubleshooting sections

---

## 🔍 Diagnostic Workflow

### Scenario 1: Approve Button Does Nothing

**Check:**
1. Console Logs Guide → Step A troubleshooting
2. Main Report → Section 9 (Common Issues)

**Most Likely Cause:**
- JavaScript error
- Button is disabled
- Event listener not attached

---

### Scenario 2: Permission Denied Error

**Check:**
1. Console Logs Guide → Step C → Error Code 42501
2. SQL Scripts → Part 1 (Verification) → Section 1.1

**Most Likely Cause:**
- User not in admins table

**Fix:**
```sql
INSERT INTO public.admins (user_id) VALUES ('your-user-uuid');
```

---

### Scenario 3: Status Doesn't Change (Silent Fail)

**Check:**
1. Console Logs Guide → Step D → Status Didn't Change
2. Main Report → Section 3.1 (Protect Property Status Trigger)

**Most Likely Cause:**
- Trigger reverted status change
- User not in admins table

**Diagnosis:**
```sql
-- Check if you're admin
SELECT * FROM public.admins WHERE user_id = auth.uid();

-- Check trigger exists
SELECT tgname, tgenabled FROM pg_trigger 
WHERE tgname = 'protect_property_status_trigger';
```

---

### Scenario 4: JWT Token Expired

**Check:**
1. Network Logs Guide → Error 2 (JWT Invalid)
2. Network Logs Guide → JWT Token Analysis

**Most Likely Cause:**
- Session older than 1 hour

**Fix:**
- Log out and log back in
- Refresh to get new token

---

## 📋 Complete Diagnostic Checklist

Run through this checklist systematically:

### Database Setup
- [ ] Admins table exists
- [ ] RLS enabled on properties, admins, admin_audit_logs
- [ ] Your user_id is in admins table
- [ ] Properties table has status, approved_at, approved_by columns
- [ ] Protect status trigger exists and is enabled

**Verify:** Run SQL Scripts Part 1 (Verification)

---

### Authentication
- [ ] User is logged in
- [ ] JWT token is valid (not expired)
- [ ] auth.uid() returns your user ID
- [ ] Authorization header is sent with requests

**Verify:** Console → `await supabase.auth.getUser()`

---

### Code & Frontend
- [ ] Step A logs appear (onClick triggered)
- [ ] Step B logs appear (request sent)
- [ ] Step C shows success (no error)
- [ ] Step D shows status changed

**Verify:** Console Logs Guide

---

### Network
- [ ] POST request appears in Network tab
- [ ] Response is 200 OK
- [ ] Response body contains updated property
- [ ] No CORS errors

**Verify:** Network Logs Guide

---

## 🛠️ SQL Scripts Quick Reference

### Check Admin Status
```sql
SELECT * FROM public.admins WHERE user_id = auth.uid();
```

### Add Admin
```sql
INSERT INTO public.admins (user_id) VALUES ('user-uuid');
```

### Check Property Status
```sql
SELECT id, status, approved_at, approved_by 
FROM properties 
WHERE id = 'property-uuid';
```

### Check RLS Policies
```sql
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'properties' 
ORDER BY cmd, policyname;
```

### Check Triggers
```sql
SELECT tgname, tgenabled FROM pg_trigger 
WHERE tgrelid = 'public.properties'::regclass;
```

---

## 🎯 Common Fixes

### Fix 1: Add First Admin

**Problem:** No admins exist, can't approve anything

**Solution:**
```sql
-- Run in Supabase SQL Editor (uses service role)
INSERT INTO public.admins (user_id)
VALUES ('your-user-uuid-here')
ON CONFLICT DO NOTHING;
```

---

### Fix 2: Recreate Status Protection Trigger

**Problem:** Trigger is missing or broken

**Solution:** Run SQL Scripts Part 3 → Section 3.5

---

### Fix 3: Re-enable RLS

**Problem:** RLS is disabled

**Solution:**
```sql
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
```

---

### Fix 4: Refresh JWT Token

**Problem:** Token expired

**Solution:**
1. Log out from Admin Dashboard
2. Log back in
3. Token will be refreshed automatically

---

## 📊 Understanding the Logs

### Console Logs (Steps A-D)

| Step | What It Checks | If Missing/Failed |
|------|----------------|-------------------|
| A | Button click event | Check JavaScript errors |
| B | Request preparation | Check code logic |
| C | Supabase response | Check RLS policies, JWT |
| D | DB verification | Check trigger, admin status |

### Network Logs

| Status | Meaning | Action |
|--------|---------|--------|
| 200 OK | Success | ✅ Check Step D for verification |
| 401 | Not authenticated | Log in again |
| 403 | Permission denied | Add user to admins table |
| 406 | Property not found | Check property ID |

---

## 📞 Support

### Documentation Files

1. **Main Reference:** `SUPABASE_APPROVE_REJECT_DIAGNOSTIC.md`
2. **SQL Scripts:** `docs/SUPABASE_DIAGNOSTIC_SCRIPTS.sql`
3. **Console Guide:** `docs/CONSOLE_LOGS_GUIDE.md`
4. **Network Guide:** `docs/NETWORK_LOGS_GUIDE.md`

### Code Locations

- Approve/Reject Logic: `/src/pages/admin/AdminListings.tsx` (line 226)
- Audit Logging: `/src/lib/auditLog.ts`
- Admins Table Migration: `/supabase/migrations/050_create_admins_table_and_rls.sql`
- Audit Logs Migration: `/supabase/migrations/053_create_admin_audit_logs.sql`

---

## 🎓 Next Steps

### 1. Initial Setup (First Time)
1. Run verification scripts (SQL Part 1)
2. Create first admin user (SQL Part 2)
3. Test approve flow (SQL Part 4)

### 2. Debugging Issues
1. Check console logs (Steps A-D)
2. Check network logs (DevTools Network tab)
3. Run diagnostic queries (SQL Part 6)

### 3. Ongoing Monitoring
1. Check audit logs regularly
2. Monitor admin activity
3. Review pending properties

---

## ✅ Success Criteria

You'll know everything is working when:

- [ ] Console shows all 4 steps (A-D) with ✅
- [ ] Network shows 200 OK response
- [ ] Property status changes in database
- [ ] Approved_at, approved_by, published_at are set
- [ ] Audit log entry is created
- [ ] Property appears in approved listings

---

## 📝 Summary

This diagnostic pack provides:
- ✅ Complete database schema documentation
- ✅ All RLS policies with explanations
- ✅ Ready-to-run SQL scripts
- ✅ Step-by-step console log guide
- ✅ Network request/response documentation
- ✅ Troubleshooting for all common issues
- ✅ Quick reference for common tasks

**Start with:** SQL verification scripts to check current state
**Then:** Follow console logs guide while testing approve/reject
**If issues:** Use troubleshooting sections in each guide

---

**Generated:** 2026-01-31  
**Repository:** topimmo/topaffaireimmo  
**Feature:** Supabase Approve/Reject Diagnostic
