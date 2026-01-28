# Authentication Flow Test Plan

## Prerequisites

### Environment Setup
- [ ] Supabase project is configured and running
- [ ] Environment variables are set correctly in `.env`
- [ ] Redirect URLs are configured in Supabase Dashboard (see `docs/SUPABASE_AUTH_REDIRECT_URLS.md`)
- [ ] Latest migrations have been applied
- [ ] Application is running (locally or deployed)

### Test Accounts
Create these test accounts for comprehensive testing:
- **New User**: Fresh email address never used before
- **Existing User**: Email with an existing account
- **Admin User**: Email in admin_whitelist table (if applicable)

---

## Test Suite 1: User Registration

### Test 1.1: New User Signup (Happy Path)
**Objective**: Verify a new user can successfully sign up

**Steps**:
1. Navigate to `/register`
2. Fill in all required fields:
   - Full Name: "Test User"
   - Email: `test+{timestamp}@example.com`
   - Phone: "+212 6XX XXX XXX" (optional)
   - Announcer Type: Select "Propriétaire" (Owner)
   - Company Name: Leave blank or fill
   - Password: At least 6 characters
   - Confirm Password: Same as password
3. Click "S'inscrire" (Register)

**Expected Results**:
- [ ] Form submits without errors
- [ ] Success screen appears showing "Compte créé avec succès!"
- [ ] Message indicates checking email for confirmation
- [ ] Browser console shows detailed signup logs
- [ ] No error messages in browser console
- [ ] Database trigger creates profile in `public.profiles` table
- [ ] Profile has correct `user_role` = 'user'
- [ ] Profile has correct `announcer_type` = 'proprietaire'

**Browser Console Verification**:
```
✅ SIGNUP API CALL SUCCESSFUL
✅ User created in Supabase Auth
✅ Profile created/updated for user...
```

---

### Test 1.2: Email Confirmation
**Objective**: Verify email confirmation link works

**Prerequisites**: Complete Test 1.1

**Steps**:
1. Check email inbox for confirmation email
2. Note the "From" address (should be noreply@topaffaireimmo.com)
3. Click the confirmation link in the email

**Expected Results**:
- [ ] Confirmation email received within 1-2 minutes
- [ ] Email contains clickable confirmation link
- [ ] Link redirects to `/auth/callback` with token parameters
- [ ] Callback page shows "Confirmation en cours..." loading screen
- [ ] Then shows "Succès!" success message
- [ ] Browser console shows successful session creation
- [ ] User is redirected to home page `/` after 2 seconds
- [ ] User profile shows `is_verified = true` in database

**Browser Console Verification**:
```
🔐 Auth callback triggered
✅ Session created via PKCE code exchange
Redirecting to: /
```

---

### Test 1.3: Duplicate Email Signup
**Objective**: Verify proper error handling for duplicate email

**Steps**:
1. Navigate to `/register`
2. Use the same email from Test 1.1
3. Fill in all other fields
4. Click "S'inscrire"

**Expected Results**:
- [ ] Error message displayed: "Un utilisateur avec cette adresse email existe déjà"
- [ ] No new user created in database
- [ ] Form remains on registration page
- [ ] User can correct the email and retry

---

### Test 1.4: Password Validation
**Objective**: Verify password requirements are enforced

**Steps**:
1. Navigate to `/register`
2. Enter valid email and other fields
3. Enter password: "12345" (only 5 characters)
4. Enter confirm password: "12345"
5. Click "S'inscrire"

**Expected Results**:
- [ ] Error message: "Le mot de passe doit contenir au moins 6 caractères"
- [ ] Form does not submit
- [ ] No API call made

---

### Test 1.5: Password Mismatch
**Objective**: Verify password matching validation

**Steps**:
1. Navigate to `/register`
2. Enter valid email and other fields
3. Enter password: "password123"
4. Enter confirm password: "password456"
5. Click "S'inscrire"

**Expected Results**:
- [ ] Error message: "Les mots de passe ne correspondent pas"
- [ ] Form does not submit

---

### Test 1.6: Announcer Type Selection
**Objective**: Verify different announcer types are handled correctly

**Test Cases**:

#### A. Propriétaire (Owner)
1. Select "Propriétaire" announcer type
2. Complete registration

**Expected**: 
- [ ] Profile has `user_role = 'user'`
- [ ] Profile has `announcer_type = 'proprietaire'`

#### B. Courtier (Broker)
1. Select "Courtier" announcer type
2. Complete registration

**Expected**: 
- [ ] Profile has `user_role = 'agent'`
- [ ] Profile has `announcer_type = 'courtier'`

#### C. Agence (Agency)
1. Select "Agence" announcer type
2. Fill in company name: "Test Agency"
3. Complete registration

**Expected**: 
- [ ] Profile has `user_role = 'merchant'`
- [ ] Profile has `announcer_type = 'agence'`
- [ ] Profile has `company_name = 'Test Agency'`

---

## Test Suite 2: User Login

### Test 2.1: Login with Confirmed Account (Happy Path)
**Objective**: Verify confirmed users can log in

**Prerequisites**: Complete Test 1.2 (confirmed email)

