# TopAffaireImmo - Morocco Real Estate Platform

**A comprehensive real estate listing platform for Morocco, built with React, TypeScript, and Supabase.**

---

## 🚨 IMPORTANT: Start Here

### For Repository Owners & Developers

**📖 READ THIS FIRST:** [DIAGNOSTIC_EXECUTIVE_SUMMARY.md](./DIAGNOSTIC_EXECUTIVE_SUMMARY.md)

This file contains:
- ✅ Complete overview of the application
- ⚠️ Critical security actions required
- 📋 Deployment checklist
- 🔧 Configuration guides
- 🧪 Testing procedures

### Critical Actions Required Before Production

1. **Security:** Rotate Supabase anonymous key (see [SECURITY_NOTICE_CREDENTIALS.md](./SECURITY_NOTICE_CREDENTIALS.md))
2. **Configuration:** Verify Supabase setup (see [SUPABASE_VERIFICATION_CHECKLIST.md](./SUPABASE_VERIFICATION_CHECKLIST.md))
3. **Deployment:** Set Vercel environment variables (see [VERCEL_ENV_VARS_CHECKLIST.md](./VERCEL_ENV_VARS_CHECKLIST.md))
4. **Testing:** Run end-to-end tests (see [END_TO_END_TESTING_GUIDE.md](./END_TO_END_TESTING_GUIDE.md))
5. **Launch:** Complete deployment checklist (see [PRODUCTION_DEPLOYMENT_READINESS.md](./PRODUCTION_DEPLOYMENT_READINESS.md))

---

## 📚 Documentation Index

### Essential Guides (Start Here)
1. **[DIAGNOSTIC_EXECUTIVE_SUMMARY.md](./DIAGNOSTIC_EXECUTIVE_SUMMARY.md)** - Complete project overview
2. **[SECURITY_NOTICE_CREDENTIALS.md](./SECURITY_NOTICE_CREDENTIALS.md)** - Critical security actions
3. **[PRODUCTION_DEPLOYMENT_READINESS.md](./PRODUCTION_DEPLOYMENT_READINESS.md)** - Pre-launch checklist

### Configuration & Setup
4. **[SUPABASE_VERIFICATION_CHECKLIST.md](./SUPABASE_VERIFICATION_CHECKLIST.md)** - Supabase configuration
5. **[VERCEL_ENV_VARS_CHECKLIST.md](./VERCEL_ENV_VARS_CHECKLIST.md)** - Environment variables

### Testing & Quality
6. **[END_TO_END_TESTING_GUIDE.md](./END_TO_END_TESTING_GUIDE.md)** - Manual testing procedures

### Legacy Documentation
- `DEPLOYMENT_GUIDE.md` - Previous deployment guide
- `SUPABASE_CONFIGURATION.md` - Previous Supabase docs
- Other `*.md` files in root - Historical reference

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or 20.x
- npm or yarn
- Supabase account
- Vercel account

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/topimmo/topaffaireimmo.git
   cd topaffaireimmo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your Supabase credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   ```
   http://localhost:5173
   ```

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

---

## 🏗️ Tech Stack

### Frontend
- **React 18.2** - UI library
- **TypeScript 5.8** - Type safety
- **Vite 7.1** - Build tool & dev server
- **Tailwind CSS 3.4** - Styling
- **React Router 6.23** - Routing
- **Radix UI** - Accessible components
- **React Hook Form + Zod** - Form validation

### Backend
- **Supabase** - PostgreSQL database, authentication, storage
- **Row Level Security (RLS)** - Database security
- **Edge Functions** - Serverless functions
- **Supabase Storage** - Image uploads

### Deployment
- **Vercel** - Hosting & deployment
- **Vercel Edge Network** - CDN

---

## 📁 Project Structure

```
topaffaireimmo/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── home/       # Home page components
│   │   ├── layout/     # Layout components (Header, Footer)
│   │   └── ui/         # Shadcn UI components
│   ├── contexts/       # React contexts (Auth, Language)
│   ├── lib/            # Utilities (Supabase client, storage)
│   ├── pages/          # Page components
│   └── App.tsx         # Main app component
├── supabase/
│   ├── migrations/     # Database migrations (SQL only)
│   ├── functions/      # Edge functions
│   └── templates/      # Email templates
├── public/             # Static assets
├── scripts/            # Build scripts (sitemap generation)
└── docs/              # Additional documentation
```

---

## 🔒 Security

### Current Status
- ✅ CodeQL scan: 0 security alerts
- ✅ npm audit: 0 vulnerabilities
- ⚠️ Action required: Rotate Supabase anon key (see [SECURITY_NOTICE_CREDENTIALS.md](./SECURITY_NOTICE_CREDENTIALS.md))

### Security Best Practices
- Environment variables stored in Vercel only
- No secrets committed to repository
- RLS enabled on all database tables
- Protected routes require authentication
- Input validation on all forms
- XSS protection with DOMPurify
- HTTPS enforced

---

## 🧪 Testing

### Manual Testing
Follow [END_TO_END_TESTING_GUIDE.md](./END_TO_END_TESTING_GUIDE.md) for comprehensive testing procedures.

