# SEO Deployment Configuration

## Blocking Preview Deployments from Search Engines

### Vercel Configuration

To ensure that **only the production domain** is indexed by search engines, you need to configure:

1. **Environment Variable** (Required for production):
   ```bash
   VITE_PRODUCTION_DOMAIN=https://your-custom-domain.ma
   ```

2. **Vercel Project Settings**:
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add `VITE_PRODUCTION_DOMAIN` with your production URL
   - Set it for "Production" environment only

3. **Preview Deployment Blocking**:
   
   Vercel automatically adds `X-Robots-Tag: noindex` to preview deployments, but to be extra safe, you can:
   
   - In Vercel Dashboard → Settings → Deployment Protection
   - Enable "Vercel Authentication" for preview deployments
   - This prevents preview URLs from being crawled

### How It Works

1. **robots.txt**: Located at `/public/robots.txt` - allows all public pages
2. **Canonical URLs**: All pages use canonical URLs pointing to production domain only
3. **Meta Robots**: Dynamic meta robots tags block preview deployments
4. **Environment Detection**: Code checks if running on preview vs production

### Testing

To test SEO configuration:

```bash
# Check robots.txt
curl https://topaffaireimmo.vercel.app/robots.txt

# Check meta tags on homepage
curl -s https://topaffaireimmo.vercel.app/ | grep -A 5 "canonical\|robots"

# Verify production domain
echo $VITE_PRODUCTION_DOMAIN
```

### Custom Domain Setup

When you get your custom domain (e.g., `topaffaireimmo.ma`):

1. Update `.env`:
   ```
   VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.ma
   ```

2. Update in Vercel Dashboard:
   - Environment Variables → Production → VITE_PRODUCTION_DOMAIN

3. The sitemap.xml will automatically use the production domain

4. All canonical URLs will point to the new domain

### Sitemap Updates

The sitemap is static but should be regenerated when:
- New cities are added
- New neighborhoods are created
- Production domain changes

Run the sitemap generator:
```bash
npm run generate-sitemap
```

(Note: This script needs to be created if dynamic sitemap generation is required)
