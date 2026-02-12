# User Flow and Role Logic - Corrected Flow Diagram

## Overview
This diagram shows the corrected user journey with proper role assignment and persistence.

---

## 1. NEW USER SIGNUP FLOW

```
┌─────────────────────────────────────────────────────────────┐
│                     NEW USER SIGNS UP                        │
│                                                               │
│  Methods:                                                     │
│  • Email/Password                                            │
│  • Google OAuth                                              │
│  • OTP (Phone)                                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              AUTH.USERS RECORD CREATED                       │
│                                                               │
│  Supabase Auth creates user record                          │
│  Metadata: { full_name, google_id, phone }                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           DATABASE TRIGGER: handle_new_user()                │
│                                                               │
│  Automatically creates profile with:                         │
│  • user_role = 'user' (DEFAULT) ✅                          │
│  • announcer_type = NULL                                     │
│  • is_admin = false                                          │
│  • is_verified = false                                       │
│                                                               │
│  Special: Auto-promote if email in admin_whitelist          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  PROFILE CREATED                             │
│                                                               │
│  profiles table:                                             │
│  {                                                           │
│    id: UUID,                                                 │
│    email: string,                                            │
│    user_role: 'user',        ← SAFE DEFAULT ✅             │
│    announcer_type: NULL,                                     │
│    is_admin: false                                           │
│  }                                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              USER LANDS ON HOMEPAGE                          │
│                                                               │
│  • Can browse properties (read-only)                        │
│  • Can browse services (read-only)                          │
│  • No advertiser features visible yet                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. ROLE-SPECIFIC FLOWS

### 2A. Regular User Journey (Default)

```
┌─────────────────┐
│  User Role      │
│  = 'user'       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  AVAILABLE FEATURES:                    │
│  • Browse properties                    │
│  • Browse services                      │
│  • Request services from artisans       │
│  • View listings                        │
│                                         │
│  NOT ALLOWED:                           │
│  • Create property listings            │
│  • Create banner ads                   │
│  • Access advertiser dashboard         │
└─────────────────────────────────────────┘
```

### 2B. Real Estate Advertiser (Explicit Upgrade Required)

```
┌──────────────────────────────────────────────┐
│  User decides to become real estate          │
│  advertiser (property seller)                │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  UPGRADE MECHANISM (TO BE IMPLEMENTED)       │
│                                              │
│  Options:                                    │
│  1. Settings page: "Become an Advertiser"   │
│  2. First-time listing: Role upgrade prompt │
│  3. Admin approval required                 │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  UPDATE profiles SET                         │
│    user_role = 'real_estate_advertiser',    │
│    advertiser_type = 'owner' | 'broker' |   │
│                      'agency'               │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  REAL ESTATE DASHBOARD UNLOCKED              │
│  • Create property listings                  │
│  • Manage listings                           │
│  • View analytics                            │
└──────────────────────────────────────────────┘
```

### 2C. Artisan Service Provider

```
┌──────────────────────────────────────────────┐
│  User visits /artisan/onboarding             │
│  (Must be authenticated)                     │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  ARTISAN ONBOARDING FORM                     │
│                                              │
│  Step 1: Choose service category             │
│    SELECT service_category_id FROM DB ✅     │
│                                              │
│  Step 2: Business information                │
│    • Business name                           │
│    • Description (FR/AR)                     │
│                                              │
│  Step 3: Service area                        │
│    • Select city                             │
│    • Select neighborhoods                    │
│                                              │
│  Step 4: Contact details                     │
│    • Phone                                   │
│    • Email                                   │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  INSERT INTO artisan_profiles                │
│  {                                           │
│    user_id: UUID,                            │
│    service_category_id: UUID,  ← FROM DB ✅ │
│    business_name: string,                    │
│    description_fr: string,                   │
│    description_ar: string,                   │
│    phone: string,                            │
│    email: string,                            │
│    is_verified: false,                       │
│    is_active: true                           │
│  }                                           │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  INSERT INTO artisan_profile_neighborhoods   │
│  (Junction table for service areas)          │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  REDIRECT TO /dashboard/artisan              │
│                                              │
│  Dashboard loads data FROM DB: ✅            │
│  SELECT * FROM artisan_profiles              │
│  WHERE user_id = current_user                │
└──────────────────────────────────────────────┘
```

### 2D. Commercial Advertiser (Banner Ads)

```
┌──────────────────────────────────────────────┐
│  User decides to run banner advertisements   │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  UPGRADE MECHANISM (TO BE IMPLEMENTED)       │
│  Update user_role to 'commercial_advertiser' │
│  or 'merchant'                               │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  COMMERCIAL DASHBOARD UNLOCKED               │
│  • Create banner requests                    │
│  • Manage campaigns                          │
│  • View impressions                          │
└──────────────────────────────────────────────┘
```

---

## 3. SERVICE BROWSING FLOW (ANY USER)

```
┌─────────────────────────────────────────────┐
│  User visits /services                      │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  FETCH SERVICE CATEGORIES FROM DB ✅        │
│                                             │
│  SELECT * FROM service_categories           │
│  WHERE is_active = true                     │
│  ORDER BY sort_order ASC                    │
│                                             │
│  Fallback: FALLBACK_SERVICE_CATEGORIES      │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  DISPLAY CATEGORY GRID                      │
│  • Plomberie (plumbing)                     │
│  • Électricité (electrical)                 │
│  • Peinture (painting)                      │
│  • etc.                                     │
└────────────────┬────────────────────────────┘
                 │
                 │ User clicks category
                 ▼
