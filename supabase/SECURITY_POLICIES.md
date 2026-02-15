# TopAffaireImmo - Security Policies & Role Permissions

## Quick Reference Guide

### 🔐 Security Overview

TopAffaireImmo implements **Row Level Security (RLS)** on all sensitive tables to ensure data isolation and access control.

**Key Principles:**
1. **Defense in Depth**: RLS + Application logic + API validation
2. **Principle of Least Privilege**: Users can only access what they need
3. **Audit Everything**: All admin actions are logged
4. **Privacy First**: Contact reveals are tracked but anonymized

---

## 👥 User Roles

### Role Hierarchy

```
┌─────────────┐
│   PUBLIC    │ (No authentication)
└──────┬──────┘
       │
       ├─────────────┐
       │   USER      │ (Basic authenticated user)
       └──────┬──────┘
              │
              ├─────────────────────┬────────────────────┐
              │                     │                    │
       ┌──────▼──────┐      ┌──────▼──────┐     ┌──────▼──────┐
       │ ADVERTISER  │      │  ARTISAN    │     │    ADMIN    │
       └─────────────┘      └─────────────┘     └─────────────┘
    (Real Estate/Commercial)  (Service Provider)   (Full Access)
```

### Role Definitions

| Role | Value | Description | Default |
|------|-------|-------------|---------|
| Public | `null` | Unauthenticated users | - |
| User | Any authenticated | Basic logged-in user | ✅ |
| Advertiser | `real_estate_advertiser` | Property listers | ✅ |
| Commercial | `commercial_advertiser` | Commercial advertisers | - |
| Artisan | Profile in `artisan_profiles` | Service providers | - |
| Admin | User in `admins` table | Platform administrators | - |

---

## 🛡️ RLS Policies by Table

### Core Tables

#### **profiles**
| Policy | Roles | Access | Condition |
|--------|-------|--------|-----------|
| Public read all | PUBLIC | SELECT | All profiles are readable |
| Users update own | USER | UPDATE | `auth.uid() = id` |
| Admins manage all | ADMIN | ALL | Is in `admins` table |

**Security Notes:**
- Phone numbers are visible (needed for contact)
- Email is visible (profile completeness)
- Consider hiding sensitive fields in future

#### **properties**
| Policy | Roles | Access | Condition |
|--------|-------|--------|-----------|
| Public read approved | PUBLIC | SELECT | `status = 'approved'` |
| Owners manage own | ADVERTISER | ALL | `owner_id = auth.uid()` |
| Admins manage all | ADMIN | ALL | Is in `admins` table |

**Security Notes:**
- Draft/rejected properties are private
- Status changes are protected by RPC functions
- Featured status requires payment

**Protected Fields:**
- `status` - Only changed via RPC or admin
- `moderated_by` - System-managed
- `moderated_at` - System-managed
- `rejection_reason` - Admin-only write

#### **property_images**
| Policy | Roles | Access | Condition |
|--------|-------|--------|-----------|
| Public read all | PUBLIC | SELECT | All images readable |
| Owners manage own | ADVERTISER | INSERT, UPDATE, DELETE | Via property ownership |
| Admins manage all | ADMIN | ALL | Is in `admins` table |

**Security Notes:**
- Images in storage have additional RLS
- Orphaned images should be cleaned up
- Consider watermarking for premium content

#### **notifications**
| Policy | Roles | Access | Condition |
|--------|-------|--------|-----------|
| Users read own | USER | SELECT | `user_id = auth.uid()` |
| Users update own | USER | UPDATE | `user_id = auth.uid()` (read status only) |
| Admins manage all | ADMIN | ALL | Is in `admins` table |

**Security Notes:**
- Users cannot create notifications
- System/RPC functions create notifications
- No deletion by users (keep history)

### Boost & Monetization

#### **boost_plans**
| Policy | Roles | Access | Condition |
|--------|-------|--------|-----------|
| Public read active | PUBLIC | SELECT | `is_active = TRUE` |
| Admins manage all | ADMIN | ALL | Is in `admins` table |

**Security Notes:**
- Prices are public
- Inactive plans hidden from users
- Changes logged in audit trail

