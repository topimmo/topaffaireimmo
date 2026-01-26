# Auth Flow Diagram

## Before Fix (Broken)

```
User clicks Register
      ↓
Fills form → Submits
      ↓
Supabase creates user
      ↓
Email sent with link
      ↓
User clicks email link
      ↓
Redirects to /login (or preview domain)
      ↓
❌ BLANK PAGE or 502 ERROR
      ↓
User confused, session not created
      ↓
Cannot login
```

## After Fix (Working)

```
User clicks Register
      ↓
Fills form → Submits
      ↓
Supabase creates user with role='real_estate_advertiser'
      ↓
Email sent with link to: https://your-domain.com/auth/callback
      ↓
User clicks email link
      ↓
AuthCallback component loads
      ↓
Shows: "Confirmation en cours..." (Loading spinner)
      ↓
Supabase creates session (PKCE)
      ↓
Shows: "Email confirmed successfully!" (Success icon)
      ↓
Profile loaded with user_role
      ↓
Redirects based on role:
  - admin → /admin
  - commercial_advertiser → /commercial-dashboard
  - real_estate_advertiser → /dashboard
      ↓
✅ User logged in, session active
      ↓
Can access protected routes
      ↓
Can upload images (permission check passes)
```

## Permission Check Flow

### Before (No Debug Info)

```
User tries to upload image
      ↓
canUploadPropertyImages(profile)
      ↓
❌ Returns false
      ↓
Alert: "Permission refusée"
      ↓
User confused (why?)
```

### After (With Debug Logging)

```
User tries to upload image
      ↓
canUploadPropertyImages(profile)
      ↓
❌ Returns false
      ↓
Console logs:
  ❌ Permission denied for image upload
  Profile details: {
    id: "...",
    email: "...",
    user_role: undefined,  ← ISSUE FOUND!
    is_admin: false
  }
  Expected user_role to be "real_estate_advertiser" or "admin"
      ↓
Alert: "Permission refusée"
      ↓
✅ Developer can see the issue: user_role is missing
      ↓
Can investigate why profile wasn't created correctly
```

## Component Architecture

```
┌─────────────────────────────────────────┐
│           App.tsx                       │
│  ┌───────────────────────────────────┐  │
│  │  Route: /auth/callback            │  │
│  │  Component: <AuthCallback />      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│      AuthCallback.tsx                   │
│  ┌───────────────────────────────────┐  │
│  │  1. Read hash params from URL     │  │
│  │  2. Check for errors              │  │
│  │  3. Wait for session              │  │
│  │  4. Show success/error state      │  │
│  │  5. Redirect to dashboard         │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│      AuthContext.tsx                    │
│  ┌───────────────────────────────────┐  │
│  │  onAuthStateChange listener       │  │
│  │  1. Detects new session           │  │
│  │  2. Calls fetchProfile()          │  │
│  │  3. Loads user_role from DB       │  │
│  │  4. Updates context               │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│      ProtectedRoute.tsx                 │
│  ┌───────────────────────────────────┐  │
│  │  1. Wait for profile to load      │  │
│  │  2. Check if user_role exists     │  │
│  │  3. Validate role is allowed      │  │
│  │  4. Log if denied                 │  │
│  │  5. Allow/deny access             │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│      AddListing.tsx                     │
│  ┌───────────────────────────────────┐  │
│  │  handleImageUpload()              │  │
│  │  1. Check profile exists          │  │
│  │  2. Call canUploadPropertyImages()│  │
│  │  3. Log if permission denied      │  │
│  │  4. Allow/deny upload             │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│      permissions.ts                     │
│  ┌───────────────────────────────────┐  │
│  │  canUploadPropertyImages()        │  │
│  │  1. Check profile exists          │  │
│  │  2. Check is_admin === true       │  │
│  │  3. Check user_role === 'admin'   │  │
│  │  4. Check user_role ===           │  │
│  │     'real_estate_advertiser'      │  │
│  │  5. Return true/false             │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Supabase Configuration

```
┌──────────────────────────────────────────┐
│   Supabase Dashboard                     │
│   Authentication → URL Configuration     │
│                                          │
│   Site URL:                              │
│   https://your-domain.com                │
│                                          │
│   Redirect URLs:                         │
│   ✓ https://your-domain.com/auth/callback│
│   ✓ https://your-domain.com/reset-password│
│   ✓ http://localhost:5173/auth/callback │
│                                          │
│   Email Templates:                       │
│   Confirmation: {{ .ConfirmationURL }}   │
│   → Uses Site URL + redirect path        │
│   → Results in: your-domain.com/auth/callback│
└──────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────┐
│   Email sent to user                     │
│                                          │
│   Subject: Confirm your signup           │
│   Link: https://your-domain.com/         │
│         auth/callback#access_token=...   │
└──────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────┐
│   User clicks link                       │
│   Browser navigates to:                  │
│   https://your-domain.com/auth/callback  │
│   with hash params                       │
└──────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────┐
│   React Router matches route             │
│   Renders <AuthCallback />               │
└──────────────────────────────────────────┘
```

## Key Improvements

1. **No More Blank Pages**
   - Always renders a UI (loading/success/error)
   - User always knows what's happening

2. **No More 502 Errors**
   - Uses production domain from env var
   - No redirects to preview domains

3. **Better Debugging**
   - Console logs show exact issue
   - Profile details logged when permission denied

4. **Proper Session Handling**
   - PKCE flow properly handled
   - Session created before redirect
   - Profile loaded with user_role

5. **Role-Based Routing**
   - Admin → /admin
   - Commercial → /commercial-dashboard
   - Real Estate → /dashboard

## Environment Variables

```
┌─────────────────────────────────────────┐
│  .env (or Vercel Environment Vars)     │
│                                         │
│  VITE_SUPABASE_URL=                     │
│    https://xxx.supabase.co              │
│                                         │
│  VITE_SUPABASE_ANON_KEY=                │
│    eyJhbGc...                           │
│                                         │
│  VITE_PRODUCTION_DOMAIN=                │
│    https://your-domain.com              │
│    ↑                                    │
│    └── Used for email redirects         │
└─────────────────────────────────────────┘
```

## Testing Scenarios

### ✅ Scenario 1: New User Signup
```
1. Go to /register
2. Fill form with email/password
3. Submit
4. See: "Vérifiez votre email pour le lien de confirmation"
5. Check email
6. Click confirmation link
7. See: Loading spinner
8. See: "Email confirmed successfully! Redirecting..."
9. Redirect to /dashboard
10. Upload image → SUCCESS
```

### ✅ Scenario 2: Password Reset
```
1. Go to /login
2. Click "Forgot Password"
3. Enter email
4. Check email
5. Click reset link
6. Redirects to /reset-password
7. Enter new password
8. Login with new password → SUCCESS
```

### ✅ Scenario 3: Permission Check
```
1. Login as real_estate_advertiser
2. Go to /add-listing
3. Try to upload image
4. Open browser console
5. See: No permission errors (or debug info if denied)
6. Image upload succeeds
```

### ❌ Scenario 4: Wrong Role (Should Fail)
```
1. Login as commercial_advertiser
2. Try to go to /add-listing
3. ProtectedRoute intercepts
4. Console shows: "User role not allowed for this route"
5. Redirect to /
6. User cannot access page → CORRECT
```
