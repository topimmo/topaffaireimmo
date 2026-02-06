# SEO Optimization Guide - TopAffaireImmo

## Overview

This guide documents the SEO optimizations implemented for TopAffaireImmo, a Moroccan real estate platform. The platform is fully optimized for search engines with comprehensive coverage of all Moroccan cities, including the Moroccan Sahara region.

## Table of Contents

1. [Open Graph (OG) Images](#open-graph-images)
2. [Meta Tags & Structured Data](#meta-tags--structured-data)
3. [Sitemaps](#sitemaps)
4. [Best Practices](#best-practices)
5. [Testing & Validation](#testing--validation)

---

## Open Graph Images

### What are OG Images?

Open Graph images are preview images that appear when your website links are shared on social media platforms (Facebook, Twitter, LinkedIn, WhatsApp, etc.). They significantly improve click-through rates and social engagement.

### Generated OG Images

The platform automatically generates optimized OG images at build time using the script `scripts/generate-og-images.ts`.

#### Default Images Created

1. **og-image.jpg** - Default homepage image
   - Title: "TopAffaireImmo"
   - Subtitle: "Trouvez votre propriété parfaite au Maroc"
   - Use: Homepage and fallback for all pages

2. **og-search.jpg** - Search page
   - Title: "Recherche Immobilière au Maroc"
   - Subtitle: "Des milliers de propriétés à vendre et à louer"
   - Use: /search page

3. **og-buy.jpg** - Buy/Sale pages
   - Title: "Acheter un Bien Immobilier"
   - Subtitle: "Villas, Appartements, Terrains au Maroc"
   - Color: Green (#10b981)
   - Use: /buy, /acheter, sale/vente pages

4. **og-rent.jpg** - Rental pages
   - Title: "Location Immobilière"
   - Subtitle: "Appartements et maisons à louer"
   - Color: Orange (#f59e0b)
   - Use: /rent, /louer, location pages

5. **og-casablanca.jpg** - Casablanca city page
   - Title: "Immobilier à Casablanca"
   - Subtitle: "Vente & Location - الدار البيضاء"
   - Use: /casablanca and related pages

6. **og-sahara.jpg** - Moroccan Sahara page
   - Title: "Immobilier au Sahara Marocain"
   - Subtitle: "Laâyoune, Dakhla, Boujdour, Smara, Tarfaya"
   - Color: Red (#dc2626)
   - Use: /sahara-marocain page

### OG Image Specifications

All generated OG images follow social media best practices:

- **Dimensions**: 1200 x 630 pixels (Facebook/Twitter/LinkedIn standard)
- **Format**: JPEG with 90% quality
- **File Size**: ~45-60 KB (optimized for fast loading)
- **Design**: 
  - Gradient background (brand colors)
  - Clean typography (Arial, bold)
  - Bilingual support (French/Arabic when relevant)
  - Brand mark (TA logo circle)
  - TopAffaireImmo.com branding at bottom

### How to Use OG Images

#### In Code

Use the `getOGImage()` helper function from `src/lib/seo.ts`:

```typescript
import { getOGImage } from '../lib/seo';
import SEO from '../components/SEO';

// Homepage
<SEO ogImage={getOGImage({ page: 'home' })} />

// Search page
<SEO ogImage={getOGImage({ page: 'search' })} />

// Buy page
<SEO ogImage={getOGImage({ page: 'buy' })} />

// Rent page
<SEO ogImage={getOGImage({ page: 'rent' })} />

// City page (Casablanca)
<SEO ogImage={getOGImage({ page: 'city', city: 'casablanca' })} />

// Sahara page
<SEO ogImage={getOGImage({ page: 'sahara' })} />
```

#### Generate New Images

To regenerate all OG images:

```bash
npm run generate:og-images
```

This command is also automatically run during the build process:

```bash
npm run build
# Runs: generate:sitemaps → generate:og-images → vite build
```

### Adding New OG Images

To add a new OG image (e.g., for a new city):

1. Edit `scripts/generate-og-images.ts`
2. Add a new `generateOGImage()` call in the `main()` function:

```typescript
// Example: Add Rabat OG image
await generateOGImage({
  title: 'Immobilier à Rabat',
  subtitle: 'Vente & Location - الرباط',
  filename: 'og-rabat.jpg',
});
```

3. Update `getOGImage()` in `src/lib/seo.ts` to use it:

```typescript
if (page === 'city' && city === 'rabat') {
  return `${baseUrl}/og-rabat.jpg`;
}
```

4. Regenerate images:

```bash
npm run generate:og-images
```

---

## Meta Tags & Structured Data

### Meta Tags Implemented

Every page includes comprehensive meta tags:

#### Basic SEO Tags
- `<title>` - Unique, descriptive titles (< 60 characters)
- `<meta name="description">` - Natural language descriptions (< 160 characters)
- `<meta name="keywords">` - Relevant keywords (no stuffing)
- `<link rel="canonical">` - Canonical URLs to prevent duplicate content

#### Open Graph Tags (Facebook/LinkedIn)
- `og:title` - Social media title
- `og:description` - Social media description
- `og:image` - Preview image (1200x630px)
- `og:type` - Content type (website, article)
- `og:url` - Canonical URL
- `og:locale` - Language (fr_MA, ar_MA)
- `og:site_name` - "TopAffaireImmo"

#### Twitter Card Tags
- `twitter:card` - Card type (summary_large_image)
- `twitter:title` - Twitter title
- `twitter:description` - Twitter description
- `twitter:image` - Preview image

#### Geographic Tags
- `geo.region` - "MA" (Morocco)
- `geo.placename` - City name
- Hreflang tags for bilingual support (fr-MA, ar-MA)

#### Robots & Indexing
- `<meta name="robots">` - Indexing instructions
- Production domain: `index, follow, max-image-preview:large`
- Preview deployments: `noindex, nofollow`

### Structured Data (Schema.org)

The platform implements rich structured data using JSON-LD format:

#### Organization Schema
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "TopAffaireImmo",
  "url": "https://www.topaffaireimmo.com",
  "areaServed": [
    { "@type": "City", "name": "Casablanca", "addressCountry": "MA" },
    // ... all 26 cities
  ]
}
```

#### WebSite Schema with SearchAction
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "TopAffaireImmo",
  "url": "https://www.topaffaireimmo.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://www.topaffaireimmo.com/search?q={search_term_string}"
  }
}
```

#### Place Schema (for cities)
Used on city landing pages to identify locations.

#### BreadcrumbList Schema
Provides navigation hierarchy for search engines.

#### RealEstateListing Schema
Used on individual property listings with:
- Property details (price, area, rooms)
- Location (city, neighborhood)
- Images and description
- Contact information

---

## Sitemaps

### Generated Sitemaps

The platform generates comprehensive XML sitemaps for search engines:

#### Sitemap Index (`/sitemap.xml`)
Points to 3 sub-sitemaps:

```xml
/sitemaps/static.xml
/sitemaps/cities.xml
/sitemaps/neighborhoods.xml
```

#### Static Sitemap (`/sitemaps/static.xml`)
- Homepage
- Search pages
- Buy/Rent pages
- About/Contact pages
- Total: ~19 URLs

#### Cities Sitemap (`/sitemaps/cities.xml`)
- All 26 cities with 11 page types each
- City landing pages
- Transaction pages (vente/location)
- Property type pages (appartements, villas, maisons, etc.)
- Sahara regional page
- Total: ~286 URLs

#### Neighborhoods Sitemap (`/sitemaps/neighborhoods.xml`)
- Neighborhood pages for major cities
- Casablanca: 8 neighborhoods
- Rabat: 6 neighborhoods
- Marrakech: 5 neighborhoods
- And more...
- Total: ~496 URLs

### Sitemap Statistics

- **Total URLs**: 801+
- **Update Frequency**: 
  - City landing pages: Weekly
  - Transaction/Property pages: Daily
  - Static pages: Monthly to Weekly
- **Priority Levels**:
  - Homepage: 1.0
  - Search pages: 0.9
  - City transaction pages: 0.85
  - City landing pages: 0.8
  - Property type pages: 0.8
  - About/Contact: 0.6

### Generating Sitemaps

Sitemaps are auto-generated during build:

```bash
npm run generate:sitemaps
# Or as part of build:
npm run build
```

Script location: `scripts/generate-sitemaps.ts`

---

## Best Practices

### Title Tags
- ✅ Unique for every page
- ✅ < 60 characters (avoid truncation in SERPs)
- ✅ Format: "Primary Keyword | TopAffaireImmo"
- ✅ Include city name when relevant
- ✅ Bilingual support (French primary, Arabic secondary)

### Meta Descriptions
- ✅ 150-160 characters (optimal length)
- ✅ Natural language, no keyword stuffing
- ✅ Includes call-to-action when appropriate
- ✅ City and property type when relevant
- ✅ Unique for every page

### URLs
- ✅ SEO-friendly (lowercase, hyphens)
- ✅ Human-readable
- ✅ Consistent structure
- ✅ No special characters
- ✅ Examples:
  - `/casablanca`
  - `/casablanca/vente`
  - `/casablanca/appartements`
  - `/sahara-marocain`

### Content Quality
- ✅ Natural language (no keyword stuffing)
- ✅ Concise intro texts (2-3 lines)
- ✅ Clear, descriptive headings (H1, H2, H3)
- ✅ User-focused content
- ✅ Bilingual support (French/Arabic)

### Internal Linking
- ✅ City pages link to transaction types
- ✅ City pages link to property types
- ✅ Clear hierarchy and navigation
- ✅ Breadcrumbs for user orientation

### Performance
- ✅ Lazy loading for below-fold content
- ✅ Code splitting by route
- ✅ Optimized images (Sharp for generation)
- ✅ Progressive Web App (PWA) for fast loading
- ✅ Service worker caching

### Mobile Optimization
- ✅ Responsive design (mobile-first)
- ✅ Touch-friendly navigation
- ✅ Fast loading on mobile networks
- ✅ Viewport meta tag
- ✅ PWA installable on mobile

---

## Testing & Validation

### Social Media Preview Testing

#### Facebook Sharing Debugger
Test how your pages appear when shared on Facebook:

1. Go to: https://developers.facebook.com/tools/debug/
2. Enter your URL (e.g., `https://www.topaffaireimmo.com/casablanca`)
3. Click "Debug"
4. Verify:
   - ✅ OG image displays correctly (1200x630px)
   - ✅ Title and description are accurate
   - ✅ No warnings or errors

#### Twitter Card Validator
Test Twitter previews:

1. Go to: https://cards-dev.twitter.com/validator
2. Enter your URL
3. Click "Preview card"
4. Verify the large image card appears correctly

#### LinkedIn Post Inspector
Test LinkedIn previews:

1. Go to: https://www.linkedin.com/post-inspector/
2. Enter your URL
3. Verify preview image and text

### SEO Testing Tools

#### Google Search Console
1. Add your site: https://search.google.com/search-console
2. Submit sitemap: `https://www.topaffaireimmo.com/sitemap.xml`
3. Monitor:
   - Index coverage
   - Mobile usability
   - Core Web Vitals
   - Search appearance

#### Google Rich Results Test
Test structured data:

1. Go to: https://search.google.com/test/rich-results
2. Enter your URL or paste code
3. Verify all schemas are valid:
   - Organization
   - WebSite
   - BreadcrumbList
   - Place (for cities)
   - RealEstateListing (for properties)

#### Lighthouse SEO Audit
Run in Chrome DevTools:

1. Open DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "SEO" category
4. Click "Analyze page load"
5. Target score: 100/100

Key checks:
- ✅ Document has a `<title>` element
- ✅ Document has a meta description
- ✅ Page has successful HTTP status code
- ✅ Links have descriptive text
- ✅ Images have alt text
- ✅ Page isn't blocked from indexing
- ✅ Document has a valid hreflang
- ✅ Document has a valid canonical

#### Screaming Frog SEO Spider
For comprehensive site audit:

1. Download: https://www.screamingfrog.co.uk/seo-spider/
2. Crawl your site
3. Check:
   - All pages indexed
   - No broken links
   - Duplicate titles/descriptions
   - Missing meta tags
   - Image optimization

### Manual Verification Checklist

For each major page type:

- [ ] Title tag is unique and descriptive
- [ ] Meta description is present (150-160 chars)
- [ ] OG image loads correctly (check browser inspector)
- [ ] Canonical URL is correct
- [ ] H1 tag is present and unique
- [ ] Structured data is valid (Rich Results Test)
- [ ] Page is in sitemap.xml
- [ ] robots.txt allows crawling
- [ ] Hreflang tags present (fr-MA, ar-MA)
- [ ] Mobile-friendly (responsive design)
- [ ] Fast page load (< 3s)

---

## Morocco-Specific SEO Considerations

### All 26 Moroccan Cities Covered

The platform has complete SEO coverage for:

**Major Cities (21)**:
Casablanca, Rabat, Marrakech, Tanger, Agadir, Fès, Meknès, Oujda, Kenitra, Tétouan, Nador, El Jadida, Safi, Settat, Beni Mellal, Khouribga, Mohammedia, Essaouira, Ouarzazate, Taza, Berkane

**Moroccan Sahara - Provinces du Sud (5)**:
Laâyoune (العيون), Dakhla (الداخلة), Boujdour (بوجدور), Smara (السمارة), Tarfaya (طرفاية)

### Bilingual Support

- **Primary Language**: French (fr-MA)
- **Secondary Language**: Arabic (ar-MA)
- Meta tags in French (better for Google)
- Content displays in user's selected language
- Hreflang tags for both languages
- City names in both languages

### Regional Recognition

The platform prominently features the Moroccan Sahara:

- Dedicated page: `/sahara-marocain`
- All 5 Sahara cities fully integrated
- Same SEO treatment as other cities
- Clear identification in structured data
- Dedicated OG image for social sharing

---

## Continuous Improvement

### Monthly SEO Tasks

1. **Monitor Rankings**
   - Track keyword rankings in Google
   - Focus on: "immobilier [city]", "appartement à vendre [city]"
   - Use Google Search Console for insights

2. **Update Content**
   - Refresh city descriptions
   - Add new neighborhoods
   - Update property counts

3. **Check Analytics**
   - Review organic search traffic
   - Identify high-performing pages
   - Find pages needing improvement

4. **Technical Audit**
   - Check for broken links
   - Verify sitemap is up to date
   - Monitor page speed
   - Test mobile usability

### Future Enhancements

1. **Dynamic Property Sitemaps**
   - Add `/sitemaps/listings.xml`
   - Include actual property URLs
   - Update weekly based on new listings

2. **More City-Specific OG Images**
   - Generate OG images for all 26 cities
   - Include city-specific imagery
   - Localize text for each city

3. **Rich Snippets for Listings**
   - Add price in search results
   - Show star ratings/reviews
   - Display property images in Google

4. **Local SEO**
   - Google Business listings for agencies
   - Local structured data
   - Map integration
   - Reviews and ratings

5. **Content Expansion**
   - City guides and neighborhood profiles
   - Real estate market trends
   - Buying/renting guides
   - Blog for long-tail keywords

---

## Compliance & Standards

The platform follows all major SEO standards:

- ✅ **W3C HTML5** - Valid markup
- ✅ **Schema.org** - Structured data vocabulary
- ✅ **Open Graph Protocol** - Social media previews
- ✅ **Twitter Cards** - Twitter previews
- ✅ **XML Sitemap Protocol** - Standard sitemaps
- ✅ **Robots Exclusion Standard** - robots.txt
- ✅ **Hreflang** - Multilingual support
- ✅ **WCAG 2.1** - Accessibility (benefits SEO)
- ✅ **Core Web Vitals** - Performance metrics

---

## Resources & Tools

### Official Documentation
- [Google Search Central](https://developers.google.com/search)
- [Schema.org](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)

### Testing Tools
- [Google Search Console](https://search.google.com/search-console)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/)

### Analytics & Monitoring
- [Google Analytics](https://analytics.google.com/)
- [Google Search Console](https://search.google.com/search-console)
- [Bing Webmaster Tools](https://www.bing.com/webmasters/)

---

## Conclusion

TopAffaireImmo has a **comprehensive, production-ready SEO implementation** covering:

- ✅ All 26 Moroccan cities (including Sahara region)
- ✅ 801+ indexed pages
- ✅ Optimized OG images for social media
- ✅ Complete structured data
- ✅ Bilingual support (French/Arabic)
- ✅ Mobile-optimized and PWA-ready
- ✅ Fast loading and Core Web Vitals compliant

The platform is positioned to rank well for real estate searches across Morocco and provides an excellent user experience on all devices.

**For questions or improvements, refer to:**
- `SEO_IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- `SEO_DELIVERY_SUMMARY.md` - Delivery summary and metrics
- This guide - Ongoing SEO management

**Last Updated**: February 6, 2026
