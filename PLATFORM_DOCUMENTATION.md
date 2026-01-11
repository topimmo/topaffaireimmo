# TopAffaireImmo - Complete Platform Documentation

## 🎉 Welcome to TopAffaireImmo

A premium real estate classifieds platform for Morocco with support for Arabic (RTL) and French (LTR), featuring free property listings and revenue through commercial banner advertising.

## 🚀 Quick Start

### Admin Access

**Admin Dashboard URL:** `http://localhost:5173/admin`

**Admin Credentials:**
- **Email:** demo@topaffaireimmo.com
- **Note:** The demo account is pre-configured as an admin in the database

### User Registration

1. Navigate to `/register` to create a new account
2. Choose your user type:
   - **Real Estate Advertiser** - Post properties for FREE
   - **Commercial Advertiser** - Purchase banner ad space

### Platform Features

#### 🏠 For Property Owners/Agencies
- **FREE property listings** (no fees, no hidden costs)
- Upload up to 10 images per property
- Support for both Sale and Rent listings
- Bilingual property descriptions (French & Arabic)
- Property management dashboard
- View listing status and statistics

#### 📢 For Commercial Advertisers
- Purchase banner ad space on high-traffic locations
- Multiple banner slots available
- Track impressions and clicks
- Submit payment proofs
- Admin approval workflow

#### 👨‍💼 For Administrators
- Full content management system
- Property moderation (approve/reject)
- Banner ad management
- Edit all website pages (About, Contact, Privacy, Terms)
- Multi-language content editing
- Analytics and statistics dashboard
- Google AdSense integration

## 📋 Database Schema Overview

### Core Tables

**profiles** - User management
- Supports 3 roles: admin, real_estate_advertiser, commercial_advertiser
- Separate role enforcement (no mixing between real estate and commercial)

**properties** - Real estate listings (100% FREE)
- Bilingual content (FR/AR)
- Full location data with Moroccan cities and neighborhoods
- Status tracking: pending, approved, rejected, sold, rented, inactive
- Featured property support

**banner_requests** - Commercial advertising (REVENUE)
- Complete ad campaign management
- Payment tracking
- Analytics (impressions, clicks)

**Reference tables:**
- cities (20 major Moroccan cities)
- neighborhoods (per city)
- property_types (apartment, house, villa, commercial, land)
- banner_slots (available ad positions)
- site_settings (dynamic configuration)

## 🌍 Multilingual Support

### Supported Languages
- **French (FR)** - Default, LTR
- **Arabic (AR)** - RTL support

### Language Toggle
Located in the header, allows seamless switching between languages with RTL/LTR layout adjustment.

### Bilingual Content Fields
- Property titles and descriptions
- Page content (About, Contact, Privacy, Terms)
- All UI elements and labels

## 📁 File Storage

### Storage Buckets

| Bucket | Access | Purpose |
|--------|--------|---------|
| `property-images` | Public read | Property photos (5MB max) |
| `banner-images` | Public read | Banner ads (2MB max) |
| `payment-receipts` | Private | Payment proofs (5MB max) |
| `agency-logos` | Public read | Agency branding (1MB max) |

Files are organized by user ID for RLS enforcement.

## 🛡️ Security Features

### Row Level Security (RLS)
- Users can only access their own data
- Commercial advertisers isolated from real estate data
- Admin has full access
- Public can view approved properties

### Authentication
- Supabase Auth (email/password)
- Secure session management
- JWT token validation

## 📊 Admin Dashboard Features

### Navigation Sections

**Dashboard**
- Platform overview statistics
- Total properties, pending approvals, active banners
- Latest activity

**Properties**
- View all properties with status filters
- Approve or reject pending listings
- View property details and images
- Filter by status, city, type

**Banner Ads**
- Manage banner requests
- View submitted banners with payment proofs
- Approve or reject campaigns
- Set campaign dates and track performance
- Manage pricing and slots

**Content Management**
- Edit legal pages (Privacy Policy, Terms & Conditions)
- Update About page content
- Manage Contact information
- Multi-language editing (FR/AR)

**Settings** (optional)
- Platform configuration
- Email templates
- AdSense settings

## 🎨 Design System