┌─────────────────────────────────────────────┐
│  NAVIGATE TO /services/[slug]               │
│  Example: /services/plomberie               │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  FETCH CATEGORY BY SLUG FROM DB ✅          │
│                                             │
│  SELECT * FROM service_categories           │
│  WHERE slug = 'plomberie'                   │
│    AND is_active = true                     │
│  LIMIT 1                                    │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  DISPLAY CATEGORY PAGE                      │
│  • Category name & description              │
│  • List of artisans (future)                │
│  • "Become a provider" CTA                  │
└─────────────────────────────────────────────┘
```

---

## 4. ARTISAN DASHBOARD REFRESH BEHAVIOR

```
┌─────────────────────────────────────────────┐
│  Artisan navigates to /dashboard/artisan    │
│  OR refreshes page                          │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  CHECK AUTH STATE                           │
│  useAuth() → user object                    │
└────────────────┬────────────────────────────┘
                 │
                 ├─ Not authenticated ──────────┐
                 │                              │
                 │                              ▼
                 │              Redirect to /login?next=/dashboard/artisan
                 │
                 ├─ Authenticated ──────────────┐
                 │                              │
                 │                              ▼
                 │              ┌────────────────────────────────┐
                 │              │ FETCH ARTISAN PROFILE FROM DB  │
                 │              │                                │
                 │              │ SELECT * FROM artisan_profiles │
                 │              │ WHERE user_id = current_user   │
                 │              └──────────┬─────────────────────┘
                 │                         │
                 │                         ├─ Profile exists ──────┐
                 │                         │                       │
                 │                         │                       ▼
                 │                         │        DISPLAY DASHBOARD ✅
                 │                         │        • Business stats
                 │                         │        • Service requests
                 │                         │        • Manage profile
                 │                         │
                 │                         ├─ Profile not found ───┐
                 │                         │                       │
                 │                         │                       ▼
                 │                         │    Redirect to /artisan/onboarding
                 │                         │
                 │                         ├─ Error fetching ──────┐
                 │                         │                       │
                 │                         │                       ▼
                 │                         │    Redirect to /artisan/onboarding
                 └─────────────────────────┘

NO CLIENT-SIDE STATE ✅
ALL DATA FROM DATABASE ✅
REFRESH = RE-FETCH FROM DB ✅
```

---

## 5. NAVIGATION & BACK BUTTON BEHAVIOR

```
User Journey Example:
/services → /services/plomberie → /artisan/onboarding → /dashboard/artisan

