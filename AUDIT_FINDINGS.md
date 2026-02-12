# User Flow and Role Logic Audit Findings

## Date: 2026-02-11
## Auditor: GitHub Copilot Coding Agent

---

## PHASE 1: AUDIT RESULTS

### Critical Issues Detected

#### 1. ❌ **DEFAULT ROLE ASSIGNMENT MISMATCH**

**Location**: Multiple files assign `'real_estate_advertiser'` as default role instead of `'user'`

**Files Affected**:
1. `api/auth/google/callback.ts:196`
   ```typescript
   user_role: 'real_estate_advertiser', // Default role for new Google users
   ```

2. `src/contexts/AuthContext.tsx:97`
   ```typescript
   user_role: 'real_estate_advertiser', // Default role
   ```

**Expected Behavior**: New users should default to `'user'` role, not automatically get advertiser privileges.

**Database State**: 
- Migration `047_fix_profile_trigger_not_null_defensive.sql` sets DEFAULT to `'user'`
- Migration `045_add_admin_whitelist_and_fix_signup.sql` trigger defaults to `'user'`
- But earlier migrations `020_full_rebuild.sql` and `030_fix_roles_and_listings.sql` used `'real_estate_advertiser'`

**Impact**: 
- Users signing up via Google OAuth get advertiser role by default
- Users may see real estate features they shouldn't have access to
- Violates principle of least privilege

---

#### 2. ⚠️ **ROLE INCONSISTENCY IN MIGRATIONS**

**Database Migrations Timeline**:
- `010_full_rebuild.sql`: DEFAULT 'user' ✅
- `020_full_rebuild.sql`: DEFAULT 'real_estate_advertiser' ❌
- `030_fix_roles_and_listings.sql`: DEFAULT 'real_estate_advertiser' ❌
- `040_comprehensive_profile_fix.sql`: DEFAULT 'real_estate_advertiser' ❌
- `047_fix_profile_trigger_not_null_defensive.sql`: DEFAULT 'user' ✅

**Current State**: The database schema likely has DEFAULT 'user', but application code contradicts this.

---

#### 3. ✅ **ROLE MAPPING LOGIC IS SOUND**

**File**: `src/hooks/useUserRole.ts`

The role mapping logic properly handles:
- Admin check via `admins` table
- User role from `profiles.user_role`
- Advertiser type sub-categorization
- Safe defaults to 'user' on error

**Mapping**:
```
DB user_role             → App Role
-----------------        → ---------
'admin'                  → 'admin'
'commercial_advertiser'  → 'merchant'
'real_estate_advertiser' + 'broker' → 'agent'
'real_estate_advertiser' + 'agency' → 'merchant'
'real_estate_advertiser' + 'owner'  → 'user'
'user'                   → 'user'
NULL/other               → 'user' (safe fallback)
```

---

### PHASE 2: ARTISAN PERSISTENCE AUDIT

#### 4. ✅ **ARTISAN DASHBOARD FETCHES FROM DB**

**File**: `src/pages/artisan/ArtisanDashboard.tsx`

**Analysis**: ✅ Properly fetches data from database
```typescript
// Lines 48-52: Server-side query
const { data, error } = await supabase
  .from('artisan_profiles')
  .select('id, business_name, is_verified, is_active, is_boosted')
  .eq('user_id', user.id)
  .maybeSingle();
```

**Refresh Behavior**: 
- ✅ Redirects to `/artisan/onboarding` if no profile found
- ✅ No client-only state dependency
- ✅ Uses `useEffect` to re-fetch on user change

---

#### 5. ⚠️ **ARTISAN ONBOARDING PERSISTENCE**

**File**: `src/pages/artisan/ArtisanOnboarding.tsx`

**Current State**: Form data is held in local component state only

**Potential Issues**:
- No session storage or persistence layer
- If user navigates away, all form data is lost
- Back button during multi-step flow loses progress

**Recommendation**: Consider adding:
- Session storage for form data
- URL query params for step tracking
- Database draft support

---

### PHASE 3: SERVICE MODULE FLOW CONSISTENCY

#### 6. ✅ **SERVICES PAGE LOADS FROM DATABASE**

**File**: `src/pages/Services.tsx`

**Analysis**: ✅ Properly queries database
```typescript
// Lines 69-75
const { data, error } = await supabase
  .from("service_categories")
  .select("id, slug, name_fr, name_ar, ...")
  .eq("is_active", true)
  .order("sort_order", { ascending: true });
```

**Fallback Handling**: ✅ Uses `FALLBACK_SERVICE_CATEGORIES` if DB fails

---

#### 7. ✅ **SERVICE CATEGORY PAGE LOADS BY SLUG FROM DB**

