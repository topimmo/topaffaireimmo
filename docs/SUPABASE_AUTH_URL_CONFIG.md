# Supabase Auth URL Configuration Guide

## Critical Configuration for Production

### Overview
To ensure email confirmation links work correctly and avoid 502 Bad Gateway errors, you must configure Supabase Auth URL settings properly.

### Required Configuration Steps

#### 1. Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to: **Authentication** → **URL Configuration**

#### 2. Set Site URL
The **Site URL** is the primary domain users will be redirected to after authentication actions (email confirmation, password reset, etc.)

**Production Setting:**
```
Site URL: https://topaffaireimmo.com
```

**Important Notes:**
- Use your actual production domain (e.g., `https://topaffaireimmo.com` or `https://www.topaffaireimmo.com`)
- Do NOT use temporary domains like `tempo.build` or `*.vercel.app` in production
- Must be HTTPS in production
- Should match the `VITE_PRODUCTION_DOMAIN` environment variable

#### 3. Configure Redirect URLs
Add these URLs to the **Redirect URLs** whitelist (one per line):

**Production URLs:**
```
https://topaffaireimmo.com/*
https://www.topaffaireimmo.com/*
https://topaffaireimmo.com/auth/callback
https://www.topaffaireimmo.com/auth/callback
https://topaffaireimmo.com/reset-password
https://www.topaffaireimmo.com/reset-password
```

**Development URLs (for local testing):**
```
http://localhost:5173/*
http://localhost:5173/auth/callback
http://localhost:5173/reset-password
http://127.0.0.1:5173/*
```

**Optional - Vercel Preview URLs (use with caution):**
```
https://*.vercel.app/*
```

**⚠️ Warning:** Only add Vercel preview URLs if you need to test auth in preview deployments. For production, use your custom domain only.

#### 4. Configure Additional Settings

##### Email Templates
1. Go to: **Authentication** → **Email Templates**
2. Update templates for:
   - **Confirm signup** - Ensure it uses `{{ .SiteURL }}/auth/callback?...`
   - **Invite user** - Ensure it uses `{{ .SiteURL }}/auth/callback?...`
   - **Reset password** - Ensure it uses `{{ .SiteURL }}/reset-password?...`

##### Auth Providers
1. Go to: **Authentication** → **Providers**
2. Enable/configure providers as needed:
   - Email (should be enabled)
   - Phone (optional)
   - OAuth providers (Google, Facebook, etc.) - optional

##### Email Settings (SMTP)
Configure custom SMTP if needed:
1. Go to: **Settings** → **Auth** → **SMTP Settings**
2. Use Hostinger SMTP or other email service
3. See separate SMTP configuration guide in `/docs/SUPABASE_DASHBOARD_EMAIL_CONFIG.md`

### Environment Variables

Ensure these are set in your deployment platform (Vercel):

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Production Domain (CRITICAL)
VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.com
```

**Important:**
- The `VITE_PRODUCTION_DOMAIN` must match the **Site URL** in Supabase
- This is used by the frontend to construct `emailRedirectTo` URLs
- Without this, email links may redirect to incorrect domains

### Testing the Configuration

#### Test 1: Email Confirmation
1. Register a new user account
2. Check email inbox for confirmation link
3. Verify the link contains your production domain (not `*.vercel.app` or `tempo.build`)
4. Click the link
5. Should redirect to `https://topaffaireimmo.com/auth/callback?...`
6. Should successfully create session and redirect to dashboard
7. No blank screens or 502 errors

#### Test 2: Password Reset
1. Go to login page
2. Click "Forgot password"
3. Enter email and submit
4. Check email inbox for reset link
5. Verify link contains your production domain
6. Click the link
7. Should redirect to `https://topaffaireimmo.com/reset-password?...`
8. Should allow password reset

#### Test 3: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. During auth callback, look for logs:
   - `🔐 Auth callback triggered`
   - `✅ Session created successfully`
   - No error messages

### Common Issues & Solutions

#### Issue: 502 Bad Gateway on email confirmation
**Cause:** Email link points to wrong domain (e.g., old preview URL)
**Solution:** 
1. Update Site URL in Supabase to production domain
2. Update Redirect URLs to include production domain
3. Test with new user registration

#### Issue: Blank page after clicking email link
**Cause:** Missing auth callback route or PKCE code exchange failing
**Solution:**
1. Verify `/auth/callback` route exists in your app
2. Check browser console for errors
3. Ensure AuthCallback component uses `exchangeCodeForSession()`

#### Issue: "Invalid redirect URL" error
**Cause:** Current URL not in Redirect URLs whitelist
**Solution:**
1. Add the exact URL pattern to Redirect URLs in Supabase
2. Use wildcards carefully (e.g., `https://topaffaireimmo.com/*`)

#### Issue: Email links use wrong domain in preview deployments
**Expected Behavior:** This is normal. Preview deployments should NOT be used for production email testing.
**Solution:**
1. Always test auth flows on your production domain
2. If you need to test in preview, temporarily add the preview URL to Redirect URLs
3. Remove preview URLs from whitelist before going to production

### Security Best Practices

1. **Minimize Redirect URLs:** Only add URLs you actually need
2. **Use HTTPS:** Never allow HTTP in production
3. **Avoid Wildcards:** Use specific paths instead of `/*` when possible
4. **Remove Test URLs:** Clean up development/preview URLs before production launch
5. **Monitor Auth Logs:** Check Supabase logs for suspicious auth attempts

### Verification Checklist

- [ ] Site URL set to production domain
- [ ] Production domain added to Redirect URLs
- [ ] `VITE_PRODUCTION_DOMAIN` environment variable matches Site URL
- [ ] Email templates use `{{ .SiteURL }}`
- [ ] Test user registration → email confirmation → dashboard works
- [ ] Test password reset flow works
- [ ] No 502 errors
- [ ] No blank screens
- [ ] Browser console shows no auth errors

### Support Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)

---

**Last Updated:** 2026-01-26
**Maintained By:** TopAffaireImmo Development Team
