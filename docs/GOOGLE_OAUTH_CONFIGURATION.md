# Google OAuth Configuration Guide

This guide explains how to properly configure Google OAuth for TopAffaireImmo to show the correct branding during login.

## Problem

When users click "Sign in with Google", they see:
- `ghzdehknuzrtmfrimzdw.supabase.co` instead of **TopAffaireImmo**

This looks unprofessional and breaks user trust.

## Solution: Configure Google Cloud Console OAuth Consent Screen

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (the one linked to this application)
3. Navigate to **APIs & Services** > **OAuth consent screen**

### Step 2: Configure OAuth Consent Screen

#### Required Fields:

1. **App Name**: `TopAffaireImmo`
   - This is what users will see: "Access to application TopAffaireImmo"

2. **User support email**: 
   - Enter a valid support email (e.g., `support@topaffaireimmo.com`)

3. **Developer contact information**:
   - Enter developer email addresses (required by Google)

4. **Authorized domains**:
   - Add: `topaffaireimmo.com`
   - This ensures Google recognizes your domain as legitimate

5. **Application home page** (recommended):
   - `https://www.topaffaireimmo.com`

6. **Application privacy policy link** (recommended):
   - `https://www.topaffaireimmo.com/privacy`

7. **Application terms of service link** (recommended):
   - `https://www.topaffaireimmo.com/terms`

#### Optional but Recommended:

8. **App logo**:
   - Upload your TopAffaireImmo logo (120x120px minimum)
   - Makes the OAuth screen more professional

### Step 3: Configure OAuth 2.0 Client

1. Navigate to **APIs & Services** > **Credentials**
2. Find your OAuth 2.0 Client ID (used by Supabase)
3. Click to edit

#### Authorized JavaScript origins:
```
https://topaffaireimmo.com
https://www.topaffaireimmo.com
https://ghzdehknuzrtmfrimzdw.supabase.co
```

#### Authorized redirect URIs:
```
https://ghzdehknuzrtmfrimzdw.supabase.co/auth/v1/callback
https://www.topaffaireimmo.com/auth/callback
https://topaffaireimmo.com/auth/callback
```

**Important**: Include both www and non-www versions if you support both.

### Step 4: Verify in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project: `ghzdehknuzrtmfrimzdw`
3. Navigate to **Authentication** > **Providers**
4. Click on **Google**

#### Verify Configuration:

- **Enabled**: ✅ Yes
- **Client ID**: Should match your Google OAuth Client ID
- **Client Secret**: Should match your Google OAuth Client Secret
- **Redirect URL**: Should show `https://ghzdehknuzrtmfrimzdw.supabase.co/auth/v1/callback`

### Step 5: Configure Supabase Auth URLs

1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**

#### Set the following:

- **Site URL**: 
  ```
  https://www.topaffaireimmo.com
  ```

- **Redirect URLs** (add all of these):
  ```
  https://topaffaireimmo.com/*
  https://www.topaffaireimmo.com/*
  https://topaffaireimmo.com/auth/callback
  https://www.topaffaireimmo.com/auth/callback
  ```

**Important**: The wildcard `/*` allows redirects to any path on your domain.

### Step 6: Test the Configuration

1. Clear your browser cache and cookies
2. Go to `https://www.topaffaireimmo.com/login`
3. Click "Sign in with Google"
4. Verify that the OAuth consent screen shows:
   - ✅ "Access to application **TopAffaireImmo**"
   - ✅ Your app logo (if uploaded)
   - ❌ NOT the Supabase project reference

## Common Issues and Solutions

### Issue: Still seeing Supabase project reference

**Solution**: 
- Clear browser cache completely
- Wait 5-10 minutes for Google OAuth changes to propagate
- Make sure you saved all changes in Google Cloud Console

### Issue: OAuth redirect fails after login

**Solution**:
- Verify redirect URLs in both Google Cloud Console and Supabase
- Ensure www/non-www domains are both configured
- Check browser console for redirect errors

### Issue: "Redirect URI mismatch" error

**Solution**:
- Check that the redirect URI in the error message is listed in your Google OAuth Client authorized redirect URIs
- Add it if missing
- Remember to save changes

## WWW vs Non-WWW Domain Handling

TopAffaireImmo should handle both:
- `https://topaffaireimmo.com` 
- `https://www.topaffaireimmo.com`

**Recommendation**: Decide on ONE primary domain and redirect the other.

Example (using www as primary):
- Main site: `https://www.topaffaireimmo.com`
- Redirect: `https://topaffaireimmo.com` → `https://www.topaffaireimmo.com`

Configure this redirect in your hosting provider (Vercel).

## Publishing Status

### For Testing (Current):
- OAuth consent screen status: **Testing**
- Allows up to 100 test users
- No verification required

### For Production:
- OAuth consent screen status: **In Production**
- Requires Google verification if using sensitive scopes
- No user limit

**For basic OAuth (email, profile)**: Testing mode is sufficient.

## Security Best Practices

1. **Never commit OAuth secrets to Git**
   - Store Client ID and Secret in Supabase only
   - Use environment variables in your code

2. **Use HTTPS only**
   - All redirect URLs must use `https://`
   - Never use `http://` in production

3. **Validate redirect URLs**
   - Only allow redirects to your domain
   - Prevent open redirect vulnerabilities

4. **Regular audits**
   - Review authorized redirect URIs periodically
   - Remove any unused or test URLs

## Support

If you encounter issues:
1. Check Supabase logs: **Authentication** > **Logs**
2. Check browser console for errors
3. Verify Google OAuth configuration
4. Test with a fresh incognito window

## Related Documentation

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Google Auth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