**File**: `src/pages/ServiceCategoryPage.tsx`

**Analysis**: ✅ Properly queries database by slug
```typescript
// Lines 72-79
const { data, error } = await supabase
  .from("service_categories")
  .select("id, slug, name_fr, name_ar, ...")
  .eq("slug", normalizedSlug)  // ✅ Loads by slug
  .eq("is_active", true)
  .limit(1);
```

**Validation**: ✅ Validates slug format with regex before query

---

#### 8. ✅ **ONBOARDING STORES CATEGORY_ID**

**File**: `src/pages/artisan/ArtisanOnboarding.tsx`

**Analysis**: ✅ Stores service category properly
```typescript
const { data: profileData, error: profileError } = await supabase
  .from('artisan_profiles')
  .insert({
    user_id: user.id,
    service_category_id: formData.serviceCategoryId, // ✅
    business_name: formData.businessName,
    // ...
  })
```

---

### PHASE 4: NAVIGATION STABILITY

#### 9. ⚠️ **POTENTIAL RACE CONDITIONS**

**File**: `src/contexts/AuthContext.tsx`

**Issue**: Profile creation happens in AuthContext which may cause race conditions:
```typescript
// Lines 91-100: Manual profile creation
const { error: insertError } = await supabase
  .from('profiles')
  .insert({
    id: user.id,
    user_role: 'real_estate_advertiser', // ❌ Wrong default
    // ...
  });
```

**Problem**:
- Trigger should handle profile creation, not client code
- Client code may run before trigger completes
- Duplicate insert attempts possible

---

#### 10. ✅ **ROLE-BASED REDIRECTS ARE DETERMINISTIC**

**File**: `src/components/SmartDashboardRedirect.tsx`

**Analysis**: ✅ Clear, deterministic logic
```typescript
if (role === 'admin') return '/admin';
else if (role === 'merchant') return '/merchant';
else if (role === 'agent') return '/agent';
return '/dashboard';
```

---

## SUMMARY OF CRITICAL FLAWS

| # | Issue | Severity | Files Affected | Impact |
|---|-------|----------|----------------|--------|
| 1 | Default role = 'real_estate_advertiser' | 🔴 Critical | `api/auth/google/callback.ts`, `src/contexts/AuthContext.tsx` | Auto-assigns advertiser privileges |
| 2 | Client-side profile creation | 🟡 Medium | `src/contexts/AuthContext.tsx` | Bypasses DB trigger |
| 3 | Onboarding form not persisted | 🟡 Medium | `src/pages/artisan/ArtisanOnboarding.tsx` | Lost progress on navigation |
| 4 | Migration history inconsistent | 🟡 Medium | Multiple SQL files | Confusion about defaults |

---

## REQUIRED FIXES

### Fix #1: Remove Hardcoded 'real_estate_advertiser' Defaults
- [ ] Update `api/auth/google/callback.ts` line 196
- [ ] Update `src/contexts/AuthContext.tsx` line 97
- [ ] Change both to use 'user' as default

### Fix #2: Remove Client-Side Profile Creation
- [ ] Delete profile creation logic from `src/contexts/AuthContext.tsx`
- [ ] Rely solely on database trigger `handle_new_user()`
- [ ] Add error handling if profile doesn't exist

### Fix #3: Add Onboarding Persistence (Optional)
- [ ] Add session storage for form state
- [ ] Store progress in URL or localStorage
- [ ] Show "Resume" option if draft detected

### Fix #4: Verify Service Category Slug Loading
- [ ] Check `ServiceCategoryPage.tsx` implementation
- [ ] Ensure DB-based loading by slug

---

## VERIFICATION CHECKLIST

After fixes are applied:

### User Signup Flow
- [ ] New user signs up via email → gets 'user' role
- [ ] New user signs up via Google → gets 'user' role
- [ ] No automatic advertiser permissions
- [ ] Profile created by trigger, not client code

### Artisan Onboarding
- [ ] Form data survives page refresh
- [ ] Back button doesn't lose progress
- [ ] Category selection persists to database
- [ ] Dashboard reads from `artisan_profiles` table

### Service Module
- [ ] `/services` loads categories from DB
- [ ] `/services/[slug]` loads by slug from DB
- [ ] No hardcoded category lists

### Navigation
- [ ] Role-based redirects work consistently
- [ ] No race conditions on profile fetch
- [ ] Back button behaves correctly

---

## APPROVED CHANGES ONLY

✅ Role assignment fixes
✅ Remove client-side profile creation
✅ Verify DB-based data loading
✅ Fix navigation consistency

🚫 Do NOT modify security layer
🚫 Do NOT change authentication flow
🚫 Do NOT alter database triggers (they're correct)

---

**Next Step**: Implement fixes in Phase 2
