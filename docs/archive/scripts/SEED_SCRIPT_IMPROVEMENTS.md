# Seed Script Improvements - Always Set city_id from cities Table

## Current Problem

The current seed script (`generate-moroccan-listings.ts`) generates properties with a `city` TEXT field containing city names like "Casablanca", "Fès", "Boujdour", but doesn't always look up the corresponding `city_id` from the `cities` table.

This causes properties to be inserted with `city_id = NULL`, making them invisible on the public website.

## Recommended Improvement

### 1. **Fetch Cities from Database Before Generating Listings**

Instead of using hardcoded city data, fetch cities from the database:

```typescript
// BEFORE (Current approach)
const MOROCCO_CITIES: Record<string, CityData> = {
  casablanca: {
    name_fr: 'Casablanca',
    name_ar: 'الدار البيضاء',
    neighborhoods: ['Maarif', 'Bourgogne', ...],
    priceMultiplier: 1.2
  },
  // ... more cities
};

// AFTER (Recommended approach)
async function fetchCitiesFromDatabase() {
  const { data: cities, error } = await supabase
    .from('cities')
    .select('id, name_fr, name_ar, region_fr')
    .eq('is_active', true)
    .order('name_fr');
  
  if (error) throw error;
  
  // Build a map: city name → city object with id
  const cityMap = new Map();
  cities.forEach(city => {
    cityMap.set(city.name_fr.toLowerCase(), {
      id: city.id,
      name_fr: city.name_fr,
      name_ar: city.name_ar,
      region: city.region_fr
    });
  });
  
  return cityMap;
}
```

### 2. **Look Up city_id When Generating Properties**

```typescript
// BEFORE (Generates without city_id)
const property = {
  advertiser_type: 'owner',
  transaction_type: 'sale',
  property_type: 'apartment',
  city: city.name_fr,  // ❌ Plain text, no city_id
  quartier: neighborhood,
  price: 500000,
  // ... other fields
};

// AFTER (Includes city_id from database)
const property = {
  advertiser_type: 'owner',
  transaction_type: 'sale',
  property_type: 'apartment',
  city_id: cityData.id,  // ✅ Proper foreign key
  custom_neighborhood: neighborhood,  // Not a FK, just text
  price: 500000,
  // ... other fields
};

// Remove or deprecate the plain text 'city' field
// NOTE: Keep it temporarily for backward compatibility during migration
// The frontend will get city info via: city:cities(name_fr, name_ar)
// Once all data is migrated and backfill is complete, this field can be removed
```

### 3. **Fetch Neighborhoods with City Context**

Similarly for neighborhoods:

```typescript
async function fetchNeighborhoodsFromDatabase() {
  const { data: neighborhoods, error } = await supabase
    .from('neighborhoods')
    .select('id, name_fr, name_ar, city_id')
    .order('name_fr');
  
  if (error) throw error;
  
  // Build a map: city_id → neighborhoods[]
  const neighborhoodsByCity = new Map();
  neighborhoods.forEach(n => {
    if (!neighborhoodsByCity.has(n.city_id)) {
      neighborhoodsByCity.set(n.city_id, []);
    }
    neighborhoodsByCity.get(n.city_id).push(n);
  });
  
  return neighborhoodsByCity;
}

// When generating property
const cityNeighborhoods = neighborhoodsByCity.get(cityData.id) || [];
const randomNeighborhood = cityNeighborhoods[Math.floor(Math.random() * cityNeighborhoods.length)];

const property = {
  // ... other fields
  city_id: cityData.id,
  neighborhood_id: randomNeighborhood?.id || null,  // Use FK or null
  custom_neighborhood: randomNeighborhood?.name_fr || null,  // Optional text fallback
};
```

### 4. **Update seed-sample-listings.ts**

Here's the minimal change needed in `scripts/seed-sample-listings.ts`:

