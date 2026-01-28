# Supabase Auth Redirect URLs Configuration

## Overview
This document explains how to configure redirect URLs in Supabase for the topaffaireimmo application to ensure email confirmations, password resets, and OAuth callbacks work correctly across all environments.

## Required Configuration in Supabase Dashboard

### Step 1: Navigate to Auth Settings
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**

### Step 2: Configure Site URL
Set the **Site URL** to your primary production domain:
```
https://topaffaireimmo.com
```

or if using www:
```
https://www.topaffaireimmo.com
```

**Important:** This should match the value of `VITE_PRODUCTION_DOMAIN` in your `.env` file.

### Step 3: Add Redirect URLs
Add the following URLs to **Redirect URLs** section (one per line):

#### Production URLs
```
https://topaffaireimmo.com/**
https://www.topaffaireimmo.com/**
https://topaffaireimmo.com/auth/callback
https://www.topaffaireimmo.com/auth/callback
https://topaffaireimmo.com/reset-password
https://www.topaffaireimmo.com/reset-password
```

#### Vercel Preview Deployments
```
https://*.vercel.app/**
https://topaffaireimmo-*.vercel.app/**
```

#### Local Development
```
http://localhost:5173/**
http://localhost:5173/auth/callback
http://localhost:5173/reset-password
http://127.0.0.1:5173/**
```

## Explanation of Wildcards

- `/**` - Allows all paths under the domain
- `*.vercel.app` - Matches any Vercel preview deployment
- `topaffaireimmo-*.vercel.app` - Matches only your project's preview deployments

## Why This Is Important

### Email Confirmations
When a user signs up, Supabase sends a confirmation email with a link like:
```
https://topaffaireimmo.com/auth/callback?token=...&type=signup
```

If this URL is not in the allowed redirect list, the confirmation will fail.

### Password Resets
Password reset emails contain links like:
```
https://topaffaireimmo.com/reset-password?token=...&type=recovery
```

### OAuth Callbacks
If you enable Google/Facebook login later, they will redirect to:
```
https://topaffaireimmo.com/auth/callback?code=...&provider=google
```

## Environment Variables

Ensure your `.env` file contains:
```bash
# Production domain (used for email redirect URLs)
VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.com

# Supabase configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Testing

### Test Email Confirmation
1. Sign up with a new email address
2. Check your email for the confirmation link
3. Click the link
4. Verify you're redirected to `/auth/callback`
5. Verify you're then redirected to the appropriate dashboard

### Test Password Reset
1. Go to `/login`
2. Click "Forgot password?"
3. Enter your email
4. Check your email for the reset link
5. Click the link
6. Verify you're redirected to `/reset-password`
7. Enter a new password
8. Verify you can log in with the new password

## Troubleshooting

### Error: "Invalid redirect URL"
- Check that the URL is in the Supabase redirect URLs list
- Verify wildcards are correct (e.g., `/**` not just `*`)
- Check for typos in domain names

### Error: "No session after email confirmation"
- Verify the callback page is handling the URL parameters correctly
- Check browser console for errors
- Verify `VITE_PRODUCTION_DOMAIN` matches the Site URL in Supabase

### Preview Deployments Not Working
- Ensure `https://*.vercel.app/**` is in the redirect URLs
- If using a different hosting provider, add their domain pattern

## Security Considerations

### Do NOT Add
- Untrusted third-party domains
- Overly broad wildcards like `https://**` (would allow any domain)
- HTTP URLs in production (except localhost for development)

### Best Practices
- Use HTTPS for all production URLs
- Keep the list as specific as possible
- Review the list periodically
- Remove old/unused domains

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [URL Configuration Guide](https://supabase.com/docs/guides/auth/redirect-urls)
- [PKCE Flow](https://supabase.com/docs/guides/auth/server-side/pkce-flow)

## Support

If you encounter issues:
1. Check the Supabase Dashboard → Logs → Auth for detailed error messages
2. Check browser console for client-side errors
3. Verify environment variables are set correctly
4. Ensure migrations are up to date