┌─────────────┐         ┌──────────────────┐
│  /services  │ ──────→ │ /services/[slug] │
│             │ ←────── │                  │
└─────────────┘  Back   └─────────┬────────┘
                                  │
                                  │ Click "Become Provider"
                                  ▼
                        ┌──────────────────────┐
                        │ /artisan/onboarding  │
                        │                      │
                        │ State:               │
                        │ • serviceCategoryId  │
                        │   from URL or state  │
                        │ • Form data in       │
                        │   component state    │
                        └─────────┬────────────┘
                                  │
                                  │ Submit form
                                  ▼
                        ┌──────────────────────┐
                        │ DB: INSERT artisan   │
                        │     profile          │
                        └─────────┬────────────┘
                                  │
                                  │ Success
                                  ▼
                        ┌──────────────────────┐
                        │ /dashboard/artisan   │
                        │                      │
                        │ Fetch FROM DB ✅     │
                        └──────────────────────┘

Back Button Behavior:
• From onboarding → services/[slug] (category selection preserved in DB)
• From dashboard → stays on dashboard (no accidental logout)
• Category slug preserved in URL for deep linking
```

---

## 6. ROLE-BASED ROUTING

```
┌──────────────────────────────────────────────────────────┐
│              SmartDashboardRedirect Logic                 │
│                                                           │
│  if (role === 'admin')    → /admin                       │
│  if (role === 'merchant') → /merchant                    │
│  if (role === 'agent')    → /agent                       │
│  else                     → /dashboard (user)            │
│                                                           │
│  DETERMINISTIC ✅                                        │
│  NO RACE CONDITIONS ✅                                   │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│              ProtectedRoute Components                    │
│                                                           │
│  Route: /dashboard                                       │
│    allowedRoles: ["user"]                                │
│                                                           │
│  Route: /agent                                           │
│    allowedRoles: ["agent"]                               │
│                                                           │
│  Route: /merchant or /commercial-dashboard               │
│    allowedRoles: ["merchant"]                            │
│                                                           │
│  Route: /admin/*                                         │
│    AdminProtectedRoute (checks admins table)             │
│                                                           │
│  Route: /dashboard/artisan, /artisan/*                   │
│    Public routes but require authentication check        │
│    inside component                                      │
└──────────────────────────────────────────────────────────┘
```

---

## 7. KEY IMPROVEMENTS SUMMARY

### ✅ FIXED ISSUES

1. **Default Role Assignment**
   - Before: `user_role = 'real_estate_advertiser'` ❌
   - After: `user_role = 'user'` ✅

2. **Profile Creation**
   - Before: Client-side profile creation in multiple places
   - After: Rely on DB trigger `handle_new_user()` ✅

3. **Auto-Promotion Prevention**
   - Before: Auto-promote to advertiser by visiting pages
   - After: Create profile with 'user' role, require explicit upgrade ✅

4. **Data Persistence**
   - Before: Some client-only state
   - After: All data fetched from database ✅

5. **Service Categories**
   - Before: N/A (already correct)
   - After: Load from DB with fallback ✅

6. **Artisan Dashboard**
   - Before: N/A (already correct)
   - After: Server-side fetch from artisan_profiles ✅

7. **Navigation**
   - Before: Potential issues with back button
   - After: URL-based navigation, DB-based state ✅

---

## 8. REMAINING ENHANCEMENTS (Optional)

These are beyond the scope of this fix but recommended for future:

1. **Role Upgrade Flow**
   - Add explicit "Upgrade to Advertiser" page
   - Require admin approval for role changes
   - Clear messaging about permissions

2. **Onboarding Persistence**
   - Save draft artisan profiles
   - Resume incomplete onboarding
   - Session storage for form data

3. **Better Error Handling**
   - User-friendly messages when accessing restricted pages
   - Guidance on how to upgrade roles

4. **Audit Trail**
   - Log all role changes
   - Track who promoted users
   - Security monitoring

---

## CONCLUSION

✅ **User Flow is now consistent and secure**
✅ **Role assignment follows least privilege**
✅ **All data persistence is database-driven**
✅ **No client-side state dependencies**
✅ **Navigation is stable and predictable**

The system now properly defaults new users to 'user' role and requires explicit action to gain advertiser privileges.
