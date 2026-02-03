# Diagnostic Plan Quick Start Guide

## 📖 Overview

This project now includes a comprehensive **Production Deployment Diagnostic Plan** in the file:
**`PRODUCTION_DEPLOYMENT_DIAGNOSTIC_PLAN.md`**

## 🎯 What's Included

The diagnostic plan provides **everything you need** for production readiness validation:

### 1. **Production Readiness Checklist** ✅
   - 30+ checkboxes organized by phase
   - Go/No-Go decision criteria
   - Covers: Local Dev, Supabase, Vercel, SEO, Security

### 2. **Local Development Commands** 🛠️
   ```bash
   npm install          # Install dependencies
   npm run typecheck    # TypeScript validation
   npm run lint        # Code quality check
   npm run build       # Production build
   npm run preview     # Test production build
   ```

### 3. **Supabase Verification** 🗄️
   - **16 copy-paste ready SQL queries** to verify:
     - Properties table schema (status, approved_at/by, rejected_at/by, rejection_reason)
     - Database indexes for performance
     - Admin users in `public.admins`
     - RLS policies for security
     - Audit logging in `admin_audit_logs`
     - Complete health check

### 4. **Vercel Deployment** 🚀
   - Environment variables checklist
   - SPA routing configuration
   - Build/runtime logs analysis
   - Common deployment issues and fixes

### 5. **SEO Optimization** 🔍
   - Meta tags verification (title, description, OG, Twitter)
   - Canonical URLs and sitemaps
   - Noindex for admin routes
   - Core Web Vitals optimization guide
   - Performance improvements (images, lazy loading, bundle size)

### 6. **Security & Observability** 🔒
   - RLS best practices
   - Frontend security (no secrets in client code)
   - CORS configuration
   - Error tracking setup (Sentry)
   - Security headers verification

### 7. **Common Pitfalls** ⚠️
   Seven detailed scenarios specific to **Supabase + Admin + RLS**:
   1. Admin actions fail silently
   2. Audit logs not created
   3. Profile foreign key issues
   4. Status workflow violations
   5. Vercel preview SEO pollution
   6. Build works locally, fails on Vercel
   7. Admin dashboard shows "Not Authorized"

   Each pitfall includes:
   - Symptoms
   - Root cause analysis
   - Debug steps with SQL queries
   - Step-by-step fixes

## 🚦 Quick Start

### For Pre-Deployment Validation:
1. Open `PRODUCTION_DEPLOYMENT_DIAGNOSTIC_PLAN.md`
2. Go to: **"Production Readiness Checklist (Go/No-Go)"**
3. Work through each phase systematically
4. Only proceed to deployment when all checkboxes are ✅

### For Troubleshooting Issues:
1. Identify the issue category (Supabase, Vercel, SEO, Security)
2. Check the relevant section in the diagnostic plan
3. Run the provided SQL queries or commands
4. Follow the debugging steps
5. If issue matches a common pitfall, jump to that section

### For Onboarding New Developers:
1. Share `PRODUCTION_DEPLOYMENT_DIAGNOSTIC_PLAN.md`
2. Have them work through the **"Commands Section"** first
3. Review the **"Supabase SQL Verification"** section together
4. Explain the **"Common Pitfalls"** section to prevent future issues

## 📂 File Structure

```
topaffaireimmo/
├── PRODUCTION_DEPLOYMENT_DIAGNOSTIC_PLAN.md    # Main diagnostic document (1,579 lines)
├── DIAGNOSTIC_PLAN_QUICK_START.md              # This file
├── supabase/migrations/                         # Database migrations
│   ├── 050_create_admins_table_and_rls.sql
│   ├── 053_create_admin_audit_logs.sql
│   └── 064_add_rejected_fields.sql
├── vercel.json                                  # Vercel configuration
├── .env.example                                 # Environment variables template
└── package.json                                 # Project dependencies
```

## 🔗 Quick Links to Sections

| Section | Purpose | Line # |
|---------|---------|--------|
| Production Checklist | Go/No-Go validation | ~28 |
| Commands | Local development setup | ~78 |
| Supabase SQL | Database verification | ~192 |
| Vercel | Deployment validation | ~567 |
| SEO | Search engine optimization | ~758 |
| Security | Security best practices | ~984 |
| Common Pitfalls | Troubleshooting guide | ~1178 |
| Quick Reference | Command cheatsheet | ~1488 |
| Final Checklist | Pre-launch validation | ~1536 |

## 💡 Pro Tips

1. **Bookmark the diagnostic plan** - You'll reference it often during deployments
2. **Run SQL queries early** - Catch database issues before they reach production
3. **Check RLS policies regularly** - Security is critical for admin functionality
4. **Test in Vercel preview** - Always validate in production-like environment
5. **Monitor audit logs** - Ensure all admin actions are tracked
6. **Optimize Core Web Vitals** - Good performance = better SEO rankings

## 🆘 Getting Help

If you encounter issues not covered in the diagnostic plan:

1. **Check existing documentation:**
   - `SUPABASE_DIAGNOSTIC_REPORT.md`
   - `ADMIN_SYSTEM_GUIDE.md`
   - `DEPLOYMENT_VERIFICATION.md`

2. **Review migration files:**
   - All SQL schema is in `supabase/migrations/`
   - Check migration comments for context

3. **Inspect RLS policies:**
   - Run the RLS verification queries
   - Test policies directly in Supabase SQL Editor

4. **Check Vercel logs:**
   - Deployment logs for build issues
   - Function logs for runtime errors

## ✅ Success Criteria

Your deployment is ready when:
- [ ] All 30+ checklist items are complete
- [ ] SQL health check query returns expected results
- [ ] Build succeeds both locally and on Vercel
- [ ] Admin users can approve/reject listings
- [ ] Audit logs capture all admin actions
- [ ] SEO meta tags are correct
- [ ] Core Web Vitals meet targets (LCP < 2.5s)
- [ ] No security vulnerabilities
- [ ] Admin routes have noindex
- [ ] All environment variables set

## 📊 Metrics to Monitor Post-Deployment

After going live, track these metrics:

| Metric | Target | How to Check |
|--------|--------|--------------|
| Build Success Rate | 100% | Vercel dashboard |
| RLS Policy Violations | 0 | Supabase logs |
| Audit Log Coverage | 100% of admin actions | Run audit log query |
| Page Load Time (LCP) | < 2.5s | Lighthouse, PageSpeed Insights |
| SEO Score | > 95 | Lighthouse |
| Admin Action Success Rate | 100% | Audit logs + user reports |

## 🎓 Learning Resources

To better understand the stack:

- **React + Vite:** https://vitejs.dev/guide/
- **Supabase RLS:** https://supabase.com/docs/guides/auth/row-level-security
- **Vercel Deployment:** https://vercel.com/docs/deployments/overview
- **Core Web Vitals:** https://web.dev/vitals/
- **SEO Best Practices:** https://developers.google.com/search/docs/fundamentals/seo-starter-guide

---

**Need more details?** See `PRODUCTION_DEPLOYMENT_DIAGNOSTIC_PLAN.md`

**Document Version:** 1.0  
**Last Updated:** 2026-02-03