**Steps**:
1. Navigate to `/login`
2. Enter email from Test 1.1
3. Enter correct password
4. Click "Se connecter" (Login)

**Expected Results**:
- [ ] Login successful
- [ ] Browser console shows "SIGNIN SUCCESSFUL"
- [ ] Session is created
- [ ] Profile is loaded
- [ ] User is redirected based on role:
  - `user_role = 'user'` → `/` (home)
  - `user_role = 'agent'` → `/agent`
  - `user_role = 'merchant'` → `/merchant`
  - `user_role = 'admin'` → `/admin`
- [ ] User's name/email shown in header
- [ ] Navigation shows user-specific options

---

### Test 2.2: Login with Unconfirmed Account
**Objective**: Verify unconfirmed users cannot log in

**Prerequisites**: Register without confirming email

**Steps**:
1. Create a new account (don't confirm email)
2. Try to log in with those credentials

**Expected Results**:
- [ ] Error message: "Email non confirmé. Veuillez vérifier votre email."
- [ ] User remains on login page
- [ ] No session created

---

### Test 2.3: Login with Wrong Password
**Objective**: Verify proper error for incorrect password

**Steps**:
1. Navigate to `/login`
2. Enter valid email
3. Enter wrong password
4. Click "Se connecter"

**Expected Results**:
- [ ] Error message: "Email ou mot de passe incorrect"
- [ ] User remains on login page
- [ ] No session created

---

### Test 2.4: Login with Non-Existent Email
**Objective**: Verify proper error for unknown email

**Steps**:
1. Navigate to `/login`
2. Enter email that doesn't exist: `nonexistent@example.com`
3. Enter any password
4. Click "Se connecter"

**Expected Results**:
- [ ] Error message: "Email ou mot de passe incorrect"
- [ ] User remains on login page
- [ ] No detailed information leaked about whether email exists

---

## Test Suite 3: Session Management

### Test 3.1: Session Persistence
**Objective**: Verify session persists across page refreshes

**Prerequisites**: Logged in user

**Steps**:
1. Log in successfully
2. Refresh the page (F5)
3. Navigate to different pages
4. Refresh again

**Expected Results**:
- [ ] User remains logged in after refresh
- [ ] Profile data is retained
- [ ] No re-authentication required
- [ ] Session stored in localStorage (`topaffaireimmo-auth-token`)

---

### Test 3.2: Session Persistence Across Tabs
**Objective**: Verify session works in multiple tabs

**Steps**:
1. Log in in Tab 1
2. Open Tab 2 with same URL
3. Verify logged-in state in Tab 2

**Expected Results**:
- [ ] User is automatically logged in in Tab 2
- [ ] Same profile data shown in both tabs

---

### Test 3.3: Token Refresh
**Objective**: Verify tokens are refreshed automatically

**Steps**:
1. Log in
2. Wait for 1 hour (or modify token expiry for faster testing)
3. Perform an action requiring authentication

**Expected Results**:
- [ ] Token is refreshed automatically
- [ ] User remains logged in
- [ ] No session interruption
- [ ] Browser console shows token refresh logs

---

### Test 3.4: Logout
**Objective**: Verify logout works correctly

**Steps**:
1. Log in
2. Click "Se déconnecter" (Logout)

**Expected Results**:
- [ ] User is logged out
- [ ] Redirected to home page or login page
- [ ] Session cleared from localStorage
- [ ] Profile data cleared from memory
- [ ] Accessing protected routes redirects to login

---

## Test Suite 4: Password Reset

### Test 4.1: Request Password Reset
**Objective**: Verify password reset email is sent

**Steps**:
1. Navigate to `/login`
2. Click "Mot de passe oublié?" (Forgot password?)
3. Enter registered email
4. Click submit

**Expected Results**:
- [ ] Success message: "Email de réinitialisation envoyé"
- [ ] Reset email received within 1-2 minutes
- [ ] Email contains reset link

---

### Test 4.2: Reset Password via Email Link
**Objective**: Verify password can be reset via email

**Prerequisites**: Complete Test 4.1

**Steps**:
1. Click reset link in email
2. Should redirect to `/reset-password` with token
3. Enter new password
4. Confirm new password
5. Click "Réinitialiser le mot de passe"

**Expected Results**:
- [ ] Success message displayed
- [ ] Old password no longer works
- [ ] Can log in with new password
- [ ] Redirected to login or home page

---

## Test Suite 5: Cross-Domain Testing

### Test 5.1: Production Domain
**Objective**: Verify auth works on production domain

**Environment**: https://topaffaireimmo.com

**Steps**: Run all tests from Suite 1 and 2

**Expected Results**: All tests pass

---

### Test 5.2: Vercel Preview Domain
**Objective**: Verify auth works on preview deployments

**Environment**: https://topaffaireimmo-*.vercel.app

**Steps**: Run all tests from Suite 1 and 2

**Expected Results**: All tests pass

---

### Test 5.3: Localhost Development
**Objective**: Verify auth works locally

**Environment**: http://localhost:5173

**Steps**: Run all tests from Suite 1 and 2

**Expected Results**: All tests pass

---

## Test Suite 6: Edge Cases

### Test 6.1: Slow Network
**Objective**: Verify graceful handling of slow connections

**Steps**:
1. Use browser dev tools to throttle network to "Slow 3G"
2. Attempt signup
3. Attempt login

**Expected Results**:
- [ ] Loading indicators shown
- [ ] No timeout errors (or graceful timeout handling)
- [ ] User receives feedback about slow connection

---

### Test 6.2: Offline Mode
**Objective**: Verify offline handling

**Steps**:
1. Disconnect from internet
2. Try to log in or sign up

**Expected Results**:
- [ ] Appropriate error message: "Problème de connexion"
- [ ] No silent failures

---

### Test 6.3: Missing Environment Variables
**Objective**: Verify graceful degradation

**Steps**:
1. Remove VITE_SUPABASE_URL from .env
2. Start application
3. Try to access auth pages

**Expected Results**:
- [ ] Clear error message about missing configuration
- [ ] App doesn't crash
- [ ] Console shows helpful error message

---

## Test Suite 7: Database Integrity

### Test 7.1: Profile Creation via Trigger
**Objective**: Verify trigger creates profile automatically

**Steps**:
1. Sign up a new user
2. Immediately check database

**SQL Query**:
```sql
SELECT id, email, user_role, announcer_type, is_admin, is_active, is_verified
FROM public.profiles
WHERE email = 'test@example.com';
```

**Expected Results**:
- [ ] Profile row exists
- [ ] `id` matches auth.users.id
- [ ] `user_role` is correctly set
- [ ] `announcer_type` is correctly set
- [ ] `is_admin = false` (unless whitelisted)
- [ ] `is_active = true`
- [ ] `is_verified = false` (until email confirmed)

---

### Test 7.2: RLS Policy Enforcement
**Objective**: Verify users can only access their own profile

**Steps**:
1. Log in as User A
2. Try to fetch User B's profile via Supabase client

**Expected Results**:
- [ ] Access denied or empty result
- [ ] RLS policy blocks unauthorized access
- [ ] No database error

---

### Test 7.3: Admin Access
**Objective**: Verify admins can access all profiles

**Prerequisites**: User with `is_admin = true` or `user_role = 'admin'`

**Steps**:
1. Log in as admin
2. Try to fetch other users' profiles

**Expected Results**:
- [ ] Admin can view all profiles
- [ ] RLS allows admin access

---

## Monitoring & Debugging

### Browser Console Logs
Monitor for these key logs during testing:

✅ **Success Indicators**:
```
✅ SIGNUP API CALL SUCCESSFUL
✅ User created in Supabase Auth
✅ Profile created/updated for user...
✅ SIGNIN SUCCESSFUL
✅ Session created
✅ Profile loaded successfully
```

❌ **Error Indicators**:
```
❌ SIGNUP FAILED
❌ SIGNIN FAILED
❌ Error fetching profile
❌ RLS Policy Error
```

### Supabase Dashboard Logs
Check **Logs → Auth** in Supabase Dashboard for:
- Failed login attempts
- Rate limiting
- Invalid tokens
- Profile creation errors

### Database Queries
Use these queries to verify state:

**Check user count**:
```sql
SELECT COUNT(*) FROM auth.users;
```

**Check profile count**:
```sql
SELECT COUNT(*) FROM public.profiles;
```

**Check for orphaned profiles**:
```sql
SELECT p.id, p.email
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE u.id IS NULL;
```

**Check for users without profiles**:
```sql
SELECT u.id, u.email
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
```

---

## Acceptance Criteria

The auth flow is considered **FIXED** when:

- [ ] All tests in Suite 1 (Registration) pass
- [ ] All tests in Suite 2 (Login) pass
- [ ] All tests in Suite 3 (Session) pass
- [ ] All tests in Suite 4 (Password Reset) pass
- [ ] All tests in Suite 5 (Cross-Domain) pass
- [ ] No orphaned users or profiles in database
- [ ] No RLS policy errors in logs
- [ ] No JavaScript console errors during normal flow
- [ ] Success rate > 99% in production monitoring

---

## Rollback Plan

If issues are discovered:

1. **Revert migrations**: Roll back to migration 045
2. **Restore old trigger**: Use backup of `handle_new_user()` function
3. **Clear corrupted data**: Remove any incomplete profiles
4. **Notify users**: Send email to affected users if needed

---

## Post-Deployment Verification

After deploying to production:

1. [ ] Test one complete signup → confirm → login flow
2. [ ] Monitor Supabase Auth logs for 24 hours
3. [ ] Check error rates in application monitoring
4. [ ] Verify no increase in support tickets related to auth
5. [ ] Confirm email delivery rates are normal (>95%)

---

## Support Checklist

If users report auth issues, verify:

- [ ] Environment variables are set in Vercel
- [ ] Redirect URLs include the correct domain
- [ ] Migrations are applied in correct order
- [ ] Supabase project is not paused/disabled
- [ ] SMTP is configured correctly
- [ ] No rate limiting is affecting the user
- [ ] Browser is not blocking third-party cookies
- [ ] No ad blockers interfering with auth requests
