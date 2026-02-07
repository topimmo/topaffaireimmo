# SEO Critical Fixes Implementation Guide

## ✅ Completed Fixes

### 1. Domain URL Corrections (Priority: CRITICAL)
**Status:** ✅ COMPLETED

Updated all references from `topaffaireimmo.vercel.app` to `www.topaffaireimmo.com` in:
- Canonical URLs
- Open Graph tags
- Twitter Card tags
- Organization schema
- WebSite schema
- Hreflang tags

**Files Modified:**
- `/index.html`

**Impact:** Ensures Google indexes the correct production domain

---

### 2. FAQ Component with Schema (Priority: HIGH)
**Status:** ✅ COMPLETED

Created reusable FAQ component with automatic FAQPage schema generation.

**Files Created:**
- `/src/components/FAQ.tsx`

**Features:**
- Accordion UI using existing components
- Automatic FAQPage schema injection
- Predefined FAQ sets:
  - `generalFAQ` - Homepage
  - `buyingFAQ` - Buying pages
  - `rentingFAQ` - Rental pages
  - `getCityFAQ(city)` - Dynamic city FAQs

**Usage Example:**
```tsx
import { FAQ, generalFAQ } from '@/components/FAQ';

// In your component
<FAQ items={generalFAQ} title="Questions Fréquentes" />
```

---

## 🔄 Pending Implementation

### 3. Add FAQ to Homepage (Priority: HIGH)
**Action Required:** Integrate FAQ component into homepage

**File to Modify:** `/src/components/home.tsx` or main homepage component

**Code to Add:**
```tsx
import { FAQ, generalFAQ } from '@/components/FAQ';

// Add before footer
<FAQ items={generalFAQ} className="bg-muted/50" />
```

---

### 4. Add FAQ to City Pages (Priority: HIGH)
**Action Required:** Integrate city-specific FAQs

**File to Modify:** `/src/pages/CityPage.tsx`

**Code to Add:**
```tsx
import { FAQ, getCityFAQ } from '@/components/FAQ';

// In component, generate city-specific FAQ
const cityFaqItems = getCityFAQ(cityName);

// Add before footer
<FAQ items={cityFaqItems} title={`Questions sur ${cityName}`} />
```

---

### 5. Enhanced Content for City Pages (Priority: CRITICAL)
**Action Required:** Add 500+ words of unique content to each major city page

**Recommended Content Structure for City Pages:**

```tsx
// Add to CityPage component
<section className="container mx-auto px-4 py-12">
  <div className="prose prose-lg max-w-4xl mx-auto">
    <h2>Immobilier à {cityName} : Guide Complet 2026</h2>
    
    <h3>Aperçu du Marché Immobilier</h3>
    <p>
      {cityName} est l'une des principales villes du Maroc...
      [300+ words about the city, market trends, why invest]
    </p>
    
    <h3>Les Quartiers Populaires de {cityName}</h3>
    <p>
      [200+ words about top neighborhoods, characteristics]
    </p>
    
    <h3>Prix et Tendances du Marché</h3>
    <p>
      [200+ words about pricing, trends, projections]
    </p>
    
    <h3>Pourquoi Investir à {cityName} ?</h3>
    <ul>
      <li>Infrastructure moderne et développement continu</li>
      <li>Croissance économique soutenue</li>
      <li>Qualité de vie et services</li>
      <li>Potentiel de valorisation immobilière</li>
    </ul>
  </div>
</section>
```

**Top 10 Cities to Prioritize:**
1. Casablanca
2. Rabat
3. Marrakech
4. Tanger
5. Agadir
6. Fès
7. Meknès
8. Oujda
9. Tétouan
10. Kenitra

---

### 6. Blog Infrastructure (Priority: HIGH)
**Action Required:** Create blog section for content marketing

**Files to Create:**
1. `/src/pages/Blog.tsx` - Blog listing page
2. `/src/pages/BlogPost.tsx` - Individual blog post page
3. `/src/data/blogPosts.ts` - Blog content data

