/**
 * Minimal tests for isValidUuid helper
 * Run with: npx tsx src/tests/is-valid-uuid.test.ts
 */

import { isValidUuid } from '../lib/utils';

type TestCase = {
  value: unknown;
  expected: boolean;
  description: string;
};

const testCases: TestCase[] = [
  { value: '550e8400-e29b-41d4-a716-446655440000', expected: true, description: 'Valid UUID string passes' },
  { value: null, expected: false, description: 'Null fails' },
  { value: undefined, expected: false, description: 'Undefined fails' },
  { value: 'null', expected: false, description: '"null" string fails' },
  { value: 'undefined', expected: false, description: '"undefined" string fails' },
  { value: '', expected: false, description: 'Empty string fails' },
  { value: 'not-a-uuid', expected: false, description: 'Random string fails' },
];

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  const result = isValidUuid(testCase.value);
  if (result === testCase.expected) {
    console.log(`✅ PASS: ${testCase.description}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testCase.description}`);
    console.error(`   Expected ${testCase.expected} but got ${result} for value:`, testCase.value);
    failed++;
  }
}

console.log(`\nSummary: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
