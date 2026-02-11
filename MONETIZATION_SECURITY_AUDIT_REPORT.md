# MONETIZATION & SECURITY HARDENING AUDIT REPORT

**Date:** 2026-02-11  
**Scope:** Monetization System (Boost & Access Pass) and RLS Security Policies  
**Auditor:** Security Review Agent

---

## EXECUTIVE SUMMARY

**VERDICT:** ⚠️ **CRITICAL MONETIZATION RISK IDENTIFIED**

This audit identified **CRITICAL SECURITY VULNERABILITIES** in the monetization system that could allow users to bypass payment requirements and manipulate premium features.

---

## DETAILED FINDINGS

### 1. BOOST SYSTEM AUDIT

#### 1.1 Can `is_boosted` be manually updated by artisans?

**FINDING:** ❌ **CRITICAL VULNERABILITY - YES, BYPASS POSSIBLE**

**Evidence:**
- Migration 091 (lines 80-96) implements RLS policy for artisan profile updates
- Policy ONLY protects `is_verified` and `is_active` fields
- **`is_boosted` field is NOT protected in the RLS policy**

```sql
-- From migration 091_fix_artisan_location_model.sql (lines 91-94)
-- If not admin, ensure is_verified and is_active remain unchanged
NEW.is_verified = OLD.is_verified
AND NEW.is_active = OLD.is_active
-- NOTE: is_boosted is NOT checked here!
```

**Impact:** Artisans can directly update `is_boosted` to `TRUE` via:
1. Direct Supabase client update calls
2. SQL UPDATE statements through authenticated connections
3. Any custom UI code that calls `.update()` on the artisan_profiles table

**Exploitation Path:**
```javascript
// Artisan can bypass payment by directly updating:
await supabase
  .from('artisan_profiles')
  .update({ is_boosted: true, boosted_at: new Date() })
  .eq('id', artisanProfileId);
```

#### 1.2 Is boost tied to wallet transaction?

**FINDING:** ❌ **NO - BOOST IS NOT TIED TO WALLET DEBIT**

**Evidence:**
- `toggle_artisan_boost()` function (migration 090, lines 315-424) only **checks** wallet balance
- **No wallet transaction is created when enabling boost**
- **No money is deducted from wallet**

```sql
-- From migration 090 (lines 407-413)
IF v_current_balance < v_min_wallet_mad THEN
  RETURN QUERY SELECT FALSE, 'Insufficient balance'::TEXT, FALSE;
  RETURN;
END IF;

-- Enable boost WITHOUT deducting from wallet
UPDATE public.artisan_profiles SET is_boosted = TRUE ...
-- No INSERT into wallet_transactions!
```

**Impact:** 
- Boost only requires minimum balance in wallet
- No actual payment/deduction occurs
- Same balance can enable boost indefinitely

#### 1.3 Any way to bypass payment requirement?

**FINDING:** ✅ **MULTIPLE BYPASS MECHANISMS EXIST**

**Bypass Methods:**

1. **Direct Database Update** (most critical)
   - Artisans can UPDATE their own profile via RLS
   - RLS policy doesn't check `is_boosted` changes
   
2. **Free Mode When Monetization Disabled** (by design)
   - When `monetization_enabled = false`: boost is free
   - When `pay_to_be_visible_enabled = false`: boost is free
   
3. **Wallet Balance Check Only**
   - No deduction occurs
   - Once minimum balance reached, boost can be toggled forever

---

### 2. ACCESS PASS SYSTEM AUDIT

#### 2.1 Does `check_contact_access` still rely on array logic?

**FINDING:** ⚠️ **YES - HYBRID ARRAY LOGIC STILL EXISTS**

**Evidence:**
- Migration 091 (lines 259-313) uses `neighborhood_ids INTEGER[]` parameter
- Migration 093 migrates to join table BUT `contact_access_passes` table still uses `neighborhood_ids` array
- Array overlap operator `&&` used for access checks (line 329)

```sql
-- From migration 091 (lines 294-304)
WHERE cap.user_id = p_user_id
  AND (
    cap.neighborhood_ids IS NULL
    OR p_neighborhood_ids IS NULL
    OR array_length(p_neighborhood_ids, 1) IS NULL
    OR cap.neighborhood_ids && p_neighborhood_ids  -- ARRAY OVERLAP!
  )
```

**Files:**
- `contact_access_passes` table: Still has `neighborhood_ids INTEGER[]` column (migration 091, line 56)
- `artisan_profile_neighborhoods` table: Uses join table (migration 093, line 14)

**Impact:** Mismatch between data models could lead to:
- Inconsistent access checks
- Potential for access bypass if arrays are manipulated

#### 2.2 Mismatch between join table and array-based filtering?

**FINDING:** ✅ **YES - ARCHITECTURAL MISMATCH EXISTS**