```typescript
// Add this near the top of main execution
async function main() {
  console.log('Fetching cities from database...');
  const citiesMap = await fetchCitiesFromDatabase();
  
  console.log('Fetching neighborhoods from database...');
  const neighborhoodsByCity = await fetchNeighborhoodsFromDatabase();
  
  // Then in the property generation loop:
  for (const cityKey of Object.keys(MOROCCO_CITIES)) {
    const cityData = citiesMap.get(cityKey.toLowerCase());
    
    if (!cityData) {
      console.warn(`⚠️  City "${cityKey}" not found in database, skipping...`);
      continue;
    }
    
    const property = {
      owner_id: adminProfile.id,
      transaction_type: 'sale',
      property_type: 'apartment',
      city_id: cityData.id,  // ✅ Set from database
      neighborhood_id: null,  // Or match from neighborhoodsByCity
      custom_neighborhood: neighborhood,
      price: basePrice,
      area: randomArea(),
      bedrooms: randomBedrooms(),
      bathrooms: randomBathrooms(),
      title_fr: generateTitle('fr', cityData.name_fr, neighborhood),
      title_ar: generateTitle('ar', cityData.name_ar, neighborhood),
      description_fr: generateDescription('fr'),
      description_ar: generateDescription('ar'),
      images: await fetchImages(),
      is_sample: true,
      external_key: `sample_${cityKey}_${i}`,
      status: 'published',
      is_archived: false,
      published_at: new Date().toISOString(),
      advertiser_type: 'owner',
      contact_phone: '+212 6 00 00 00 00',
      // ... rest of fields
    };
    
    sampleListings.push(property);
  }
}
```

## Benefits of This Approach

### ✅ Correctness
- Properties always have valid `city_id` from the start
- No need for backfill scripts
- Frontend queries always work

### ✅ Referential Integrity
- Foreign key constraints are satisfied
- Database enforces data quality
- Prevents orphaned relationships

### ✅ Future-Proof
- If cities table is updated, seed script stays in sync
- No hardcoded city mappings to maintain
- Works even if city names change

### ✅ Performance
- One-time database fetch at start
- Efficient lookups using Map
- No N+1 query problems

## Implementation Checklist

- [ ] Add `fetchCitiesFromDatabase()` function
- [ ] Add `fetchNeighborhoodsFromDatabase()` function (optional but recommended)
- [ ] Update property generation to use `city_id` from database
- [ ] Remove or deprecate plain text `city` field
- [ ] Test seed script generates properties with valid `city_id`
- [ ] Verify seeded properties appear on public website
- [ ] Update documentation

## Example: Complete Minimal Change

```typescript
// At the top of seed-sample-listings.ts
async function fetchCitiesFromDatabase() {
  const { data: cities, error } = await supabase
    .from('cities')
    .select('id, name_fr, name_ar')
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching cities:', error);
    throw error;
  }
  
  const cityMap = new Map();
  cities.forEach(city => {
    cityMap.set(city.name_fr.toLowerCase().trim(), city);
  });
  
  console.log(`✓ Loaded ${cities.length} cities from database`);
  return cityMap;
}

// In main() function
async function main() {
  // ... existing code ...
  
  // Fetch cities BEFORE generating properties
  const citiesMap = await fetchCitiesFromDatabase();
  
  // ... in the property generation loop ...
  
  for (let i = 0; i < LISTINGS_COUNT; i++) {
    const cityName = selectRandomCity();  // Returns city name string
    const cityData = citiesMap.get(cityName.toLowerCase().trim());
    
    if (!cityData) {
      console.warn(`City "${cityName}" not found in database, skipping...`);
      continue;
    }
    
    const property = {
      // ... other fields ...
      city_id: cityData.id,  // ✅ Always set from database
      // ... rest of fields ...
    };
    
    sampleListings.push(property);
  }
  
  // ... rest of code ...
}
```

## Testing the Improvement

After implementing, verify:

```sql
-- All seeded properties should have city_id
SELECT COUNT(*) as missing_city_id
FROM properties
WHERE is_sample = true
  AND city_id IS NULL;
-- Expected: 0

-- Verify cities match
SELECT 
  p.id,
  p.external_key,
  c.name_fr as city_name,
  p.status
FROM properties p
JOIN cities c ON p.city_id = c.id
WHERE p.is_sample = true
LIMIT 10;
-- Expected: All rows show city names correctly
```

## Migration Path

If you have existing seeded data:

1. Run the backfill script first: `scripts/backfill-city-id.sql`
2. Update the seed script with the improvements above
3. Test by running seed script in a development environment
4. Once verified, the improved script prevents future issues

## Summary

**Before**: Seed script generates `city` (TEXT) → Requires backfill → Potential for invisible listings

**After**: Seed script fetches cities, uses `city_id` (FK) → No backfill needed → All listings visible

This is a **one-time improvement** that prevents the problem from ever occurring again.