#### **property_boosts**
| Policy | Roles | Access | Condition |
|--------|-------|--------|-----------|
| Owners read own | ADVERTISER | SELECT | Via property ownership |
| Admins manage all | ADMIN | ALL | Is in `admins` table |

**Security Notes:**
- Status changes automated by payment
- Manual activation requires admin
- Expiry should be automated (cron job)

#### **payments**
| Policy | Roles | Access | Condition |
|--------|-------|--------|-----------|
| Users read own | USER | SELECT | `user_id = auth.uid()` |
| Admins read all | ADMIN | SELECT | Is in `admins` table |

**Security Notes:**
- Users cannot modify payments
- Creation via secure Edge Function only
- Stripe webhook updates status

### Contact & Analytics

#### **phone_reveal_events** / **contact_reveals**
| Policy | Roles | Access | Condition |
|--------|-------|--------|-----------|
| Public cannot read | PUBLIC | - | FALSE (no direct access) |
| Admins read all | ADMIN | SELECT | Is in `admins` table |

**Security Notes:**
- No direct public access
- Accessed via Edge Function only
- IP/User-Agent hashed for privacy
- Rate limiting enforced

**Rate Limits:**
- 5 reveals per IP per hour
- 20 reveals per IP per day
- Configurable in Edge Function

### Home Services

#### **artisan_profiles**
| Policy | Roles | Access | Condition |
|--------|-------|--------|-----------|
| Public read verified | PUBLIC | SELECT | `is_active = TRUE AND is_verified = TRUE` |
| Artisans read own | ARTISAN | SELECT | `user_id = auth.uid()` |
| Artisans manage own | ARTISAN | INSERT, UPDATE | `user_id = auth.uid()` |
| Admins manage all | ADMIN | ALL | Is in `admins` table |

**Security Notes:**
- Unverified profiles private
- Verification is admin-only
- Phone numbers visible after verification

**Protected Fields:**
- `is_verified` - Admin-only
- `is_boosted` - Payment/Admin-only

#### **service_categories** & **service_subcategories**
| Policy | Roles | Access | Condition |
|--------|-------|--------|-----------|
| Public read active | PUBLIC | SELECT | `is_active = TRUE` |
| Admins manage all | ADMIN | ALL | Is in `admins` table |

#### **artisan_services**
| Policy | Roles | Access | Condition |
|--------|-------|--------|-----------|
| Public read verified | PUBLIC | SELECT | Via verified artisan |
| Artisans manage own | ARTISAN | INSERT, UPDATE, DELETE | `artisan_profile_id` belongs to user |
| Admins manage all | ADMIN | ALL | Is in `admins` table |

#### **requests** (Service Requests)
| Policy | Roles | Access | Condition |
|--------|-------|--------|-----------|
| Requesters read own | USER | SELECT | `user_id = auth.uid()` |
| Artisans read assigned | ARTISAN | SELECT | `artisan_id = artisan_profile.id` WHERE user matches |
| Admins manage all | ADMIN | ALL | Is in `admins` table |

**Security Notes:**
- Personal info in requests is protected
- Assignment is admin/system controlled
- Status changes logged

### Admin & Audit

#### **admins**
| Policy | Roles | Access | Condition |
|--------|-------|--------|-----------|
| Admins read self | ADMIN | SELECT | `user_id = auth.uid()` |
| Super admins manage | ADMIN | INSERT, UPDATE, DELETE | Additional check needed |

**Security Notes:**
- New admins require manual DB insert
- No self-promotion to admin
- Consider separate super_admin role

#### **admin_audit_logs**
| Policy | Roles | Access | Condition |
|--------|-------|--------|-----------|
| Admins read all | ADMIN | SELECT | Is in `admins` table |
| System creates | SYSTEM | INSERT | Via RPC functions only |

**Security Notes:**
- Immutable audit trail
- No updates/deletes allowed
- Retention policy needed for GDPR

#### **system_logs**, **performance_metrics**, **analytics_events**
| Policy | Roles | Access | Condition |
|--------|-------|--------|-----------|
| Admins read all | ADMIN | SELECT | Is in `admins` table |
| System creates | SYSTEM | INSERT | Via RPC functions only |

