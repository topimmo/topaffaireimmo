# TopAffaireImmo - Real Estate Platform

A modern, bilingual (French/Arabic) real estate platform for Morocco, built with React, TypeScript, and Supabase.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/topimmo/topaffaireimmo.git
cd topaffaireimmo

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## 📚 Documentation

### Core Setup Guides
- **[Supabase Documentation Index](SUPABASE_DOCUMENTATION_INDEX.md)** - 📖 Start here for Supabase setup
  - [Quick Reference](SUPABASE_QUICK_REFERENCE.md) - ⚡ Fast fixes & troubleshooting (7 min)
  - [Diagnostic Report](SUPABASE_DIAGNOSTIC_REPORT.md) - 📋 Complete configuration guide (1,792 lines)
  - [Setup Quickstart](SUPABASE_SETUP_QUICKSTART.md) - 🚀 Guided setup (30-60 min)
- **[Setup Guide](docs/SETUP.md)** - Complete local development setup
- **[Architecture](docs/ARCHITECTURE.md)** - System design and folder structure  
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment to Vercel

### Feature Documentation
- [Email Configuration](docs/setup/EMAIL_CONFIGURATION.md)
- [Facebook Auto-Publishing](docs/features/FACEBOOK_AUTO_PUBLISH_SETUP.md)
- [Morocco SEO Implementation](docs/features/MOROCCO_SEO_IMPLEMENTATION.md)
- [Sample Listings Seed Script](docs/SAMPLE_LISTINGS_SEED.md)

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Routing**: React Router v6
- **UI**: TailwindCSS + Radix UI + Shadcn
- **Forms**: React Hook Form + Zod
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Vercel
- **Internationalization**: Custom i18n (French/Arabic)
- **PWA**: vite-plugin-pwa + Workbox (offline support, installable)

## 🔑 Key Features

### For Property Advertisers
- List and manage real estate properties
- Upload property images (up to 10 per listing)
- Bilingual listings (French/Arabic)
- Dashboard for managing active/pending listings

### For Commercial Advertisers
- Purchase banner advertising slots
- Manage ad campaigns
- Campaign analytics and tracking

### For Administrators
- Property moderation and approval
- User management
- Banner ad approval workflow
- Platform settings and configuration

### For Visitors
- Browse properties by city, neighborhood, property type
- Advanced search and filtering
- SEO-optimized landing pages for Morocco cities
- Responsive design (mobile-first)

## 🔒 User Roles

1. **real_estate_advertiser** (default) - Can create and manage property listings
2. **commercial_advertiser** - Can purchase and manage banner ads
3. **admin** - Full platform access, moderation, and management

## 🗂️ Project Structure

```
topaffaireimmo/
├── src/
│   ├── app/              # App bootstrap (router, providers, guards)
│   ├── pages/            # Route components
│   ├── features/         # Domain-specific logic
│   ├── components/       # Shared UI components
│   ├── lib/              # Utilities and API clients
│   ├── types/            # TypeScript definitions
│   └── styles/           # Global styles
├── supabase/
│   ├── migrations/       # Database migrations
│   ├── functions/        # Edge functions
│   └── templates/        # Email templates
├── public/               # Static assets
└── docs/                 # Documentation
```

## 🔧 Available Scripts

```bash
npm run dev                    # Start development server
npm run build                  # Build for production
npm run preview                # Preview production build
npm run typecheck              # Run TypeScript type checking
npm run lint                   # Run ESLint
npm run seed:sample-listings   # Generate sample property listings
```

## 📱 Progressive Web App (PWA)

TopAffaireImmo is a fully-featured Progressive Web App that can be installed on Android and iOS devices for a native app-like experience.

### PWA Features

- **Installable**: Users can install the app on their home screen (Android, iOS, Desktop)
- **Offline Support**: Branded offline fallback page when network is unavailable
- **Smart Caching**: 
  - Static assets cached for fast loading
  - Images cached with CacheFirst strategy
  - API calls use NetworkFirst to ensure fresh data
  - Auth endpoints and tokens are never cached
- **Auto-Updates**: Service worker automatically updates when new version is deployed
- **Standalone Display**: Runs fullscreen without browser UI
- **Push Notifications**: 🔔 **NEW** - Opt-in web push notifications
  - User-controlled toggle in Dashboard
  - Respects privacy - only asks after user interaction
  - Fully bilingual (FR + AR)
  - Works on Android Chrome, Desktop Chrome, iOS 16.4+
  - See [Push Notifications Quick Start](./PUSH_NOTIFICATIONS_QUICK_START.md)

### Install Prompt

The app displays an install button in the header that:
- Shows install prompt on Android Chrome (using `beforeinstallprompt` event)
- Shows installation instructions modal on iOS Safari
- Supports both French and Arabic (RTL) languages
- Auto-hides after installation or dismissal

