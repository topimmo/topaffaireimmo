/**
 * International Phone Validation Test
 * 
 * This test validates that the phone validation accepts:
 * - International phone numbers (e.g., +33, +356, etc.)
 * - Moroccan numbers (backward compatibility)
 * - Proper format validation
 * 
 * Run with: npx tsx src/tests/phone-validation.test.ts
 */

import { validateE164Phone, normalizePhoneNumber, getPhoneValidationError } from '../lib/utils';

interface TestCase {
  phone: string;
  shouldBeValid: boolean;
  description: string;
}

const testCases: TestCase[] = [
  // Moroccan numbers (backward compatibility + local format support)
  { phone: '+212664228976', shouldBeValid: true, description: 'Moroccan mobile number (international)' },
  { phone: '+212 664 22 89 76', shouldBeValid: true, description: 'Moroccan mobile with spaces (international)' },
  { phone: '0664228976', shouldBeValid: true, description: 'Moroccan local format 06 (auto-converted to +2126...)' },
  { phone: '0764228976', shouldBeValid: true, description: 'Moroccan local format 07 (auto-converted to +2127...)' },
  { phone: '0564228976', shouldBeValid: true, description: 'Moroccan local format 05 (auto-converted to +2125...)' },
  { phone: '06 64 22 89 76', shouldBeValid: true, description: 'Moroccan local with spaces (auto-converted)' },
  { phone: '0464228976', shouldBeValid: false, description: 'Moroccan local format 04 (invalid - not mobile)' },
  { phone: '+212 5XX XX XX XX', shouldBeValid: false, description: 'Moroccan with placeholder X' },
  
  // French numbers
  { phone: '+33123456789', shouldBeValid: true, description: 'French number' },
  { phone: '+33 6 12 34 56 78', shouldBeValid: true, description: 'French number with spaces' },
  
  // Malta numbers
  { phone: '+35621234567', shouldBeValid: true, description: 'Malta number' },
  { phone: '+356 2123 4567', shouldBeValid: true, description: 'Malta number with spaces' },
  
  // US numbers
  { phone: '+14155552671', shouldBeValid: true, description: 'US number' },
  { phone: '+1 415 555 2671', shouldBeValid: true, description: 'US number with spaces' },
  
  // UK numbers
  { phone: '+447911123456', shouldBeValid: true, description: 'UK mobile number' },
  
  // Real-world short international numbers
  { phone: '+3562123456', shouldBeValid: true, description: 'Malta landline (11 digits total)' },
  
  // Edge cases - valid (testing regex boundaries, not real-world phone validity)
  // Note: These test the regex validation (7-15 digits), not whether the number is 
  // a real, dialable phone number in any specific country
  { phone: '+1234567', shouldBeValid: true, description: 'Minimum length (7 digits) - regex boundary test' },
  { phone: '+123456789012345', shouldBeValid: true, description: 'Maximum length (15 digits) - regex boundary test' },
  
  // Edge cases - invalid
  { phone: '+123456', shouldBeValid: false, description: 'Too short (6 digits)' },
  { phone: '+1234567890123456', shouldBeValid: false, description: 'Too long (16 digits)' },
  { phone: '+0123456789', shouldBeValid: false, description: 'Leading zero after + (invalid per E.164)' },
  { phone: '+012345678', shouldBeValid: false, description: 'Country code starts with 0 (invalid)' },
  // Testing auto-normalization (adds + if missing)
  // Note: These numbers will have + added, then checked for validity
  { phone: '212664228976', shouldBeValid: true, description: 'Morocco number without + (auto-added by normalization)' },
  { phone: '33612345678', shouldBeValid: true, description: 'France number without + (auto-added)' },
  { phone: '+212-664-228-976', shouldBeValid: true, description: 'With dashes (should normalize)' },
  { phone: '+212 (664) 228 976', shouldBeValid: true, description: 'With parentheses (should normalize)' },
  { phone: '', shouldBeValid: true, description: 'Empty string (optional field)' },
  { phone: '+', shouldBeValid: false, description: 'Just plus sign' },
  { phone: 'abc', shouldBeValid: false, description: 'Non-numeric' },
  { phone: '+abc123', shouldBeValid: false, description: 'Mixed letters and numbers' },
];

/**
 * Test phone validation function
 */
