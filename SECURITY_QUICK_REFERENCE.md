# SECURITY QUICK REFERENCE
## Developer Guide for Maintaining Monetization Security

**Purpose**: Quick checklist for developers working on monetization features

---

## ⚠️ CRITICAL RULES - NEVER BREAK THESE

### 1. NEVER Allow Direct Table Updates for Money
```sql
-- ❌ NEVER DO THIS
UPDATE wallets SET balance_mad = 999999 WHERE user_id = auth.uid();

-- ❌ NEVER DO THIS
INSERT INTO wallet_transactions (user_id, amount_mad, reason) 
VALUES (auth.uid(), 999999, 'fake');

-- ✅ ALWAYS USE RPC FUNCTIONS
SELECT * FROM debit_wallet_for_contact(...);
SELECT * FROM toggle_artisan_boost(...);
SELECT * FROM admin_topup_wallet(...);
```

### 2. NEVER Modify is_boosted Outside RPC
```typescript
// ❌ NEVER DO THIS
await supabase
  .from('artisan_profiles')
  .update({ is_boosted: true })
  .eq('id', profileId);

// ✅ ALWAYS USE RPC
await supabase.rpc('toggle_artisan_boost', {
  p_artisan_profile_id: profileId,
  p_enable_boost: true
});
```

### 3. NEVER Create SECURITY DEFINER Without search_path
```sql
-- ❌ WRONG
CREATE OR REPLACE FUNCTION my_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- Missing SET search_path!
AS $$

-- ✅ CORRECT
CREATE OR REPLACE FUNCTION my_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- ✅ ALWAYS SET THIS
AS $$
```

### 4. NEVER Skip Authorization Checks
```sql
-- ❌ WRONG
CREATE OR REPLACE FUNCTION toggle_boost(profile_id UUID)
RETURNS void AS $$
BEGIN
  -- Missing: Check if auth.uid() owns this profile!
  UPDATE artisan_profiles SET is_boosted = TRUE WHERE id = profile_id;
END;

-- ✅ CORRECT
CREATE OR REPLACE FUNCTION toggle_boost(profile_id UUID)
RETURNS void AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- ✅ ALWAYS VALIDATE OWNERSHIP
  IF NOT EXISTS (
    SELECT 1 FROM artisan_profiles 
    WHERE id = profile_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  UPDATE artisan_profiles SET is_boosted = TRUE WHERE id = profile_id;
END;
```

### 5. NEVER Modify Money Without Locking
```sql
-- ❌ WRONG - Race condition possible!
SELECT balance_mad INTO v_balance FROM wallets WHERE user_id = v_user_id;
-- Another transaction could change balance here!
UPDATE wallets SET balance_mad = v_balance - v_fee WHERE user_id = v_user_id;

-- ✅ CORRECT - Lock the row
SELECT balance_mad INTO v_balance 
FROM wallets 
WHERE user_id = v_user_id
FOR UPDATE;  -- ✅ EXCLUSIVE LOCK

UPDATE wallets SET balance_mad = v_balance - v_fee WHERE user_id = v_user_id;
```

---

## ✅ CHECKLISTS FOR COMMON TASKS

### Adding a New Monetization RPC Function

- [ ] Function uses SECURITY DEFINER
- [ ] Function has `SET search_path = public`
- [ ] Function validates `auth.uid()` or admin status
- [ ] Function uses FOR UPDATE when modifying money
- [ ] Function checks balance BEFORE deducting
- [ ] Function records transaction in wallet_transactions
- [ ] Function has proper error handling
- [ ] Function returns success/failure clearly
- [ ] Added GRANT EXECUTE to authenticated role
- [ ] Updated this security guide if needed

### Adding a New RLS Policy

- [ ] Policy follows principle of least privilege
- [ ] SELECT: Only own data visible
- [ ] INSERT: Only own data allowed (if any)
- [ ] UPDATE: Protected fields in WITH CHECK
- [ ] DELETE: Carefully consider if needed
- [ ] Admin bypass clause if appropriate
- [ ] Policy tested with non-admin user
- [ ] Policy tested with admin user

### Adding a Monetization UI Component

- [ ] Component calls RPC functions (not direct updates)
- [ ] Component handles insufficient balance gracefully
- [ ] Component shows clear error messages
- [ ] Component uses TypeScript types correctly
- [ ] Component doesn't attempt protected field updates
- [ ] Component handles errors (fail-closed)
- [ ] Component doesn't expose sensitive data

---

## 🔒 PROTECTED FIELDS REFERENCE

### artisan_profiles Table

**Protected Fields** (RPC or admin only):
- `is_verified` - Only admins or verification process
- `is_active` - Only admins
- `is_boosted` - Only `toggle_artisan_boost()` RPC or admins
- `boosted_at` - Only `toggle_artisan_boost()` RPC or admins

**Safe to Update** (by profile owner):
- `business_name`
- `description_fr`
- `description_ar`
- `phone`
- `whatsapp`
- `email`
- `service_category_id`

### wallets Table

**Protected Fields** (RPC only):
- `balance_mad` - Only RPC functions or admins
- `updated_at` - Automatic

