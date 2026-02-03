# Pull Request: Sample Listings Seed Script for Morocco Properties

## 📋 Overview

This PR implements a complete end-to-end solution for generating sample property listings across Morocco, including major cities and Sahara regions, using stock photos from Pexels API.

## 🎯 Problem Statement

The task was to:
- Create a seed script to generate demo properties across Morocco
- Cover major cities AND Sahara regions broadly
- Use stock photos from Pexels/Pixabay (NO scraping)
- Ensure listings are marked as samples (is_sample = true)
- Implement idempotent seeding using external_key
- Support configuration via environment variables

## ✅ Solution

### 1. Database Migration (073_add_sample_listing_fields.sql)

Added required fields to the `properties` table:
- `is_sample` (boolean, default: false) - Marks sample listings
- `external_key` (text, unique when not null) - Enables idempotent seeding
- Indexes for performance
- Comprehensive documentation comments

### 2. Seed Script (scripts/seed-sample-listings.ts)

Full-featured TypeScript seed script with:
- **Morocco-wide coverage**: 15 cities including all major cities and Sahara regions
- **Idempotent**: Safe to re-run without creating duplicates
- **Realistic data**: Prices adjusted by region, bilingual content
- **Stock images**: Pexels API integration with fallback to placeholders
- **Configurable**: Environment variables for all settings
- **Robust**: Batch insertion, error handling, progress reporting

### 3. Documentation

- **docs/SAMPLE_LISTINGS_SEED.md**: Comprehensive usage guide
- **SAMPLE_LISTINGS_IMPLEMENTATION_SUMMARY.md**: Technical summary
- **README.md**: Updated with seed script information

### 4. Configuration

- **package.json**: Added `seed:sample-listings` npm script
- **.env.example**: Added required environment variables
- **Dependencies**: Added `dotenv` for environment variable support

## 🌍 Geographic Coverage

### Major Cities (7)
- **Casablanca**: Maarif, Bourgogne, Gauthier, Ain Diab, Sidi Maârouf, Anfa, California, Racine
- **Rabat**: Agdal, Hay Riad, Hassan, Souissi, Ocean, Medina, Yacoub El Mansour
- **Marrakech**: Guéliz, Hivernage, Palmeraie, Medina, Targa, Massira
- **Tanger**: Malabata, Iberia, Marshan, Medina, Boukhalef, California
- **Agadir**: Talborjt, Hay Dakhla, Founty, Secteur Touristique, Tikiouine
- **Fès**: Ville Nouvelle, Narjiss, Atlas, Bensouda, Saiss
- **Oujda**: Hay Al Qods, Lazaret, Centre Ville, Hay Salam

### Sahara Regions (8)
- **Laâyoune**: Hay Al Wifaq, Centre Ville, Hay Nasr, Maatalla
- **Dakhla**: Centre Ville, Corniche, Hay Essalam, Port
- **Smara**: Centre Ville, Hay Moulay Abdellah, Hay Essalam
- **Boujdour**: Centre Ville, Hay Al Massira, Hay Al Wahda
- **Tan-Tan**: Centre Ville, Hay Al Massira, Hay Nasr
- **Guelmim**: Centre Ville, Hay Salam, Hay Al Massira (Gateway to Sahara)
- **Zagora**: Centre Ville, Amezrou, Hay Al Massira (near Sahara)
- **Errachidia**: Centre Ville, Hay Al Massira, Hay Nasr (near Sahara)

## 🏠 Property Types

- **Apartments** (sale & rent)
- **Villas** (sale)
- **Houses** (sale)
- **Commercial** properties (sale)
- **Land** plots (sale)

Each type has realistic attributes:
- Area ranges appropriate for type
- Bedroom/bathroom counts
- Bilingual titles and descriptions
- Region-adjusted pricing

## 💰 Pricing Strategy

Prices are calculated based on:
1. **Base price** by property type
2. **Region multiplier**:
   - Casablanca: 1.2x
   - Rabat: 1.1x
   - Marrakech: 1.0x (baseline)
   - Tanger: 0.9x
   - Agadir: 0.85x
   - Fès: 0.75x
   - Oujda: 0.65x
   - Sahara regions: 0.5-0.6x
3. **Area factor**: Larger properties cost more
4. **Random variance**: ±15% for realism

## 🖼️ Stock Images

- Fetches images from **Pexels API** (NO scraping)
- 3 images per property
- Relevant search queries by property type
- Graceful fallback to placeholders if API unavailable
- Respects Pexels rate limits

## ⚙️ Configuration

### Environment Variables

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
PEXELS_API_KEY=your_pexels_api_key  # Falls back to placeholders
LISTINGS_COUNT=50                    # Default: 50
```

### Usage

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Run the seed script
npm run seed:sample-listings
```

## 🔒 Security

- ✅ **CodeQL scan**: 0 vulnerabilities
- ✅ **Service role key**: Only used server-side, never exposed
- ✅ **Input validation**: All environment variables validated
- ✅ **SQL injection**: Protected via Supabase client
- ✅ **External APIs**: Safe calls with error handling

## 🧪 Testing

