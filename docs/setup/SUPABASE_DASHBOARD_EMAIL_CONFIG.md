# Supabase Dashboard Email Configuration Guide

## 📧 Configure Auth Emails with TopAffaireImmo Branding

This guide shows you how to configure authentication emails in the Supabase Dashboard to:
- ✅ Send emails with **TopAffaireImmo** as the sender name
- ✅ Brand all email templates with your site name
- ✅ Enable password reset functionality
- ✅ Improve email deliverability

---

## 🎯 Quick Setup Checklist

- [ ] Configure Site URL and Redirect URLs
- [ ] Set sender name to TopAffaireImmo
- [ ] Update email templates with branding
- [ ] (Optional) Configure custom SMTP for better deliverability

---

## 1️⃣ Configure Site URL and Redirect URLs

### Go to: **Supabase Dashboard → Authentication → URL Configuration**

### Site URL
Set this to your production domain:
```
https://topaffaireimmo.com
```

### Redirect URLs
Add these patterns (one per line):
```
https://topaffaireimmo.com/**
https://*.vercel.app/**
http://localhost:3000/**
```

**Why?** 
- Site URL is used as the default redirect after email confirmation
- Redirect URLs whitelist where users can be redirected after auth actions
- Wildcards allow preview deployments and local development

---

## 2️⃣ Configure Email Sender Name

### Go to: **Supabase Dashboard → Project Settings → Authentication**

Look for **Auth Email Settings** or **Email Configuration**.

### Set Sender Name:
```
TopAffaireImmo
```

### Set From Email (if using custom SMTP):
```
no-reply@topaffaireimmo.com
```

**Note:** Without custom SMTP, emails will be sent from Supabase's default sender but with your custom name.

---

## 3️⃣ Update Email Templates

### Go to: **Supabase Dashboard → Authentication → Email Templates**

You'll find these templates:
- **Confirm signup** - sent when a new user registers
- **Magic Link** - sent for passwordless login
- **Change Email Address** - sent when user changes email
- **Reset Password** - sent when user requests password reset

---

### Template: Reset Password (Most Important!)

**Subject:**
```
Réinitialiser votre mot de passe – TopAffaireImmo
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
    .content { background: #f8fafc; padding: 30px; }
    .button { 
      display: inline-block; 
      background: #1e40af; 
      color: white; 
      padding: 12px 30px; 
      text-decoration: none; 
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TopAffaireImmo</h1>
    </div>
    <div class="content">
      <h2>Réinitialisation de votre mot de passe</h2>
      <p>Bonjour,</p>
      <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte TopAffaireImmo.</p>
      <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
      <a href="{{ .ConfirmationURL }}" class="button">Réinitialiser mon mot de passe</a>
      <p><small>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.</small></p>
      <p><small>Ce lien est valable pendant 24 heures.</small></p>
    </div>
    <div class="footer">
      <p>© 2024 TopAffaireImmo - Votre plateforme immobilière au Maroc</p>
      <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>
```

---

### Template: Confirm Signup

**Subject:**
```
Confirmez votre compte TopAffaireImmo
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
    .content { background: #f8fafc; padding: 30px; }
    .button { 
      display: inline-block; 
      background: #1e40af; 
      color: white; 
      padding: 12px 30px; 
      text-decoration: none; 
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TopAffaireImmo</h1>
      <p>Bienvenue !</p>
    </div>
    <div class="content">
      <h2>Confirmez votre adresse email</h2>
      <p>Bonjour,</p>
      <p>Merci de vous être inscrit sur TopAffaireImmo, votre plateforme immobilière au Maroc.</p>
      <p>Pour activer votre compte, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :</p>
      <a href="{{ .ConfirmationURL }}" class="button">Confirmer mon email</a>
      <p><small>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email en toute sécurité.</small></p>
    </div>
    <div class="footer">
      <p>© 2024 TopAffaireImmo - Votre plateforme immobilière au Maroc</p>
      <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>
```

---

### Template: Magic Link

