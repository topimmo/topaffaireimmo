# Email Configuration Guide - TopAffaireImmo

## Overview

This guide explains how to configure Hostinger SMTP for email delivery in TopAffaireImmo. All authentication and transactional emails will be sent through Hostinger instead of Supabase's default email service.

## Email Addresses

### Main Mailbox
- **contact@topaffaireimmo.com** - Main mailbox where all emails are delivered

### Aliases (Forward to contact@)
All these email addresses are aliases that forward to the main mailbox:
- **info@topaffaireimmo.com** - General information
- **support@topaffaireimmo.com** - Customer support communications
- **noreply@topaffaireimmo.com** - Authentication and system emails

### Usage by Type
- **Authentication emails** (signup, login, password reset): `noreply@topaffaireimmo.com`
- **Support communications**: `support@topaffaireimmo.com`
- **General contact**: `contact@topaffaireimmo.com` or `info@topaffaireimmo.com`

## SMTP Configuration (Hostinger)

### SMTP Settings
```
SMTP Host: smtp.hostinger.com
Port: 465
Encryption: SSL
```

### Email Credentials
⚠️ **IMPORTANT SECURITY NOTE**:
- The SMTP password is **NOT** stored in this repository
- The SMTP password is **NOT** stored in any configuration files
- The SMTP password must be added **manually by the owner** in Supabase Dashboard

## Supabase Dashboard Configuration

### Step 1: Access SMTP Settings

1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Select your TopAffaireImmo project
3. Navigate to: **Settings** → **Auth** → **SMTP Settings**

### Step 2: Enable Custom SMTP

1. Toggle **Enable Custom SMTP** to ON
2. This disables Supabase's default email service

### Step 3: Configure SMTP Server

Enter the following settings:

| Field | Value |
|-------|-------|
| **SMTP Host** | `smtp.hostinger.com` |
| **SMTP Port** | `465` |
| **SMTP User** | `noreply@topaffaireimmo.com` |
| **SMTP Password** | `[Enter your Hostinger email password]` |
| **SMTP Sender Email** | `noreply@topaffaireimmo.com` |
| **SMTP Sender Name** | `TopAffaireImmo` |

### Step 4: Configure Email Settings

1. Go to: **Settings** → **Auth** → **Email**
2. Configure the following:

#### Email Templates Configuration

For each email template type:

**Confirmation Email (Signup)**
- Sender: `noreply@topaffaireimmo.com`
- Subject (FR): `Confirmez votre inscription à TopAffaireImmo`
- Subject (AR): `قم بتأكيد تسجيلك في TopAffaireImmo`

**Password Recovery**
- Sender: `noreply@topaffaireimmo.com`
- Subject (FR): `Réinitialisez votre mot de passe TopAffaireImmo`
- Subject (AR): `إعادة تعيين كلمة المرور TopAffaireImmo`

**Magic Link**
- Sender: `noreply@topaffaireimmo.com`
- Subject (FR): `Votre lien de connexion TopAffaireImmo`
- Subject (AR): `رابط تسجيل الدخول الخاص بك TopAffaireImmo`

**Email Change Confirmation**
- Sender: `noreply@topaffaireimmo.com`
- Subject (FR): `Confirmez votre changement d'email TopAffaireImmo`
- Subject (AR): `قم بتأكيد تغيير البريد الإلكتروني TopAffaireImmo`

### Step 5: Configure URL Settings

1. Go to: **Settings** → **Auth** → **URL Configuration**
2. Set the following:

| Field | Value |
|-------|-------|
| **Site URL** | Your production URL (e.g., `https://topaffaireimmo.com`) |
| **Redirect URLs** | Add: `https://topaffaireimmo.com/*` |

For development/staging, also add:
- `http://localhost:5173/*`
- `https://*.vercel.app/*` (if using Vercel)

### Step 6: Test Email Configuration

1. Go to: **Settings** → **Auth** → **SMTP Settings**
2. Click **"Send Test Email"** button
3. Check your inbox at `contact@topaffaireimmo.com`
4. Verify the email arrives with correct sender information

## Email Templates

### Customizing Templates

1. Navigate to: **Authentication** → **Email Templates**
2. Select the template type (Confirm signup, Reset password, etc.)
3. Customize the HTML template
4. Use the following variables:

