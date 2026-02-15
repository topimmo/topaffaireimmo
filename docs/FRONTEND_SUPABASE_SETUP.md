# Frontend Supabase Setup Guide

This guide helps you configure and diagnose Supabase connectivity in the TopAffaireImmo frontend application.

## Table of Contents
1. [Environment Configuration](#environment-configuration)
2. [Supabase Client Initialization](#supabase-client-initialization)
3. [Running Diagnostics](#running-diagnostics)
4. [Common Issues & Solutions](#common-issues--solutions)
5. [Security Best Practices](#security-best-practices)

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root with these variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Site Configuration
VITE_SITE_URL=https://www.topaffaireimmo.com
VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.com
```

### Getting Your Supabase Credentials

1. **Login to Supabase Dashboard**: https://app.supabase.com
2. **Select Your Project** or create a new one
3. **Go to Settings → API**
4. **Copy the values**:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

⚠️ **NEVER** expose the `service_role` key in frontend code! It bypasses RLS and is a critical security risk.

### Complete Setup Steps

1. **Copy the example file**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and replace**:
   - `YOUR_PROJECT_ID` with your actual Supabase project ID
   - `your_supabase_anon_key_here` with your anonymous key

3. **Verify the configuration**:
   ```bash
   npm run diagnose:frontend
   ```

## Supabase Client Initialization

The Supabase client is initialized in `src/lib/supabase.ts` with several safety features:

### Key Features

1. **Defensive Environment Variable Access**
   - Never throws errors if env vars are missing
   - Returns `undefined` gracefully

2. **Navigator Locks Disabled**
   - Prevents crashes in Safari private mode and older browsers
   - Automatically disabled before client creation

3. **Storage Detection**
   - Safely detects localStorage availability
   - Disables session persistence if storage is blocked
   - Works in private browsing mode

4. **Auto-Initialization**
   - Client initializes on module load
   - Can return `null` if configuration fails
   - Components must check for null before using

### Using the Supabase Client

```typescript
import { supabase } from '@/lib/supabase';

// Always check for null
if (!supabase) {
  console.error('Supabase not configured');
  return;
}

// Use the client
const { data, error } = await supabase
  .from('properties')
  .select('*')
  .limit(10);
```

### Client Configuration

The client is configured with these options:

```typescript
{
  auth: {
    persistSession: true,              // If storage available
    storage: localStorage,             // If available
    storageKey: 'topaffaireimmo-auth-token',
    autoRefreshToken: true,            // If storage available
    detectSessionInUrl: true,          // If storage available
    flowType: 'pkce'                   // Enhanced security
  }
}
```

## Running Diagnostics

### Frontend Diagnostic Script

Run the comprehensive frontend diagnostic:

```bash
npm run diagnose:frontend
```

This script checks:
- ✓ Environment variables (required & optional)
- ✓ Supabase connection (with timeout)
- ✓ Authentication status
- ✓ Table access & RLS policies
- ✓ Storage buckets & permissions
- ✓ Security issues (exposed service keys)

### Sample Output

```
================================================================================
FRONTEND SUPABASE DIAGNOSTIC
================================================================================

------------------------------------------------------------
Environment Variables Check
------------------------------------------------------------

Required Variables:
✓ VITE_SUPABASE_URL: Supabase project URL
  Value: https://abcdefghijk.supabase.co...
✓ VITE_SUPABASE_ANON_KEY: Supabase anonymous/public key
  Value: eyJhbGciOiJIUzI1NiIsInR5c...

------------------------------------------------------------
Supabase Connection Test
------------------------------------------------------------

1. Testing basic connectivity...
✓ Connection successful
  Successfully connected to Supabase

------------------------------------------------------------
Table Access & RLS Test
------------------------------------------------------------

Testing: site_settings (Site configuration)
✓ Access granted - returned 1 row(s)

Testing: properties (Property listings)
✓ Access granted - returned 1 row(s)
```

### Interpreting Results

- **✓ Green (Pass)**: Everything is working correctly
- **⚠ Yellow (Warning)**: Not critical but should be reviewed
- **✗ Red (Fail)**: Critical issue that must be fixed

## Common Issues & Solutions

### Issue 1: Missing Environment Variables

**Symptom**:
```
✗ VITE_SUPABASE_URL: Missing or placeholder value
✗ VITE_SUPABASE_ANON_KEY: Missing or placeholder value
```

**Solution**:
1. Copy `.env.example` to `.env`
2. Replace placeholder values with real credentials from Supabase Dashboard
3. Restart dev server: `npm run dev`

### Issue 2: Connection Timeout

**Symptom**:
```
✗ Connection failed
  Error: Connection timeout (10s)
```

**Solution**:
1. Verify `VITE_SUPABASE_URL` is correct
2. Check internet connection
3. Verify Supabase project is active (not paused)
4. Check if your IP is blocked by firewall

### Issue 3: RLS Blocking Access

**Symptom**:
```
✗ Access denied (expected public access)
  Error: permission denied for table properties
```

**Solution**:
1. Check RLS policies in Supabase Dashboard
2. Run RLS inspection: See `RLS_FIX_GUIDE.md`
3. Apply minimum policies: `supabase/RLS_MINIMUM_POLICIES.sql`

### Issue 4: Table Not Found

**Symptom**:
```
⚠ Table not found: properties
  This table may not exist yet
```

**Solution**:
1. Run migrations:
   ```bash
   npx supabase db push
   ```
2. Or apply migrations manually in Supabase SQL Editor

### Issue 5: Storage Bucket Missing

**Symptom**:
```
⚠ property-images - NOT FOUND
```

**Solution**:
1. Run setup script:
   ```bash
   npm run setup:storage-buckets
   ```
2. Or create buckets manually in Supabase Dashboard → Storage

### Issue 6: Service Role Key Exposed

**Symptom**:
```
✗ VITE_SUPABASE_SERVICE_ROLE_KEY is set!
  ⚠️ CRITICAL: Service role key should NEVER be in frontend env!
```

**Solution**:
1. **IMMEDIATELY** remove `VITE_SUPABASE_SERVICE_ROLE_KEY` from `.env`
2. Rotate the service role key in Supabase Dashboard (if key was committed)
3. Service role keys should ONLY be in backend/server environments

## Security Best Practices

### Do's ✓

1. **Use Anonymous Key in Frontend**
   - The `anon` key is safe for client-side use
   - RLS policies control what data is accessible

2. **Rely on RLS Policies**
   - All security is enforced at database level
   - Frontend checks are for UX only

3. **Check for Null**
   - Always verify `supabase` is not null before using

4. **Use PKCE Flow**
   - The client uses PKCE flow for better security
   - This is configured automatically

5. **Validate Environment**
   - Run diagnostics before deployment
   - Verify all required env vars are set

### Don'ts ✗

1. **Never Expose Service Role Key**
   - Service role bypasses RLS
   - Only use in backend/server code
   - Never commit to git

2. **Don't Rely on Client-Side Validation**
   - Security must be enforced by RLS policies
   - Client-side checks are for UX only

3. **Don't Hardcode Credentials**
   - Always use environment variables
   - Different credentials per environment

4. **Don't Skip Error Handling**
   - Always handle `null` client
   - Handle RLS permission errors gracefully

## Advanced Configuration

### Custom Supabase Client Options

If you need to customize the client, edit `src/lib/supabase.ts`:

```typescript
const supabaseAuthOptions = {
  auth: {
    persistSession: true,
    storageKey: 'your-custom-key',
    // ... other options
  }
};
```

### Development vs Production

The client automatically handles different environments:

- **Development**: Falls back to local Supabase if configured
- **Production**: Requires proper env vars or returns null

### Logging

Detailed logging is enabled in development mode:

```typescript
if (import.meta.env.DEV) {
  console.log('🔧 Supabase Client Initialization')
  console.log('  - Environment:', 'development')
  console.log('  - URL configured:', true)
  // ...
}
```

## Verification Checklist

Before going to production, verify:

- [ ] Environment variables set correctly
- [ ] Frontend diagnostic passes all tests
- [ ] Authentication works (signup/login)
- [ ] Table access works as expected
- [ ] Storage uploads work
- [ ] RLS policies tested (see RLS_FIX_GUIDE.md)
- [ ] No service role key in frontend env
- [ ] Error handling tested (network issues, RLS blocks)
- [ ] Different user roles tested

## Related Documentation

- [RLS Fix Guide](./RLS_FIX_GUIDE.md) - RLS policy setup and troubleshooting
- [Supabase Diagnostic](./SUPABASE_DIAGNOSTIC_README.md) - Database-level diagnostics
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Production deployment checklist

## Support

If you encounter issues not covered here:

1. Check Supabase Dashboard logs
2. Run both diagnostic scripts:
   - `npm run diagnose:frontend`
   - `npm run diagnose:supabase`
3. Review RLS policies in SQL Editor
4. Check browser console for errors

## Summary

The frontend Supabase setup includes:
- ✓ Safe, defensive client initialization
- ✓ Comprehensive diagnostic tools
- ✓ Error handling and fallbacks
- ✓ Security best practices
- ✓ Development mode helpers

Run `npm run diagnose:frontend` to verify your setup is correct!
