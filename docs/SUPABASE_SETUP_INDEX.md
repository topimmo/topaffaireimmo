# Supabase Configuration & Diagnostics - Index

## Quick Start

### 1. Check Environment Configuration
```bash
npm run diagnose:frontend
```

### 2. Inspect RLS Policies
Run in Supabase SQL Editor:
- `supabase/RLS_INSPECTION.sql`

### 3. Apply Minimum Policies (if needed)
Run in Supabase SQL Editor (review first!):
- `supabase/RLS_MINIMUM_POLICIES.sql`

## Documentation Files

### Guides

| Document | Purpose | Audience |
|----------|---------|----------|
| [SUPABASE_DIAGNOSTIC_FIX_SUMMARY.md](./SUPABASE_DIAGNOSTIC_FIX_SUMMARY.md) | Complete summary of the diagnostic and fix solution | All developers |
| [FRONTEND_SUPABASE_SETUP.md](./FRONTEND_SUPABASE_SETUP.md) | Frontend Supabase configuration guide | Frontend developers |
| [RLS_FIX_GUIDE.md](./RLS_FIX_GUIDE.md) | Row Level Security policy guide | Backend/Database developers |

### Scripts & Tools

| File | Type | Purpose |
|------|------|---------|
| `scripts/diagnose-frontend.cjs` | Node.js | Check environment variables and configuration |
| `supabase/RLS_INSPECTION.sql` | SQL | Inspect current RLS policies and permissions |
| `supabase/RLS_MINIMUM_POLICIES.sql` | SQL | Apply safe default RLS policies |

## Common Workflows

### New Project Setup

1. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with Supabase credentials
   npm run diagnose:frontend
   ```

2. **Apply RLS Policies**:
   - Open Supabase SQL Editor
   - Run `supabase/RLS_MINIMUM_POLICIES.sql`

3. **Create Admin User**:
   ```sql
   UPDATE public.profiles
   SET user_role = 'admin'
   WHERE email = 'admin@example.com';
   ```

4. **Verify**:
   ```bash
   npm run dev
   # Test login, CRUD operations
   ```

### Troubleshooting RLS Issues

1. **Run Diagnostics**:
   ```bash
   npm run diagnose:frontend
   ```

2. **Inspect Policies**:
   - Run `supabase/RLS_INSPECTION.sql` in Supabase SQL Editor
   - Review output for missing or incorrect policies

3. **Apply Fixes**:
   - Extract relevant policies from `RLS_MINIMUM_POLICIES.sql`
   - Test in staging first
   - Apply to production

4. **Verify**:
   - Re-run diagnostic
   - Test in UI with different user roles

### Adding New Tables

When creating new tables:

1. **Enable RLS**:
   ```sql
   ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;
   ```

2. **Add Policies** (choose appropriate pattern):
   - Public read, admin write (reference data)
   - Own records only (user content)
   - Conditional access (status-based)

3. **Grant Permissions**:
   ```sql
   GRANT SELECT ON public.your_table TO anon, authenticated;
   GRANT INSERT, UPDATE, DELETE ON public.your_table TO authenticated;
   ```

4. **Test**:
   - Run `RLS_INSPECTION.sql`
   - Test from frontend with different roles

## Quick Reference

### Environment Variables

Required for frontend:
```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Never** include in frontend:
```bash
VITE_SUPABASE_SERVICE_ROLE_KEY  # Server-side only!
```

### NPM Scripts

```bash
npm run diagnose:frontend   # Check environment config
npm run diagnose:supabase   # Analyze migrations
npm run dev                 # Start development server
```

### SQL Scripts

```sql
-- Inspect current state
\i supabase/RLS_INSPECTION.sql

-- Apply minimum policies
\i supabase/RLS_MINIMUM_POLICIES.sql
```

### Admin Check Function

```sql
-- Check if current user is admin
SELECT public.is_admin();

-- Make user an admin
UPDATE public.profiles
SET user_role = 'admin'
WHERE email = 'user@example.com';
```

## Policy Patterns

### Pattern 1: Public Read, Admin Write
```sql
CREATE POLICY "table_select_all" ON table FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "table_modify_admin" ON table FOR ALL TO authenticated 
  USING (public.is_admin()) WITH CHECK (public.is_admin());
```

### Pattern 2: Own Records Only
```sql
CREATE POLICY "table_select_own" ON table FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);
CREATE POLICY "table_update_own" ON table FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### Pattern 3: Conditional Public Access
```sql
CREATE POLICY "table_select_published" ON table FOR SELECT TO anon 
  USING (status = 'published');
CREATE POLICY "table_select_all_auth" ON table FOR SELECT TO authenticated 
  USING (true);
```

## Tables & Buckets Covered

### Tables (24)
- Core: profiles, properties, property_images, cities, neighborhoods, property_types
- Services: artisan_profiles, service_categories, service_subcategories, requests, reviews
- Admin: admin_notifications, admin_audit_logs, site_settings, platform_settings
- Analytics: property_views, property_leads, property_contact_clicks
- Advertising: banner_slots, banner_requests

### Storage Buckets (5)
- property-images (public)
- avatars (public)
- artisan-avatars (public)
- agency-logos (public)
- banner-images (admin only)

## Verification Checklist

### Environment
- [ ] .env file exists and configured
- [ ] `npm run diagnose:frontend` passes
- [ ] No service role key in frontend
- [ ] Dev server starts successfully

### Database
- [ ] All tables have RLS enabled
- [ ] All tables have policies
- [ ] is_admin() function exists
- [ ] Admin user exists
- [ ] Storage policies configured

### Application
- [ ] Unauthenticated can view public data
- [ ] Authentication works (signup/login)
- [ ] Users can manage own content
- [ ] Users cannot access others' content
- [ ] Admin has full access
- [ ] Storage uploads work

## Common Issues

| Issue | Quick Fix | Details |
|-------|-----------|---------|
| "Permission denied" | Check RLS policies | [RLS_FIX_GUIDE.md](./RLS_FIX_GUIDE.md#issue-2) |
| Env vars missing | Update .env | [FRONTEND_SUPABASE_SETUP.md](./FRONTEND_SUPABASE_SETUP.md#issue-1) |
| Admin blocked | Check is_admin() | [RLS_FIX_GUIDE.md](./RLS_FIX_GUIDE.md#issue-4) |
| Storage 403 | Check bucket policies | [RLS_FIX_GUIDE.md](./RLS_FIX_GUIDE.md#issue-5) |
| Table not found | Run migrations | [FRONTEND_SUPABASE_SETUP.md](./FRONTEND_SUPABASE_SETUP.md#issue-4) |

## Need Help?

1. **Run diagnostics first**: `npm run diagnose:frontend`
2. **Check documentation**: See links above
3. **Review logs**: Supabase Dashboard → Logs
4. **Test incrementally**: One table/feature at a time

## Related Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Security Best Practices](../SECURITY_HARDENING_README.md)
- [Architecture Documentation](../ARCHITECTURE.md)

---

**Last Updated**: February 2026  
**Version**: 1.0  
**Status**: Production Ready
