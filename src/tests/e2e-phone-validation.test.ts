/**
 * End-to-End Phone Validation Test
 * 
 * This test simulates real user scenarios to verify the complete phone validation flow
 * from user input to normalized E.164 format ready for backend submission.
 * 
 * Run with: npx tsx src/tests/e2e-phone-validation.test.ts
 */

import { normalizePhone, isValidPhone, getPhoneError } from '../lib/phoneValidation';
import { normalizePhoneNumber, validateE164Phone, getPhoneValidationError } from '../lib/utils';

interface E2ETestCase {
  scenario: string;
  input: string;
  expectValid: boolean;
  expectedNormalized: string | null;
  description: string;
}

const e2eTestCases: E2ETestCase[] = [
  // Real-world Moroccan user scenarios
  {
    scenario: 'Moroccan user enters local mobile number',
    input: '0664352280',
    expectValid: true,
    expectedNormalized: '+212664352280',
    description: 'User in Morocco enters phone without country code'
  },
  {
    scenario: 'Moroccan user enters local number with spaces',
    input: '06 64 35 22 80',
    expectValid: true,
    expectedNormalized: '+212664352280',
    description: 'User formats number with spaces for readability'
  },
  {
    scenario: 'Moroccan user enters number with dashes',
    input: '06-64-35-22-80',
    expectValid: true,
    expectedNormalized: '+212664352280',
    description: 'User formats number with dashes'
  },
  {
    scenario: 'Moroccan user enters international format',
    input: '+212 664 35 22 80',
    expectValid: true,
    expectedNormalized: '+212664352280',
    description: 'User enters number in international format with spaces'
  },
  {
    scenario: 'User copies number from WhatsApp (00-prefix)',
    input: '00212664352280',
    expectValid: true,
    expectedNormalized: '+212664352280',
    description: 'User copies number that starts with 00 instead of +'
  },
  
  // French user scenarios
  {
    scenario: 'French user enters international number',
    input: '+33 6 64 35 22 80',
    expectValid: true,
    expectedNormalized: '+33664352280',
    description: 'French user enters number in international format'
  },
  {
    scenario: 'French user enters 00-prefix number',
    input: '0033664352280',
    expectValid: true,
    expectedNormalized: '+33664352280',
    description: 'French user enters number with 00 prefix'
  },
  
  // Invalid scenarios - should fail validation
  {
    scenario: 'User enters incomplete number',
    input: '06643',
    expectValid: false,
    expectedNormalized: null,
    description: 'User enters too few digits'
  },
  {
    scenario: 'User enters only plus sign',
    input: '+',
    expectValid: false,
    expectedNormalized: null,
    description: 'User starts typing but stops'
  },
  
  // WhatsApp same as phone scenarios
  {
    scenario: 'User enables WhatsApp same as phone',
    input: '+212664352280',
    expectValid: true,
    expectedNormalized: '+212664352280',
    description: 'Phone and WhatsApp should have identical normalized values'
  },
];

console.log('\n═══════════════════════════════════════════════════');
console.log('🧪 End-to-End Phone Validation Test');
console.log('Simulating real user scenarios');
console.log('═══════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

for (const testCase of e2eTestCases) {
  console.log(`\n📝 Scenario: ${testCase.scenario}`);
  console.log(`   Input: "${testCase.input}"`);
  console.log(`   ${testCase.description}`);
  
  // Test with libphonenumber-js (used in AddListing)
  const libValid = isValidPhone(testCase.input);
  const libNormalized = normalizePhone(testCase.input);
  
  // Test with utils regex (used in EditListing)
  const utilsNormalized = normalizePhoneNumber(testCase.input);
  const utilsValid = validateE164Phone(testCase.input);
  
  // Check if both implementations agree
  const validationMatch = libValid === utilsValid;
  const normalizationMatch = libNormalized === utilsNormalized || 
                             (libNormalized === null && utilsNormalized === '');
  
  // Check if results match expectations
  const validationCorrect = libValid === testCase.expectValid;
  const normalizationCorrect = libNormalized === testCase.expectedNormalized;
  
  if (validationCorrect && normalizationCorrect && validationMatch) {
    console.log(`   ✅ PASS: Valid: ${libValid}, Normalized: "${libNormalized}"`);
    if (!validationMatch || !normalizationMatch) {
      console.log(`   ⚠️  Warning: Implementations differ`);
      console.log(`      libphonenumber: valid=${libValid}, normalized="${libNormalized}"`);
      console.log(`      utils:          valid=${utilsValid}, normalized="${utilsNormalized}"`);
    }
    passed++;
  } else {
    console.log(`   ❌ FAIL:`);
    console.log(`      Expected: Valid: ${testCase.expectValid}, Normalized: "${testCase.expectedNormalized}"`);
    console.log(`      Got (lib): Valid: ${libValid}, Normalized: "${libNormalized}"`);
    console.log(`      Got (utils): Valid: ${utilsValid}, Normalized: "${utilsNormalized}"`);
    failed++;
  }
  
  // Show error messages for invalid inputs
  if (!libValid && testCase.input.trim()) {
    const errorFr = getPhoneError(testCase.input, false);
    const errorAr = getPhoneError(testCase.input, true);
    console.log(`   📝 Error Messages:`);
    console.log(`      French: "${errorFr}"`);
    console.log(`      Arabic: "${errorAr}"`);
  }
}

console.log('\n═══════════════════════════════════════════════════');
console.log('📊 E2E Test Results');
console.log('═══════════════════════════════════════════════════');
console.log(`Total Scenarios: ${passed + failed}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n✅ ALL E2E TESTS PASSED!');
  console.log('Phone validation is working correctly for all user scenarios.');
  process.exit(0);
} else {
  console.log('\n❌ SOME E2E TESTS FAILED!');
  console.log('Please review the failed scenarios above.');
  process.exit(1);
}
