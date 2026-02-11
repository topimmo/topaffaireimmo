# Artisan Monetization - Technical Reference

## Quick Start for Developers

### Database Schema (Migration 091)

```sql
-- Location Model: cities[] → city_id + neighborhood_ids[]
ALTER TABLE artisan_profiles
  ADD COLUMN city_id INTEGER REFERENCES cities(id),
  ADD COLUMN neighborhood_ids INTEGER[] DEFAULT '{}';

-- Contact Access with Neighborhood Scope
ALTER TABLE contact_access_passes
  ADD COLUMN neighborhood_ids INTEGER[] DEFAULT NULL;
```

### RPC Functions

#### 1. Create Artisan Profile
```typescript
// Frontend usage
const { data, error } = await supabase.rpc('create_my_artisan_profile', {
  p_service_category_id: 'uuid-here',
  p_business_name: 'Ahmed Plomberie',
  p_city_id: 1, // Casablanca
  p_neighborhood_ids: [1, 2, 3], // Maarif, Anfa, Bourgogne
  p_phone: '0612345678',
  p_whatsapp: '0612345678',
  p_email: null,
  p_description_fr: 'Expert en plomberie',
  p_description_ar: null,
});

// Returns: { success: true, message: '...', profile_id: 'uuid' }
```

#### 2. Check Contact Access
```typescript
const { data } = await supabase.rpc('check_contact_access', {
  p_user_id: user.id,
  p_city_id: 1,
  p_service_category_id: 'category-uuid',
  p_neighborhood_ids: [1, 2], // optional
});

// Returns: { has_access: true, pass_id: 'uuid', expires_at: '2024-...' }
```

#### 3. Purchase Contact Access
```typescript
const { data } = await supabase.rpc('debit_wallet_for_contact', {
  p_city_id: 1,
  p_service_category_id: 'category-uuid',
  p_neighborhood_ids: [1, 2], // optional
});

// Returns: {
//   success: true,
//   message: 'Contact revealed successfully',
//   new_balance: 45,
//   pass_id: 'uuid',
//   expires_at: '2024-...'
// }
```

#### 4. Toggle Boost
```typescript
const { data } = await supabase.rpc('toggle_artisan_boost', {
  p_artisan_profile_id: 'profile-uuid',
  p_enable_boost: true,
});

// Returns: { success: true, message: '...', is_boosted: true }
```

### Frontend Components

#### RevealPhoneButton Usage
```tsx
import RevealPhoneButton from '@/components/monetization/RevealPhoneButton';

<RevealPhoneButton
  phone="0612345678"
  cityId={1}
  serviceCategoryId="category-uuid"
  neighborhoodIds={[1, 2, 3]} // optional
  artisanName="Ahmed"
/>
```

**Behavior:**
- If `monetization_enabled = false` → Shows phone directly
- If `monetization_enabled = true` + no access → Shows "Afficher le numéro (5 MAD)" button
- If user has valid access pass → Shows phone with "Accès actif" badge

#### WalletDisplay Usage
```tsx
import WalletDisplay from '@/components/monetization/WalletDisplay';

// In artisan dashboard
<WalletDisplay />
```

**Fetches:**
- Wallet balance via `get_my_wallet_balance()`
- Recent transactions from `wallet_transactions` table

#### BoostToggle Usage
```tsx
import BoostToggle from '@/components/monetization/BoostToggle';

<BoostToggle
  artisanProfileId={profile.id}
  currentBoostStatus={profile.is_boosted}
  onBoostChange={(isBoosted) => {
    // Update local state
  }}
/>
```

**Requirements:**
- Wallet balance >= `artisan_min_wallet_mad` (default 50 MAD)
- `pay_to_be_visible_enabled = true` in settings
- Only visible when `monetization_enabled = true`

### Platform Settings

#### Load Settings
```typescript
import { getMonetizationSettings } from '@/lib/platformSettings';

const settings = await getMonetizationSettings();
// {
//   monetization_enabled: false,
//   pay_per_contact_enabled: false,
//   pay_to_be_visible_enabled: false,
//   contact_reveal_fee_mad: 5,
//   artisan_min_wallet_mad: 50,
//   contact_pass_duration_hours: 12,
// }
```

#### Check Features
```typescript
import {
  isMonetizationEnabled,
  isPayPerContactEnabled,
  isPayToBeVisibleEnabled,
} from '@/lib/platformSettings';

if (await isPayPerContactEnabled()) {
  // Show reveal phone button
}
```

### Access Pass Scope Logic

```typescript
// City-wide access (no neighborhoods filter)
{
  city_id: 1,
  service_category_id: 'uuid',
  neighborhood_ids: null  // NULL = entire city
}

// Specific neighborhoods
{
  city_id: 1,
  service_category_id: 'uuid',
  neighborhood_ids: [1, 2, 3]  // Only Maarif, Anfa, Bourgogne
}
```