**Recommended First 5 Blog Posts:**
1. "Guide Complet Achat Immobilier Maroc 2026"
2. "Top 10 Quartiers Casablanca pour Investir"
3. "Prix Immobilier Maroc: Analyse et Tendances 2026"
4. "Comment Vendre Rapidement Votre Propriété au Maroc"
5. "Checklist Complète Achat Appartement Maroc"

**Blog Post Schema to Include:**
```tsx
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Post Title",
  "author": {
    "@type": "Organization",
    "name": "TopAffaireImmo"
  },
  "publisher": {
    "@type": "Organization",
    "name": "TopAffaireImmo",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.topaffaireimmo.com/logo.png"
    }
  },
  "datePublished": "2026-02-07",
  "dateModified": "2026-02-07",
  "image": "https://www.topaffaireimmo.com/blog-image.jpg",
  "articleBody": "Full article text..."
};
```

---

### 7. Google Business Profile Setup (Priority: CRITICAL)
**Action Required:** Manual setup required

**Steps:**
1. Go to https://business.google.com
2. Click "Manage now"
3. Enter business name: "TopAffaireImmo"
4. Choose business category: "Real Estate Agency" or "Real Estate Service"
5. Add location (if applicable) or choose "I deliver to customers"
6. Add service areas: Morocco (all cities)
7. Add contact details:
   - Website: https://www.topaffaireimmo.com
   - Phone: [Add business phone]
8. Verify business (verification postcard or instant verification if eligible)
9. Complete profile:
   - Add logo
   - Add description (500 chars)
   - Add business hours
   - Add services
10. Start collecting reviews

**Benefits:**
- Appear in Google Maps
- Local pack results
- Enhanced brand visibility
- Customer reviews

---

### 8. Image Optimization (Priority: MEDIUM)
**Action Required:** Convert property images to WebP format

**Implementation:**
1. Add WebP conversion to image upload pipeline
2. Serve WebP with fallback:

```tsx
<picture>
  <source srcset="/property-image.webp" type="image/webp" />
  <img src="/property-image.jpg" alt="Property description" loading="lazy" />
</picture>
```

**Expected Benefits:**
- 25-35% reduction in image file size
- Faster page load times
- Improved Core Web Vitals (LCP)

---

### 9. Performance Monitoring Setup (Priority: HIGH)
**Action Required:** Implement performance tracking

**Tools to Set Up:**
1. **Google Analytics 4**
   - Track page views, user behavior
   - Set up custom events (property views, contacts)
   
2. **Core Web Vitals Monitoring**
   - Use Vercel Analytics (built-in)
   - Add custom tracking:

```tsx
// Add to main.tsx or App.tsx
import { onCLS, onFID, onLCP } from 'web-vitals';

onCLS(console.log);
onFID(console.log);
onLCP(console.log);
```

3. **Real User Monitoring (RUM)**
   - Vercel Speed Insights
   - Track actual user experience

---

### 10. Local Citations (Priority: HIGH)
**Action Required:** Submit to Moroccan directories

**Top 20 Directories to Submit:**
1. Google Business Profile ⭐ (Priority 1)
2. Mubawab.ma (competitor but builds authority)
3. Avito.ma
4. MarocAnnonces.com
5. Bikhir.ma
6. Tangerois.com (for Tanger)
7. Casablanca.ma
8. Rabat.ma
9. Marrakech.ma
10. Pages Jaunes Maroc
11. Morocco.com
12. Visit Morocco directories
13. Expat.com Morocco
14. Facebook Business Page
15. LinkedIn Company Page
16. Instagram Business Profile
17. Local chamber of commerce
18. Morocco Business Directory
19. Real estate associations
20. Local news websites

**Information to Use (NAP - Name, Address, Phone):**
- **Name:** TopAffaireImmo
- **Address:** [Add business address if available, or "Service en ligne - Maroc"]
- **Phone:** [Add business phone]
- **Website:** https://www.topaffaireimmo.com
- **Description:** Plateforme immobilière de référence au Maroc. Trouvez des appartements, maisons, villas et propriétés commerciales à vendre ou à louer dans toutes les grandes villes.
- **Categories:** Real Estate, Property Listings, Real Estate Marketplace
- **Service Areas:** Casablanca, Rabat, Marrakech, Tanger, Agadir, Fès, Meknès, and all Morocco

