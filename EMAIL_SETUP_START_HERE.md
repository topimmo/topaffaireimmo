# 📧 Email Configuration - START HERE

## ⚠️ IMPORTANT: Email Setup Required

Your TopAffaireImmo application is configured to send authentication emails (signup confirmations, password resets, etc.) using **Hostinger SMTP** instead of Supabase's default email service.

**This configuration is required for the app to work properly in production.**

---

## 🎯 What You Need to Do

### Option 1: Quick Setup (5 minutes) - RECOMMENDED

Follow this guide: **`/docs/QUICK_EMAIL_SETUP.md`**

This is a streamlined, step-by-step guide that will have you up and running in 5 minutes.

### Option 2: Detailed Setup (10-15 minutes)

Follow this guide: **`/docs/EMAIL_CONFIGURATION.md`**

This is a comprehensive guide with troubleshooting, FAQs, and advanced options.

---

## 📋 Quick Summary

### What's Already Done ✅
- ✅ Email addresses configured on Hostinger (contact@, noreply@, support@, info@)
- ✅ Email aliases set up and forwarding to main mailbox
- ✅ Professional HTML email templates created
- ✅ Documentation written and ready
- ✅ Configuration files prepared

### What You Need to Do 🔧
- [ ] Add SMTP password in Supabase Dashboard (Step 3 in QUICK_EMAIL_SETUP.md)
- [ ] Test email delivery (Step 4 in QUICK_EMAIL_SETUP.md)
- [ ] Configure Site URL (Step 5 in QUICK_EMAIL_SETUP.md)
- [ ] (Optional) Upload custom email templates (Step 6 in QUICK_EMAIL_SETUP.md)

**⏱️ Time Required**: 5-10 minutes

---

## 🔐 Security Note

**The SMTP password is NOT included in this repository.**

You must add it manually in the Supabase Dashboard:
1. Go to Supabase Dashboard → Settings → Auth → SMTP Settings
2. Enter your Hostinger SMTP password
3. This is the password for `contact@topaffaireimmo.com` from Hostinger

---

## 📧 Email Addresses Used

| Address | Purpose |
|---------|---------|
| `noreply@topaffaireimmo.com` | Authentication emails (signup, password reset) |
| `support@topaffaireimmo.com` | Customer support emails |
| `contact@topaffaireimmo.com` | Main mailbox (receives all) |
| `info@topaffaireimmo.com` | General inquiries |

**Note**: All aliases forward to `contact@topaffaireimmo.com`

---

## 🚀 Quick Access Links

### For Setup
- **5-Minute Guide**: `/docs/QUICK_EMAIL_SETUP.md`
- **Detailed Guide**: `/docs/EMAIL_CONFIGURATION.md`
- **Email Templates**: `/supabase/templates/`

### For Reference
- **Summary**: `/docs/EMAIL_SETUP_SUMMARY.md`
- **Deployment Guide**: `/DEPLOYMENT_GUIDE.md`
- **Checklist**: `/DEPLOYMENT_CHECKLIST.md`

---

## 🆘 Need Help?

### Common Issues
1. **Test email not received**: Check spam folder, verify password
2. **Wrong sender address**: Verify SMTP settings in Supabase
3. **Password error**: Reset password in Hostinger panel

See `/docs/EMAIL_CONFIGURATION.md` → Troubleshooting section for solutions.

---

## ✅ Verification

After setup, you should be able to:
- ✅ Send test email from Supabase
- ✅ Receive emails at `contact@topaffaireimmo.com`
- ✅ See sender as "TopAffaireImmo <noreply@topaffaireimmo.com>"
- ✅ Test signup flow creates confirmation email
- ✅ Test password reset sends recovery email

---

## 📊 What This Achieves

✅ **Professional emails** from your domain (topaffaireimmo.com)  
✅ **Better deliverability** vs. default Supabase sender  
✅ **Branded templates** with your colors and logo  
✅ **No code changes** needed - just dashboard configuration  
✅ **Secure setup** - password not in repository  

---

## 🎯 Next Steps

1. **NOW**: Follow `/docs/QUICK_EMAIL_SETUP.md` (5 minutes)
2. **After setup**: Test email delivery
3. **Optional**: Customize email templates (see `/supabase/templates/README.md`)
4. **Before launch**: Complete `/DEPLOYMENT_CHECKLIST.md`

---

**Ready to start?** → Open `/docs/QUICK_EMAIL_SETUP.md`

**Last Updated**: January 2026
