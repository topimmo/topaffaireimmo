# TopAffaireImmo - Setup & Deployment Guide

## 🎯 Pre-Launch Checklist

### 1. Environment Setup

✅ **Supabase Project Created**
- Project URL configured
- Anon Key and Service Key generated
- Database initialized with migrations

✅ **Environment Variables**
```
VITE_SUPABASE_URL=<your_project_url>
VITE_SUPABASE_ANON_KEY=<your_anon_key>
```

### 1.1. Email Configuration (Hostinger SMTP)

⚠️ **IMPORTANT**: Configure custom SMTP to send emails from your domain instead of Supabase default.

**📧 Email Addresses:**
- Main mailbox: `contact@topaffaireimmo.com`
- Auth emails: `noreply@topaffaireimmo.com`
- Support: `support@topaffaireimmo.com`
- Info: `info@topaffaireimmo.com`

**🔧 SMTP Settings (Hostinger):**
```
Host: smtp.hostinger.com
Port: 465
Encryption: SSL
Sender: noreply@topaffaireimmo.com
Sender Name: TopAffaireImmo
```

**📝 Configuration Steps:**

1. Go to Supabase Dashboard → **Settings** → **Auth** → **SMTP Settings**
2. Enable **Custom SMTP**
3. Enter the SMTP settings above
4. **SMTP Password**: Add manually (not in repository)
5. Click **Save** and **Send Test Email**
6. Verify email arrives at `contact@topaffaireimmo.com`

**📚 Detailed Documentation:**
- See `/docs/EMAIL_CONFIGURATION.md` for complete setup guide
- See `/supabase/templates/` for email templates
- See `/supabase/config.toml` for configuration reference

### 2. Database Initialization

✅ **Migrations Run** (in order):
```bash
supabase/migrations/020_full_rebuild.sql       # Core schema
supabase/migrations/021_storage_buckets.sql    # Storage configuration
supabase/migrations/024_sample_properties_data.sql # Sample data
```

✅ **Storage Buckets Created:**
- property-images
- banner-images
- payment-receipts
- agency-logos

### 3. Demo Data

✅ **Sample Properties Loaded** (8 properties across Morocco)
- 4 Featured properties
- Multiple cities and types
- Both Sale and Rent listings
- Bilingual descriptions

✅ **Admin User Created:**
- Email: demo@topaffaireimmo.com
- Role: admin
- Can manage everything

### 4. Application Setup

✅ **Dependencies Installed**
```bash
npm install
```

✅ **Dev Server Running**
```bash
npm run dev
```

✅ **Build Tested**
```bash
npm run build
```

## 📱 Page Routing Map

| Route | Title | Status |
|-------|-------|--------|
| `/` | Home | ✅ Fully Functional |
| `/register` | User Registration | ✅ Fully Functional |
| `/login` | User Login | ✅ Fully Functional |
| `/search` | Property Search | ✅ Fully Functional |
| `/property/:id` | Property Details | ✅ Fully Functional |
| `/add-listing` | Add Property | ✅ Fully Functional |
| `/edit-listing/:id` | Edit Property | ✅ Fully Functional |
| `/dashboard` | User Dashboard | ✅ Fully Functional |
| `/admin` | Admin Panel | ✅ Fully Functional |
| `/about` | About Page | ✅ Bilingual |
| `/contact` | Contact Page | ✅ Bilingual |
| `/privacy` | Privacy Policy | ✅ Bilingual |
| `/terms` | Terms of Service | ✅ Bilingual |

## 🌐 Multilingual Implementation

### Language Switch
- Located in header
- Saves preference to localStorage
- Auto-applies RTL for Arabic

### Supported Pages (Bilingual)
- ✅ Home (via LanguageContext)
- ✅ About (FR/AR content objects)
- ✅ Contact (FR/AR content objects)
- ✅ Privacy (FR/AR content)
- ✅ Terms (FR/AR content)
- ✅ Dashboard
- ✅ Admin Panel
- ✅ Property Details
- ✅ All Forms

### RTL Support
- Implemented via `dir="rtl"` attribute
- Tailwind RTL utilities
- Flex row reversals for layout mirroring
- Text alignment adjustments

## 🏢 Admin Panel Features

### Access
- URL: `/admin`
- Requires admin role
- Redirects non-admins to home

### Dashboard Section
- Overview statistics
- Total properties, pending approvals, active banners
- Quick stats cards

### Properties Section
- View all properties with status
- Filter by status (pending/approved/rejected)
- Approve or reject listings
- View property details
- See images and descriptions

### Banner Ads Section
- Pending banner requests
- Active campaigns
- View banner previews
- Approve/reject with notes
- Payment proof verification

### Content Management
- Edit legal pages (Privacy, Terms)
- Update About page
- Manage Contact information
- Full FR/AR support
- Preview before saving

## 🎨 Homepage Features

### Header
- Logo and branding
- Navigation (Buy, Rent, Add Listing)
- Language toggle (FR/AR)
- Auth links (Login/Register/Dashboard)
- Agency CTA