---

### 11. Sitemap Submission (Priority: CRITICAL)
**Action Required:** Submit sitemaps to Google Search Console

**Steps:**
1. Go to https://search.google.com/search-console
2. Add property: `https://www.topaffaireimmo.com`
3. Verify ownership (DNS verification or HTML file - already done ✅)
4. Go to "Sitemaps" in left menu
5. Submit:
   - `https://www.topaffaireimmo.com/sitemap.xml`
6. Wait 24-48 hours for Google to crawl
7. Monitor "Coverage" report for indexing status

**Expected Results:**
- 801+ URLs discovered
- 500+ URLs indexed within 7 days
- Rich results appearing within 14 days

---

## Testing & Validation

### Before Deploying

1. **Build Test:**
```bash
npm run build
```

2. **Lighthouse Audit (Local):**
```bash
npm run preview
# Then run Lighthouse in Chrome DevTools
```

3. **Schema Validator:**
- https://validator.schema.org
- Test homepage and city pages

4. **Mobile-Friendly Test:**
- https://search.google.com/test/mobile-friendly

### After Deploying

1. **Rich Results Test:**
```
https://search.google.com/test/rich-results?url=https://www.topaffaireimmo.com
```

2. **PageSpeed Insights:**
```
https://pagespeed.web.dev/?url=https://www.topaffaireimmo.com
```

3. **Core Web Vitals:**
- Monitor in Google Search Console (after 28 days of data)

---

## Monitoring & Reporting

### Week 1 Checklist
- [ ] Google Search Console shows sitemap processed
- [ ] First pages indexed (check Coverage report)
- [ ] No crawl errors
- [ ] Core Web Vitals baseline established

### Week 2 Checklist
- [ ] 50+ pages indexed
- [ ] Rich snippets appearing in search
- [ ] FAQ schema showing in search results
- [ ] Mobile usability: 100% pass rate

### Month 1 Checklist
- [ ] 200+ pages indexed
- [ ] First keyword rankings appearing (positions 50-100)
- [ ] Organic traffic increase of 20-30%
- [ ] Google Business Profile verified and optimized

### Month 3 Checklist
- [ ] 500+ pages indexed
- [ ] Top 20 rankings for 10+ keywords
- [ ] Organic traffic increase of 100%+
- [ ] 50+ quality backlinks acquired

---

## Environment Variables to Verify

```bash
# .env.production
VITE_PRODUCTION_DOMAIN=https://www.topaffaireimmo.com
VITE_SITE_URL=https://www.topaffaireimmo.com
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_key
```

---

## Support Resources

### Internal Documentation
- `/docs/SEO_COMPREHENSIVE_AUDIT.md` - Full audit report
- `/docs/features/MOROCCO_SEO_IMPLEMENTATION.md` - Morocco-specific SEO
- `/docs/features/SEO_VALIDATION_CHECKLIST.md` - Validation steps

### External Resources
- Google Search Console: https://search.google.com/search-console
- Google Business Profile: https://business.google.com
- Schema.org: https://schema.org
- Google SEO Guide: https://developers.google.com/search/docs

---

## Quick Wins Summary

### Implemented ✅
1. Domain URL corrections (topaffaireimmo.com)
2. FAQ component with schema
3. SEO audit documentation

### Ready to Implement (High ROI)
1. Add FAQ to homepage (15 min)
2. Add FAQ to city pages (30 min)
3. Submit to Google Search Console (10 min)
4. Create Google Business Profile (30 min)
5. Add city page content (2-3 hours for top 10 cities)

### Total Time to Quick Wins: ~4-5 hours
### Expected Traffic Impact: +30% in 30 days

---

**Last Updated:** February 7, 2026  
**Status:** In Progress  
**Next Review:** February 14, 2026
