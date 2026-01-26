# 🚀 Quick Start Guide - TopAffaireImmo

> **Last Updated:** 2026-01-24  
> **Status:** ✅ Production Ready (pending Supabase setup)  
> **Security:** ✅ 0 vulnerabilities | CodeQL: 0 alerts

---

## ⚡ 5-Minute Setup

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Configure Environment
Create `.env` file:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3️⃣ Build & Run
```bash
# Development
npm run dev

# Production build
npm run build
npm run preview
```

---

## 📚 Full Documentation

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** | Step-by-step deployment guide | Setting up Supabase + Vercel |
| **[SECURITY_AUDIT.md](./SECURITY_AUDIT.md)** | Complete security assessment | Security review or compliance |
| **[AUDIT_COMPLETE.md](./AUDIT_COMPLETE.md)** | Final audit summary | Project status overview |
| **[README.md](./README.md)** | Project overview | Understanding the project |

---

## 🔐 Recent Security Improvements

✅ **Fixed 9 npm vulnerabilities** → 0 vulnerabilities  
✅ **Added XSS protection** with DOMPurify  
✅ **Centralized error handling** with bilingual messages  
✅ **Enhanced auth logging** for easier debugging  
✅ **CodeQL scan passed** with 0 alerts

---

## 🐛 Common Issues

### Issue: "Erreur de base de données lors de l'enregistrement"

**Solution:** Apply migration `035_fix_signup_rls_policy.sql`

```sql
-- Run in Supabase SQL Editor
-- See: supabase/migrations/035_fix_signup_rls_policy.sql
```

### Issue: User not appearing in database after signup

**Check:**
1. Supabase Logs → Postgres Logs for errors
2. Verify trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
3. Check RLS policies on profiles table

### Issue: Build fails on Vercel

**Solution:**
1. Verify environment variables are set in Vercel
2. Check build command is `npm run build`
3. Verify output directory is `dist`

---

## 🧪 Quick Test

```bash
# Install dependencies
npm install

# Build (should succeed)
npm run build

# Check security (should show 0 vulnerabilities)
npm audit
```

**Expected:**
```
✓ built in ~4s
found 0 vulnerabilities
```

---

## 📊 Project Status

| Feature | Status |
|---------|--------|
| Build | ✅ Passing |
| Security | ✅ 0 vulnerabilities |
| Authentication | ✅ Enhanced |
| Database | ✅ Verified |
| Documentation | ✅ Complete |
| Deployment Ready | ⏳ Needs env vars |

---

## 🆘 Need Help?

1. **Deployment Issues:** See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
2. **Security Questions:** See [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)
3. **Project Status:** See [AUDIT_COMPLETE.md](./AUDIT_COMPLETE.md)

---

## 🔗 Quick Links

- **Supabase Dashboard:** https://app.supabase.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **DOMPurify Docs:** https://github.com/cure53/DOMPurify

---

## 📝 Development Workflow

```bash
# 1. Start development server
npm run dev

# 2. Make changes

# 3. Build to verify
npm run build

# 4. Check security
npm audit

# 5. Commit changes
git add .
git commit -m "Your message"
git push
```

---

**Built with:** React + TypeScript + Vite + Supabase + Tailwind CSS  
**Deployed on:** Vercel  
**Security:** DOMPurify | CodeQL | npm audit

---

✨ **Ready to deploy!** Follow [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for detailed instructions.
