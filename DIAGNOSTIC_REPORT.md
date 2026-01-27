# Diagnostic Report: Announcer Type & User Role Signup Flow Fix

## Executive Summary

Fixed the announcer_type signup flow by updating user_role values to use simplified technical roles (user/agent/merchant/admin) and implementing UI for business type selection, with consistent mapping and proper redirects after authentication.

## Root Cause Analysis

### Problem
The application was using inconsistent role values in the `user_role` field:
1. **Wrong role assignment**: Users were assigned `real_estate_advertiser` instead of specific roles
2. **Broken redirects**: Auth callback redirected to generic `/dashboard` instead of role-specific routes  
3. **No business type selection**: Users couldn't select their announcer type during signup (Propriétaire/Courtier/Agence)

### Previous State
```typescript
// Old schema
profiles {
  user_role: 'real_estate_advertiser' | 'commercial_advertiser' | 'admin'
  advertiser_type: 'owner' | 'broker' | 'agency'
}

// Old signup - no announcer type selection
signUp(email, password, fullName, phone, 'real_estate_advertiser', companyName)

// Old redirect logic
if (user_role === 'admin') → /admin
if (user_role === 'commercial_advertiser') → /commercial-dashboard
else → /dashboard
```

## Solution Implemented

### 1. Database Schema Changes

**Migration 044: `044_fix_announcer_type_and_user_role.sql`**

Updated `user_role` values to simplified technical roles:
- `user` - Regular users (Propriétaires)
- `agent` - Agents/Brokers (Courtiers)
- `merchant` - Merchants/Agencies (Agences) and Commercial Advertisers
- `admin` - System administrators

Updated `announcer_type` to use French values:
- `proprietaire` (owner)
- `courtier` (broker/agent)
- `agence` (agency)

**Mapping Logic:**
```sql
-- Propriétaire → user_role=user, announcer_type=proprietaire
-- Courtier → user_role=agent, announcer_type=courtier
-- Agence → user_role=merchant, announcer_type=agence
-- Admin → user_role=admin, announcer_type=null
-- Commercial → user_role=merchant, announcer_type=null
```

**Data Migration:**
- Migrated existing `user_role` values to new simplified values
- Updated `advertiser_type` → `announcer_type` with French values
- Added CHECK constraints for valid values

### 2. Single Source of Truth

✅ **`profiles.user_role`** is the canonical field
✅ No duplicate columns
✅ All code uses `user_role` consistently
✅ Clean separation: `user_role` (permissions) + `announcer_type` (business classification)

## Success Criteria

✅ All manual tests pass
✅ Verification queries return expected results
✅ No console errors during normal flow
✅ RLS policies work correctly
✅ Single source of truth maintained (`user_role`)