**Evidence:**
1. **Artisan Profiles:** Use join table `artisan_profile_neighborhoods` (migration 093)
2. **Access Passes:** Still use array column `neighborhood_ids` (migration 091)

**Code Paths:**
- Artisan profile neighborhoods: Stored in `artisan_profile_neighborhoods` table
- Contact access passes: Stored as `neighborhood_ids INTEGER[]` in `contact_access_passes`

**Impact:** 
- Different validation logic for each system
- Potential for bypass if artisan neighborhoods and pass neighborhoods are checked differently
- Maintenance complexity and bug risk

#### 2.3 Any scenario where user can access contacts without valid pass?

**FINDING:** ⚠️ **POTENTIAL BYPASS SCENARIOS**

**Scenarios:**

1. **Monetization Disabled** (by design)
   - When `monetization_enabled = false`: all contact access is free
   - When `pay_per_contact_enabled = false`: all contact access is free
   - RevealPhoneButton.tsx (lines 73-76): Auto-reveals on error

```typescript
// From RevealPhoneButton.tsx (lines 72-82)
if (!enabled) {
  setRevealed(true);
  setHasAccess(true);
}
```

2. **Error Handling Bypass**
   - RevealPhoneButton.tsx defaults to FREE access on error (lines 79-81)
   - Could be exploited by forcing errors

3. **RPC Function Logic**
   - `debit_wallet_for_contact` returns success for free mode
   - Array logic complexity could have edge cases

---

### 3. RLS POLICIES AUDIT

#### 3.1 Can artisan update `is_verified`?

**FINDING:** ✅ **NO - PROPERLY PROTECTED**

**Evidence:**
Migration 091 RLS policy (lines 91-94) enforces:
```sql
NEW.is_verified = OLD.is_verified
```

**Status:** ✅ SECURE - Artisans cannot self-verify

#### 3.2 Can artisan update `is_boosted`?

**FINDING:** ❌ **CRITICAL - YES, NOT PROTECTED**

**Evidence:**
- RLS policy in migration 091 (lines 80-96) only checks `is_verified` and `is_active`
- **`is_boosted` is NOT in the WITH CHECK constraint**

```sql
-- Only these are protected:
NEW.is_verified = OLD.is_verified
AND NEW.is_active = OLD.is_active
-- is_boosted is MISSING!
```

**Status:** ❌ **CRITICAL VULNERABILITY** - Artisans can self-boost for free

#### 3.3 Any policy allowing privilege escalation?

**FINDING:** ⚠️ **POTENTIAL PRIVILEGE ESCALATION VECTOR**

**Evidence:**
Admin check relies on subquery:
```sql
auth.uid() IN (SELECT user_id FROM public.admins)
```

**Risks:**
1. If `admins` table RLS is misconfigured, could be exploited
2. Subquery runs on every UPDATE - performance and security concern
3. No validation of admin role status

**Recommendation:** Use dedicated `auth.jwt()` claim for admin status instead of subquery

---

### 4. CUSTOM NEIGHBORHOODS AUDIT

#### 4.1 What happens when artisan is deleted?

**FINDING:** ✅ **PROPERLY HANDLED WITH CASCADE**

**Evidence:**
Migration 093 (line 14):
```sql
artisan_profile_id UUID REFERENCES public.artisan_profiles(id) ON DELETE CASCADE
```

**Status:** ✅ SECURE - Join table records are automatically deleted

#### 4.2 Any orphan records possible?

**FINDING:** ✅ **MINIMAL RISK - CASCADE CONFIGURED**

**Evidence:**
All foreign keys properly configured:
- `artisan_profile_neighborhoods`: ON DELETE CASCADE (migration 093, line 14)
- `reviews`: ON DELETE CASCADE (migration 096)
- `media`: ON DELETE CASCADE (migration 097)
- `requests`: ON DELETE SET NULL (migration 094) - intentional for historical data

**Status:** ✅ SECURE - No orphan records expected

---

## CRITICAL VULNERABILITIES SUMMARY

### 🚨 CRITICAL RISK #1: `is_boosted` Not Protected in RLS

**Severity:** CRITICAL  
**Exploit Difficulty:** Trivial  
**Impact:** Complete monetization bypass

**Attack:**
```javascript
// Any authenticated artisan can run:
const { error } = await supabase
  .from('artisan_profiles')
  .update({ 
    is_boosted: true,
    boosted_at: new Date().toISOString()
  })
  .eq('user_id', currentUserId);
// No wallet check, no admin required!
```

### 🚨 CRITICAL RISK #2: Boost Does Not Deduct From Wallet

**Severity:** HIGH  
**Exploit Difficulty:** Easy  
**Impact:** Free premium features

