# Morocco SEO Foundation - Implementation Guide

## Overview

This document outlines the SEO foundation implemented for TopAffaireImmo, a Moroccan real estate platform. The implementation focuses on pre-launch SEO preparation to ensure Google understands the domain, Moroccan geography, cities, neighborhoods, and real estate structure before official launch.

## 🎯 Key Features Implemented

### 1. Domain & Indexing Control

#### Environment Configuration
- **Production Domain**: Configurable via `VITE_PRODUCTION_DOMAIN` environment variable
- **Default**: `https://topaffaireimmo.vercel.app`
- **Future**: Ready for custom domain (e.g., `https://topaffaireimmo.ma`)

#### Indexing Protection
- `robots.txt` configured to:
  - Allow all public pages on production domain
  - Block admin, dashboard, and private pages
  - Include sitemap reference
- SEO component dynamically checks if current domain matches production
- Preview deployments should use Vercel's deployment protection

### 2. Morocco-Specific SEO

#### Language Support
- **Primary**: French (fr-MA)
- **Secondary**: Arabic (ar-MA)
- **Hreflang tags**: Automatically added to all pages
- HTML lang attribute: `fr-MA`

#### Geographic Targeting
- Country: Morocco (MA)
- Currency: MAD (Moroccan Dirham)
- Geo meta tags with Rabat coordinates as default
- All structured data includes Morocco context

### 3. Real Estate Structure

#### SEO Landing Pages Created

**City Pages** (`/city-name`):
- `/casablanca` - Casablanca (الدار البيضاء)
- `/rabat` - Rabat (الرباط)
- `/marrakech` - Marrakech (مراكش)
- `/tanger` - Tanger (طنجة)
- `/agadir` - Agadir (أكادير)
- `/fes` - Fès (فاس)

**Transaction Pages** (`/transaction-type`):
- `/acheter` - Buy properties
- `/louer` - Rent properties

**Combined Pages** (`/transaction-propertytype-city`):
- `/acheter-appartement` - Buy apartments
- `/louer-villa` - Rent villas
- `/acheter-casablanca` - Buy in Casablanca
- `/louer-appartement-casablanca` - Rent apartments in Casablanca
- And many more combinations...

### 4. Neighborhoods (Quartiers)

#### Database Structure
- **Table**: `neighborhoods` (already exists in database)
- **Fields**: 
  - `id` - Primary key
  - `city_id` - Foreign key to cities
  - `name_fr` - French name
  - `name_ar` - Arabic name
  - `is_active` - Status flag

#### Major Neighborhoods Pre-Populated

**Casablanca**:
- Maarif (المعاريف)
- Anfa (أنفا)
- Bourgogne (بورغون)
- Aïn Diab (عين الذياب)
- Sidi Maarouf (سيدي معروف)
- Hay Hassani (الحي الحسني)
- Gauthier (غوتيي)

**Rabat**:
- Agdal (أكدال)
- Hay Riad (حي الرياض)
- Hassan (حسان)
- Souissi (سويسي)

**Other cities**: Similar neighborhoods pre-populated

#### UI Display
- **Property Cards**: Show "Neighborhood • City" format
- **Property Details**: Prominent neighborhood display
- **Format**: `<neighborhood> • <city>` (e.g., "Maarif • Casablanca")

### 5. Technical SEO Components

#### SEO Component (`src/components/SEO.tsx`)
Dynamic meta tag management:
- Updates document title
- Manages canonical URLs
- Adds/updates meta descriptions
- Handles Open Graph tags
- Manages Twitter Card metadata
- Adds hreflang tags
- Injects structured data (JSON-LD)
- Checks indexing permissions

Usage:
```tsx
<SEO
  title="Page Title"
  description="Page description"
  canonical="/path"
  structuredData={{...}}
/>
```

#### SEO Utilities (`src/lib/seo.ts`)
Helper functions:
- `getProductionDomain()` - Get configured domain
- `getCanonicalUrl(path)` - Generate canonical URLs
- `slugify(text)` - Create SEO-friendly slugs
- `generatePropertySearchUrl()` - Build search URLs
- `generateMetaDescription()` - Create meta descriptions
- `generatePageTitle()` - Build page titles
- `shouldAllowIndexing()` - Check if indexing allowed
- `isVercelPreview()` - Detect preview deployments

#### Sitemap (`public/sitemap.xml`)
Comprehensive sitemap including:
- Homepage with hreflang
- All city pages
- All transaction types
- Combined transaction + city pages
- Static pages (about, contact, etc.)
- Ready for dynamic property URLs

### 6. Structured Data (Schema.org)

#### Base Schemas (index.html)
1. **RealEstateAgent**
   - Organization info
   - Areas served (all major cities)
   - Service types
   - Price range (MAD)

2. **WebSite**
   - Site information
   - Search functionality
   - Multi-language support

#### Dynamic Schemas (Per Page)
1. **RealEstateListing** (Property Details)
   - Property information
   - Offer details with MAD pricing
   - PostalAddress with neighborhood
   - Place/Geo information
   - Room counts and floor size

2. **SearchResultsPage** (Transaction Pages)
   - Page metadata
   - Offer context
   - Area served information

3. **Place** (City Pages)
   - City information
   - Address details
   - Country context

## 📁 File Structure