### Automated Validation
- ✅ TypeScript compilation: Pass
- ✅ Structure validation: Pass
- ✅ Required constants: Present
- ✅ Geographic coverage: Complete
- ✅ Configuration: Correct

### Code Review
- ✅ Addressed all feedback
- ✅ Fixed inconsistent naming
- ✅ Added documentation comments

### Manual Testing Required
Full integration testing requires:
1. Live Supabase project
2. Database migrations applied
3. Admin user created
4. Environment variables set

## 📊 Expected Output

```
🌱 Starting sample listings seed...
📊 Target: 50 listings

📍 Fetching cities from database...
✓ Found 20 cities in database

👤 Setting up system user for sample listings...
✓ Using existing admin user: [UUID]

🧹 Cleaning up existing sample listings...
🏠 Generating sample listings...
  Generated 10/50 listings...
  Generated 20/50 listings...
  ...

✓ Generated 50 sample listings
💾 Inserting listings into database...
  Inserted 50/50 listings...

✅ Seed completed!
  Success: 50 listings
  Errors: 0 listings

🎉 Sample listings seed completed successfully!
```

## 📁 Files Changed

```
.env.example                                    # Added env vars
README.md                                       # Added seed script docs
package.json                                    # Added seed script command
package-lock.json                               # Added dotenv
docs/SAMPLE_LISTINGS_SEED.md                   # NEW: Usage guide
scripts/seed-sample-listings.ts                # NEW: Seed script
supabase/migrations/073_add_sample_listing_fields.sql  # NEW: Migration
SAMPLE_LISTINGS_IMPLEMENTATION_SUMMARY.md      # NEW: Tech summary
```

## 🔄 Idempotency

The script is fully idempotent:
1. Deletes existing samples before seeding
2. Uses unique `external_key` to prevent duplicates
3. Safe to run multiple times

External keys follow format: `sample_{city}_{type}_{index}`

## 🎨 Data Quality

### Bilingual Content
- All titles and descriptions in **French** and **Arabic**
- Proper Unicode/UTF-8 encoding
- Culturally appropriate names

### Realistic Attributes
- Area ranges by property type
- Appropriate bedroom/bathroom counts
- Features and amenities arrays (ready for expansion)
- Contact information (placeholder)

### Proper Status
- Status: `published` (publicly visible)
- `is_archived`: false
- `published_at`: Set to current timestamp
- `is_sample`: true (for filtering)

## 📚 Documentation

### User Documentation
- **docs/SAMPLE_LISTINGS_SEED.md**: Complete guide
  - Features overview
  - Setup instructions
  - Usage guide
  - Troubleshooting
  - Best practices

### Technical Documentation
- **SAMPLE_LISTINGS_IMPLEMENTATION_SUMMARY.md**: Implementation details
  - Architecture
  - Database schema
  - Security considerations
  - Testing approach
  - Future enhancements

### README Updates
- Added seed script to available scripts
- Added link to documentation
- Updated feature list

## 🚀 Usage Examples

### Generate 50 listings (default)
```bash
npm run seed:sample-listings
```

### Generate custom number of listings
```bash
LISTINGS_COUNT=100 npm run seed:sample-listings
```

### Filter sample listings in queries
```typescript
// Hide samples
await supabase.from('properties')
  .select('*')
  .eq('is_sample', false);

// Show only samples
await supabase.from('properties')
  .select('*')
  .eq('is_sample', true);
```

### Clean up samples
```sql
DELETE FROM properties WHERE is_sample = true;
```

## ✨ Highlights

1. **Comprehensive Coverage**: All major cities + Sahara regions as required
2. **Production Ready**: Security validated, error handling, idempotent
3. **Well Documented**: Usage guide, technical docs, inline comments
4. **Configurable**: Environment-based configuration
5. **Safe**: No scraping, uses official Pexels API
6. **Bilingual**: Full French/Arabic support
7. **Realistic**: Region-based pricing, varied property types

## 🎯 Meets All Requirements

- ✅ Covers Morocco broadly (15 cities)
- ✅ Includes neighborhoods
- ✅ Includes Sahara regions (Laâyoune, Dakhla, Smara, Boujdour, etc.)
- ✅ Uses Pexels stock assets only (NO scraping)
- ✅ Database fields: is_sample, images[], external_key
- ✅ Generates realistic attributes and prices by region
- ✅ Idempotent seeding (safe to re-run)
- ✅ Environment variable configuration
- ✅ Status compatible with public listing logic (published)
- ✅ Complete documentation

## 🔮 Future Enhancements

Potential improvements:
1. Upload images to Supabase storage
2. More diverse property templates
3. Generate amenities and features
4. Support for featured listings
5. CLI arguments for more flexibility
6. Progress bar UI
7. Dry-run mode

## 📝 Notes

- Migration number 073 is sequential with existing migrations
- Script requires at least one admin user in database
- Pexels API key is optional (graceful fallback)
- Service role key must be kept secret

## 🙏 Ready for Review

This PR is complete and ready for:
- Code review
- Testing with live credentials
- Merge to main branch

All automated checks pass, documentation is comprehensive, and the implementation meets all requirements from the problem statement.
