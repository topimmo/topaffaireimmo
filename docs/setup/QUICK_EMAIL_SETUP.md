# Quick Email Setup Guide - TopAffaireImmo

## For the Owner: 5-Minute Email Configuration

This is a streamlined guide to configure Hostinger SMTP in Supabase. Follow these exact steps.

---

## ✅ Prerequisites

- [x] Hostinger email account already set up: `contact@topaffaireimmo.com`
- [x] Email aliases configured: `noreply@`, `support@`, `info@`
- [x] You have the SMTP password from Hostinger panel
- [x] You have access to Supabase Dashboard

---

## 📧 Step 1: Get Your SMTP Password

1. Log in to [Hostinger Panel](https://hpanel.hostinger.com)
2. Go to **Email** → **Email Accounts**
3. Find `contact@topaffaireimmo.com`
4. Copy the SMTP password (or reset if needed)
5. **Keep this password handy** - you'll need it in Step 3

---

## 🔧 Step 2: Access Supabase SMTP Settings

1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Select your **TopAffaireImmo** project
3. Click **Settings** (gear icon in left sidebar)
4. Click **Auth** 
5. Scroll down to **SMTP Settings** section
6. Toggle **Enable Custom SMTP** to **ON**

---

## ⚙️ Step 3: Enter SMTP Configuration

Fill in these exact values:

| Field | Value |
|-------|-------|
| **SMTP Host** | `smtp.hostinger.com` |
| **SMTP Port** | `465` |
| **SMTP User** | `noreply@topaffaireimmo.com` |
| **SMTP Password** | `[Paste your password from Step 1]` |
| **SMTP Sender Email** | `noreply@topaffaireimmo.com` |
| **SMTP Sender Name** | `TopAffaireImmo` |

Click **Save**

---

## ✉️ Step 4: Test Email Delivery

1. Still in SMTP Settings, click **Send Test Email**
2. Check your `contact@topaffaireimmo.com` inbox
3. You should receive a test email from `noreply@topaffaireimmo.com`
4. ✅ If received = Success! Move to Step 5
5. ❌ If not received = Double-check password and try again

---

## 🌐 Step 5: Configure Site URL

1. In Supabase Dashboard, go to **Settings** → **Auth**
2. Scroll to **URL Configuration** section
3. Set **Site URL** to your production URL:
   - Example: `https://topaffaireimmo.com`
4. Add **Redirect URLs**:
   - Add: `https://topaffaireimmo.com/*`
   - Add: `http://localhost:5173/*` (for development)
5. Click **Save**

---

## 📝 Step 6: Customize Email Templates (Optional but Recommended)

1. In Supabase Dashboard, go to **Authentication** → **Email Templates**
2. Select **Confirm signup** template
3. Copy the HTML from: `/supabase/templates/confirmation.html` in this repository
4. Paste it into the template editor
5. Click **Save**
6. Repeat for other templates:
   - **Recover password** → Use `recovery.html`
   - **Magic Link** → Use `magic_link.html`
   - **Email Change** → Use `email_change.html`
   - **Invite** → Use `invite.html`

---

## ✅ Verification Checklist

After configuration, verify:

- [ ] Test email received successfully
- [ ] Email shows sender as "TopAffaireImmo <noreply@topaffaireimmo.com>"
- [ ] Site URL is set correctly
- [ ] Redirect URLs include your domain
- [ ] Email templates updated (optional but recommended)

---

## 🎯 What This Achieves

✅ **All system emails** (signup, password reset, etc.) are sent from `noreply@topaffaireimmo.com`

✅ **Professional branding** - Emails appear from your domain, not Supabase

✅ **All aliases work** - noreply@, support@, info@ all forward to contact@

✅ **No code changes needed** - Everything configured in Supabase Dashboard

---

## 🆘 Troubleshooting

### Problem: Test email not received

**Solutions:**
1. Check spam folder in `contact@topaffaireimmo.com`
2. Verify SMTP password is correct
3. Ensure port is `465` (not 587)
4. Verify email account is active in Hostinger panel

### Problem: Wrong sender address in emails

**Solutions:**
1. Ensure "SMTP Sender Email" is `noreply@topaffaireimmo.com`
2. Ensure "SMTP User" is `noreply@topaffaireimmo.com`
3. Click Save again to apply changes

### Problem: Password authentication failed

**Solutions:**
1. Log into Hostinger panel
2. Reset SMTP password for `contact@topaffaireimmo.com`
3. Update password in Supabase SMTP settings
4. Test again

---

## 📚 Additional Resources

- **Complete guide**: `/docs/EMAIL_CONFIGURATION.md`
- **Email templates**: `/supabase/templates/`
- **Deployment guide**: `/DEPLOYMENT_GUIDE.md`
- **Supabase docs**: https://supabase.com/docs/guides/auth/auth-smtp

---

## 🔐 Security Reminders

✅ **DO:**
- Keep SMTP password secure
- Only add password in Supabase Dashboard
- Use SSL encryption (port 465)

❌ **DON'T:**
- Never commit SMTP password to git
- Don't share password in documentation
- Don't use plain text (port 25 or 587 without SSL)

---

## 📞 Need Help?

- **Email issues**: Contact Hostinger support
- **Supabase issues**: Contact Supabase support
- **Template issues**: Check `/supabase/templates/README.md`

---

**Estimated Time**: 5-10 minutes

**Difficulty**: Easy ✅

**Last Updated**: January 2026