### Color Palette
- **Primary Accent:** Terracotta (#C86A4A) - Warm, trustworthy
- **Base:** Cream (#FAF8F5) - Backgrounds
- **Text:** Deep Charcoal (#1A1A1A) - Primary text
- **Secondary:** Deep Forest Green (#2C5F4F) - Success states

### Typography
- **Display:** Fraunces (Serif, weights 300-700)
- **Body:** Manrope (Sans-serif, weights 400-600)
- **Data:** JetBrains Mono (Monospace, weight 500)

### Components
- ShadCN UI components for consistent UX
- Lucide React icons for all UI elements
- Tailwind CSS for styling

## 🗂️ Project Structure

```
src/
├── components/
│   ├── layout/          # Header, Footer, Navigation
│   ├── home/            # Homepage components
│   ├── advertising/     # Ad banners
│   └── ui/              # ShadCN components
├── contexts/
│   ├── AuthContext.tsx  # Authentication state
│   └── LanguageContext.tsx # Language management
├── hooks/
│   ├── useProperties.ts   # Property queries
│   ├── useBanners.ts      # Banner management
│   └── useReferenceData.ts # Cities, types, etc.
├── lib/
│   ├── supabase.ts      # Supabase client
│   └── storage.ts       # File upload utilities
├── pages/
│   ├── AdminPanel.tsx   # Admin dashboard
│   ├── Dashboard.tsx    # User dashboard
│   ├── AddListing.tsx   # Property creation
│   ├── About.tsx        # About page
│   ├── Contact.tsx      # Contact page
│   ├── Privacy.tsx      # Privacy policy
│   ├── Terms.tsx        # Terms of service
│   └── ... (other pages)
├── types/
│   └── supabase.ts      # Database types
└── App.tsx              # Main app component
```

## 🔧 Environment Variables

Required environment variables (set in Supabase project settings):

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

## 📚 API Hooks Reference

### Property Hooks

```typescript
// Get all properties with filters
const { properties, loading, error } = useProperties({
  transaction_type: 'sale',
  city_id: 1,
  min_price: 1000000,
  max_price: 5000000
});

// Get single property
const { property, loading } = useProperty(propertyId);

// Get featured properties
const { properties } = useFeaturedProperties();

// Get latest listings
const { properties } = useLatestProperties();

// Get user's properties
const { properties } = useMyProperties();
```

### Banner Hooks

```typescript
// Get available banner slots
const { slots } = useBannerSlots();

// Get active banners for a page
const { banners } = useActiveBanners('home', 'hero');

// Get banner for specific slot
const { banner, trackImpression, trackClick } = useBannerBySlot('home_hero');

// Get user's banner requests
const { requests } = useMyBannerRequests();

// Get all banner requests (admin)
const { requests } = useAllBannerRequests('pending');
```

### Reference Data Hooks

```typescript
// Get all cities
const { cities } = useCities();

// Get neighborhoods for a city
const { neighborhoods } = useNeighborhoods(cityId);

// Get property types
const { propertyTypes } = usePropertyTypes();

// Get site settings
const { settings } = useSiteSettings('general');

// Helper functions
const cityName = getCityName(city, 'fr'); // or 'ar'
```

## 🚀 Deployment Checklist

- [ ] Update Admin email in database
- [ ] Configure Supabase custom domain
- [ ] Set up email templates
- [ ] Add Google AdSense codes to AdBanner components
- [ ] Update contact information in site_settings
- [ ] Configure storage bucket access
- [ ] Test all forms and validations
- [ ] Test multilingual support (FR/AR)
- [ ] Verify RLS policies
- [ ] Set up monitoring and analytics

## 🔐 Key Business Rules

1. **Property Listings are 100% FREE** - No payments required for real estate listings
2. **Revenue from Commercial Banners Only** - Ad space purchases generate revenue
3. **Strict Role Separation** - Real estate and commercial accounts cannot mix
4. **Admin Moderation Required** - Properties and banners need approval
5. **Moroccan Focus** - All reference data tailored to Morocco

## 📞 Support & Contact

For support or inquiries:
- Email: contact@topaffaireimmo.com
- Phone: +212 5XX XX XX XX
- WhatsApp: +212 6XX XX XX XX

## 📄 License

TopAffaireImmo © 2024. All rights reserved.

---

**Ready to launch?** Start by logging in to the admin dashboard and exploring the property listings!
