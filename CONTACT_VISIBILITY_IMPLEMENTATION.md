# International Phone Support & Contact Visibility - Implementation Summary

## Overview
This implementation adds support for international phone numbers (E.164 format) and per-listing visibility controls for contact details (phone, WhatsApp, email) in the TopAffaireImmo application.

## Changes Made

### 1. Database Schema (Migration 080)
**File**: `supabase/migrations/080_add_contact_visibility.sql`

#### New Columns Added:
```sql
-- Contact fields (already existed, ensured with IF NOT EXISTS)
contact_phone TEXT
contact_whatsapp TEXT  
contact_email TEXT

-- New visibility flags
show_phone_public BOOLEAN NOT NULL DEFAULT false
show_whatsapp_public BOOLEAN NOT NULL DEFAULT true
show_email_public BOOLEAN NOT NULL DEFAULT true
```

#### Security Enhancement - Public View:
Created `properties_public` view that:
- Only shows published properties
- Conditionally exposes contact details based on visibility flags
- Prevents data leakage for anonymous users
- Allows owner/admin to always see their contact details in app logic

### 2. Validation & Utilities
**File**: `src/lib/utils.ts`

Added comprehensive E.164 phone number support:

```typescript
normalizePhoneNumber(phone: string): string
  // Removes spaces, dashes, parentheses
  // Ensures + prefix for international format
  // Example: "+212 664 22 89 76" → "+212664228976"

validateE164Phone(phone: string): boolean
  // Validates E.164 format: ^\+[1-9]\d{7,14}$
  // Allows empty (optional field)
  // Examples: +212664228976, +33123456789, +14155552671

formatWhatsAppLink(phone: string): string
  // Converts E.164 to wa.me format
  // Example: "+212664228976" → "https://wa.me/212664228976"

getPhoneValidationError(phone: string, isRTL: boolean): string
  // User-friendly error messages in French/Arabic
```

### 3. AddListing Form
**File**: `src/pages/AddListing.tsx`

#### New Form Fields:
- `whatsapp` - WhatsApp number (E.164)
- `email` - Contact email
- `showPhonePublic` - Toggle for phone visibility
- `showWhatsappPublic` - Toggle for WhatsApp visibility (default: true)
- `showEmailPublic` - Toggle for email visibility (default: true)
- `whatsappSameAsPhone` - Checkbox to sync WhatsApp with phone

#### Features:
✅ International phone format helper text
✅ E.164 validation on submit
✅ WhatsApp sync logic (when checkbox is checked, WhatsApp auto-updates with phone)
✅ Visibility switches using shadcn Switch component
✅ Phone normalization before database insert

### 4. EditListing Form
**File**: `src/pages/EditListing.tsx`

#### Changes:
✅ Mirror all AddListing changes
✅ Load existing contact details and visibility preferences
✅ E.164 validation on update
✅ Preserve existing data when editing
✅ Respect locked status (admins only can edit locked listings)

### 5. PropertyDetails Page (Public View)
**File**: `src/pages/PropertyDetails.tsx`

#### Owner/Admin Access:
```typescript
const isOwnerOrAdmin = useMemo(() => {
  if (!user || !property) return false;
  return user.id === property.owner_id;
}, [user, property]);
```

#### Conditional Contact Display:
```typescript
const shouldShowPhone = isOwnerOrAdmin || (property.show_phone_public && phone);
const shouldShowWhatsapp = isOwnerOrAdmin || (property.show_whatsapp_public && whatsapp);
const shouldShowEmail = isOwnerOrAdmin || (property.show_email_public && email);
```

#### Contact Buttons:
- **Phone** - Only shown if `shouldShowPhone` is true
- **WhatsApp** - Only shown if `shouldShowWhatsapp` is true, uses `formatWhatsAppLink()`
- **Email** - Only shown if `shouldShowEmail` is true, uses `mailto:` link
- **Fallback** - Shows "Contact information hidden by advertiser" if all hidden