### Hero Search Module
- City selection (20 Moroccan cities)
- Property type filter
- Transaction type (Sale/Rent)
- Price range slider
- Search submit button

### Featured Properties Carousel
- Horizontally scrolling
- 8 featured properties pre-loaded
- Image-forward cards
- Hover animations
- Click to view details

### Latest Listings Grid
- 8 properties initially loaded
- Bento-style asymmetric layout
- Filter pills (type, price range)
- Quick property info
- Click to view details

### Ad Banners
- Strategic placement after featured section
- Non-intrusive design
- Google AdSense fallback support
- Size: 728x90 (standard)

### Footer
- About, Legal, Contact links
- Social media links (template)
- Contact information
- Copyright notice

## 💳 Payment & Advertising

### Banner Ad System
- Users select available slots
- Upload banner image
- Set campaign duration
- Provide payment proof
- Admin reviews and approves
- Campaign goes live on approval

### Available Slots
1. **Home Hero** - 1200x400
2. **Home Middle** - 728x90
3. **Home Sidebar** - 300x250
4. **Search Top** - 728x90
5. **Search Sidebar** - 300x600
6. **Property Bottom** - 728x90

### Pricing Model (Configurable)
- Per day, per week, or per month rates
- Stored in banner_slots table
- Admin can adjust prices

## 🔒 Security & RLS

### Active RLS Policies
- Properties: Public read approved, owner edit, admin all
- Banners: Public read active, advertiser insert, admin all
- Profiles: Private with agency exception
- Storage: User isolation via folder structure

### Authentication
- Supabase Auth email/password
- JWT token validation
- Auto logout on token expiry
- Secure session management
- Custom SMTP (Hostinger) for all emails
  - Authentication emails from: noreply@topaffaireimmo.com
  - Support emails from: support@topaffaireimmo.com
  - See `/docs/EMAIL_CONFIGURATION.md` for setup details

## 📊 Analytics

### Tracking
- Property views counter
- Banner impressions
- Banner clicks
- User registration metrics

### Admin Dashboard
- Shows real-time statistics
- Property status breakdown
- Banner performance metrics
- Platform health indicators

## 🎁 Sample Data

8 sample properties pre-loaded across major Moroccan cities:

1. **Luxury Apartment** - Casablanca, Sale, 2.5M MAD
2. **Villa with Pool** - Marrakech, Sale, 8.5M MAD
3. **Modern Apartment** - Rabat, Rent, 12,000 MAD/month
4. **Commercial Space** - Tangier, Rent, 25,000 MAD/month
5. **Constructible Land** - Agadir, Sale, 3.5M MAD
6. **Traditional House** - Fes, Sale, 1.8M MAD
7. **Bright Apartment** - Casablanca, Rent, 8,500 MAD/month
8. **Seafront Villa** - Tangier, Sale, 5.5M MAD

## 🚀 Production Deployment

### Before Going Live

1. **Update Admin Email**
   ```sql
   UPDATE public.profiles 
   SET email = 'your-admin@domain.com' 
   WHERE email = 'demo@topaffaireimmo.com';
   ```

2. **Add Custom Domain** (Supabase dashboard)

3. **Configure Email** (Supabase Auth settings)

4. **Add Google AdSense** (components/advertising/AdSenseBanner.tsx)

5. **Update Contact Info** (via Admin Panel or database)

6. **Enable HTTPS** (automatic with deployment)

### Hosting Options

**Recommended:**
- Vercel (auto-deployment from Git)
- Netlify (with serverless functions)
- CloudFlare Pages (edge computing)

**Process:**
1. Push code to Git
2. Connect to hosting platform
3. Set environment variables
4. Deploy automatically

## 📝 Post-Launch Tasks

- [ ] Monitor user registrations
- [ ] Review property submissions
- [ ] Approve banner requests promptly
- [ ] Update site settings as needed
- [ ] Monitor AdSense performance
- [ ] Collect feedback from users
- [ ] Plan feature enhancements

## 🆘 Troubleshooting

### Common Issues

**Properties not showing:**
- Check RLS policies
- Verify status is 'approved'
- Check city_id references

**Ads not displaying:**
- Verify banner status is 'active'
- Check date ranges (start_date <= now <= end_date)
- Confirm file upload completed

**Language not switching:**
- Check localStorage permissions
- Verify LanguageContext provider
- Check browser cache

**Auth issues:**
- Verify Supabase credentials
- Check email confirmation settings
- Clear browser cookies

## 📞 Support Contacts

- **Developer Support:** Contact development team
- **Admin Questions:** See PLATFORM_DOCUMENTATION.md
- **User Support:** support@topaffaireimmo.com

## ✨ Final Notes

TopAffaireImmo is now ready for production deployment!

**Key Differentiators:**
- 100% FREE property listings (no revenue from real estate)
- Revenue-focused through commercial banner advertising
- Complete multilingual support (French & Arabic)
- Fully functional admin dashboard
- Beautiful, modern design following Editorial Swiss architecture
- Complete Moroccan focus with real cities and references

**Launch successfully!** 🎉
