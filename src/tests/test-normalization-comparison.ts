import { normalizePhone, isValidPhone } from '../lib/phoneValidation';
import { normalizePhoneNumber, validateE164Phone } from '../lib/utils';

const tests = [
  '00212664352280',
  '0033664352280',
  '00212 664 35 22 80',
  '0664352280',
  '+212664352280',
  '06 64 35 22 80',
];

console.log('Comparing normalizePhone (libphonenumber) vs normalizePhoneNumber (utils):\n');
console.log('═'.repeat(80));

for (const test of tests) {
  const libResult = normalizePhone(test);
  const utilsResult = normalizePhoneNumber(test);
  const libValid = isValidPhone(test);
  const utilsValid = validateE164Phone(test);
  
  console.log(`Input: "${test}"`);
  console.log(`  libphonenumber-js: "${libResult}" (valid: ${libValid})`);
  console.log(`  utils regex:       "${utilsResult}" (valid: ${utilsValid})`);
  console.log(`  Match: ${libResult === utilsResult ? '✅' : '❌ MISMATCH'}`);
  console.log('');
}