**Matching Rules:**
1. Pass with `neighborhood_ids = NULL` matches ANY request in same city+category
2. Pass with `neighborhood_ids = [1,2,3]` matches requests with overlapping neighborhoods
3. Always requires exact `city_id` + `service_category_id` match

### Artisan Search Query (TODO)

```sql
-- Order by: boosted → neighborhood match → verified → created_at
SELECT *
FROM artisan_profiles
WHERE city_id = $1
  AND service_category_id = $2
  AND is_active = true
  AND is_verified = true
ORDER BY
  is_boosted DESC,
  CASE
    WHEN $3::INTEGER[] IS NOT NULL
      THEN (neighborhood_ids && $3::INTEGER[])::INTEGER
    ELSE 0
  END DESC,
  is_verified DESC,
  created_at DESC;
```

### Security Checklist

- [ ] RLS enabled on all tables
- [ ] Artisans cannot self-verify (`is_verified` protected)
- [ ] Wallet balance cannot go negative (CHECK constraint)
- [ ] All wallet operations via RPC only (no direct INSERT/UPDATE)
- [ ] Admin-only access to settings
- [ ] FOR UPDATE lock on wallet during transactions
- [ ] Neighborhood validation (must belong to selected city)

### Testing Scenarios

1. **Monetization OFF:**
   - [ ] Phones visible without payment
   - [ ] No wallet UI shown
   - [ ] No boost UI shown
   - [ ] No payment buttons

2. **Monetization ON:**
   - [ ] Reveal phone button appears
   - [ ] Wallet displayed in dashboard
   - [ ] Boost toggle visible (if enabled + min balance met)
   - [ ] Access pass created after payment
   - [ ] Pass expires after 12h

3. **RLS Policies:**
   - [ ] Public cannot see unverified profiles
   - [ ] Artisan can see own unverified profile
   - [ ] Artisan cannot change `is_verified`
   - [ ] Admin can verify profiles

4. **Edge Cases:**
   - [ ] Insufficient wallet balance → Error message
   - [ ] Duplicate profile creation → Prevented
   - [ ] Neighborhoods from different city → Rejected
   - [ ] Concurrent wallet debit → Handled atomically

### Common Issues

**Problem:** Phone not revealed after payment
**Solution:** Check if access pass was created with correct scope

**Problem:** Boost toggle disabled
**Solution:** Check wallet balance >= `artisan_min_wallet_mad`

**Problem:** Artisan profile not visible
**Solution:** Admin must set `is_verified = true`

**Problem:** Neighborhood selector empty
**Solution:** Check `city_id` is selected first (neighborhoods filtered by city)

### API Response Examples

#### Success - Create Profile
```json
{
  "success": true,
  "message": "Artisan profile created successfully",
  "profile_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Error - Insufficient Balance
```json
{
  "success": false,
  "message": "Insufficient balance: 3 MAD (need 5 MAD)",
  "new_balance": 3,
  "pass_id": null
}
```

#### Success - Access Pass
```json
{
  "success": true,
  "message": "Contact revealed successfully",
  "new_balance": 45,
  "pass_id": "660e8400-e29b-41d4-a716-446655440000",
  "expires_at": "2024-02-11T15:30:00Z"
}
```

### Migration Safety

✅ **Safe Operations:**
- `ALTER TABLE ADD COLUMN` (with DEFAULT)
- `CREATE OR REPLACE FUNCTION`
- `CREATE INDEX IF NOT EXISTS`
- `UPDATE` for data migration

❌ **Unsafe Operations (avoid):**
- `DROP TABLE`
- `DROP COLUMN` (without backup)
- `ALTER COLUMN DROP NOT NULL` on critical fields
- Direct `DELETE` on production data

### Environment Variables

No special env vars needed. All configuration in `platform_settings` table.

### Database Indexes

```sql
-- Artisan Profiles
CREATE INDEX idx_artisan_profiles_city_id ON artisan_profiles(city_id);
CREATE INDEX idx_artisan_profiles_service_category ON artisan_profiles(service_category_id);
CREATE INDEX idx_artisan_profiles_search 
  ON artisan_profiles(city_id, service_category_id, is_boosted, is_verified, is_active);

-- Contact Access Passes
CREATE INDEX idx_contact_passes_lookup 
  ON contact_access_passes(user_id, city_id, service_category_id, expires_at)
  WHERE expires_at > NOW();
```

### Performance Considerations

- Settings cached for 60s to reduce DB calls
- Access pass check uses composite index
- Wallet operations use row-level locks (FOR UPDATE)
- Expired passes automatically excluded via indexed WHERE clause

---

**Last Updated:** 2024-02-11  
**Migration:** 091_fix_artisan_location_model.sql  
**Status:** ✅ Production Ready
