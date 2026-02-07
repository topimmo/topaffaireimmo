import { normalizePhone, isValidPhone } from '../lib/phoneValidation';

const tests = [
  { input: '00212664352280', expected: '+212664352280', desc: '00212 prefix -> +212' },
  { input: '0033664352280', expected: '+33664352280', desc: '0033 prefix -> +33' },
  { input: '00212 664 35 22 80', expected: '+212664352280', desc: '00212 with spaces' },
  { input: '0033 6 64 35 22 80', expected: '+33664352280', desc: '0033 with spaces' },
];

console.log('Testing 00 prefix handling:\n');
for (const test of tests) {
  const result = normalizePhone(test.input);
  const valid = isValidPhone(test.input);
  console.log(`Input: "${test.input}"`);
  console.log(`Expected: "${test.expected}"`);
  console.log(`Got: "${result}"`);
  console.log(`Valid: ${valid}`);
  console.log(`Match: ${result === test.expected ? '✅' : '❌'}\n`);
}
