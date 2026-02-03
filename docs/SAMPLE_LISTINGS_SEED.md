# Sample Listings Seed Script

This script generates realistic sample property listings across Morocco, including major cities and Sahara regions, using stock photos from Pexels.

## Features

- ✅ **Idempotent**: Uses `external_key` to prevent duplicate listings when re-run
- 🌍 **Comprehensive Coverage**: Includes all major Moroccan cities and Sahara regions
- 💰 **Realistic Pricing**: Adjusts prices based on city and region
- 🖼️ **Stock Images**: Fetches property images from Pexels API (no scraping)
- 🌐 **Bilingual**: Generates content in both French and Arabic
- 🏷️ **Marked as Samples**: All listings are marked with `is_sample = true` for easy filtering

## Coverage

### Major Cities
- **Casablanca**: Maarif, Bourgogne, Gauthier, Ain Diab, Sidi Maârouf
- **Rabat**: Agdal, Hay Riad, Hassan, Souissi
- **Marrakech**: Guéliz, Hivernage, Palmeraie
- **Tanger**: Malabata, Iberia, Marshan
- **Agadir**: Talborjt, Dakhla Road area
- **Fès**: Ville Nouvelle, Narjiss
- **Oujda**: Hay Al Qods

### Sahara Regions
- **Laâyoune**: Hay Al Wifaq, Centre Ville
- **Dakhla**: Corniche, Centre Ville
- **Smara**: Centre Ville
- **Boujdour**: Centre Ville
- **Tan-Tan**: Centre Ville
- **Guelmim**: Centre Ville (Gateway to Sahara)
- **Zagora**: Centre Ville (near Sahara)
- **Errachidia**: Centre Ville (near Sahara)

## Property Types

The script generates diverse listings:
- **Apartments** (sale & rent)
- **Villas** (sale)
- **Houses** (sale)
- **Commercial** properties (sale)
- **Land** plots (sale)

## Prerequisites

1. **Node.js** >= 18
2. **Supabase Project** with migrations applied
3. **Environment Variables** (see Configuration below)
4. **Admin User** in the database (required as owner of sample listings)

## Configuration

### Required Environment Variables

Add these to your `.env` file:

```bash
# Supabase Configuration (required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Pexels API (optional - will use placeholders if not provided)
PEXELS_API_KEY=your_pexels_api_key

# Number of listings to generate (optional, default: 50)
LISTINGS_COUNT=50
```

### Getting API Keys

#### Supabase Service Role Key
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the `service_role` key (keep it secret!)

⚠️ **WARNING**: The service role key bypasses Row Level Security. Never expose it in client-side code!

#### Pexels API Key (Optional)
1. Sign up at [Pexels](https://www.pexels.com/api/)
2. Create a free API key
3. Add it to your `.env` file

If no Pexels API key is provided, the script will use placeholder images from Unsplash.

## Usage

### 1. Run Migrations First

Ensure the database schema is up to date:

```bash
# If using Supabase CLI
supabase db push

# Or apply migration 073_add_sample_listing_fields.sql manually
```

### 2. Create Admin User

The script requires at least one admin user in the database. If you don't have one, create it via Supabase Dashboard:

1. Go to **Authentication** → **Users**
2. Create a new user
3. In the database, update the user's profile:
   ```sql
   UPDATE profiles 
   SET user_role = 'admin' 
   WHERE id = 'your-user-id';
   ```

### 3. Run the Seed Script

```bash
# Install dependencies (if not already done)
npm install

# Run the seed script
npm run seed:sample-listings
```

### 4. Verify Results

Check your database:

```sql
-- Count sample listings
SELECT COUNT(*) FROM properties WHERE is_sample = true;

-- View sample listings by city
SELECT c.name_fr, COUNT(*) as count
FROM properties p
JOIN cities c ON p.city_id = c.id
WHERE p.is_sample = true
GROUP BY c.name_fr
ORDER BY count DESC;
```

## How It Works

1. **Connects** to Supabase using service role credentials
2. **Fetches** available cities from the database
3. **Deletes** existing sample listings (idempotent cleanup)
4. **Generates** property data:
   - Randomly selects cities and neighborhoods
   - Applies realistic pricing based on region
   - Creates bilingual titles and descriptions
   - Fetches images from Pexels API
5. **Inserts** listings in batches of 10
6. **Reports** success/error counts

## External Keys

Each sample listing gets a unique `external_key` in the format:

```
sample_{cityKey}_{propertyType}_{index}
```

Examples:
- `sample_casablanca_apartment_0`
- `sample_dakhla_villa_5`
- `sample_marrakech_commercial_12`

This ensures:
- **Idempotency**: Re-running the script won't create duplicates
- **Traceability**: Easy to identify and manage sample listings
- **External Integration**: Can be used for syncing with other systems

## Cleaning Up Sample Listings

To remove all sample listings:

```sql
DELETE FROM properties WHERE is_sample = true;
```

Or programmatically:

```typescript
import { supabase } from './lib/supabase';

await supabase
  .from('properties')
  .delete()
  .eq('is_sample', true);
```

## Filtering Sample Listings

### Hide samples from public listings:

```typescript
const { data } = await supabase
  .from('properties')
  .select('*')
  .eq('is_sample', false)  // Exclude samples
  .eq('status', 'approved');
```

### Show only samples:

```typescript
const { data } = await supabase
  .from('properties')
  .select('*')
  .eq('is_sample', true);
```

## Troubleshooting

### Error: "No admin user found"

**Solution**: Create an admin user first (see Usage section above).

### Error: "Missing required environment variables"

**Solution**: Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in `.env`.

### Warning: "Pexels API error"

**Solution**: Check your `PEXELS_API_KEY` or let the script use placeholder images.

### Error: "City not found in database"

**Solution**: Ensure migrations are applied and cities are seeded. Run:
```bash
supabase db push
```

## Advanced Configuration

### Custom Listing Count

Generate more or fewer listings:

```bash
LISTINGS_COUNT=100 npm run seed:sample-listings
```

### Modify City Coverage

Edit `MOROCCO_CITIES` in `scripts/seed-sample-listings.ts` to:
- Add new cities/neighborhoods
- Adjust price multipliers
- Change region classifications

### Modify Property Templates

Edit `PROPERTY_TEMPLATES` in `scripts/seed-sample-listings.ts` to:
- Add new property types
- Adjust price ranges
- Customize descriptions
- Change Pexels search queries

## Best Practices

1. **Run in Development Only**: Don't run this in production databases
2. **Keep Service Key Secret**: Never commit `.env` to version control
3. **Monitor API Usage**: Pexels has rate limits (200 requests/hour for free tier)
4. **Clean Up Regularly**: Remove sample listings when not needed
5. **Update Templates**: Keep property descriptions realistic and up-to-date

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [Supabase Documentation](https://supabase.com/docs)
3. Check the [Pexels API Documentation](https://www.pexels.com/api/documentation/)

## License

This script is part of the TopAffaireImmo project and follows the same license.
