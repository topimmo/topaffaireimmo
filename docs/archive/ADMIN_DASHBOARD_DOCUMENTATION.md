# Admin Dashboard Documentation

## Overview

The TopAffaireImmo Admin Dashboard is a comprehensive administrative interface for managing the real estate platform. It provides tools for content moderation, user management, CMS editing, and system diagnostics.

**Access URL**: `https://www.topaffaireimmo.com/admin`

## Admin Authentication

### How Admin Status is Determined

The system uses the `admins` table to determine if a user has administrative privileges.

**Database Table**: `admins`
**Primary Field**: `user_id` (references `auth.users.id`)

To grant admin access to a user:
```sql
INSERT INTO public.admins (user_id)
VALUES ('user-uuid-here');
```

### How to Add an Admin User

1. **Using SQL** (recommended for first admin):
   ```sql
   -- Get the user ID from auth.users
   SELECT id, email FROM auth.users WHERE email = 'admin@example.com';
   
   -- Add to admins table
   INSERT INTO public.admins (user_id)
   VALUES ('user-id-from-above');
   ```

2. **Using the helper function** (if migration 051 is applied):
   ```sql
   -- This function is created by migration 051_create_admin_user_helper.sql
   SELECT create_admin_user('admin@example.com', 'secure-password');
   ```

## Running Migrations

### Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- Connected to your Supabase project

### Migration Steps

1. **Navigate to project directory**:
   ```bash
   cd /path/to/topaffaireimmo
   ```

2. **Link to Supabase project** (first time only):
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. **Apply all migrations**:
   ```bash
   supabase db push
   ```

   Or apply specific migrations:
   ```bash
   supabase db push --include 053_create_admin_audit_logs.sql
   ```

4. **Verify migrations**:
   ```bash
   supabase db remote ls
   ```

### New Migrations Added

- **053_create_admin_audit_logs.sql**: Audit logging for admin actions
- **054_create_admin_notifications.sql**: Notification system for admins
- **055_create_site_pages_cms.sql**: CMS for static pages (About, Privacy, Terms, Contact)
- **056_create_site_categories_cms.sql**: CMS for site categories

## Admin Dashboard Features

### 1. Dashboard (/admin)
**Purpose**: Overview of platform statistics and recent activity

**Features**:
- KPI cards showing:
  - Pending listings count
  - Approved listings count
  - Rejected listings count
  - Total listings count
  - Total users count
  - Total agencies count
- Recent admin activity feed (from audit logs)
- Quick action buttons to:
  - Review pending listings
  - View all listings
  - Manage users

### 2. Listings Management (/admin/listings)
**Purpose**: Review and moderate property listings

**Features**:
- Filterable table by status (pending, approved, rejected, all)
- Server-side pagination
- Actions per listing:
  - View details
  - Approve
  - Reject
  - Delete (with image cleanup)
- Export to CSV/Excel with contact information
- Last fetch time displayed
- Shows contact_phone, contact_whatsapp, contact_email fields

**CSV Export Fields**:
- ID, Title (FR/AR), Price, Status, Type, Transaction
- City, Neighborhood
- Contact Phone, Contact WhatsApp, Contact Email
- Advertiser Type, Created At

### 3. Listing Details (/admin/listings/:id)
**Purpose**: Detailed view and actions for a single listing

**Features**:
- Full property preview with all fields
- Contact information panel (phone, WhatsApp, email)
- Owner information
- Images gallery
- Actions:
  - Approve (triggers Facebook webhook if configured)
  - Reject (with reason)
  - Delete (removes from DB and storage)
  - Retry Facebook post
- Facebook posting status
- Approval/rejection metadata

### 4. Users Management (/admin/users)
**Purpose**: View and manage user accounts

**Features**:
- List of all users with profiles
- User information: email, name, phone, role
- User type filter
- Listing count per user

### 5. Agencies Management (/admin/agencies)
**Purpose**: Manage real estate agencies

**Features**:
- List of all agencies (profiles with advertiser_type='agency')
- Agency information:
  - Agency name
  - License number
  - Contact person
  - Email and phone
  - Listing count
- Statistics:
  - Total agencies
  - Active agencies (with listings)

### 6. Locations Management (/admin/locations)
**Purpose**: CRUD operations for cities and neighborhoods

**Features**:
- **Cities Tab**:
  - List all cities
  - Add/Edit/Delete cities
  - Multilingual support (EN, FR, AR)
  - Slug generation
- **Neighborhoods Tab**:
  - List all neighborhoods
  - Link to parent city
  - Add/Edit/Delete neighborhoods
  - Multilingual support
  - Auto-slug generation

### 7. Settings (/admin/settings)
**Purpose**: Manage global site settings

**Features**:
- **Contact Information**:
  - Contact email
  - Contact phone
  - Contact WhatsApp
- **System Settings**:
  - Maintenance mode toggle
- **AdSense Settings**:
  - Header slot
  - Sidebar slot
  - Footer slot
- **Facebook Integration**:
  - Webhook URL
  - Page ID

### 8. Content Management (/admin/content/pages)
**Purpose**: CMS for managing static pages

**Features**:
- List all site pages (About, Privacy, Terms, Contact, etc.)
- Create new pages
- Edit existing pages with FR/AR tabs
- Publish/unpublish pages
- SEO meta descriptions
- Live preview links

**Page Editor** (/admin/content/pages/:id):
- Dual language editor (FR/AR)
- Title and content fields
- Meta description for SEO
- Publish toggle
- Auto-save updated timestamp