```
/home/runner/work/topaffaireimmo/topaffaireimmo/
├── src/
│   ├── components/
│   │   ├── SEO.tsx              # Dynamic SEO component
│   │   └── home/
│   │       └── PropertyCard.tsx  # Updated with neighborhood
│   ├── lib/
│   │   └── seo.ts               # SEO utilities
│   ├── pages/
│   │   ├── CityPage.tsx         # City landing pages
│   │   ├── TransactionPage.tsx  # Transaction SEO pages
│   │   └── PropertyDetails.tsx  # Updated with neighborhoods
│   └── App.tsx                  # Routes for SEO pages
├── public/
│   ├── robots.txt               # Updated robots.txt
│   └── sitemap.xml              # Morocco-focused sitemap
├── docs/
│   └── SEO_DEPLOYMENT.md        # Deployment guide
├── index.html                   # Enhanced with Morocco SEO
└── .env.example                 # Added VITE_PRODUCTION_DOMAIN
```

## 🚀 Setup & Configuration

### 1. Environment Variables

Create `.env` file:
```bash
VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.vercel.app
# Update to your custom domain when ready:
# VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.ma
```

### 2. Vercel Configuration

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add `VITE_PRODUCTION_DOMAIN` for Production environment
3. Enable Deployment Protection for preview deployments

### 3. Custom Domain Setup

When you get your custom domain:
1. Update `.env` and Vercel environment variables
2. Update `public/sitemap.xml` domain references
3. SEO component will automatically use new domain for canonicals
4. All hreflang tags will auto-update

## 🧪 Testing

### Local Testing
```bash
npm install
npm run dev
```

### Build Testing
```bash
npm run build
npm run preview
```

### SEO Validation Tools
1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Schema Markup Validator**: https://validator.schema.org/
3. **Hreflang Tags Checker**: https://hreflang.org/
4. **Robots.txt Tester**: Google Search Console

## 📊 SEO Checklist Status

- ✅ Domain configuration ready
- ✅ Robots.txt configured
- ✅ Canonical URLs implemented
- ✅ Hreflang tags (fr-MA, ar-MA)
- ✅ Morocco geo-targeting
- ✅ City landing pages (6 major cities)
- ✅ City immobilier pages with neighborhood listings (/immobilier/[city])
- ✅ Neighborhood pages (/immobilier/[city]/[neighborhood])
- ✅ 35+ neighborhoods data across 6 cities
- ✅ Transaction pages (buy/rent)
- ✅ Neighborhoods database ready
- ✅ Neighborhood display in UI
- ✅ Structured data (5+ schemas: Organization, WebSite, RealEstateListing, Place, BreadcrumbList)
- ✅ BreadcrumbList on all major pages
- ✅ Dynamic sitemap with neighborhood routes
- ✅ Clean SEO URLs
- ✅ Multi-language support (French/Arabic)
- ✅ Enhanced PostalAddress with neighborhoods
- ✅ SEO utility functions for neighborhoods
- ⏳ Dynamic sitemap generation for individual properties (planned)

## 🆕 Recent Enhancements (January 2026)

### New Features Added

1. **Dynamic Neighborhood Routes**
   - `/immobilier/[city]` - City overview pages
   - `/immobilier/[city]/[neighborhood]` - Neighborhood-specific pages
   - 35+ neighborhoods across 6 major cities

2. **BreadcrumbList Schema**
   - Added to PropertyDetails, CityPage, TransactionPage, CityImmobilierPage, NeighborhoodPage
   - Improves search result display and navigation understanding

3. **Enhanced Structured Data**
   - Organization schema with more properties
   - ImageObject arrays for better image representation
   - Seller information in property listings
   - Arabic alternateName for all geographic entities

4. **Neighborhood Utilities**
   - `getAllNeighborhoods()` - Get all neighborhoods
   - `getNeighborhoodsByCity(citySlug)` - Get city neighborhoods
   - `findNeighborhood(slug)` - Find by slug
   - `findNeighborhoodInCity(citySlug, neighborhoodSlug)` - Find in specific city

### Files Added
- `src/pages/CityImmobilierPage.tsx`
- `src/pages/NeighborhoodPage.tsx`

### How to Add More Neighborhoods

Add to `MOROCCO_NEIGHBORHOODS` in `src/lib/seo.ts`:
```typescript
casablanca: [
  // ... existing
  { id: 'new-area', name_fr: 'New Area', name_ar: 'المنطقة الجديدة', slug: 'new-area', city_id: 'casablanca' },
]
```

The route `/immobilier/casablanca/new-area` will automatically work!

## 🎯 Next Steps (Post-Launch)

1. **Add Real Properties**: Populate database with listings
2. **Dynamic Sitemap**: Generate sitemap from database
3. **Neighborhood Filtering**: Add neighborhood search filters
4. **Rich Snippets**: Add more property-specific schemas
5. **Google Search Console**: Submit sitemap, monitor indexing
6. **Analytics**: Track SEO performance
7. **Content**: Add city-specific content and guides

## 📝 Important Notes

### Pre-Launch Status
- This is SEO **preparation mode**
- Pages show "Coming Soon" placeholders
- Structure is ready for content
- Google can discover and understand the site structure

### What's NOT Included (By Design)
- ❌ Blog articles
- ❌ Keyword stuffing
- ❌ Backlinks
- ❌ Google Ads
- ❌ Aggressive SEO tactics
- ❌ Content marketing

### Migration to Production Domain
When migrating to a custom domain:
1. All SEO will automatically adapt
2. Canonical URLs will update
3. Hreflang tags will update
4. Structured data will reference new domain
5. Only need to update environment variable

## 🔒 Security

- All SEO components use safe DOM manipulation
- No XSS vulnerabilities in meta tag generation
- Structured data properly escaped
- Preview deployments blocked from indexing

## 📞 Support

For questions about this SEO implementation, refer to:
- `docs/SEO_DEPLOYMENT.md` - Deployment details
- `src/lib/seo.ts` - Technical utilities
- `src/components/SEO.tsx` - SEO component usage

---

**Implementation Date**: January 2026
**Platform**: TopAffaireImmo - Morocco Real Estate
**Status**: ✅ Pre-Launch SEO Foundation Complete
