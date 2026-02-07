/**
 * Phone Validation Test with libphonenumber-js
 * 
 * Tests the new normalizePhone, isValidPhone, and getPhoneError functions
 * that use libphonenumber-js for robust phone number validation.
 * 
 * Run with: npx tsx src/tests/phone-validation-libphonenumber.test.ts
 */

import { normalizePhone, isValidPhone, getPhoneError } from '../lib/phoneValidation';

interface TestCase {
  phone: string;
  shouldBeValid: boolean;
  description: string;
  expectedNormalized?: string;
}

const testCases: TestCase[] = [
  // Problem statement examples - specific numbers mentioned in requirements
  { 
    phone: '+212664352280', 
    shouldBeValid: true, 
    description: 'Problem statement example: Morocco +212664352280',
    expectedNormalized: '+212664352280'
  },
  { 
    phone: '0664352280', 
    shouldBeValid: true, 
    description: 'Problem statement example: Moroccan local 06',
    expectedNormalized: '+212664352280'
  },
  { 
    phone: '0764352280', 
    shouldBeValid: true, 
    description: 'Problem statement example: Moroccan local 07',
    expectedNormalized: '+212764352280'
  },
  { 
    phone: '+212764352280', 
    shouldBeValid: true, 
    description: 'Problem statement example: Morocco international +2127',
    expectedNormalized: '+212764352280'
  },
  { 
    phone: '+33664352280', 
    shouldBeValid: true, 
    description: 'Problem statement example: French number',
    expectedNormalized: '+33664352280'
  },
  { 
    phone: '+33 6 64 35 22 80', 
    shouldBeValid: true, 
    description: 'Problem statement example: French number with spaces',
    expectedNormalized: '+33664352280'
  },
  
  // Moroccan numbers (backward compatibility + local format support)
  { 
    phone: '+212664228976', 
    shouldBeValid: true, 
    description: 'Moroccan mobile number (international)',
    expectedNormalized: '+212664228976'
  },
  { 
    phone: '+212 664 22 89 76', 
    shouldBeValid: true, 
    description: 'Moroccan mobile with spaces (international)',
    expectedNormalized: '+212664228976'
  },
  { 
    phone: '0664228976', 
    shouldBeValid: true, 
    description: 'Moroccan local format 06 (auto-converted to +2126...)',
    expectedNormalized: '+212664228976'
  },
  { 
    phone: '0764228976', 
    shouldBeValid: true, 
    description: 'Moroccan local format 07 (auto-converted to +2127...)',
    expectedNormalized: '+212764228976'
  },
  { 
    phone: '06 64 22 89 76', 
    shouldBeValid: true, 
    description: 'Moroccan local with spaces (auto-converted)',
    expectedNormalized: '+212664228976'
  },
  { 
    phone: '07 64 22 89 76', 
    shouldBeValid: true, 
    description: 'Moroccan local 07 with spaces',
    expectedNormalized: '+212764228976'
  },
  
  // 00-prefix formats (requirement: convert 00... to +...)
  { 
    phone: '00212664352280', 
    shouldBeValid: true, 
    description: '00212 prefix -> +212 (Morocco)',
    expectedNormalized: '+212664352280'
  },
  { 
    phone: '0033664352280', 
    shouldBeValid: true, 
    description: '0033 prefix -> +33 (France)',
    expectedNormalized: '+33664352280'
  },
  { 
    phone: '00212 664 35 22 80', 
    shouldBeValid: true, 
    description: '00212 with spaces',
    expectedNormalized: '+212664352280'
  },
  { 
    phone: '0033 6 64 35 22 80', 
    shouldBeValid: true, 
    description: '0033 with spaces',
    expectedNormalized: '+33664352280'
  },
  { 
    phone: '0044 791 112 3456', 
    shouldBeValid: true, 
    description: '0044 prefix -> +44 (UK)',
    expectedNormalized: '+447911123456'
  },
  
  // Numbers with dashes and parentheses (requirement: strip them)
  { 
    phone: '+212-664-352-280', 
    shouldBeValid: true, 
    description: 'Morocco number with dashes',
    expectedNormalized: '+212664352280'
  },
  { 
    phone: '+33 (6) 64-35-22-80', 
    shouldBeValid: true, 
    description: 'France number with parentheses and dashes',
    expectedNormalized: '+33664352280'
  },
  { 
    phone: '06-64-35-22-80', 
    shouldBeValid: true, 
    description: 'Morocco local with dashes',
    expectedNormalized: '+212664352280'
  },
  
  // French numbers
  { 
    phone: '+33123456789', 
    shouldBeValid: true, 
    description: 'French number',
    expectedNormalized: '+33123456789'
  },
  { 
    phone: '+33 6 12 34 56 78', 
    shouldBeValid: true, 
    description: 'French number with spaces',
    expectedNormalized: '+33612345678'
  },
  
  // UK numbers
  { 
    phone: '+447911123456', 
    shouldBeValid: true, 
    description: 'UK mobile number',
    expectedNormalized: '+447911123456'
  },
  
  // US numbers
  { 
    phone: '+14155552671', 
    shouldBeValid: true, 
    description: 'US number',
    expectedNormalized: '+14155552671'
  },
  
  // Edge cases - invalid
  { phone: '+123456', shouldBeValid: false, description: 'Too short' },
  { phone: '', shouldBeValid: true, description: 'Empty string (optional field)' },
  { phone: 'abc', shouldBeValid: false, description: 'Non-numeric' },
  { phone: '+abc123', shouldBeValid: false, description: 'Mixed letters and numbers' },
  { phone: '1234567890', shouldBeValid: false, description: 'US number without country code and not Morocco format' },
];