| Variable | Description |
|----------|-------------|
| `{{ .ConfirmationURL }}` | Confirmation/action link |
| `{{ .Token }}` | Verification token |
| `{{ .Email }}` | User's email address |
| `{{ .SiteURL }}` | Your site URL |

### Template Best Practices

1. **Include branding**: Use TopAffaireImmo logo and colors
2. **Bilingual support**: Consider adding French and Arabic content
3. **Clear CTAs**: Make action buttons prominent
4. **Mobile responsive**: Ensure templates work on mobile devices
5. **Unsubscribe link**: Add for non-transactional emails (if applicable)

## Verification Checklist

After configuration, verify:

- [ ] SMTP settings saved successfully
- [ ] Test email received at contact@topaffaireimmo.com
- [ ] Email shows sender as "TopAffaireImmo <noreply@topaffaireimmo.com>"
- [ ] Test signup creates confirmation email
- [ ] Password reset emails work
- [ ] Email links redirect to correct URLs
- [ ] All emails appear professional and branded

## Troubleshooting

### Emails Not Sending

1. **Check SMTP credentials**
   - Verify username is `noreply@topaffaireimmo.com`
   - Verify password is correct (from Hostinger)
   - Ensure port is `465` with SSL encryption

2. **Check Hostinger email settings**
   - Verify email account is active in Hostinger panel
   - Check email sending limits haven't been exceeded
   - Ensure email account is not suspended

3. **Check Supabase logs**
   - Go to: **Logs** → **Auth Logs**
   - Look for email sending errors
   - Check error messages for details

### Emails Going to Spam

1. **SPF Record**: Ensure Hostinger's SPF record is configured
2. **DKIM**: Verify DKIM is enabled in Hostinger
3. **Sender Reputation**: Use noreply@ for automated emails
4. **Content**: Avoid spam trigger words in templates

### Wrong Sender Address

1. Verify "Sender Email" in SMTP settings is `noreply@topaffaireimmo.com`
2. Check "Sender Name" is set to `TopAffaireImmo`
3. Clear Supabase cache (if applicable)
4. Send new test email to verify

## Security Best Practices

### DO ✅
- Store SMTP password only in Supabase Dashboard
- Use SSL encryption (port 465)
- Regularly rotate email passwords
- Monitor email logs for suspicious activity
- Use rate limiting for password resets

### DON'T ❌
- Never commit SMTP password to git
- Don't share email credentials in documentation
- Don't use the same password across services
- Don't disable SSL encryption
- Don't expose SMTP settings in client-side code

## Monitoring & Maintenance

### Regular Checks
- Monitor email delivery rates in Hostinger
- Check Supabase Auth Logs weekly
- Verify email templates still render correctly
- Test authentication flows monthly

### Email Limits (Hostinger)
- Check your Hostinger plan's email sending limits
- Monitor usage to avoid hitting limits
- Consider upgrading plan if needed for high volume

## Support Contacts

### Email Issues
- **Hostinger Support**: For SMTP, email delivery, and account issues
- **Supabase Support**: For template configuration and integration issues

### Internal Documentation
- See `supabase/config.toml` for configuration reference
- See `DEPLOYMENT_GUIDE.md` for deployment steps
- See `PLATFORM_DOCUMENTATION.md` for technical details

## FAQ

**Q: Can I use a different email address for different types of emails?**
A: Yes! You can configure different sender addresses for each email template type. For example:
- Signup confirmations: `noreply@topaffaireimmo.com`
- Support responses: `support@topaffaireimmo.com`

**Q: How do I change email templates?**
A: Go to Supabase Dashboard → Authentication → Email Templates → Select template → Edit HTML

**Q: Do I need to configure DNS records?**
A: No. Hostinger already has the domain configured. DNS records (SPF, DKIM) are managed by Hostinger.

**Q: Can I test emails without sending to real users?**
A: Yes! Use the "Send Test Email" feature in Supabase SMTP settings, or create a test account with your own email.

**Q: What if I need to change the SMTP password?**
A: 
1. Change password in Hostinger email panel
2. Update password in Supabase Dashboard → Settings → Auth → SMTP Settings
3. Test email delivery to verify

---

**Last Updated**: January 2026
**Version**: 1.0
