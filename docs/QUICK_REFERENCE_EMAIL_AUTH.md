# Quick Reference: Email Auth Configuration

## 🚨 Problem
Users see: **"Email link is invalid or has expired"**

## ⚡ Quick Fix (5 minutes)

### 1. Supabase Dashboard
```
1. Go to: https://app.supabase.com/
2. Select your project
3. Navigate to: Authentication → URL Configuration
4. Set Site URL: https://www.topaffaireimmo.com
5. Add to Redirect URLs:
   https://www.topaffaireimmo.com/**
   https://www.topaffaireimmo.com/auth/callback
   https://www.topaffaireimmo.com/auth/reset
   https://www.topaffaireimmo.com/reset-password
   http://localhost:5173/**
6. Click Save
```

### 2. Environment Variables
```bash
# .env file
VITE_SITE_URL=https://www.topaffaireimmo.com
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Test
```bash
# 1. Sign up a test user
# 2. Click email confirmation link
# 3. Should work without "invalid/expired" error
```

---

## 📚 Documentation

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [SUPABASE_EMAIL_AUTH_SETUP.md](./SUPABASE_EMAIL_AUTH_SETUP.md) | Complete setup guide | 15 min |
| [AUTH_TESTING_GUIDE.md](./AUTH_TESTING_GUIDE.md) | Testing procedures | 20 min |
| [IMPLEMENTATION_SUMMARY_EMAIL_AUTH_FIX.md](./IMPLEMENTATION_SUMMARY_EMAIL_AUTH_FIX.md) | What was changed | 5 min |

---

## 🔍 Debugging

### Check 1: Supabase Dashboard
```
Authentication → URL Configuration
✅ Site URL matches your domain
✅ Redirect URLs include /auth/callback
✅ Redirect URLs include /reset-password
```

### Check 2: Browser Console
```javascript
// Look for these logs when clicking email link:
🔐 Auth callback triggered
🔑 PKCE flow detected - exchanging code for session
✅ Session created via PKCE code exchange
```

### Check 3: Environment Variables
```bash
# Verify these are set:
echo $VITE_SITE_URL
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

---

## 🎯 Routes

| Route | Purpose | Component |
|-------|---------|-----------|
| `/auth/callback` | Email confirmation & magic links | `AuthCallback.tsx` |
| `/auth/reset` | Password reset (NEW alias) | `ResetPassword.tsx` |
| `/reset-password` | Password reset (original) | `ResetPassword.tsx` |

Both `/auth/reset` and `/reset-password` work identically.

---

## 🔐 Supabase Redirect URLs Checklist

**Production:**
- [ ] `https://www.topaffaireimmo.com/**`
- [ ] `https://www.topaffaireimmo.com/auth/callback`
- [ ] `https://www.topaffaireimmo.com/auth/reset`
- [ ] `https://www.topaffaireimmo.com/reset-password`

**Development:**
- [ ] `http://localhost:5173/**`
- [ ] `http://localhost:5173/auth/callback`
- [ ] `http://localhost:5173/auth/reset`

**Vercel (if applicable):**
- [ ] `https://*.vercel.app/**`

---

## ⚠️ Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid or expired" | Redirect URLs not configured | Add URLs in Supabase Dashboard |
| "No session" | Wrong browser/incognito | Use same browser as signup |
| "OTP expired" | Link >1 hour old | Request new link |
| Blank page | JavaScript error | Check browser console |

---

## 📱 In-App Browser Issues

**Affected:** Gmail app, Facebook app, Instagram app

**Solution:** App shows warning + "Copy Link" button

**User Action:** Open link in Chrome/Safari instead

---

## 🧪 Quick Test

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Test auth flow
# 1. Open: http://localhost:5173/register
# 2. Sign up with test email
# 3. Check Supabase Dashboard → Auth → Users
# 4. Copy confirmation URL from user details
# 5. Paste URL in browser
# 6. Should redirect to /auth/callback → home page
```

---

## 🆘 Support

**Documentation:**
- Setup Guide: `docs/SUPABASE_EMAIL_AUTH_SETUP.md`
- Testing Guide: `docs/AUTH_TESTING_GUIDE.md`

**Supabase Resources:**
- [Auth Documentation](https://supabase.com/docs/guides/auth)
- [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [PKCE Flow](https://supabase.com/docs/guides/auth/server-side/pkce-flow)

**Debugging:**
1. Check browser console (look for 🔐, 🔑, ✅, ❌)
2. Check Supabase Dashboard → Logs → Auth
3. Verify environment variables
4. Test in incognito mode

---

**Last Updated:** February 2026
