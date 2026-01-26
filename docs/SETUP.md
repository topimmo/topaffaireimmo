# Local Development Setup

Complete guide for setting up TopAffaireImmo locally.

## Prerequisites

- **Node.js** 18 or higher
- **npm** 8 or higher (comes with Node.js)
- **Git**
- **Supabase account** (free tier is fine)

## Step 1: Clone the Repository

```bash
git clone https://github.com/topimmo/topaffaireimmo.git
cd topaffaireimmo
```

## Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React 18
- TypeScript
- Vite
- Supabase client
- TailwindCSS
- Radix UI components
- And more...

## Step 3: Set Up Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_PRODUCTION_DOMAIN=http://localhost:5173
```

### Getting Supabase Credentials

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Create a new project (or use existing)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

## Step 4: Set Up Supabase Database

See [Supabase Setup Guide](setup/SUPABASE_SETUP.md) for detailed instructions on:
- Running migrations
- Setting up RLS policies
- Creating storage buckets
- Configuring authentication

Quick version:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Run migrations
supabase db push
```

## Step 5: Start Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:5173**

## Step 6: Create Your First Admin User

1. Sign up at http://localhost:5173/register
2. Go to Supabase Dashboard → **Authentication** → **Users**
3. Find your user and copy the UUID
4. Go to **Table Editor** → **profiles**
5. Find your profile row and update:
   - `role` → `admin`
   - `approved_advertiser` → `true`
6. Refresh the app - you now have admin access!

## Available Commands

```bash
# Development
npm run dev                 # Start dev server (http://localhost:5173)

# Building
npm run build              # Build for production
npm run preview            # Preview production build

# Code Quality
npm run typecheck          # Check TypeScript types
npm run lint               # Run ESLint

# Supabase
npm run types:supabase     # Generate TypeScript types from DB
```

## Folder Structure

```
src/
├── app/              # Application setup (will be created in refactor)
├── components/       # Shared UI components
│   ├── ui/          # Shadcn UI components
│   ├── layout/      # Layout components
│   └── home/        # Homepage components
├── pages/           # Route/page components
├── contexts/        # React contexts (Auth, Language)
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
│   ├── supabase.ts # Supabase client
│   ├── storage.ts  # File upload utilities
│   └── ...
├── types/           # TypeScript type definitions
└── styles/          # CSS files
```

## Common Issues

### Build Errors

If you encounter build errors:

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Supabase Connection Issues

1. Verify your `.env` file has correct credentials
2. Check Supabase project is running (not paused)
3. Ensure you're using the **anon key**, not the service key

### TypeScript Errors

Generate fresh Supabase types:

```bash
npm run types:supabase
```

Make sure `SUPABASE_PROJECT_ID` environment variable is set.

## Next Steps

- [Architecture Overview](ARCHITECTURE.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Email Configuration](setup/EMAIL_CONFIGURATION.md)
- [Facebook Auto-Publishing](features/FACEBOOK_AUTO_PUBLISH_SETUP.md)

## Development Tips

1. **Hot Module Replacement (HMR)**: Vite provides instant updates - no need to refresh
2. **Type Safety**: Run `npm run typecheck` before committing
3. **Linting**: Fix ESLint warnings with `npm run lint`
4. **Database Changes**: Always create migrations for schema changes

## Getting Help

- Check [docs/](.) for feature-specific guides
- Review [archive/](archive/) for historical fixes and troubleshooting
- Check Supabase docs: [https://supabase.com/docs](https://supabase.com/docs)
