# Email Templates for TopAffaireImmo

This directory contains HTML email templates for Supabase authentication emails.

## Available Templates

1. **confirmation.html** - Email signup confirmation
   - Sent when users register
   - Contains account activation link
   - Sender: noreply@topaffaireimmo.com

2. **recovery.html** - Password reset email
   - Sent when users request password reset
   - Contains password reset link
   - Sender: noreply@topaffaireimmo.com

3. **magic_link.html** - Magic link login
   - Sent for passwordless authentication
   - Contains one-time login link
   - Sender: noreply@topaffaireimmo.com

4. **email_change.html** - Email address change confirmation
   - Sent when users change their email
   - Contains confirmation link for new email
   - Sender: noreply@topaffaireimmo.com

5. **invite.html** - User invitation
   - Sent when admins invite new users
   - Contains invitation acceptance link
   - Sender: noreply@topaffaireimmo.com

## Template Variables

All templates use Supabase's built-in variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{ .ConfirmationURL }}` | Action link (confirm, reset, login, etc.) | https://topaffaireimmo.com/auth/callback?token=... |
| `{{ .Token }}` | Verification token | abc123xyz... |
| `{{ .Email }}` | User's email address | user@example.com |
| `{{ .SiteURL }}` | Your site URL | https://topaffaireimmo.com |

## Design Guidelines

### Brand Colors
- **Primary**: #C86A4A (Terracotta)
- **Background**: #FAF8F5 (Cream)
- **Text**: #1A1A1A (Deep Charcoal)
- **Secondary**: #2C5F4F (Deep Forest Green)

### Layout
- Maximum width: 600px
- Mobile responsive
- Centered design
- Clear CTA buttons

### Typography
- Font family: Segoe UI, Tahoma, Geneva, Verdana, sans-serif
- Heading size: 24px-28px
- Body text: 14px-16px
- Line height: 1.6 for readability

## Bilingual Support

All templates include:
- Primary content in French
- Arabic translation in footer section
- RTL support ready (if needed)

## Using These Templates

### Option 1: Copy to Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard
2. Navigate to: **Authentication** → **Email Templates**
3. Select the template type
4. Copy the HTML from the corresponding file
5. Paste into the template editor
6. Save changes

### Option 2: Reference in config.toml

The templates are already referenced in `/supabase/config.toml`:

```toml
[auth.email.template.confirmation]
subject = "Confirmez votre inscription à TopAffaireImmo"
content_path = "./supabase/templates/confirmation.html"
```

Note: This works for local Supabase development. For production, use Option 1.

## Testing Templates

### Test in Supabase Dashboard

1. Go to **Settings** → **Auth** → **SMTP Settings**
2. Configure SMTP (see EMAIL_CONFIGURATION.md)
3. Click **Send Test Email**
4. Check inbox at contact@topaffaireimmo.com

### Test Variables

To test templates locally:
1. Replace variables with sample data
2. Open HTML in browser
3. Verify layout and styling
4. Test responsive design

Example test replacements:
```html
{{ .ConfirmationURL }} → https://topaffaireimmo.com/auth/callback?token=test123
{{ .Email }} → test@example.com
{{ .SiteURL }} → https://topaffaireimmo.com
```

## Customization

### Changing Colors

Edit the inline CSS `style` attributes:
- Header background: `background-color: #C86A4A`
- Button color: `background-color: #C86A4A`
- Link color: `color: #C86A4A`

### Adding Logo

To add a logo image:
1. Upload logo to a public URL or use base64
2. Add in header section:
```html
<img src="YOUR_LOGO_URL" alt="TopAffaireImmo" style="max-width: 200px; height: auto;">
```

### Modifying Text

- Update French text directly in the HTML
- Update Arabic text in the footer section
- Keep variable placeholders intact ({{ .VariableName }})

## Email Client Compatibility

These templates are tested for:
- Gmail (Web, iOS, Android)
- Outlook (Web, Desktop)
- Apple Mail (iOS, macOS)
- Yahoo Mail
- Mobile email clients

### Best Practices Used
- Inline CSS (no external stylesheets)
- Table-based layout (better compatibility)
- Web-safe fonts
- Responsive design with media queries
- Alt text for images
- High contrast for readability

## Security Notes

- Templates don't contain sensitive information
- Variables are sanitized by Supabase
- Links are generated server-side
- Tokens are time-limited
- HTTPS-only links in production

## Maintenance

### Regular Updates
- Review templates quarterly
- Update copyright year annually
- Test with new email clients
- Verify links work correctly
- Check mobile rendering

### Version Control
- All templates are in git
- Track changes via commits
- Document major updates
- Test before deploying

## Support

For template issues:
- See `/docs/EMAIL_CONFIGURATION.md` for setup
- Check Supabase email logs for delivery issues
- Contact Hostinger for SMTP issues
- Test templates before production use

---

**Last Updated**: January 2026
**Version**: 1.0
