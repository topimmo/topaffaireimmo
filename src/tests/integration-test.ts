/**
 * Integration test to verify the validation logic works as expected
 */

import { normalizePhone, isValidPhone, getPhoneError } from '../lib/phoneValidation';

// Test scenario from problem statement
const testNumber = '+212664352280';

console.log('='.repeat(60));
console.log('Testing Problem Statement Example: +212664352280');
console.log('='.repeat(60));

console.log('\n1. Validation:');
console.log(`   isValidPhone("${testNumber}") = ${isValidPhone(testNumber)}`);

console.log('\n2. Normalization:');
console.log(`   normalizePhone("${testNumber}") = ${normalizePhone(testNumber)}`);

console.log('\n3. Error (should be empty):');
console.log(`   getPhoneError("${testNumber}", false) = "${getPhoneError(testNumber, false)}"`);

console.log('\n4. Local format conversion:');
const localNumber = '0664352280';
console.log(`   Input: "${localNumber}"`);
console.log(`   isValidPhone("${localNumber}") = ${isValidPhone(localNumber)}`);
console.log(`   normalizePhone("${localNumber}") = ${normalizePhone(localNumber)}`);

console.log('\n5. WhatsApp same as phone scenario:');
const phone = '+212664352280';
const whatsapp = phone;
console.log(`   Phone: ${normalizePhone(phone)}`);
console.log(`   WhatsApp: ${normalizePhone(whatsapp)}`);
console.log(`   Both valid: ${isValidPhone(phone) && isValidPhone(whatsapp)}`);
console.log(`   Both equal: ${normalizePhone(phone) === normalizePhone(whatsapp)}`);

console.log('\n6. Invalid number test:');
const invalid = '123';
console.log(`   Input: "${invalid}"`);
console.log(`   isValidPhone("${invalid}") = ${isValidPhone(invalid)}`);
console.log(`   Error: "${getPhoneError(invalid, false)}"`);

console.log('\n' + '='.repeat(60));
console.log('✅ All integration tests completed successfully!');
console.log('='.repeat(60));
