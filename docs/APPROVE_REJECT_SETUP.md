# Admin Approve/Reject Actions Setup

This document describes the setup for the Admin Listings Approve/Reject workflow.

## Overview

The admin listings page now supports:
- ✅ Approve action: sets status to "approved", approved_at, approved_by, and published_at
- ❌ Reject action: sets status to "rejected", rejected_at, rejected_by, and optional rejection_reason
- 🖼️ Multi-image support with lightbox modal
- 🔒 Confirmation dialog for reject with optional reason input

## Database Migration

Run the migration to add rejected tracking fields:

```sql
-- Migration 064: Add rejected_at and rejected_by fields
-- Location: supabase/migrations/064_add_rejected_fields.sql

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES public.profiles(id);

CREATE INDEX IF NOT EXISTS idx_properties_rejected_at ON public.properties(rejected_at);

COMMENT ON COLUMN public.properties.rejected_at IS 'Timestamp when listing was rejected by admin';
COMMENT ON COLUMN public.properties.rejected_by IS 'Admin user ID who rejected the listing';
```

## Security (RLS)

The existing RLS policies (from migration 050) already allow admins to update properties:

```sql
-- Admin can update ALL listings
CREATE POLICY "properties_update_admin" ON public.properties
  FOR UPDATE 
  USING (auth.uid() IN (SELECT user_id FROM public.admins))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));
```

To verify admin access:

```sql
-- Check if current user is admin
SELECT EXISTS (
  SELECT 1 FROM public.admins WHERE user_id = auth.uid()
) AS is_admin;

-- List all admins
SELECT a.user_id, u.email, p.full_name
FROM public.admins a
LEFT JOIN auth.users u ON a.user_id = u.id
LEFT JOIN public.profiles p ON a.user_id = p.id;
```

## Adding an Admin User

To make a user an admin, insert their user_id into the admins table:

```sql
-- Replace 'user-uuid-here' with the actual user UUID
INSERT INTO public.admins (user_id) VALUES ('user-uuid-here');
```

To find a user's UUID:

```sql
-- Find user by email
SELECT id, email FROM auth.users WHERE email = 'admin@example.com';
```

## Features

### Approve Action
- Single click approval
- Sets status to "approved"
- Records approved_at timestamp
- Records approved_by (admin user ID)
- Sets published_at for public visibility
- Shows success toast
- Removes from "pending" filter view
- Logs action to admin_audit_logs

### Reject Action
- Shows confirmation dialog
- Optional rejection reason (textarea)
- Sets status to "rejected"
- Records rejected_at timestamp
- Records rejected_by (admin user ID)
- Saves rejection_reason if provided
- Shows success toast
- Removes from "pending" filter view
- Logs action with reason to admin_audit_logs

### Image Handling
- Displays first image as thumbnail
- Shows "+N" badge if multiple images
- Click thumbnail to open lightbox modal
- Navigate through images with prev/next arrows
- Thumbnail strip for quick navigation
- Responsive modal design

## Components

### ConfirmDialog
Location: `src/components/admin/ConfirmDialog.tsx`

Reusable confirmation dialog with optional content area for forms.

### ImageModal
Location: `src/components/admin/ImageModal.tsx`

Lightbox modal for viewing multiple images with navigation.

## Testing

### Manual Testing Steps

1. **Approve a listing:**
   - Go to Admin Listings page
   - Filter by "Pending"
   - Click green checkmark icon
   - Verify listing disappears from pending list
   - Check database: approved_at, approved_by, published_at should be set
   - Check toast notification appears

2. **Reject a listing:**
   - Go to Admin Listings page
   - Filter by "Pending"
   - Click red X icon
   - Dialog should appear
   - Enter optional rejection reason
   - Click "Reject" button
   - Verify listing disappears from pending list
   - Check database: rejected_at, rejected_by, rejection_reason should be set
   - Check toast notification appears

3. **View multiple images:**
   - Find a listing with multiple images (+N badge)
   - Click on the thumbnail
   - Modal should open showing first image
   - Use arrows to navigate between images
   - Click thumbnail strip to jump to specific image
   - Close modal

### SQL Verification Queries

```sql
-- Check approved listings
SELECT id, title_fr, status, approved_at, approved_by
FROM public.properties
WHERE status = 'approved'
ORDER BY approved_at DESC
LIMIT 10;

-- Check rejected listings
SELECT id, title_fr, status, rejected_at, rejected_by, rejection_reason
FROM public.properties
WHERE status = 'rejected'
ORDER BY rejected_at DESC
LIMIT 10;

-- Check audit log
SELECT created_at, action, entity_type, entity_id, metadata
FROM public.admin_audit_logs
WHERE action IN ('approve', 'reject')
ORDER BY created_at DESC
LIMIT 10;
```

## Troubleshooting

### User cannot approve/reject
- Verify user is in admins table
- Check RLS policies are enabled
- Verify user is authenticated

### Images not loading
- Check property-images bucket exists
- Verify bucket is public or has proper RLS
- Check image paths are correct (path vs URL)

### Rejection reason not saved
- Verify rejection_reason column exists in properties table
- Check for SQL errors in browser console
- Ensure reason is being passed to performStatusChange function