**Security Notes:**
- Rate limited (100 logs/user/min)
- Automated cleanup after 90 days
- No PII should be logged

### CMS & Settings

#### **site_pages**, **site_categories**
| Policy | Roles | Access | Condition |
|--------|-------|--------|-----------|
| Public read published | PUBLIC | SELECT | `is_published = TRUE` |
| Admins manage all | ADMIN | ALL | Is in `admins` table |

#### **platform_settings**
| Policy | Roles | Access | Condition |
|--------|-------|--------|-----------|
| Public read monetization | PUBLIC | SELECT | `key = 'monetization'` |
| Admins manage all | ADMIN | ALL | Is in `admins` table |

**Security Notes:**
- Sensitive config should use Supabase Vault
- Version control changes
- Validate JSON schemas

---

## 🗄️ Storage Bucket Policies

### property-images
```sql
-- Public read
USING (bucket_id = 'property-images')

-- User upload to own folder
WITH CHECK (
  bucket_id = 'property-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
)

-- Admin full access
USING (
  bucket_id = 'property-images'
  AND auth.uid() IN (SELECT user_id FROM public.admins)
)
```

**Folder Structure:** `{user_id}/{property_id}/{filename}`

**Security:**
- ✅ Public read (all images)
- ✅ User upload to own folder
- ✅ User delete own files
- ✅ Admin full access
- ❌ Cross-user access

### avatars
```sql
-- Public read
USING (bucket_id = 'avatars')

-- User upload to own folder
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
```

**Folder Structure:** `{user_id}/avatar.{ext}`

**Security:**
- ✅ Public read
- ✅ User manage own
- ✅ Upsert allowed (replace existing)

### payment-receipts
```sql
-- User read own
USING (
  bucket_id = 'payment-receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
)

-- Admin read all
USING (
  bucket_id = 'payment-receipts'
  AND auth.uid() IN (SELECT user_id FROM public.admins)
)
```

**Folder Structure:** `{user_id}/{payment_id}/{filename}`

**Security:**
- ❌ No public read
- ✅ User read own
- ✅ Admin read all
- 🔒 Private bucket

### banner-images, agency-logos
Similar to property-images but admin-managed.

---

## 🔧 RPC Function Security

### SECURITY DEFINER Functions

Functions that run with **elevated privileges** (as function creator):

| Function | Security Level | Why DEFINER? |
|----------|---------------|--------------|
| `submit_property_for_review` | DEFINER | Updates property status |
| `approve_property` | DEFINER | Admin action + notifications |
| `reject_property` | DEFINER | Admin action + notifications |
| `mark_notification_read` | DEFINER | Ensures user owns notification |
| `mark_all_notifications_read` | DEFINER | Batch update with safety |
| `search_properties` | DEFINER (STABLE) | Complex query optimization |
| `resend_email_confirmation` | DEFINER | Access to auth.users |
| `log_audit_event` | DEFINER | System logging |

**Security Pattern:**
```sql
CREATE FUNCTION my_secure_function()
SECURITY DEFINER  -- Runs as function owner
SET search_path = public  -- Prevent schema hijacking
AS $$
BEGIN
  -- Explicit permission checks
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Verify ownership or admin status
  IF NOT EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  
  -- Perform privileged operation
  ...
END;
$$;
```

### SECURITY INVOKER Functions

Functions that run with **caller's privileges**:

| Function | Security Level | Why INVOKER? |
|----------|---------------|--------------|
| Helper functions | INVOKER | No privileged access needed |
| Pure computation | INVOKER | Safer default |

---

## 🚨 Common Security Pitfalls

### ❌ Don't Do This

1. **Trusting Client Input**
   ```javascript
   // BAD: Direct update without validation
   await supabase
     .from('properties')
     .update({ status: 'approved' })  // Bypasses workflow!
     .eq('id', propertyId);
   ```
   
   **✅ Do This:**
   ```javascript
   // GOOD: Use RPC function with validation
   await supabase.rpc('approve_property', { property_id: propertyId });
   ```