### Test Suites
1. User Registration & Profile Creation
2. Authentication & Session Persistence
3. Property Listing Creation
4. Admin Panel Access
5. Error Handling & Edge Cases
6. Console Error Monitoring

---

## 🌍 Deployment

### Vercel Deployment

1. **Set environment variables** (see [VERCEL_ENV_VARS_CHECKLIST.md](./VERCEL_ENV_VARS_CHECKLIST.md))
2. **Connect repository** to Vercel
3. **Configure build settings:**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Framework: Vite
4. **Deploy** and verify

### Supabase Setup

1. **Apply migrations** from `supabase/migrations/`
2. **Configure authentication** (see [SUPABASE_VERIFICATION_CHECKLIST.md](./SUPABASE_VERIFICATION_CHECKLIST.md))
3. **Set up storage buckets**
4. **Configure email SMTP**
5. **Verify RLS policies**

---

## 👥 User Roles

### Real Estate Advertiser
- Create property listings
- Upload images
- Manage own listings
- View dashboard

### Commercial Advertiser
- Create banner advertisements
- Manage advertising campaigns
- View commercial dashboard

### Admin
- Manage all listings
- Approve/reject listings
- Manage users
- Access admin panel

---

## 📊 Features

### For Users
- ✅ Browse property listings
- ✅ Search by city, price, type
- ✅ View property details
- ✅ Contact advertisers
- ✅ Bilingual interface (French/Arabic)
- ✅ SEO-optimized pages

### For Advertisers
- ✅ Create property listings
- ✅ Upload up to 6 images per listing
- ✅ Edit/delete own listings
- ✅ Dashboard with statistics
- ✅ Profile management

### For Admins
- ✅ Approve/reject listings
- ✅ Manage users
- ✅ View analytics
- ✅ Content moderation

---

## 🔧 Environment Variables

Required environment variables (set in Vercel Dashboard):

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Production Domain
VITE_PRODUCTION_DOMAIN=https://topaffaireimmo.vercel.app

# Optional: Facebook Auto-Posting
MAKE_WEBHOOK_URL=https://hook.eu1.make.com/xxxxx
```

**See:** [VERCEL_ENV_VARS_CHECKLIST.md](./VERCEL_ENV_VARS_CHECKLIST.md) for detailed setup.

---

## 📝 Scripts

```bash
# Development
npm run dev              # Start dev server (localhost:5173)

# Build
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run typecheck        # Run TypeScript type checking
npm run lint             # Run ESLint

# Utilities
npm run generate:sitemaps  # Generate SEO sitemaps
```

---

## 🐛 Troubleshooting

### Build Errors
- Ensure Node.js 18.x or 20.x is installed
- Run `npm install` to install dependencies
- Check for TypeScript errors with `npm run typecheck`

### Environment Variable Issues
- Verify variables are set in Vercel Dashboard
- Check browser console for configuration logs
- See [VERCEL_ENV_VARS_CHECKLIST.md](./VERCEL_ENV_VARS_CHECKLIST.md)

### Authentication Issues
- Check Supabase redirect URLs
- Verify environment variables are correct
- See [SUPABASE_VERIFICATION_CHECKLIST.md](./SUPABASE_VERIFICATION_CHECKLIST.md)

---

## 📞 Support

### Documentation
- All documentation in repository root directory
- Start with [DIAGNOSTIC_EXECUTIVE_SUMMARY.md](./DIAGNOSTIC_EXECUTIVE_SUMMARY.md)

### Supabase Project
- Dashboard: https://app.supabase.com/project/ghzdehknuzrtmfrimzdw
- Project ID: `ghzdehknuzrtmfrimzdw`

### Vercel Project
- Dashboard: https://vercel.com/dashboard

---

## 📜 License

[Add your license here]

---

## 👏 Credits

Built with ❤️ using:
- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vitejs.dev)
- [Supabase](https://supabase.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Vercel](https://vercel.com)

---

## 🎯 Production Readiness

**Current Status:**
- ✅ Code: All fixes implemented
- ✅ Build: Succeeds without errors
- ✅ Security: CodeQL passed, 0 vulnerabilities
- ⚠️ Configuration: Manual verification required
- ⚠️ Testing: End-to-end testing required

**Before going to production:**
1. Complete [PRODUCTION_DEPLOYMENT_READINESS.md](./PRODUCTION_DEPLOYMENT_READINESS.md)
2. Rotate Supabase anon key per [SECURITY_NOTICE_CREDENTIALS.md](./SECURITY_NOTICE_CREDENTIALS.md)
3. Verify Supabase per [SUPABASE_VERIFICATION_CHECKLIST.md](./SUPABASE_VERIFICATION_CHECKLIST.md)
4. Set Vercel env vars per [VERCEL_ENV_VARS_CHECKLIST.md](./VERCEL_ENV_VARS_CHECKLIST.md)
5. Run tests per [END_TO_END_TESTING_GUIDE.md](./END_TO_END_TESTING_GUIDE.md)

---

**🚀 Ready to Launch? Follow the guides above and let's go live!**