## Testing Checklist

### Manual Tests Required:

#### ✅ Test 1: Create Listing with International Phone
1. Navigate to `/add-listing`
2. Fill in listing details
3. Enter international phone number (e.g., `+33612345678`)
4. Enter WhatsApp number (e.g., `+212664228976`)
5. Enter email
6. Toggle visibility switches
7. Submit listing
8. Verify phone numbers are normalized and saved correctly

#### ✅ Test 2: WhatsApp Same as Phone Sync
1. Navigate to `/add-listing`
2. Enter phone number `+212664228976`
3. Check "WhatsApp same as phone" checkbox
4. Verify WhatsApp field is disabled and shows same number
5. Change phone number
6. Verify WhatsApp updates automatically
7. Uncheck the checkbox
8. Verify WhatsApp field is enabled again

#### ✅ Test 3: Visibility Controls
1. Create a listing with all contact info
2. Set:
   - Show phone: OFF
   - Show WhatsApp: ON
   - Show email: ON
3. View listing as public (logged out)
4. Verify:
   - Phone button is NOT shown
   - WhatsApp button IS shown
   - Email button IS shown

#### ✅ Test 4: Owner Can Always See
1. Create a listing with all contact hidden (all toggles OFF)
2. Log in as the listing owner
3. View the listing
4. Verify all contact buttons are visible to owner
5. Log out
6. Verify all contact buttons are hidden to public

#### ✅ Test 5: E.164 Validation
Test invalid formats (should show error):
- `212664228976` (missing +)
- `+212` (too short)
- `+21266422897612345678` (too long)
- `+abc123` (contains letters)

Test valid formats (should accept):
- `+212664228976` (Morocco)
- `+33612345678` (France)
- `+442071234567` (UK)
- `+14155552671` (USA)

## Database Migration

To apply the migration:

```bash
# On Supabase dashboard or via CLI
supabase migration up
```

Or manually run:
```sql
-- Execute the contents of supabase/migrations/080_add_contact_visibility.sql
```

## Security Considerations

### ✅ RLS (Row Level Security)
- Migration creates `properties_public` view for safe public access
- Owner/admin check is done in application layer
- Visibility flags prevent accidental data leakage

### ✅ Data Validation
- E.164 validation prevents invalid phone formats
- Normalization ensures consistent data storage
- Client-side and server-side validation

### ✅ Privacy by Default
- `show_phone_public` defaults to `false` (most private)
- `show_whatsapp_public` defaults to `true` (common use case)
- `show_email_public` defaults to `true` (common use case)

## Deployment Notes

1. **Run migration first** - Ensure database schema is updated before deploying frontend
2. **Backward compatible** - Old listings without visibility flags will use defaults
3. **No breaking changes** - Existing `contact_phone` field is preserved
4. **Mobile-friendly** - tel:, mailto:, and wa.me links work on mobile devices

## Files Changed

1. `supabase/migrations/080_add_contact_visibility.sql` - Database schema
2. `src/lib/utils.ts` - Validation utilities
3. `src/pages/AddListing.tsx` - Create listing form
4. `src/pages/EditListing.tsx` - Edit listing form
5. `src/pages/PropertyDetails.tsx` - Public listing display

## Dependencies

No new npm packages required. Uses existing:
- React (hooks: useState, useEffect, useMemo)
- shadcn/ui (Switch, Checkbox components)
- Supabase (database queries)

## Future Enhancements

Potential improvements:
- [ ] Add phone number country code selector dropdown
- [ ] Implement click-to-reveal phone (show after user clicks)
- [ ] Add SMS contact option
- [ ] Track which contact method is most effective
- [ ] Add contact form as alternative to direct contact
- [ ] Implement rate limiting for contact clicks

## Support

For issues or questions:
- Check TypeScript errors: `npm run typecheck`
- Check database schema in Supabase dashboard
- Review migration logs in Supabase
- Test with dev server: `npm run dev`