**TypeScript Safe Update Type**:
```typescript
type SafeArtisanProfileUpdate = Omit<
  Partial<ArtisanProfile>,
  'id' | 'user_id' | 'is_verified' | 'is_active' | 
  'is_boosted' | 'boosted_at' | 'created_at' | 'updated_at'
>;
```

---

## 🚨 SECURITY INCIDENT RESPONSE

### If You Find a Vulnerability

1. **DO NOT** commit the fix publicly in commit message
2. **DO** notify security team immediately
3. **DO** test the fix thoroughly
4. **DO** review similar code for same issue
5. **DO** update this guide after fixing

### If RLS Policy Fails in Production

1. Check logs for the exact error
2. Verify auth.uid() is set correctly
3. Check policy WITH CHECK vs USING clauses
4. Test with actual user credentials
5. Review recent schema changes

### If Money Operation Fails

1. Check wallet balance is sufficient
2. Check FOR UPDATE lock isn't causing deadlock
3. Review wallet_transactions for clues
4. Verify RPC function returned error message
5. Check platform_settings for monetization enabled

---

## 📋 CODE REVIEW CHECKLIST

When reviewing PRs that touch monetization:

### SQL/Migrations
- [ ] No new ways to directly UPDATE wallets
- [ ] No new ways to directly UPDATE is_boosted
- [ ] All SECURITY DEFINER have SET search_path
- [ ] All money operations use FOR UPDATE
- [ ] CHECK constraints maintained
- [ ] Foreign keys maintained
- [ ] RLS policies not weakened

### Frontend Code
- [ ] No direct table updates for money
- [ ] Uses RPC functions for all money operations
- [ ] Errors handled (fail-closed not fail-open)
- [ ] TypeScript types used correctly
- [ ] No sensitive data exposed in client

### RPC Functions
- [ ] Authorization check present
- [ ] search_path set explicitly
- [ ] FOR UPDATE used for money operations
- [ ] Transaction recorded in wallet_transactions
- [ ] Balance checked before deduction
- [ ] Error messages informative but not leaky

---

## 🧪 TESTING REQUIREMENTS

### Before Deploying Monetization Changes

1. **Manual Tests**:
   - [ ] Try to boost without sufficient balance
   - [ ] Try to access contacts without payment
   - [ ] Try to modify is_boosted directly (should fail)
   - [ ] Try to modify wallet directly (should fail)
   - [ ] Verify wallet deduction happens

2. **Security Tests**:
   - [ ] Test as non-admin user
   - [ ] Test as admin user
   - [ ] Test with concurrent requests (if applicable)
   - [ ] Test SQL injection in parameters
   - [ ] Test cross-user exploitation

3. **Edge Cases**:
   - [ ] Exact balance for operation
   - [ ] Zero balance
   - [ ] Negative amount (should be rejected)
   - [ ] Very large amount
   - [ ] Expired access pass

---

## 🎯 QUICK FIXES FOR COMMON MISTAKES

### "User can update is_boosted"

**Problem**: RLS policy doesn't protect is_boosted

**Fix**:
```sql
DROP POLICY IF EXISTS "policy_name" ON artisan_profiles;
CREATE POLICY "policy_name" ON artisan_profiles
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  NEW.is_boosted = OLD.is_boosted AND  -- Add this
  NEW.boosted_at = OLD.boosted_at      -- And this
);
```

### "Race condition in wallet operations"

**Problem**: Multiple transactions can read same balance

**Fix**:
```sql
-- Add FOR UPDATE
SELECT balance_mad INTO v_balance
FROM wallets
WHERE user_id = v_user_id
FOR UPDATE;  -- ✅ Add this line
```

### "search_path vulnerability"

**Problem**: SECURITY DEFINER function missing search_path

**Fix**:
```sql
CREATE OR REPLACE FUNCTION my_function()
...
SECURITY DEFINER
SET search_path = public  -- ✅ Add this line
AS $$
```

---

## 📚 REFERENCES

- **Full Security Audit**: `RED_TEAM_SECURITY_AUDIT.md`
- **Executive Summary**: `SECURITY_AUDIT_EXECUTIVE_SUMMARY.md`
- **Monetization Guide**: `MONETIZATION_GUIDE.md`
- **Migrations**: `supabase/migrations/098_comprehensive_security_hardening.sql`

---

## 🆘 WHO TO ASK

- **RLS Policy Questions**: Review migration 098
- **RPC Function Questions**: Review migration 090 & 098
- **Frontend Security**: Review `src/components/monetization/`
- **TypeScript Types**: Review `src/lib/db/artisans.ts`

---

**Last Updated**: 2026-02-11  
**Security Audit Score**: 97/100  
**Status**: ✅ Production Ready

---

## ⚡ ONE-LINE REMINDERS

1. Money operations → Always RPC, never direct UPDATE
2. SECURITY DEFINER → Always SET search_path = public
3. Money changes → Always use FOR UPDATE lock
4. Authorization → Always check auth.uid() or admin
5. is_boosted → Only via toggle_artisan_boost() RPC
6. Frontend → Use TypeScript SafeArtisanProfileUpdate
7. Errors → Fail-closed (deny on error)
8. New features → Re-run security checklist
9. Before deploy → Test as non-admin user
10. When in doubt → Ask security team

**Remember**: Security is not optional. Follow these rules always! 🔒
