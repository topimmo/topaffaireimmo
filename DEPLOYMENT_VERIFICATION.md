# Deployment Verification Guide

This guide explains how to verify that Vercel production is deploying the latest commit from the main branch.

## Quick Verification Steps

### 1. Check Build Info in Admin Panel (Recommended)

The easiest way to verify the deployed version:

1. Navigate to the production site
2. Log in as an admin user
3. Go to **Settings** (`/admin/settings`)
4. Scroll to the **"Build Information"** section
5. Check the following:
   - **Commit SHA**: Should match the latest commit on main branch
   - **Build Time**: Should be recent (within expected deployment window)
   - **Environment**: Should show "Production"

### 2. Compare with GitHub

To verify the commit SHA matches:

1. Go to your GitHub repository
2. Navigate to the main branch
3. Copy the latest commit SHA (first 7-8 characters)
4. Compare with the SHA shown in Admin Settings

### 3. Using Browser DevTools

For quick checks, you can also inspect the build info directly:

```javascript
// Open browser console on the production site
console.log('Commit SHA:', import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA);
```

## CI/CD Pipeline

### GitHub Actions Workflow

Every push to the `main` branch triggers a CI workflow that:

1. ✅ Installs dependencies with `npm ci`
2. ✅ Runs TypeScript type checking (non-blocking)
3. ✅ Builds the application with `npm run build`
4. ✅ Uploads build artifacts for inspection

**Location**: `.github/workflows/ci-main.yml`

The build **must succeed** for the workflow to pass. If the build fails, investigate immediately.

### Vercel Deployment

Vercel automatically deploys when:

- Code is pushed to the `main` branch (production deployment)
- A pull request is created (preview deployment)

**Vercel Configuration**: `vercel.json`

Key settings:
- Build command: `npm run build`
- Output directory: `dist`
- Framework: Vite
- Environment variable: `VITE_VERCEL_GIT_COMMIT_SHA` (auto-populated)

## Troubleshooting Deployment Issues

### Issue: Production shows old commit SHA

**Possible causes:**
1. Vercel deployment failed silently
2. Vercel is using cached assets
3. Production domain is pointing to wrong deployment

**Solutions:**

1. **Check Vercel Dashboard**:
   - Go to your Vercel project
   - Click on "Deployments"
   - Verify the latest deployment shows "Production" status
   - Check the commit SHA matches your latest commit

2. **Redeploy from Vercel**:
   - Find the correct deployment
   - Click "..." menu → "Redeploy"
   - Wait for deployment to complete
   - Verify in Admin Settings

3. **Force Clear Cache**:
   - The `index.html` is configured with `no-cache` headers
   - Try hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Clear browser cache completely

### Issue: Build fails on Vercel

**Debugging steps:**

1. Check Vercel build logs for errors
2. Verify all environment variables are set in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_PRODUCTION_DOMAIN`
3. Try building locally with the same environment variables
4. Check if there are any dependency issues (lockfile changes)

### Issue: Preview deployment needs to be promoted

If a preview deployment contains the fix you need in production:

1. Go to Vercel project dashboard
2. Find the preview deployment
3. Click "..." menu → "Promote to Production"
4. Wait for promotion to complete
5. Verify in Admin Settings

## Cache Busting

Vercel automatically handles cache busting through:

1. **Content Hashing**: All JS/CSS files include content hashes in filenames
   - Example: `main.abc123.js` changes to `main.def456.js` when content changes
   
2. **Index.html No-Cache**: The entry point is never cached
   - Configured in `vercel.json` headers section
   
3. **Static Assets**: Long-term caching (1 year) for immutable assets
   - Safe because filenames change with content

**When to manually clear cache:**
- Never needed for code changes (handled automatically)
- Only needed for HTML template changes or if you suspect CDN issues

## PR #86 Changes Verification

To verify that PR #86 changes are actually deployed:

### 1. Header Ads Removed
- Visit any page on the site
- Verify NO ads appear in the header/top area
- Ads should only appear in middle/bottom sections

### 2. Supabase 406 Errors Silenced
- Open browser console
- Navigate through the site
- Verify NO "406" error messages appear for banner queries

### 3. Webhook Spam Prevention
- This is internal and harder to verify externally
- Check server logs (if accessible) for reduced webhook warning messages
- Should only see webhook warnings once per session, not repeatedly

## Best Practices

1. **Always verify after deployment**: Check Admin Settings after every production deployment
2. **Monitor build status**: Keep an eye on GitHub Actions workflow status
3. **Document deployments**: Note the commit SHA and time of important deployments
4. **Test in preview first**: Use Vercel preview deployments to test changes before merging to main
5. **Keep lockfile updated**: Run `npm ci` locally before pushing to ensure consistent builds

## Support

If you encounter persistent deployment issues:

1. Check this guide first
2. Review Vercel deployment logs
3. Check GitHub Actions workflow logs
4. Verify all environment variables are correctly set
5. Contact the development team with:
   - Expected commit SHA
   - Actual commit SHA (from Admin Settings)
   - Vercel deployment URL
   - Any error messages from logs