### Testing PWA Locally

1. **Build the app** (PWA only works in production builds):
   ```bash
   npm run build
   npm run preview
   ```

2. **Test in Chrome DevTools**:
   - Open Chrome DevTools (F12)
   - Navigate to Application tab
   - Check "Manifest" section for manifest.json
   - Check "Service Workers" section for registered worker
   - Use Lighthouse to audit PWA compliance

3. **Test Installation**:
   - **Android Chrome**: Install prompt should appear in header
   - **iOS Safari**: Tap install button → follow instructions in modal
   - **Desktop Chrome**: Install prompt appears in header or address bar

### Testing PWA in Production

1. Deploy to production (Vercel automatically serves PWA assets)
2. Visit production URL on mobile device
3. Check for install prompt/instructions
4. Install app and verify:
   - App opens in standalone mode (no browser UI)
   - Icons display correctly
   - Offline page works (turn off network)
   - Updates automatically when new version deployed

### Lighthouse PWA Checklist

The app meets all core PWA requirements:
- ✅ Installable (manifest + service worker)
- ✅ Works offline (offline fallback page)
- ✅ Configured for mobile (viewport, icons, theme-color)
- ✅ HTTPS (required for PWA, provided by Vercel)
- ✅ Fast load times (asset precaching + code splitting)

### Updating PWA Assets

To update icons or manifest:

1. **Update icons**: Replace files in `/public/icons/`
   - icon-192.png (192x192)
   - icon-512.png (512x512)
   - icon-192-maskable.png (with safe padding)
   - icon-512-maskable.png (with safe padding)
   - apple-touch-icon.png (180x180)

2. **Update manifest**: Edit `vite.config.ts` → `VitePWA.manifest` section

3. **Rebuild**: Run `npm run build`

4. **Note**: To regenerate icons from scratch, run:
   ```bash
   npx tsx scripts/generate-pwa-icons.ts
   ```

### PWA Architecture

- **Plugin**: `vite-plugin-pwa` generates service worker and manifest
- **Workbox**: Runtime caching strategies (NetworkFirst, CacheFirst)
- **Auto-registration**: Service worker auto-registers on page load
- **Component**: `InstallPWAButton` handles install UX
- **Offline**: `/public/offline.html` shown when offline

### Browser Support

- ✅ Android Chrome (full support including install prompt)
- ✅ iOS Safari 11.3+ (manual "Add to Home Screen")
- ✅ Desktop Chrome/Edge (install prompt supported)
- ⚠️ Firefox/Opera (manual install only)

### Sample Listings

The project includes a seed script to generate realistic sample property listings across Morocco. This is useful for:
- Development and testing
- Demonstrating the platform
- Populating the database with diverse data

See [Sample Listings Documentation](docs/SAMPLE_LISTINGS_SEED.md) for setup and usage instructions.

## 🌍 Environment Variables

Required variables (see `.env.example`):

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_PRODUCTION_DOMAIN` - Production domain for email links

## 📦 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

See [Deployment Guide](docs/DEPLOYMENT.md) for detailed instructions.

📋 **[Deployment Verification Guide](DEPLOYMENT_VERIFICATION.md)** - Complete guide for verifying deployments and troubleshooting

#### Verifying Production Deployments

After deploying to production, you can verify which version is running:

1. **Check Build Info in Admin Panel** (Recommended):
   - Log in as an admin
   - Navigate to Settings (`/admin/settings`)
   - Scroll to the "Build Information" section
   - Verify the Commit SHA matches your latest commit

2. **Check Vercel Dashboard**:
   - Go to your Vercel project dashboard
   - Click on the latest deployment
   - Verify the commit SHA and deployment status

#### Promoting Preview to Production

If you need to promote a specific preview deployment to production:

1. Go to your Vercel project dashboard
2. Find the preview deployment you want to promote
3. Click the "..." menu on the deployment
4. Select "Promote to Production"
5. Verify the deployment completes successfully
6. Check the build info in Admin Settings to confirm the correct version is live

#### Cache Busting

Vercel automatically handles cache busting for static assets. However, if you need to force users to get the latest version:

1. The `index.html` file is configured with `no-cache` headers
2. All JS/CSS files include content hashes in their filenames
3. If needed, you can clear Vercel's cache from the project settings

**Important**: Always verify the commit SHA after deployment to ensure the latest changes are live!

## 🗄️ Database

The platform uses Supabase PostgreSQL with:
- 11 tables (properties, users, banners, payments, etc.)
- Row Level Security (RLS) policies
- 4 storage buckets (property images, banner images, etc.)
- Database triggers for auto-profile creation

See [Supabase Setup](docs/setup/SUPABASE_SETUP.md) for migration instructions.

## 📝 License

Private - All rights reserved

## 🤝 Support

For questions or issues, please refer to the documentation in the `/docs` folder.