**Issue:**
- Boost only checks balance, never debits
- Users with minimum balance can boost indefinitely
- No transaction audit trail

### ⚠️ MODERATE RISK #3: Hybrid Array/Join Table Architecture

**Severity:** MODERATE  
**Exploit Difficulty:** Moderate  
**Impact:** Potential access bypass via data model mismatch

**Issue:**
- Artisan neighborhoods use join table
- Access passes use arrays
- Different validation logic could be exploited

### ⚠️ MODERATE RISK #4: Error Handling Defaults to Free Access

**Severity:** MODERATE  
**Exploit Difficulty:** Moderate  
**Impact:** Free contact reveals via forced errors

**Issue:**
- RevealPhoneButton defaults to free on error
- Could be exploited by causing errors

---

## RECOMMENDATIONS (CRITICAL PRIORITY)

### 1. FIX RLS POLICY FOR `is_boosted` (CRITICAL)

**Action Required:**
```sql
-- Update RLS policy in migration 091
CREATE POLICY "Artisans can update own profiles"
  ON public.artisan_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      auth.uid() IN (SELECT user_id FROM public.admins)
      OR (
        NEW.is_verified = OLD.is_verified
        AND NEW.is_active = OLD.is_active
        AND NEW.is_boosted = OLD.is_boosted  -- ADD THIS!
      )
    )
  );
```

### 2. IMPLEMENT WALLET DEDUCTION FOR BOOST (HIGH)

**Options:**

A. **Charge Per Day/Month** (Recommended)
```sql
-- Deduct fee when enabling boost
-- Record transaction in wallet_transactions
-- Set expiry date for boost
```

B. **Minimum Balance Lock**
```sql
-- Prevent balance from going below minimum while boosted
-- Disable boost if balance drops below threshold
```

### 3. MIGRATE ACCESS PASSES TO JOIN TABLE (MEDIUM)

**Action:**
- Remove `neighborhood_ids` array from `contact_access_passes`
- Create `contact_access_pass_neighborhoods` join table
- Update `check_contact_access` to use joins instead of arrays

### 4. IMPROVE ERROR HANDLING (MEDIUM)

**Action:**
- Remove auto-reveal on error in RevealPhoneButton
- Fail closed (deny access) instead of fail open
- Log errors for investigation

### 5. ADD SECURITY MONITORING (MEDIUM)

**Action:**
- Log all boost toggles to audit table
- Monitor direct UPDATE calls to `is_boosted`
- Alert on suspicious patterns

---

## COMPLIANCE STATUS

| Area | Status | Notes |
|------|--------|-------|
| Boost Payment Enforcement | ❌ FAIL | RLS allows direct updates |
| Wallet Transaction Integrity | ❌ FAIL | No deduction for boost |
| Access Control Consistency | ⚠️ PARTIAL | Hybrid array/join model |
| Privilege Escalation Prevention | ⚠️ PARTIAL | Admin check via subquery |
| Data Integrity | ✅ PASS | CASCADE properly configured |

---

## FINAL VERDICT

# ⚠️ CRITICAL MONETIZATION RISK

**The current implementation has CRITICAL SECURITY VULNERABILITIES that allow:**

1. ✅ Free boost via direct database UPDATE (bypassing `toggle_artisan_boost` RPC)
2. ✅ Indefinite boost with one-time minimum balance
3. ⚠️ Potential contact access bypass via error handling
4. ⚠️ Data model mismatch between systems

**IMMEDIATE ACTION REQUIRED:**
1. Add `is_boosted` to RLS WITH CHECK constraint
2. Implement wallet deduction for boost activation
3. Review and fix error handling in contact reveal flow

**TIMELINE RECOMMENDATION:**
- Critical fixes: Deploy within 24-48 hours
- High priority: Deploy within 1 week
- Medium priority: Plan for next sprint

---

## APPENDIX: FILES REVIEWED

### Database Migrations
- `089_create_monetization_tables.sql` - Monetization schema
- `090_create_monetization_rpc_functions.sql` - RPC functions
- `091_fix_artisan_location_model.sql` - RLS policies
- `093_migrate_to_artisan_profile_neighborhoods_join_table.sql` - Join table migration
- `093_create_artisan_profile_neighborhoods_join_table.sql` - Duplicate migration

### Frontend Components
- `src/components/monetization/BoostToggle.tsx` - Boost UI (uses RPC ✅)
- `src/components/monetization/RevealPhoneButton.tsx` - Contact reveal (error handling issue)
- `src/pages/admin/AdminMonetization.tsx` - Admin settings (uses RLS ✅)

### RPC Functions
- `toggle_artisan_boost()` - Balance check only, no deduction
- `debit_wallet_for_contact()` - Properly debits wallet ✅
- `check_contact_access()` - Uses array logic ⚠️

---

**End of Audit Report**
