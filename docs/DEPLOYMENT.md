# Deployment Guide

Complete guide for deploying TopAffaireImmo to production on Vercel.

## Prerequisites

- GitHub account with repository access
- Vercel account (free tier works)
- Supabase project set up and configured
- Domain name (optional but recommended)

## Pre-Deployment Checklist

### 1. Database Setup

Ensure your Supabase database is ready:

```bash
# Run all migrations
supabase db push

# Verify tables exist
supabase db list

# Check RLS policies are enabled
# Go to Supabase Dashboard → Authentication → Policies
```

See [Supabase Setup](setup/SUPABASE_SETUP.md) for details.

### 2. Storage Buckets

Verify all storage buckets are created:

1. Go to Supabase Dashboard → **Storage**
2. Ensure these buckets exist:
   - `property-images` (public)
   - `banner-images` (public)
   - `payment-receipts` (private)
   - `agency-logos` (public)

### 3. Authentication Settings

Configure Supabase Auth:

1. **Site URL**: Set to your production domain
2. **Redirect URLs**: Add your domain + `/auth/callback`
3. **Email Templates**: Customize for your brand

See [Email Configuration](setup/EMAIL_CONFIGURATION.md).

### 4. Environment Variables

Prepare these values:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_PRODUCTION_DOMAIN` - Your production domain (e.g., https://topaffaireimmo.com)

## Deployment to Vercel

### Option 1: Vercel Dashboard (Recommended)

#### Step 1: Connect Repository

1. Go to [https://vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Select `topaffaireimmo`

#### Step 2: Configure Build Settings

Vercel should auto-detect Vite. Verify:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### Step 3: Add Environment Variables

In the "Environment Variables" section, add:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_PRODUCTION_DOMAIN=https://your-domain.com
```

**Important**: Use your PRODUCTION domain, not localhost!

#### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Click on the deployment URL to verify

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_PRODUCTION_DOMAIN

# Deploy to production
vercel --prod
```

## Post-Deployment Configuration

### 1. Update Supabase Settings

Go to Supabase Dashboard → **Authentication** → **URL Configuration**:

```
Site URL: https://your-domain.com
Redirect URLs:
  - https://your-domain.com/auth/callback
  - https://your-domain.vercel.app/auth/callback
```

### 2. Configure Custom Domain (Optional)

In Vercel:

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration steps
4. Wait for SSL certificate (automatic)

### 3. Test Critical Flows

1. **Sign Up Flow**:
   - Create new account
   - Verify email is sent
   - Check profile is created

2. **Property Listing**:
   - Upload property with images
   - Verify images appear
   - Check admin can approve

3. **Admin Access**:
   - Create admin user (see below)
   - Access admin panel
   - Test moderation features

## Creating Admin User

### Method 1: Supabase Dashboard

1. Sign up on your production site
2. Go to Supabase Dashboard → **Authentication** → **Users**
3. Find your user, copy UUID
4. Go to **Table Editor** → **profiles**
5. Find your profile row, update:
   ```
   role: admin
   approved_advertiser: true
   ```

### Method 2: SQL Query

```sql
UPDATE profiles
SET 
  role = 'admin',
  approved_advertiser = true
WHERE email = 'your-email@example.com';
```

Run in Supabase SQL Editor.

## Environment-Specific Configurations

### Development

```env
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=dev_anon_key
VITE_PRODUCTION_DOMAIN=http://localhost:5173
```

### Staging

```env
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=staging_anon_key
VITE_PRODUCTION_DOMAIN=https://staging.topaffaireimmo.com
```

### Production

```env
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod_anon_key
VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.com
```

## Troubleshooting

### Build Failures

#### TypeScript Errors

```bash
# Run locally first
npm run typecheck

# Fix errors, then commit and redeploy
```

#### Missing Dependencies

```bash
# Ensure package.json is up to date
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

### Runtime Errors

#### 401 Unauthorized

