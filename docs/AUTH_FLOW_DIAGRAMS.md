# Auth Flow Diagrams

## Before Fix: Email Confirmation Flow (Had Issues)

```
User Registration
    ↓
Supabase Auth.signUp()
    ↓
Email Sent (with confirmation link)
    ↓
User Clicks Link → https://[WRONG-DOMAIN]/auth/callback?...
    ↓
❌ 502 Bad Gateway OR Blank Screen
    ↓
Session NOT created
    ↓
User stuck, cannot login
```

**Problems:**
- Email link pointed to wrong domain (preview URL, tempo.build, etc.)
- Auth callback only checked hash params, missed PKCE query params
- No proper error handling for PKCE code exchange
- Blank screens when errors occurred

---

## After Fix: Email Confirmation Flow (Works Reliably)

```
User Registration
    ↓
Supabase Auth.signUp()
  - Uses VITE_PRODUCTION_DOMAIN for emailRedirectTo
  - Stores metadata (full_name, user_role, etc.)
    ↓
Email Sent (with confirmation link)
  - Link: https://topaffaireimmo.com/auth/callback?code=...
    ↓
User Clicks Link → https://topaffaireimmo.com/auth/callback
    ↓
AuthCallback.tsx:
  1. ✅ Check query params for PKCE code
  2. ✅ Check hash params for tokens
  3. ✅ Check for errors
    ↓
If PKCE code found:
  - Call supabase.auth.exchangeCodeForSession(code)
  - ✅ Session created successfully
    ↓
If hash tokens found:
  - Supabase auto-creates session via detectSessionInUrl
  - ✅ Session created successfully
    ↓
If error found:
  - ✅ Show error message (not blank screen)
  - ✅ Log to console + Sentry
  - Redirect to /login after delay
    ↓
Profile Creation Trigger Fires:
  - handle_new_user() function
  - Creates profile with:
    • user_role = 'real_estate_advertiser' (default)
    • advertiser_type = 'owner' (default)
    • Other metadata from signup
    ↓
✅ Success Screen: "Email confirmed successfully!"
    ↓
Redirect to Dashboard (after 2 seconds)
    ↓
User logged in with profile ready
```

**Improvements:**
- ✅ Correct domain in email links
- ✅ PKCE code exchange supported
- ✅ Both hash and query params checked
- ✅ Proper error handling (no blank screens)
- ✅ Sentry integration for debugging
- ✅ Profile created with advertiser_type

---

## Profile Creation & Sync Flow

### Before Fix:
```
New User Created in auth.users
    ↓
Trigger: handle_new_user()
    ↓
Profile created BUT:
  - advertiser_type = NULL ❌
    ↓
User tries to upload images
    ↓
Storage policy checks advertiser_type
    ↓
❌ Permission Denied
"You don't have permission to upload images"
```

### After Fix:
```
New User Created in auth.users
    ↓
Trigger: handle_new_user()
  - Enhanced with advertiser_type logic
    ↓
Profile created with:
  - user_role = 'real_estate_advertiser'
  - advertiser_type = 'owner' ✅
  - full_name, phone, company_name (from metadata)
    ↓
User tries to upload images
    ↓
Storage policy checks:
  1. auth.uid() IS NOT NULL ✅
  2. Folder matches user ID ✅
  3. (advertiser_type check relaxed) ✅
    ↓
✅ Upload succeeds
```

---

## Mobile UI Safe Area Flow

### Before Fix:
```
Mobile Browser (iOS/Android with notch)
    ↓
App loads with viewport: width=device-width, initial-scale=1.0
    ↓
Safe area insets NOT available
    ↓
MobileFAB positioned: bottom: 1.5rem (24px)
    ↓
❌ Button cut off by notch/home indicator
❌ Content hidden behind notch
```

### After Fix:
```
Mobile Browser (iOS/Android with notch)
    ↓
App loads with viewport: width=device-width, initial-scale=1.0, viewport-fit=cover ✅
    ↓
Safe area insets available: env(safe-area-inset-bottom)
    ↓
MobileFAB positioned: bottom: calc(1.5rem + env(safe-area-inset-bottom)) ✅
    ↓
Body has safe area padding: padding-left/right: env(safe-area-inset-*) ✅
    ↓
✅ Button fully visible above notch
✅ Content not hidden
✅ Proper spacing maintained
```

---

## Storage Upload Permission Flow

### Before Fix:
```
User clicks "Upload Photos"
    ↓
Frontend checks: canUploadPropertyImages(profile)
  - Checks user_role only
  - ✅ Returns true (user is real_estate_advertiser)
    ↓
Upload starts
    ↓
Storage policy checks:
  - bucket_id = 'property-images' ✅
  - auth.uid() IS NOT NULL ✅
  - Folder matches user ID ✅
  - Profile has advertiser_type ❌ (NULL)
    ↓
❌ Policy rejects upload
"Permission denied"
```

### After Fix:
```
User clicks "Upload Photos"
    ↓
Frontend checks: canUploadPropertyImages(profile)
  - Checks user_role ✅
  - (advertiser_type validated separately)
    ↓
Optional check: hasValidAdvertiserType(profile)
  - Returns true if advertiser_type is set
  - Can show onboarding prompt if not
    ↓
Upload starts
    ↓
Storage policy checks:
  - bucket_id = 'property-images' ✅
  - auth.uid() IS NOT NULL ✅
  - Folder matches user ID ✅
  - (Profile check relaxed - migration 039) ✅
    ↓
✅ Upload succeeds
```

