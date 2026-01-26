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

- **[Setup Guide](docs/SETUP.md)** - Complete local development setup
- **[Architecture](docs/ARCHITECTURE.md)** - System design and folder structure  
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment to Vercel
- **[Supabase Setup](docs/setup/SUPABASE_SETUP.md)** - Database configuration and migrations

### Feature Documentation
- [Email Configuration](docs/setup/EMAIL_CONFIGURATION.md)
- [Facebook Auto-Publishing](docs/features/FACEBOOK_AUTO_PUBLISH_SETUP.md)
- [Morocco SEO Implementation](docs/features/MOROCCO_SEO_IMPLEMENTATION.md)

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Routing**: React Router v6
- **UI**: TailwindCSS + Radix UI + Shadcn
- **Forms**: React Hook Form + Zod
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Vercel
- **Internationalization**: Custom i18n (French/Arabic)

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
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run typecheck    # Run TypeScript type checking
npm run lint         # Run ESLint
```

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
