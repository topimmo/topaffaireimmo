# Vercel Deployment Guide

This guide will help you deploy the TopAffaireImmo application to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. A Supabase project with the database schema set up
3. Your Supabase project URL and anon key

## Deployment Steps

### 1. Import Your Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository (`topimmo/topaffaireimmo`)
4. Vercel will automatically detect the Vite framework

### 2. Configure Build Settings

Vercel should automatically detect the following settings from `vercel.json`:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

If needed, you can verify these in the project settings.

### 3. Add Environment Variables

In your Vercel project settings, add the following environment variables:

1. Go to your project → Settings → Environment Variables
2. Add these variables:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Important**: 
- Replace `YOUR_PROJECT_ID` with your actual Supabase project ID
- Replace `your_supabase_anon_key_here` with your actual Supabase anonymous key
- These should be set for all environments (Production, Preview, Development)

### 4. Deploy

1. Click "Deploy" to trigger the first deployment
2. Vercel will:
   - Install dependencies (`npm install`)
   - Run TypeScript checks (`tsc`)
   - Build the application (`vite build`)
   - Deploy the `dist` folder

### 5. Configure Custom Domain (Optional)

1. Go to your project → Settings → Domains
2. Add your custom domain
3. Follow Vercel's instructions to configure DNS

## Build Configuration Details

### TypeScript Configuration

The project uses TypeScript with the following settings:
- TypeScript 5.8.2
- Strict mode: `false` (for compatibility with existing codebase and dependencies)
- `noEmitOnError: false` (allows builds to complete even with type warnings, ensuring deployment isn't blocked by non-critical type issues)

**Note**: While TypeScript checks run during the build process, the configuration prioritizes deployability over strict type safety. Consider enabling strict mode and fixing type issues incrementally for better long-term code quality.

### Build Output

The production build generates:
- Optimized and minified JavaScript bundles
- Code-split chunks for better performance:
  - Vendor chunk (react, react-dom, react-router-dom)
  - Supabase chunk (@supabase/supabase-js)
  - Dynamic route-based chunks
- CSS with Tailwind utilities
- Assets optimized with Vite

### SPA Routing

The `vercel.json` configuration includes rewrites to handle React Router:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures all routes are handled by the React Router on the client side.

## Troubleshooting

### Build Fails with TypeScript Errors

The build includes `tsc` check before `vite build`. If you encounter TypeScript errors:
1. Check the Vercel build logs for specific errors
2. Fix the TypeScript errors in your local environment
3. Test locally with `npm run build`
4. Push the fixes and Vercel will automatically redeploy

### Missing Environment Variables

If the app builds but doesn't connect to Supabase:
1. Verify environment variables are set in Vercel project settings
2. Ensure variable names start with `VITE_` (required for Vite)
3. Redeploy after adding/updating environment variables

### 404 on Direct Route Access

If you get 404 errors when accessing routes directly:
1. Verify `vercel.json` includes the rewrites configuration
2. Check that the file is in the root of your repository

### Build Performance

The project uses several optimizations:
- SWC for fast TypeScript transpilation
- Code splitting for smaller initial bundles
- Tree shaking to remove unused code
- Minification with esbuild

Typical build time on Vercel: 30-60 seconds

## Monitoring and Logs

1. **Build Logs**: Available in Vercel dashboard during deployment
2. **Runtime Logs**: Check Vercel Functions logs for any server-side issues
3. **Analytics**: Enable Vercel Analytics for performance monitoring

## Automatic Deployments

Vercel automatically deploys:
- **Production**: Commits to `main` branch
- **Preview**: Pull requests and other branches

You can customize this in Settings → Git.

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Supabase Documentation](https://supabase.com/docs)

## Support

For issues specific to:
- **Vercel deployment**: Check [Vercel Support](https://vercel.com/support)
- **Application code**: Create an issue in the GitHub repository
- **Supabase**: Check [Supabase Support](https://supabase.com/support)
