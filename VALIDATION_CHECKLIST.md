# Quick Validation Checklist

## Pre-Deployment Validation ✅

### 1. Build Process
- [ ] Run `npm run build-no-errors` successfully
- [ ] Verify sitemaps are generated in `public/sitemaps/`
- [ ] No TypeScript errors in critical files
- [ ] Verify `dist/` folder contains all assets

### 2. Route Testing (Local or Staging)
Test these URLs work without errors:

#### Basic Routes
- [ ] `/immobilier/casablanca` - City page
- [ ] `/immobilier/casablanca/maarif` - Neighborhood page
- [ ] `/immobilier/casablanca/maarif/appartement` - Property type
- [ ] `/immobilier/casablanca/maarif/appartement/acheter` - Full route

#### Edge Cases
- [ ] `/immobilier/invalid-city` - Should redirect to home
- [ ] `/immobilier/casablanca/invalid-neighborhood` - Should redirect to city
- [ ] Empty listing page - Should show friendly message

### 3. SEO Tags (View Page Source)
Check any listing page:
- [ ] Unique `<title>` tag present
- [ ] Meta description present and unique
- [ ] Canonical URL present (without query params)
- [ ] OpenGraph tags present (og:title, og:description, og:image)
- [ ] Twitter card tags present
- [ ] Robots meta tag correct (noindex on filtered pages)

### 4. Structured Data
Check with view-source or DevTools:
- [ ] JSON-LD script tag present in `<head>`
- [ ] Valid JSON (no syntax errors)
- [ ] BreadcrumbList schema on listing pages
- [ ] Place schema on city/neighborhood pages
- [ ] WebSite schema with SearchAction in index.html

### 5. Navigation
- [ ] Breadcrumbs appear on listing pages
- [ ] Breadcrumbs appear on property detail pages
- [ ] All breadcrumb links work
- [ ] Header navigation works
- [ ] Footer links work

### 6. Pagination
If you have test data:
- [ ] Listings limited to 20 per page
- [ ] Page 2 link appears if >20 listings
- [ ] Clicking page 2 updates URL to `?page=2`
- [ ] Page scroll to top when changing pages
- [ ] Pagination UI matches design

### 7. Files Present
Verify these files exist:
- [ ] `public/sitemap.xml` (sitemap index)
- [ ] `public/sitemaps/static.xml`
- [ ] `public/sitemaps/cities.xml`
- [ ] `public/sitemaps/neighborhoods.xml`
- [ ] `public/robots.txt`
- [ ] `src/pages/PropertyTypeNeighborhoodPage.tsx`
- [ ] `scripts/generate-sitemaps.ts`

## Post-Deployment Validation

### 1. Accessibility
Visit production site:
- [ ] `https://topaffaireimmo.vercel.app/sitemap.xml` accessible
- [ ] `https://topaffaireimmo.vercel.app/sitemaps/static.xml` accessible
- [ ] `https://topaffaireimmo.vercel.app/sitemaps/cities.xml` accessible
- [ ] `https://topaffaireimmo.vercel.app/sitemaps/neighborhoods.xml` accessible
- [ ] `https://topaffaireimmo.vercel.app/robots.txt` accessible

### 2. Sitemap Content
Open each sitemap and verify:
- [ ] Valid XML format (no errors in browser)
- [ ] URLs use production domain (not localhost or preview)
- [ ] All URLs start with `https://topaffaireimmo.vercel.app`
- [ ] Priority and changefreq values present

### 3. Canonical URLs
Check 3-4 different pages:
- [ ] Canonical URL uses production domain
- [ ] Canonical URL has no query parameters
- [ ] Format: `<link rel="canonical" href="https://topaffaireimmo.vercel.app/...">`

### 4. Google Tools

#### Google Search Console
- [ ] Add property if not already added
- [ ] Submit sitemap: `https://topaffaireimmo.vercel.app/sitemap.xml`
- [ ] Wait 24-48 hours for initial crawl
- [ ] Check Coverage report for errors

#### Google Rich Results Test
Test 2-3 different page types:
- [ ] Test city page: https://search.google.com/test/rich-results
- [ ] Test property page: https://search.google.com/test/rich-results
- [ ] Verify schemas detected: Place, BreadcrumbList, RealEstateListing

#### Lighthouse SEO Audit
Run on 2-3 pages:
- [ ] SEO score 90+ (target)
- [ ] Meta description present ✓
- [ ] Page has title ✓
- [ ] Links have descriptive text ✓
- [ ] Image alt attributes ✓

### 5. Performance Check
- [ ] PageSpeed Insights: https://pagespeed.web.dev/
- [ ] Verify Core Web Vitals are good
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1

## Common Issues Quick Fix

| Issue | Fix |
|-------|-----|
| Sitemap shows localhost URLs | Rebuild with correct env vars, redeploy |
| 404 on sitemap URLs | Check Vercel build includes `public/sitemaps/` |
| Routes not working | Verify App.tsx route order, most specific first |
| Meta tags not updating | Clear browser cache, check SEO component |
| Pagination not working | Check useSearchParams hook, verify query param handling |
| Breadcrumbs not showing | Verify component imported, rendered in layout |

## Monitoring (Weekly)

After 1 week:
- [ ] Check Google Search Console for indexing status
- [ ] Review any crawl errors
- [ ] Check which pages are indexed
- [ ] Monitor structured data errors
- [ ] Review search analytics (after 2-4 weeks)

After 1 month:
- [ ] Analyze organic search traffic
- [ ] Identify top-performing routes
- [ ] Check for 404 errors in sitemap URLs
- [ ] Review Core Web Vitals trends
- [ ] Adjust strategy based on data

## Success Criteria

✅ **Technical SEO**
- 538 URLs in sitemaps
- All routes return 200 status
- Unique meta tags per route
- Valid structured data
- Clean canonical URLs

✅ **User Experience**  
- Breadcrumbs on all pages
- Fast pagination (20/page)
- Helpful empty states
- Mobile responsive

✅ **Search Engine**
- Submitted to Google Search Console
- No indexing errors
- Structured data validates
- Lighthouse SEO 90+

## Notes

- This checklist covers the SEO implementation only
- For full platform testing, see main testing documentation
- For detailed procedures, see SEO_TESTING_GUIDE.md
- For implementation details, see SEO_IMPLEMENTATION_SUMMARY.md

---

**Last Updated**: 2026-01-25
**Version**: 1.0
**Implementation PR**: copilot/add-seo-structured-routes