/**
 * Test phone validation function
 */
function testPhoneValidation() {
  console.log('\n🧪 Test: libphonenumber-js Phone Validation');
  console.log('═══════════════════════════════════════════════════\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const result = isValidPhone(testCase.phone);
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
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    if (!testCase.expectedNormalized) continue; // Skip tests without expected normalized value
    
    const result = normalizePhone(testCase.phone);
    const isCorrect = result === testCase.expectedNormalized;
    
    if (isCorrect) {
      console.log(`✅ PASS: "${testCase.phone}" → "${result}"`);
      passed++;
    } else {
      console.error(`❌ FAIL: "${testCase.phone}"`);
      console.error(`   Expected: "${testCase.expectedNormalized}"`);
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
    { phone: '+123456', isRTL: false, shouldHaveError: true },
    { phone: 'abc', isRTL: false, shouldHaveError: true },
    { phone: '', isRTL: false, shouldHaveError: false }, // Empty is valid
    { phone: '+212664352280', isRTL: false, shouldHaveError: false }, // Valid number
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of errorTests) {
    const errorMsg = getPhoneError(test.phone, test.isRTL);
    const hasError = errorMsg !== '';
    
    if (hasError === test.shouldHaveError) {
      if (hasError) {
        console.log(`✅ PASS: Error message for "${test.phone}" → "${errorMsg}"`);
      } else {
        console.log(`✅ PASS: No error for "${test.phone}"`);
      }
      passed++;
    } else {
      console.error(`❌ FAIL: Error message for "${test.phone}"`);
      console.error(`   Should have error: ${test.shouldHaveError}`);
      console.error(`   Got: "${errorMsg}"`);
      failed++;
    }
  }
  
  return { passed, failed };
}

/**
 * Test WhatsApp same as phone scenario
 */
function testWhatsAppSameAsPhone() {
  console.log('\n🧪 Test: WhatsApp Same As Phone Scenario');
  console.log('═══════════════════════════════════════════════════\n');
  
  let passed = 0;
  let failed = 0;
  
  // Scenario: User enters phone, checks "WhatsApp same as phone"
  const phone = '+212664352280';
  const whatsapp = phone; // Same as phone
  
  const phoneValid = isValidPhone(phone);
  const whatsappValid = isValidPhone(whatsapp);
  const phoneNormalized = normalizePhone(phone);
  const whatsappNormalized = normalizePhone(whatsapp);
  
  console.log(`Phone: "${phone}" → Valid: ${phoneValid}, Normalized: "${phoneNormalized}"`);
  console.log(`WhatsApp: "${whatsapp}" → Valid: ${whatsappValid}, Normalized: "${whatsappNormalized}"`);
  
  if (phoneValid && whatsappValid && phoneNormalized === whatsappNormalized) {
    console.log('✅ PASS: WhatsApp same as phone works correctly');
    passed++;
  } else {
    console.error('❌ FAIL: WhatsApp same as phone failed validation');
    failed++;
  }
  
  return { passed, failed };
}

/**
 * Main test runner
 */
function runTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('📞 libphonenumber-js Phone Validation Test Suite');
  console.log('Testing: normalizePhone, isValidPhone, getPhoneError');
  console.log('═══════════════════════════════════════════════════');
  
  const validationResults = testPhoneValidation();
  const normalizationResults = testNormalization();
  const errorMessageResults = testErrorMessages();
  const whatsappSameResults = testWhatsAppSameAsPhone();
  
  const totalPassed = validationResults.passed + normalizationResults.passed + errorMessageResults.passed + whatsappSameResults.passed;
  const totalFailed = validationResults.failed + normalizationResults.failed + errorMessageResults.failed + whatsappSameResults.failed;
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
    console.log('Phone validation with libphonenumber-js is working correctly.');
    console.log('Supports: Morocco (+212), France (+33), UK (+44), US (+1), and more!');
    process.exit(0);
  } else {
    console.log('\n❌ SOME TESTS FAILED!');
    console.log('Please review the failed test cases above.');
    process.exit(1);
  }
}

// Run tests
runTests();