2. **Exposing Sensitive Data**
   ```javascript
   // BAD: Selecting payment details
   const { data } = await supabase
     .from('payments')
     .select('*');  // May expose other users' data!
   ```
   
   **✅ Do This:**
   ```javascript
   // GOOD: RLS filters automatically
   const { data } = await supabase
     .from('payments')
     .select('*')
     .eq('user_id', user.id);  // Explicit filter
   ```

3. **Bypassing RLS**
   ```javascript
   // BAD: Using service role key in client
   const supabase = createClient(url, SERVICE_ROLE_KEY);  // NEVER!
   ```
   
   **✅ Do This:**
   ```javascript
   // GOOD: Service role only in secure backend
   // Client uses anon key + RLS
   const supabase = createClient(url, ANON_KEY);
   ```

4. **Missing Validation**
   ```sql
   -- BAD: No input validation
   CREATE FUNCTION delete_anything(id UUID)
   RETURNS BOOLEAN AS $$
   BEGIN
     DELETE FROM important_table WHERE id = id;
     RETURN TRUE;
   END;
   $$;
   ```
   
   **✅ Do This:**
   ```sql
   -- GOOD: Validate ownership
   CREATE FUNCTION delete_my_item(id UUID)
   SECURITY DEFINER
   SET search_path = public
   AS $$
   BEGIN
     DELETE FROM important_table 
     WHERE id = id 
       AND owner_id = auth.uid();  -- Verify ownership
       
     IF NOT FOUND THEN
       RAISE EXCEPTION 'Item not found or access denied';
     END IF;
     
     RETURN TRUE;
   END;
   $$;
   ```

---

## ✅ Security Checklist

### Database

- [x] RLS enabled on all tables
- [x] SECURITY DEFINER functions have explicit checks
- [x] No SQL injection vulnerabilities
- [x] Sensitive data encrypted at rest (Supabase default)
- [x] Audit logging for admin actions
- [x] Rate limiting on sensitive functions
- [ ] Regular security audits
- [ ] Penetration testing

### Authentication

- [x] JWT secret is strong (Supabase managed)
- [x] Email confirmation required
- [ ] Phone verification (optional)
- [x] Password complexity enforced
- [ ] 2FA for admins (recommended)
- [x] Session timeout configured
- [ ] IP whitelisting for admin (optional)

### Storage

- [x] Bucket size limits enforced
- [x] MIME type validation
- [x] File size limits
- [x] User-scoped folders
- [ ] Virus scanning (optional)
- [ ] Automatic image optimization
- [ ] CDN for performance

### API

- [x] CORS properly configured
- [x] Rate limiting on Edge Functions
- [x] Input validation on all endpoints
- [x] Error messages don't leak info
- [ ] API versioning
- [ ] Request logging
- [ ] DDoS protection

### Monitoring

- [x] Error logging enabled
- [x] Performance tracking
- [x] Audit trail for admin actions
- [ ] Alerts for suspicious activity
- [ ] Regular log review
- [ ] Incident response plan

---

## 📞 Emergency Procedures

### Suspected Breach

1. **Immediate Actions**
   - Disable affected user account
   - Revoke API keys if compromised
   - Check audit logs for unauthorized access
   - Notify affected users if data exposed

2. **Investigation**
   ```sql
   -- Check recent admin actions
   SELECT * FROM admin_audit_logs
   WHERE created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;
   
   -- Check failed authentication attempts
   SELECT * FROM auth.audit_log_entries
   WHERE error_message IS NOT NULL
   ORDER BY created_at DESC;
   
   -- Check unusual property modifications
   SELECT * FROM properties
   WHERE updated_at > NOW() - INTERVAL '1 hour'
     AND moderated_by IS NULL;
   ```

3. **Recovery**
   - Reset affected passwords
   - Rotate JWT secrets if needed
   - Review and update RLS policies
   - Document incident for future prevention

### Database Rollback

```sql
-- Check last migration
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 1;

-- Rollback is not recommended - fix forward instead
-- Create new migration to undo changes
```

---

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Security Best Practices](https://www.postgresql.org/docs/current/sql-grant.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Last Updated:** February 2024  
**Security Review:** Required quarterly  
**Next Audit Due:** May 2024
