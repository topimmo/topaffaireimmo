/**
 * Manual Test Script for Phone Validation
 * 
 * This script demonstrates the phone validation in action.
 * Use this to manually test various phone numbers.
 * 
 * Run with: npx tsx src/tests/manual-phone-test.ts
 */

import { validateE164Phone, normalizePhoneNumber, getPhoneValidationError, formatWhatsAppLink } from '../lib/utils';

console.log('═══════════════════════════════════════════════════');
console.log('📞 Manual Phone Validation Demo');
console.log('═══════════════════════════════════════════════════\n');

const testPhones = [
  '+212664228976',      // Morocco
  '+33612345678',       // France
  '+35621234567',       // Malta
  '+14155552671',       // USA
  '+447911123456',      // UK
  '212664228976',       // Morocco without +
  '+212 664 22 89 76',  // Morocco with spaces
  '+33-6-12-34-56-78',  // France with dashes
];

console.log('Testing International Phone Numbers:\n');

testPhones.forEach((phone) => {
  const normalized = normalizePhoneNumber(phone);
  const isValid = validateE164Phone(phone);
  const errorMsg = getPhoneValidationError(phone, false);
  const whatsappLink = formatWhatsAppLink(phone);
  
  console.log(`Input:      "${phone}"`);
  console.log(`Normalized: "${normalized}"`);
  console.log(`Valid:      ${isValid ? '✅ Yes' : '❌ No'}`);
  if (!isValid && errorMsg) {
    console.log(`Error:      ${errorMsg}`);
  }
  if (isValid) {
    console.log(`WhatsApp:   ${whatsappLink}`);
  }
  console.log('---');
});

console.log('\n═══════════════════════════════════════════════════');
console.log('✅ Demo Complete');
console.log('═══════════════════════════════════════════════════');