function testPhoneValidation() {
  console.log('\n🧪 Test: International Phone Validation');
  console.log('═══════════════════════════════════════════════════\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const result = validateE164Phone(testCase.phone);
    const isCorrect = result === testCase.shouldBeValid;
    
    if (isCorrect) {
      console.log(`✅ PASS: ${testCase.description}`);
      console.log(`   Input: "${testCase.phone}" → ${result ? 'Valid' : 'Invalid'}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testCase.description}`);
      console.error(`   Input: "${testCase.phone}"`);
      console.error(`   Expected: ${testCase.shouldBeValid ? 'Valid' : 'Invalid'}`);
      console.error(`   Got: ${result ? 'Valid' : 'Invalid'}`);
      failed++;
    }
  }
  
  return { passed, failed };
}

/**
 * Test normalization function
 */
function testNormalization() {
  console.log('\n🧪 Test: Phone Number Normalization');
  console.log('═══════════════════════════════════════════════════\n');
  
  const normalizationTests = [
    { input: '+212 664 22 89 76', expected: '+212664228976' },
    { input: '+212-664-228-976', expected: '+212664228976' },
    { input: '+212 (664) 228 976', expected: '+212664228976' },
    { input: '212664228976', expected: '+212664228976' },
    { input: '+33 6 12 34 56 78', expected: '+33612345678' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of normalizationTests) {
    const result = normalizePhoneNumber(test.input);
    const isCorrect = result === test.expected;
    
    if (isCorrect) {
      console.log(`✅ PASS: "${test.input}" → "${result}"`);
      passed++;
    } else {
      console.error(`❌ FAIL: "${test.input}"`);
      console.error(`   Expected: "${test.expected}"`);
      console.error(`   Got: "${result}"`);
      failed++;
    }
  }
  
  return { passed, failed };
}

/**
 * Test error message generation
 */
function testErrorMessages() {
  console.log('\n🧪 Test: Error Message Generation');
  console.log('═══════════════════════════════════════════════════\n');
  
  const errorTests = [
    { phone: '+0123456789', isRTL: false, shouldContain: 'code pays ne peut pas commencer par 0' },
    { phone: '+123', isRTL: false, shouldContain: 'trop court' },
    { phone: '+12345678901234567', isRTL: false, shouldContain: 'trop long' },
    { phone: '+212abc', isRTL: false, shouldContain: 'trop court' }, // becomes "+212" after normalization, which is too short
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of errorTests) {
    const errorMsg = getPhoneValidationError(test.phone, test.isRTL);
    const containsExpected = errorMsg.toLowerCase().includes(test.shouldContain.toLowerCase());
    
    if (containsExpected && errorMsg !== '') {
      console.log(`✅ PASS: Error message for "${test.phone}" contains "${test.shouldContain}"`);
      passed++;
    } else if (errorMsg === '' && test.shouldContain === '') {
      console.log(`✅ PASS: No error for valid phone "${test.phone}"`);
      passed++;
    } else {
      console.error(`❌ FAIL: Error message for "${test.phone}"`);
      console.error(`   Should contain: "${test.shouldContain}"`);
      console.error(`   Got: "${errorMsg}"`);
      failed++;
    }
  }
  
  return { passed, failed };
}

/**
 * Main test runner
 */
function runTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('📞 International Phone Validation Test Suite');
  console.log('Testing: Regex /^\\+[1-9]\\d{6,14}$/ and helper functions');
  console.log('═══════════════════════════════════════════════════');
  
  const validationResults = testPhoneValidation();
  const normalizationResults = testNormalization();
  const errorMessageResults = testErrorMessages();
  
  const totalPassed = validationResults.passed + normalizationResults.passed + errorMessageResults.passed;
  const totalFailed = validationResults.failed + normalizationResults.failed + errorMessageResults.failed;
  const totalTests = totalPassed + totalFailed;
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('📊 Test Results Summary');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
  
  if (totalFailed === 0) {
    console.log('\n✅ ALL TESTS PASSED!');
    console.log('International phone validation is working correctly.');
    console.log('Supports: Morocco (+212), France (+33), Malta (+356), US (+1), UK (+44), and more!');
    process.exit(0);
  } else {
    console.log('\n❌ SOME TESTS FAILED!');
    console.log('Please review the failed test cases above.');
    process.exit(1);
  }
}

// Run tests
runTests();
