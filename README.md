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

### Diagnostic & Maintenance Tools
- **[Migration Diagnostic Tool](MIGRATION_DIAGNOSTIC_TOOL.md)** - 🔍 Check migration status
  - [Quick Reference](MIGRATION_DIAGNOSTIC_QUICK_REFERENCE.md) - Fast migration check guide
  - Detects pending, missing, and out-of-order migrations
  - Automatic SQL impact analysis
  - Usage: `npm run check:migrations`
- **[Migration Repair Guide](docs/SUPABASE_MIGRATION_REPAIR_GUIDE.md)** - 🔧 Fix migration conflicts (new)
  - [Quick Reference](SUPABASE_MIGRATION_REPAIR_QUICK_REFERENCE.md) - Fast fix for migration conflicts
  - [Example Scenarios](docs/SUPABASE_MIGRATION_REPAIR_EXAMPLES.md) - Real-world examples
  - Resolve "Found local migration files to be inserted before the last migration" errors
  - Handle deprecated/no-op migrations safely
  - Best practices for production migrations

### Feature Documentation
- [Email Configuration](docs/setup/EMAIL_CONFIGURATION.md)
- **[Supabase Email Auth Setup](docs/SUPABASE_EMAIL_AUTH_SETUP.md)** - 📧 Complete guide for email confirmation & password reset
  - [Auth Testing Guide](docs/AUTH_TESTING_GUIDE.md) - Step-by-step testing procedures
  - Fixes "Email link is invalid or has expired" errors
  - PKCE flow support for both signup and password reset
- [Facebook Auto-Publishing](docs/features/FACEBOOK_AUTO_PUBLISH_SETUP.md)
- [Morocco SEO Implementation](docs/features/MOROCCO_SEO_IMPLEMENTATION.md)
- [Sample Listings Seed Script](docs/SAMPLE_LISTINGS_SEED.md)
- **[Auth Troubleshooting](docs/AUTH_TROUBLESHOOTING.md)** - 🔧 Fix auth links and issues
  - [Supabase Auth Redirect URLs](docs/SUPABASE_AUTH_REDIRECT_URLS.md) - Required configuration
  - Resolve "Lien invalide / Expiré" errors
  - Password reset and magic link troubleshooting
- **[Deployment Guide](VERCEL_DEPLOYMENT_FIX.md)** - 📦 Vercel deployment setup and troubleshooting

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Routing**: React Router v6
- **UI**: TailwindCSS + Radix UI + Shadcn
- **Forms**: React Hook Form + Zod
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Vercel
- **Internationalization**: Custom i18n (French/Arabic)
- **Performance**: Optimized bundling with Vite, lazy loading, code splitting


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
- Web push notifications for new property alerts (opt-in)

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
npm run check:migrations       # 🆕 Check database migration status (pending, missing, order issues)
npm run seed:sample-listings   # Generate sample property listings
```

## 🚀 Performance & Optimization

TopAffaireImmo is optimized for fast load times and smooth user experience:

- **Code Splitting**: Automatic route-based code splitting with React lazy loading
- **Image Optimization**: Sharp for generating optimized OG images
- **Bundle Optimization**: Vite's advanced chunking strategy for efficient loading
- **SEO**: Comprehensive meta tags, structured data, and sitemap generation
- **Caching**: Browser caching strategies via Vercel headers

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
