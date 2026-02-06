# Promotional Banners Feature

## Overview
This feature allows administrators to create and manage 1-2 free promotional banners that appear in strategic positions across the site's public pages.

## Database Schema

### Table: `promo_banners`
Located in migration: `supabase/migrations/068_create_promo_banners.sql`

**Columns:**
- `id` (UUID) - Primary key
- `title` (TEXT) - Banner title/description
- `image_url` (TEXT) - URL to the banner image
- `link_url` (TEXT, nullable) - Optional target URL when banner is clicked
- `position` (TEXT) - Banner placement position (home-top, home-middle, listing-top)
- `is_active` (BOOLEAN) - Whether the banner is currently active
- `starts_at` (TIMESTAMP, nullable) - Optional start date/time
- `ends_at` (TIMESTAMP, nullable) - Optional end date/time
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Security:**
- RLS (Row Level Security) enabled
- Public can only view active banners within date range
- Only active admins can create/update/delete banners

## Banner Positions

The feature supports three banner positions:

1. **home-top**: Displayed at the top of the home page (after hero section)
2. **home-middle**: Displayed in the middle of the home page (between featured properties and latest listings)
3. **listing-top**: Displayed at the top of Buy/Rent search results pages

## Admin Interface

**Location:** `/admin/promo-banners`

**Features:**
- View all promotional banners in a table
- Create new banners with the "Add Banner" button
- Edit existing banners
- Toggle active/inactive status with eye icon
- Delete banners
- See date range validity status

**Form Fields:**
- **Title*** - Required banner title
- **Image URL*** - Required URL to the banner image
- **Target Link** - Optional URL to redirect when clicked
- **Position*** - Select where the banner appears (home-top, home-middle, listing-top)
- **Start Date** - Optional start date/time (banner won't show before this)
- **End Date** - Optional end date/time (banner won't show after this)
- **Active** - Toggle to activate/deactivate the banner

## Public Display

### Implementation
The `PromoBanner` component (`src/components/PromoBanner.tsx`) handles fetching and displaying banners:

- Automatically fetches active banners for the specified position
- Respects date range constraints (only shows banners within start/end dates)
- Supports clickable banners (opens link in new tab if link_url is set)
- Returns null if no banner is found (graceful degradation)

### Integration Points

1. **Home Page** (`src/components/home.tsx`):
   ```tsx
   <PromoBanner position="home-top" />
   <PromoBanner position="home-middle" />
   ```

2. **Search Results Page** (`src/pages/SearchResults.tsx`):
   ```tsx
   <PromoBanner position="listing-top" />
   ```

## Usage Guidelines

1. **Limit**: Keep to 1-2 active banners at a time as specified in requirements
2. **Image Size**: Use appropriately sized images for optimal loading (recommended: 1200x300px for full-width banners)
3. **Date Range**: Use date ranges to automatically activate/deactivate seasonal or time-limited promotions
4. **Testing**: Always test banners on both desktop and mobile views

## Technical Notes

- Banners are fetched client-side on each page load
- No caching is implemented - banners update immediately when changed
- Images should be hosted on a reliable CDN or storage service
- The query uses Supabase's built-in date comparison for filtering

## Audit Trail

All banner operations (create, update, delete, toggle) are logged to the admin audit log with:
- Action type
- Entity type: 'other'
- Metadata containing banner details

## Future Enhancements

Potential improvements for future iterations:
- Image upload directly to Supabase Storage
- Click tracking/analytics
- A/B testing support
- Multiple banners per position with rotation
- Preview functionality before activation
- Scheduling with timezone support