**Subject:**
```
Votre lien de connexion – TopAffaireImmo
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
    .content { background: #f8fafc; padding: 30px; }
    .button { 
      display: inline-block; 
      background: #1e40af; 
      color: white; 
      padding: 12px 30px; 
      text-decoration: none; 
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TopAffaireImmo</h1>
    </div>
    <div class="content">
      <h2>Connexion à votre compte</h2>
      <p>Bonjour,</p>
      <p>Cliquez sur le bouton ci-dessous pour vous connecter à votre compte TopAffaireImmo :</p>
      <a href="{{ .ConfirmationURL }}" class="button">Se connecter</a>
      <p><small>Si vous n'avez pas demandé cette connexion, vous pouvez ignorer cet email en toute sécurité.</small></p>
      <p><small>Ce lien est valable pendant 1 heure.</small></p>
    </div>
    <div class="footer">
      <p>© 2024 TopAffaireImmo - Votre plateforme immobilière au Maroc</p>
      <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>
```

---

## 4️⃣ (Optional) Configure Custom SMTP

For better email deliverability and custom from addresses, configure custom SMTP.

### Recommended Providers:
- **Resend** (modern, developer-friendly) - https://resend.com
- **SendGrid** (reliable, popular) - https://sendgrid.com
- **Mailgun** (flexible) - https://mailgun.com

### Go to: **Supabase Dashboard → Project Settings → Authentication → SMTP Settings**

### Example Configuration (Resend):
```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP Username: resend
SMTP Password: [Your Resend API Key]
Sender Email: no-reply@topaffaireimmo.com
Sender Name: TopAffaireImmo
Enable TLS: Yes
```

### Example Configuration (SendGrid):
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP Username: apikey
SMTP Password: [Your SendGrid API Key]
Sender Email: no-reply@topaffaireimmo.com
Sender Name: TopAffaireImmo
Enable TLS: Yes
```

**Important:** You must verify your domain with the SMTP provider before sending emails.

---

## 5️⃣ Test Email Configuration

### Test Password Reset:
1. Go to your app: https://topaffaireimmo.com/login
2. Click "Mot de passe oublié?"
3. Enter a test email address
4. Check if email arrives with correct branding

### Test Signup Confirmation:
1. Create a new account
2. Check if confirmation email arrives
3. Verify sender name shows as "TopAffaireImmo"
4. Click confirmation link and verify redirect works

---

## 6️⃣ Production Checklist

Before going live, verify:

- [ ] Site URL is set to `https://topaffaireimmo.com`
- [ ] Redirect URLs include production and preview deployments
- [ ] All email templates have TopAffaireImmo branding
- [ ] Sender name is "TopAffaireImmo"
- [ ] Password reset emails are delivered successfully
- [ ] Confirmation emails are delivered successfully
- [ ] Email links redirect to correct domain
- [ ] (Optional) Custom SMTP is configured and tested

---

## 🔍 Troubleshooting

### Password reset emails not received?
1. Check spam folder
2. Verify email address is correct
3. Check Supabase logs: Dashboard → Logs → Auth Logs
4. Ensure Site URL and Redirect URLs are configured correctly

### Email shows wrong sender name?
1. Update sender name in Authentication settings
2. If using custom SMTP, update sender name in SMTP config
3. Wait a few minutes and test again

### Reset link doesn't work?
1. Verify `VITE_PRODUCTION_DOMAIN` env var is set correctly in Vercel
2. Check redirect URL is whitelisted in Supabase
3. Ensure link hasn't expired (24 hour validity)

### Emails go to spam?
1. Configure custom SMTP with verified domain
2. Add SPF and DKIM records to your domain DNS
3. Use a reputable email provider (Resend, SendGrid)

---

## 📚 Related Documentation

- [Supabase Email Documentation](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase SMTP Documentation](https://supabase.com/docs/guides/auth/auth-smtp)
- [Environment Variables Setup](../VERCEL_ENV_VARS_CHECKLIST.md)

---

## ✅ Summary

After completing this configuration:
- ✅ Password reset emails work and are branded
- ✅ Confirmation emails are branded with TopAffaireImmo
- ✅ All auth emails show your site name
- ✅ Email deliverability is improved (if using SMTP)
- ✅ Users can successfully reset their passwords

---

**Last Updated:** January 2024  
**Applies to:** TopAffaireImmo Production Deployment
