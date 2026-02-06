# Phone Validation Testing Guide

## Quick Test Commands

### 1. Run Automated Tests
```bash
npx tsx src/tests/phone-validation.test.ts
```

Expected output:
```
Total Tests: 41
✅ Passed: 41
❌ Failed: 0
Success Rate: 100.0%
```

### 2. Build Project
```bash
npm run build
```

Expected output: `✓ built in 8.10s` (no errors)

### 3. Run Development Server
```bash
npm run dev
```

Then navigate to `http://localhost:5173/add-listing`

## Manual Testing Checklist

### Test 1: International Phone Numbers

#### French Number
- **Input**: `+33664352280`
- **Expected**: ✅ Accepted, saved as `+33664352280`
- **Steps**:
  1. Open Add Listing form
  2. Fill required fields
  3. Enter phone: `+33664352280`
  4. Submit
  5. Verify no error message

#### US Number
- **Input**: `+1 415 555 2671` (with spaces)
- **Expected**: ✅ Accepted, normalized to `+14155552671`
- **Steps**: Same as above with this phone number

#### UK Number
- **Input**: `+44 791 112 3456` (with spaces)
- **Expected**: ✅ Accepted, normalized to `+447911123456`
- **Steps**: Same as above with this phone number

### Test 2: Moroccan International Format

#### Moroccan Mobile (International)
- **Input**: `+212 6 64 22 89 76` (with spaces)
- **Expected**: ✅ Accepted, normalized to `+212664228976`
- **Steps**:
  1. Open Add Listing form
  2. Fill required fields
  3. Enter phone: `+212 6 64 22 89 76`
  4. Submit
  5. Verify no error message
  6. Check database: phone should be `+212664228976`

#### Moroccan with Dashes
- **Input**: `+212-664-228-976`
- **Expected**: ✅ Accepted, normalized to `+212664228976`

### Test 3: Moroccan Local Format (NEW FEATURE)

#### Local Format - 06 Prefix
- **Input**: `0664228976`
- **Expected**: ✅ Accepted, auto-converted to `+212664228976`
- **Steps**:
  1. Open Add Listing form
  2. Fill required fields
  3. Enter phone: `0664228976`
  4. Submit
  5. Verify no error message
  6. **IMPORTANT**: Check database - phone should be stored as `+212664228976` (not `0664228976`)

#### Local Format - 07 Prefix
- **Input**: `0764228976`
- **Expected**: ✅ Accepted, auto-converted to `+212764228976`

#### Local Format - 05 Prefix
- **Input**: `0564228976`
- **Expected**: ✅ Accepted, auto-converted to `+212564228976`

#### Local Format with Spaces
- **Input**: `06 64 22 89 76`
- **Expected**: ✅ Accepted, auto-converted to `+212664228976`

### Test 4: Invalid Formats (Should be Rejected)

#### Invalid Moroccan Prefix - 04
- **Input**: `0464228976`
- **Expected**: ❌ Rejected with error message
- **Error**: Should show validation error (not a valid mobile number)

#### Invalid Moroccan Prefix - 08
- **Input**: `0864228976`
- **Expected**: ❌ Rejected with error message

#### Invalid Moroccan Prefix - 09
- **Input**: `0964228976`
- **Expected**: ❌ Rejected with error message

#### Placeholder Characters
- **Input**: `+212 6XX XX XX XX`
- **Expected**: ❌ Rejected with error message
- **Error**: "Le numéro est trop court" or similar

#### Too Short
- **Input**: `+12345`
- **Expected**: ❌ Rejected with error message
- **Error**: "Le numéro est trop court"

#### Too Long
- **Input**: `+12345678901234567` (17 digits)
- **Expected**: ❌ Rejected with error message
- **Error**: "Le numéro est trop long"

### Test 5: WhatsApp Number Field

All the above tests should also work for the WhatsApp number field.

**Example**:
- **Field**: WhatsApp
- **Input**: `0664228976`
- **Expected**: ✅ Accepted, auto-converted to `+212664228976`

### Test 6: Edit Listing Form

Test that the validation works in Edit Listing form as well:

1. Create a listing with phone `+33664352280`
2. Navigate to Edit Listing
3. Change phone to `0664228976` (Moroccan local)
4. Submit
5. Verify phone is updated to `+212664228976` in database

### Test 7: Empty Phone (Optional Field)

- **Input**: (leave phone field empty)
- **Expected**: ✅ Accepted (phone is optional)

## Database Verification

After submitting forms, verify the data in the database:

```sql
-- Check recent listings
SELECT 
  id,
  title_fr,
  contact_phone,
  contact_whatsapp,
  created_at
FROM properties
ORDER BY created_at DESC
LIMIT 5;
```

**Expected**:
- All phone numbers should start with `+`
- Moroccan numbers should be `+212...` (not `06...`)
- No spaces, dashes, or parentheses
- Length: 11-16 characters (including `+`)

## Browser Console Testing

Open browser DevTools console and test the functions directly:

```javascript
// Import the functions (if using dev server)
import { normalizePhoneNumber, validateE164Phone } from './src/lib/utils';

// Test Moroccan local format
console.log(normalizePhoneNumber('0664228976'));
// Expected: "+212664228976"

// Test international format
console.log(normalizePhoneNumber('+33 6 64 35 22 80'));
// Expected: "+33664352280"

// Test validation
console.log(validateE164Phone('0664228976'));
// Expected: true

console.log(validateE164Phone('0464228976'));
// Expected: false
```

## Error Messages

### French (Default)
- Empty with spaces/dashes: "Le numéro doit commencer par + suivi du code pays"
- Country code starts with 0: "Le code pays ne peut pas commencer par 0"
- Too short: "Le numéro est trop court"
- Too long: "Le numéro est trop long"
- Invalid format: "Format invalide. Veuillez entrer un numéro de téléphone au format international (ex: +212...)"

### Arabic (RTL Mode)
- Same messages in Arabic when language is set to Arabic

## Performance Testing

The validation is very fast (< 1ms per validation), so no performance testing is needed.

## Edge Cases Covered

✅ Empty string (optional field)
✅ Spaces in number
✅ Dashes in number
✅ Parentheses in number
✅ Mixed formatting
✅ Moroccan local format (06/07/05)
✅ Invalid Moroccan prefixes (04/08/09)
✅ Minimum length boundary (7 digits)
✅ Maximum length boundary (15 digits)
✅ Leading zero in country code
✅ Non-numeric characters
✅ Mixed letters and numbers

## Regression Testing

Verify that existing functionality still works:

1. ✅ Add Listing form still works
2. ✅ Edit Listing form still works
3. ✅ Phone numbers from before this change still display correctly
4. ✅ WhatsApp links still work
5. ✅ Contact information visibility flags still work

## Accessibility

- ✅ Error messages are clear and user-friendly
- ✅ Supports bilingual error messages (French/Arabic)
- ✅ No breaking changes to form UI
- ✅ Backward compatible with existing data
