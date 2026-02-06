# Contact Privacy Control Implementation

This document describes the complete implementation of contact privacy controls for property listings on the TopAffaireImmo platform.

## Overview

Property owners can now control which contact information is visible to the public for each listing. This provides privacy while allowing owners to selectively share contact methods.

## Features Implemented

### A. Frontend (React + TypeScript + Tailwind + shadcn/ui)

#### 1. Add/Edit Property Forms

**Location:**
- `/src/pages/AddListing.tsx`
- `/src/pages/EditListing.tsx`

**Changes:**
- Added 3 toggle switches using shadcn/ui Switch component:
  - `showPhonePublic` - Controls phone number visibility (default: false)
  - `showWhatsappPublic` - Controls WhatsApp visibility (default: true)
  - `showEmailPublic` - Controls email visibility (default: true)

- Arabic labels (RTL mode):
  - "إظهار الهاتف" (Show Phone)
  - "إظهار واتساب" (Show WhatsApp)
  - "إظهار البريد الإلكتروني" (Show Email)

- French labels (LTR mode):
  - "Afficher le téléphone publiquement"
  - "Afficher WhatsApp publiquement"
  - "Afficher email publiquement"

- Values persist to Supabase using snake_case:
  - `show_phone_public`
  - `show_whatsapp_public`
  - `show_email_public`

#### 2. Property Details Page

**Location:**
- `/src/pages/PropertyDetails.tsx`

**Changes:**
- Query from `properties_public` view instead of `properties` table
- Conditional contact button display:
  - Phone button: Only shown if `show_phone_public = true` AND phone number exists
  - WhatsApp button: Only shown if `show_whatsapp_public = true` AND WhatsApp number exists
  - Email button: Only shown if `show_email_public = true` AND email exists

- CTA button when all contacts are hidden:
  - Displays "تواصل عبر المنصة" (Contact via Platform)
  - Button is disabled with explanatory text:
    - For owners: "Activez au moins un moyen de contact dans vos paramètres"
    - For public: "L'annonceur n'a pas partagé ses coordonnées"

- Owner privacy:
  - Owner personal information (company_name, agency_name) is not exposed through public view
  - Shows "TopAffaireImmo" as default advertiser name

### B. Database (Supabase / PostgreSQL)

#### 1. Properties Table Schema

**Columns added (Migration 080):**
```sql
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS show_phone_public BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_whatsapp_public BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_email_public BOOLEAN NOT NULL DEFAULT true;
```