- Check environment variables are set correctly
- Verify Supabase anon key is correct
- Check RLS policies allow access

#### Images Not Loading

- Verify storage buckets exist
- Check bucket policies allow public access
- Ensure URLs use correct bucket names

#### Email Not Sending

- Configure SMTP in Supabase Dashboard
- See [Email Configuration](setup/EMAIL_CONFIGURATION.md)

### Performance Issues

#### Slow Initial Load

Check Vercel Analytics:

1. Go to Vercel Dashboard → **Analytics**
2. Review **Web Vitals**
3. Optimize heavy components

#### Large Bundle Size

```bash
# Analyze bundle
npm run build

# Check dist/ folder size
du -sh dist/
```

## Monitoring

### Vercel Analytics

Free analytics included:

- Page views
- Web Vitals (LCP, FID, CLS)
- Top pages
- Top referrers

Access: Vercel Dashboard → **Analytics**

### Supabase Monitoring

Monitor backend:

1. Go to Supabase Dashboard → **Database** → **Logs**
2. Check API requests
3. Monitor query performance

### Error Tracking (Optional)

Recommended: Integrate Sentry

```bash
npm install @sentry/react @sentry/vite-plugin

# Add to vite.config.ts
```

## Rollback Procedure

If deployment breaks production:

1. Go to Vercel Dashboard → **Deployments**
2. Find last working deployment
3. Click **⋯** → **Promote to Production**

Or via CLI:

```bash
vercel rollback
```

## Continuous Deployment

Vercel auto-deploys on:

- **Push to `main`**: Production deployment
- **Pull requests**: Preview deployments
- **Push to `staging`**: Staging environment (if configured)

### Preview Deployments

Every PR gets a unique URL:

```
https://topaffaireimmo-git-feature-branch.vercel.app
```

Use for testing before merging.

## Security Checklist

- [ ] Environment variables are set (not hardcoded)
- [ ] HTTPS is enabled (automatic with Vercel)
- [ ] RLS policies are enabled on all tables
- [ ] Storage buckets have proper access policies
- [ ] CORS is configured in Supabase
- [ ] Rate limiting is enabled (Supabase default)
- [ ] Admin accounts use strong passwords
- [ ] `.env` file is in `.gitignore`

## Performance Checklist

- [ ] Build completes without errors
- [ ] Bundle size is reasonable (<500KB gzipped)
- [ ] Images are optimized (WebP where possible)
- [ ] Code splitting is working (check dist/ chunks)
- [ ] CDN caching headers are set (vercel.json)
- [ ] Database queries use indexes

## SEO Checklist

- [ ] Sitemap is generated (`/sitemap.xml`)
- [ ] Robots.txt is configured
- [ ] Meta tags are set on all pages
- [ ] Canonical URLs are correct
- [ ] Open Graph images are set
- [ ] Structured data is valid

## Cost Optimization

### Vercel (Free Tier Limits)

- 100GB bandwidth/month
- Unlimited deployments
- Unlimited preview deployments

**Stay within limits**:
- Optimize images
- Use CDN caching
- Minimize unnecessary API calls

### Supabase (Free Tier Limits)

- 500MB database
- 1GB file storage
- 2GB data transfer

**Stay within limits**:
- Compress images before upload
- Archive old data periodically
- Use pagination for large queries

## Next Steps

After successful deployment:

1. [Configure Email](setup/EMAIL_CONFIGURATION.md)
2. [Set Up Facebook Auto-Publishing](features/FACEBOOK_AUTO_PUBLISH_SETUP.md)
3. [Configure SEO Settings](features/MOROCCO_SEO_IMPLEMENTATION.md)
4. Monitor analytics and performance
5. Set up automated backups

## Support

For deployment issues:

- Vercel Docs: [https://vercel.com/docs](https://vercel.com/docs)
- Supabase Docs: [https://supabase.com/docs](https://supabase.com/docs)
- Project Issues: GitHub Issues
