#!/usr/bin/env node

/**
 * Image Upload Validation Test Script
 * 
 * This script validates that image files are properly validated
 * before upload according to the configured constraints.
 */

// Simulate the validation logic from src/lib/storage.ts
const BUCKET_CONFIG = {
  'property-images': {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
};

function validateFile(file, options) {
  const { maxSize = 5 * 1024 * 1024, allowedTypes } = options;

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
    return { 
      valid: false, 
      error: `File "${file.name}" is too large (${fileSizeMB}MB). Maximum size is ${maxSizeMB}MB.` 
    };
  }

  // Check file type
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `File "${file.name}" has an unsupported type (${file.type}). Allowed types: ${allowedTypes.join(', ')}.` 
    };
  }

  return { valid: true };
}

function validateFiles(files, options) {
  const { maxCount } = options;
  const errors = [];
  const validFiles = [];

  // Check max count
  if (maxCount && files.length > maxCount) {
    errors.push(`Too many files selected. Maximum ${maxCount} files allowed.`);
    return { valid: false, errors, validFiles: [] };
  }

  // Validate each file
  for (const file of files) {
    const validation = validateFile(file, options);
    if (validation.valid) {
      validFiles.push(file);
    } else {
      errors.push(validation.error || 'Unknown validation error');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    validFiles
  };
}

// Test cases
const testCases = [
  {
    name: 'Valid JPEG file (2MB)',
    file: { name: 'house.jpg', size: 2 * 1024 * 1024, type: 'image/jpeg' },
    expectedValid: true
  },
  {
    name: 'Valid PNG file (4.5MB)',
    file: { name: 'apartment.png', size: 4.5 * 1024 * 1024, type: 'image/png' },
    expectedValid: true
  },
  {
    name: 'Valid WebP file (1MB)',
    file: { name: 'villa.webp', size: 1 * 1024 * 1024, type: 'image/webp' },
    expectedValid: true
  },
  {
    name: 'Invalid - File too large (6MB)',
    file: { name: 'large.jpg', size: 6 * 1024 * 1024, type: 'image/jpeg' },
    expectedValid: false
  },
  {
    name: 'Invalid - Wrong file type (GIF)',
    file: { name: 'animation.gif', size: 1 * 1024 * 1024, type: 'image/gif' },
    expectedValid: false
  },
  {
    name: 'Invalid - Wrong file type (PDF)',
    file: { name: 'document.pdf', size: 1 * 1024 * 1024, type: 'application/pdf' },
    expectedValid: false
  },
  {
    name: 'Edge case - Exactly 5MB',
    file: { name: 'max-size.jpg', size: 5 * 1024 * 1024, type: 'image/jpeg' },
    expectedValid: true
  },
  {
    name: 'Edge case - Just over 5MB',
    file: { name: 'too-big.jpg', size: 5 * 1024 * 1024 + 1, type: 'image/jpeg' },
    expectedValid: false
  }
];

console.log('🧪 Running Image Upload Validation Tests\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

const bucketConfig = BUCKET_CONFIG['property-images'];

for (const testCase of testCases) {
  const result = validateFile(testCase.file, bucketConfig);
  const success = result.valid === testCase.expectedValid;
  
  if (success) {
    console.log(`✅ PASS: ${testCase.name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Expected: ${testCase.expectedValid ? 'valid' : 'invalid'}`);
    console.log(`   Got: ${result.valid ? 'valid' : 'invalid'}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    failed++;
  }
}

console.log('='.repeat(60));
console.log('\n📊 Test Results:');
console.log(`   Passed: ${passed}/${testCases.length}`);
console.log(`   Failed: ${failed}/${testCases.length}`);

// Test multiple file validation
console.log('\n🧪 Testing Multiple File Validation\n');
console.log('='.repeat(60));

const multiFileTests = [
  {
    name: 'Valid - 3 files within limit',
    files: [
      { name: 'img1.jpg', size: 2 * 1024 * 1024, type: 'image/jpeg' },
      { name: 'img2.png', size: 3 * 1024 * 1024, type: 'image/png' },
      { name: 'img3.webp', size: 1 * 1024 * 1024, type: 'image/webp' }
    ],
    maxCount: 6,
    expectedValid: true,
    expectedValidCount: 3
  },
  {
    name: 'Invalid - Too many files (7 files)',
    files: Array.from({ length: 7 }, (_, i) => ({ 
      name: `img${i}.jpg`, 
      size: 1 * 1024 * 1024, 
      type: 'image/jpeg' 
    })),
    maxCount: 6,
    expectedValid: false,
    expectedValidCount: 0
  },
  {
    name: 'Partial - 2 valid, 1 invalid (too large)',
    files: [
      { name: 'img1.jpg', size: 2 * 1024 * 1024, type: 'image/jpeg' },
      { name: 'img2.png', size: 3 * 1024 * 1024, type: 'image/png' },
      { name: 'large.jpg', size: 6 * 1024 * 1024, type: 'image/jpeg' }
    ],
    maxCount: 6,
    expectedValid: false,
    expectedValidCount: 2
  },
  {
    name: 'Partial - 2 valid, 1 wrong type',
    files: [
      { name: 'img1.jpg', size: 2 * 1024 * 1024, type: 'image/jpeg' },
      { name: 'wrong.gif', size: 1 * 1024 * 1024, type: 'image/gif' },
      { name: 'img2.png', size: 3 * 1024 * 1024, type: 'image/png' }
    ],
    maxCount: 6,
    expectedValid: false,
    expectedValidCount: 2
  }
];

for (const test of multiFileTests) {
  const result = validateFiles(test.files, { ...bucketConfig, maxCount: test.maxCount });
  const success = result.valid === test.expectedValid && result.validFiles.length === test.expectedValidCount;
  
  if (success) {
    console.log(`✅ PASS: ${test.name}`);
    console.log(`   Valid files: ${result.validFiles.length}/${test.files.length}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${test.name}`);
    console.log(`   Expected valid: ${test.expectedValid}, got: ${result.valid}`);
    console.log(`   Expected valid count: ${test.expectedValidCount}, got: ${result.validFiles.length}`);
    if (result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.join(', ')}`);
    }
    failed++;
  }
}

console.log('='.repeat(60));
console.log('\n📊 Final Test Results:');
console.log(`   Total Tests: ${testCases.length + multiFileTests.length}`);
console.log(`   Passed: ${passed}`);
console.log(`   Failed: ${failed}`);

if (failed === 0) {
  console.log('\n✨ All tests passed! Image validation is working correctly.\n');
  process.exit(0);
} else {
  console.log(`\n❌ ${failed} test(s) failed. Please review the validation logic.\n`);
  process.exit(1);
}