**Default values:**
- `show_phone_public`: `false` (private by default for privacy)
- `show_whatsapp_public`: `true` (public by default as it's preferred in Morocco)
- `show_email_public`: `true` (public by default)

#### 2. Properties Public View

**View created (Migration 080):**
```sql
CREATE OR REPLACE VIEW public.properties_public AS
SELECT 
  p.id,
  p.title_fr,
  p.title_ar,
  p.description_fr,
  p.description_ar,
  p.price,
  p.transaction_type,
  p.property_type,
  p.status,
  p.created_at,
  p.images,
  p.address,
  p.bedrooms,
  p.bathrooms,
  p.area,
  p.year_built,
  p.featured,
  p.advertiser_type,
  p.city_id,
  p.neighborhood_id,
  p.custom_neighborhood,
  p.owner_id,
  
  -- Conditionally expose contact details based on visibility flags
  CASE WHEN p.show_phone_public = true THEN p.contact_phone ELSE NULL END AS contact_phone,
  CASE WHEN p.show_whatsapp_public = true THEN p.contact_whatsapp ELSE NULL END AS contact_whatsapp,
  CASE WHEN p.show_email_public = true THEN p.contact_email ELSE NULL END AS contact_email,
  
  -- Always expose visibility flags so UI can decide what to show
  p.show_phone_public,
  p.show_whatsapp_public,
  p.show_email_public
FROM public.properties p
WHERE p.status = 'published' AND (p.is_archived = FALSE OR p.is_archived IS NULL);
```

**Permissions:**
```sql
GRANT SELECT ON public.properties_public TO anon;
GRANT SELECT ON public.properties_public TO authenticated;
```

#### 3. Row Level Security (RLS)

**Migration 081: Restrict Direct Public Access**

The `properties_select_public` policy was removed to prevent anonymous users from directly accessing the `properties` table.

**Current policies on `properties` table:**
- `properties_select_own`: Users can view their own listings (created_by OR owner_id)
- `properties_select_admin`: Admins can view all listings
- `properties_insert_own`: Users can insert listings with created_by = auth.uid()
- `properties_update_own`: Users can update their own listings
- `properties_update_admin`: Admins can update any listing
- `properties_delete_own`: Users can delete their own listings
- `properties_delete_admin`: Admins can delete any listing

**Security guarantees:**
- ✅ Anonymous users CANNOT read from `properties` table directly
- ✅ Anonymous users CAN read from `properties_public` view
- ✅ Authenticated users can see their own properties with full contact info
- ✅ Admins have full access to all properties
- ✅ Contact information is conditionally exposed based on visibility flags

### C. SEO

**Location:**
- `/src/pages/PropertyDetails.tsx`

**JSON-LD Schema.org Implementation:**

The page already includes structured data for SEO:

```typescript
{
  "@context": "https://schema.org",
  "@type": "RealEstateListing",
  "@id": "${SITE_URL}/property/${property.id}",
  "name": title,
  "description": description,
  "url": "${SITE_URL}/property/${property.id}",
  "offers": {
    "@type": "Offer",
    "price": price,
    "priceCurrency": "MAD",
    "availability": "https://schema.org/InStock",
    "priceValidUntil": priceValidUntil
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": address,
    "addressLocality": neighborhood || city,
    "addressRegion": city,
    "addressCountry": "MA"
  },
  "numberOfRooms": bedrooms,
  "numberOfBathroomsTotal": bathrooms,
  "floorSize": {
    "@type": "QuantitativeValue",
    "value": area,
    "unitCode": "MTK",
    "unitText": "m²"
  },
  "datePosted": created_at,
  "image": images
}
```

**Language priority:**
- Uses Arabic first (`title_ar`, `description_ar`)
- Falls back to French (`title_fr`, `description_fr`)
- Ensures proper bilingual SEO support

## Database Migrations

1. **080_add_contact_visibility.sql** (Updated)
   - Adds contact fields and visibility flags to properties table
   - Creates properties_public view with conditional contact exposure
   - Grants permissions to anon/authenticated users

2. **081_restrict_properties_public_access.sql** (New)
   - Removes direct public access to properties table
   - Ensures RLS is enabled
   - Forces public users to use properties_public view

3. **082_verify_contact_privacy_setup.sql** (New)
   - Verification script to ensure all components are correctly set up
   - Can be run to validate the implementation

## Testing Checklist

### Manual Testing

- [ ] **Add Listing Form**
  - [ ] Toggle switches appear correctly
  - [ ] Default values are set (phone: off, whatsapp: on, email: on)
  - [ ] Labels display in Arabic when RTL mode is active
  - [ ] Values save correctly to database

- [ ] **Edit Listing Form**
  - [ ] Toggle switches load current values from database
  - [ ] Changes persist correctly
  - [ ] Toggles are disabled when listing is locked

- [ ] **Property Details Page (as anonymous user)**
  - [ ] Only properties from properties_public view are visible
  - [ ] Phone button only appears when show_phone_public = true
  - [ ] WhatsApp button only appears when show_whatsapp_public = true
  - [ ] Email button only appears when show_email_public = true
  - [ ] CTA button appears when all contacts are hidden
  - [ ] CTA button shows appropriate message

- [ ] **Property Details Page (as owner)**
  - [ ] Owner can see their own property details
  - [ ] Contact buttons appear based on visibility settings
  - [ ] CTA button shows owner-specific message when contacts hidden

- [ ] **Database Security**
  - [ ] Anonymous users cannot SELECT from properties table directly
  - [ ] Anonymous users can SELECT from properties_public view
  - [ ] Contact fields are NULL in view when visibility is false

### Automated Testing

Run verification script:
```bash
# Connect to Supabase and run:
psql -f supabase/migrations/082_verify_contact_privacy_setup.sql
```

## Migration Order

Migrations should be applied in this order:
1. 080_add_contact_visibility.sql
2. 081_restrict_properties_public_access.sql
3. 082_verify_contact_privacy_setup.sql (optional verification)

## Rollback Plan

If issues occur, rollback in reverse order:

1. Restore direct public access (if needed):
```sql
CREATE POLICY "properties_select_public" ON public.properties
  FOR SELECT USING (
    status = 'published' AND (is_archived = FALSE OR is_archived IS NULL)
  );
```

2. Drop the view:
```sql
DROP VIEW IF EXISTS public.properties_public;
```

3. Remove columns (if absolutely necessary):
```sql
ALTER TABLE public.properties 
  DROP COLUMN IF EXISTS show_phone_public,
  DROP COLUMN IF EXISTS show_whatsapp_public,
  DROP COLUMN IF EXISTS show_email_public;
```

## Performance Considerations

- Indexes were added for visibility flags (migration 080):
  ```sql
  CREATE INDEX IF NOT EXISTS idx_properties_show_phone_public 
    ON public.properties(show_phone_public) WHERE show_phone_public = true;
  CREATE INDEX IF NOT EXISTS idx_properties_show_whatsapp_public 
    ON public.properties(show_whatsapp_public) WHERE show_whatsapp_public = true;
  CREATE INDEX IF NOT EXISTS idx_properties_show_email_public 
    ON public.properties(show_email_public) WHERE show_email_public = true;
  ```

- The `properties_public` view filters on `status = 'published'` which should use existing indexes

## Security Notes

1. **Contact Privacy**: Default is privacy-first (phone hidden by default)
2. **RLS Enforcement**: Anonymous users cannot bypass visibility flags
3. **Owner Information**: Not exposed through public view to protect privacy
4. **View-Only Access**: Public users have read-only access via view

## Future Enhancements

Potential improvements for future iterations:

1. **Platform Messaging**: Implement the "تواصل عبر المنصة" button functionality
2. **Analytics**: Track which contact methods are most used
3. **Bulk Updates**: Allow owners to update visibility settings for multiple listings
4. **Advanced Privacy**: Per-user contact visibility (show different contacts to different users)
5. **A/B Testing**: Test different default visibility settings for conversion optimization

## Support

For issues or questions:
1. Check the verification script results
2. Review RLS policies in Supabase dashboard
3. Check browser console for any JavaScript errors
4. Verify database migrations are applied in order