### 9. Categories Management (/admin/content/categories)
**Purpose**: Manage site categories

**Features**:
- List all categories
- Create/Edit/Delete categories
- Multilingual support (FR/AR)
- Icon assignment (Lucide React icons)
- Sort order management
- Active/inactive toggle
- Drag-and-drop reordering (visual indicator)

### 10. Diagnostics (/admin/diagnostics)
**Purpose**: System health checks and debugging

**Checks Performed**:
- Runtime environment (MODE)
- Supabase URL configuration
- Properties table columns (contact_phone, contact_whatsapp, contact_email)
- Storage bucket access (property-images)
- Public URL generation
- RLS policies status
- Admin table accessibility
- New tables availability:
  - admin_audit_logs
  - admin_notifications
  - site_pages
  - site_categories

**Diagnostic Results**:
- Success count
- Warning count
- Error count
- Detailed status for each check

## Audit Logging

All admin actions are logged to the `admin_audit_logs` table.

### Logged Actions
- **approve**: Listing approved
- **reject**: Listing rejected
- **delete**: Listing/user/content deleted
- **feature**: Listing featured
- **unfeature**: Listing unfeatured
- **update**: Content updated
- **create**: New content created

### Log Fields
- `admin_id`: UUID of the admin user
- `action`: Type of action
- `entity_type`: Type of entity (property, user, page, category, settings, location)
- `entity_id`: UUID of the affected entity
- `metadata`: JSON object with additional context
- `created_at`: Timestamp

### Viewing Audit Logs
Audit logs are displayed on the Admin Dashboard as "Recent Activity" showing the last 10 actions.

## Notifications System

The notification system alerts admins about important events.

### Notification Types
- `info`: Informational messages
- `warning`: Warning messages
- `success`: Success confirmations
- `error`: Error alerts

### Notification Bell
- Located in the admin header
- Shows unread count badge
- Dropdown displays recent notifications
- "Mark all as read" functionality

### Creating Notifications
Notifications can be created programmatically:
```typescript
import { createAdminNotification } from '@/lib/notifications';

await createAdminNotification({
  title: 'New Listing',
  body: 'A new property listing requires approval',
  link: '/admin/listings?status=pending',
  notification_type: 'info',
  user_id: null, // null = all admins, or specific admin UUID
});
```

## CMS Integration

### Frontend Integration

Static pages (About, Privacy, Terms, Contact) now load content from the CMS when available.

**Fallback Behavior**:
1. Try to load from `site_pages` table
2. If not found or not published, use hardcoded content
3. Respects language selection (FR/AR)
4. RTL support for Arabic

### CMS Page Structure

**Required Fields**:
- `slug`: Unique identifier (e.g., 'about', 'privacy')
- `title_fr`: French title
- `title_ar`: Arabic title
- `content_fr`: French content
- `content_ar`: Arabic content

**Optional Fields**:
- `meta_description_fr`: SEO description (French)
- `meta_description_ar`: SEO description (Arabic)
- `is_published`: Publish status (default: true)

### Default Pages

The migration seeds four default pages:
- `about`: À Propos / معلومات عنا
- `privacy`: Politique de Confidentialité / سياسة الخصوصية
- `terms`: Conditions d'Utilisation / شروط الاستخدام
- `contact`: Contact / اتصل بنا

## Environment Variables

### Required Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Facebook Integration
VITE_FACEBOOK_WEBHOOK_URL=https://your-webhook-url.com/facebook
VITE_FACEBOOK_PAGE_ID=123456789012345
```

## Security

### RLS Policies

All new tables have Row Level Security (RLS) enabled with policies:

**Admin Tables** (admin_audit_logs, admin_notifications):
- Only users in the `admins` table can read/write

**CMS Tables** (site_pages, site_categories):
- Public can read published content
- Only admins can create/update/delete

**Storage**:
- Property images use public access with tracking via `property_images` table

### Best Practices

1. **Never share admin credentials**
2. **Regularly review audit logs**
3. **Keep admin list minimal** (only trusted users)
4. **Use strong passwords** for admin accounts
5. **Enable 2FA** when possible (Supabase Auth supports this)

## Troubleshooting

### "Not authorized" when accessing /admin

**Cause**: User is not in the `admins` table

**Solution**:
```sql
INSERT INTO public.admins (user_id)
VALUES ('your-user-uuid');
```

### Migrations fail to apply

**Cause**: Database conflicts or missing dependencies

**Solutions**:
1. Check migration order (run in sequence 053-056)
2. Verify Supabase connection: `supabase status`
3. Check for existing table conflicts
4. Review migration logs

### CMS content not showing

**Causes**:
1. Page is not published (`is_published = false`)
2. RLS policy blocking access
3. Slug mismatch

**Solutions**:
1. Check publish status in /admin/content/pages
2. Verify RLS policies are applied
3. Confirm slug matches exactly (case-sensitive)

### Notifications not appearing

**Causes**:
1. User not in admins table
2. RLS policy issue
3. Real-time subscription not working

**Solutions**:
1. Verify admin status
2. Check browser console for errors
3. Refresh the page

## Support

For issues or questions:
1. Check the diagnostics page (/admin/diagnostics)
2. Review audit logs for recent actions
3. Check browser console for JavaScript errors
4. Verify all migrations are applied

## Future Improvements

Potential enhancements (not yet implemented):
1. Bulk listing actions
2. Advanced search and filters
3. Analytics dashboard
4. Email notifications for admins
5. User role management (admin hierarchy)
6. Content versioning in CMS
7. Media library for CMS
8. Scheduled publishing for CMS content