**Note:** Storage policies were already relaxed in migration 039. The fix ensures advertiser_type is always set, providing defense-in-depth.

---

## Security DEFINER Function Flow

### Before Fix:
```
User calls function: can_insert_property(user_id)
    ↓
Function runs with SECURITY DEFINER
  - Runs with function owner's privileges
  - search_path NOT explicitly set ❌
    ↓
⚠️ Risk: Attacker could manipulate search_path
⚠️ Risk: Function could call wrong tables/functions
⚠️ Supabase Security Advisor warns
```

### After Fix:
```
User calls function: can_insert_property(user_id)
    ↓
Function runs with SECURITY DEFINER
  - Runs with function owner's privileges
  - SET search_path = public ✅
    ↓
✅ Function always uses correct schema
✅ SQL injection via search_path prevented
✅ Supabase Security Advisor happy
```

---

## Complete User Journey: Signup to Upload

### Happy Path (After All Fixes)

```
1. User visits /register
    ↓
2. Fills form:
   - Email: user@example.com
   - Password: ••••••
   - Full Name: John Doe
   - (user_role defaults to 'real_estate_advertiser')
    ↓
3. Clicks "S'inscrire"
    ↓
4. AuthContext.signUp() called:
   - Calls supabase.auth.signUp()
   - emailRedirectTo = VITE_PRODUCTION_DOMAIN + '/auth/callback'
   - metadata includes: full_name, user_role
    ↓
5. Supabase creates user in auth.users
    ↓
6. Trigger: handle_new_user() fires
   - Creates profile with advertiser_type = 'owner'
    ↓
7. Email sent to user@example.com
   - Link: https://topaffaireimmo.com/auth/callback?code=ABC123...
    ↓
8. User checks email, clicks link
    ↓
9. Browser navigates to /auth/callback
    ↓
10. AuthCallback.tsx:
    - Detects PKCE code in URL
    - Calls exchangeCodeForSession(code)
    - Session created ✅
    ↓
11. Success screen shown for 2 seconds
    ↓
12. Redirects to /dashboard
    ↓
13. User navigates to /add-listing
    ↓
14. Clicks "Upload Photos"
    ↓
15. Selects 3 images
    ↓
16. Upload starts:
    - Permission check passes ✅
    - Storage policy allows upload ✅
    - Files uploaded to: property-images/[user_id]/temp/[timestamp].jpg
    ↓
17. ✅ Images uploaded successfully
    ↓
18. User completes listing form
    ↓
19. Submits listing
    ↓
20. ✅ Listing created with images
```

---

## Error Handling Improvements

### Error: Email Confirmation Fails

**Before:**
```
Error occurs → Blank white screen → User confused
```

**After:**
```
Error occurs
    ↓
Show error UI:
  - ❌ Icon
  - "Erreur" heading
  - Descriptive message
  - "Redirection vers la page de connexion..." note
    ↓
Log to console:
  - Error details
  - URL parameters (without secrets)
    ↓
Optional: Log to Sentry
    ↓
Redirect to /login after 3 seconds
    ↓
User can try again or contact support
```

### Error: Upload Permission Denied

**Before:**
```
"Permission denied" → Generic error → User confused
```

**After:**
```
Permission check fails
    ↓
Check reason:
  - User not authenticated?
  - User role incorrect?
  - Advertiser type missing?
    ↓
Show appropriate error:
  - "Veuillez vous connecter"
  - "Seuls les annonceurs immobiliers..."
  - "Veuillez sélectionner votre type d'annonceur..."
    ↓
Provide action:
  - Link to login
  - Link to profile settings
  - Link to onboarding
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Vite + React)                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  AuthCallback.tsx         AuthContext.tsx                    │
│  ├─ PKCE code exchange    ├─ Profile interface               │
│  ├─ Error handling        ├─ ensureProfile()                 │
│  └─ Sentry logging        └─ fetchProfile()                  │
│                                                               │
│  permissions.ts           storage.ts                         │
│  ├─ Role checks           ├─ Upload with retry               │
│  ├─ Advertiser type       ├─ Error handling                  │
│  └─ Error messages        └─ Validation                      │
│                                                               │
│  Mobile Components                                           │
│  ├─ MobileFAB (safe area)                                   │
│  ├─ CSS utilities                                            │
│  └─ Viewport config                                          │
│                                                               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTPS
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase Backend                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Auth                     Database (PostgreSQL)              │
│  ├─ Email confirmation    ├─ profiles table                  │
│  ├─ PKCE flow            │   ├─ user_role                   │
│  ├─ Session management   │   ├─ advertiser_type ✨          │
│  └─ URL configuration    │   └─ metadata                    │
│                          │                                   │
│  Storage                 │  Triggers & Functions             │
│  ├─ property-images      │  ├─ handle_new_user() ✨         │
│  ├─ RLS policies         │  │   └─ SET search_path ✨       │
│  └─ Folder structure     │  └─ can_insert_property() ✨     │
│                          │      └─ SET search_path ✨       │
│                          │                                   │
└─────────────────────────────────────────────────────────────┘

✨ = Changes made in this PR
```

---

**Created:** 2026-01-26
**Purpose:** Visual aid for understanding the fixes
